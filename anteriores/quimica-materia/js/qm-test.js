/* Test final de 25 preguntas de «Química desde cero» (materia, átomo, tabla periódica).
   Banco fijo con dos versiones paralelas: A (intento oficial) y B (práctica). Las opciones se barajan con semilla.
   Pantallas de intro, pregunta (sin feedback), revisión y resultados; guardado continuo en LS.st.test y envío.
   Expone LS.test = { abrir(root, opts), atras() } y, para el validador, LS.test._generar(version, semilla). */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const TOTAL = 25;
  const MENOS = '−';

  // ======================================================================
  // 1. TEMAS Y CATÁLOGO DE ERRORES
  // ======================================================================
  const TEMAS = {
    A: { nombre: 'La materia y sus cambios', chip: 'LA MATERIA', max: 8, laminas: [17, 14, 20] },
    B: { nombre: 'El átomo', chip: 'EL ÁTOMO', max: 9, laminas: [39, 34, 38] },
    C: { nombre: 'La tabla periódica', chip: 'LA TABLA', max: 8, laminas: [54, 52, 55, 56] }
  };

  // Cada distractor lleva un código. txt: qué pasó (sin «incorrecto»); lamina: dónde repasarlo (null si no hay fija).
  const ERR = {
    M1: { tema: 'A', lamina: 17, txt: 'Confundiste una mezcla con un compuesto. En la mezcla las sustancias solo están juntas; en el compuesto los elementos están unidos.' },
    M2: { tema: 'A', lamina: 17, txt: 'Tomaste una mezcla homogénea por sustancia pura. Que se vea pareja no la hace pura: el suero y el aire son mezclas.' },
    M3: { tema: 'A', lamina: 17, txt: 'Un elemento tiene una sola clase de átomo. Si hay dos o más elementos o sustancias, no es un elemento.' },
    M4: { tema: 'A', lamina: 17, txt: 'Confundiste homogénea con heterogénea. Si ves partes o capas distintas, es heterogénea.' },
    M5: { tema: 'A', lamina: 14, txt: 'Confundiste el nombre del cambio de estado. Mira de qué estado sale y a cuál llega.' },
    M6: { tema: 'A', lamina: 14, txt: 'En la sublimación se pasa directo entre sólido y gas, sin pasar por líquido.' },
    M7: { tema: 'A', lamina: 20, txt: 'Tomaste un cambio de estado por cambio químico. Al cambiar de estado sigue siendo la misma sustancia.' },
    M8: { tema: 'A', lamina: 20, txt: 'Disolver, moler o cortar no forman una sustancia nueva: son cambios físicos.' },
    M9: { tema: 'A', lamina: 20, txt: 'Tomaste un cambio químico por físico. Si se forma una sustancia nueva (color, gas, olor, calor), es químico.' },
    M10: { tema: 'A', lamina: null, txt: 'Eso sí es materia: tiene masa y ocupa espacio, aunque sea un gas. La luz y el sonido no son materia.' },
    M11: { tema: 'A', lamina: 14, txt: 'Las burbujas del agua que hierve son vapor de agua, no aire.' },
    T0: { tema: 'B', lamina: 39, txt: 'La cuenta no cuadra. Recuerda: p = Z, n = A − Z y e = Z − carga.' },
    T1: { tema: 'B', lamina: 35, txt: 'Confundiste Z con A. Z cuenta solo protones; A cuenta protones + neutrones.' },
    T2: { tema: 'B', lamina: 35, txt: 'Sumaste A y Z. Los neutrones se sacan restando: n = A − Z.' },
    T3: { tema: 'B', lamina: 38, txt: 'En un ion cambian los electrones. Los protones nunca cambian: si cambiaran, sería otro elemento.' },
    T4: { tema: 'B', lamina: 38, txt: 'Catión y anión al revés. El catión (+) PIERDE electrones; el anión (−) GANA electrones.' },
    T5: { tema: 'B', lamina: 37, txt: 'Los isótopos son del mismo elemento: tienen los mismos protones y distinto número de neutrones.' },
    T6: { tema: 'B', lamina: 35, txt: 'La masa atómica de la casilla es un promedio con decimales. A es un número entero y no está en la casilla.' },
    T7: { tema: 'B', lamina: null, txt: 'Confundiste los modelos: Dalton, esfera maciza; Thomson, budín de pasas; Rutherford, núcleo; Bohr, niveles de energía.' },
    T8: { tema: 'B', lamina: null, txt: 'El átomo es casi todo espacio vacío: el núcleo es diminuto y tiene casi toda la masa.' },
    T9: { tema: 'B', lamina: null, txt: 'Confundiste las partículas: protón +1 en el núcleo, neutrón sin carga en el núcleo, electrón −1 alrededor.' },
    T10: { tema: 'B', lamina: 38, txt: 'Confundiste isótopo con ion. Si cambian los neutrones, es un isótopo; si cambian los electrones, es un ion.' },
    T11: { tema: 'B', lamina: 39, txt: 'Contaste otra partícula. Lee bien qué te piden: protones, neutrones o electrones.' },
    T12: { tema: 'B', lamina: 39, txt: 'No usaste la carga. En un ion, e = Z − carga: el catión tiene menos electrones y el anión, más.' },
    P0: { tema: 'C', lamina: 54, txt: 'Revisa la ubicación: los periodos son filas y los grupos son columnas.' },
    P1: { tema: 'C', lamina: 54, txt: 'Confundiste grupos y periodos. Los grupos son columnas; los periodos son filas.' },
    P2: { tema: 'C', lamina: 54, txt: 'Las letras B son de los metales de transición (grupos 3 al 12). Los grupos 1, 2 y del 13 al 18 llevan A.' },
    P2b: { tema: 'C', lamina: 54, txt: 'En los grupos del 13 al 18 la diferencia es 10: el grupo 17 es VIIA y el VA es el 15.' },
    P3: { tema: 'C', lamina: 52, txt: 'Confundiste los números de la casilla. El entero de arriba es Z; el decimal es la masa atómica.' },
    P4: { tema: 'C', lamina: 55, txt: 'Confundiste las familias: grupo 1 alcalinos, 2 alcalinotérreos, 17 halógenos y 18 gases nobles.' },
    P5: { tema: 'C', lamina: 56, txt: 'El hidrógeno está en el grupo 1, pero no es metal alcalino: es un no metal gaseoso.' },
    P6: { tema: 'C', lamina: 56, txt: 'Los metaloides son solo seis: B, Si, Ge, As, Sb y Te. El C es no metal; el Sn y el Pb son metales.' },
    P7: { tema: 'C', lamina: null, txt: 'Confundiste el símbolo. Algunos vienen del latín: Fe (hierro), K (potasio), Na (sodio).' }
  };

  // ======================================================================
  // 2. NOTACIÓN Y CASILLA (usa LS.QM si existe; si no, dibujo propio)
  // ======================================================================
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sup = (n) => String(n).split('').map(d => SUP[+d]).join('');
  const sub = (n) => String(n).split('').map(d => SUB[+d]).join('');
  const cargaTxt = (q) => !q ? '' : (Math.abs(q) > 1 ? String(Math.abs(q)) : '') + (q > 0 ? '+' : MENOS);
  const cargaSup = (q) => !q ? '' : (Math.abs(q) > 1 ? sup(Math.abs(q)) : '') + (q > 0 ? '⁺' : '⁻');
  // Texto plano: ²⁷₁₃Al, ⁵⁶₂₆Fe³⁺
  const notTxt = (A, Z, S, q) => sup(A) + sub(Z) + S + cargaSup(q);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function notacionHtml(A, Z, S, q) {
    const Q = LS.QM;
    if (Q && typeof Q.notacion === 'function') {
      const formas = q ? [q, cargaTxt(q)] : [undefined];
      for (let i = 0; i < formas.length; i++) {
        try {
          const h = Q.notacion(A, Z, S, formas[i]);
          const txt = typeof h === 'string' ? h.replace(/<[^>]*>/g, '') : '';
          if (txt.indexOf(S) >= 0 && txt.indexOf(String(A)) >= 0 && (!q || /[+−-]/.test(txt))) return h;
        } catch (e) { /* se usa el dibujo propio */ }
      }
    }
    const qc = q ? (q > 0 ? 'pos' : 'neg') : '';
    return '<span class="ts-not" role="img" aria-label="' + esc('A = ' + A + ', Z = ' + Z + ', ' + S + (q ? ', carga ' + cargaTxt(q) : '')) + '">' +
      '<span class="ts-not-n" aria-hidden="true"><span>' + A + '</span><span>' + Z + '</span></span>' +
      '<span class="ts-not-s" aria-hidden="true">' + esc(S) + '</span>' +
      (q ? '<span class="ts-not-q ' + qc + '" aria-hidden="true">' + cargaTxt(q) + '</span>' : '') + '</span>';
  }

  // Datos de respaldo (iguales a qm-tabla-data.js: CIAAW 2024)
  const CAS = { 17: ['Cl', 'Cloro', '35,45'], 20: ['Ca', 'Calcio', '40,078'], 26: ['Fe', 'Hierro', '55,845'], 29: ['Cu', 'Cobre', '63,546'] };
  function casillaHtml(z) {
    const Q = LS.QM;
    if (Q && typeof Q.casilla === 'function') {
      try { const h = Q.casilla(z, { grande: true, etiquetas: false }); if (typeof h === 'string' && h.length) return h; } catch (e) { /* respaldo */ }
    }
    const d = CAS[z] || ['?', '?', '?'];
    return '<div class="ts-cas" role="img" aria-label="' + esc('Casilla: número atómico ' + z + ', símbolo ' + d[0] + ', ' + d[1] + ', masa atómica ' + d[2]) + '">' +
      '<span class="ts-cas-z">' + z + '</span><span class="ts-cas-s">' + d[0] + '</span><span class="ts-cas-n">' + d[1] + '</span><span class="ts-cas-m">' + d[2] + '</span></div>';
  }
  function visualHtml(vis) {
    if (!vis) return '';
    if (vis.not) return '<div class="ts-vis ts-vis-not">' + notacionHtml.apply(null, vis.not) + '</div>';
    if (vis.cas) return '<div class="ts-vis ts-vis-cas">' + casillaHtml(vis.cas) + '</div>';
    return '';
  }

  // ======================================================================
  // 3. BANCO (25 posiciones; tema fijo por posición: B A C B A C … B, nunca dos seguidas iguales)
  //    mc: ops = [[texto, código], …] con la CORRECTA PRIMERO (código '').   num: correcta + reconoce [[valor, código]].
  // ======================================================================
  const BANCO = [
    // ---- 1 (B) El átomo es casi vacío (se cruza con el gancho de la lámina 3) ----
    {
      tema: 'B', tipo: 'mc', chip: 'MODELOS', lam: null,
      A: {
        texto: 'Rutherford lanzó partículas alfa contra una lámina de oro muy delgada. Casi todas la atravesaron sin desviarse. ¿Qué concluyó sobre el átomo?',
        ops: [['Es casi todo espacio vacío, con un núcleo muy pequeño', ''], ['Es una esfera maciza, sin espacios', 'T7'], ['Es una esfera positiva con electrones incrustados', 'T7'], ['La mitad es núcleo y la otra mitad, electrones', 'T8']],
        exp: 'Si casi todas las partículas pasaron sin chocar, es porque casi no hay nada en su camino: el átomo es casi todo espacio vacío. Las pocas que rebotaron chocaron con un núcleo diminuto y positivo, donde está casi toda la masa.'
      },
      B: {
        texto: 'Si un átomo fuera tan grande como un estadio de fútbol, su núcleo sería como una canica en el centro. ¿Qué nos dice esto del átomo?',
        ops: [['Es casi todo espacio vacío', ''], ['Es una esfera maciza, sin espacios', 'T7'], ['El núcleo ocupa la mitad del átomo', 'T8'], ['Casi toda su masa está en los electrones', 'T8']],
        exp: 'Una canica en medio de un estadio: casi todo el átomo es espacio vacío. Los electrones se mueven lejos del núcleo y casi no tienen masa; la masa está en el núcleo. Esto lo descubrió Rutherford.'
      }
    },
    // ---- 2 (A) Clasificar: mezcla homogénea ----
    {
      tema: 'A', tipo: 'mc', chip: 'CLASIFICACIÓN', lam: 17,
      A: {
        texto: 'El suero oral es agua con sal y azúcar disueltas. Se ve transparente y parejo. ¿Qué es?',
        ops: [['Una mezcla homogénea', ''], ['Una sustancia pura (un compuesto)', 'M2'], ['Una mezcla heterogénea', 'M4'], ['Un elemento', 'M2']],
        exp: 'Tiene varias sustancias (agua, sal y azúcar) que solo están juntas: es una mezcla. Como no se distinguen sus partes, es homogénea. Que se vea parejo no lo hace puro.'
      },
      B: {
        texto: 'El aire limpio que respiras tiene nitrógeno, oxígeno y otros gases. No se ven partes distintas. ¿Qué es?',
        ops: [['Una mezcla homogénea', ''], ['Una sustancia pura (un compuesto)', 'M2'], ['Una mezcla heterogénea', 'M4'], ['Un elemento', 'M2']],
        exp: 'Tiene varias sustancias (nitrógeno, oxígeno, dióxido de carbono…) que solo están juntas: es una mezcla. No se distinguen sus partes, así que es homogénea.'
      }
    },
    // ---- 3 (C) Leer una casilla: Z ----
    {
      tema: 'C', tipo: 'mc', chip: 'LA CASILLA', lam: 52,
      A: {
        vis: { cas: 20 },
        texto: 'Mira la casilla del calcio. ¿Qué indica el número 20?',
        ops: [['El número atómico Z: el calcio tiene 20 protones', ''], ['La masa atómica del calcio', 'P3'], ['El número de neutrones', 'P3'], ['El número de masa A', 'P3']],
        exp: 'El número entero de arriba es el número atómico Z: cuenta los protones. Todo átomo de calcio tiene 20. El número con decimales (40,078) es la masa atómica, que es otra cosa.'
      },
      B: {
        vis: { cas: 26 },
        texto: 'Mira la casilla del hierro. ¿Qué indica el número 26?',
        ops: [['El número atómico Z: el hierro tiene 26 protones', ''], ['La masa atómica del hierro', 'P3'], ['El número de neutrones', 'P3'], ['El número de masa A', 'P3']],
        exp: 'El número entero de arriba es el número atómico Z: cuenta los protones. Todo átomo de hierro tiene 26. El número con decimales (55,845) es la masa atómica, que es otra cosa.'
      }
    },
    // ---- 4 (B) Neutrones en un átomo neutro (numérica) ----
    {
      tema: 'B', tipo: 'num', chip: 'CONTAR PARTÍCULAS', lam: 35,
      A: {
        vis: { not: [27, 13, 'Al'] },
        texto: 'Un átomo de aluminio: ' + notTxt(27, 13, 'Al') + '. ¿Cuántos neutrones tiene?',
        correcta: 14, reconoce: [[27, 'T1'], [13, 'T1'], [40, 'T2']],
        exp: 'Arriba va A = 27 (protones + neutrones). Abajo va Z = 13 (protones). Neutrones: n = A − Z = 27 − 13 = 14.'
      },
      B: {
        vis: { not: [39, 19, 'K'] },
        texto: 'Un átomo de potasio: ' + notTxt(39, 19, 'K') + '. ¿Cuántos neutrones tiene?',
        correcta: 20, reconoce: [[39, 'T1'], [19, 'T1'], [58, 'T2']],
        exp: 'Arriba va A = 39 (protones + neutrones). Abajo va Z = 19 (protones). Neutrones: n = A − Z = 39 − 19 = 20.'
      }
    },
    // ---- 5 (A) Nombre del cambio de estado: rocío / escarcha ----
    {
      tema: 'A', tipo: 'mc', chip: 'CAMBIOS DE ESTADO', lam: 14,
      A: {
        texto: 'En la mañana, las hojas del jardín amanecen con gotitas de rocío. El vapor de agua del aire se volvió líquido. ¿Cómo se llama ese cambio?',
        ops: [['Condensación', ''], ['Evaporación', 'M5'], ['Solidificación', 'M5'], ['Sublimación regresiva', 'M6']],
        exp: 'Sale de gas (vapor de agua) y llega a líquido (gotitas): eso es condensación. En la noche el aire se enfría y el vapor se condensa sobre las hojas frías.'
      },
      B: {
        texto: 'En las madrugadas frías del páramo, el vapor de agua del aire se vuelve hielo directamente sobre el pasto: es la escarcha. ¿Cómo se llama ese cambio?',
        ops: [['Sublimación regresiva (o inversa)', ''], ['Solidificación', 'M6'], ['Condensación', 'M5'], ['Fusión', 'M5']],
        exp: 'Sale de gas (vapor) y llega a sólido (hielo) sin pasar por líquido: es la sublimación regresiva, también llamada inversa. Algunos libros la llaman deposición.'
      }
    },
    // ---- 6 (C) Dos numeraciones: 17 = VIIA ----
    {
      tema: 'C', tipo: 'mc', chip: 'GRUPOS Y PERIODOS', lam: 54,
      A: {
        texto: 'El cloro (Cl) está en el grupo 17. ¿Cómo se escribe ese grupo en la numeración con letras?',
        ops: [['VIIA', ''], ['VIIB', 'P2'], ['VIIIA', 'P2b'], ['XVIIA', 'P2b']],
        exp: 'En los grupos del 13 al 18, resta 10 y ponle A: 17 − 10 = 7, así que el grupo 17 es VIIA. Las letras B son solo para los metales de transición (grupos 3 al 12).'
      },
      B: {
        texto: 'El oxígeno (O) está en el grupo 16. ¿Cómo se escribe ese grupo en la numeración con letras?',
        ops: [['VIA', ''], ['VIB', 'P2'], ['VIIA', 'P2b'], ['XVIA', 'P2b']],
        exp: 'En los grupos del 13 al 18, resta 10 y ponle A: 16 − 10 = 6, así que el grupo 16 es VIA. Las letras B son solo para los metales de transición (grupos 3 al 12).'
      }
    },
    // ---- 7 (B) Cómo se forma un ion ----
    {
      tema: 'B', tipo: 'mc', chip: 'IONES', lam: 38,
      A: {
        texto: 'El calcio de tus huesos está como ion Ca²⁺. ¿Qué le pasó al átomo de calcio para quedar así?',
        ops: [['Perdió 2 electrones', ''], ['Ganó 2 electrones', 'T4'], ['Ganó 2 protones', 'T3'], ['Perdió 2 neutrones', 'T10']],
        exp: 'La carga 2+ dice que ahora hay 2 protones más que electrones. Los protones no cambian (si cambiaran, sería otro elemento). Así que perdió 2 electrones: es un catión.'
      },
      B: {
        texto: 'La sal de mesa tiene cloro como ion Cl⁻. ¿Qué le pasó al átomo de cloro para quedar así?',
        ops: [['Ganó 1 electrón', ''], ['Perdió 1 electrón', 'T4'], ['Perdió 1 protón', 'T3'], ['Ganó 1 neutrón', 'T10']],
        exp: 'La carga 1− dice que ahora hay 1 electrón más que protones. Los protones no cambian (si cambiaran, sería otro elemento). Así que ganó 1 electrón: es un anión.'
      }
    },
    // ---- 8 (A) Físico o químico (salud y cocina) ----
    {
      tema: 'A', tipo: 'mc', chip: 'FÍSICO O QUÍMICO', lam: 20,
      A: {
        texto: '¿Cuál de estos es un cambio QUÍMICO?',
        ops: [['La digestión de los alimentos en el estómago', ''], ['Disolver el sobre de suero oral en agua', 'M8'], ['Hervir agua para la colada', 'M7'], ['Moler una pastilla para tragarla mejor', 'M8']],
        exp: 'En la digestión, las enzimas rompen los alimentos y se forman sustancias nuevas: es un cambio químico. Disolver, hervir y moler no crean sustancias nuevas: son cambios físicos.'
      },
      B: {
        texto: '¿Cuál de estos es un cambio FÍSICO?',
        ops: [['Derretir mantequilla en la sartén', ''], ['Quemar un papel: queda ceniza negra y sale humo', 'M9'], ['La leche se vuelve yogur (fermentación)', 'M9'], ['El agua oxigenada hace burbujas en una herida', 'M9']],
        exp: 'La mantequilla derretida sigue siendo mantequilla: solo cambió de estado, y eso es físico. En el papel quemado, el yogur y las burbujas del agua oxigenada se forman sustancias nuevas: son cambios químicos.'
      }
    },
    // ---- 9 (C) Letras a número 1–18 (numérica) ----
    {
      tema: 'C', tipo: 'num', chip: 'GRUPOS Y PERIODOS', lam: 54,
      A: {
        texto: 'El nitrógeno (N) está en el grupo VA. ¿Qué número tiene ese grupo en la numeración del 1 al 18?',
        correcta: 15, reconoce: [[5, 'P2b']],
        exp: 'Los grupos IIIA al VIIIA son los grupos 13 al 18: suma 10. V es 5, y 5 + 10 = 15. El nitrógeno está en el grupo 15.'
      },
      B: {
        texto: 'El carbono (C) está en el grupo IVA. ¿Qué número tiene ese grupo en la numeración del 1 al 18?',
        correcta: 14, reconoce: [[4, 'P2b']],
        exp: 'Los grupos IIIA al VIIIA son los grupos 13 al 18: suma 10. IV es 4, y 4 + 10 = 14. El carbono está en el grupo 14.'
      }
    },
    // ---- 10 (B) Isótopos: en qué se diferencian ----
    {
      tema: 'B', tipo: 'mc', chip: 'ISÓTOPOS', lam: 37,
      A: {
        texto: 'El carbono-12 y el carbono-14 (con el que se calcula la edad de restos antiguos) son isótopos. ¿En qué se diferencian?',
        ops: [['En el número de neutrones', ''], ['En el número de protones', 'T5'], ['En el número de electrones', 'T10'], ['Son de elementos distintos', 'T5']],
        exp: 'Los dos son carbono, así que tienen el mismo Z = 6: 6 protones. Cambia A (12 y 14) porque cambian los neutrones: el carbono-12 tiene 6 y el carbono-14 tiene 8.'
      },
      B: {
        texto: 'El yodo-127 y el yodo-131 (que se usa en medicina para la tiroides) son isótopos. ¿En qué se diferencian?',
        ops: [['En el número de neutrones', ''], ['En el número de protones', 'T5'], ['En el número de electrones', 'T10'], ['Son de elementos distintos', 'T5']],
        exp: 'Los dos son yodo, así que tienen el mismo Z = 53: 53 protones. Cambia A (127 y 131) porque cambian los neutrones: el yodo-127 tiene 74 y el yodo-131 tiene 78.'
      }
    },
    // ---- 11 (A) Clasificar: compuesto ----
    {
      tema: 'A', tipo: 'mc', chip: 'CLASIFICACIÓN', lam: 17,
      A: {
        texto: 'El agua pura (H₂O) está formada por hidrógeno y oxígeno unidos. ¿Qué es?',
        ops: [['Un compuesto', ''], ['Un elemento', 'M3'], ['Una mezcla homogénea', 'M1'], ['Una mezcla heterogénea', 'M1']],
        exp: 'Tiene dos elementos distintos (H y O) unidos en una proporción fija: es un compuesto. No es una mezcla: no se separa en hidrógeno y oxígeno filtrando ni evaporando.'
      },
      B: {
        texto: 'La sal de mesa pura (NaCl) está formada por sodio y cloro unidos. ¿Qué es?',
        ops: [['Un compuesto', ''], ['Un elemento', 'M3'], ['Una mezcla homogénea', 'M1'], ['Una mezcla heterogénea', 'M1']],
        exp: 'Tiene dos elementos distintos (Na y Cl) unidos en una proporción fija: es un compuesto. No es una mezcla: no se separa en sodio y cloro filtrando ni evaporando.'
      }
    },
    // ---- 12 (C) Familias ----
    {
      tema: 'C', tipo: 'mc', chip: 'FAMILIAS', lam: 55,
      A: {
        texto: 'El flúor, el cloro, el bromo y el yodo están en el grupo 17. ¿Cómo se llama esa familia?',
        ops: [['Halógenos', ''], ['Gases nobles', 'P4'], ['Metales alcalinos', 'P4'], ['Alcalinotérreos', 'P4']],
        exp: 'El grupo 17 es la familia de los halógenos. El cloro de la piscina y el yodo de la sal son halógenos. Los gases nobles están en el grupo 18.'
      },
      B: {
        texto: 'El helio, el neón y el argón están en el grupo 18 y casi no reaccionan. ¿Cómo se llama esa familia?',
        ops: [['Gases nobles', ''], ['Halógenos', 'P4'], ['Metales alcalinos', 'P4'], ['Metales de transición', 'P4']],
        exp: 'El grupo 18 es la familia de los gases nobles: casi no reaccionan con otras sustancias. Los halógenos están en el grupo 17.'
      }
    },
    // ---- 13 (B) Electrones en un ion (numérica) ----
    {
      tema: 'B', tipo: 'num', chip: 'IONES', lam: 39,
      A: {
        vis: { not: [56, 26, 'Fe', 3] },
        texto: 'Este es un ion de hierro: ' + notTxt(56, 26, 'Fe', 3) + '. ¿Cuántos electrones tiene?',
        correcta: 23, reconoce: [[29, 'T4'], [26, 'T12'], [30, 'T11'], [56, 'T1']],
        exp: 'Z = 26, así que tiene 26 protones. La carga 3+ dice que perdió 3 electrones: e = 26 − 3 = 23. Los 30 neutrones (56 − 26) no cuentan aquí.'
      },
      B: {
        vis: { not: [32, 16, 'S', -2] },
        texto: 'Este es un ion de azufre: ' + notTxt(32, 16, 'S', -2) + '. ¿Cuántos electrones tiene?',
        correcta: 18, reconoce: [[14, 'T4'], [16, 'T12'], [32, 'T1']],
        exp: 'Z = 16, así que tiene 16 protones. La carga 2− dice que ganó 2 electrones: e = 16 + 2 = 18. Es un anión.'
      }
    },
    // ---- 14 (A) Sublimación: hielo seco / naftalina ----
    {
      tema: 'A', tipo: 'mc', chip: 'CAMBIOS DE ESTADO', lam: 14,
      A: {
        texto: 'El hielo seco (dióxido de carbono sólido) echa «humo» y no deja charcos: pasa de sólido a gas. ¿Cómo se llama ese cambio?',
        ops: [['Sublimación (progresiva)', ''], ['Fusión', 'M6'], ['Vaporización', 'M6'], ['Sublimación regresiva', 'M5']],
        exp: 'Pasa de sólido a gas directamente, sin volverse líquido: es la sublimación (progresiva). Por eso no deja charcos. El «humo» blanco son gotitas de agua del aire que se enfrían.'
      },
      B: {
        texto: 'Las bolitas de naftalina del armario se van achicando sin dejar ningún líquido. ¿Qué cambio de estado ocurre?',
        ops: [['Sublimación', ''], ['Evaporación', 'M6'], ['Fusión', 'M6'], ['Condensación', 'M5']],
        exp: 'La naftalina pasa de sólido a gas directamente, sin volverse líquida: es la sublimación. Por eso se achica y huele, pero nunca moja.'
      }
    },
    // ---- 15 (C) Metaloides ----
    {
      tema: 'C', tipo: 'mc', chip: 'METALES Y NO METALES', lam: 56,
      A: {
        texto: '¿Cuál de estos elementos es un METALOIDE?',
        ops: [['Silicio (Si)', ''], ['Carbono (C)', 'P6'], ['Estaño (Sn)', 'P6'], ['Aluminio (Al)', 'P6']],
        exp: 'Los metaloides más aceptados son seis: B, Si, Ge, As, Sb y Te. El silicio se usa en los chips. El carbono es no metal; el estaño y el aluminio son metales.'
      },
      B: {
        texto: '¿Cuál de estos elementos es un METALOIDE?',
        ops: [['Germanio (Ge)', ''], ['Plomo (Pb)', 'P6'], ['Azufre (S)', 'P6'], ['Magnesio (Mg)', 'P6']],
        exp: 'Los metaloides más aceptados son seis: B, Si, Ge, As, Sb y Te. El plomo y el magnesio son metales; el azufre es no metal.'
      }
    },
    // ---- 16 (B) Masa atómica ≠ número de masa A ----
    {
      tema: 'B', tipo: 'mc', chip: 'MASA ATÓMICA', lam: 35,
      A: {
        vis: { cas: 17 },
        texto: 'En la casilla del cloro dice 35,45. Un compañero dice: «entonces el número de masa A del cloro es 35,45». ¿Qué está mal?',
        ops: [['35,45 es la masa atómica, un promedio; A siempre es un número entero', ''], ['Nada: 35,45 es el número de masa A', 'T6'], ['35,45 es el número atómico Z', 'T6'], ['35,45 es el número de electrones', 'T6']],
        exp: 'A cuenta protones + neutrones, y eso siempre da un entero: el cloro tiene isótopos con A = 35 y A = 37. El 35,45 es la masa atómica: un promedio de esos isótopos. Por eso tiene decimales.'
      },
      B: {
        vis: { cas: 29 },
        texto: 'En la casilla del cobre dice 63,546. ¿Qué es ese número?',
        ops: [['La masa atómica: un promedio de los isótopos del cobre', ''], ['El número de masa A de todos los átomos de cobre', 'T6'], ['El número de neutrones del cobre', 'T6'], ['El número atómico Z del cobre', 'T6']],
        exp: 'Es la masa atómica: un promedio de los isótopos del cobre (A = 63 y A = 65). A siempre es un número entero y no está en la casilla. El Z del cobre es 29.'
      }
    },
    // ---- 17 (A) Cambio de estado = cambio físico ----
    {
      tema: 'A', tipo: 'mc', chip: 'FÍSICO O QUÍMICO', lam: 20,
      A: {
        texto: 'El hielo se derrite en tu vaso de jugo. ¿Qué tipo de cambio es?',
        ops: [['Físico: sigue siendo agua, solo cambió de estado', ''], ['Químico: se formó una sustancia nueva', 'M7'], ['Químico: cambió de forma', 'M7'], ['Químico: absorbió calor', 'M7']],
        exp: 'El hielo y el agua líquida son la misma sustancia: H₂O. Solo cambió de estado, y eso es un cambio físico. En un cambio químico se forma una sustancia nueva.'
      },
      B: {
        texto: 'El agua hierve en la olla y salen burbujas. ¿Qué tipo de cambio es?',
        ops: [['Físico: las burbujas son vapor de agua', ''], ['Químico: el agua se separa en hidrógeno y oxígeno', 'M7'], ['Químico: salen burbujas de gas', 'M7'], ['Físico: las burbujas son aire', 'M11']],
        exp: 'Hervir es un cambio de estado (vaporización): es físico. Las burbujas son vapor de agua, la misma sustancia en estado gaseoso. No son aire, ni hidrógeno y oxígeno.'
      }
    },
    // ---- 18 (C) El hidrógeno no es alcalino ----
    {
      tema: 'C', tipo: 'mc', chip: 'METALES Y NO METALES', lam: 56,
      A: {
        texto: 'El hidrógeno (H) está en el grupo 1, junto al litio y al sodio. ¿Es un metal alcalino?',
        ops: [['No: es un no metal (un gas), aunque esté en el grupo 1', ''], ['Sí: todo el grupo 1 son metales alcalinos', 'P5'], ['Sí: es el metal alcalino más liviano', 'P5'], ['No: es un gas noble', 'P4']],
        exp: 'El hidrógeno se ubica en el grupo 1, pero es un no metal gaseoso. Los metales alcalinos son Li, Na, K, Rb, Cs y Fr. Los gases nobles están en el grupo 18.'
      },
      B: {
        texto: 'Todos estos elementos están en el grupo 1. ¿Cuál NO es un metal alcalino?',
        ops: [['Hidrógeno (H)', ''], ['Litio (Li)', 'P5'], ['Sodio (Na)', 'P5'], ['Potasio (K)', 'P5']],
        exp: 'El hidrógeno está en el grupo 1, pero es un no metal gaseoso. El litio, el sodio y el potasio sí son metales alcalinos.'
      }
    },
    // ---- 19 (B) Modelo y su aporte ----
    {
      tema: 'B', tipo: 'mc', chip: 'MODELOS', lam: null,
      A: {
        texto: '¿Qué modelo propuso que los electrones giran en niveles de energía fijos alrededor del núcleo?',
        ops: [['El de Bohr', ''], ['El de Dalton', 'T7'], ['El de Thomson', 'T7'], ['El de Rutherford', 'T7']],
        exp: 'Bohr (1913) propuso que los electrones solo pueden estar en ciertos niveles de energía. Dalton imaginó una esfera maciza, Thomson un «budín de pasas» y Rutherford descubrió el núcleo.'
      },
      B: {
        texto: '¿Quién descubrió el electrón y propuso el modelo del «budín de pasas»?',
        ops: [['Thomson', ''], ['Dalton', 'T7'], ['Rutherford', 'T7'], ['Bohr', 'T7']],
        exp: 'Thomson descubrió el electrón y propuso una esfera positiva con electrones incrustados, como pasas en un budín. Dalton: esfera maciza. Rutherford: núcleo. Bohr: niveles de energía.'
      }
    },
    // ---- 20 (A) Clasificar: mezcla heterogénea ----
    {
      tema: 'A', tipo: 'mc', chip: 'CLASIFICACIÓN', lam: 17,
      A: {
        texto: 'En un vaso con agua y aceite se ven dos capas. ¿Qué es?',
        ops: [['Una mezcla heterogénea', ''], ['Una mezcla homogénea', 'M4'], ['Un compuesto', 'M1'], ['Un elemento', 'M3']],
        exp: 'Hay dos sustancias que solo están juntas: es una mezcla. Como se ven dos capas (dos fases), es heterogénea.'
      },
      B: {
        texto: 'En un balde hay agua con arena. La arena se ve y se va al fondo. ¿Qué es?',
        ops: [['Una mezcla heterogénea', ''], ['Una mezcla homogénea', 'M4'], ['Un compuesto', 'M1'], ['Un elemento', 'M3']],
        exp: 'Hay dos sustancias que solo están juntas: es una mezcla. Como se distinguen sus partes (la arena se ve), es heterogénea.'
      }
    },
    // ---- 21 (C) Bioelementos y símbolos del latín ----
    {
      tema: 'C', tipo: 'mc', chip: 'TU CUERPO', lam: null,
      A: {
        texto: 'La hemoglobina de tu sangre tiene un metal que ayuda a llevar el oxígeno: el hierro. ¿Cuál es su símbolo?',
        ops: [['Fe', ''], ['Hi', 'P7'], ['H', 'P7'], ['Ir', 'P7']],
        exp: 'El símbolo del hierro es Fe, del latín «ferrum». H es hidrógeno e Ir es iridio; «Hi» no existe. Otros símbolos del latín: Na (sodio), K (potasio), Cu (cobre).'
      },
      B: {
        texto: 'El plátano tiene mucho potasio, que ayuda a tus músculos y a tu corazón. ¿Cuál es el símbolo del potasio?',
        ops: [['K', ''], ['P', 'P7'], ['Po', 'P7'], ['Pt', 'P7']],
        exp: 'El símbolo del potasio es K, del latín «kalium». P es fósforo, Po es polonio y Pt es platino.'
      }
    },
    // ---- 22 (B) Partículas subatómicas ----
    {
      tema: 'B', tipo: 'mc', chip: 'PARTÍCULAS', lam: null,
      A: {
        texto: '¿Qué partícula tiene carga negativa y casi no aporta masa al átomo?',
        ops: [['El electrón', ''], ['El protón', 'T9'], ['El neutrón', 'T9'], ['El núcleo', 'T9']],
        exp: 'El electrón tiene carga −1 y es muy liviano: el protón pesa unas 1836 veces más. Por eso casi toda la masa del átomo está en el núcleo.'
      },
      B: {
        texto: '¿Qué partícula está en el núcleo y NO tiene carga eléctrica?',
        ops: [['El neutrón', ''], ['El protón', 'T9'], ['El electrón', 'T9'], ['El ion', 'T9']],
        exp: 'El neutrón está en el núcleo y no tiene carga (0). El protón también está en el núcleo, pero es positivo (+1). El electrón es negativo (−1) y está alrededor del núcleo.'
      }
    },
    // ---- 23 (A) Qué es materia ----
    {
      tema: 'A', tipo: 'mc', chip: 'LA MATERIA', lam: null,
      A: {
        texto: '¿Cuál de estos NO es materia?',
        ops: [['La luz de un foco', ''], ['El aire dentro de un balón', 'M10'], ['El vapor de agua', 'M10'], ['Una gota de suero', 'M10']],
        exp: 'Materia es todo lo que tiene masa y ocupa un lugar en el espacio. El aire, el vapor y el suero lo cumplen, aunque algunos no se vean. La luz no tiene masa: es energía.'
      },
      B: {
        texto: '¿Cuál de estos NO es materia?',
        ops: [['El sonido de una canción', ''], ['El aire que respiras', 'M10'], ['El humo de una vela', 'M10'], ['El gas de cocina', 'M10']],
        exp: 'Materia es todo lo que tiene masa y ocupa un lugar en el espacio. El aire, el humo y el gas de cocina lo cumplen. El sonido no: es una vibración que viaja a través de la materia.'
      }
    },
    // ---- 24 (C) Fila = periodo, columna = grupo (numérica) ----
    {
      tema: 'C', tipo: 'num', chip: 'GRUPOS Y PERIODOS', lam: 54,
      A: {
        texto: 'El sodio (Na) está en la fila 3 y en la columna 1 de la tabla. ¿En qué periodo está?',
        correcta: 3, reconoce: [[1, 'P1']],
        exp: 'Los periodos son las filas y los grupos son las columnas. Fila 3: periodo 3. Columna 1: grupo 1.'
      },
      B: {
        texto: 'El bromo (Br) está en la fila 4 y en la columna 17 de la tabla. ¿En qué grupo está (numeración del 1 al 18)?',
        correcta: 17, reconoce: [[4, 'P1'], [7, 'P2b']],
        exp: 'Los grupos son las columnas y los periodos son las filas. Columna 17: grupo 17 (VIIA, los halógenos). Fila 4: periodo 4.'
      }
    },
    // ---- 25 (B) Neutrones de un isótopo de uso médico (numérica) ----
    {
      tema: 'B', tipo: 'num', chip: 'ISÓTOPOS', lam: 37,
      A: {
        vis: { not: [131, 53, 'I'] },
        texto: 'El yodo-131 (' + notTxt(131, 53, 'I') + ') se usa en medicina para tratar la tiroides. ¿Cuántos neutrones tiene?',
        correcta: 78, reconoce: [[131, 'T1'], [53, 'T1'], [184, 'T2']],
        exp: 'El 131 es el número de masa A (protones + neutrones). Z = 53 son los protones. n = A − Z = 131 − 53 = 78.'
      },
      B: {
        vis: { not: [60, 27, 'Co'] },
        texto: 'El cobalto-60 (' + notTxt(60, 27, 'Co') + ') se usa en radioterapia contra el cáncer. ¿Cuántos neutrones tiene?',
        correcta: 33, reconoce: [[60, 'T1'], [27, 'T1'], [87, 'T2']],
        exp: 'El 60 es el número de masa A (protones + neutrones). Z = 27 son los protones. n = A − Z = 60 − 27 = 33.'
      }
    }
  ];

  // ======================================================================
  // 4. GENERADOR: versión ('A' oficial, 'B' práctica) + semilla → 25 ítems con opciones barajadas
  // ======================================================================
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function barajar(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const LETRAS = 'abcd';
  const cache = {};
  function generar(version, semilla) {
    version = version === 'B' ? 'B' : 'A';
    semilla = (semilla >>> 0);
    const clave = version + ':' + semilla;
    if (cache[clave]) return cache[clave];
    const r = rng((semilla ^ (version === 'B' ? 0x0B0B5EED : 0x0A0A5EED)) >>> 0);
    const items = BANCO.map((s, i) => {
      const v = s[version];
      const it = { q: i + 1, tema: s.tema, tipo: s.tipo, chip: s.chip, lam: s.lam, texto: v.texto, vis: v.vis || null, exp: v.exp };
      if (s.tipo === 'mc') {
        const base = v.ops.map((o, j) => ({ base: j, t: o[0], codigo: o[1] }));
        it.opciones = barajar(r, base).map((o, pos) => ({ letra: LETRAS[pos], base: o.base, t: o.t, codigo: o.codigo }));
        it.correcta = it.opciones.find(o => o.base === 0).letra;
      } else {
        it.correcta = v.correcta;
        it.reconoce = v.reconoce.map(x => ({ v: x[0], codigo: x[1] }));
      }
      return it;
    });
    cache[clave] = items;
    return items;
  }

  // ======================================================================
  // 5. CORRECCIÓN Y RESUMEN
  // ======================================================================
  function fmtDada(it, v) {
    if (v == null || v === '') return '';
    if (it.tipo === 'mc') { const o = it.opciones.find(x => x.letra === v); return o ? '(' + o.letra + ') ' + o.t : String(v); }
    return String(v);
  }
  function codigoDe(it, dada) {
    if (dada == null || dada === '') return 'SR';
    if (dada === it.correcta) return '';
    if (it.tipo === 'mc') { const o = it.opciones.find(x => x.letra === dada); return o ? o.codigo : ''; }
    const rc = it.reconoce.find(x => x.v === dada);
    if (rc) return rc.codigo;
    return it.tema === 'C' ? 'P0' : 'T0';
  }
  const errTxt = (cod) => (ERR[cod] ? ERR[cod].txt : '');

  function calcular(items, respuestas, tiempos) {
    tiempos = tiempos || [];
    const porTema = { A: 0, B: 0, C: 0 };
    const cuenta = {}, orden = [];
    const filas = items.map((it, i) => {
      const dada = respuestas[i] == null ? null : respuestas[i];
      const ok = dada !== null && dada === it.correcta;
      const codigo = ok ? '' : codigoDe(it, dada);
      if (ok) porTema[it.tema]++;
      if (!ok && codigo && codigo !== 'SR') { if (!cuenta[codigo]) { cuenta[codigo] = 0; orden.push(codigo); } cuenta[codigo]++; }
      return {
        q: it.q, tema: it.tema, enunciado: it.texto, dada: fmtDada(it, dada), correcta: fmtDada(it, it.correcta),
        ok, codigo, segundos: Math.round((tiempos[i] || 0) * 10) / 10
      };
    });
    const nota = filas.filter(f => f.ok).length;
    const erroresTop = orden.slice().sort((x, y) => (cuenta[y] - cuenta[x]) || (orden.indexOf(x) - orden.indexOf(y)))
      .slice(0, 2).map(c => ({ codigo: c, veces: cuenta[c], txt: errTxt(c) }));
    return {
      filas, nota, nota10: Math.round(nota * 4) / 10, porTema, erroresTop,
      tiempoTotalSeg: Math.round(tiempos.reduce((s, t) => s + (t || 0), 0))
    };
  }

  // Respuesta de la lámina 3 («¿Cuánto de un átomo es espacio vacío?»): 'nada' | 'mitad' | 'casi-todo' | 'nose'
  function ganchoNorm() {
    const g = LS.st && LS.st.laminas && LS.st.laminas.gancho;
    if (g == null || g === '') return null;
    const s = String(g).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/casi|todo/.test(s)) return 'casi-todo';
    if (/mitad/.test(s)) return 'mitad';
    if (/no ?se|idea/.test(s)) return 'nose';
    if (/nada/.test(s)) return 'nada';
    return s.slice(0, 20);
  }
  const GANCHO_TXT = { 'nada': 'casi nada', 'mitad': 'la mitad', 'casi-todo': 'casi todo', 'nose': 'no sé' };

  function payloadDe(snap) {
    const items = generar(snap.version, snap.semilla);
    const R = calcular(items, snap.respuestas, snap.tiempos);
    let juego = null;
    try { juego = (LS.juego && LS.juego.resumen ? LS.juego.resumen() : null); } catch (e) { juego = null; }
    return {
      tipoIntento: snap.modo === 'PRACTICA' ? 'PRACTICA' : 'OFICIAL',
      version: snap.version, semilla: snap.semilla,
      nota: R.nota, nota10: R.nota10, porTema: R.porTema,
      gancho: ganchoNorm(),
      respuestas: R.filas,
      tiempoTotalSeg: R.tiempoTotalSeg,
      erroresTop: R.erroresTop,
      juego
    };
  }

  // ======================================================================
  // 6. ESTADO Y TIEMPOS
  // ======================================================================
  let root = null, tec = null, tEntrada = null, desuscribir = null;
  const ui = () => LS.ui;
  function S() { if (!LS.st.test || typeof LS.st.test !== 'object') LS.st.test = {}; return LS.st.test; }
  const guardar = () => { try { LS.guardar(); } catch (e) { } };
  const enCurso = (st) => st.fase === 'intro' || st.fase === 'preg' || st.fase === 'revision';

  function nuevoIntento(modo) {
    const st = S();
    const oficial = modo !== 'PRACTICA';
    // Oficial: versión A, orden fijo. Práctica: B la primera vez, luego alterna B/A, con otro orden de opciones.
    const version = oficial ? 'A' : ((st.practicas || 0) % 2 === 0 ? 'B' : 'A');
    let semilla = 0;
    if (!oficial) {
      semilla = ((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0) || 7919;
      if (st.practica && st.practica.semilla === semilla) semilla = (semilla + 7919) >>> 0;
    }
    Object.assign(st, {
      modo: oficial ? 'OFICIAL' : 'PRACTICA', version, semilla,
      respuestas: Array(TOTAL).fill(null), tiempos: Array(TOTAL).fill(0),
      idx: 0, fase: 'intro', inicio: null, fin: null
    });
    guardar();
  }

  function empezarReloj() { tEntrada = Date.now(); }
  function cortarReloj() {
    const st = S();
    if (tEntrada != null && st.fase === 'preg' && Array.isArray(st.tiempos)) {
      const dt = Math.min(1800, Math.max(0, (Date.now() - tEntrada) / 1000));
      st.tiempos[st.idx] = Math.round(((st.tiempos[st.idx] || 0) + dt) * 10) / 10;
    }
    tEntrada = null;
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (!root || !root.querySelector('.ts-preg')) return;
      if (document.hidden) { cortarReloj(); guardar(); } else empezarReloj();
    });
  }

  function limpiar() {
    if (tec) { try { tec.destruir(); } catch (e) { } tec = null; }
    if (desuscribir) { try { desuscribir(); } catch (e) { } desuscribir = null; }
  }

  // ======================================================================
  // 7. PANTALLAS
  // ======================================================================
  function abrir(r, o) {
    root = r; o = o || {};
    limpiar(); tEntrada = null;
    const st = S();
    // La práctica solo se abre si el intento oficial ya terminó (nunca pisa un oficial en curso).
    if (o.practica && st.oficialTerminado && !enCurso(st)) nuevoIntento('PRACTICA');
    else if (!st.fase || (st.fase === 'resultados' && !st.oficial && !st.practica)) {
      if (st.oficialTerminado && st.oficial) { st.fase = 'resultados'; st.ver = 'OFICIAL'; }
      else nuevoIntento('OFICIAL');
    }
    pintar();
  }

  function pintar() {
    limpiar();
    const st = S();
    ui().cerrarHoja(true);
    if (LS.setColor) LS.setColor('full');
    if (st.fase === 'resultados') pintarResultados();
    else if (st.fase === 'preg') pintarPregunta();
    else if (st.fase === 'revision') pintarRevision();
    else pintarIntro();
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  const insignia = (st) => st.modo === 'PRACTICA' ? '<span class="ts-insignia">PRÁCTICA</span>' : '';
  const botonesCab = (etqMapa) =>
    '<button class="btn-ico" data-a="ajustes" aria-label="Ajustes">' + ui().icon('ajustes') + '</button>' +
    '<button class="btn-ico" data-a="mapa" aria-label="' + (etqMapa || 'Ir al mapa') + '">' + ui().icon('mapa') + '</button>';

  // ---------- Intro ----------
  function pintarIntro() {
    const st = S(), practica = st.modo === 'PRACTICA';
    const hechas = (st.respuestas || []).filter(x => x != null).length;
    const correo = LS.st.usuario.correo || '';
    root.innerHTML =
      '<div class="pantalla ts ts-intro">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Test final ' + insignia(st) + '</span>' + botonesCab() + '</div>' +
      '<h1 class="ts-h1">' + (practica ? 'Modo práctica' : '25 preguntas, sin apuro') + '</h1>' +
      (practica
        ? '<p class="tinta-2">Son otros ejemplos de los mismos temas. No cambia tu resultado oficial.</p>'
        : '<div class="caja-nota ts-calma"><p><b>Esto no es para calificarte: es para que veas todo lo que ya aprendiste.</b></p><p>No hay tiempo límite. Los errores no restan: responde todas. Puedes pausar; se guarda solo.</p></div>') +
      '<ul class="ts-reglas">' +
      '<li>' + ui().icon('check') + '<span>Hay 3 temas: la materia, el átomo y la tabla periódica.</span></li>' +
      '<li>' + ui().icon('check') + '<span>Una pregunta por pantalla. Puedes ir atrás y adelante.</span></li>' +
      '<li>' + ui().icon('check') + '<span>No verás si acertaste hasta el final.</span></li>' +
      '<li>' + ui().icon('check') + '<span>Antes de terminar podrás revisar cuáles te faltan.</span></li>' +
      '</ul>' +
      (practica ? '' :
        '<div class="tarjeta ts-correo"><p class="peq tinta-2">Tu resultado y un PDF llegarán a:</p>' +
        '<p class="ts-correo-v">' + esc(correo || 'sin correo') + '</p>' +
        '<button class="btn-txt" data-a="correo">¿Está mal? Corregir correo</button></div>') +
      '<div class="esp"></div>' +
      '<button class="btn btn-pri btn-ancho" data-a="empezar">' + (hechas ? 'Seguir donde iba (' + hechas + ' de 25)' : 'Empezar') + ' ' + ui().icon('sig') + '</button>' +
      '</div>';
    root.querySelector('[data-a="empezar"]').addEventListener('click', () => {
      st.fase = 'preg'; if (!st.inicio) st.inicio = Date.now();
      guardar(); pintar();
    });
    const c = root.querySelector('[data-a="correo"]');
    if (c) c.addEventListener('click', () => corregirCorreo(() => pintar()));
    cabecera();
  }
  function cabecera() {
    const a = root.querySelector('[data-a="ajustes"]'), m = root.querySelector('[data-a="mapa"]');
    if (a) a.addEventListener('click', () => LS.app && LS.app.ajustes());
    if (m) m.addEventListener('click', () => { cortarReloj(); guardarTecleado(); guardar(); if (LS.app) LS.app.ir('hub'); });
  }

  // ---------- Pregunta (sin colores que delaten la respuesta, sin cronómetro visible) ----------
  function pintarPregunta() {
    const st = S(), items = generar(st.version, st.semilla);
    st.idx = Math.max(0, Math.min(TOTAL - 1, st.idx || 0));
    const i = st.idx, it = items[i], dada = st.respuestas[i];
    const pct = Math.round((i + 1) / TOTAL * 100);
    let cuerpo = visualHtml(it.vis);
    if (it.tipo === 'mc') {
      cuerpo += '<div class="opciones ts-opciones" role="radiogroup" aria-labelledby="ts-enun">' +
        it.opciones.map(o => '<button class="opt ts-opt" role="radio" aria-checked="' + (dada === o.letra) + '" data-l="' + o.letra + '">' +
          '<span class="ts-radio" aria-hidden="true"></span><span class="ts-letra">' + o.letra + ')</span><span class="ts-opt-t">' + esc(o.t) + '</span></button>').join('') +
        '</div>';
    } else {
      cuerpo += '<p class="ts-guardada" aria-live="polite"></p><div class="ts-tec"></div>';
    }
    root.innerHTML =
      '<div class="pantalla ts ts-preg">' +
      '<div class="ts-top">' +
      '<div class="fila"><span class="esp ts-prog">Pregunta ' + (i + 1) + ' de ' + TOTAL + ' ' + insignia(st) + '</span>' + botonesCab('Pausar e ir al mapa') + '</div>' +
      '<div class="ts-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></div></div>' +
      '<section class="tarjeta ts-card" aria-labelledby="ts-enun">' +
      '<p class="ts-enun" id="ts-enun">' + esc(it.texto) + '</p>' + cuerpo +
      '</section>' +
      '<div class="esp"></div>' +
      '<nav class="ts-nav">' +
      '<button class="btn btn-sec" data-a="ant"' + (i === 0 ? ' aria-label="Volver a las instrucciones"' : '') + '>' + ui().icon('atras') + ' Anterior</button>' +
      '<button class="btn btn-pri" data-a="sig">' + (i === TOTAL - 1 ? 'Revisar' : 'Siguiente') + ' ' + ui().icon('sig') + '</button>' +
      '</nav></div>';

    root.querySelectorAll('.ts-opt').forEach(bt => bt.addEventListener('click', () => {
      st.respuestas[i] = bt.getAttribute('data-l'); guardar();
      root.querySelectorAll('.ts-opt').forEach(x => x.setAttribute('aria-checked', String(x === bt)));
    }));
    if (it.tipo === 'num') montarTeclado(st, i, dada);
    root.querySelector('[data-a="ant"]').addEventListener('click', () => mover(-1));
    root.querySelector('[data-a="sig"]').addEventListener('click', () => mover(+1));
    cabecera();
    empezarReloj();
  }

  function montarTeclado(st, i, dada) {
    const zona = root.querySelector('.ts-tec'), aviso = root.querySelector('.ts-guardada');
    const mostrar = (v) => { aviso.innerHTML = v == null ? '' : 'Respuesta guardada: <b>' + esc(v) + '</b> · puedes cambiarla'; };
    tec = ui().teclado(zona, {
      max: 3,
      onOk(v) { st.respuestas[i] = Math.abs(v); guardar(); mostrar(Math.abs(v)); }
    });
    // Aquí no hay negativos: se oculta la tecla ± (el espacio queda vacío para no mover el teclado).
    const pm = tec.raiz.querySelector('[data-k="±"]');
    if (pm) { pm.style.visibility = 'hidden'; pm.setAttribute('aria-hidden', 'true'); pm.tabIndex = -1; }
    const b = tec.raiz.querySelector('.btn-comprobar');
    if (b) b.textContent = 'Guardar respuesta';
    if (typeof dada === 'number') {
      String(Math.abs(dada)).split('').forEach(k => tec._tecla(k));
      mostrar(dada);
    }
  }
  function guardarTecleado() {
    const st = S();
    if (tec && st.fase === 'preg') { const v = tec.valor(); if (v !== null) st.respuestas[st.idx] = Math.abs(v); }
  }
  function mover(d) {
    const st = S();
    cortarReloj(); guardarTecleado();
    if (d < 0) { if (st.idx > 0) st.idx--; else st.fase = 'intro'; }
    else { if (st.idx < TOTAL - 1) st.idx++; else st.fase = 'revision'; }
    guardar(); pintar();
  }

  // ---------- Revisión antes de enviar ----------
  function pintarRevision() {
    const st = S();
    const faltan = [];
    st.respuestas.forEach((x, i) => { if (x == null) faltan.push(i + 1); });
    const practica = st.modo === 'PRACTICA';
    root.innerHTML =
      '<div class="pantalla ts ts-revision">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Revisión ' + insignia(st) + '</span>' +
      '<button class="btn-ico" data-a="mapa" aria-label="Pausar e ir al mapa">' + ui().icon('mapa') + '</button></div>' +
      '<h1 class="ts-h1">Revisa antes de ' + (practica ? 'terminar' : 'enviar') + '</h1>' +
      '<p class="tinta-2">Respondiste <b>' + (TOTAL - faltan.length) + ' de ' + TOTAL + '</b>. Toca un número para volver a esa pregunta.</p>' +
      '<div class="ts-grid">' +
      st.respuestas.map((x, i) => '<button class="ts-celda' + (x == null ? ' falta' : '') + '" data-i="' + i + '" aria-label="Pregunta ' + (i + 1) + (x == null ? ', sin responder' : ', respondida') + '">' + (i + 1) + '</button>').join('') +
      '</div>' +
      (faltan.length
        ? '<div class="caja-ojo ts-faltan"><b>Sin responder: ' + faltan.join(', ') + '.</b><br>Los errores no restan: vale la pena responderlas todas.</div>'
        : '<div class="caja-nota">Respondiste todas. ¡Bien!</div>') +
      '<div class="esp"></div>' +
      '<div class="col ts-rev-bot">' +
      '<button class="btn btn-pri btn-ancho" data-a="enviar">' + (practica ? 'Ver mi resultado' : 'Enviar mis respuestas') + ' ' + ui().icon('sig') + '</button>' +
      '<button class="btn btn-sec btn-ancho" data-a="volver">' + ui().icon('atras') + ' Volver a la pregunta 25</button>' +
      '</div></div>';
    root.querySelectorAll('.ts-celda').forEach(b => b.addEventListener('click', () => {
      st.idx = +b.getAttribute('data-i'); st.fase = 'preg'; guardar(); pintar();
    }));
    root.querySelector('[data-a="volver"]').addEventListener('click', () => { st.idx = TOTAL - 1; st.fase = 'preg'; guardar(); pintar(); });
    root.querySelector('[data-a="enviar"]').addEventListener('click', () => {
      if (!faltan.length) { terminar(); return; }
      ui().hoja({
        tipo: 'info', icono: 'foco', titulo: 'Te faltan ' + faltan.length + (faltan.length === 1 ? ' pregunta' : ' preguntas'),
        html: '<p>Sin responder: ' + faltan.join(', ') + '. Los errores no restan, así que conviene intentarlas.</p>',
        botones: [
          { t: 'Responderlas', cls: 'btn-pri', fn: () => { st.idx = faltan[0] - 1; st.fase = 'preg'; guardar(); pintar(); } },
          { t: practica ? 'Terminar así' : 'Enviar así', cls: 'btn-sec', fn: terminar }
        ]
      });
    });
    cabecera();
  }

  // ---------- Terminar ----------
  function terminar() {
    const st = S();
    cortarReloj();
    st.fin = Date.now();
    const snap = {
      modo: st.modo, version: st.version, semilla: st.semilla,
      respuestas: st.respuestas.slice(), tiempos: st.tiempos.slice(), inicio: st.inicio, fin: st.fin
    };
    const R = calcular(generar(snap.version, snap.semilla), snap.respuestas, snap.tiempos);
    snap.nota = R.nota; snap.nota10 = R.nota10; snap.porTema = R.porTema;
    let id = null;
    try { id = LS.envio ? LS.envio.resultado(payloadDe(snap)) : null; } catch (e) { id = null; }
    snap.envioId = id;
    if (st.modo === 'PRACTICA') { st.practica = snap; st.practicas = (st.practicas || 0) + 1; st.ver = 'PRACTICA'; }
    else { st.oficial = snap; st.oficialTerminado = true; st.oficialEnviado = !!id; st.envioId = id; st.ver = 'OFICIAL'; }
    st.fase = 'resultados';
    guardar();
    pintar();
    if (R.nota >= 20) { try { ui().confeti(); ui().sonido('nivel'); } catch (e) { } }
  }

  // ---------- Resultados ----------
  function estadoTema(n, max) { const r = n / max; return r >= 0.75 ? 'dom' : r >= 0.55 ? 'casi' : 'rep'; }
  const ESTADO_TXT = { dom: 'Parece que lo dominas', casi: 'Casi', rep: 'Conviene repasar' };
  function recomendacion(nota, porTema) {
    const ord = Object.keys(TEMAS).sort((x, y) => porTema[x] / TEMAS[x].max - porTema[y] / TEMAS[y].max);
    const nom = (k) => '«' + TEMAS[k].nombre + '»';
    if (nota >= 22) return '¡Excelente! Ya tienes la base de química para el examen de admisión. La próxima clase: configuración electrónica.';
    if (nota >= 18) {
      const casi = ord.filter(k => estadoTema(porTema[k], TEMAS[k].max) !== 'dom');
      return 'Muy bien. Refuerza ' + (casi.length ? 'el tema ' + casi.map(nom).join(' y ') : 'tu tema más bajo, ' + nom(ord[0])) + ' con sus láminas y el juego, y haz el modo práctica.';
    }
    if (nota >= 13) return 'Vas por buen camino. Repasa los 2 temas más bajos, ' + nom(ord[0]) + ' y ' + nom(ord[1]) + ' (láminas y juego), y vuelve mañana al modo práctica.';
    return 'Lo importante es que lo intentaste solo. Empieza por el tema más bajo, ' + nom(ord[0]) + ', lámina por lámina, y vuelve al test en 2 días.';
  }

  // Láminas sin número fijo: se buscan por título (si no aparecen, no se muestra el botón).
  const PISTAS = {
    MODELOS: [/rutherford|modelo/i, 30, 49], 'PARTÍCULAS': [/part[ií]cula|subat/i, 30, 49],
    'LA MATERIA': [/materia/i, 10, 12], 'TU CUERPO': [/cuerpo/i, 50, 69], 'SÍMBOLOS': [/s[ií]mbolo/i, 50, 69]
  };
  const PISTA_ERR = { T7: 'MODELOS', T8: 'MODELOS', T9: 'PARTÍCULAS', M10: 'LA MATERIA', P7: 'SÍMBOLOS' };
  function buscarLamina(pista) {
    const p = PISTAS[pista];
    if (!p || !LS.laminas || !LS.laminas.tituloDe || !LS.laminas.indicePorNum) return null;
    for (let n = p[1]; n <= p[2]; n++) {
      try { if (LS.laminas.indicePorNum(n) >= 0 && p[0].test(LS.laminas.tituloDe(n))) return n; } catch (e) { return null; }
    }
    return null;
  }
  const lamItem = (it) => it.lam != null ? it.lam : buscarLamina(it.chip);
  const lamErr = (cod) => ERR[cod] ? (ERR[cod].lamina != null ? ERR[cod].lamina : buscarLamina(PISTA_ERR[cod])) : null;

  function ganchoHtml(okQ1) {
    const g = ganchoNorm(), antes = g ? (GANCHO_TXT[g] || g) : null;
    let t;
    if (g === 'casi-todo') t = okQ1 ? 'Al inicio dijiste que un átomo es «casi todo» espacio vacío. Le atinaste, y hoy sabes por qué: lo mostró el experimento de Rutherford.'
      : 'Al inicio dijiste «casi todo», y era correcto. En la pregunta 1 se cruzó: el núcleo es diminuto y el resto del átomo es casi vacío.';
    else if (g === 'nose') t = okQ1 ? 'Al inicio no sabías cuánto de un átomo es espacio vacío. Hoy respondiste bien: casi todo.'
      : 'Al inicio no lo sabías, y todavía se cruza. El átomo es casi todo espacio vacío: el núcleo es diminuto.';
    else if (antes) t = okQ1 ? 'Al inicio pensabas que el espacio vacío de un átomo era «' + esc(antes) + '». Hoy respondiste bien: es casi todo. ¡Cambiaste de idea con evidencia!'
      : 'Al inicio dijiste «' + esc(antes) + '», y en la pregunta 1 todavía se cruza. El átomo es casi todo espacio vacío: el núcleo es diminuto.';
    else t = okQ1 ? 'Respondiste bien la idea del inicio: el átomo es casi todo espacio vacío.' : 'La idea del inicio: el átomo es casi todo espacio vacío, con un núcleo diminuto.';
    const lam = okQ1 ? null : buscarLamina('MODELOS');
    return '<section class="tarjeta ts-gancho"><p class="ts-sec-t">La pregunta del inicio</p><p>' + t + '</p>' +
      (lam ? '<button class="btn-txt" data-ver="' + lam + '">Ver la lámina ' + lam + '</button>' : '') + '</section>';
  }

  function pintarResultados() {
    const st = S();
    const verP = st.ver === 'PRACTICA' && st.practica;
    const snap = verP ? st.practica : st.oficial;
    if (!snap) { st.fase = null; nuevoIntento('OFICIAL'); pintar(); return; }
    const items = generar(snap.version, snap.semilla);
    const R = calcular(items, snap.respuestas, snap.tiempos);
    const nota10 = R.nota10.toFixed(1).replace('.', ',');

    const barras = Object.keys(TEMAS).map(k => {
      const n = R.porTema[k], T = TEMAS[k], est = estadoTema(n, T.max);
      const otras = T.laminas.slice(1);
      return '<div class="ts-tema">' +
        '<div class="fila"><b class="esp">' + T.nombre + '</b><span class="ts-tema-n">' + n + '/' + T.max + '</span></div>' +
        '<div class="ts-bar" role="img" aria-label="' + n + ' de ' + T.max + '"><i style="width:' + Math.round(n / T.max * 100) + '%"></i></div>' +
        '<div class="fila ts-tema-pie"><span class="ts-estado ' + est + '">' + (est === 'dom' ? ui().icon('check') : '') + ESTADO_TXT[est] + '</span></div>' +
        (est !== 'dom' ? '<div class="fila ts-tema-bot"><button class="btn btn-sec" data-lamina="' + T.laminas[0] + '">Repasar lámina ' + T.laminas[0] + '</button>' +
          '<button class="btn btn-sec" data-juego="' + k + '">Practicar en el juego</button></div>' +
          '<p class="peq tinta-2 ts-tema-mas">También: ' + otras.map(n2 => '<button class="btn-txt" data-ver="' + n2 + '">lámina ' + n2 + '</button>').join(' ') + '</p>' : '') +
        '</div>';
    }).join('');

    const errores = R.erroresTop.length
      ? R.erroresTop.map(e => {
        const E = ERR[e.codigo] || {}, tm = E.tema && TEMAS[E.tema], lam = lamErr(e.codigo);
        return '<li class="ts-err">' + (tm ? ui().chip(tm.chip) : '') + '<p>' + esc(e.txt) + ' <span class="tinta-2">(' + e.veces + (e.veces === 1 ? ' vez' : ' veces') + ')</span></p>' +
          (lam ? '<button class="btn-txt" data-ver="' + lam + '">Ver la lámina ' + lam + '</button>' : '') + '</li>';
      }).join('')
      : '<li class="ts-err"><p>No hay un error que se repita. ¡Muy bien!</p></li>';

    const revision = items.map((it, i) => {
      const f = R.filas[i], dada = snap.respuestas[i];
      const marca = f.ok ? '<span class="ts-marca ok">' + ui().icon('check') + '<span class="sr-only">bien</span></span>'
        : dada == null ? '<span class="ts-marca sr">sin responder</span>'
          : '<span class="ts-marca miss">' + ui().icon('x') + '<span class="sr-only">casi</span></span>';
      let det = visualHtml(it.vis);
      if (it.tipo === 'mc') {
        det += '<ul class="ts-ops-rev">' + it.opciones.map(o => {
          const esOk = o.letra === it.correcta, esTuya = o.letra === dada;
          return '<li class="' + (esOk ? 'es-ok' : '') + (esTuya ? ' es-tuya' : '') + '"><b>' + o.letra + ')</b> <span>' + esc(o.t) + '</span>' +
            (esOk ? ' ' + ui().icon('check', 'ts-ico-ok') : '') + (esTuya ? ' <span class="ts-tuya">tu respuesta</span>' : '') + '</li>';
        }).join('') + '</ul>';
        if (dada == null) det += '<p>Tu respuesta: <b>sin responder</b> · Correcta: <b>' + it.correcta + ')</b></p>';
      } else {
        det += '<p>Tu respuesta: <b>' + (dada == null ? 'sin responder' : esc(dada)) + '</b> · Correcta: <b>' + it.correcta + '</b></p>';
      }
      if (!f.ok && f.codigo && f.codigo !== 'SR') det += '<p class="ts-casi">' + ui().icon('x') + '<span><b>Casi.</b> ' + esc(errTxt(f.codigo)) + '</span></p>';
      const lam = lamItem(it);
      det += '<div class="ts-exp">' + ui().chip(it.chip) + '<p>' + esc(it.exp) + '</p>' +
        (lam ? '<button class="btn-txt" data-ver="' + lam + '">Ver la lámina ' + lam + '</button>' : '') + '</div>';
      return '<details class="ts-rev"><summary><span class="ts-rev-n">' + (i + 1) + '</span><span class="ts-rev-e">' + esc(it.texto) + '</span>' + marca + '</summary><div class="ts-rev-c">' + det + '</div></details>';
    }).join('');

    const oficial = !verP;
    root.innerHTML =
      '<div class="pantalla ts ts-res">' +
      '<div class="fila ts-cab"><span class="esp ts-cab-t">Tu resultado ' + (verP ? '<span class="ts-insignia">PRÁCTICA</span>' : '') + '</span>' + botonesCab() + '</div>' +
      '<h1 class="ts-h1">¡Terminaste, ' + esc(LS.nombre()) + '!</h1>' +
      '<section class="tarjeta ts-nota-caja"><p class="ts-sec-t">Tu nota</p><p class="ts-nota"><b>' + R.nota + '/25</b> · ' + nota10 + ' sobre 10</p></section>' +
      '<section class="tarjeta"><p class="ts-sec-t">Por tema</p>' + barras + '</section>' +
      ganchoHtml(R.filas[0].ok) +
      '<section class="tarjeta"><p class="ts-sec-t">Tus 2 errores más frecuentes</p><ul class="ts-errs">' + errores + '</ul></section>' +
      '<section class="tarjeta ts-reco"><p class="ts-sec-t">Qué te recomiendo</p><p>' + recomendacion(R.nota, R.porTema) + '</p></section>' +
      '<section class="ts-revs"><p class="ts-sec-t">Revisa las 25 preguntas</p><p class="peq tinta-2">Toca una pregunta para ver la explicación.</p>' + revision + '</section>' +
      (oficial ? '<section class="tarjeta ts-envio"><p class="ts-sec-t">Tu correo con el PDF</p><div class="ts-envio-z"></div></section>'
        : '<section class="caja-nota">Modo práctica. Tu resultado oficial sigue siendo <b>' + (st.oficial ? st.oficial.nota + '/25' : '—') + '</b>.</section>') +
      '<div class="col ts-fin">' +
      '<button class="btn btn-pri btn-ancho" data-a="practica">' + ui().icon('reintentar') + ' ' + (verP ? 'Otra práctica' : 'Hacer el modo práctica') + '</button>' +
      (verP && st.oficial ? '<button class="btn btn-sec btn-ancho" data-a="veroficial">Ver mi resultado oficial</button>' : '') +
      (!verP && st.practica ? '<button class="btn btn-sec btn-ancho" data-a="verpractica">Ver mi última práctica (' + st.practica.nota + '/25)</button>' : '') +
      '<button class="btn btn-sec btn-ancho" data-a="hub">' + ui().icon('mapa') + ' Volver al mapa</button>' +
      '</div></div>';

    // Acciones
    root.querySelectorAll('[data-lamina]').forEach(b => b.addEventListener('click', () => LS.app && LS.app.ir('laminas', { num: +b.getAttribute('data-lamina') })));
    root.querySelectorAll('[data-juego]').forEach(b => b.addEventListener('click', () => LS.app && LS.app.ir('juego', { tema: b.getAttribute('data-juego') })));
    root.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', (ev) => {
      ev.preventDefault();
      const n = +b.getAttribute('data-ver');
      if (LS.laminas && LS.laminas.verLamina) LS.laminas.verLamina(n);
    }));
    const on = (sel, fn) => { const x = root.querySelector(sel); if (x) x.addEventListener('click', fn); };
    on('[data-a="practica"]', () => { if (LS.app) LS.app.ir('test', { practica: true, forzar: true }); else abrir(root, { practica: true }); });
    on('[data-a="veroficial"]', () => { st.ver = 'OFICIAL'; guardar(); pintar(); });
    on('[data-a="verpractica"]', () => { st.ver = 'PRACTICA'; guardar(); pintar(); });
    on('[data-a="hub"]', () => LS.app && LS.app.ir('hub'));
    cabecera();
    if (oficial) pintarEnvio();
  }

  // ---------- Estado del envío ----------
  function pintarEnvio() {
    const st = S(), z = root && root.querySelector('.ts-envio-z');
    if (!z) return;
    const est = LS.envio ? LS.envio.estado(st.envioId) : 'sin-configurar';
    const correo = esc(LS.st.usuario.correo || '');
    let pill;
    if (est === 'enviado') pill = '<span class="estado-envio ok">' + ui().icon('check') + ' Enviado a ' + correo + '</span>';
    else if (est === 'enviando') pill = '<span class="estado-envio">Enviando…</span>';
    else if (est === 'pendiente') pill = '<span class="estado-envio">Pendiente: se enviará cuando tengas internet</span>';
    else pill = '<span class="estado-envio">Tu resultado quedó guardado en este celular. El envío por correo todavía no está activo.</span>';
    z.innerHTML = '<p class="ts-pill" aria-live="polite">' + pill + '</p>' +
      '<p class="peq tinta-2">Correo: <b>' + correo + '</b></p>' +
      '<div class="fila ts-envio-bot"><button class="btn btn-sec" data-e="reenviar">' + ui().icon('reintentar') + ' Reenviar</button>' +
      '<button class="btn btn-sec" data-e="correo">Corregir correo</button></div>';
    z.querySelector('[data-e="reenviar"]').addEventListener('click', reenviar);
    z.querySelector('[data-e="correo"]').addEventListener('click', () => corregirCorreo((cambio) => {
      if (cambio && LS.envio && LS.envio.estado(S().envioId) === 'enviado') reenviar();
      else pintarEnvio();
    }));
    if (!desuscribir && LS.envio && LS.envio.alCambiar) desuscribir = LS.envio.alCambiar(() => {
      if (root && root.querySelector('.ts-envio-z')) pintarEnvio();
    });
  }
  function reenviar() {
    const st = S();
    if (!LS.envio || !st.oficial) return;
    if (LS.envio.estado(st.envioId) === 'enviado') {
      const p = payloadDe(st.oficial); p.reenvio = true;
      st.envioId = LS.envio.resultado(p); st.oficial.envioId = st.envioId; st.oficialEnviado = true;
      guardar();
    } else LS.envio.vaciar();
    pintarEnvio();
  }

  // ---------- Corregir correo (hoja con campo) ----------
  function corregirCorreo(alTerminar) {
    const actual = LS.st.usuario.correo || '';
    ui().hoja({
      tipo: 'info', titulo: 'Corregir correo',
      html: '<div class="campo"><label for="ts-correo-in">Tu correo</label>' +
        '<input id="ts-correo-in" type="email" autocomplete="email" inputmode="email" value="' + esc(actual) + '" placeholder="nombre@gmail.com">' +
        '<p class="error ts-correo-err" hidden>Revisa tu correo: debe verse como nombre@gmail.com</p></div>',
      botones: [
        {
          t: 'Guardar', cls: 'btn-pri', cerrar: false, fn: () => {
            const inp = document.getElementById('ts-correo-in'), er = document.querySelector('.ts-correo-err');
            const c = (inp.value || '').trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) { er.hidden = false; inp.focus(); return; }
            const cambio = c !== actual;
            LS.st.usuario.correo = c; guardar();
            ui().cerrarHoja(true);
            if (alTerminar) alTerminar(cambio);
          }
        },
        { t: 'Cancelar', cls: 'btn-txt' }
      ]
    });
  }

  // ---------- Botón Atrás del celular ----------
  function atras() {
    const st = S();
    if (!root) return false;
    if (st.fase === 'preg') { mover(-1); return true; }
    if (st.fase === 'revision') { st.idx = TOTAL - 1; st.fase = 'preg'; guardar(); pintar(); return true; }
    return false;
  }

  LS.test = {
    abrir, atras,
    _generar: generar, _calcular: calcular, _codigoDe: codigoDe, _payloadDe: payloadDe,
    _BANCO: BANCO, _TEMAS: TEMAS, _ERR: ERR, _notTxt: notTxt
  };
})();
