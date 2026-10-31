/* Envíos a Google Apps Script: cola en localStorage, id único, reintento al volver internet. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  // Pega aquí la URL de la implementación web de quimica-materia-apps-script.gs
  const URL_SCRIPT = '';

  const oyentes = [];
  function id() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }

  // Cada envío lleva la instantánea del seguimiento (dónde va, tiempos, dispositivo) para la hoja Panel.
  function conSeg(tipo, datos) {
    datos = Object.assign({}, datos || {});
    let seg = null;
    try { seg = LS.seguimiento && LS.seguimiento.snapshot ? LS.seguimiento.snapshot() : null; } catch (e) { seg = null; }
    if (!seg) return datos;
    // el resultado oficial se envía justo antes de marcar el test como terminado
    if (tipo === 'resultado' && datos.tipoIntento === 'OFICIAL') {
      seg.testEstado = 'terminado';
      if (datos.nota != null) seg.nota = datos.nota;
      if (datos.nota10 != null) seg.nota10 = datos.nota10;
    }
    datos.seg = seg;
    return datos;
  }
  const esProgreso = (x) => x && x.tipo === 'evento' && x.datos && x.datos.evento === 'progreso';

  function encolar(tipo, datos) {
    if (!URL_SCRIPT) return '';
    datos = conSeg(tipo, datos);
    const item = { id: id(), tipo, fecha: new Date().toISOString(), datos };
    // 'progreso' solo importa el último: si hay uno esperando en la cola (sin internet), se reemplaza
    if (esProgreso(item)) LS.st.colaEnvios = LS.st.colaEnvios.filter((x, i) => !esProgreso(x) || (enCurso && i === 0));
    LS.st.colaEnvios.push(item);
    LS.guardar();
    vaciar();
    return item.id;
  }

  let enCurso = false;
  async function vaciar() {
    if (enCurso || !URL_SCRIPT || !LS.st.colaEnvios.length) { avisar(); return; }
    if (navigator.onLine === false) { avisar(); return; }
    enCurso = true;
    try {
      while (LS.st.colaEnvios.length) {
        const item = LS.st.colaEnvios[0];
        const cuerpo = JSON.stringify(Object.assign({ id: item.id, tipo: item.tipo, fecha: item.fecha, nombre: LS.st.usuario.nombre, correo: LS.st.usuario.correo }, item.datos));
        const r = await fetch(URL_SCRIPT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo, redirect: 'follow' });
        if (!r.ok) throw new Error('http ' + r.status);
        // El script responde HTTP 200 también cuando falla ({status:'busy'|'error'}): solo 'ok' saca el envío de la cola.
        let j = null;
        try { j = await r.json(); } catch (e) { j = null; }
        if (!j || j.status !== 'ok') throw new Error('script: ' + (j && j.status || 'sin respuesta'));
        LS.st.colaEnvios.shift();
        LS.st.enviados.push(item.id);
        if (LS.st.enviados.length > 200) LS.st.enviados = LS.st.enviados.slice(-200);
        LS.guardar();
        avisar(item.id);
      }
      espera = 5000;
    } catch (e) {
      // queda en la cola; se reintenta solo (espera creciente), con 'online' o al recargar
      clearTimeout(reintento);
      reintento = setTimeout(vaciar, espera);
      espera = Math.min(espera * 2, 5 * 60000);
    } finally {
      enCurso = false;
      avisar();
    }
  }
  let reintento = null, espera = 5000;

  function estado(idItem) {
    if (!URL_SCRIPT) return 'sin-configurar';
    if (idItem && LS.st.enviados.indexOf(idItem) >= 0) return 'enviado';
    if (enCurso) return 'enviando';
    if (idItem && LS.st.colaEnvios.some(x => x.id === idItem)) return 'pendiente';
    return idItem ? 'enviado' : 'ok';
  }
  function avisar(idItem) { oyentes.forEach(fn => { try { fn(idItem); } catch (e) { } }); }
  function alCambiar(fn) { oyentes.push(fn); return () => { const i = oyentes.indexOf(fn); if (i >= 0) oyentes.splice(i, 1); }; }

  // Eventos ligeros: fin de capítulo, fin de nivel (para ver dónde abandonan)
  function evento(que, datos) { return encolar('evento', Object.assign({ evento: que }, datos || {})); }
  // Resultado final del test (dispara correo + PDF)
  function resultado(datos) { return encolar('resultado', datos); }

  window.addEventListener('online', vaciar);
  document.addEventListener('DOMContentLoaded', () => setTimeout(vaciar, 1500));

  LS.envio = { evento, resultado, vaciar, estado, alCambiar, configurado: () => !!URL_SCRIPT, url: () => URL_SCRIPT };
})();
