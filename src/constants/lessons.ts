import type { MaterialIcons } from '@expo/vector-icons';

export type LessonExample = {
  /** Línea principal del ejemplo (ej. "5 + 3 = 8"). */
  expression: string;
  /** Comentario opcional debajo (ej. "Cinco unidades más tres unidades dan ocho."). */
  note?: string;
};

/** Sub-sección teórica adicional dentro de la lección. */
export type LessonSection = {
  title: string;
  body: string;
  /** Bullets/listas dentro de la sub-sección (opcional). */
  bullets?: string[];
};

/** Ejercicio resuelto paso a paso. */
export type WorkedExample = {
  title: string;
  steps: string[];
};

export type Lesson = {
  topicId: string;
  courseId: 'math' | 'physics' | 'code' | 'english';
  title: string;
  summary: string;
  estimatedMin: number;
  concepts: string[];
  examples?: LessonExample[];
  formula?: string;
  tip?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Sub-secciones teóricas para profundizar más allá de los conceptos. */
  sections?: LessonSection[];
  /** Ejercicios resueltos paso a paso. */
  workedExamples?: WorkedExample[];
  /** Errores comunes que conviene evitar. */
  commonMistakes?: string[];
  /** Resumen final con los puntos clave (3–5 bullets). */
  recap?: string[];
  /** Mensaje motivacional justo antes de practicar. */
  quizPrep?: string;
};

