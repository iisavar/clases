/* Herramientas sueltas para la Zona de práctica del Campus: ?herramienta=tabla|constructor|estados */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};

  function pantalla(r, titulo, bajada, pintarWidget) {
    LS.setColor('full');
    r.innerHTML =
      '<div class="pantalla qm-herr">' +
      '<a class="campus-volver" href="../../temas/">← Clases por tema</a>' +
      '<h1 style="margin:10px 0 4px">' + titulo + '</h1>' +
      '<p class="tinta-2" style="margin-bottom:14px">' + bajada + '</p>' +
      '<div class="tarjeta qm-herr-caja"></div>' +
      '<button class="btn btn-sec btn-ancho" data-a="clase" style="margin-top:16px">Ir a la clase completa</button>' +
      '</div>';
    r.querySelector('[data-a="clase"]').addEventListener('click', () => LS.app.ir('hub'));
    pintarWidget(r.querySelector('.qm-herr-caja'));
  }

  LS.HERRAMIENTAS = {
    tabla: (r) => pantalla(r, 'Tabla periódica interactiva',
      'Toca cualquier elemento para ver su casilla, su grupo, su periodo y su familia.',
      (el) => LS.QM.tabla(el, { modo: 'explorar', colorear: 'familia', mostrarNumeracion: 'ambas' })),
    constructor: (r) => pantalla(r, 'Constructor de átomos',
      'Agrega o quita protones, neutrones y electrones y mira qué elemento, ion o isótopo formas.',
      (el) => LS.QM.constructor(el, { p: 1, n: 0, e: 1 })),
    estados: (r) => pantalla(r, 'Simulador de estados de la materia',
      'Mueve la temperatura y mira cómo se mueven las partículas del agua en cada estado.',
      (el) => LS.QM.particulas(el, { estado: 'solido', control: true, sustancia: 'agua' }))
  };
})();
