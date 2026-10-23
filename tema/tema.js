// Tema claro por defecto, con botón (y tecla T) para pasar al oscuro. Cada navegador recuerda lo elegido.
(function(){
  var raiz = document.documentElement;
  var tema = 'claro';
  try { tema = localStorage.getItem('tema') || 'claro'; } catch (e) {}
  raiz.dataset.tema = tema;

  function etiqueta(){ return raiz.dataset.tema === 'claro' ? 'Oscuro' : 'Claro'; }
  function cambiar(){
    raiz.dataset.tema = raiz.dataset.tema === 'claro' ? 'oscuro' : 'claro';
    try { localStorage.setItem('tema', raiz.dataset.tema); } catch (e) {}
    document.querySelectorAll('[data-btn-tema]').forEach(function(b){ b.textContent = etiqueta(); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-btn-tema', '');
    b.title = 'Cambiar fondo claro u oscuro (tecla T)';
    b.textContent = etiqueta();
    b.addEventListener('click', cambiar);
    var libre = document.getElementById('bLibre');
    if (libre) libre.parentNode.insertBefore(b, libre);  // clases: en la barra inferior
    else { b.className = 'btn-tema-flota'; document.body.appendChild(b); }
  });
  document.addEventListener('keydown', function(e){
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.key === 't' || e.key === 'T') cambiar();
  });
})();