export const LESSONS: Record<string, Lesson> = {
  // ---------------- Matemáticas ----------------
  sum: {
    topicId: 'sum',
    courseId: 'math',
    title: 'Suma',
    summary:
      'La suma combina cantidades para obtener un total. Es la operación más básica de la aritmética.',
    estimatedMin: 6,
    concepts: [
      'El símbolo de la suma es +',
      'Los números que se suman se llaman sumandos; el resultado, suma o total',
      'El orden no altera el resultado: 5 + 3 = 3 + 5 (conmutativa)',
      'Sumar cero deja el número igual: a + 0 = a (elemento neutro)',
      'Se puede agrupar libremente: (2 + 3) + 4 = 2 + (3 + 4) (asociativa)',
      'La suma siempre da un número mayor (o igual) si todos son positivos',
    ],
    sections: [
      {
        title: 'Suma vertical (con llevadas)',
        body:
          'Cuando la suma de una columna supera 9, escribimos la unidad y "llevamos" la decena a la siguiente columna. Es la técnica clásica que se usa con lápiz y papel.',
        bullets: [
          'Alinea los números por la derecha (unidades con unidades).',
          'Suma columna por columna empezando por las unidades.',
          'Si una columna pasa de 9, escribe el dígito de unidades y suma 1 arriba en la siguiente.',
        ],
      },
      {
        title: 'Sumas mentales rápidas',
        body:
          'Para sumar más rápido en la cabeza, puedes redondear y compensar, o partir uno de los sumandos.',
        bullets: [
          'Redondea: 28 + 47 → 30 + 47 − 2 = 75',
          'Parte el sumando: 36 + 18 → 36 + 10 + 8 = 54',
        ],
      },
    ],
    examples: [
      { expression: '5 + 3 = 8' },
      { expression: '12 + 9 = 21' },
      { expression: '128 + 47 = 175' },
    ],
    workedExamples: [
      {
        title: 'Suma 257 + 168',
        steps: [
          'Unidades: 7 + 8 = 15. Escribo 5, llevo 1.',
          'Decenas: 5 + 6 + 1 (llevada) = 12. Escribo 2, llevo 1.',
          'Centenas: 2 + 1 + 1 (llevada) = 4. Escribo 4.',
          'Resultado: 425.',
        ],
      },
    ],
    commonMistakes: [
      'Olvidar la llevada al sumar columnas grandes.',
      'No alinear bien los dígitos por la derecha.',
      'Confundir suma con multiplicación al ver el signo +.',
    ],
    recap: [
      'La suma combina cantidades.',
      'Es conmutativa y asociativa.',
      'El cero es el elemento neutro.',
      'Para números grandes: suma vertical con llevadas.',
    ],
    quizPrep:
      '¿Listo? Empezamos con sumas simples y subimos a problemas de la vida real.',
    tip: 'Si el número es grande, suma primero las unidades, luego las decenas.',
    icon: 'add',
  },
  sub: {
    topicId: 'sub',
    courseId: 'math',
    title: 'Resta',
    summary:
      'La resta quita una cantidad de otra. Es la operación opuesta a la suma.',
    estimatedMin: 3,
    concepts: [
      'El símbolo de la resta es −',
      'A diferencia de la suma, el orden sí importa: 5 − 3 ≠ 3 − 5',
      'Restar cero deja el número igual: a − 0 = a',
      'Restar un número a sí mismo da 0: a − a = 0',
    ],
    examples: [
      { expression: '10 − 4 = 6' },
      { expression: '25 − 9 = 16' },
    ],
    tip: 'Si te confundes, piensa la resta como "¿cuánto le falta a este número para llegar al otro?".',
    icon: 'remove',
  },
  mul: {
    topicId: 'mul',
    courseId: 'math',
    title: 'Multiplicación',
    summary:
      'La multiplicación es una suma repetida: 4 × 3 significa "sumar 4 tres veces".',
    estimatedMin: 7,
    concepts: [
      'El símbolo es × (o · o *)',
      'Los números se llaman factores; el resultado, producto',
      'Es conmutativa: 6 × 7 = 7 × 6',
      'Es asociativa: (2 × 3) × 4 = 2 × (3 × 4)',
      'Multiplicar por 0 siempre da 0 (elemento absorbente)',
      'Multiplicar por 1 deja el número igual (elemento neutro)',
      'Distribuye con la suma: a × (b + c) = a × b + a × c',
    ],
    sections: [
      {
        title: 'Tablas de multiplicar',
        body:
          'Memorizar las tablas del 1 al 10 es el atajo más importante en aritmética. La tabla del 0 y la del 1 son triviales; la del 10 también (solo añade un cero).',
        bullets: [
          'Tabla del 2: duplicar.',
          'Tabla del 5: termina en 0 o 5.',
          'Tabla del 9: los dígitos del resultado suman 9.',
          'Tabla del 11 (1–9): repite el dígito (3 × 11 = 33).',
        ],
      },
      {
        title: 'Multiplicación por descomposición',
        body:
          'Para multiplicar números grandes en la cabeza, conviene descomponer uno en sumas más simples y usar la propiedad distributiva.',
        bullets: [
          '12 × 7 = (10 + 2) × 7 = 70 + 14 = 84',
          '25 × 8 = (25 × 8) = 200 (porque 25 × 4 = 100)',
        ],
      },
    ],
    examples: [
      { expression: '6 × 7 = 42' },
      { expression: '4 × 12 = 48', note: '4 sumado doce veces.' },
      { expression: '25 × 8 = 200', note: 'Truco: 25 × 4 = 100, luego × 2.' },
    ],
    workedExamples: [
      {
        title: 'Multiplica 34 × 12',
        steps: [
          'Descompón 12 = 10 + 2.',
          '34 × 10 = 340.',
          '34 × 2 = 68.',
          'Suma: 340 + 68 = 408.',
        ],
      },
    ],
    commonMistakes: [
      'Olvidar que cualquier número × 0 = 0.',
      'Confundir conmutativa (suma/multiplicación) con asociativa.',
      'No aplicar la distributiva al despejar paréntesis.',
    ],
    recap: [
      'La multiplicación es suma repetida.',
      'Conmutativa, asociativa y distributiva.',
      'Las tablas son la base: memorízalas.',
      'Descompón para hacerlo más fácil.',
    ],
    quizPrep:
      'Empezamos con tablas básicas y vamos hacia descomposiciones más grandes.',
    tip: 'Aprende las tablas del 2 al 10 de memoria: es la base de toda la aritmética.',
    icon: 'close',
  },
  div: {
    topicId: 'div',
    courseId: 'math',
    title: 'División',
    summary:
      'La división reparte una cantidad en partes iguales. Es la operación opuesta a la multiplicación.',
    estimatedMin: 4,
    concepts: [
      'El símbolo es ÷ (o /)',
      'No se puede dividir entre cero',
      'Dividir entre 1 deja el número igual',
      'Si a × b = c, entonces c ÷ b = a',
    ],
    examples: [
      { expression: '20 ÷ 4 = 5', note: 'Reparto 20 entre 4 grupos = 5 en cada grupo.' },
      { expression: '72 ÷ 8 = 9' },
    ],
    tip: 'Toda división puede verificarse multiplicando: 20 ÷ 4 = 5  →  5 × 4 = 20 ✓',
    icon: 'horizontal-rule',
  },
  order: {
    topicId: 'order',
    courseId: 'math',
    title: 'Jerarquía de operaciones',
    summary:
      'Cuando hay varias operaciones, no se resuelven de izquierda a derecha: hay un orden establecido.',
    estimatedMin: 5,
    concepts: [
      '1. Paréntesis ( )',
      '2. Potencias y raíces',
      '3. Multiplicaciones y divisiones (de izquierda a derecha)',
      '4. Sumas y restas (de izquierda a derecha)',
    ],
    examples: [
      {
        expression: '2 + 3 × 4 = 14',
        note: 'Primero la multiplicación: 3 × 4 = 12. Luego 2 + 12 = 14.',
      },
      {
        expression: '(2 + 3) × 4 = 20',
        note: 'Los paréntesis cambian el orden.',
      },
    ],
    tip: 'Regla mnemotécnica: PEMDAS (Paréntesis, Exponentes, Multiplicación/División, Adición/Sustracción).',
    icon: 'rule',
  },
  simplify: {
    topicId: 'simplify',
    courseId: 'math',
    title: 'Simplificar fracciones',
    summary:
      'Simplificar es reducir una fracción a su forma más pequeña sin cambiar su valor.',
    estimatedMin: 4,
    concepts: [
      'Divide numerador y denominador entre su MCD',
      'Si numerador y denominador no tienen divisores comunes, ya está simplificada',
      'Una fracción simplificada vale lo mismo que la original',
    ],
    examples: [
      { expression: '4/8 = 1/2', note: 'Divido arriba y abajo entre 4.' },
      { expression: '9/12 = 3/4', note: 'Divido entre 3.' },
    ],
    tip: 'Una fracción está completamente simplificada cuando el único divisor común es 1.',
    icon: 'percent',
  },
  'frac-sum': {
    topicId: 'frac-sum',
    courseId: 'math',
    title: 'Suma de fracciones',
    summary:
      'Para sumar fracciones primero necesitan el mismo denominador.',
    estimatedMin: 5,
    concepts: [
      'Mismo denominador: suma los numeradores y deja el denominador igual',
      'Diferente denominador: encuentra el común múltiplo primero',
      'Simplifica el resultado siempre que sea posible',
    ],
    examples: [
      { expression: '1/4 + 1/4 = 2/4 = 1/2' },
      { expression: '1/2 + 1/4 = 2/4 + 1/4 = 3/4' },
    ],
    icon: 'add',
  },
  'frac-mul': {
    topicId: 'frac-mul',
    courseId: 'math',
    title: 'Multiplicación de fracciones',
    summary:
      'Multiplicar fracciones es más simple que sumarlas: solo multiplica en línea.',
    estimatedMin: 4,
    concepts: [
      'Numerador × numerador',
      'Denominador × denominador',
      'No necesitas denominador común',
      'Simplifica al final',
    ],
    examples: [
      { expression: '1/2 × 1/3 = 1/6' },
      { expression: '3/4 × 2/5 = 6/20 = 3/10' },
    ],
    tip: 'Un entero es una fracción con denominador 1: 4 = 4/1.',
    icon: 'close',
  },
  vars: {
    topicId: 'vars',
    courseId: 'math',
    title: 'Variables',
    summary:
      'Una variable es una letra que representa un número desconocido o que puede cambiar.',
    estimatedMin: 4,
    concepts: [
      'Las más comunes son x, y, z, a, b',
      '"2x" significa "2 por x"',
      'Para evaluar, sustituye la letra por su valor',
      'Permiten escribir reglas generales',
    ],
    examples: [
      { expression: 'Si x = 5  →  2x = 10' },
      { expression: 'Si y = 3  →  y + 4 = 7' },
    ],
    icon: 'code',
  },
  isolate: {
    topicId: 'isolate',
    courseId: 'math',
    title: 'Despeje simple',
    summary:
      'Despejar una variable es dejarla sola en un lado de la ecuación.',
    estimatedMin: 5,
    concepts: [
      'Lo que está sumando pasa restando',
      'Lo que está restando pasa sumando',
      'Lo que está multiplicando pasa dividiendo',
      'Lo que se haga a un lado debe hacerse al otro',
    ],
    examples: [
      { expression: 'x + 5 = 10  →  x = 10 − 5 = 5' },
      { expression: '4x = 20  →  x = 20 ÷ 4 = 5' },
    ],
    icon: 'tune',
  },
  linear: {
    topicId: 'linear',
    courseId: 'math',
    title: 'Ecuaciones lineales',
    summary:
      'Una ecuación lineal mezcla suma, resta y multiplicación con una variable.',
    estimatedMin: 9,
    concepts: [
      'Una ecuación es una igualdad con al menos una incógnita',
      'Lineal significa que la variable está elevada a la 1 (sin x², √x, etc.)',
      'Primero pasa los números al otro lado (operación inversa)',
      'Luego pasa lo que multiplica a dividir',
      'Cualquier cosa que hagas a un lado, hazla al otro',
      'El resultado es el valor de la variable que cumple la igualdad',
    ],
    sections: [
      {
        title: 'Pasos generales para resolver',
        body:
          'Resolver una ecuación lineal es como "desenvolver" la variable. Sigue siempre los mismos pasos para no perderte.',
        bullets: [
          '1) Quita paréntesis si los hay (distributiva).',
          '2) Junta los términos con x en un lado.',
          '3) Junta los números en el otro lado.',
          '4) Divide ambos lados por el coeficiente de x.',
        ],
      },
      {
        title: 'Verificación',
        body:
          'Una buena costumbre: sustituye el valor obtenido en la ecuación original. Si ambos lados dan lo mismo, está bien resuelta.',
      },
    ],
    examples: [
      {
        expression: '2x + 4 = 10',
        note: 'Resta 4: 2x = 6. Divide entre 2: x = 3.',
      },
      {
        expression: '3x − 5 = 16',
        note: 'Suma 5: 3x = 21. Divide entre 3: x = 7.',
      },
      {
        expression: '5(x − 2) = 20',
        note: 'Distribuye: 5x − 10 = 20. Suma 10: 5x = 30. Divide: x = 6.',
      },
    ],
    workedExamples: [
      {
        title: 'Resuelve 4x + 3 = 2x + 11',
        steps: [
          'Resta 2x en ambos lados: 4x − 2x + 3 = 11  →  2x + 3 = 11.',
          'Resta 3: 2x = 8.',
          'Divide entre 2: x = 4.',
          'Verifica: 4(4) + 3 = 19 y 2(4) + 11 = 19. ¡Listo!',
        ],
      },
    ],
    commonMistakes: [
      'Cambiar de signo solo a un término al pasar al otro lado.',
      'Olvidar la distributiva con paréntesis.',
      'Dividir solo a una parte del lado en lugar de todo el lado.',
    ],
    recap: [
      'Aísla los términos con x en un lado.',
      'Pasa los números al otro lado (operación inversa).',
      'Divide entre el coeficiente para obtener x.',
      'Sustituye al final para verificar.',
    ],
    quizPrep: 'Vamos con ecuaciones de un solo paso y luego de dos pasos.',
    icon: 'functions',
  },

  // ---------------- Física ----------------
  speed: {
    topicId: 'speed',
    courseId: 'physics',
    title: 'Velocidad',
    summary:
      'La velocidad mide qué tan rápido se desplaza un objeto en un tiempo dado.',
    estimatedMin: 4,
    concepts: [
      'Relaciona distancia y tiempo',
      'Unidad SI: metros por segundo (m/s)',
      'Unidad común: km/h',
      'A mayor distancia en el mismo tiempo, mayor velocidad',
    ],
    formula: 'v = d / t',
    examples: [
      { expression: '100 km ÷ 2 h = 50 km/h' },
      { expression: '60 km ÷ 1.5 h = 40 km/h' },
    ],
    icon: 'speed',
  },
  distance: {
    topicId: 'distance',
    courseId: 'physics',
    title: 'Distancia',
    summary:
      'La distancia es el espacio recorrido. Se obtiene multiplicando velocidad por tiempo.',
    estimatedMin: 4,
    concepts: [
      'Es el resultado de v × t',
      'Unidad SI: metros (m)',
      'Otras unidades comunes: km, cm',
      'Es siempre positiva',
    ],
    formula: 'd = v × t',
    examples: [
      { expression: '60 km/h × 2 h = 120 km' },
      { expression: '80 km/h × 3 h = 240 km' },
    ],
    icon: 'straighten',
  },
  time: {
    topicId: 'time',
    courseId: 'physics',
    title: 'Tiempo',
    summary:
      'El tiempo es cuánto tarda algo en suceder. Se obtiene dividiendo distancia entre velocidad.',
    estimatedMin: 4,
    concepts: [
      'Se calcula como d / v',
      'Unidad SI: segundos (s)',
      'Otras: minutos, horas',
      'A mayor velocidad, menor tiempo para la misma distancia',
    ],
    formula: 't = d / v',
    examples: [
      { expression: '100 km ÷ 50 km/h = 2 h' },
      { expression: '200 km ÷ 100 km/h = 2 h' },
    ],
    icon: 'schedule',
  },
  mass: {
    topicId: 'mass',
    courseId: 'physics',
    title: 'Masa',
    summary:
      'La masa es la cantidad de materia que tiene un objeto. No cambia con la ubicación.',
    estimatedMin: 4,
    concepts: [
      'Unidad SI: kilogramo (kg)',
      'No es lo mismo que peso (peso depende de la gravedad)',
      'En la 2ª ley de Newton: F = m × a',
      'A mayor masa, mayor fuerza necesaria para moverla',
    ],
    formula: 'm = F / a',
    examples: [
      { expression: 'F = 10 N, a = 2 m/s²  →  m = 5 kg' },
    ],
    icon: 'fitness-center',
  },
  force: {
    topicId: 'force',
    courseId: 'physics',
    title: 'Fuerza',
    summary:
      'Una fuerza es una acción que puede cambiar el movimiento de un objeto.',
    estimatedMin: 8,
    concepts: [
      'Unidad SI: Newton (N). 1 N = 1 kg·m/s²',
      'Segunda ley de Newton: F = m × a',
      'A mayor fuerza, mayor aceleración (con la misma masa)',
      'A mayor masa, menor aceleración (con la misma fuerza)',
      'Las fuerzas son vectores: tienen magnitud y dirección',
      'Si hay varias fuerzas, importa la fuerza neta (la suma vectorial)',
    ],
    sections: [
      {
        title: 'Las tres leyes de Newton (resumen)',
        body:
          'La fuerza vive dentro de las tres leyes que describen todo movimiento clásico.',
        bullets: [
          '1ª: Un cuerpo en reposo o movimiento uniforme sigue así si no hay fuerza neta.',
          '2ª: F = m × a (la fuerza neta acelera).',
          '3ª: A toda acción corresponde una reacción igual y opuesta.',
        ],
      },
      {
        title: 'Tipos de fuerzas comunes',
        body:
          'En problemas escolares aparecen una y otra vez las mismas fuerzas. Vale la pena identificarlas.',
        bullets: [
          'Peso: P = m × g, siempre hacia abajo.',
          'Normal: la superficie empuja perpendicular al objeto.',
          'Fricción: opuesta al movimiento, depende de la superficie.',
          'Tensión: en cuerdas, hilos y cables.',
        ],
      },
    ],
    formula: 'F = m × a',
    examples: [
      { expression: 'm = 4 kg, a = 5 m/s²  →  F = 20 N' },
      { expression: 'm = 10 kg, a = 2 m/s²  →  F = 20 N' },
      {
        expression: 'F = 100 N, m = 25 kg  →  a = 4 m/s²',
        note: 'Despeja: a = F / m.',
      },
    ],
    workedExamples: [
      {
        title: 'Caja de 5 kg empujada con 30 N',
        steps: [
          'Datos: m = 5 kg, F = 30 N.',
          'Aplica la 2ª ley: a = F / m = 30 / 5.',
          'Resultado: a = 6 m/s².',
          'La caja se acelera 6 m/s² en la dirección de la fuerza.',
        ],
      },
    ],
    commonMistakes: [
      'Confundir masa (kg) con peso (N).',
      'Olvidar que la fuerza neta es la SUMA de todas las fuerzas (con dirección).',
      'Pensar que sin fuerza no hay velocidad (puede haber: la 1ª ley).',
    ],
    recap: [
      'F = m × a relaciona fuerza, masa y aceleración.',
      'La fuerza neta determina el cambio de movimiento.',
      'Las fuerzas son vectores.',
      'Identifica las fuerzas comunes (peso, normal, fricción).',
    ],
    quizPrep: 'Calcularemos fuerzas, masas y aceleraciones a partir de la 2ª ley.',
    icon: 'bolt',
  },
  accel: {
    topicId: 'accel',
    courseId: 'physics',
    title: 'Aceleración',
    summary:
      'La aceleración es el cambio de velocidad por unidad de tiempo.',
    estimatedMin: 5,
    concepts: [
      'Unidad SI: metros por segundo cuadrado (m/s²)',
      'Es positiva si el objeto se acelera, negativa si frena',
      'Se obtiene como F / m',
      'La gravedad terrestre es ≈ 9.8 m/s²',
    ],
    formula: 'a = F / m',
    examples: [
      { expression: 'F = 20 N, m = 4 kg  →  a = 5 m/s²' },
      { expression: 'F = 50 N, m = 5 kg  →  a = 10 m/s²' },
    ],
    icon: 'trending-up',
  },
  kinetic: {
    topicId: 'kinetic',
    courseId: 'physics',
    title: 'Energía cinética',
    summary:
      'La energía cinética es la energía que tiene un objeto por estar en movimiento.',
    estimatedMin: 5,
    concepts: [
      'Depende de la masa y de la velocidad al cuadrado',
      'Unidad SI: Joule (J)',
      'A mayor velocidad, MUCHO más energía',
      'En reposo (v = 0) la energía cinética es 0',
    ],
    formula: 'Ec = ½ × m × v²',
    examples: [
      { expression: 'm = 2 kg, v = 4 m/s  →  Ec = ½ × 2 × 16 = 16 J' },
    ],
    icon: 'directions-run',
  },
  potential: {
    topicId: 'potential',
    courseId: 'physics',
    title: 'Energía potencial',
    summary:
      'La energía potencial es la energía almacenada por la posición de un objeto (típicamente la altura).',
    estimatedMin: 5,
    concepts: [
      'Depende de masa, gravedad y altura',
      'Unidad SI: Joule (J)',
      'A mayor altura, más energía potencial',
      'Cuando algo cae, esta energía se convierte en cinética',
    ],
    formula: 'Ep = m × g × h',
    examples: [
      { expression: 'm = 3 kg, g = 10, h = 5 m  →  Ep = 150 J' },
    ],
    tip: 'En la Tierra usamos g = 9.8 m/s² (a veces redondeado a 10).',
    icon: 'battery-charging-full',
  },

  // ---------------- Programación ----------------
  tags: {
    topicId: 'tags',
    courseId: 'code',
    title: 'Etiquetas HTML',
    summary:
      'HTML usa etiquetas para estructurar el contenido de una página web.',
    estimatedMin: 4,
    concepts: [
      'Las etiquetas se escriben entre < y >',
      'La mayoría se abren y cierran: <p>...</p>',
      'Algunas son autocerradas: <br>, <img>',
      'Pueden tener atributos: <img src="foto.jpg">',
    ],
    examples: [
      { expression: '<p>Hola mundo</p>' },
      { expression: '<b>texto en negrita</b>' },
    ],
    icon: 'tag',
  },
  titles: {
    topicId: 'titles',
    courseId: 'code',
    title: 'Títulos en HTML',
    summary:
      'Los títulos jerarquizan el contenido. Existen 6 niveles, de h1 (el más grande) a h6 (el más pequeño).',
    estimatedMin: 3,
    concepts: [
      '<h1> es el título principal de la página',
      '<h2> hasta <h6> son subtítulos',
      'Usa solo un <h1> por página',
      'Los buscadores los usan para entender el contenido',
    ],
    examples: [
      { expression: '<h1>Título principal</h1>' },
      { expression: '<h2>Subtítulo</h2>' },
    ],
    icon: 'title',
  },
  paragraphs: {
    topicId: 'paragraphs',
    courseId: 'code',
    title: 'Párrafos',
    summary:
      'Los párrafos contienen el texto principal del contenido de una página.',
    estimatedMin: 3,
    concepts: [
      'Se escriben con la etiqueta <p>',
      'Cada <p> se separa visualmente del siguiente',
      'Para un salto de línea sin nuevo párrafo: <br>',
      'Pueden contener otras etiquetas: <b>, <i>, <a>',
    ],
    examples: [
      { expression: '<p>Este es un párrafo de ejemplo.</p>' },
    ],
    icon: 'subject',
  },
  images: {
    topicId: 'images',
    courseId: 'code',
    title: 'Imágenes',
    summary:
      'La etiqueta <img> inserta imágenes en una página HTML.',
    estimatedMin: 3,
    concepts: [
      'Se usa <img src="..." alt="...">',
      '"src" es la ruta del archivo',
      '"alt" es el texto alternativo para accesibilidad',
      'Es autocerrada (no necesita </img>)',
    ],
    examples: [
      { expression: '<img src="gato.jpg" alt="Gato negro">' },
    ],
    icon: 'image',
  },
  links: {
    topicId: 'links',
    courseId: 'code',
    title: 'Enlaces (Links)',
    summary:
      'Los enlaces conectan páginas web entre sí usando la etiqueta <a>.',
    estimatedMin: 3,
    concepts: [
      'Se escriben con <a href="...">texto</a>',
      '"href" es la URL de destino',
      'target="_blank" abre en otra pestaña',
      'Pueden enlazar a otras páginas o a la misma',
    ],
    examples: [
      { expression: '<a href="https://google.com">Ir a Google</a>' },
    ],
    icon: 'link',
  },
  colors: {
    topicId: 'colors',
    courseId: 'code',
    title: 'Colores en CSS',
    summary:
      'CSS controla cómo se ven los elementos. Los colores se aplican con varias propiedades.',
    estimatedMin: 4,
    concepts: [
      'color → color del texto',
      'background-color → color de fondo',
      'Formatos: nombre (red), hex (#FF0000), rgb(255,0,0)',
      'Existen 140+ nombres predefinidos',
    ],
    examples: [
      { expression: 'color: red;' },
      { expression: 'background-color: #131125;' },
    ],
    icon: 'palette',
  },
  margins: {
    topicId: 'margins',
    courseId: 'code',
    title: 'Márgenes y espaciado',
    summary:
      'Margin crea espacio fuera del elemento. Padding crea espacio dentro.',
    estimatedMin: 4,
    concepts: [
      'margin → espacio exterior',
      'padding → espacio interior',
      'border → línea entre margin y padding',
      'margin: auto centra horizontalmente',
    ],
    examples: [
      { expression: 'margin: 16px;' },
      { expression: 'padding: 8px 16px;' },
    ],
    icon: 'border-style',
  },
  flex: {
    topicId: 'flex',
    courseId: 'code',
    title: 'Flexbox básico',
    summary:
      'Flexbox es la forma moderna de organizar elementos en una fila o columna.',
    estimatedMin: 9,
    concepts: [
      'display: flex activa Flexbox en el contenedor',
      'flex-direction: row | column define el eje principal',
      'justify-content alinea en el eje principal',
      'align-items alinea en el eje cruzado',
      'gap define el espacio entre hijos sin usar márgenes',
      'flex-wrap: wrap deja que los hijos pasen a la siguiente línea',
    ],
    sections: [
      {
        title: 'Los dos ejes',
        body:
          'Flexbox piensa en dos ejes: el principal (definido por flex-direction) y el cruzado (perpendicular). Casi todas las propiedades se refieren a uno u otro.',
        bullets: [
          'Si flex-direction es row → eje principal: horizontal.',
          'Si flex-direction es column → eje principal: vertical.',
          'justify-content actúa en el principal.',
          'align-items actúa en el cruzado.',
        ],
      },
      {
        title: 'Valores más usados de justify-content',
        body:
          'Estos son los valores que vas a usar el 90% de las veces.',
        bullets: [
          'flex-start: pega al inicio.',
          'center: centra.',
          'flex-end: pega al final.',
          'space-between: separa por igual, sin espacio en los extremos.',
          'space-around: separa por igual, con la mitad de espacio en los extremos.',
        ],
      },
      {
        title: 'Hijos: flex: 1',
        body:
          'Cuando un hijo tiene "flex: 1", crece para ocupar todo el espacio disponible. Es la forma rápida de hacer que dos cajas se repartan el ancho a la mitad.',
      },
    ],
    examples: [
      {
        expression: 'display: flex;\njustify-content: center;',
        note: 'Centra los hijos horizontalmente.',
      },
      {
        expression: 'display: flex;\nflex-direction: column;\ngap: 16px;',
        note: 'Apila los hijos en columna con 16px entre cada uno.',
      },
      {
        expression: 'display: flex;\njustify-content: space-between;\nalign-items: center;',
        note: 'Clásico de un header: logo a la izquierda, botón a la derecha, ambos centrados verticalmente.',
      },
    ],
    workedExamples: [
      {
        title: 'Centra una tarjeta perfectamente',
        steps: [
          'Crea un contenedor que ocupe toda la pantalla.',
          'Aplica display: flex en el contenedor.',
          'Añade justify-content: center y align-items: center.',
          'La tarjeta hija quedará centrada en ambos ejes.',
        ],
      },
    ],
    commonMistakes: [
      'Aplicar las propiedades flex a los hijos en lugar del contenedor.',
      'Confundir justify-content con align-items.',
      'Olvidar que cuando cambias flex-direction, los ejes se invierten.',
    ],
    recap: [
      'Activa con display: flex.',
      'Decide el eje con flex-direction.',
      'Alinea con justify-content (principal) y align-items (cruzado).',
      'Distribuye con gap.',
    ],
    quizPrep: 'Vamos a configurar layouts típicos con Flexbox.',
    icon: 'dashboard',
  },
  'js-vars': {
    topicId: 'js-vars',
    courseId: 'code',
    title: 'Variables en JS',
    summary:
      'Las variables almacenan datos que puedes usar después en tu código.',
    estimatedMin: 7,
    concepts: [
      'let → variable que puede cambiar',
      'const → constante, no se puede reasignar',
      'var → forma antigua (evítala)',
      'El valor se asigna con =',
      'JavaScript es dinámico: una variable puede cambiar de tipo',
      'Usa nombres descriptivos en camelCase: precioTotal, nombreUsuario',
    ],
    sections: [
      {
        title: 'Tipos primitivos básicos',
        body:
          'Las variables guardan valores, y esos valores tienen un tipo. Conocer los principales te ayudará a evitar errores.',
        bullets: [
          'string: texto entre comillas. Ej. "hola"',
          'number: cualquier número. Ej. 18, 3.14',
          'boolean: true o false',
          'null: valor intencionalmente vacío',
          'undefined: variable declarada pero sin valor',
        ],
      },
      {
        title: 'let vs const',
        body:
          'En el código moderno se prefiere const por defecto y solo se usa let cuando sabes que el valor va a cambiar. Esto hace el código más previsible.',
      },
      {
        title: 'Reglas para nombrar',
        body:
          'Los nombres de variables siguen reglas estrictas y convenciones que el equipo acuerda.',
        bullets: [
          'No pueden empezar con número.',
          'Distinguen mayúsculas y minúsculas (edad ≠ Edad).',
          'No pueden ser palabras reservadas (if, for, return…).',
          'Convención: camelCase para variables, UPPER_CASE para constantes globales.',
        ],
      },
    ],
    examples: [
      { expression: 'let edad = 18;' },
      { expression: 'const PI = 3.1416;' },
      { expression: 'let nombre = "Ana";' },
      { expression: 'const esActivo = true;' },
    ],
    workedExamples: [
      {
        title: 'Calcula el área de un círculo',
        steps: [
          'Define la constante: const PI = 3.1416;',
          'Declara el radio como variable: let radio = 5;',
          'Calcula el área: const area = PI * radio * radio;',
          'Imprime: console.log(area); // 78.54',
        ],
      },
    ],
    commonMistakes: [
      'Reasignar una const (lanza TypeError).',
      'Usar una variable antes de declararla.',
      'Comparar con == cuando se debería usar === (estricto).',
    ],
    recap: [
      'Usa const por defecto, let si el valor cambia.',
      'Conoce los 5 tipos primitivos básicos.',
      'Sigue las convenciones de nombres (camelCase).',
      'Evita var en código moderno.',
    ],
    quizPrep: 'Vamos a declarar variables y predecir qué imprime el código.',
    icon: 'code',
  },
  conds: {
    topicId: 'conds',
    courseId: 'code',
    title: 'Condiciones (if)',
    summary:
      'Los condicionales ejecutan código solo si se cumple una condición.',
    estimatedMin: 5,
    concepts: [
      'Sintaxis: if (condición) { ... }',
      'Comparaciones: ==, ===, !=, <, >, <=, >=',
      'else { ... } ejecuta si la condición es falsa',
      'Se pueden encadenar con else if',
    ],
    examples: [
      {
        expression:
          'let edad = 18;\nif (edad >= 18) {\n  console.log("Mayor");\n}',
        note: 'Imprime "Mayor" porque 18 >= 18 es verdadero.',
      },
    ],
    icon: 'alt-route',
  },
  funcs: {
    topicId: 'funcs',
    courseId: 'code',
    title: 'Funciones simples',
    summary:
      'Las funciones agrupan código que puedes reutilizar invocándolo por su nombre.',
    estimatedMin: 5,
    concepts: [
      'Se declaran con la palabra function',
      'Se invocan con ()',
      'Pueden recibir parámetros y devolver valores con return',
      'Permiten escribir código limpio y reutilizable',
    ],
    examples: [
      {
        expression:
          'function saludar(nombre) {\n  return "Hola " + nombre;\n}\nsaludar("Ana");',
        note: 'Devuelve "Hola Ana".',
      },
    ],
    icon: 'functions',
  },

  // ---------------- Inglés ----------------
  hello: {
    topicId: 'hello',
    courseId: 'english',
    title: 'Saludos: Hello',
    summary:
      '"Hello" es el saludo formal e informal más común en inglés.',
    estimatedMin: 6,
    concepts: [
      'Hello → Hola (formal/neutro)',
      'Hi → Hola (informal)',
      'Hey → ¡Hola! / ¡Oye! (muy informal)',
      'Good morning → Buenos días (hasta ~12 PM)',
      'Good afternoon → Buenas tardes (12 PM – 6 PM)',
      'Good evening → Buenas noches al saludar (después de 6 PM)',
      'Good night → Buenas noches al despedirse',
    ],
    sections: [
      {
        title: '¿Formal o informal?',
        body:
          'Elegir el saludo correcto evita malentendidos. La regla general: en contextos profesionales o con desconocidos, usa formal; con amigos, informal.',
        bullets: [
          'Formal: Hello / Good morning / Good afternoon.',
          'Informal: Hi / Hey / What\'s up?',
          'Saludo escrito en email: Dear [Nombre], … (muy formal).',
          'Saludo en chat: Hi / Hey (informal).',
        ],
      },
      {
        title: 'Saludo + nombre',
        body:
          'En inglés es muy común incluir el nombre directamente después del saludo. Suena cálido y personal.',
        bullets: [
          'Hello, Ana.',
          'Hi, John!',
          'Good morning, Ms. García.',
        ],
      },
      {
        title: 'Diferencia con español',
        body:
          'A diferencia del español, "Good morning" se usa hasta el mediodía sin importar si la persona ya almorzó. Y "Good evening" se usa para SALUDAR de noche, no para despedirte (eso es "Good night").',
      },
    ],
    examples: [
      { expression: '"Hello, how are you?"', note: '"Hola, ¿cómo estás?"' },
      { expression: '"Hi, Ana! Long time no see."', note: '"¡Hola, Ana! ¡Cuánto tiempo!"' },
      { expression: '"Good evening, Mr. Smith."', note: '"Buenas noches, Sr. Smith." (al saludar)' },
    ],
    workedExamples: [
      {
        title: 'Saluda en distintos contextos',
        steps: [
          'A un amigo a las 9 AM: "Hi, Carlos!"',
          'A tu jefe a las 9 AM: "Good morning, Mr. López."',
          'A un cliente por email: "Dear Ms. Pérez, …"',
          'En una llamada a las 8 PM: "Good evening, this is Ana speaking."',
        ],
      },
    ],
    commonMistakes: [
      'Usar "Good night" para saludar de noche (es solo para despedirse).',
      'Mezclar "Hello, sir" con "Hey, dude" en el mismo mensaje.',
      'Olvidar la coma después del saludo: "Hello, Ana" (no "Hello Ana").',
    ],
    recap: [
      'Hello/Hi/Hey según el grado de formalidad.',
      'Good morning/afternoon/evening según la hora.',
      '"Good night" es solo para despedirse.',
      'Incluir el nombre suena más cálido.',
    ],
    quizPrep: 'Vas a elegir el saludo correcto según contexto y hora.',
    icon: 'waving-hand',
  },
  bye: {
    topicId: 'bye',
    courseId: 'english',
    title: 'Despedidas: Goodbye',
    summary:
      '"Goodbye" es la despedida más común. Hay variantes según el contexto.',
    estimatedMin: 3,
    concepts: [
      'Goodbye → Adiós (formal)',
      'Bye → Adiós (informal)',
      'See you later → Te veo después',
      'See you tomorrow → Te veo mañana',
      'Good night → Buenas noches (al despedirse)',
    ],
    examples: [
      { expression: '"See you later, Ana!"', note: '"¡Te veo después, Ana!"' },
    ],
    icon: 'logout',
  },
  howareyou: {
    topicId: 'howareyou',
    courseId: 'english',
    title: '¿How are you?',
    summary:
      'Pregunta común para iniciar una conversación. Significa "¿cómo estás?".',
    estimatedMin: 3,
    concepts: [
      'How are you? → ¿Cómo estás?',
      'I\'m fine, thanks → Estoy bien, gracias',
      'I\'m good → Estoy bien',
      'Not bad → No tan mal',
      'And you? → ¿Y tú?',
    ],
    examples: [
      {
        expression: '— How are you?\n— I\'m fine, thanks. And you?',
        note: 'Diálogo típico al encontrarte con alguien.',
      },
    ],
    icon: 'chat',
  },
  'i-am': {
    topicId: 'i-am',
    courseId: 'english',
    title: 'I am',
    summary:
      '"I am" es la forma del verbo "to be" en primera persona singular. Significa "yo soy" o "yo estoy".',
    estimatedMin: 4,
    concepts: [
      'I am → Yo soy / Yo estoy',
      'Contracción: I\'m',
      'Se usa para presentarte: I\'m Ana',
      'Se usa para tu estado: I\'m happy',
      'Para profesiones: I\'m a student',
    ],
    examples: [
      { expression: 'I am a student.', note: 'Soy un estudiante.' },
      { expression: 'I\'m tired.', note: 'Estoy cansado.' },
    ],
    icon: 'person',
  },
  'you-are': {
    topicId: 'you-are',
    courseId: 'english',
    title: 'You are',
    summary:
      '"You are" es la forma del verbo "to be" en segunda persona. Significa "tú eres" o "tú estás".',
    estimatedMin: 4,
    concepts: [
      'You are → Tú eres / Tú estás',
      'Contracción: You\'re',
      'Sirve para singular y plural ("ustedes son")',
      'Se usa para describir a alguien: You are kind',
    ],
    examples: [
      { expression: 'You are my friend.', note: 'Tú eres mi amigo.' },
      { expression: 'You\'re very smart.', note: 'Eres muy inteligente.' },
    ],
    icon: 'people',
  },
  'he-is': {
    topicId: 'he-is',
    courseId: 'english',
    title: 'He is',
    summary:
      '"He is" es la forma del verbo "to be" en tercera persona masculina. Significa "él es" o "él está".',
    estimatedMin: 4,
    concepts: [
      'He is → Él es / Él está',
      'Contracción: He\'s',
      'Para mujeres usa She is (She\'s)',
      'Para objetos o animales usa It is (It\'s)',
    ],
    examples: [
      { expression: 'He is a teacher.', note: 'Él es maestro.' },
      { expression: 'He\'s tall.', note: 'Él es alto.' },
    ],
    icon: 'face',
  },
  'en-colors': {
    topicId: 'en-colors',
    courseId: 'english',
    title: 'Colores en inglés',
    summary:
      'Los colores básicos son palabras muy frecuentes en cualquier conversación.',
    estimatedMin: 3,
    concepts: [
      'Red → Rojo',
      'Blue → Azul',
      'Green → Verde',
      'Yellow → Amarillo',
      'Black → Negro · White → Blanco',
    ],
    examples: [
      { expression: 'The sky is blue.', note: 'El cielo es azul.' },
    ],
    icon: 'palette',
  },
  numbers: {
    topicId: 'numbers',
    courseId: 'english',
    title: 'Números en inglés',
    summary:
      'Los números del 1 al 10 son la base para todos los demás.',
    estimatedMin: 4,
    concepts: [
      '1 one · 2 two · 3 three · 4 four · 5 five',
      '6 six · 7 seven · 8 eight · 9 nine · 10 ten',
      '11 eleven · 12 twelve · 13 thirteen',
      'Del 20 al 99 usa decena + unidad: twenty-five',
    ],
    examples: [
      { expression: 'I have three apples.', note: 'Tengo tres manzanas.' },
    ],
    icon: 'pin',
  },
  objects: {
    topicId: 'objects',
    courseId: 'english',
    title: 'Objetos comunes',
    summary:
      'Vocabulario básico de objetos que te rodean en el día a día.',
    estimatedMin: 3,
    concepts: [
      'Book → Libro · Pen → Pluma · Pencil → Lápiz',
      'Table → Mesa · Chair → Silla',
      'Door → Puerta · Window → Ventana',
      'Phone → Teléfono · Computer → Computadora',
    ],
    examples: [
      { expression: 'The book is on the table.', note: 'El libro está en la mesa.' },
    ],
    icon: 'category',
  },
};

export function getLesson(topicId: string): Lesson | undefined {
  return LESSONS[topicId];
}

export function getAllLessons(): Lesson[] {
  return Object.values(LESSONS);
}

export function getLessonsByCourse(courseId: string): Lesson[] {
  return getAllLessons().filter((l) => l.courseId === courseId);
}
