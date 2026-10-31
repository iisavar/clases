(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const CLAVE = 'lds_v1';

  function base() {
    return {
      v: 1,
      usuario: { nombre: '', correo: '' },
      laminas: { actual: 0, maxAlcanzada: 0, respuestas: {}, gancho: null, completadas: false, capsCerrados: [] },
      juego: {},
      test: {},
      colaEnvios: [],
      enviados: [],
      ajustes: { tema: null, sonido: false, menosAnimaciones: false },
      creado: new Date().toISOString()
    };
  }

  function mezclar(def, obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return def;
    const out = Object.assign({}, def);
    Object.keys(obj).forEach(k => {
      const d = def[k];
      out[k] = (d && typeof d === 'object' && !Array.isArray(d)) ? mezclar(d, obj[k]) : obj[k];
    });
    return out;
  }

  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) return mezclar(base(), JSON.parse(raw));
    } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
    return base();
  }

  LS.st = cargar();

  LS.guardar = function () {
    try { localStorage.setItem(CLAVE, JSON.stringify(LS.st)); } catch (e) { /* memoria */ }
  };

  LS.borrarTodo = function () {
    try { localStorage.removeItem(CLAVE); } catch (e) { }
    LS.st = base();
  };

  LS.nombre = function () {
    const n = (LS.st.usuario.nombre || '').trim().split(/\s+/)[0] || '';
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'amigo';
  };

  LS.hoy = function () {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  LS.aplicarAjustes = function () {
    const a = LS.st.ajustes, h = document.documentElement;
    if (a.tema === 'light' || a.tema === 'dark') h.setAttribute('data-theme', a.tema);
    else h.removeAttribute('data-theme');
    const reducir = a.menosAnimaciones ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (reducir) h.setAttribute('data-motion', 'reduce'); else h.removeAttribute('data-motion');
  };

  LS.menosMovimiento = function () {
    return document.documentElement.getAttribute('data-motion') === 'reduce';
  };

  LS.setColor = function (modo) {
    document.documentElement.setAttribute('data-color', modo || 'full');
  };

  LS.aplicarAjustes();
})();
