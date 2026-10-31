/* Datos de nomenclatura inorgánica — Test 1 UNEMI (Unidad 1: compuestos binarios I)
   Basado en sílabo de la M.Sc. Mónica Villamar (Química, Admisión UNEMI). */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────
  // METALES DE VALENCIA FIJA
  // Cada uno viene con: símbolo, nombre castellano (para stock), raíz para
  // nomenclatura tradicional (…-ico), y valencia positiva única.
  // ─────────────────────────────────────────────────────────────────────
  const METALES_FIJOS = [
    // +1 (alcalinos + Ag + amonio)
    { s: 'Li', nombre: 'litio', raiz: 'lít', v: 1 },
    { s: 'Na', nombre: 'sodio', raiz: 'sód', v: 1 },
    { s: 'K',  nombre: 'potasio', raiz: 'potás', v: 1 },
    { s: 'Rb', nombre: 'rubidio', raiz: 'rubíd', v: 1 },
    { s: 'Cs', nombre: 'cesio', raiz: 'cés', v: 1 },
    { s: 'Fr', nombre: 'francio', raiz: 'fránc', v: 1 },
    { s: 'Ag', nombre: 'plata', raiz: 'argént', v: 1 },
    // Nota: el amonio (NH₄⁺) es un ion poliatómico, no forma "hidruro de amonio"
    // en el temario UNEMI. Se usará en unidades posteriores (sales de amonio).
    // +2 (alcalinotérreos + Zn + Cd)
    { s: 'Be', nombre: 'berilio', raiz: 'beríl', v: 2 },
    { s: 'Mg', nombre: 'magnesio', raiz: 'magnés', v: 2 },
    { s: 'Ca', nombre: 'calcio', raiz: 'cálc', v: 2 },
    { s: 'Sr', nombre: 'estroncio', raiz: 'estrónc', v: 2 },
    { s: 'Ba', nombre: 'bario', raiz: 'bár', v: 2 },
    { s: 'Ra', nombre: 'radio', raiz: 'rád', v: 2 },
    { s: 'Zn', nombre: 'zinc', raiz: 'zínc', v: 2 },
    { s: 'Cd', nombre: 'cadmio', raiz: 'cádm', v: 2 },
    // +3
    { s: 'Al', nombre: 'aluminio', raiz: 'alumín', v: 3 },
    { s: 'Ga', nombre: 'galio', raiz: 'gál', v: 3 },
    { s: 'In', nombre: 'indio', raiz: 'índ', v: 3 },
    { s: 'Bi', nombre: 'bismuto', raiz: 'bismút', v: 3 }
  ];

  // ─────────────────────────────────────────────────────────────────────
  // METALES DE VALENCIA VARIABLE
  // valencias van de menor a mayor. Para cada valencia se guarda el sufijo
  // tradicional (oso/ico) y el prefijo si aplica (hipo/per) — 2 valencias:
  // oso/ico; 3 valencias: hipo-oso/oso/ico; 4 valencias: hipo-oso/oso/ico/per-ico.
  // ─────────────────────────────────────────────────────────────────────
  // Cada metal variable trae DOS raíces: una para el sufijo -oso (grave, sin tilde)
  // y otra para el sufijo -ico (esdrújula, con tilde). Se aplica también a hipo-oso y per-ico.
  const METALES_VARIABLES = [
    // 2 valencias (monovalente-divalente)
    { s: 'Cu', nombre: 'cobre', rOso: 'cupr', rIco: 'cúpr', vs: [1, 2] },
    { s: 'Hg', nombre: 'mercurio', rOso: 'mercuri', rIco: 'mercúr', vs: [1, 2] },
    // 2 valencias (monovalente-trivalente)
    { s: 'Au', nombre: 'oro', rOso: 'aur', rIco: 'áur', vs: [1, 3] },
    { s: 'Tl', nombre: 'talio', rOso: 'tali', rIco: 'tál', vs: [1, 3] },
    // 2 valencias (divalente-trivalente)
    { s: 'Fe', nombre: 'hierro', rOso: 'ferr', rIco: 'férr', vs: [2, 3] },
    { s: 'Ni', nombre: 'níquel', rOso: 'niquel', rIco: 'niquél', vs: [2, 3] },
    { s: 'Co', nombre: 'cobalto', rOso: 'cobalt', rIco: 'cobált', vs: [2, 3] },
    { s: 'Mn', nombre: 'manganeso', rOso: 'mangan', rIco: 'mangán', vs: [2, 3] },
    { s: 'Cr', nombre: 'cromo', rOso: 'crom', rIco: 'cróm', vs: [2, 3] },
    // 2 valencias (divalente-tetravalente)
    { s: 'Pb', nombre: 'plomo', rOso: 'plumb', rIco: 'plúmb', vs: [2, 4] },
    { s: 'Sn', nombre: 'estaño', rOso: 'estann', rIco: 'estánn', vs: [2, 4] }
  ];

  // ─────────────────────────────────────────────────────────────────────
  // NO METALES (usados en hidruros volátiles e hidrácidos)
  // valFrenteAH = valencia con la que actúan cuando se combinan con H.
  // ─────────────────────────────────────────────────────────────────────
  // Grupo 13 (con H, valencia -3 negativa; en la fórmula el H es +1)
  const NO_METALES_G13 = [
    { s: 'B', nombre: 'boro', raiz: 'bor', valFrenteAH: 3, tradPropio: 'borano', tipo: 'volatil' }
  ];
  // Grupo 14 (con H, valencia -4)
  const NO_METALES_G14 = [
    { s: 'C', nombre: 'carbono', raiz: 'carbon', valFrenteAH: 4, tradPropio: 'metano', tipo: 'volatil' },
    { s: 'Si', nombre: 'silicio', raiz: 'silic', valFrenteAH: 4, tradPropio: 'silano', tipo: 'volatil' }
  ];
  // Grupo 15 (con H, valencia -3)
  const NO_METALES_G15 = [
    { s: 'N', nombre: 'nitrógeno', raiz: 'nitrog', valFrenteAH: 3, tradPropio: 'amoníaco', tipo: 'volatil' },
    { s: 'P', nombre: 'fósforo', raiz: 'fosf', valFrenteAH: 3, tradPropio: 'fosfina', tipo: 'volatil' },
    { s: 'As', nombre: 'arsénico', raiz: 'arsen', valFrenteAH: 3, tradPropio: 'arsina', tipo: 'volatil' },
    { s: 'Sb', nombre: 'antimonio', raiz: 'estib', valFrenteAH: 3, tradPropio: 'estibina', tipo: 'volatil' }
  ];
  // Grupo 16 (con H, valencia -2) — anfígenos, forman hidrácidos (SIN O)
  const NO_METALES_G16 = [
    { s: 'S', nombre: 'azufre', raizIUPAC: 'sulf', raizTrad: 'sulf', valFrenteAH: 2, tipo: 'hidracido' },
    { s: 'Se', nombre: 'selenio', raizIUPAC: 'selen', raizTrad: 'selen', valFrenteAH: 2, tipo: 'hidracido' },
    { s: 'Te', nombre: 'telurio', raizIUPAC: 'telur', raizTrad: 'telur', valFrenteAH: 2, tipo: 'hidracido' }
  ];
  // Grupo 17 (con H, valencia -1) — halógenos, forman hidrácidos
  const NO_METALES_G17 = [
    { s: 'F', nombre: 'flúor', raizIUPAC: 'fluor', raizTrad: 'fluor', valFrenteAH: 1, tipo: 'hidracido' },
    { s: 'Cl', nombre: 'cloro', raizIUPAC: 'clor', raizTrad: 'clor', valFrenteAH: 1, tipo: 'hidracido' },
    { s: 'Br', nombre: 'bromo', raizIUPAC: 'brom', raizTrad: 'brom', valFrenteAH: 1, tipo: 'hidracido' },
    { s: 'I', nombre: 'yodo', raizIUPAC: 'yod', raizTrad: 'yod', valFrenteAH: 1, tipo: 'hidracido' }
  ];

  const NO_METALES_VOLATILES = [].concat(NO_METALES_G13, NO_METALES_G14, NO_METALES_G15);
  const NO_METALES_HIDRACIDOS = [].concat(NO_METALES_G17, NO_METALES_G16);  // Halógenos primero por ser lo más típico

  // ─────────────────────────────────────────────────────────────────────
  // PREFIJOS GRIEGOS (nomenclatura sistemática / IUPAC)
  // ─────────────────────────────────────────────────────────────────────
  const PREFIJOS_IUPAC = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  // Nota: el prefijo "mono" a veces se omite en el primer elemento; en la enseñanza
  // UNEMI se acepta con y sin mono, pero al escribir "un hidruro" usamos "monohidruro".

  // ─────────────────────────────────────────────────────────────────────
  // NÚMEROS ROMANOS (nomenclatura Stock, del 1 al 8 basta para todo el temario)
  // ─────────────────────────────────────────────────────────────────────
  const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  // ─────────────────────────────────────────────────────────────────────
  // Utilidades para trabajar con los datos
  // ─────────────────────────────────────────────────────────────────────
  function metalPorSimbolo(s) {
    return METALES_FIJOS.find(m => m.s === s) || METALES_VARIABLES.find(m => m.s === s) || null;
  }
  function noMetalPorSimbolo(s) {
    return NO_METALES_VOLATILES.find(n => n.s === s) || NO_METALES_HIDRACIDOS.find(n => n.s === s) || null;
  }
  function esMetalFijo(s) { return METALES_FIJOS.some(m => m.s === s); }
  function esMetalVariable(s) { return METALES_VARIABLES.some(m => m.s === s); }
  function valenciasDe(s) {
    const f = METALES_FIJOS.find(m => m.s === s); if (f) return [f.v];
    const v = METALES_VARIABLES.find(m => m.s === s); if (v) return v.vs.slice();
    const nm = noMetalPorSimbolo(s); if (nm) return [nm.valFrenteAH];
    return [];
  }

  // Expone al resto de la app.
  window.NOM = window.NOM || {};
  window.NOM.datos = {
    METALES_FIJOS, METALES_VARIABLES,
    NO_METALES_VOLATILES, NO_METALES_HIDRACIDOS,
    NO_METALES_G13, NO_METALES_G14, NO_METALES_G15, NO_METALES_G16, NO_METALES_G17,
    PREFIJOS_IUPAC, ROMANOS,
    metalPorSimbolo, noMetalPorSimbolo,
    esMetalFijo, esMetalVariable, valenciasDe
  };
})();
