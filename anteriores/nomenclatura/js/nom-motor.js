/* Motor de nomenclatura para compuestos binarios I (Unidad 1 UNEMI).
   Traduce fórmula ↔ nombre en las 3 nomenclaturas (tradicional, stock, sistemática/IUPAC).
   Cubre: hidruros metálicos, hidruros volátiles y haluros de hidrógeno (hidrácidos). */
(function () {
  'use strict';
  const D = window.NOM.datos;

  // ─── Sufijos tradicionales según cantidad de valencias del elemento ──
  // Regla resumida:
  // • 1 valencia: raíz + ico (o "de + nombre" en algunos textos; usamos -ico)
  // • 2 valencias: menor → -oso, mayor → -ico
  // • 3 valencias: hipo…oso, -oso, -ico
  // • 4 valencias: hipo…oso, -oso, -ico, per…ico
  function sufijoTradicional(cantValencias, indiceMenorAMayor) {
    const i = indiceMenorAMayor;
    if (cantValencias === 1) return { pref: '', suf: 'ico' };
    if (cantValencias === 2) return { pref: '', suf: i === 0 ? 'oso' : 'ico' };
    if (cantValencias === 3) return { pref: i === 0 ? 'hipo' : '', suf: i === 2 ? 'ico' : 'oso' };
    if (cantValencias === 4) {
      if (i === 0) return { pref: 'hipo', suf: 'oso' };
      if (i === 1) return { pref: '', suf: 'oso' };
      if (i === 2) return { pref: '', suf: 'ico' };
      if (i === 3) return { pref: 'per', suf: 'ico' };
    }
    return { pref: '', suf: 'ico' };
  }

  // ─── Subíndice bonito con caracteres Unicode (no <sub>) ──────────────
  const SUB_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  function sub(n) {
    if (n === 1) return '';
    return String(n).split('').map(d => SUB_DIGITS[+d]).join('');
  }

  // ─── HIDRUROS METÁLICOS ─── metal + H (H con valencia -1) ────────────
  // Fórmula: XH_n  donde n = valencia del metal.
  function hidruroMetalico(metalObj, valencia) {
    const n = valencia;
    const formula = metalObj.s + 'H' + sub(n);
    // Sistemática (IUPAC): prefijo hidruro de <nombre>
    const sistematica = (D.PREFIJOS_IUPAC[n] || '') + 'hidruro de ' + metalObj.nombre;
    // Stock: hidruro de <nombre> (romano) — solo si valencia > 1 opción
    const esFijo = D.esMetalFijo(metalObj.s);
    const stock = 'hidruro de ' + metalObj.nombre + (esFijo ? '' : ' (' + D.ROMANOS[n] + ')');
    // Tradicional
    const trad = tradicionalHidruroMetalico(metalObj, n);
    return { formula, sistematica, stock, tradicional: trad };
  }
  function tradicionalHidruroMetalico(m, valencia) {
    if (D.esMetalFijo(m.s)) {
      // Los metales de valencia fija usan una sola raíz (la con tilde para -ico).
      return 'hidruro ' + m.raiz + 'ico';
    }
    const idx = m.vs.indexOf(valencia);
    const s = sufijoTradicional(m.vs.length, idx);
    // Escoger la raíz según el sufijo: -oso (grave, sin tilde) o -ico (esdrújula, con tilde).
    const raiz = s.suf === 'oso' ? m.rOso : m.rIco;
    return 'hidruro ' + (s.pref || '') + raiz + s.suf;
  }

  // ─── HIDRUROS VOLÁTILES ─── no metal (grupo 13-15) + H (H con +1) ────
  // Fórmula: XH_n  donde n = |valencia del no metal|.
  // No usa nomenclatura STOCK (por convención de la clase).
  function hidruroVolatil(nmObj) {
    const n = nmObj.valFrenteAH;
    const formula = nmObj.s + 'H' + sub(n);
    const sistematica = (D.PREFIJOS_IUPAC[n] || '') + 'hidruro de ' + nmObj.nombre;
    const tradicional = nmObj.tradPropio;   // nombre propio: amoníaco, metano, silano, etc.
    return { formula, sistematica, tradicional, stock: null };
  }

  // ─── HIDRÁCIDOS (haluros de hidrógeno) ─── H + no metal (16 o 17) ────
  // Fórmula: H_nX  donde n = |valencia del no metal|.  H va PRIMERO.
  // No usa STOCK.
  function hidracido(nmObj) {
    const n = nmObj.valFrenteAH;
    const formula = 'H' + sub(n) + nmObj.s;
    // Sistemática (IUPAC): raíz del no metal + "uro de hidrógeno"
    // Ojo con el "-uro" y raíces especiales: sulfuro, seleniuro, telururo, cloruro, etc.
    const sistematica = raizIUPACuro(nmObj) + ' de hidrógeno';
    // Tradicional: ácido + raíz + hídrico
    const tradicional = 'ácido ' + nmObj.raizTrad + 'hídrico';
    return { formula, sistematica, tradicional, stock: null };
  }
  function raizIUPACuro(nm) {
    // Casos especiales según el sílabo UNEMI
    const especial = { F: 'fluoruro', Cl: 'cloruro', Br: 'bromuro', I: 'yoduro',
                       S: 'sulfuro', Se: 'seleniuro', Te: 'telururo' };
    return especial[nm.s] || (nm.raizIUPAC + 'uro');
  }

  // ─── API pública ────────────────────────────────────────────────────
  window.NOM.motor = {
    sub, sufijoTradicional,
    hidruroMetalico, hidruroVolatil, hidracido,

    // Genera TODOS los compuestos del temario. Cada uno con sus 3 nombres
    // (o 2 si no aplica stock) y su tipo.
    todos() {
      const out = [];
      D.METALES_FIJOS.forEach(m => out.push(Object.assign({ tipo: 'hm', simbolo: m.s, valencia: m.v, elem: m }, hidruroMetalico(m, m.v))));
      D.METALES_VARIABLES.forEach(m => m.vs.forEach(v => out.push(Object.assign({ tipo: 'hm', simbolo: m.s, valencia: v, elem: m }, hidruroMetalico(m, v)))));
      D.NO_METALES_VOLATILES.forEach(nm => out.push(Object.assign({ tipo: 'hv', simbolo: nm.s, valencia: nm.valFrenteAH, elem: nm }, hidruroVolatil(nm))));
      D.NO_METALES_HIDRACIDOS.forEach(nm => out.push(Object.assign({ tipo: 'ha', simbolo: nm.s, valencia: nm.valFrenteAH, elem: nm }, hidracido(nm))));
      return out;
    }
  };
})();
