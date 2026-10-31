/* «Laboratorio» — juego de práctica de química (materia, átomo, tabla periódica).
   Parte 1 (LS.qmGen): lógica pura, sin DOM: bancos de tarjetas, generadores por subtipo, gemelos,
   planificador, diagnóstico error → «Casi. …», pistas en 3 escalones y solución.
   Parte 2 (LS.juego): interfaz: mapa, «Antes de jugar», barra de dominio con escudo, racha, rescate,
   fin de nivel, jefe final, reto relámpago y calentamientos.
   Usa los widgets LS.QM.* (tabla, constructor, casilla, notacion, cambiosEstado, arbolMateria) si existen. */
(function () {
  'use strict';
  const LS = window.LS = window.LS || {};
  const MENOS = '−';

  // ---------- Utilidades ----------
  const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => String(n).split('').map(d => SUPD[+d]).join('');
  const cargaSup = (q) => !q ? '' : (Math.abs(q) === 1 ? '' : sup(Math.abs(q))) + (q > 0 ? '⁺' : '⁻');
  const cargaNom = (q) => Math.abs(q) + (q > 0 ? '+' : MENOS);           // 2+ · 1−
  const conSigno = (v) => v > 0 ? '+' + v : v < 0 ? MENOS + Math.abs(v) : '0';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const rnd = (r) => (r || Math.random)();
  const pick = (r, a) => a[Math.floor(rnd(r) * a.length)];
  function mezclar(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(r) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pesado(r, pes, evitar) {
    const ks = Object.keys(pes).filter(k => pes[k] > 0 && k !== evitar);
    const lista = ks.length ? ks : Object.keys(pes);
    let tot = 0; lista.forEach(k => { tot += pes[k]; });
    let x = rnd(r) * tot;
    for (const k of lista) { x -= pes[k]; if (x < 0) return k; }
    return lista[lista.length - 1];
  }
  const E = (cod, msg) => ({ cod, msg });
  const OK = { cod: 'OK' };

  // ---------- Nombres y símbolos (Z 1–56 y 92) para textos y distractores ----------
  const SIMB = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
    'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba'];
  const NOMB = ['', 'hidrógeno', 'helio', 'litio', 'berilio', 'boro', 'carbono', 'nitrógeno', 'oxígeno', 'flúor', 'neón', 'sodio', 'magnesio',
    'aluminio', 'silicio', 'fósforo', 'azufre', 'cloro', 'argón', 'potasio', 'calcio', 'escandio', 'titanio', 'vanadio', 'cromo',
    'manganeso', 'hierro', 'cobalto', 'níquel', 'cobre', 'zinc', 'galio', 'germanio', 'arsénico', 'selenio', 'bromo', 'kriptón',
    'rubidio', 'estroncio', 'itrio', 'circonio', 'niobio', 'molibdeno', 'tecnecio', 'rutenio', 'rodio', 'paladio', 'plata', 'cadmio',
    'indio', 'estaño', 'antimonio', 'telurio', 'yodo', 'xenón', 'cesio', 'bario'];
  SIMB[92] = 'U'; NOMB[92] = 'uranio';
  const zDe = (s) => SIMB.indexOf(s);
  const art = (nombre) => (nombre === 'plata' ? 'la ' : 'el ') + nombre;
  const ELS = () => (LS.QM && LS.QM.ELEMENTOS) || [];
  function elem(z) { const L = ELS(); for (let i = 0; i < L.length; i++) if (L[i].z === z) return L[i]; return null; }
  function nomDe(z) { const e = elem(z); return (e && e.nombre ? String(e.nombre).toLowerCase() : NOMB[z]) || ('elemento ' + z); }
  function simDe(z) { const e = elem(z); return (e && e.simbolo) || SIMB[z] || '?'; }
  function masaDe(z) { const e = elem(z); return e && typeof e.masa === 'number' ? e.masa : (MASAS[z] || null); }
  function masaTxtDe(z) {
    const e = elem(z);
    if (e && e.masaTxt) return String(e.masaTxt).replace(/[[\]]/g, '');
    const m = masaDe(z); return m == null ? '' : String(m).replace('.', ',');
  }
  // Respaldo de masas atómicas (IUPAC, abreviadas) de los elementos que usa el juego
  const MASAS = { 1: 1.008, 2: 4.0026, 3: 6.94, 5: 10.81, 6: 12.011, 7: 14.007, 8: 15.999, 9: 18.998, 10: 20.18, 11: 22.99, 12: 24.305,
    13: 26.982, 15: 30.974, 16: 32.06, 17: 35.45, 19: 39.098, 20: 40.078, 26: 55.845, 27: 58.933, 28: 58.693, 29: 63.546, 30: 65.38,
    35: 79.904, 47: 107.87, 50: 118.71, 53: 126.9, 56: 137.33, 92: 238.03 };

  // ---------- Núclidos: átomos, isótopos e iones ----------
  // [símbolo, A, carga, nota]
  const nuc = (s, A, q, nota) => ({ s, Z: zDe(s), A, q: q || 0, nota: nota || '' });
  const NEUTROS = [nuc('H', 1), nuc('He', 4), nuc('Li', 7), nuc('Be', 9), nuc('B', 11), nuc('C', 12), nuc('N', 14), nuc('O', 16), nuc('F', 19),
    nuc('Ne', 20), nuc('Na', 23), nuc('Mg', 24), nuc('Al', 27), nuc('Si', 28), nuc('P', 31), nuc('S', 32), nuc('Cl', 35), nuc('Ar', 40),
    nuc('K', 39), nuc('Ca', 40, 0, 'El calcio forma tus huesos y dientes.'), nuc('Mn', 55), nuc('Fe', 56, 0, 'El hierro está en la hemoglobina de tu sangre.'),
    nuc('Co', 59), nuc('Ni', 58), nuc('Cu', 63), nuc('Zn', 64), nuc('Br', 79), nuc('Ag', 107), nuc('Sn', 120), nuc('I', 127), nuc('Ba', 138)];
  const ISOTOPOS = [nuc('H', 1, 0, 'Protio: el hidrógeno más común.'), nuc('H', 2, 0, 'Deuterio: hidrógeno con un neutrón.'), nuc('H', 3, 0, 'Tritio: hidrógeno con dos neutrones.'),
    nuc('C', 12), nuc('C', 13), nuc('C', 14, 0, 'El carbono-14 sirve para calcular la edad de restos antiguos.'), nuc('O', 16), nuc('O', 18),
    nuc('Cl', 35), nuc('Cl', 37), nuc('U', 235, 0, 'El uranio-235 es combustible nuclear.'), nuc('U', 238),
    nuc('I', 131, 0, 'El yodo-131 se usa para tratar la tiroides.'), nuc('I', 127, 0, 'El yodo-127 es el estable, el de la sal yodada.'),
    nuc('Co', 60, 0, 'El cobalto-60 se usa en radioterapia.'), nuc('K', 40, 0, 'El potasio-40 está, en pocas cantidades, en el guineo.')];
  const CATIONES = [nuc('Li', 7, 1), nuc('Na', 23, 1, 'El Na⁺ va en el suero y en tus nervios.'), nuc('K', 39, 1, 'El K⁺ ayuda a que tu corazón lata bien.'),
    nuc('Mg', 24, 2), nuc('Ca', 40, 2, 'El Ca²⁺ ayuda a que tus músculos se contraigan.'), nuc('Al', 27, 3), nuc('Fe', 56, 2, 'El Fe²⁺ está en la hemoglobina.'),
    nuc('Fe', 56, 3), nuc('Zn', 64, 2), nuc('Cu', 63, 2), nuc('Ag', 107, 1), nuc('Ba', 138, 2)];
  const ANIONES = [nuc('F', 19, -1, 'El F⁻ de la pasta dental cuida tus dientes.'), nuc('Cl', 35, -1, 'El Cl⁻ va con el Na⁺ en el suero.'), nuc('Cl', 37, -1),
    nuc('Br', 79, -1), nuc('I', 127, -1), nuc('O', 16, -2), nuc('S', 32, -2), nuc('N', 14, -3), nuc('P', 31, -3)];
  const nucTxt = (n) => sup(n.A) + n.s + cargaSup(n.q);
  const nucNom = (n) => nomDe(n.Z) + '-' + n.A;
  const nucId = (n) => n.s + n.A + (n.q ? '_' + n.q : '');
  const pne = (n) => ({ p: n.Z, n: n.A - n.Z, e: n.Z - n.q });
  const tipoNuc = (n) => n.q > 0 ? 'catión' : n.q < 0 ? 'anión' : 'átomo neutro';
  // A del isótopo más común (Z 1–20), para el constructor
  const A_COMUN = [0, 1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40];
  const nucNeutro = (Z) => nuc(SIMB[Z], A_COMUN[Z], 0);

  // =====================================================================
  // BANCOS ESCRITOS A MANO (parada 1 y 2). Cada tarjeta: [texto, clase, por qué, código de trampa?]
  // =====================================================================
  // 1a · Estado a temperatura ambiente (unos 25 °C): s, l, g
  const ESTADOS = [
    ['El mercurio (Hg)', 'l', 'Es el único metal líquido a 25 °C. Por eso se usaba en termómetros.'],
    ['El bromo (Br)', 'l', 'Es el único no metal líquido a 25 °C.'],
    ['El agua (H₂O)', 'l', ''], ['El aceite de cocina', 'l', ''], ['El alcohol antiséptico', 'l', ''], ['El vinagre', 'l', ''],
    ['La gasolina', 'l', ''], ['La miel', 'l', 'Es espesa, pero toma la forma del frasco: es líquida.'],
    ['El oxígeno (O₂)', 'g', ''], ['El nitrógeno (N₂)', 'g', ''], ['El helio (He)', 'g', ''], ['El cloro (Cl₂)', 'g', 'Es un gas amarillo verdoso.'],
    ['El dióxido de carbono (CO₂)', 'g', ''], ['El amoníaco (NH₃)', 'g', ''], ['El neón (Ne)', 'g', ''], ['El hidrógeno (H₂)', 'g', ''],
    ['El flúor (F₂)', 'g', ''], ['El aire', 'g', ''],
    ['El hierro (Fe)', 's', ''], ['La sal (NaCl)', 's', ''], ['El azúcar', 's', ''], ['El yodo (I₂)', 's', 'Es un sólido gris violeta.'],
    ['El azufre (S)', 's', ''], ['El oro (Au)', 's', ''], ['El sodio (Na)', 's', 'Es un metal blando, pero sólido.'], ['La naftalina', 's', ''],
    ['La cera de una vela', 's', ''], ['El carbono del diamante', 's', '']
  ];
  const EST_NOM = { s: 'sólido', l: 'líquido', g: 'gaseoso' };
  const EST_PROP = { s: 'tiene forma y volumen propios', l: 'toma la forma del recipiente y conserva su volumen', g: 'se esparce y llena todo el recipiente' };

  // 1b · ¿Es materia? (tiene masa y ocupa un lugar)
  const MATERIA = [
    ['El aire dentro de un globo', 'si', 'Tiene masa y ocupa lugar: un balón inflado pesa más que desinflado.'],
    ['El vapor de agua', 'si', 'Son partículas de agua: tienen masa y ocupan lugar.'],
    ['El humo de un fogón', 'si', 'Son gases y partículas diminutas: tienen masa.'],
    ['La garúa', 'si', 'Son gotitas de agua: tienen masa y ocupan lugar.'],
    ['El oxígeno que respiras', 'si', 'Es un gas: tiene masa y ocupa lugar.'],
    ['El gas de cocina', 'si', 'Es un gas: tiene masa y ocupa lugar dentro del cilindro.'],
    ['Una gota de sangre', 'si', 'Tiene masa y ocupa lugar.'],
    ['El polvo de la calle', 'si', 'Son partículas sólidas: tienen masa.'],
    ['La luz del sol', 'no', 'Es energía: no tiene masa ni ocupa lugar.'],
    ['El sonido de una canción', 'no', 'Es una vibración que viaja por el aire, pero no es materia.'],
    ['El calor de la hornilla', 'no', 'Es energía que pasa de un cuerpo a otro.'],
    ['La sombra de un árbol', 'no', 'Es falta de luz: no tiene masa.'],
    ['La señal del wifi', 'no', 'Son ondas de energía: no tienen masa.'],
    ['El arcoíris', 'no', 'Es luz separada en colores: no es materia.']
  ];

  // 1c · Clasificación: el (elemento), co (compuesto), ho (mezcla homogénea), he (mezcla heterogénea)
  const CLASIF = [
    ['El oxígeno (O₂) del tanque de un hospital', 'el', 'Solo tiene átomos de oxígeno. Van de dos en dos, pero son de un solo tipo.'],
    ['El helio de un globo que flota', 'el', 'Solo tiene átomos de helio.'],
    ['Un anillo de oro de 24 quilates', 'el', 'El oro de 24 quilates es oro puro: un solo tipo de átomo.'],
    ['El mercurio de un termómetro antiguo', 'el', 'Solo tiene átomos de mercurio (Hg).'],
    ['El cobre (Cu) de un cable eléctrico', 'el', 'El cobre de los cables es casi puro: un solo tipo de átomo.'],
    ['El ozono (O₃)', 'el', 'Solo tiene átomos de oxígeno. Tres átomos iguales unidos siguen siendo un elemento.', 'E_ELEM_COMP'],
    ['El diamante', 'el', 'Es carbono puro: un solo tipo de átomo.'],
    ['El azufre (S) en polvo', 'el', 'Solo tiene átomos de azufre.'],
    ['El nitrógeno líquido (N₂) del dermatólogo', 'el', 'Solo tiene átomos de nitrógeno. Estar líquido no cambia eso.'],
    ['El neón de un letrero luminoso', 'el', 'Solo tiene átomos de neón.'],
    ['El cloro gaseoso (Cl₂)', 'el', 'Solo tiene átomos de cloro.'],
    ['El agua destilada (H₂O)', 'co', 'Solo hay moléculas de H₂O: hidrógeno y oxígeno unidos químicamente.'],
    ['El hielo', 'co', 'Es agua (H₂O) sólida. Cambiar de estado no la vuelve otra cosa: sigue siendo compuesto.'],
    ['El vapor de agua', 'co', 'Es agua (H₂O) en gas: sigue siendo un compuesto.'],
    ['La sal pura (cloruro de sodio, NaCl)', 'co', 'Sodio y cloro unidos químicamente, siempre en la misma proporción.'],
    ['El azúcar de mesa (sacarosa, C₁₂H₂₂O₁₁)', 'co', 'Carbono, hidrógeno y oxígeno unidos en una sola sustancia.'],
    ['El dióxido de carbono (CO₂) del hielo seco', 'co', 'Carbono y oxígeno unidos químicamente.'],
    ['El bicarbonato de sodio (NaHCO₃)', 'co', 'Cuatro elementos unidos en una sola sustancia.'],
    ['La glucosa pura (C₆H₁₂O₆)', 'co', 'Carbono, hidrógeno y oxígeno unidos en una sola sustancia.'],
    ['El metano (CH₄)', 'co', 'Carbono e hidrógeno unidos químicamente.'],
    ['El amoníaco (NH₃)', 'co', 'Nitrógeno e hidrógeno unidos químicamente.'],
    ['El monóxido de carbono (CO)', 'co', 'Carbono y oxígeno unidos: es un compuesto (y es tóxico).'],
    ['El aire limpio', 'ho', 'Junta nitrógeno, oxígeno y otros gases. Se ve una sola fase.'],
    ['El suero oral', 'ho', 'Es sal y azúcar disueltas en agua. Se ve una sola fase, pero hay varias sustancias.'],
    ['El agua de la llave', 'ho', 'Trae minerales y cloro disueltos: no es agua pura.', 'E_PURA_HOMO'],
    ['El vinagre', 'ho', 'Es ácido acético disuelto en agua: una sola fase.'],
    ['El alcohol antiséptico (70 %)', 'ho', 'Es alcohol mezclado con agua: se ve una sola fase.', 'E_PURA_HOMO'],
    ['El agua oxigenada del botiquín', 'ho', 'Es peróxido de hidrógeno disuelto en mucha agua.', 'E_PURA_HOMO'],
    ['Un anillo de oro de 18 quilates', 'ho', 'Es oro mezclado con otros metales (aleación). Se ve uniforme.', 'E_PURA_HOMO'],
    ['El suero fisiológico (agua con sal)', 'ho', 'Es sal disuelta en agua: se ve una sola fase, pero son dos sustancias.'],
    ['La gasolina', 'ho', 'Junta muchas sustancias líquidas que se ven como una sola.'],
    ['El gas de cocina (GLP)', 'ho', 'Es propano y butano mezclados: se ven como un solo gas.'],
    ['El agua con azúcar bien disuelta', 'ho', 'El azúcar se reparte y ya no se ve: una sola fase.'],
    ['El agua de mar filtrada', 'ho', 'Tiene sales disueltas en el agua. Filtrada se ve una sola fase.'],
    ['El agua con aceite', 'he', 'El aceite flota encima: se ven dos fases.'],
    ['La arena con agua', 'he', 'La arena se va al fondo: se distinguen las partes.'],
    ['Una ensalada', 'he', 'Se distinguen sus partes a simple vista.'],
    ['La colada morada con trozos de fruta', 'he', 'Se ven los trozos de fruta: no es una sola fase.'],
    ['El granito', 'he', 'Se ven granos de distintos colores.'],
    ['El agua de río con lodo', 'he', 'El lodo se ve y se asienta: hay varias fases.'],
    ['El arroz con menestra', 'he', 'Se distinguen el arroz y los granos.'],
    ['La sal con pimienta', 'he', 'Se ven los granos blancos y los negros.'],
    ['El jugo de naranja con pulpa', 'he', 'Se ven los pedacitos de pulpa.'],
    ['El ceviche', 'he', 'Se distinguen sus ingredientes.'],
    ['Limaduras de hierro con arena', 'he', 'Se ven las dos partes; hasta se separan con un imán.'],
    ['El hormigón (cemento, arena y ripio)', 'he', 'Se ven las piedritas del ripio.']
  ];
  const CLASE_NOM = { el: 'elemento', co: 'compuesto', ho: 'mezcla homogénea', he: 'mezcla heterogénea', pura: 'sustancia pura', mezcla: 'mezcla' };

  // 2a · ¿Cambio físico o químico? f / q
  const FISQUIM = [
    ['Disolver azúcar en el café', 'f', 'El azúcar sigue siendo azúcar: si evaporas el agua, la recuperas.', 'E_DISOLVER'],
    ['Disolver el sobre de suero oral en agua', 'f', 'Las sales solo se reparten en el agua. No se forma nada nuevo.', 'E_DISOLVER'],
    ['Disolver sal en la sopa', 'f', 'La sal sigue ahí (la sientes). Disolver no forma sustancias nuevas.', 'E_DISOLVER'],
    ['Hervir agua para la colada', 'f', 'Las burbujas son vapor de agua: sigue siendo H₂O. No hay sustancia nueva.', 'E_BURBUJA'],
    ['Derretir hielo en un jugo', 'f', 'Cambia de estado, pero sigue siendo agua.', 'E_ESTADO_QUIM'],
    ['Secar la ropa al sol', 'f', 'El agua se evapora. No aparece una sustancia nueva.', 'E_ESTADO_QUIM'],
    ['Derretir la cera de una vela', 'f', 'La cera cambia de estado, pero sigue siendo cera.', 'E_ESTADO_QUIM'],
    ['Empañarse el espejo del baño', 'f', 'El vapor se condensa en gotitas: sigue siendo agua.', 'E_ESTADO_QUIM'],
    ['Formarse escarcha en el páramo', 'f', 'El vapor se hace hielo: cambio de estado, sigue siendo agua.', 'E_ESTADO_QUIM'],
    ['La naftalina que se achica en el ropero', 'f', 'Se sublima: pasa a gas, pero sigue siendo naftalina.', 'E_ESTADO_QUIM'],
    ['Romper un vaso', 'f', 'Cambia la forma; el vidrio sigue siendo vidrio.'],
    ['Moler maíz para hacer harina', 'f', 'El maíz queda en polvo, pero es el mismo maíz.'],
    ['Triturar una pastilla para tragarla mejor', 'f', 'Queda en polvo, pero es el mismo remedio.'],
    ['Picar cebolla', 'f', 'Solo cambia el tamaño de los pedazos.'],
    ['Aplastar una lata', 'f', 'Cambia la forma; el metal es el mismo.'],
    ['Echar gotas de colorante en un vaso de agua', 'f', 'El agua cambia de color, pero el colorante solo se reparte: no se forma una sustancia nueva.', 'E_COLOR'],
    ['Filtrar agua turbia', 'f', 'Solo separas el lodo del agua.'],
    ['Sacar sal del agua de mar en las salinas', 'f', 'El agua se va como vapor y la sal queda igual.'],
    ['Estirar una liga', 'f', 'Cambia la forma, y vuelve a la de antes.'],
    ['Se quema el arroz en la olla', 'q', 'Se pone negro y huele a quemado: se forman sustancias nuevas.'],
    ['Quemar leña en un fogón', 'q', 'Se forman ceniza, humo y CO₂, con luz y calor.'],
    ['Encender la hornilla de gas', 'q', 'El gas se quema: se forman CO₂ y agua, con llama y calor.'],
    ['Oxidarse un clavo', 'q', 'El hierro se une al oxígeno y forma óxido: sustancia nueva.'],
    ['Fermentar la chicha de jora', 'q', 'Las levaduras convierten el azúcar en alcohol y CO₂.'],
    ['Digerir los alimentos', 'q', 'Tu cuerpo rompe los alimentos en sustancias nuevas y más simples.'],
    ['Poner una pastilla efervescente en agua', 'q', 'Las burbujas son CO₂ que se forma en una reacción: es un gas nuevo.', 'E_EFERV'],
    ['El agua oxigenada burbujea en una herida', 'q', 'Se descompone en agua y oxígeno: el gas es nuevo.', 'E_EFERV'],
    ['Mezclar vinagre con bicarbonato', 'q', 'Burbujea: se forma CO₂, un gas nuevo.', 'E_EFERV'],
    ['Una manzana cortada se pone café', 'q', 'Reacciona con el oxígeno del aire: se forman sustancias nuevas.'],
    ['Tostar pan', 'q', 'La superficie se dora porque se forman sustancias nuevas.'],
    ['Una fruta que se pudre', 'q', 'Los microbios la transforman: cambia el olor y el color.'],
    ['La leche que se corta', 'q', 'Las bacterias forman ácido láctico: una sustancia nueva.'],
    ['La fotosíntesis de una planta', 'q', 'Con luz, la planta forma glucosa y oxígeno nuevos.'],
    ['La respiración de tus células', 'q', 'La glucosa y el oxígeno forman CO₂ y agua, y liberan energía.'],
    ['Un antiácido calma la acidez del estómago', 'q', 'Reacciona con el ácido y forma sustancias nuevas.'],
    ['Encender un fósforo', 'q', 'La cabeza del fósforo se quema: luz, calor y humo nuevos.'],
    ['La masa del pan crece con levadura', 'q', 'La levadura forma CO₂: por eso la masa se infla.'],
    ['El cloro blanquea una mancha de la ropa', 'q', 'Reacciona con el colorante de la mancha y lo cambia.']
  ];

  // 2b · Cambio de estado a partir de un ejemplo
  const CAMBIOS = ['fusion', 'solidificacion', 'vaporizacion', 'condensacion', 'sublimacion', 'sublimacion-regresiva'];
  const CAMBIO_NOM = { fusion: 'fusión', solidificacion: 'solidificación', vaporizacion: 'vaporización', condensacion: 'condensación', sublimacion: 'sublimación progresiva', 'sublimacion-regresiva': 'sublimación regresiva' };
  const CAMBIO_DE = { fusion: ['s', 'l'], solidificacion: ['l', 's'], vaporizacion: ['l', 'g'], condensacion: ['g', 'l'], sublimacion: ['s', 'g'], 'sublimacion-regresiva': ['g', 's'] };
  const EJ_CAMBIO = [
    ['El hielo se derrite en el vaso de colada', 'fusion'], ['El chocolate se derrite en tu mano', 'fusion'],
    ['El glaciar del Chimborazo se derrite poco a poco', 'fusion'], ['La mantequilla se derrite en la sartén', 'fusion'],
    ['La cera de la vela se derrite cerca de la llama', 'fusion'],
    ['El agua se vuelve hielo en el congelador', 'solidificacion'], ['El jugo se vuelve helado en el congelador', 'solidificacion'],
    ['La cera derretida se endurece al enfriarse', 'solidificacion'], ['La lava de un volcán se enfría y se vuelve roca', 'solidificacion'],
    ['El chocolate derretido se endurece en la refri', 'solidificacion'],
    ['Un charco se seca al sol', 'vaporizacion'], ['El agua hierve en la olla', 'vaporizacion'],
    ['El alcohol se seca en tu piel antes de una inyección', 'vaporizacion'], ['El sudor se seca en tu piel', 'vaporizacion'],
    ['El agua de mar se evapora en las salinas', 'vaporizacion'],
    ['Salen gotitas por fuera del vaso de jugo frío', 'condensacion'], ['Se empaña el espejo del baño después de la ducha', 'condensacion'],
    ['Aparece rocío en el pasto al amanecer', 'condensacion'], ['Caen gotas de la tapa de la olla', 'condensacion'],
    ['El GLP se vuelve líquido al llenar el cilindro', 'condensacion', 'Con gases como el GLP también se le dice licuación.'],
    ['El hielo seco se vuelve gas sin hacerse líquido', 'sublimacion'], ['La naftalina se achica en el ropero sin mojar nada', 'sublimacion'],
    ['En la cumbre del Chimborazo, algo de hielo pasa a vapor sin derretirse', 'sublimacion'], ['Al calentar yodo sólido sale vapor violeta', 'sublimacion'],
    ['Se forma escarcha sobre el pasto del páramo en una noche helada', 'sublimacion-regresiva'],
    ['Se forma escarcha en las paredes del congelador', 'sublimacion-regresiva'],
    ['El vapor de yodo forma cristales en la parte fría del tubo', 'sublimacion-regresiva'],
    ['Se forman copos de nieve en una nube muy fría', 'sublimacion-regresiva']
  ];
  const EST_CORTO = { s: 'sólido', l: 'líquido', g: 'gas' };
  const CAMBIO_TXT = (c) => 'de ' + EST_CORTO[CAMBIO_DE[c][0]] + ' a ' + EST_CORTO[CAMBIO_DE[c][1]];

  // =====================================================================
  // TABLA PERIÓDICA (parada 5): se lee de LS.QM.ELEMENTOS; aquí solo qué se pregunta
  // =====================================================================
  const COMUNES = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Ti', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'As', 'Br', 'Kr', 'Ag', 'Sn', 'I', 'Xe', 'Ba'].map(zDe);
  const CTX = { H: 'el más liviano de todos', He: 'infla los globos que flotan', C: 'la base de los seres vivos', N: 'forma el 78 % del aire',
    O: 'el que respiras', F: 'protege tus dientes en la pasta dental', Ne: 'brilla en los letreros', Na: 'está en la sal y en el suero',
    Mg: 'ayuda a tus músculos', Al: 'el del papel aluminio', Si: 'está en la arena y en los chips', P: 'forma tus huesos y tu ADN',
    Cl: 'desinfecta el agua de la piscina', Ar: 'rellena algunos focos', K: 'abunda en el guineo', Ca: 'forma tus huesos y dientes',
    Fe: 'está en la hemoglobina de tu sangre', Cu: 'va en los cables eléctricos', Zn: 'ayuda a tus defensas', Ag: 'se usa en joyas',
    I: 'se añade a la sal para cuidar la tiroides', Sn: 'recubre las latas de conserva' };
  const LATIN = { Na: 'natrium', K: 'kalium', Fe: 'ferrum', Cu: 'cuprum', Ag: 'argentum', Sn: 'stannum', Au: 'aurum', Hg: 'hydrargyrum', Pb: 'plumbum', Sb: 'stibium' };
  const CAT_NOM = { 'no-metal': 'un no metal', 'gas-noble': 'un gas noble', halogeno: 'un halógeno', alcalino: 'un metal alcalino',
    alcalinoterreo: 'un metal alcalinotérreo', transicion: 'un metal de transición', 'post-transicion': 'un metal del bloque p',
    metaloide: 'un metaloide', lantanido: 'un lantánido', actinido: 'un actínido' };
  const TIPO_NOM = { metal: 'un metal', 'no metal': 'un no metal', metaloide: 'un metaloide' };
  // Cada familia trae un «hint» corto que se pega al enunciado la primera vez que la palabra aparece.
  const FAM = {
    alcalino: { uno: 'metal alcalino', plural: 'metales alcalinos', g: '1 (sin el H)',
      hint: 'los del grupo 1 (sin el hidrógeno): son metales blandos y muy reactivos' },
    alcalinoterreo: { uno: 'metal alcalinotérreo', plural: 'metales alcalinotérreos', g: '2',
      hint: 'los del grupo 2: metales como el calcio de tus huesos o el magnesio' },
    halogeno: { uno: 'halógeno', plural: 'halógenos', g: '17',
      hint: 'los del grupo 17: forman sal cuando reaccionan (el cloro, el flúor…)' },
    'gas-noble': { uno: 'gas noble', plural: 'gases nobles', g: '18',
      hint: 'los del grupo 18: casi no reaccionan con nada (el helio, el neón…)' },
    transicion: { uno: 'metal de transición', plural: 'metales de transición', g: '3 al 12',
      hint: 'los metales del centro de la tabla (el hierro, el cobre, la plata, el oro…)' }
  };
  // Recuerda qué familias ya se le presentaron al estudiante para no repetir la pista.
  function marcarFamVista(clave) { const j = J(); j.famVistas = j.famVistas || {}; j.famVistas[clave] = true; guardar(); }
  function famVistaYa(clave) { const j = J(); return !!(j.famVistas && j.famVistas[clave]); }
  const FAM_ITEMS = [['alcalino', 0], ['alcalino', 3], ['alcalino', 4], ['alcalinoterreo', 0], ['alcalinoterreo', 3], ['alcalinoterreo', 4],
    ['halogeno', 0], ['halogeno', 2], ['halogeno', 4], ['halogeno', 5], ['gas-noble', 0], ['gas-noble', 1], ['gas-noble', 3],
    ['transicion', 4], ['transicion', 5]];
  const COND = {
    metaloide: { t: 'Toca un metaloide.', f: e => e.tipo === 'metaloide', cod: 'E_METALOIDE',
      ayuda: 'Los metaloides son B, Si, Ge, As, Sb y Te: forman una escalera entre metales y no metales.' },
    liquido: { t: 'Toca un elemento que sea líquido a 25 °C.', f: e => e.estado === 'líquido', cod: 'E_TIPO',
      ayuda: 'Solo hay dos: el mercurio (Hg), un metal, y el bromo (Br), un no metal.' },
    halGas: { t: 'Toca un halógeno que sea gas a 25 °C.', f: e => e.categoria === 'halogeno' && e.estado === 'gas', cod: 'E_FAMILIA',
      ayuda: 'Los halógenos están en el grupo 17. Los de arriba, flúor y cloro, son gases.' },
    metalP2: { t: 'Toca un metal del periodo 2.', f: e => e.tipo === 'metal' && e.periodo === 2, cod: 'E_TIPO',
      ayuda: 'En el periodo 2, los metales están a la izquierda: litio y berilio.' },
    noMetal16: { t: 'Toca un no metal del grupo 16.', f: e => e.tipo === 'no metal' && e.grupo === 16, cod: 'E_TIPO',
      ayuda: 'En el grupo 16, los no metales están arriba: oxígeno, azufre y selenio.' },
    gasP2: { t: 'Toca un elemento del periodo 2 que sea gas a 25 °C.', f: e => e.estado === 'gas' && e.periodo === 2, cod: 'E_TIPO',
      ayuda: 'En el periodo 2 son gases el nitrógeno, el oxígeno, el flúor y el neón.' },
    noMetalG1: { t: 'Toca el único no metal del grupo 1.', f: e => e.grupo === 1 && e.tipo === 'no metal', cod: 'E_H_ALC',
      ayuda: 'Es el hidrógeno: está en el grupo 1, pero no es un metal alcalino.' }
  };
  const AB_A = { IA: 1, IIA: 2, IIIA: 13, IVA: 14, VA: 15, VIA: 16, VIIA: 17, VIIIA: 18 };
  const AB_DE = { 1: 'IA', 2: 'IIA', 13: 'IIIA', 14: 'IVA', 15: 'VA', 16: 'VIA', 17: 'VIIA', 18: 'VIIIA' };
  const CASILLA_OPC = { masa: 'la masa atómica', Z: 'el número atómico (Z)', A: 'el número de masa (A)', n: 'el número de neutrones' };

  // =====================================================================
  // SUBTIPOS, PESOS Y CATÁLOGO DE ERRORES
  // =====================================================================
  const SUBS = {
    1: ['1a', '1b', '1c', '1d'], 2: ['2a', '2b', '2c', '2d'], 3: ['3a', '3b', '3c', '3d', '3e'],
    4: ['4a', '4b', '4c', '4d', '4e', '4f', '4g'], 5: ['5a', '5b', '5c', '5d', '5e', '5f', '5g', '5h']
  };
  const PESOS = {
    1: { '1a': 25, '1b': 10, '1c': 50, '1d': 15 }, 2: { '2a': 40, '2b': 35, '2c': 15, '2d': 10 },
    3: { '3a': 18, '3b': 20, '3c': 22, '3d': 22, '3e': 18 },
    4: { '4a': 12, '4b': 14, '4c': 20, '4d': 20, '4e': 12, '4f': 12, '4g': 10 },
    5: { '5a': 14, '5b': 10, '5c': 16, '5d': 10, '5e': 16, '5f': 12, '5g': 12, '5h': 10 }
  };
  const REQ = { 1: ['1a', '1c'], 2: ['2a', '2b', '2c'], 3: ['3a', '3b', '3c', '3d'], 4: ['4a', '4c', '4d', '4e'], 5: ['5a', '5c', '5e', '5g'], 6: [] };
  const PRIMERO = { 1: '1d', 2: '2a', 3: '3a', 4: '4a', 5: '5a' };
  const TIERS = { 1: ['1c', '1a', '2a', '2b', '4a', '5a', '5b', '3a'], 2: ['1c', '2b', '2c', '3c', '3d', '4c', '4d', '5c', '5e', '4g'], 3: ['4e', '4f', '5d', '5f', '5h', '3e', '4c', '4d', '1c', '2d'] };
  const nivelDe = (sub) => +sub[0];
  const TIPO_UI = { '1a': 'opc', '1b': 'opc', '1c': 'opc', '1d': 'opc', '2a': 'opc', '2b': 'opc', '2c': 'opc', '2d': 'opc',
    '3a': 'cons', '3b': 'cons', '3c': 'cons', '3d': 'cons', '3e': 'cons', '4a': 'pne', '4b': 'pne', '4c': 'pne', '4d': 'pne', '4e': 'pne',
    '4g': 'num', '5a': 'tabla', '5b': 'tabla', '5c': 'tabla', '5d': 'tabla', '5e': 'tabla', '5f': 'tabla', '5g': 'num', '5h': 'opc' };
  const tipoUI = (it) => it.sub === '4f' ? (it.pide === 'elem' ? 'opc' : 'num') : TIPO_UI[it.sub];
  const LAM_SUB = { '1a': 13, '1b': 13, '1c': 17, '1d': 17, '2a': 20, '2b': 14, '2c': 14, '2d': 14, '3a': 34, '3b': 37, '3c': 38, '3d': 38, '3e': 39,
    '4a': 39, '4b': 37, '4c': 38, '4d': 38, '4e': 52, '4f': 38, '4g': 35, '5a': 52, '5b': 52, '5c': 54, '5d': 54, '5e': 55, '5f': 56, '5g': 52, '5h': 52 };
  // Catálogo único: código → texto «Para cuidar» + lámina fija de la guía
  const ERR = {
    E_EST: { txt: 'Piensa en cómo está la sustancia a unos 25 °C: forma propia, forma del recipiente o se esparce.', lamina: 13 },
    E_MATERIA: { txt: 'Materia es todo lo que tiene masa y ocupa un lugar. El aire sí; la luz y el sonido no.', lamina: 13 },
    E_ELEM_COMP: { txt: 'Elemento: un solo tipo de átomo (aunque vayan unidos, como O₂ u O₃). Compuesto: átomos distintos unidos.', lamina: 17 },
    E_HOMO_HET: { txt: 'Homogénea: se ve una sola fase. Heterogénea: se distinguen sus partes.', lamina: 17 },
    E_PURA_HOMO: { txt: 'Ojo con esto: que se vea toda igual no la hace pura. El suero, el agua de la llave y el aire se ven parejos, pero por dentro tienen varias cosas mezcladas.', lamina: 17 },
    E_COMP_MEZ: { txt: 'Un compuesto tiene sus átomos UNIDOS químicamente (como el agua H₂O). Una mezcla solo tiene sustancias JUNTAS, sin unirse.', lamina: 17 },
    E_PURA_MEZ: { txt: 'Pura = una sola cosa por dentro (como el agua destilada o el oro puro). Mezcla = dos o más cosas juntas, se distingan o no.', lamina: 17 },
    E_DISOLVER: { txt: 'Disolver es un cambio físico: el azúcar o la sal siguen ahí y se recuperan al evaporar.', lamina: 20 },
    E_BURBUJA: { txt: 'Las burbujas del agua que hierve son vapor de agua, no una sustancia nueva.', lamina: 20 },
    E_ESTADO_QUIM: { txt: 'Cambiar de estado es un cambio físico: la sustancia sigue siendo la misma.', lamina: 20 },
    E_COLOR: { txt: 'No todo cambio de color es químico: pregúntate si se formó una sustancia nueva.', lamina: 20 },
    E_EFERV: { txt: 'Un gas que antes no estaba (como el CO₂ de una efervescente) es señal de cambio químico.', lamina: 20 },
    E_FISQ: { txt: 'La clave del cambio químico: se forma una sustancia nueva.', lamina: 20 },
    E_CAMBIO: { txt: 'Para nombrar un cambio de estado, mira de qué estado sale y a cuál llega.', lamina: 14 },
    E_SUBL: { txt: 'Sublimación progresiva: de sólido a gas. Regresiva: de gas a sólido (como la escarcha).', lamina: 14 },
    E_CONDEVAP: { txt: 'Vaporización: de líquido a gas. Condensación: de gas a líquido (las gotitas en el vaso frío).', lamina: 14 },
    E_FUSSOL: { txt: 'Fusión: de sólido a líquido. Solidificación: de líquido a sólido.', lamina: 14 },
    E_P: { txt: 'Los protones son el número de abajo, el chiquito (Z). Ese número decide qué elemento es.', lamina: 34 },
    E_P_A: { txt: 'Cuidado: A no son los protones. Los protones son Z (el número chico de abajo).', lamina: 34 },
    E_P_ION: { txt: 'Al hacer un ion NUNCA se tocan los protones. Solo se ganan o pierden electrones.', lamina: 38 },
    E_P_ISO: { txt: 'Si cambias los protones, cambias el elemento entero. Un isótopo cambia solo los neutrones (mismo elemento, más pesado).', lamina: 37 },
    E_N: { txt: 'Para sacar los neutrones, resta A menos Z (los dos números que aparecen junto al símbolo).', lamina: 35 },
    E_N_SUMA: { txt: 'Sumaste, pero los neutrones se sacan RESTANDO: n = A − Z.', lamina: 35 },
    E_N_A: { txt: 'A cuenta protones Y neutrones juntos. Para los neutrones solos, réstale Z.', lamina: 35 },
    E_N_Z: { txt: 'Z cuenta protones (no neutrones). Los neutrones son A − Z.', lamina: 35 },
    E_N_E: { txt: 'Los neutrones no tienen que ver con los electrones. Solo dependen del núcleo: n = A − Z.', lamina: 35 },
    E_N_ION: { txt: 'Al hacer un ion tampoco se tocan los neutrones. Solo cambian los electrones.', lamina: 38 },
    E_MASA: { txt: 'Cuidado: el número con coma que ves grande en la casilla es la masa promedio de los isótopos. Para contar neutrones necesitas A (entero), y va arriba del símbolo.', lamina: 52 },
    E_E: { txt: 'Electrones = Z − carga. En un átomo neutro, electrones = protones.', lamina: 39 },
    E_E_CATION: { txt: 'Un catión perdió electrones: e⁻ = Z − carga (se resta, no se suma).', lamina: 38 },
    E_E_ANION: { txt: 'Un anión ganó electrones: tiene más electrones que protones.', lamina: 38 },
    E_E_NEUTRO: { txt: 'Con carga, los electrones ya no son iguales a Z: la carga te dice cuántos se perdieron o ganaron.', lamina: 38 },
    E_CARGA: { txt: 'Carga = protones − electrones.', lamina: 38 },
    E_CARGA_SIGNO: { txt: 'Más protones que electrones: carga positiva. Más electrones: carga negativa.', lamina: 38 },
    E_A_E: { txt: 'Los electrones casi no tienen masa: A = p + n.', lamina: 35 },
    E_ELEM_E: { txt: 'El elemento lo definen los protones, no los electrones.', lamina: 34 },
    E_SIMBOLO: { txt: 'Revisa los símbolos: algunos vienen del latín (Na, K, Fe, Cu, Ag).', lamina: 52 },
    E_GRUPO_PERIODO: { txt: 'Grupo = columna. Periodo = fila.', lamina: 54 },
    E_FAMILIA: { txt: 'Familias: alcalinos (1), alcalinotérreos (2), halógenos (17), gases nobles (18), transición (3 a 12).', lamina: 55 },
    E_PERIODO: { txt: 'El periodo es la fila: cuéntalas de arriba hacia abajo.', lamina: 54 },
    E_H_ALC: { txt: 'El hidrógeno está en el grupo 1, pero no es metal alcalino: es un no metal gaseoso.', lamina: 56 },
    E_METALOIDE: { txt: 'Metaloides: B, Si, Ge, As, Sb y Te, en la escalera entre metales y no metales.', lamina: 56 },
    E_TIPO: { txt: 'Metales a la izquierda y al centro; no metales arriba a la derecha; metaloides en la escalera.', lamina: 56 },
    E_Z_MASA: { txt: 'En la casilla, Z es el entero de arriba; la masa atómica es la que tiene decimales.', lamina: 52 }
  };

  // =====================================================================
  // CREAR ÍTEMS (datos planos: se guardan en localStorage)
  // =====================================================================
  function indice(r, banco, sub, filtro, rec) {
    const idx = []; banco.forEach((x, i) => { if (!filtro || filtro(x)) idx.push(i); });
    if (!idx.length) return -1;
    const lib = idx.filter(i => rec.indexOf(sub + ':' + i) < 0);
    return pick(r, lib.length ? lib : idx);
  }
  function nucLibre(r, lista, sub, rec, filtro) {
    const l = lista.filter(x => !filtro || filtro(x));
    if (!l.length) return null;
    const lib = l.filter(x => rec.indexOf(sub + ':' + nucId(x)) < 0);
    return pick(r, lib.length ? lib : l);
  }
  const ISO_PARES = [['H', 1, 'H', 2], ['H', 1, 'H', 3], ['C', 12, 'C', 14], ['C', 12, 'C', 13], ['C', 14, 'C', 12], ['O', 16, 'O', 18],
    ['N', 14, 'N', 15], ['Cl', 35, 'Cl', 37], ['Mg', 24, 'Mg', 26], ['K', 39, 'K', 40], ['Li', 6, 'Li', 7]];
  const PEQ = (x) => x.Z <= 20 && x.A - x.Z <= 24 && x.Z - x.q <= 20;
  const cp = (n) => ({ s: n.s, Z: n.Z, A: n.A, q: n.q, nota: n.nota });

  function crear(sub, o) {
    o = o || {};
    const r = o.r || Math.random, rec = (o.recientes || []).concat(o.excluir ? [o.excluir] : []);
    const base = { sub, nivel: nivelDe(sub), facil: !!o.facil };
    const mismo = (campo) => (x) => o.clase == null || x[campo] === o.clase;
    let i, it = null;
    if (sub === '1a' || sub === '1b') {
      const B = sub === '1a' ? ESTADOS : MATERIA;
      i = indice(r, B, sub, x => o.clase == null || x[1] === o.clase, rec);
      it = { id: sub + ':' + i, t: B[i][0], c: B[i][1], why: B[i][2] };
    } else if (sub === '1c' || sub === '1d') {
      const f = sub === '1c' ? (x => o.clase == null || x[1] === o.clase)
        : (x => o.clase == null || (o.clase === 'pura' ? /el|co/.test(x[1]) : /ho|he/.test(x[1])));
      i = indice(r, CLASIF, sub, f, rec);
      const k = CLASIF[i];
      it = { id: sub + ':' + i, t: k[0], cc: k[1], c: sub === '1c' ? k[1] : (/el|co/.test(k[1]) ? 'pura' : 'mezcla'), why: k[2], cod: k[3] || null };
    } else if (sub === '2a') {
      i = indice(r, FISQUIM, sub, x => (o.clase == null || x[1] === o.clase) && (!o.cod || x[3] === o.cod), rec);
      if (i < 0) i = indice(r, FISQUIM, sub, x => o.clase == null || x[1] === o.clase, rec);
      const k = FISQUIM[i];
      it = { id: sub + ':' + i, t: k[0], c: k[1], why: k[2], cod: k[3] || null };
    } else if (sub === '2b') {
      i = indice(r, EJ_CAMBIO, sub, x => o.clase == null || x[1] === o.clase, rec);
      it = { id: sub + ':' + i, t: EJ_CAMBIO[i][0], c: EJ_CAMBIO[i][1], why: EJ_CAMBIO[i][2] || '' };
    } else if (sub === '2c' || sub === '2d') {
      const lib = CAMBIOS.filter(c => rec.indexOf(sub + ':' + c) < 0 && c !== o.clase);
      const c = pick(r, lib.length ? lib : CAMBIOS);
      it = { id: sub + ':' + c, c };
    } else if (sub === '3a') {
      const t = nucLibre(r, NEUTROS, sub, rec, x => x.Z <= 10);
      it = { id: sub + ':' + nucId(t), obj: cp(t), ini: t.Z <= 4 ? { p: 0, n: 0, e: 0 } : pne(nucNeutro(t.Z - 1)), iniNom: t.Z <= 4 ? '' : nucNom(nucNeutro(t.Z - 1)) };
    } else if (sub === '3b') {
      const lib = ISO_PARES.filter(x => rec.indexOf(sub + ':' + x.join('')) < 0);
      const x = pick(r, lib.length ? lib : ISO_PARES), de = nuc(x[0], x[1]), a = nuc(x[2], x[3]);
      it = { id: sub + ':' + x.join(''), obj: cp(a), ini: pne(de), iniNom: nucNom(de) };
    } else if (sub === '3c' || sub === '3d') {
      const t = nucLibre(r, sub === '3c' ? CATIONES : ANIONES, sub, rec, PEQ);
      const de = nuc(t.s, t.A, 0);
      it = { id: sub + ':' + nucId(t), obj: cp(t), ini: pne(de), iniNom: nucNom(de) };
    } else if (sub === '3e') {
      const t = nucLibre(r, NEUTROS.concat(ISOTOPOS, CATIONES, ANIONES), sub, rec, x => PEQ(x) && x.Z >= 2);
      const de = nucNeutro(t.Z - 1);
      it = { id: sub + ':' + nucId(t), obj: cp(t), ini: pne(de), iniNom: nucNom(de) };
    } else if (/^4[a-d]$/.test(sub)) {
      const L = { '4a': NEUTROS, '4b': ISOTOPOS, '4c': CATIONES, '4d': ANIONES }[sub];
      const t = nucLibre(r, L, sub, rec);
      it = { id: sub + ':' + nucId(t), nuc: cp(t) };
    } else if (sub === '4e') {
      const t = nucLibre(r, ISOTOPOS.concat(CATIONES, ANIONES, NEUTROS), sub, rec, x => { const m = masaDe(x.Z); return m != null && Math.round(m) !== x.A; });
      it = { id: sub + ':' + nucId(t), nuc: cp(t), sinZ: true };
    } else if (sub === '4f') {
      const t = nucLibre(r, CATIONES.concat(ANIONES), sub, rec);
      const pide = o.pide || pick(r, ['carga', 'A', 'elem']);
      it = { id: sub + ':' + nucId(t), nuc: cp(t), pide };
    } else if (sub === '4g') {
      const t = nucLibre(r, ISOTOPOS.concat(CATIONES, ANIONES), sub, rec);
      it = { id: sub + ':' + nucId(t), nuc: cp(t), pide: o.pide || (t.q ? pick(r, ['n', 'e']) : 'n') };
    } else if (sub === '5a' || sub === '5b' || sub === '5g' || sub === '5h') {
      const cand = COMUNES.filter(z => elem(z) && (sub < '5g' || masaDe(z) != null));
      if (!cand.length) return null;
      const lib = cand.filter(z => rec.indexOf(sub + ':' + z) < 0);
      const z = pick(r, lib.length ? lib : cand);
      it = { id: sub + ':' + z, z };
      if (sub === '5g') it.pide = pick(r, ['Z', 'p', 'e']);
      if (sub === '5h') it.que = pick(r, ['masa', 'masa', 'Z']);
    } else if (sub === '5c' || sub === '5d') {
      const cand = COMUNES.filter(z => { const e = elem(z); return e && e.grupo && e.grupo !== 3 && e.periodo && (sub === '5c' || AB_DE[e.grupo]); });
      if (!cand.length) return null;
      const lib = cand.filter(z => rec.indexOf(sub + ':' + z) < 0);
      const e = elem(pick(r, lib.length ? lib : cand));
      it = { id: sub + ':' + e.z, g: e.grupo, p: e.periodo };
      if (sub === '5d') it.ab = AB_DE[e.grupo];
    } else if (sub === '5e') {
      if (!ELS().length) return null;
      const lib = FAM_ITEMS.filter(x => rec.indexOf(sub + ':' + x.join('')) < 0);
      const x = pick(r, lib.length ? lib : FAM_ITEMS);
      it = { id: sub + ':' + x.join(''), fam: x[0], per: x[1] };
    } else if (sub === '5f') {
      if (!ELS().length) return null;
      const ks = Object.keys(COND), lib = ks.filter(k => rec.indexOf(sub + ':' + k) < 0);
      const k = pick(r, lib.length ? lib : ks);
      it = { id: sub + ':' + k, cond: k };
    }
    if (!it) return null;
    if (/^3/.test(sub)) it.experto = !!o.experto && !o.facil;
    return Object.assign(base, it);
  }
  // Uno parecido tras un error: mismo subtipo y, si se puede, la misma clase de respuesta
  function gemelo(it, o) {
    o = Object.assign({}, o || {}, { excluir: it.id });
    if (/^[12][ab]$|^1[cd]$/.test(it.sub)) { o.clase = it.c; if (it.sub === '2a' && it.cod) o.cod = it.cod; }
    if (it.sub === '4f' || it.sub === '4g') o.pide = it.pide;
    if (/^3/.test(it.sub)) o.experto = it.experto;
    let g = crear(it.sub, o);
    if (g && g.id === it.id && o.cod) g = crear(it.sub, Object.assign({}, o, { cod: null }));
    return g && g.id !== it.id ? g : crear(it.sub, Object.assign({}, o, { clase: null, cod: null }));
  }

  // =====================================================================
  // OPCIONES, RESPUESTA CORRECTA Y ACEPTACIÓN
  // =====================================================================
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const minus = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const UN = { el: 'un elemento', co: 'un compuesto', ho: 'una mezcla homogénea', he: 'una mezcla heterogénea', pura: 'una sustancia pura', mezcla: 'una mezcla' };
  const INVERSO = { fusion: 'solidificacion', solidificacion: 'fusion', vaporizacion: 'condensacion', condensacion: 'vaporizacion', sublimacion: 'sublimacion-regresiva', 'sublimacion-regresiva': 'sublimacion' };
  const pl = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const nucDe = (it) => it.nuc || it.obj;

  function opciones(it) {
    const s = it.sub, F = it.facil;
    const mk = (pares) => pares.map(p => ({ v: p[0], t: p[1] }));
    if (s === '1a') {
      const o = [['s', 'Sólido'], ['l', 'Líquido'], ['g', 'Gaseoso']];
      if (!F) return mk(o);
      const otro = { s: 'l', l: 'g', g: 'l' }[it.c];
      return mk(o.filter(p => p[0] === it.c || p[0] === otro));
    }
    if (s === '1b') return mk([['si', 'Sí, es materia'], ['no', 'No es materia']]);
    if (s === '1c') {
      const o = [['el', 'Elemento'], ['co', 'Compuesto'], ['ho', 'Mezcla homogénea'], ['he', 'Mezcla heterogénea']];
      return mk(F ? o.filter(p => /el|co/.test(it.c) ? /el|co/.test(p[0]) : /ho|he/.test(p[0])) : o);
    }
    if (s === '1d') return mk([['pura', 'Sustancia pura'], ['mezcla', 'Mezcla']]);
    if (s === '2a') return mk([['f', 'Cambio físico'], ['q', 'Cambio químico']]);
    if (s === '2b' || s === '2c') {
      const L = F ? CAMBIOS.filter(c => CAMBIO_DE[c][0] === CAMBIO_DE[it.c][0]) : CAMBIOS;
      return L.map(c => ({ v: c, t: cap(CAMBIO_NOM[c]) }));
    }
    if (s === '2d') {
      const L = F ? CAMBIOS.filter(c => c === it.c || c === INVERSO[it.c]) : CAMBIOS;
      return L.map(c => ({ v: c, t: cap(CAMBIO_TXT(c)) }));
    }
    if (s === '4f' && it.pide === 'elem') {
      const n = it.nuc, C = pne(n);
      const zs = [];
      [n.Z, C.e, n.Z + 1, n.Z - 1, C.n].forEach(z => { if (z >= 1 && z <= 56 && zs.indexOf(z) < 0) zs.push(z); });
      return zs.slice(0, F ? 2 : 4).sort((a, b) => a - b).map(z => ({ v: String(z), t: cap(nomDe(z)) + ' (' + simDe(z) + ')' }));
    }
    if (s === '5h') {
      const ks = F ? [it.que, it.que === 'masa' ? 'A' : 'masa'] : ['Z', 'masa', 'A', 'n'];
      return ['Z', 'masa', 'A', 'n'].filter(k => ks.indexOf(k) >= 0).map(k => ({ v: k, t: cap(CASILLA_OPC[k]) }));
    }
    return [];
  }

  function correcta(it) {
    const s = it.sub;
    if (/^[12]/.test(s)) return it.c;
    if (/^3|^4[a-e]$/.test(s)) return pne(nucDe(it));
    if (s === '4f') return it.pide === 'carga' ? it.nuc.q : it.pide === 'A' ? it.nuc.A : String(it.nuc.Z);
    if (s === '4g') return pne(it.nuc)[it.pide];
    if (s === '5g') return it.z;
    if (s === '5h') return it.que;
    return null; // tabla: ver acepta()
  }
  function acepta(it, e) {
    if (!e) return false;
    switch (it.sub) {
      case '5a': case '5b': return e.z === it.z;
      case '5c': return e.grupo === it.g && e.periodo === it.p;
      case '5d': return e.grupo === AB_A[it.ab] && e.periodo === it.p;
      case '5e': return e.categoria === it.fam && (!it.per || e.periodo === it.per);
      case '5f': return !!COND[it.cond] && COND[it.cond].f(e);
    }
    return false;
  }
  const correctas = (it) => ELS().filter(e => acepta(it, e));
  const listaSim = (it) => { const c = correctas(it); return c.length <= 8 ? c.map(e => e.simbolo).join(', ') : c.slice(0, 6).map(e => e.simbolo).join(', ') + '…'; };

  // =====================================================================
  // DIAGNÓSTICO: error típico → «Casi. …» (el «Casi.» lo pone la interfaz)
  // =====================================================================
  function diagCampo(n, campo, v, masa) {
    const C = pne(n), Z = n.Z, A = n.A, q = n.q;
    if (v === C[campo]) return null;
    if (campo === 'p') {
      if (v === A) return E('E_P_A', 'Pusiste A. Los protones son Z: ' + Z + '.');
      if (q && v === C.e) return E('E_P_ION', 'En un ion los protones no cambian: siguen siendo Z = ' + Z + '. Solo cambian los electrones.');
      return E('E_P', 'Los protones son iguales a Z: ' + Z + '.');
    }
    if (campo === 'n') {
      const f = 'n = A − Z = ' + A + ' − ' + Z + ' = ' + C.n + '.';
      if (masa && masa.m != null && Math.round(masa.m) !== A && v === Math.round(masa.m) - Z) return E('E_MASA', 'Usaste la masa atómica de la casilla (' + masa.txt + '). Usa A, el número de arriba del símbolo: ' + f);
      if (v === A + Z) return E('E_N_SUMA', 'Sumaste A y Z. Los neutrones se obtienen restando: ' + f);
      if (v === A) return E('E_N_A', 'A cuenta protones y neutrones juntos. Resta Z: ' + f);
      if (v === Z) return E('E_N_Z', 'Ese es Z, el número de protones. Los neutrones: ' + f);
      if (q && v === A - C.e) return E('E_N_E', 'Restaste los electrones. Los neutrones solo dependen del núcleo: ' + f);
      return E('E_N', 'Los neutrones son ' + f);
    }
    if (q > 0) {
      const f = 'e⁻ = ' + Z + ' − ' + q + ' = ' + C.e + '.';
      if (v === Z + q) return E('E_E_CATION', 'Sumaste la carga. Un catión perdió electrones: ' + f);
      if (v === Z) return E('E_E_NEUTRO', 'Ese es el átomo neutro. La carga ' + cargaNom(q) + ' dice que perdió ' + pl(q, 'electrón', 'electrones') + ': ' + f);
      return E('E_E', 'Un catión tiene menos electrones que protones: ' + f);
    }
    if (q < 0) {
      const g = -q, f = 'e⁻ = ' + Z + ' + ' + g + ' = ' + C.e + '.';
      if (v === Z - g) return E('E_E_ANION', 'Restaste. Un anión ganó electrones: ' + f);
      if (v === Z) return E('E_E_NEUTRO', 'Ese es el átomo neutro. La carga ' + cargaNom(q) + ' dice que ganó ' + pl(g, 'electrón', 'electrones') + ': ' + f);
      return E('E_E', 'Un anión tiene más electrones que protones: ' + f);
    }
    return E('E_E', 'En un átomo neutro hay tantos electrones como protones: ' + Z + '.');
  }
  function masaInfo(it) { return it.sinZ ? { m: masaDe(it.nuc.Z), txt: masaTxtDe(it.nuc.Z) } : null; }
  function diagPNE(it, r) {
    const n = nucDe(it), campos = {}, C = pne(n);
    ['p', 'n', 'e'].forEach(k => { campos[k] = r[k] === C[k]; });
    if (campos.p && campos.n && campos.e) return { cod: 'OK', campos };
    let d = null;
    const cons = /^3/.test(it.sub), nom = nucNom(n);
    if (!campos.p) {
      if (cons && it.sub === '3b') d = E('E_P_ISO', 'Cambiaste los protones, y eso cambia el elemento. Un isótopo solo cambia los neutrones.');
      else if (cons && (it.sub === '3c' || it.sub === '3d')) d = E('E_P_ION', 'Para formar un ion no se tocan los protones: siguen siendo ' + n.Z + '. Solo cambian los electrones.');
      else if (cons) d = E('E_P', cap(art(nomDe(n.Z))) + ' tiene Z = ' + n.Z + ': necesita ' + n.Z + ' protones.');
      else d = diagCampo(n, 'p', r.p, masaInfo(it));
    } else if (!campos.n) {
      if (cons && (it.sub === '3c' || it.sub === '3d')) d = E('E_N_ION', 'Para formar un ion los neutrones no cambian: deja ' + C.n + '.');
      else if (cons) d = E('E_N', cap(nom) + ' tiene A = ' + n.A + ': n = A − Z = ' + n.A + ' − ' + n.Z + ' = ' + C.n + '.');
      else d = diagCampo(n, 'n', r.n, masaInfo(it));
    } else d = diagCampo(n, 'e', r.e, null);
    return Object.assign(d, { campos });
  }
  function diagClase(it, v) {
    const c = it.c, s = it.sub;
    let cod;
    if (s === '1d') cod = c === 'mezcla' ? (it.cc === 'ho' ? 'E_PURA_HOMO' : 'E_PURA_MEZ') : 'E_COMP_MEZ';
    else if ((c === 'el' && v === 'co') || (c === 'co' && v === 'el')) cod = 'E_ELEM_COMP';
    else if ((c === 'ho' && v === 'he') || (c === 'he' && v === 'ho')) cod = 'E_HOMO_HET';
    else if (c === 'ho') cod = 'E_PURA_HOMO';
    else if (c === 'he') cod = 'E_PURA_MEZ';
    else cod = 'E_COMP_MEZ';
    return E(cod, 'Es ' + UN[c] + ', no ' + UN[v] + '. ' + it.why);
  }
  function diagCambio(it, v) {
    const c = it.c, par = [c, v].sort().join('|');
    const cod = par === 'sublimacion|sublimacion-regresiva' ? 'E_SUBL' : par === 'condensacion|vaporizacion' ? 'E_CONDEVAP' : par === 'fusion|solidificacion' ? 'E_FUSSOL' : 'E_CAMBIO';
    if (it.sub === '2d') return E(cod, 'La ' + CAMBIO_NOM[c] + ' va ' + CAMBIO_TXT(c) + '. ' + cap(CAMBIO_TXT(v)) + ' es la ' + CAMBIO_NOM[v] + '.');
    return E(cod, 'La ' + CAMBIO_NOM[v] + ' va ' + CAMBIO_TXT(v) + '. Aquí pasa ' + CAMBIO_TXT(c) + ': es ' + CAMBIO_NOM[c] + '.' + (it.why ? ' ' + it.why : ''));
  }
  function diagTabla(it, z) {
    const e = elem(z);
    if (!e) return E('E_TABLA', 'Toca una casilla de la tabla.');
    if (acepta(it, e)) return OK;
    const toc = 'Tocaste ' + e.simbolo + ' (' + nomDe(e.z) + ').';
    const s = it.sub;
    if (s === '5a' || s === '5b') {
      const t = elem(it.z), S = t.simbolo;
      return E('E_SIMBOLO', toc + ' ' + cap(art(nomDe(it.z))) + ' es ' + S + ': grupo ' + t.grupo + ', periodo ' + t.periodo + '.' + (LATIN[S] ? ' Su símbolo viene del latín ' + LATIN[S] + '.' : ''));
    }
    if (s === '5c' || s === '5d') {
      const g = s === '5c' ? it.g : AB_A[it.ab], ok = correctas(it)[0], okT = ok ? ok.simbolo + ' (' + nomDe(ok.z) + ')' : '';
      const ab = s === '5d' ? ' El grupo ' + it.ab + ' es el ' + g + ' en la numeración 1 a 18.' : '';
      if (e.grupo === it.p && e.periodo === g) return E('E_GRUPO_PERIODO', 'Cambiaste grupo y periodo. El grupo es la columna; el periodo, la fila. Es ' + okT + '.' + ab);
      if (e.periodo === it.p) return E('E_GRUPO_PERIODO', toc + ' La fila está bien, pero está en el grupo ' + (e.grupo || '—') + '. Busca la columna ' + g + ': es ' + okT + '.' + ab);
      if (e.grupo === g) return E('E_PERIODO', toc + ' La columna está bien, pero está en el periodo ' + e.periodo + '. Baja hasta la fila ' + it.p + ': es ' + okT + '.');
      return E('E_GRUPO_PERIODO', toc + ' Busca la columna ' + g + ' (grupo) y la fila ' + it.p + ' (periodo): es ' + okT + '.' + ab);
    }
    if (s === '5e') {
      const F = FAM[it.fam];
      if (it.fam === 'alcalino' && e.z === 1) return E('E_H_ALC', 'El H está en el grupo 1, pero no es metal alcalino: es un no metal gaseoso.');
      if (e.categoria !== it.fam) return E('E_FAMILIA', toc + ' Es ' + (CAT_NOM[e.categoria] || 'de otra familia') + '. Los ' + F.plural + ' están en el grupo ' + F.g + '.');
      return E('E_PERIODO', toc + ' Es ' + F.uno + ', pero está en el periodo ' + e.periodo + '. Busca en la fila ' + it.per + '.');
    }
    if (s === '5f') {
      const k = COND[it.cond];
      return E(k.cod, toc + ' Es ' + (TIPO_NOM[e.tipo] || 'otro tipo') + (e.estado ? ' y a 25 °C es ' + (e.estado === 'gas' ? 'gas' : e.estado) : '') + '. ' + k.ayuda);
    }
    return E('E_TABLA', toc);
  }
  function diag(it, v) {
    const s = it.sub, C = correcta(it);
    const t = tipoUI(it);
    if (t === 'tabla') return diagTabla(it, v);
    if (t === 'pne' || t === 'cons') return diagPNE(it, v);
    if (v === C) return OK;
    if (t === 'opc' && !opciones(Object.assign({}, it, { facil: false })).some(o => o.v === v)) return E('E_X', 'Elige una de las opciones.');
    if (s === '1a') return E('E_EST', 'A 25 °C, ' + minus(it.t) + ' es ' + EST_NOM[it.c] + ': ' + EST_PROP[it.c] + '.' + (it.why ? ' ' + it.why : ''));
    if (s === '1b') return E('E_MATERIA', (it.c === 'si' ? 'Sí es materia. ' : 'No es materia. ') + it.why);
    if (s === '1c' || s === '1d') return diagClase(it, v);
    if (s === '2a') return E(it.cod || 'E_FISQ', 'Es un cambio ' + (it.c === 'f' ? 'físico' : 'químico') + '. ' + it.why);
    if (/^2[bcd]$/.test(s)) return diagCambio(it, v);
    const n = it.nuc;
    if (s === '4f') {
      const P = pne(n);
      if (it.pide === 'carga') {
        if (v === -n.q) return E('E_CARGA_SIGNO', n.q > 0 ? 'Hay más protones (+) que electrones (−): la carga es positiva, ' + conSigno(n.q) + '.' : 'Hay más electrones (−) que protones (+): la carga es negativa, ' + conSigno(n.q) + '.');
        return E('E_CARGA', 'Carga = protones − electrones = ' + P.p + ' − ' + P.e + ' = ' + conSigno(n.q) + '.');
      }
      if (it.pide === 'A') {
        if (v === P.p + P.n + P.e) return E('E_A_E', 'Sumaste los electrones. Casi no tienen masa y no cuentan: A = p + n = ' + P.p + ' + ' + P.n + ' = ' + n.A + '.');
        return E('E_A_E', 'A = protones + neutrones = ' + P.p + ' + ' + P.n + ' = ' + n.A + '.');
      }
      const z = +v;
      if (z === P.e) return E('E_ELEM_E', 'Te guiaste por los electrones. El elemento lo definen los protones: ' + P.p + ' protones es ' + art(nomDe(n.Z)) + '.');
      return E('E_ELEM_E', 'El elemento lo definen los protones: ' + P.p + ' protones es ' + art(nomDe(n.Z)) + ' (' + n.s + ').');
    }
    if (s === '4g') return diagCampo(n, it.pide, v, null);
    if (s === '5g') {
      const m = masaDe(it.z), mt = masaTxtDe(it.z);
      if (m != null && (v === Math.round(m) || v === Math.floor(m))) return E('E_Z_MASA', 'Ese número sale de la masa atómica (' + mt + '). Z es el entero de arriba de la casilla: ' + it.z + '.');
      if (it.pide === 'e') return E('E_E', 'En un átomo neutro hay tantos electrones como protones: Z = ' + it.z + '.');
      return E(it.pide === 'p' ? 'E_P' : 'E_Z_MASA', (it.pide === 'p' ? 'Los protones son iguales a Z. ' : '') + 'Z es el número entero de arriba de la casilla: ' + it.z + '.');
    }
    if (s === '5h') {
      const mt = masaTxtDe(it.z), Z = it.z;
      if (it.que === 'masa') {
        if (v === 'A') return E('E_MASA', 'Es la masa atómica: un promedio con decimales. El número de masa A es entero y no está en la casilla.');
        if (v === 'Z') return E('E_Z_MASA', 'Z es el entero de arriba (' + Z + '). El ' + mt + ', con decimales, es la masa atómica.');
        return E('E_Z_MASA', 'La casilla no trae los neutrones. El ' + mt + ' es la masa atómica.');
      }
      if (v === 'masa') return E('E_Z_MASA', 'La masa atómica es la que tiene decimales (' + mt + '). El ' + Z + ' es el número atómico Z.');
      if (v === 'A') return E('E_MASA', 'A no está en la casilla. El ' + Z + ' es el número atómico: cuenta los protones.');
      return E('E_Z_MASA', 'El ' + Z + ' cuenta protones, no neutrones: es el número atómico Z.');
    }
    return E('E_X', 'Revisa la regla.');
  }

  // =====================================================================
  // ENUNCIADO, PISTAS (3 escalones) Y SOLUCIÓN
  // =====================================================================
  function lineasPNE(n) {
    const C = pne(n);
    const le = n.q > 0 ? 'e⁻ = Z − ' + n.q + ' = ' + n.Z + ' − ' + n.q + ' = ' + C.e + ' (perdió ' + pl(n.q, 'electrón', 'electrones') + ')'
      : n.q < 0 ? 'e⁻ = Z + ' + (-n.q) + ' = ' + n.Z + ' + ' + (-n.q) + ' = ' + C.e + ' (ganó ' + pl(-n.q, 'electrón', 'electrones') + ')'
        : 'e⁻ = Z = ' + n.Z + ' (átomo neutro)';
    return ['p⁺ = Z = ' + n.Z, 'n⁰ = A − Z = ' + n.A + ' − ' + n.Z + ' = ' + C.n, le];
  }
  const datosNuc = (n) => 'Z = ' + n.Z + ', A = ' + n.A + ', carga = ' + (n.q ? cargaNom(n.q) : '0 (átomo neutro)') + '.';
  const REGLA_PNE = 'p⁺ = Z · n⁰ = A − Z · e⁻ = Z − carga.';

  function info(it) {
    const s = it.sub, o = { q: '', tarjeta: '', nota: null, casilla: null, flecha: null, sub: '', pistas: ['', '', ''], sol: [], resp: '', lam: LAM_SUB[s], cambio: null, tipo: tipoUI(it) };
    const P = (a, b, c) => { o.pistas = [a, b, c]; };
    if (s === '1a') {
      o.q = '¿En qué estado está a temperatura ambiente (unos 25 °C)?'; o.tarjeta = it.t; o.resp = cap(EST_NOM[it.c]);
      o.sol = ['Es ' + EST_NOM[it.c] + ': ' + EST_PROP[it.c] + '.' + (it.why ? ' ' + it.why : '')];
      P('Imagina la sustancia en un día normal, a unos 25 °C.', 'Sólido: forma propia. Líquido: toma la forma del recipiente. Gas: se esparce y llena todo.', o.sol[0]);
    } else if (s === '1b') {
      o.q = '¿Es materia?'; o.tarjeta = it.t; o.resp = it.c === 'si' ? 'Sí es materia' : 'No es materia';
      o.sol = [o.resp + '. ' + it.why];
      P('Materia es todo lo que tiene masa y ocupa un lugar.', '¿Se podría pesar o encerrar en un frasco?', o.sol[0]);
    } else if (s === '1c' || s === '1d') {
      o.q = s === '1c' ? '¿Cómo se clasifica?' : '¿Es una sustancia pura o una mezcla?'; o.tarjeta = it.t; o.resp = cap(CLASE_NOM[it.c]);
      o.sol = ['Es ' + UN[it.c] + '. ' + it.why];
      const pura = /el|co|pura/.test(it.c);
      P(s === '1c' ? 'Primero decide: ¿es una sola sustancia o varias juntas?' : 'Sustancia pura: una sola sustancia, de composición fija. Mezcla: varias sustancias juntas.',
        s === '1c' ? (pura ? 'Es una sola sustancia. ¿Tiene un solo tipo de átomo o átomos distintos unidos?' : 'Son varias sustancias juntas. ¿Se ve una sola fase o se distinguen partes?')
          : 'Que se vea uniforme no basta: el suero oral se ve uniforme y es una mezcla.', o.sol[0]);
    } else if (s === '2a') {
      o.q = '¿Qué tipo de cambio es?'; o.tarjeta = it.t; o.resp = it.c === 'f' ? 'Cambio físico' : 'Cambio químico';
      o.sol = [o.resp + '. ' + it.why];
      P('Pregúntate: ¿se formó una sustancia nueva?', 'Señales de cambio químico: gas nuevo, color u olor nuevos, luz o calor, un sólido que aparece. Cambiar de estado o disolver es físico.', o.sol[0]);
    } else if (/^2[bcd]$/.test(s)) {
      const c = it.c; o.cambio = c; o.resp = s === '2d' ? cap(CAMBIO_TXT(c)) : cap(CAMBIO_NOM[c]);
      o.sol = [cap(CAMBIO_NOM[c]) + ': ' + CAMBIO_TXT(c) + '.' + (it.why ? ' ' + it.why : '')];
      if (s === '2b') { o.q = '¿Qué cambio de estado es?'; o.tarjeta = it.t; P('¿De qué estado sale y a qué estado llega?', 'Aquí pasa ' + CAMBIO_TXT(c) + '.', o.sol[0]); }
      else if (s === '2c') { o.q = '¿Cómo se llama este cambio de estado?'; o.flecha = { de: CAMBIO_DE[c][0], a: CAMBIO_DE[c][1] }; P('Fíjate de qué estado sale y a cuál llega.', 'Si salta el líquido, es una sublimación: progresiva hacia gas, regresiva hacia sólido.', o.sol[0]); }
      else { o.q = '¿De qué estado a qué estado va este cambio?'; o.tarjeta = cap(CAMBIO_NOM[c]); P('Fusión y solidificación: entre sólido y líquido. Vaporización y condensación: entre líquido y gas.', 'Las sublimaciones saltan el líquido.', o.sol[0]); }
    } else if (/^3/.test(s)) {
      const n = it.obj, C = pne(n), ion = n.s + cargaSup(n.q);
      if (s === '3a') o.q = it.iniNom ? 'Tienes un átomo neutro de ' + it.iniNom + '. Conviértelo en un átomo neutro de ' + nucNom(n) + '.' : 'Construye un átomo neutro de ' + nucNom(n) + '.';
      else if (s === '3b') o.q = 'Tienes un átomo de ' + it.iniNom + '. Conviértelo en su isótopo ' + nucNom(n) + '.';
      else if (s === '3c' || s === '3d') o.q = 'Tienes un átomo neutro de ' + it.iniNom + '. Conviértelo en el ion ' + ion + '.';
      else { o.q = 'Tienes un átomo neutro de ' + it.iniNom + '. Transfórmalo en este:'; o.nota = { A: n.A, Z: n.Z, s: n.s, q: n.q }; }
      o.resp = C.p + ' protones, ' + C.n + ' neutrones, ' + C.e + ' electrones';
      o.sol = lineasPNE(n);
      const p2 = s === '3b' ? 'Mismo elemento: no toques los protones. Cambia solo los neutrones hasta A = ' + n.A + '.'
        : s === '3c' ? 'Deja protones y neutrones como están. Quita ' + pl(n.q, 'electrón', 'electrones') + '.'
          : s === '3d' ? 'Deja protones y neutrones como están. Agrega ' + pl(-n.q, 'electrón', 'electrones') + '.'
            : datosNuc(n);
      P('Protones = Z (dicen qué elemento es). Neutrones = A − Z. Electrones = Z − carga.', p2, 'Debes llegar a ' + pl(C.p, 'protón', 'protones') + ', ' + pl(C.n, 'neutrón', 'neutrones') + ' y ' + pl(C.e, 'electrón', 'electrones') + '.');
    } else if (/^4[a-e]$/.test(s)) {
      const n = it.nuc, C = pne(n);
      o.nota = { A: n.A, Z: n.Z, s: n.s, q: n.q, sinZ: !!it.sinZ };
      o.q = it.sinZ ? 'Aquí no está escrito Z. Búscalo en la casilla y cuenta los protones, neutrones y electrones.' : 'Cuenta los protones, neutrones y electrones de este ' + (s === '4b' ? 'isótopo' : tipoNuc(n)) + '.';
      if (it.sinZ) o.casilla = n.Z;
      o.sub = n.nota || '';
      o.resp = C.p + ' protones, ' + C.n + ' neutrones, ' + C.e + ' electrones';
      o.sol = lineasPNE(n);
      P(it.sinZ ? 'Z no está escrito, pero está en la casilla: es el número entero de arriba.' : REGLA_PNE,
        it.sinZ ? 'Para los neutrones usa A (arriba del símbolo), no la masa atómica con decimales.' : 'Aquí: ' + datosNuc(n), o.sol.join(' · '));
    } else if (s === '4f') {
      const n = it.nuc, C = pne(n);
      o.q = 'Un ion tiene ' + C.p + ' protones, ' + C.n + ' neutrones y ' + C.e + ' electrones. ' +
        (it.pide === 'carga' ? '¿Cuál es su carga? (usa ± para el signo)' : it.pide === 'A' ? '¿Cuál es su número de masa A?' : '¿Qué elemento es?');
      if (it.pide === 'carga') { o.resp = conSigno(n.q); o.sol = ['Carga = ' + C.p + ' − ' + C.e + ' = ' + conSigno(n.q) + ' (' + (n.q > 0 ? 'catión' : 'anión') + ')']; P('Cada protón aporta +1 y cada electrón aporta −1.', 'Carga = protones − electrones.', o.sol[0]); }
      else if (it.pide === 'A') { o.resp = String(n.A); o.sol = ['A = p + n = ' + C.p + ' + ' + C.n + ' = ' + n.A]; P('A cuenta las partículas del núcleo.', 'A = protones + neutrones. Los electrones no cuentan.', o.sol[0]); }
      else { o.resp = cap(nomDe(n.Z)) + ' (' + n.s + ')'; o.sol = [C.p + ' protones: Z = ' + n.Z + ', es ' + art(nomDe(n.Z)) + '. Es el ion ' + n.s + cargaSup(n.q) + '.']; P('¿Qué partícula define al elemento?', 'Solo importan los protones: busca el elemento con Z = ' + C.p + '.', o.sol[0]); }
    } else if (s === '4g') {
      const n = it.nuc, L = lineasPNE(n);
      o.nota = { A: n.A, Z: n.Z, s: n.s, q: n.q };
      o.q = '¿Cuántos ' + (it.pide === 'n' ? 'neutrones' : 'electrones') + ' tiene?'; o.sub = n.nota || '';
      o.resp = String(pne(n)[it.pide]); o.sol = [it.pide === 'n' ? L[1] : L[2]];
      P(REGLA_PNE, 'Aquí: ' + datosNuc(n), o.sol[0]);
    } else if (/^5[a-f]$/.test(s)) {
      const cs = correctas(it), uno = cs.length === 1 ? cs[0] : null;
      o.resp = uno ? uno.simbolo + ' (' + nomDe(uno.z) + ')' : listaSim(it);
      if (s === '5a' || s === '5b') {
        const e = elem(it.z) || {}, S = e.simbolo || simDe(it.z), nom = nomDe(it.z);
        o.q = s === '5a' ? 'Toca ' + art(nom) + (CTX[S] ? ' (' + CTX[S] + ')' : '') + '.' : 'Toca el elemento de símbolo ' + S + '.';
        o.sol = [cap(art(nom)) + ' es ' + S + ': grupo ' + e.grupo + ', periodo ' + e.periodo + '.' + (LATIN[S] ? ' Su símbolo viene del latín ' + LATIN[S] + '.' : '')];
        P(s === '5a' ? 'El símbolo empieza con mayúscula. Algunos vienen del latín: Na, K, Fe, Cu, Ag.' : 'Busca el símbolo exacto: una mayúscula y, a veces, una minúscula.', 'Está en el periodo ' + e.periodo + ' (fila ' + e.periodo + ').', o.sol[0]);
      } else if (s === '5c' || s === '5d') {
        const g = s === '5c' ? it.g : AB_A[it.ab];
        o.q = 'Toca el elemento del grupo ' + (s === '5c' ? it.g : it.ab) + ' y periodo ' + it.p + '.';
        if (s === '5d') o.sub = 'El grupo está en la numeración A/B.';
        o.sol = ['Grupo ' + g + (s === '5d' ? ' (' + it.ab + ')' : '') + ' = columna ' + g + '; periodo ' + it.p + ' = fila ' + it.p + ': ' + o.resp + '.'];
        P(s === '5c' ? 'Grupo = columna (de arriba abajo). Periodo = fila (de izquierda a derecha).' : 'Los grupos A son los de los extremos: IA = 1, IIA = 2, IIIA = 13 … VIIIA = 18.',
          (s === '5d' ? 'El grupo ' + it.ab + ' es el ' + g + '. ' : '') + 'Busca la columna ' + g + ' y baja hasta la fila ' + it.p + '.', o.sol[0]);
      } else if (s === '5e') {
        const F = FAM[it.fam];
        o.q = it.per ? 'Toca ' + (uno ? 'el ' : 'un ') + F.uno + ' del periodo ' + it.per + '.' : 'Toca un ' + F.uno + '.';
        // Primera vez que aparece esta familia: pegamos una definición corta bajo el enunciado.
        if (F.hint && !famVistaYa(it.fam)) { o.sub = F.uno + ' = ' + F.hint + '.'; marcarFamVista(it.fam); }
        o.sol = ['Los ' + F.plural + ' están en el grupo ' + F.g + '. Sirve' + (uno ? '' : 'n') + ': ' + o.resp + '.'];
        P('Familias: alcalinos grupo 1 (sin el H), alcalinotérreos 2, halógenos 17, gases nobles 18, transición del 3 al 12.',
          'Los ' + F.plural + ' están en el grupo ' + F.g + (it.per ? '. Baja hasta la fila ' + it.per : '') + '.', o.sol[0]);
      } else {
        const k = COND[it.cond];
        o.q = k.t; o.sol = [k.ayuda];
        // También los tipos «metaloide», «halGas», «noMetal16», etc. explican su palabra clave la primera vez.
        if (!famVistaYa('cond-' + it.cond)) { o.sub = k.ayuda; marcarFamVista('cond-' + it.cond); }
        P('Metales a la izquierda y al centro; no metales arriba a la derecha; metaloides en la escalera.', k.ayuda, 'Sirve' + (uno ? '' : 'n') + ': ' + o.resp + '.');
      }
    } else if (s === '5g') {
      const nom = nomDe(it.z);
      o.casilla = it.z;
      o.q = it.pide === 'Z' ? '¿Cuál es el número atómico (Z) de este elemento?' : it.pide === 'p' ? '¿Cuántos protones tiene un átomo de ' + nom + '?' : '¿Cuántos electrones tiene un átomo neutro de ' + nom + '?';
      o.resp = String(it.z);
      o.sol = ['Z = ' + it.z + (it.pide === 'p' ? ': tiene ' + it.z + ' protones.' : it.pide === 'e' ? ': en el átomo neutro hay ' + it.z + ' electrones.' : '.')];
      P('En la casilla, Z es el número entero de arriba.', 'La masa atómica es la que tiene decimales: esa no es.', o.sol[0]);
    } else if (s === '5h') {
      const num = it.que === 'masa' ? masaTxtDe(it.z) : String(it.z);
      o.casilla = it.z; o.q = '¿Qué indica el número ' + num + ' de esta casilla?';
      o.resp = cap(CASILLA_OPC[it.que]);
      o.sol = [num + ' es ' + CASILLA_OPC[it.que] + '.' + (it.que === 'masa' ? ' Tiene decimales porque es un promedio de los isótopos.' : ' Cuenta los protones.')];
      P('Z es un número entero; la masa atómica tiene decimales.', 'El número de masa A no está en la casilla: es de un isótopo.', o.sol[0]);
    }
    return o;
  }

  // =====================================================================
  // PLANIFICADOR: qué subtipo toca
  // =====================================================================
  function elegirSub(k, est, r) {
    est = est || {}; r = r || Math.random;
    const ok = est.subtiposOk || [], items = est.items || 0;
    if (k === 6) {
      const b = est.barra || 0;
      const tier = b <= 1 ? pesado(r, { 1: 6, 2: 4 }) : b <= 3 ? pesado(r, { 2: 6, 3: 4 }) : pesado(r, { 2: 25, 3: 75 });
      const L = TIERS[tier].filter(x => x !== est.ultimoSub);
      return { sub: pick(r, L), opts: { experto: tier !== '1' } };
    }
    if (!items && !est.repitiendo) return { sub: PRIMERO[k], opts: {} };
    if (k >= 2 && items >= 3 && rnd(r) < 0.12) {
      const lv = 1 + Math.floor(rnd(r) * (k - 1));
      return { sub: pesado(r, PESOS[lv]), opts: {}, previo: true };
    }
    let pes = Object.assign({}, PESOS[k]);
    const falt = REQ[k].filter(x => ok.indexOf(x) < 0);
    if (items >= 3 && falt.length && rnd(r) < 0.55) { pes = {}; falt.forEach(x => { pes[x] = PESOS[k][x]; }); }
    const opts = {};
    if (k === 3 && (est.barra || 0) >= 3) opts.experto = rnd(r) < 0.5;
    return { sub: pesado(r, pes, est.ultimoSub), opts };
  }

  LS.qmGen = {
    SUBS, PESOS, REQ, ERR, LAM_SUB, TIERS, COMUNES, COND, FAM, FAM_ITEMS, CAMBIOS, CAMBIO_NOM, CAMBIO_DE, CAMBIO_TXT, EST_NOM, CLASE_NOM, AB_A,
    BANCOS: { ESTADOS, MATERIA, CLASIF, FISQUIM, EJ_CAMBIO }, NUC: { NEUTROS, ISOTOPOS, CATIONES, ANIONES, ISO_PARES },
    crear, gemelo, info, diag, opciones, correcta, acepta, correctas, elegirSub, tipoUI, nivelDe,
    subtiposRequeridos: (k) => (REQ[k] || []).slice(),
    pne, nucTxt, nucNom, cargaSup, cargaNom, conSigno, sup, esc, cap, elem, nomDe, simDe, masaDe, masaTxtDe
  };

  // =====================================================================
  // PARTE 2 · INTERFAZ (LS.juego)
  // =====================================================================
  const G = LS.qmGen, ui = () => LS.ui, svgs = () => LS.svg, QM = () => LS.QM || {};
  const ic = (id, cls) => LS.ui.icon(id, cls);
  const NP = 6; // paradas
  const NIV = {
    1: { nombre: 'La materia', chip: 'Estación 1', ico: 'est-materia', que: 'Estados y clasificación', lam: [17, 13], tema: 'A',
      regla: 'Una <b>sustancia pura</b> es de un solo tipo por dentro (agua destilada, oro puro). Una <b>mezcla</b> junta varias cosas: si se ve toda igual es <b>homogénea</b> (suero, aire); si se distinguen las partes es <b>heterogénea</b> (arena con agua).',
      bien: 'Separaste bien las sustancias puras de las mezclas.' },
    2: { nombre: 'Los cambios', chip: 'Estación 2', ico: 'est-cambios', que: 'Físico o químico · cambios de estado', lam: [20, 14], tema: 'A',
      regla: 'La clave es una pregunta: <b>¿apareció una sustancia nueva?</b> Si sí, cambio <b>químico</b>. Si solo cambió la forma o el estado, es <b>físico</b>. Para nombrar un cambio de estado, mira de dónde sale y a dónde llega.',
      bien: 'Reconociste bien los cambios.' },
    3: { nombre: 'Constructor de átomos', chip: 'Estación 3', ico: 'est-atomo', que: 'Arma átomos, isótopos e iones', lam: [34, 37, 38], tema: 'B',
      regla: 'Los <b>protones</b> son el DNI del átomo: si cambian, cambia el elemento. Si cambias los <b>neutrones</b>, tienes otro <b>isótopo</b> (mismo elemento, más pesado o liviano). Si cambias los <b>electrones</b>, tienes un <b>ion</b> (con carga).',
      bien: 'Armaste bien átomos, isótopos e iones.' },
    4: { nombre: 'Cuenta partículas', chip: 'Estación 4', ico: 'est-particulas', que: 'Protones, neutrones y electrones', lam: [39, 35, 38], tema: 'B',
      regla: 'Truco rápido: los <b>protones</b> son el Z (número chico de abajo). Los <b>neutrones</b> = A − Z. Los <b>electrones</b> son los mismos que los protones, salvo que el átomo tenga carga (si perdió, restas; si ganó, sumas).',
      bien: 'Contaste bien las partículas.' },
    5: { nombre: 'La tabla', chip: 'Estación 5', ico: 'est-tabla', que: 'Encuentra elementos y lee casillas', lam: [54, 52, 55, 56], tema: 'C',
      regla: 'Cada elemento vive en una casilla. La <b>columna</b> se llama <b>grupo</b> (hay 18). La <b>fila</b> se llama <b>periodo</b> (hay 7). Dentro de la casilla, el número chico de arriba es <b>Z</b> (protones); el grande con coma es la <b>masa atómica</b>.',
      bien: 'Te moviste bien por la tabla.' },
    6: { nombre: 'Jefe final', chip: 'Jefe', ico: 'est-jefe', que: 'Todo mezclado, cada vez más difícil', lam: [17, 39, 54], tema: 'ABC',
      regla: 'Preguntas de todas las paradas anteriores. Lee con calma, ubica qué te piden y aplica la regla de esa parada.',
      bien: 'Venciste al jefe del laboratorio.' }
  };
  // Elogios por SUBTIPO de pregunta (no por parada): así el mensaje siempre coincide con lo que resolviste.
  // Si un ejercicio no coincide, se cae al genérico ELOGIO_GEN.
  const ELOGIO_GEN = ['¡Eso es!', 'Ahí está.', 'Bien pensado.', 'Buena.', 'Justo.'];
  const ELOGIO_SUB = {
    // Parada 1
    '1a': ['Ese es el estado a temperatura ambiente.', 'Ahí lo tienes: bien clasificado.', 'Le pegaste al estado.'],
    '1b': ['Buen ojo: eso sí (o no) tiene masa y ocupa lugar.', 'Distinguiste materia de energía. Bien.', '¡Eso! Correcto.'],
    '1c': ['Lo clasificaste bien.', 'Distinguiste sustancia pura de mezcla, y de qué tipo.', 'Buena. Reconociste el tipo de materia.'],
    '1d': ['Pura o mezcla: bien resuelto.', 'Miraste bien lo que tenía por dentro.', 'Ese es el detalle: bien.'],
    // Parada 2
    '2a': ['Buscaste si aparecía una sustancia nueva. Así se hace.', 'Físico o químico bien decidido.', 'Ahí está: leíste el cambio bien.'],
    '2b': ['Ese es el estado de origen y llegada. Bien.', 'Viste bien de qué estado sale y a cuál llega.', 'Bien: reconociste el cambio de estado.'],
    '2c': ['Le pusiste el nombre correcto al cambio.', 'Ese es su nombre: bien.'],
    '2d': ['Bien pensado: cambiaste el estado en la dirección correcta.', 'Ahí está: dirección del cambio bien resuelta.'],
    // Parada 3
    '3a': ['Átomo neutro bien armado.', 'Protones y electrones iguales: átomo neutro.', '¡Eso! Ese es el átomo.'],
    '3b': ['Isótopo bien armado: solo cambiaron los neutrones.', 'Bien: mantuviste los protones y cambiaste los neutrones.', 'Ahí está tu isótopo.'],
    '3c': ['Ion bien armado: solo cambiaron los electrones.', 'Ahí está: la carga viene de los electrones.', 'Ese es el ion.'],
    '3d': ['Ion armado: bien.', 'Reconociste que solo cambian los electrones.', 'Ahí está tu ion.'],
    // Parada 4
    '4a': ['Ese es el número de protones.', 'Los protones son el Z: bien.'],
    '4b': ['Neutrones bien contados: A − Z.', 'Bien: restaste A menos Z.'],
    '4c': ['Ese es el número de electrones.', 'Los electrones bien contados.'],
    '4d': ['Elemento bien identificado por su Z.', 'Ese es el elemento.'],
    '4e': ['Ese es el número de masa A.', 'Bien: sumaste protones y neutrones.'],
    '4f': ['Bien: contaste con la carga en mente.', 'Ese dato es correcto.'],
    '4g': ['Bien: tres números correctos.', 'Los tres datos correctos.', 'Todo cuadra: bien.'],
    // Parada 5
    '5a': ['Lo encontraste en la tabla.', 'Ahí está el elemento.'],
    '5b': ['Ubicaste bien el símbolo.', 'Reconociste el símbolo.'],
    '5c': ['Columna y fila bien leídas.', 'Ese es el grupo y periodo.'],
    '5d': ['Ese es el grupo.', 'Bien: encontraste el grupo.'],
    '5e': ['Reconociste bien la familia.', 'Esa es la familia.'],
    '5f': ['Metal, no metal o metaloide: bien.', 'Distinguiste bien el tipo.'],
    '5g': ['Leíste bien el número atómico.', 'Bien: Z reconocido.'],
    '5h': ['Leíste bien la masa atómica.', 'Bien: la masa atómica es la que tiene coma.']
  };
  // Elogios genéricos por parada, usados solo cuando el subtipo no está mapeado o para variedad.
  const ELOGIO_NIV = {
    1: ELOGIO_GEN, 2: ELOGIO_GEN, 3: ELOGIO_GEN, 4: ELOGIO_GEN, 5: ELOGIO_GEN,
    6: ['¡Golpe al jefe!', 'Le bajaste otro punto de vida al jefe.', 'El jefe está sudando: sigue así.']
  };
  const LOGROS = {
    detective: 'Detective: corregiste tu error en el gemelo',
    sintrampa: 'Sin trampa: 5 casos engañosos de físico o químico bien resueltos',
    iones: 'Maestro de iones: 10 iones bien a la primera',
    jefe: 'Jefe del laboratorio: venciste al jefe sin modo rescate'
  };
  const ARBOL = { el: 'elementos', co: 'compuestos', ho: 'homogeneas', he: 'heterogeneas', pura: 'puras', mezcla: 'mezclas' };
  const EST_TXT = { s: 'Sólido', l: 'Líquido', g: 'Gas' };

  // ---------- Estado persistente (LS.st.juego) ----------
  function J() {
    const j = LS.st.juego || (LS.st.juego = {});
    if (!j.v) {
      Object.assign(j, {
        v: 1, nivelActual: 1, niveles: {}, itemEnCurso: null, gemeloPendiente: null, recientes: [], racha: 0, mejorRachaGlobal: 0,
        errores: {}, erroresSesion: {}, pistasUsadas: 0, logros: [], tiempoActivoMs: 0, ultimaSesion: null, relampagoRecord: 0,
        testDesbloqueado: !!j.testDesbloqueado, avisos: {}, cont: { trampasOk: 0, ionesOk: 0 }, paradaMax: 1
      });
    }
    j.avisos = j.avisos || {}; j.cont = j.cont || { trampasOk: 0, ionesOk: 0 }; j.errores = j.errores || {}; j.erroresSesion = j.erroresSesion || {};
    j.recientes = j.recientes || []; j.logros = j.logros || []; j.niveles = j.niveles || {};
    for (let k = 1; k <= NP; k++) {
      if (!j.niveles[k]) j.niveles[k] = { estado: k === 1 ? 'abierto' : 'bloqueado' };
      const nv = j.niveles[k];
      ['barra', 'items', 'itemsEval', 'aciertos1', 'estrellas', 'rescates', 'mejorRacha', 'erroresSeguidos'].forEach(c => { if (typeof nv[c] !== 'number') nv[c] = 0; });
      nv.subtiposOk = nv.subtiposOk || []; nv.fallosSub = nv.fallosSub || {}; nv.errores = nv.errores || {};
    }
    return j;
  }
  const NV = (k) => J().niveles[k];
  const hecho = (k) => { const e = NV(k).estado; return e === 'superado' || e === 'reforzar'; };
  const bloqueado = (k) => NV(k).estado === 'bloqueado';
  function guardar() { LS.guardar(); }
  function estrellasTotales() { let s = 0; for (let k = 1; k <= NP; k++) s += NV(k).estrellas || 0; return s; }
  function topErrores(obj, n) { return Object.keys(obj || {}).sort((a, b) => obj[b] - obj[a]).slice(0, n || 2); }
  const minItems = (k) => k === 6 ? 10 : 8;

  // ---------- Tiempo activo e inactividad ----------
  let ultimoToque = 0, tInact = null, enJuego = false;
  function toque() {
    const ahora = Date.now();
    if (enJuego && ultimoToque) {
      const d = ahora - ultimoToque;
      if (d > 0 && d <= 120000) J().tiempoActivoMs += d;
      if (J().tiempoActivoMs >= 45 * 60000 && !J().testDesbloqueado) { J().testDesbloqueado = true; guardar(); }
    }
    ultimoToque = ahora;
    clearTimeout(tInact);
    if (enJuego) tInact = setTimeout(inactivo, 120000);
  }
  function inactivo() {
    if (!enJuego || !root || !document.body.contains(root)) return;
    ultimoToque = 0;
    ui().hoja({ tipo: 'info', icono: 'foco', titulo: 'Tu avance está guardado. ¿Sigues?', html: '<p>Cuando quieras, seguimos donde ibas.</p>', botones: [{ t: 'Sigo aquí', cls: 'btn-pri' }] });
  }

  // ---------- Navegación interna ----------
  let root = null, vista = 'mapa', limpiezas = [], acc = {};
  function limpiar() {
    limpiezas.forEach(fn => { try { fn(); } catch (e) { } });
    limpiezas = [];
    enJuego = false; clearTimeout(tInact);
    if (ui() && ui().hayHoja()) ui().cerrarHoja(true);
  }
  function pintar(html, v) {
    limpiar();
    vista = v; acc = {};
    root.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function irApp(dest, o) { if (LS.app && LS.app.ir) LS.app.ir(dest, o); }
  function verLamina(num) {
    if (LS.laminas && LS.laminas.verLamina) LS.laminas.verLamina(num);
    else irApp('laminas', { num });
  }
  function tituloLam(num) { try { return LS.laminas && LS.laminas.tituloDe ? LS.laminas.tituloDe(num) : 'lámina ' + num; } catch (e) { return 'lámina ' + num; } }
  const chips = (l) => '<span class="chips">' + l.map(r => ui().chip(r)).join('') + '</span>';

  let primeraVez = true;
  function abrir(r, opts) {
    root = r; opts = opts || {};
    J();
    if (primeraVez) { J().erroresSesion = {}; primeraVez = false; }
    enlazarRaiz();
    LS.setColor('full');
    let k = opts.nivel || opts.parada;
    if (!k && opts.tema) { // desde el test: «Practicar en el juego» del tema A, B o C
      const ps = { A: [1, 2], B: [3, 4], C: [5] }[String(opts.tema).toUpperCase()] || [];
      const abiertas = ps.filter(x => !bloqueado(x));
      k = abiertas.filter(x => NV(x).estado === 'reforzar')[0] || abiertas.sort((a, b) => (NV(a).estrellas || 0) - (NV(b).estrellas || 0))[0];
    }
    if (k && NV(k) && !bloqueado(k)) { antesDeJugar(k); return; }
    mapa();
  }
  function atras() {
    if (!root || vista === 'mapa') return false;
    if (ui().hayHoja()) { ui().cerrarHoja(); return true; }
    mapa();
    return true;
  }
  function delegar(e) {
    if (!root || !root.querySelector('.jg')) return;
    const a = e.target.closest('[data-j]');
    if (!a || !root.contains(a)) return;
    const f = acc[a.getAttribute('data-j')] || BASE[a.getAttribute('data-j')];
    if (f) { e.preventDefault(); f(a, e); }
  }
  const BASE = {
    mapa: () => mapa(),
    hub: () => irApp('hub'),
    ajustes: () => hojaAjustes(),
    regla: () => hojaRegla(J().nivelActual)
  };
  function enlazarRaiz() {
    if (root._jgEnlazado) return;
    root._jgEnlazado = true;
    root.addEventListener('click', delegar);
    root.addEventListener('pointerdown', () => toque());
    root.addEventListener('keydown', () => toque());
  }
  function topBar(titulo, sub) {
    return '<header class="jg-top"><button class="btn-ico" data-j="mapa" aria-label="Volver al mapa">' + ic('atras') + '</button>' +
      '<div class="jg-top-t"><b>' + titulo + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>' +
      '<button class="btn-ico" data-j="ajustes" aria-label="Ajustes del juego">' + ic('ajustes') + '</button></header>';
  }

  // ---------- Dibujos (con respaldo si el widget no cargó) ----------
  const SUPC = (q) => G.cargaSup(q);
  function notaHtml(n) {
    if (QM().notacion) { try { return QM().notacion(n.A, n.sinZ ? null : n.Z, n.s, n.q || 0); } catch (e) { } }
    return '<span class="qmj-not-r"><span class="qmj-not-iz"><sup>' + n.A + '</sup><sub>' + (n.sinZ ? '&nbsp;' : n.Z) + '</sub></span><b>' + esc(n.s) + '</b>' +
      (n.q ? '<sup class="' + (n.q > 0 ? 'qmj-pos' : 'qmj-neg') + '">' + SUPC(n.q) + '</sup>' : '') + '</span>';
  }
  function casillaHtml(z, o) {
    if (QM().casilla) { try { const h = QM().casilla(z, o || { grande: true }); if (h) return h; } catch (e) { } }
    const e = G.elem(z) || {};
    return '<div class="qmj-casilla-r"><span>' + z + '</span><b>' + esc(e.simbolo || G.simDe(z)) + '</b><span>' + esc(G.nomDe(z)) + '</span><span>' + esc(G.masaTxtDe(z)) + '</span></div>';
  }
  function flechaHtml(f) {
    const caja = (x, t) => '<rect x="' + x + '" y="14" width="104" height="52" rx="14" style="fill:var(--surface);stroke:var(--ink)" stroke-width="2.5"/>' +
      '<text x="' + (x + 52) + '" y="47" text-anchor="middle" font-size="19" font-weight="800" style="fill:var(--ink)">' + t + '</text>';
    return '<svg class="qmj-flecha" viewBox="0 0 300 80" role="img" aria-label="Cambio de ' + EST_TXT[f.de].toLowerCase() + ' a ' + EST_TXT[f.a].toLowerCase() + '">' +
      caja(6, EST_TXT[f.de]) + '<path d="M118 40H176M166 30l12 10-12 10" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + caja(190, EST_TXT[f.a]) + '</svg>';
  }
  function cambiosDib(c) { try { return QM().cambiosEstado ? '<div class="dibujo jg-dib qmj-dib">' + QM().cambiosEstado(c) + '</div>' : ''; } catch (e) { return ''; } }
  function arbolDib(c) { try { return QM().arbolMateria ? '<div class="jg-dib qmj-dib">' + QM().arbolMateria(ARBOL[c] || null) + '</div>' : ''; } catch (e) { return ''; } }
  function ejemploHtml(k) {
    const li = (a) => '<ol class="qmj-sol">' + a.map(x => '<li>' + x + '</li>').join('') + '</ol>';
    if (k === 1) return '<p><b>Suero oral:</b> sal y azúcar disueltas en agua.</p>' + li(['¿Es una sola sustancia? No: es una mezcla.', '¿Se ve una sola fase? Sí: es una <b>mezcla homogénea</b>.']) + arbolDib('ho');
    if (k === 2) return '<p><b>Hervir agua:</b> las burbujas son vapor de agua.</p>' + li(['¿Hay una sustancia nueva? No: es un cambio <b>físico</b>.', 'Pasa de líquido a gas: es una <b>vaporización</b>.']) + cambiosDib('vaporizacion');
    if (k === 3) return '<p><b>Construir Na⁺</b> desde un átomo neutro de sodio-23.</p><div class="qmj-par">' + notaHtml({ A: 23, Z: 11, s: 'Na', q: 1 }) + '</div>' +
      li(['Protones: 11 (no se tocan: siguen siendo sodio).', 'Neutrones: 23 − 11 = 12 (no se tocan).', 'Electrones: tenía 11; quitas 1 y quedan 10.']);
    if (k === 4) return '<div class="qmj-par">' + notaHtml({ A: 40, Z: 20, s: 'Ca', q: 2 }) + '</div>' + li(['p⁺ = Z = 20', 'n⁰ = A − Z = 40 − 20 = 20', 'e⁻ = 20 − 2 = 18 (perdió 2 electrones)']);
    if (k === 5) return '<div class="qmj-par">' + casillaHtml(17, { etiquetas: true }) + '</div>' + li(['El cloro está en la columna 17: grupo 17 (VIIA), los halógenos.', 'Está en la fila 3: periodo 3.', 'Su Z es 17; 35,45 es su masa atómica.']);
    return li(['Al inicio llegan preguntas fáciles de todas las paradas.', 'Cuando tu barra sube, llegan las difíciles: constructor sin la carga, isótopos sin Z y grupos A/B.', 'Cada acierto le quita vida al jefe.']);
  }

  // ---------- Hojas: ajustes y «¿Qué regla era?» ----------
  function hojaAjustes() {
    const a = LS.st.ajustes;
    const sw = (id, on, txt) => '<div class="ajuste"><span>' + txt + '</span><button class="switch" role="switch" data-sw="' + id + '" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + txt + '"></button></div>';
    const h = ui().hoja({
      tipo: 'info', icono: 'ajustes', titulo: 'Ajustes del juego',
      html: sw('sonido', a.sonido, 'Sonido') + sw('mov', a.menosAnimaciones, 'Menos animaciones') +
        '<div class="col" style="margin-top:12px">' +
        (LS.app && LS.app.glosario ? '<button class="btn btn-sec btn-ancho" data-h="glosario">Glosario de palabras</button>' : '') +
        (LS.app && LS.app.ajustes ? '<button class="btn btn-txt" data-h="mas">Más ajustes (tema claro u oscuro)</button>' : '') + '</div>',
      botones: [{ t: 'Listo', cls: 'btn-pri' }]
    });
    h.addEventListener('click', e => {
      const s = e.target.closest('[data-sw]');
      if (s) {
        const on = s.getAttribute('aria-checked') !== 'true';
        s.setAttribute('aria-checked', on ? 'true' : 'false');
        if (s.getAttribute('data-sw') === 'sonido') { LS.st.ajustes.sonido = on; if (on) ui().sonido('ok'); }
        else { LS.st.ajustes.menosAnimaciones = on; if (LS.aplicarAjustes) LS.aplicarAjustes(); }
        guardar(); return;
      }
      const b = e.target.closest('[data-h]'); if (!b) return;
      const q = b.getAttribute('data-h');
      ui().cerrarHoja(true);
      if (q === 'glosario') LS.app.glosario(); else if (q === 'mas') LS.app.ajustes();
    });
  }
  function hojaRegla(k) {
    k = k || 1;
    const m = NIV[k];
    ui().hoja({
      tipo: 'info', icono: 'foco', titulo: '¿Qué regla era?',
      html: chips([m.chip]) + '<p class="jg-regla">' + esc(m.regla) + '</p><div class="qmj-ej">' + ejemploHtml(k) + '</div>',
      botones: [{ t: 'Seguir jugando', cls: 'btn-pri' }, { t: 'Ver la lámina', cls: 'btn-sec', fn: () => setTimeout(() => verLamina(m.lam[0]), 0) }]
    });
  }

  // ---------- Mapa «Tu laboratorio» ----------
  function mapa() {
    const j = J();
    LS.setColor('full');
    const todas = [1, 2, 3, 4, 5, 6];
    const vuelve = j.ultimaSesion && j.ultimaSesion !== LS.hoy() && todas.some(hecho);
    const nodo = (k) => {
      const nv = NV(k), e = nv.estado, act = k === j.nivelActual && e === 'abierto';
      const circ = e === 'bloqueado' ? ic('candado') : e === 'superado' ? ic('check') : '<b>' + k + '</b>';
      const extra = e === 'superado' ? svgs().estrellas(nv.estrellas || 0, 3) : e === 'reforzar' ? '<em class="jg-reforzar">por reforzar</em>' : e === 'abierto' && nv.items ? '<em>barra ' + nv.barra + '/5</em>' : '';
      return '<li class="jg-paso est-' + e + (act ? ' actual' : '') + (k === 6 ? ' qmj-jefe' : '') + '"><button class="jg-nodo" data-j="nodo" data-k="' + k + '" aria-label="Parada ' + k + ': ' + NIV[k].nombre + ', ' + (e === 'reforzar' ? 'por reforzar' : e) + '">' +
        '<span class="jg-circ">' + circ + '</span><span class="jg-nodo-txt"><b>' + k + ' · ' + NIV[k].nombre + '</b><span>' + esc(NIV[k].que) + '</span>' + extra + '</span></button></li>';
    };
    const re = hecho(6) ? 'abierto' : 'bloqueado', te = j.testDesbloqueado ? 'abierto' : 'bloqueado';
    const esp = (e, id, circ, t1, t2, lbl) => '<li class="jg-paso jg-esp est-' + e + '"><button class="jg-nodo" data-j="' + id + '" aria-label="' + lbl + '"><span class="jg-circ">' + circ + '</span><span class="jg-nodo-txt"><b>' + t1 + '</b><span>' + t2 + '</span></span></button></li>';
    pintar('<div class="pantalla jg jg-mapa">' +
      '<header class="jg-top"><button class="btn-ico" data-j="hub" aria-label="Volver al inicio">' + ic('atras') + '</button>' +
      '<div class="jg-top-t"><b>Tu laboratorio</b><span>Laboratorio · ' + esc(LS.nombre()) + '</span></div>' +
      '<button class="btn-ico" data-j="ajustes" aria-label="Ajustes del juego">' + ic('ajustes') + '</button></header>' +
      '<div class="jg-marcador"><span class="jg-pill">' + svgs().estrellas(1, 1) + ' Estrellas ' + estrellasTotales() + '/18</span>' +
      '<span class="jg-pill jg-pill-rayo">' + ic('rayo', 'jg-rayo') + ' Mejor racha ' + (j.mejorRachaGlobal || 0) + '</span></div>' +
      (vuelve ? '<div class="tarjeta jg-vuelta"><p><b>¡Bienvenido de vuelta, ' + esc(LS.nombre()) + '!</b> Ibas en la parada ' + j.nivelActual + ', barra ' + NV(j.nivelActual).barra + '/5.</p>' +
        '<p class="peq tinta-2">Primero calentamos con 5 ejercicios de lo que ya hiciste. No cuentan para la barra.</p>' +
        '<div class="col"><button class="btn btn-pri btn-ancho" data-j="regreso">Calentar (5 ejercicios)</button>' +
        '<button class="btn btn-txt" data-j="sincalentar">Seguir sin calentar</button></div></div>' : '') +
      (j.testDesbloqueado && !todas.every(hecho) ? '<div class="caja-nota jg-nota-test">Puedes ir al test ahora o seguir practicando la parada ' + j.nivelActual + '.</div>' : '') +
      '<ol class="jg-camino">' + todas.map(nodo).join('') +
      esp(re, 'relampago', re === 'bloqueado' ? ic('candado') : ic('rayo'), 'Reto relámpago', re === 'bloqueado' ? 'Se abre al vencer al jefe final' : '90 segundos · récord: ' + (j.relampagoRecord || 0), 'Reto relámpago, ' + re) +
      esp(te, 'test', te === 'bloqueado' ? ic('candado') : ic('sig'), 'Test final (25 preguntas)', te === 'bloqueado' ? 'Se abre al terminar las 6 paradas (o tras 45 min de juego)' : 'Sin tiempo límite. ¡Ya puedes!', 'Test final, ' + te) +
      '</ol></div>', 'mapa');
    acc = {
      nodo: (b) => { const k = +b.getAttribute('data-k'); if (bloqueado(k)) return aviso('Termina la parada anterior para abrir esta.'); antesDeJugar(k); },
      relampago: () => re === 'bloqueado' ? aviso('El reto relámpago se abre al vencer al jefe final. Es opcional.') : relampagoIntro(),
      test: () => te === 'bloqueado' ? aviso('El test se abre cuando las 6 paradas estén superadas o «por reforzar», o después de 45 minutos de juego.') : irApp('test'),
      regreso: () => { J().ultimaSesion = LS.hoy(); guardar(); calentamiento('regreso'); },
      sincalentar: () => { J().ultimaSesion = LS.hoy(); guardar(); mapa(); }
    };
  }
  function aviso(txt) { ui().hoja({ tipo: 'info', icono: 'candado', titulo: 'Todavía no', html: '<p>' + esc(txt) + '</p>', botones: [{ t: 'Entendido', cls: 'btn-pri' }] }); }

  // ---------- Tarjeta «Antes de jugar» ----------
  function antesDeJugar(k) {
    const nv = NV(k), m = NIV[k], yaHecho = hecho(k);
    const j = J();
    const primeraVezReglas = !j.regViste;   // Solo la primera parada muestra las 3 reglas grandes; después, un botón «Cómo se juega».
    if (primeraVezReglas) { j.regViste = true; guardar(); }
    LS.setColor('full');
    const reglasHtml = '<ul class="jg-criterio">' +
      '<li>' + ic('escudo', 'jg-escudo-ico') + '<span><b>Escudo:</b> te protege de 1 error en cada parada.</span></li>' +
      '<li><span class="jg-dom-mini" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span><b>La barra:</b> aciertas a la primera y sube; te equivocas y baja. Pasas con la barra llena y al menos ' + minItems(k) + ' ejercicios.</span></li>' +
      '<li>' + svgs().estrellas(3, 3) + '<span><b>Estrellas:</b> 3 con 85 % o más a la primera · 2 con 65 % · 1 al superar la parada.</span></li></ul>';
    const reglasBloque = primeraVezReglas
      ? reglasHtml
      : '<details class="jg-reglas-det"><summary>' + ic('foco') + ' Cómo se juega</summary>' + reglasHtml + '</details>';
    pintar('<div class="pantalla jg">' + topBar('Parada ' + k + ' de ' + NP, m.nombre) +
      '<div class="tarjeta jg-antes"><p class="jg-kicker">Antes de jugar</p>' +
      '<div class="jg-antes-cab"><span class="jg-est-ico" aria-hidden="true">' + ic(m.ico || 'foco') + '</span><h2>' + m.nombre + '</h2></div>' + chips([m.chip]) +
      '<p class="jg-regla">' + m.regla + '</p><h3 class="jg-h3">Ejemplo resuelto</h3><div class="qmj-ej">' + ejemploHtml(k) + '</div>' +
      reglasBloque + '</div>' +
      '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="jugar">' + (yaHecho ? 'Repetir por más estrellas' : (nv.items ? 'Seguir jugando' : 'Jugar')) + '</button>' +
      '<button class="btn btn-sec btn-ancho" data-j="lamina">Repasar la lámina</button></div></div>', 'antes');
    acc = { jugar: () => entrarNivel(k, yaHecho), lamina: () => verLamina(m.lam[0]) };
  }

  // ---------- Entrar a una parada ----------
  let logrosSesion = [];
  function entrarNivel(k, repetir) {
    const j = J(), nv = NV(k);
    j.nivelActual = k; j.paradaMax = Math.max(j.paradaMax || 1, k);
    if (repetir && !(j.itemEnCurso && j.itemEnCurso.nivel === k && nv.repitiendo)) {
      Object.assign(nv, { barra: 0, items: 0, itemsEval: 0, aciertos1: 0, subtiposOk: [], erroresSeguidos: 0, rescate: null, rescate15: false, repitiendo: true, fallosSub: {}, rescateUsado: false });
      if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    }
    nv.escudo = true;
    j.racha = 0;  // La racha se reinicia al entrar a otra parada: no se arrastra entre paradas.
    j.ultimaSesion = LS.hoy();
    logrosSesion = [];
    guardar();
    siguienteItemNivel(k);
  }
  function registrarReciente(it) { const r = J().recientes; r.push(it.id); if (r.length > 15) r.splice(0, r.length - 15); }
  function planItem(k) {
    const j = J(), nv = NV(k), rec = j.recientes;
    const base = { modo: 'nivel', nivel: k, pistaNivel: 0 };
    if (j.gemeloPendiente) {
      const gp = j.gemeloPendiente; j.gemeloPendiente = null;
      const it = G.gemelo(gp.item, { recientes: rec });
      if (it) return Object.assign(base, { item: it, gemelo: true, previo: !!gp.previo });
    }
    if (nv.rescate && nv.rescate.restantes > 0) {
      const it = G.crear(nv.rescate.sub, { facil: true, recientes: rec });
      if (it) return Object.assign(base, { item: it, rescate: true });
    }
    const plan = G.elegirSub(k, { items: nv.items, subtiposOk: nv.subtiposOk, barra: nv.barra, ultimoSub: nv.ultimoSub, repitiendo: nv.repitiendo });
    let it = G.crear(plan.sub, Object.assign({ recientes: rec }, plan.opts || {}));
    if (!it) { plan.previo = false; it = G.crear(k === 6 ? '1c' : G.SUBS[k][0], { recientes: rec }); }
    return Object.assign(base, { item: it, previo: !!plan.previo });
  }
  function siguienteItemNivel(k) {
    const j = J();
    let ec = j.itemEnCurso;
    let valido = !!(ec && ec.modo === 'nivel' && ec.nivel === k && ec.item && ec.item.sub);
    if (valido) { try { G.info(ec.item); } catch (e) { valido = false; } }
    if (!valido) { ec = planItem(k); j.itemEnCurso = ec; guardar(); }
    ec.respondido = false;
    pantallaNivel(ec);
  }

  // ---------- Piezas de la pantalla ----------
  function estadoHtml(k) {
    const nv = NV(k), j = J();
    let dom = '<span class="jg-dom' + (nv.barra >= 5 ? ' jg-dom-lleno' : '') + '" role="img" aria-label="Barra de dominio: ' + nv.barra + ' de 5">';
    for (let i = 0; i < 5; i++) dom += '<i class="' + (i < nv.barra ? 'llena' : '') + '"></i>';
    dom += '</span>';
    const es = '<span class="jg-escudo' + (nv.escudo ? '' : ' roto') + '" role="img" aria-label="' + (nv.escudo ? 'Escudo activo: te protege de 1 error' : 'Escudo usado') + '">' + ic('escudo') + '</span>';
    const racha = '<span class="jg-racha' + (j.racha >= 5 ? ' grande' : '') + '" aria-label="Racha de ' + j.racha + '"><span class="jg-racha-eti">Racha</span>' + ic('rayo') + '×' + j.racha + '</span>';
    return '<div class="jg-estado">' + dom + es + '<span class="esp"></span>' + racha + '</div>';
  }
  function vidaHtml() {
    const b = NV(6).barra;
    return '<div class="jg-vida" role="img" aria-label="Vida del jefe: ' + (5 - b) + ' de 5"><span class="jg-vida-t">Jefe</span>' +
      [0, 1, 2, 3, 4].map(i => '<i class="' + (i < b ? 'hecha' : '') + '"></i>').join('') + '</div>';
  }
  function herramientas(conPista) {
    return '<div class="jg-herr"><button class="btn-txt" data-j="regla">' + ic('ayuda') + ' ¿Qué regla era?</button>' +
      (conPista ? '<button class="btn btn-sec jg-btn-pista" data-j="pista">' + ic('foco') + ' Pista</button>' : '') + '</div>';
  }
  function enunHtml(inf) {
    let h = '<div class="enunciado jg-enun qmj-enun"><p class="qmj-q">' + esc(inf.q) + '</p>';
    if (inf.tarjeta) h += '<div class="qmj-tarjeta">' + esc(inf.tarjeta) + '</div>';
    if (inf.flecha) h += '<div class="qmj-par">' + flechaHtml(inf.flecha) + '</div>';
    if (inf.nota || inf.casilla) h += '<div class="qmj-par">' + (inf.nota ? '<div class="qmj-nota">' + notaHtml(inf.nota) + '</div>' : '') + (inf.casilla ? '<div class="qmj-cas">' + casillaHtml(inf.casilla) + '</div>' : '') + '</div>';
    if (inf.sub) h += '<p class="qmj-sub">' + esc(inf.sub) + '</p>';
    return h + '</div>';
  }
  const HUECOS = '<div class="qmj-obra"></div><div class="jg-pistas" aria-live="polite"></div><div class="jg-resp"><div class="qmj-ctrl"></div><div class="qmj-fbz"></div></div>';
  function zonas() {
    return { obra: root.querySelector('.qmj-obra'), pistas: root.querySelector('.jg-pistas'), ctrl: root.querySelector('.qmj-ctrl'), fb: root.querySelector('.qmj-fbz') };
  }
  function pistaHtml(n, inf) {
    let h = '';
    for (let i = 0; i < n && i < 3; i++) h += '<div class="jg-pista"><b>Pista ' + (i + 1) + '.</b> <span>' + esc(inf.pistas[i]) + '</span></div>';
    if (n >= 2) h += '<p class="peq tinta-3">Con esta pista el ejercicio no suma a la barra (tampoco resta).</p>';
    return h;
  }
  function pedirPista(ec, zona, inf) {
    if (ec.pistaNivel >= 3 || ec.respondido) return;
    ec.pistaNivel++; J().pistasUsadas++; guardar();
    zona.innerHTML = pistaHtml(ec.pistaNivel, inf);
    const b = root.querySelector('[data-j="pista"]');
    if (b && ec.pistaNivel >= 3) { b.disabled = true; b.classList.add('desact'); }
  }
  function zonaFacil(it) {
    const s = it.sub;
    if (s === '5a' || s === '5b') { const e = G.elem(it.z); return e ? (x => x.periodo === e.periodo) : null; }
    if (s === '5c') return x => x.grupo === it.g;
    if (s === '5d') return x => x.grupo === G.AB_A[it.ab];
    if (s === '5e') { const g = { alcalino: [1], alcalinoterreo: [2], halogeno: [17], 'gas-noble': [18], transicion: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }[it.fam] || []; return x => g.indexOf(x.grupo) >= 0; }
    return null;
  }
  // Respaldo del constructor si el widget no cargó: tres contadores con ＋/−
  function constructorSimple(el, o) {
    const st = { p: o.p || 0, n: o.n || 0, e: o.e || 0 }, max = o.max || { p: 20, n: 24, e: 20 }, bloq = {};
    const NOM = { p: 'Protones (+1)', n: 'Neutrones (0)', e: 'Electrones (−1)' };
    function dib() {
      el.innerHTML = '<div class="qmj-cons-r">' + ['p', 'n', 'e'].map(k => '<div class="qmj-cons-f qmj-c-' + k + '"><span>' + NOM[k] + '</span><button class="btn btn-sec" data-k="' + k + '" data-d="-1" aria-label="Quitar"' + (bloq[k] || st[k] <= 0 ? ' disabled' : '') + '>−</button><output>' + st[k] + '</output><button class="btn btn-sec" data-k="' + k + '" data-d="1" aria-label="Agregar"' + (bloq[k] || st[k] >= max[k] ? ' disabled' : '') + '>+</button></div>').join('') +
        '<p class="peq tinta-2">Elemento: ' + (st.p ? esc(G.nomDe(st.p)) : '—') + '</p></div>';
    }
    el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-k]'); if (!b || b.disabled) return; const k = b.getAttribute('data-k'); st[k] = Math.max(0, Math.min(max[k], st[k] + +b.getAttribute('data-d'))); dib(); });
    dib();
    return { valores: () => ({ p: st.p, n: st.n, e: st.e }), fijar: (v) => { Object.assign(st, v); dib(); }, bloquear: (l) => { (l || []).forEach(k => { bloq[k] = true; }); dib(); }, destruir: () => { el.innerHTML = ''; } };
  }

  // Monta los controles de un ítem y llama onResp(valor) una sola vez
  function montarControles(it, z, onResp) {
    const t = G.tipoUI(it);
    let listo = false;
    if (t === 'opc') {
      const op = G.opciones(it);
      z.ctrl.innerHTML = '<div class="qmj-ops' + (op.length > 4 ? ' qmj-ops-6' : '') + '" role="group" aria-label="Opciones">' +
        op.map(o => '<button class="btn btn-sec qmj-op" data-j="op" data-v="' + esc(o.v) + '">' + esc(o.t) + '</button>').join('') + '</div>';
      acc.op = (b) => { if (listo || b.disabled) return; listo = true; z.ctrl.querySelectorAll('.qmj-op').forEach(x => { x.disabled = true; }); onResp(b.getAttribute('data-v')); };
      return {
        marcar(d, v) {
          const C = String(G.correcta(it));
          z.ctrl.querySelectorAll('.qmj-op').forEach(x => { const xv = x.getAttribute('data-v'); if (xv === C) x.classList.add('ok'); else if (xv === String(v)) x.classList.add('miss'); });
        }
      };
    }
    if (t === 'num') {
      const conSigno = it.sub === '4f' && it.pide === 'carga';
      z.ctrl.innerHTML = '<div class="qmj-tec' + (conSigno ? '' : ' qmj-sinsigno') + '"></div>';
      const tk = ui().teclado(z.ctrl.firstChild, { max: 3, onOk: (v) => { if (listo) return; listo = true; tk.bloquear(true); onResp(v); } });
      limpiezas.push(() => { try { tk.destruir(); } catch (e) { } });
      return { marcar() { try { tk.destruir(); } catch (e) { } } };
    }
    if (t === 'pne') {
      const C = G.correcta(it), vals = { p: null, n: null, e: null }, dado = {};
      if (it.facil) { vals.p = C.p; dado.p = true; }
      const ET = { p: 'Protones', n: 'Neutrones', e: 'Electrones' };
      z.ctrl.innerHTML = '<div class="qmj-pne" role="group" aria-label="Tus tres respuestas">' + ['p', 'n', 'e'].map(c => '<button class="qmj-campo qmj-c-' + c + '" data-j="campo" data-c="' + c + '"><span class="qmj-campo-et">' + ET[c] + '</span><span class="qmj-campo-v">?</span></button>').join('') +
        '</div><div class="qmj-tec qmj-sinsigno"></div>';
      let act = null;
      const tk = ui().teclado(z.ctrl.querySelector('.qmj-tec'), { max: 3, onOk: (v) => { if (listo || !act) return; vals[act] = v; siguiente(); } });
      limpiezas.push(() => { try { tk.destruir(); } catch (e) { } });
      const pintarC = () => {
        z.ctrl.querySelectorAll('.qmj-campo').forEach(b => {
          const c = b.getAttribute('data-c');
          b.classList.toggle('activo', c === act); b.classList.toggle('dado', !!dado[c]);
          b.querySelector('.qmj-campo-v').textContent = vals[c] == null ? (c === act ? '…' : '?') : vals[c];
          b.disabled = !!dado[c] || listo;
        });
        const faltan = ['p', 'n', 'e'].filter(c => vals[c] == null && c !== act).length;
        const bt = tk.raiz && tk.raiz.querySelector('.btn-comprobar'); if (bt) bt.textContent = faltan ? 'Guardar y seguir' : 'Comprobar';
      };
      const elegir = (c) => { act = c; vals[c] = null; tk.limpiar(); pintarC(); };
      function siguiente() {
        const f = ['p', 'n', 'e'].find(c => vals[c] == null);
        if (f) { elegir(f); return; }
        listo = true; act = null; pintarC();
        onResp({ p: vals.p, n: vals.n, e: vals.e });
      }
      acc.campo = (b) => { if (listo || b.disabled) return; elegir(b.getAttribute('data-c')); };
      siguiente();
      return {
        marcar(d) {
          const cs = d.campos || { p: true, n: true, e: true };
          z.ctrl.querySelectorAll('.qmj-campo').forEach(b => { b.classList.remove('activo'); b.classList.add(cs[b.getAttribute('data-c')] ? 'ok' : 'miss'); });
          try { tk.destruir(); } catch (e) { }
        }
      };
    }
    if (t === 'cons') {
      const mostrar = it.experto ? { elemento: true, carga: false, A: false, notacion: false } : { elemento: true, carga: true, A: true, notacion: true };
      const oc = { p: it.ini.p, n: it.ini.n, e: it.ini.e, max: { p: 20, n: 24, e: 20 }, mostrar };
      let cons;
      try { cons = QM().constructor ? QM().constructor(z.obra, oc) : constructorSimple(z.obra, oc); } catch (e) { cons = constructorSimple(z.obra, oc); }
      limpiezas.push(() => { try { cons.destruir(); } catch (e) { } });
      z.ctrl.innerHTML = '<div class="col qmj-cons-ctrl"><button class="btn btn-pri btn-ancho" data-j="armar">Comprobar</button>' +
        '<button class="btn btn-txt" data-j="reiniciar">' + ic('reintentar') + ' Volver a empezar</button></div>';
      acc.armar = () => { if (listo) return; listo = true; const v = cons.valores(); try { cons.bloquear(['p', 'n', 'e']); } catch (e) { } z.ctrl.innerHTML = ''; onResp({ p: v.p, n: v.n, e: v.e }); };
      acc.reiniciar = () => { if (!listo) cons.fijar({ p: it.ini.p, n: it.ini.n, e: it.ini.e }); };
      return { marcar(d) { if (d && d.cod === 'OK') { try { if (cons.marcarOk) cons.marcarOk(); } catch (e) { } } } };
    }
    // tabla
    if (!QM().tabla || !G.elem(1)) {
      z.obra.innerHTML = '<p class="caja-nota">No se pudo cargar la tabla periódica. Recarga la página.</p>';
      z.ctrl.innerHTML = '<button class="btn btn-sec btn-ancho" data-j="mapa">Volver al mapa</button>';
      return { marcar() { } };
    }
    // La tabla del juego se colorea por familia (ayuda a distinguir alcalinos, halógenos, etc.) y
    // usa solo numeración moderna (1..18) — la doble numeración marea al principio.
    const tb = QM().tabla(z.obra, { modo: 'elegir', colorearPorFamilia: true, mostrarNumeracion: 'iupac', leyenda: false, onElegir: (e) => { if (listo) return; listo = true; onResp(e.z); } });
    limpiezas.push(() => { try { tb.destruir(); } catch (e) { } });
    if (it.facil) { const f = zonaFacil(it); if (f) tb.resaltar(f); }
    z.ctrl.innerHTML = '<p class="qmj-toca">' + ic('foco') + ' Toca tu respuesta en la tabla.</p>';
    return {
      marcar(d, z0) {
        tb.marcar(z0, d.cod === 'OK' ? 'ok' : 'miss');
        if (d.cod === 'OK') { try { if (tb.resaltarZ) tb.resaltarZ(z0); } catch (e) { } }
        else { const cs = G.correctas(it); cs.slice(0, 8).forEach(e => tb.marcar(e.z, 'ok')); if (cs[0] && tb.enfocar) tb.enfocar(cs[0].z); }
        z.ctrl.innerHTML = '';
      }
    };
  }
  function respTxt(it, v) {
    const t = G.tipoUI(it);
    if (v == null) return '—';
    if (t === 'opc') { const o = G.opciones(Object.assign({}, it, { facil: false })).find(x => x.v === String(v)); return o ? o.t : String(v); }
    if (t === 'num') return it.sub === '4f' && it.pide === 'carga' ? G.conSigno(v) : String(v);
    if (t === 'pne' || t === 'cons') return v.p + ' protones · ' + v.n + ' neutrones · ' + v.e + ' electrones';
    const e = G.elem(v); return e ? e.simbolo + ' (' + G.nomDe(e.z) + ')' : String(v);
  }
  function tarjetaBien(titulo, texto, extra, botones) {
    return '<div class="jg-fb ok" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('check') + '<b>' + titulo + '</b></div>' +
      (texto ? '<p>' + texto + '</p>' : '') + (extra || '') + '<div class="jg-fb-bot">' + botones + '</div></div>';
  }
  function tarjetaCasi(it, inf, v, d, botones) {
    const lam = (G.ERR[d.cod] && G.ERR[d.cod].lamina) || inf.lam;
    let h = '<div class="jg-fb miss" role="status" aria-live="polite"><div class="jg-fb-cab">' + ic('x') + '<b>Casi.</b></div>' +
      '<p class="jg-tuya"><span>Tu respuesta: ' + esc(respTxt(it, v)) + '</span><span>Respuesta: ' + esc(inf.resp) + '</span></p>' +
      '<p class="jg-pista-txt">' + esc(d.msg) + '</p>';
    if (inf.tipo === 'pne' || inf.tipo === 'cons' || it.sub === '4g') h += '<ol class="qmj-sol">' + inf.sol.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
    if (inf.cambio) h += cambiosDib(inf.cambio);
    if (it.sub === '1c' || it.sub === '1d') h += arbolDib(it.c);
    return h + '<div class="jg-fb-bot">' + botones + '<button class="btn btn-sec btn-ancho" data-j="lamerr" data-n="' + lam + '">Ver la lámina «' + esc(tituloLam(lam)) + '»</button></div></div>';
  }
  function enfocarFb() {
    const fb = root.querySelector('.jg-fb');
    if (!fb) return;
    fb.scrollIntoView({ behavior: LS.menosMovimiento() ? 'auto' : 'smooth', block: 'nearest' });
    const b = fb.querySelector('.jg-fb-bot .btn-pri');
    if (b) setTimeout(() => b.focus({ preventScroll: true }), 60);
  }
  function darLogro(id) { const j = J(); if (j.logros.indexOf(id) >= 0) return; j.logros.push(id); logrosSesion.push(id); }
  function contarError(cod, k) {
    if (!cod) return;
    const j = J();
    j.errores[cod] = (j.errores[cod] || 0) + 1;
    j.erroresSesion[cod] = (j.erroresSesion[cod] || 0) + 1;
    if (k) { const e = NV(k).errores; e[cod] = (e[cod] || 0) + 1; }
  }
  let iElog = 0;
  // Elogio contextual: usa el subtipo del ítem (así el mensaje coincide con lo que resolvió el estudiante).
  // Si no hay elogio específico para ese subtipo, cae al genérico de la parada.
  function elogioDe(itOk, k) {
    const sub = itOk && itOk.sub;
    const l = (sub && ELOGIO_SUB[sub]) || ELOGIO_NIV[k];
    return l && l.length ? l[(iElog++) % l.length] : ui().elogio();
  }
  function refrescarEstado(k) {
    const e = root.querySelector('.jg-estado'); if (e) e.outerHTML = estadoHtml(k);
    const v = root.querySelector('.jg-vida'); if (v && k === 6) v.outerHTML = vidaHtml();
  }
  function celebrarRacha() {
    const j = J();
    if (!j.racha || j.racha % 5 !== 0 || LS.menosMovimiento()) return;
    const r = root.querySelector('.jg-racha'); if (r) r.classList.add('pulso');
  }

  // ---------- Ejercicio de una parada ----------
  function pantallaNivel(ec) {
    const it = ec.item, k = ec.nivel, inf = G.info(it);
    LS.setColor('full');
    let av = '';
    if (ec.rescate) av = '<div class="caja-nota"><b>Modo rescate.</b> Primer paso ya hecho: ' + esc(inf.pistas[1]) + '</div>';
    else if (ec.gemelo) av = '<p class="jg-etq">Uno parecido, para que lo corrijas</p>';
    else if (ec.previo) av = '<p class="jg-etq">Repaso de una parada anterior</p>';
    else if (it.experto) av = '<p class="jg-etq">' + ic('rayo') + ' Vas tan bien que subo la dificultad: el constructor no te va a mostrar la carga ni el nombre completo. ¡A por ella!</p>';
    pintar('<div class="pantalla jg jg-ej qmj-ej' + (inf.tipo === 'tabla' ? ' qmj-ancho' : '') + '">' + topBar('Parada ' + k + ' · ' + NIV[k].nombre, NIV[k].que) +
      estadoHtml(k) + (k === 6 ? vidaHtml() : '') + herramientas(true) + '<div class="jg-aviso">' + av + '</div>' + enunHtml(inf) + HUECOS + '</div>', 'ej');
    enJuego = true; toque();
    const z = zonas();
    if (ec.pistaNivel) z.pistas.innerHTML = pistaHtml(ec.pistaNivel, inf);
    acc.pista = () => pedirPista(ec, z.pistas, inf);
    acc.lamerr = (b) => verLamina(+b.getAttribute('data-n'));
    const ctl = montarControles(it, z, (v) => responderNivel(ec, v, ctl, z, inf));
  }

  function responderNivel(ec, v, ctl, z, inf) {
    const it = ec.item, k = ec.nivel, j = J(), nv = NV(k);
    const d = G.diag(it, v), ok = d.cod === 'OK', fuerte = ec.pistaNivel >= 2, delNivel = !ec.previo;
    let escudoUsado = false;
    ec.respondido = true;
    try { ctl.marcar(d, v); } catch (e) { }
    nv.ultimoSub = it.sub; registrarReciente(it);
    if (delNivel) { nv.items++; if (!ec.rescate) nv.itemsEval++; }
    if (ok) {
      j.racha++;
      if (j.racha > (j.mejorRachaGlobal || 0)) j.mejorRachaGlobal = j.racha;
      if (j.racha > nv.mejorRacha) nv.mejorRacha = j.racha;
      if (delNivel) {
        nv.erroresSeguidos = 0;
        if (!fuerte) { if (nv.barra < 5) nv.barra++; if (!ec.rescate) nv.aciertos1++; if (nv.subtiposOk.indexOf(it.sub) < 0) nv.subtiposOk.push(it.sub); }
      }
      if (ec.gemelo && !fuerte) darLogro('detective');
      if (it.sub === '2a' && it.cod && !ec.pistaNivel) { j.cont.trampasOk++; if (j.cont.trampasOk >= 5) darLogro('sintrampa'); }
      if (/^(3c|3d|4c|4d)$/.test(it.sub) && !ec.pistaNivel) { j.cont.ionesOk++; if (j.cont.ionesOk >= 10) darLogro('iones'); }
    } else {
      contarError(d.cod, k);
      if (!fuerte) j.racha = 0;
      if (delNivel) {
        nv.fallosSub[it.sub] = (nv.fallosSub[it.sub] || 0) + 1;
        if (!ec.rescate) nv.erroresSeguidos++;
        if (!ec.rescate && !fuerte) { if (nv.escudo) { nv.escudo = false; escudoUsado = true; } else nv.barra = Math.max(0, nv.barra - 1); }
      }
      if (!ec.rescate) j.gemeloPendiente = { item: it, previo: !!ec.previo };
    }
    if (ec.rescate && nv.rescate) { nv.rescate.restantes--; if (nv.rescate.restantes <= 0) nv.rescate = null; }
    j.itemEnCurso = null;
    guardar();
    refrescarEstado(k);
    const pb = root.querySelector('[data-j="pista"]'); if (pb) { pb.disabled = true; pb.classList.add('desact'); }
    if (ok) {
      ui().sonido('ok');
      const tit = ec.gemelo ? '¡Eso, ' + esc(LS.nombre()) + '! Corregiste tu error' : '¡Bien, ' + esc(LS.nombre()) + '!';
      const extra = inf.tipo === 'opc' || inf.tipo === 'tabla' ? '<p class="peq">' + esc(inf.sol[0]) + '</p>' : '';
      z.fb.innerHTML = tarjetaBien(tit, esc(elogioDe(it, k)), extra, '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
      const en = root.querySelector('.jg-enun'); if (en && !LS.menosMovimiento()) en.classList.add('pop');
      celebrarRacha();
    } else {
      z.fb.innerHTML = (escudoUsado ? '<p class="jg-escudo-msg">' + ic('escudo') + ' Tu escudo te protegió de este error: la barra no bajó.</p>' : '') +
        tarjetaCasi(it, inf, v, d, '<button class="btn btn-pri btn-ancho" data-j="sig">Ok, seguir</button>');
      const fb = z.fb.querySelector('.jg-fb'); if (fb && !LS.menosMovimiento()) fb.classList.add('sacudir');
    }
    acc.sig = () => despuesNivel(k, ok ? null : d);
    enfocarFb();
  }

  function despuesNivel(k, d) {
    const j = J(), nv = NV(k);
    const req = G.subtiposRequeridos(k);
    if (nv.barra >= 5 && nv.items >= minItems(k) && req.every(s => nv.subtiposOk.indexOf(s) >= 0)) return finNivel(k, 'superado');
    if (nv.items >= 25) return finNivel(k, 'reforzar');
    const porCodigo = !!(d && d.cod && j.erroresSesion[d.cod] >= 3);
    if (!nv.rescate && (nv.erroresSeguidos >= 3 || porCodigo || (nv.items >= 15 && !nv.rescate15))) return iniciarRescate(k, porCodigo);
    siguienteItemNivel(k);
  }

  function iniciarRescate(k, porCodigo) {
    const j = J(), nv = NV(k);
    if (nv.items >= 15) nv.rescate15 = true;
    nv.rescates++; nv.erroresSeguidos = 0; nv.rescateUsado = true;
    const ult = j.gemeloPendiente && j.gemeloPendiente.item;
    let sub = ult && !j.gemeloPendiente.previo ? ult.sub : null;
    if (!sub) { const subs = k === 6 ? Object.keys(nv.fallosSub) : G.SUBS[k]; sub = subs.slice().sort((a, b) => (nv.fallosSub[b] || 0) - (nv.fallosSub[a] || 0))[0] || G.SUBS[k === 6 ? 1 : k][0]; }
    if (porCodigo && ult && j.erroresSesion) Object.keys(j.erroresSesion).forEach(c => { if (j.erroresSesion[c] >= 3) j.erroresSesion[c] = 0; });
    nv.rescate = { sub, restantes: 3 };
    j.gemeloPendiente = null;
    if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    guardar();
    const ej = G.crear(sub, { facil: true }), inf = G.info(ej);
    LS.setColor('full');
    pintar('<div class="pantalla jg">' + topBar('Vamos más despacio', 'Parada ' + k) +
      '<div class="tarjeta jg-rescate"><p>Tranquilo, ' + esc(LS.nombre()) + ': esto le pasa a mucha gente. Mira uno resuelto y luego haces 3 más fáciles, con el primer paso ya hecho. Aquí los errores no restan.</p>' +
      enunHtml(inf) + '<div class="jg-sol"><p class="jg-pista-txt">Respuesta: ' + esc(inf.resp) + '</p><ol class="qmj-sol">' + inf.pistas.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>' +
      (inf.cambio ? cambiosDib(inf.cambio) : '') + '</div>' +
      '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="practicar">Practicar 3 fáciles</button>' +
      '<button class="btn btn-sec btn-ancho" data-j="lamina">Ver la lámina</button></div></div>', 'rescate');
    acc = { practicar: () => siguienteItemNivel(k), lamina: () => verLamina(inf.lam || NIV[k].lam[0]) };
  }

  // ---------- Fin de parada ----------
  function finNivel(k, estado) {
    const j = J(), nv = NV(k);
    const pct = nv.itemsEval ? nv.aciertos1 / nv.itemsEval : 0;
    const est = estado === 'superado' ? (pct >= 0.85 ? 3 : pct >= 0.65 ? 2 : 1) : 0;
    nv.estado = (estado === 'superado' || nv.estado === 'superado') ? 'superado' : 'reforzar';
    nv.estrellas = Math.max(nv.estrellas || 0, est);
    nv.rescate = null; nv.repitiendo = false;
    if (j.itemEnCurso && j.itemEnCurso.nivel === k) j.itemEnCurso = null;
    j.gemeloPendiente = null;
    if (k === 6 && estado === 'superado' && !nv.rescateUsado) darLogro('jefe');
    if (k < NP) {
      if (NV(k + 1).estado === 'bloqueado') NV(k + 1).estado = 'abierto';
      j.nivelActual = k + 1; j.paradaMax = Math.max(j.paradaMax || 1, k + 1);
    }
    if ([1, 2, 3, 4, 5, 6].every(hecho)) j.testDesbloqueado = true;
    guardar();
    try { if (LS.envio) LS.envio.evento('nivel', { nivel: k, tema: NIV[k].tema, estado: nv.estado, estrellas: est, items: nv.items, aciertos1: nv.aciertos1, rescates: nv.rescates, erroresTop: topErrores(nv.errores) }); } catch (e) { }
    pantallaFin(k, estado, est, pct);
  }
  function pantallaFin(k, estado, est, pct) {
    const nv = NV(k), nom = esc(LS.nombre()), ERR = G.ERR;
    const top = topErrores(nv.errores, 1)[0];
    let h = '<div class="pantalla jg jg-fin">' + topBar('Parada ' + k, NIV[k].nombre) + '<div class="tarjeta jg-fin-t" role="status" aria-live="polite">';
    if (estado === 'superado') {
      h += '<div class="sello">' + svgs().sello(k === 6 ? 'Jefe vencido' : 'Parada superada') + '</div>' +
        '<h2 class="centro">' + (k === 6 ? '¡Venciste al jefe, ' + nom + '!' : '¡Parada ' + k + ' superada, ' + nom + '!') + '</h2><p class="centro">' + svgs().estrellas(est, 3) + '</p>' +
        '<p>Hiciste ' + nv.items + ' ejercicios · ' + nv.aciertos1 + ' a la primera (' + Math.round(pct * 100) + ' %) · Mejor racha: ' + nv.mejorRacha + '</p>' +
        '<p><b>Lo que hiciste bien:</b> «' + esc(NIV[k].bien) + '»</p>';
      ui().confeti(); ui().sonido('nivel');
    } else {
      h += '<h2>Seguimos, ' + nom + '</h2><p>Este tema quedó marcado como «por repasar» — nada grave. Vamos a la siguiente parada y al final volvemos aquí con la lámina.</p>';
    }
    if (top && ERR[top]) h += '<p><b>Para cuidar:</b> ' + esc(ERR[top].txt) + '</p>';
    logrosSesion.forEach(id => { h += '<p class="jg-logro">' + ic('estrella') + ' Logro nuevo: ' + esc(LOGROS[id] || id) + '</p>'; });
    logrosSesion = [];
    h += '<p class="peq tinta-2">Puedes parar aquí: tu avance quedó guardado.</p></div>';
    if (k === NP) {
      h += '<div class="tarjeta jg-ignacio">' +
        '<div class="jg-ignacio-cab"><span class="jg-ignacio-cara" aria-hidden="true">' + ic('ignacio-feliz') + '</span><p class="jg-kicker" style="margin:0">Buen trabajo</p></div>' +
        '<p>Llegaste al final del laboratorio por tu cuenta, ' + nom + '. Eso ya es mucho, en serio. Ahora, cuando quieras, vas al test: son 25 preguntas, sin tiempo, y puedes hacerlo hoy o mañana — se guarda solo.</p></div>' +
        '<div class="jg-acciones"><button class="btn btn-sec btn-ancho" data-j="calent">Calentamiento de 6 ejercicios</button>' +
        '<button class="btn btn-pri btn-ancho" data-j="test">Ir al test</button>' +
        '<button class="btn btn-premio btn-ancho" data-j="relampago">' + ic('rayo') + ' Reto relámpago</button>' +
        '<button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div>';
    } else if (estado === 'superado') {
      h += '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">Siguiente parada' + ic('sig') + '</button>' +
        '<button class="btn btn-sec btn-ancho" data-j="repetir">Repetir por más estrellas</button>' +
        '<button class="btn btn-txt" data-j="regla">Ver la regla</button></div>';
    } else {
      h += '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">Seguir' + ic('sig') + '</button></div>';
    }
    pintar(h + '</div>', 'fin');
    acc = {
      seguir: () => { if (k < NP) antesDeJugar(k + 1); else mapa(); },
      repetir: () => antesDeJugar(k),
      regla: () => hojaRegla(k),
      calent: () => calentamiento('test'),
      test: () => irApp('test'),
      relampago: () => relampagoIntro()
    };
  }

  // ---------- Ítems sueltos (relámpago y calentamientos) ----------
  const REL_SUBS = ['1a', '1b', '1c', '1d', '2a', '2b', '2c', '2d', '4f', '4g', '5g', '5h'];
  function itemDe(k, soloRapidos) {
    const rec = J().recientes;
    let sub;
    if (soloRapidos) sub = REL_SUBS[Math.floor(Math.random() * REL_SUBS.length)];
    else if (k === 6) sub = G.elegirSub(6, { barra: Math.floor(Math.random() * 6) }).sub;
    else sub = G.SUBS[k][Math.floor(Math.random() * G.SUBS[k].length)];
    return G.crear(sub, { recientes: rec }) || G.crear('1c', { recientes: rec });
  }

  // ---------- Reto relámpago (90 s, opcional) ----------
  function relampagoIntro() {
    LS.setColor('full');
    pintar('<div class="pantalla jg">' + topBar('Reto relámpago', 'Opcional') +
      '<div class="tarjeta jg-antes"><p class="jg-kicker">' + ic('rayo', 'jg-rayo') + ' 90 segundos</p><h2>Reto relámpago</h2>' +
      '<p>Preguntas rápidas mezcladas, sin pistas. Un error no resta: te muestro la respuesta y sigues.</p>' +
      '<p>Solo compites contigo. Tu récord: <b>' + (J().relampagoRecord || 0) + '</b>.</p><p class="peq tinta-2">No cambia tus estrellas ni tu avance.</p></div>' +
      '<div class="jg-acciones"><button class="btn btn-premio btn-ancho" data-j="empezar">Empezar</button><button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'relampago');
    acc = { empezar: () => relampago() };
  }
  function relampago() {
    const DUR = 90000, t0 = Date.now();
    let puntos = 0, vivo = true, tFlash = null, iv = null;
    function nuevo() {
      if (!vivo) return;
      const it = itemDe(0, true), inf = G.info(it);
      registrarReciente(it);
      const resto = Math.max(0, DUR - (Date.now() - t0));
      pintar('<div class="pantalla jg jg-ej qmj-ej jg-rel">' + topBar('Reto relámpago') +
        '<div class="jg-estado"><span class="jg-reloj" role="timer" aria-live="off">' + Math.ceil(resto / 1000) + ' s</span><span class="esp"></span><span class="jg-pill">Aciertos: <b class="jg-puntos">' + puntos + '</b></span></div>' +
        enunHtml(inf) + '<div class="jg-flash" aria-live="polite"></div>' + HUECOS + '</div>', 'relampago');
      enJuego = true; toque();
      limpiezas.push(() => { clearTimeout(tFlash); });
      const z = zonas();
      const ctl = montarControles(it, z, (v) => {
        if (!vivo) return;
        const d = G.diag(it, v);
        try { ctl.marcar(d, v); } catch (e) { }
        if (d.cod === 'OK') { puntos++; ui().sonido('ok'); tFlash = setTimeout(nuevo, 350); }
        else {
          root.querySelector('.jg-flash').innerHTML = '<div class="fb miss">' + ic('x') + '<div class="fb-cuerpo"><b>Casi.</b> Respuesta: ' + esc(inf.resp) + '</div></div>';
          tFlash = setTimeout(nuevo, 1600);
        }
      });
    }
    function fin() {
      if (!vivo) return;
      vivo = false; clearInterval(iv); clearTimeout(tFlash);
      const j = J(), antes = j.relampagoRecord || 0, record = puntos > antes;
      if (record) j.relampagoRecord = puntos;
      guardar();
      if (record && puntos) ui().sonido('nivel');
      pintar('<div class="pantalla jg jg-fin">' + topBar('Reto relámpago') + '<div class="tarjeta" role="status"><h2>¡Tiempo!</h2>' +
        '<p class="jg-grande">' + puntos + ' aciertos</p>' +
        '<p>' + (record && puntos ? '¡Nuevo récord personal, ' + esc(LS.nombre()) + '!' : 'Tu récord: ' + antes + '. Solo compites contigo.') + '</p></div>' +
        '<div class="jg-acciones"><button class="btn btn-premio btn-ancho" data-j="otra">Otra vez</button>' +
        (J().testDesbloqueado ? '<button class="btn btn-pri btn-ancho" data-j="test">Ir al test</button>' : '') +
        '<button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'fin');
      acc = { otra: () => relampago(), test: () => irApp('test') };
    }
    iv = setInterval(() => {
      if (!vivo) { clearInterval(iv); return; }
      if (!root || !document.body.contains(root) || vista !== 'relampago') { vivo = false; clearInterval(iv); clearTimeout(tFlash); return; }
      const q = Math.max(0, DUR - (Date.now() - t0));
      const rl = root.querySelector('.jg-reloj'); if (rl) rl.textContent = Math.ceil(q / 1000) + ' s';
      if (q <= 0) fin();
    }, 250);
    nuevo();
  }

  // ---------- Calentamientos: antes del test (6) y al volver otro día (5) ----------
  function calentamiento(tipo) {
    const hechos = [1, 2, 3, 4, 5, 6].filter(hecho);
    const cola = tipo === 'test' ? [1, 2, 3, 4, 5, 6].map(k => ({ k })) : Array.from({ length: 5 }, () => ({ k: (hechos.length ? hechos : [1])[Math.floor(Math.random() * (hechos.length || 1))] }));
    const fallosNiv = {}, recs = [];
    let n = 0;
    function uno() {
      if (!cola.length) return fin();
      const c = cola.shift(); n++;
      const it = c.item || itemDe(c.k), inf = G.info(it);
      LS.setColor('full');
      pintar('<div class="pantalla jg jg-ej qmj-ej' + (inf.tipo === 'tabla' ? ' qmj-ancho' : '') + '">' + topBar(tipo === 'test' ? 'Calentamiento para el test' : 'Calentamiento', 'Ejercicio ' + n + ' · sin puntaje') +
        '<div class="jg-aviso"><p class="jg-etq">Parada ' + c.k + ' · ' + NIV[c.k].nombre + (c.item ? ' · uno parecido' : '') + '</p></div>' + enunHtml(inf) + HUECOS + '</div>', 'calent');
      enJuego = true; toque();
      const z = zonas();
      acc.lamerr = (b) => verLamina(+b.getAttribute('data-n'));
      const ctl = montarControles(it, z, (v) => {
        const d = G.diag(it, v), j = J();
        try { ctl.marcar(d, v); } catch (e) { }
        registrarReciente(it);
        if (d.cod === 'OK') {
          j.racha++; if (j.racha > (j.mejorRachaGlobal || 0)) j.mejorRachaGlobal = j.racha;
          ui().sonido('ok');
          z.fb.innerHTML = tarjetaBien('¡Bien, ' + esc(LS.nombre()) + '!', esc(elogioDe(it, c.k)), '', '<button class="btn btn-pri btn-ancho" data-j="sig">Siguiente' + ic('sig') + '</button>');
        } else {
          contarError(d.cod, null); j.racha = 0;
          fallosNiv[c.k] = (fallosNiv[c.k] || 0) + 1;
          if (fallosNiv[c.k] === 1) { const gm = G.gemelo(it, { recientes: j.recientes }); if (gm) cola.unshift({ k: c.k, item: gm }); }
          else if (recs.indexOf(c.k) < 0) recs.push(c.k);
          z.fb.innerHTML = tarjetaCasi(it, inf, v, d, '<button class="btn btn-pri btn-ancho" data-j="sig">Ok, seguir</button>');
        }
        guardar();
        acc.sig = uno;
        enfocarFb();
      });
    }
    function fin() {
      const j = J(), nom = esc(LS.nombre());
      if (tipo === 'test') {
        if (recs.length) {
          pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>Casi listo, ' + nom + '</h2>' +
            '<p>Te conviene repasar ' + (recs.length === 1 ? 'la parada ' + recs[0] + ' (' + NIV[recs[0]].nombre + ')' : 'las paradas ' + recs.slice(0, -1).join(', ') + ' y ' + recs[recs.length - 1]) + ' antes del test.</p></div>' +
            '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="repasar">Repasar</button><button class="btn btn-sec btn-ancho" data-j="test">Ir igual al test</button></div></div>', 'fin');
          acc = { repasar: () => antesDeJugar(recs[0]), test: () => irApp('test') };
        } else {
          pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>¡En forma, ' + nom + '!</h2><p>Estás listo para el test: 25 preguntas, sin tiempo.</p></div>' +
            '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="test">Ir al test' + ic('sig') + '</button><button class="btn btn-txt" data-j="mapa">Volver al mapa</button></div></div>', 'fin');
          acc = { test: () => irApp('test') };
        }
      } else {
        const k = j.nivelActual;
        pintar('<div class="pantalla jg jg-fin">' + topBar('Calentamiento') + '<div class="tarjeta" role="status"><h2>¡Listo, ' + nom + '!</h2>' +
          '<p>Ibas en la parada ' + k + ', barra ' + NV(k).barra + '/5. Sigamos.</p></div>' +
          '<div class="jg-acciones"><button class="btn btn-pri btn-ancho" data-j="seguir">Seguir' + ic('sig') + '</button></div></div>', 'fin');
        acc = { seguir: () => (bloqueado(k) || hecho(k)) ? mapa() : antesDeJugar(k) };
      }
    }
    uno();
  }

  // ---------- Resumen para el correo del test ----------
  function resumen() {
    const j = J(), niveles = {}, temas = { A: [], B: [], C: [] };
    for (let k = 1; k <= NP; k++) {
      const nv = NV(k);
      niveles[k] = { nombre: NIV[k].nombre, tema: NIV[k].tema, estado: nv.estado, estrellas: nv.estrellas || 0, items: nv.items || 0, aciertos1: nv.aciertos1 || 0, rescates: nv.rescates || 0 };
      if (temas[NIV[k].tema]) temas[NIV[k].tema].push(nv.estado);
    }
    const top = topErrores(j.errores, 2);
    return {
      niveles,
      erroresTop: top,
      erroresTopTxt: top.map(c => (G.ERR[c] ? G.ERR[c].txt : c)),
      pistasUsadas: j.pistasUsadas || 0,
      tiempoActivoMin: Math.round((j.tiempoActivoMs || 0) / 60000),
      paradaMax: j.paradaMax || 1,
      estrellas: estrellasTotales(),
      porReforzar: [1, 2, 3, 4, 5, 6].filter(k => NV(k).estado === 'reforzar'),
      temas,
      relampagoRecord: j.relampagoRecord || 0,
      logros: (j.logros || []).slice()
    };
  }

  LS.juego = { abrir, atras, resumen, ERR: G.ERR, _gen: G };
})();
