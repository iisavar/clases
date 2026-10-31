(function () {
  'use strict';
  window.QuizSync = {
    activo: function () { return false; },
    enviar: function () { return Promise.resolve('sin-configurar'); },
    detalle: function () { return Promise.resolve('sin-configurar'); }
  };
})();
