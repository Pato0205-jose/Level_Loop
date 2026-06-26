export type ExerciseType =
  | 'multiple-choice'
  | 'fill-result'
  | 'quick-answer'
  | 'true-false'
  | 'multi-select'
  | 'match-pairs'
  | 'order-sequence'
  | 'tap-blanks'
  | 'memory-match'
  | 'speed-run'
  | 'number-rain';

export type MultipleChoiceExercise = {
  id: string;
  type: 'multiple-choice';
  prompt: string;
  /** Expresión opcional resaltada arriba de las opciones (e.g. "5 + 3"). */
  expression?: string;
  options: string[];
  correctIndex: number;
  /** Marca preguntas trampa para mostrar un sello especial. */
  trick?: boolean;
};

export type FillResultExercise = {
  id: string;
  type: 'fill-result';
  prompt: string;
  /** Expresión a mostrar con un hueco al final, e.g. "5 + 3 =". */
  expression: string;
  answer: string;
  numeric?: boolean;
  trick?: boolean;
};

export type QuickAnswerExercise = {
  id: string;
  type: 'quick-answer';
  prompt: string;
  expression: string;
  answer: string;
  /** Segundos disponibles para resolver. */
  seconds: number;
  numeric?: boolean;
};

export type TrueFalseExercise = {
  id: string;
  type: 'true-false';
  prompt: string;
  statement: string;
  answer: boolean;
  /** Explicación opcional al fallar. */
  explanation?: string;
  trick?: boolean;
};

export type MultiSelectExercise = {
  id: string;
  type: 'multi-select';
  prompt: string;
  expression?: string;
  options: string[];
  correctIndices: number[];
  trick?: boolean;
};

export type MatchPairsExercise = {
  id: string;
  type: 'match-pairs';
  prompt: string;
  /** Conceptos columna izquierda. */
  left: string[];
  /** Definiciones / respuestas columna derecha (mismo orden). */
  right: string[];
};

export type OrderSequenceExercise = {
  id: string;
  type: 'order-sequence';
  prompt: string;
  /** Pasos en el orden CORRECTO (la UI los baraja). */
  steps: string[];
};

export type TapBlanksExercise = {
  id: string;
  type: 'tap-blanks';
  prompt: string;
  /** Plantilla con uno o más "___" donde van las fichas. */
  template: string;
  /** Fichas correctas en orden (forman la respuesta). */
  answer: string[];
  /** Fichas señuelo que se mezclan con las correctas. */
  decoys?: string[];
};

/**
 * Minijuego de memoria: pares de cartas que el usuario debe descubrir.
 * Cada par tiene dos lados (`a` y `b`); ambos pueden ser texto distinto
 * (ej. "6 × 7" y "42") o iguales.
 */
export type MemoryMatchExercise = {
  id: string;
  type: 'memory-match';
  prompt: string;
  /** Pares de cartas que se voltean. Idealmente 4–6 pares. */
  pairs: { a: string; b: string }[];
  /** Subtítulo opcional. */
  subtitle?: string;
};

/**
 * Speed Run: resuelve todas las que puedas antes de que se acabe el tiempo.
 * El usuario pasa si supera `goal` aciertos.
 */
export type SpeedRunExercise = {
  id: string;
  type: 'speed-run';
  prompt: string;
  /** Subtítulo / contexto del reto. */
  subtitle?: string;
  /** Tiempo total disponible (segundos). */
  seconds: number;
  /** Aciertos necesarios para considerarlo superado. */
  goal: number;
  /** Lista de retos. Si se acaban, el juego cicla. */
  challenges: { expression: string; answer: string }[];
};

/**
 * Number Rain (lluvia de números): aparecen valores y debes tocar SOLO
 * los que cumplen la regla. Se pasa con al menos `goal` aciertos sin
 * acumular `mistakesAllowed + 1` errores.
 */
export type NumberRainExercise = {
  id: string;
  type: 'number-rain';
  prompt: string;
  /** Subtítulo con la regla, ej: "Toca SOLO los números pares". */
  criterion: string;
  /** Regla aplicada a cada número. */
  rule:
    | 'even'
    | 'odd'
    | 'multiple-3'
    | 'multiple-5'
    | 'prime'
    | 'gt-10'
    | 'lt-10';
  /** Valores que pueden aparecer (mezcla de válidos y señuelos). */
  numbers: number[];
  /** Duración total del reto en segundos. */
  seconds: number;
  /** Aciertos mínimos para pasar. */
  goal: number;
  /** Errores permitidos antes de fallar. */
  mistakesAllowed: number;
};

export type Exercise =
  | MultipleChoiceExercise
  | FillResultExercise
  | QuickAnswerExercise
  | TrueFalseExercise
  | MultiSelectExercise
  | MatchPairsExercise
  | OrderSequenceExercise
  | TapBlanksExercise
  | MemoryMatchExercise
  | SpeedRunExercise
  | NumberRainExercise;

const M = (
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  expression?: string,
  trick = false,
): MultipleChoiceExercise => ({
  id,
  type: 'multiple-choice',
  prompt,
  options,
  correctIndex,
  expression,
  trick,
});

const F = (
  id: string,
  prompt: string,
  expression: string,
  answer: string,
  numeric = true,
): FillResultExercise => ({
  id,
  type: 'fill-result',
  prompt,
  expression,
  answer,
  numeric,
});

const Q = (
  id: string,
  prompt: string,
  expression: string,
  answer: string,
  seconds = 10,
  numeric = true,
): QuickAnswerExercise => ({
  id,
  type: 'quick-answer',
  prompt,
  expression,
  answer,
  seconds,
  numeric,
});

const TF = (
  id: string,
  prompt: string,
  statement: string,
  answer: boolean,
  explanation?: string,
  trick = false,
): TrueFalseExercise => ({
  id,
  type: 'true-false',
  prompt,
  statement,
  answer,
  explanation,
  trick,
});

const MS = (
  id: string,
  prompt: string,
  options: string[],
  correctIndices: number[],
  expression?: string,
  trick = false,
): MultiSelectExercise => ({
  id,
  type: 'multi-select',
  prompt,
  options,
  correctIndices,
  expression,
  trick,
});

const MATCH = (
  id: string,
  prompt: string,
  left: string[],
  right: string[],
): MatchPairsExercise => ({
  id,
  type: 'match-pairs',
  prompt,
  left,
  right,
});

const ORDER = (
  id: string,
  prompt: string,
  steps: string[],
): OrderSequenceExercise => ({
  id,
  type: 'order-sequence',
  prompt,
  steps,
});

const TAP = (
  id: string,
  prompt: string,
  template: string,
  answer: string[],
  decoys: string[] = [],
): TapBlanksExercise => ({
  id,
  type: 'tap-blanks',
  prompt,
  template,
  answer,
  decoys,
});

const MEM = (
  id: string,
  prompt: string,
  pairs: { a: string; b: string }[],
  subtitle?: string,
): MemoryMatchExercise => ({
  id,
  type: 'memory-match',
  prompt,
  pairs,
  subtitle,
});

const SR = (
  id: string,
  prompt: string,
  challenges: { expression: string; answer: string }[],
  seconds = 30,
  goal = 5,
  subtitle?: string,
): SpeedRunExercise => ({
  id,
  type: 'speed-run',
  prompt,
  subtitle,
  seconds,
  goal,
  challenges,
});

const NR = (
  id: string,
  prompt: string,
  criterion: string,
  rule: NumberRainExercise['rule'],
  numbers: number[],
  seconds = 25,
  goal = 6,
  mistakesAllowed = 2,
): NumberRainExercise => ({
  id,
  type: 'number-rain',
  prompt,
  criterion,
  rule,
  numbers,
  seconds,
  goal,
  mistakesAllowed,
});

export const EXERCISES: Record<string, Exercise[]> = {
  // ---------------- Matemáticas ----------------
  sum: [
    F('sum-1', 'Resuelve la suma', '5 + 3 =', '8'),
    M('sum-2', '¿Cuánto es 12 + 9?', ['19', '20', '21', '22'], 2),
    TF(
      'sum-tf1',
      'Verdadero o falso',
      '7 + 8 = 16',
      false,
      'Cuidado: 7 + 8 = 15.',
      true,
    ),
    Q('sum-3', 'Respuesta rápida', '8 + 7 =', '15', 10),
    MS(
      'sum-ms1',
      'Selecciona TODAS las sumas cuyo resultado es 12',
      ['5 + 7', '4 + 9', '6 + 6', '3 + 8', '2 + 10', '4 + 7'],
      [0, 2, 4],
    ),
    F('sum-4', 'Resuelve la suma', '23 + 17 =', '40'),
    M(
      'sum-5',
      'Si compras un libro de $45 y un cuaderno de $25, ¿cuánto pagas?',
      ['$60', '$65', '$70', '$75'],
      2,
    ),
    TAP(
      'sum-tap1',
      'Completa la frase',
      'La suma de 10 y ___ da como resultado ___.',
      ['6', '16'],
      ['8', '20', '4'],
    ),
    MATCH(
      'sum-match1',
      'Empareja cada suma con su resultado',
      ['4 + 5', '12 + 3', '20 + 11', '8 + 8'],
      ['9', '15', '31', '16'],
    ),
    Q('sum-q2', 'Respuesta exprés', '14 + 6 =', '20', 8),
    SR(
      'sum-sr1',
      'Speed Run: sumas relámpago',
      [
        { expression: '5 + 4 =', answer: '9' },
        { expression: '7 + 8 =', answer: '15' },
        { expression: '12 + 3 =', answer: '15' },
        { expression: '9 + 9 =', answer: '18' },
        { expression: '10 + 11 =', answer: '21' },
        { expression: '13 + 7 =', answer: '20' },
        { expression: '14 + 6 =', answer: '20' },
        { expression: '8 + 7 =', answer: '15' },
        { expression: '11 + 5 =', answer: '16' },
        { expression: '15 + 5 =', answer: '20' },
      ],
      30,
      6,
      'Responde tantas como puedas en 30 s.',
    ),
    NR(
      'sum-nr1',
      'Lluvia de números: pares',
      'Toca SOLO los números pares.',
      'even',
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      25,
      6,
      2,
    ),
  ],
  sub: [
    F('sub-1', 'Resuelve la resta', '10 − 4 =', '6'),
    M('sub-2', '¿Cuánto es 25 − 9?', ['14', '15', '16', '17'], 2),
    TF(
      'sub-tf1',
      'Verdadero o falso',
      'La resta es conmutativa: 8 − 3 = 3 − 8',
      false,
      'La resta NO es conmutativa: 8 − 3 = 5 y 3 − 8 = −5.',
      true,
    ),
    Q('sub-3', 'Respuesta rápida', '20 − 8 =', '12', 10),
    MS(
      'sub-ms1',
      'Selecciona las restas cuyo resultado es 7',
      ['10 − 3', '15 − 9', '20 − 13', '12 − 4', '14 − 7', '11 − 4'],
      [0, 2, 4, 5],
    ),
    F('sub-4', 'Resuelve la resta', '100 − 37 =', '63'),
    M(
      'sub-5',
      'Tenías 50 pesos y gastaste 18. ¿Cuánto te queda?',
      ['$28', '$30', '$32', '$34'],
      2,
    ),
    MATCH(
      'sub-match1',
      'Empareja cada resta con su resultado',
      ['9 − 4', '20 − 7', '50 − 25', '100 − 99'],
      ['5', '13', '25', '1'],
    ),
    TAP(
      'sub-tap1',
      'Arma la diferencia correcta',
      'Si tengo ___ manzanas y regalo ___, me quedan 12.',
      ['20', '8'],
      ['10', '5', '15'],
    ),
    Q('sub-q2', 'Respuesta exprés', '30 − 14 =', '16', 8),
    SR(
      'sub-sr1',
      'Speed Run: restas relámpago',
      [
        { expression: '15 − 6', answer: '9' },
        { expression: '22 − 9', answer: '13' },
        { expression: '40 − 17', answer: '23' },
        { expression: '60 − 28', answer: '32' },
        { expression: '100 − 64', answer: '36' },
        { expression: '12 − 8', answer: '4' },
        { expression: '33 − 19', answer: '14' },
        { expression: '50 − 25', answer: '25' },
      ],
      30,
      6,
      'Resuelve la mayor cantidad de restas antes de que acabe el tiempo.',
    ),
    NR(
      'sub-nr1',
      'Lluvia de números: menores de 10',
      'Toca SOLO los resultados menores que 10',
      'lt-10',
      [4, 12, 9, 15, 7, 18, 3, 20, 6, 11, 8, 14, 2, 17, 5],
      25,
      6,
      2,
    ),
  ],
  mul: [
    F('mul-1', 'Resuelve la multiplicación', '6 × 7 =', '42'),
    M('mul-2', '¿Cuánto es 9 × 8?', ['64', '70', '72', '81'], 2),
    TF(
      'mul-tf1',
      'Verdadero o falso',
      'Cualquier número multiplicado por 0 da ese mismo número',
      false,
      'Todo número × 0 = 0, no el mismo número.',
      true,
    ),
    Q('mul-3', 'Respuesta rápida', '4 × 12 =', '48', 10),
    MS(
      'mul-ms1',
      'Selecciona TODOS los múltiplos de 6',
      ['12', '18', '20', '24', '30', '34'],
      [0, 1, 3, 4],
    ),
    F('mul-4', 'Resuelve la multiplicación', '11 × 11 =', '121'),
    M(
      'mul-5',
      'Si una caja tiene 6 manzanas y compras 7 cajas, ¿cuántas tienes?',
      ['35', '42', '48', '56'],
      1,
    ),
    MATCH(
      'mul-match1',
      'Empareja la tabla del 8',
      ['8 × 3', '8 × 5', '8 × 7', '8 × 9'],
      ['24', '40', '56', '72'],
    ),
    TAP(
      'mul-tap1',
      'Completa la propiedad',
      'El doble de ___ es 36, y la mitad es ___.',
      ['18', '9'],
      ['12', '6', '24'],
    ),
    Q('mul-q2', 'Respuesta exprés', '7 × 9 =', '63', 8),
    MEM(
      'mul-mem1',
      'Minijuego: tabla del 6',
      [
        { a: '6 × 3', b: '18' },
        { a: '6 × 5', b: '30' },
        { a: '6 × 7', b: '42' },
        { a: '6 × 9', b: '54' },
      ],
      'Encuentra los pares de multiplicación y resultado.',
    ),
    SR(
      'mul-sr1',
      'Speed Run: tablas mezcladas',
      [
        { expression: '3 × 4 =', answer: '12' },
        { expression: '6 × 7 =', answer: '42' },
        { expression: '8 × 5 =', answer: '40' },
        { expression: '9 × 3 =', answer: '27' },
        { expression: '7 × 7 =', answer: '49' },
        { expression: '4 × 9 =', answer: '36' },
        { expression: '11 × 2 =', answer: '22' },
        { expression: '12 × 3 =', answer: '36' },
        { expression: '5 × 8 =', answer: '40' },
        { expression: '6 × 6 =', answer: '36' },
      ],
      35,
      6,
      'Multiplicaciones contra el reloj.',
    ),
    NR(
      'mul-nr1',
      'Lluvia de números: múltiplos de 3',
      'Toca SOLO los múltiplos de 3.',
      'multiple-3',
      [3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30, 31],
      25,
      6,
      2,
    ),
  ],
  div: [
    F('div-1', 'Resuelve la división', '20 ÷ 4 =', '5'),
    M('div-2', '¿Cuánto es 72 ÷ 8?', ['6', '8', '9', '11'], 2),
    TF(
      'div-tf1',
      'Verdadero o falso',
      'Dividir entre 0 está permitido y da 0',
      false,
      'Dividir entre 0 NO está definido en matemáticas.',
      true,
    ),
    Q('div-3', 'Respuesta rápida', '100 ÷ 10 =', '10', 10),
    MS(
      'div-ms1',
      'Selecciona los números divisibles entre 5',
      ['10', '12', '25', '34', '45', '52'],
      [0, 2, 4],
    ),
    F('div-4', 'Resuelve la división', '84 ÷ 7 =', '12'),
    M(
      'div-5',
      'Reparto 56 caramelos entre 8 amigos. ¿Cuántos toca a cada uno?',
      ['6', '7', '8', '9'],
      1,
    ),
    MATCH(
      'div-match1',
      'Empareja cada división con su cociente',
      ['36 ÷ 6', '49 ÷ 7', '81 ÷ 9', '64 ÷ 8'],
      ['6', '7', '9', '8'],
    ),
    TAP(
      'div-tap1',
      'Completa con los números correctos',
      'Si reparto ___ pasteles entre ___ niños, cada uno recibe 4.',
      ['24', '6'],
      ['18', '3', '8'],
    ),
    Q('div-q2', 'Respuesta exprés', '45 ÷ 5 =', '9', 8),
    SR(
      'div-sr1',
      'Speed Run: cocientes exactos',
      [
        { expression: '40 ÷ 8', answer: '5' },
        { expression: '54 ÷ 6', answer: '9' },
        { expression: '63 ÷ 7', answer: '9' },
        { expression: '32 ÷ 4', answer: '8' },
        { expression: '81 ÷ 9', answer: '9' },
        { expression: '48 ÷ 6', answer: '8' },
        { expression: '72 ÷ 9', answer: '8' },
        { expression: '21 ÷ 3', answer: '7' },
      ],
      30,
      6,
      'Resuelve divisiones exactas tan rápido como puedas.',
    ),
    NR(
      'div-nr1',
      'Lluvia: múltiplos de 5',
      'Toca SOLO los múltiplos de 5',
      'multiple-5',
      [10, 12, 25, 14, 35, 18, 50, 22, 45, 27, 60, 33, 75, 41, 100],
      25,
      6,
      2,
    ),
  ],
  order: [
    M(
      'order-1',
      'Recuerda la jerarquía: ×, ÷ antes que +, −',
      ['14', '20', '10', '11'],
      0,
      '2 + 3 × 4',
    ),
    TF(
      'order-tf1',
      'Verdadero o falso',
      '2 + 3 × 4 = 20 (se suma antes de multiplicar)',
      false,
      'Primero se multiplica: 3 × 4 = 12, luego 2 + 12 = 14.',
      true,
    ),
    M(
      'order-2',
      'Los paréntesis se resuelven primero',
      ['14', '20', '10', '5'],
      1,
      '(2 + 3) × 4',
    ),
    F('order-3', 'Aplica la jerarquía', '10 − 6 ÷ 2 =', '7'),
    M(
      'order-4',
      'Potencia, luego ×, luego +',
      ['25', '23', '55', '17'],
      1,
      '3 + 2² × 5',
    ),
    ORDER(
      'order-seq1',
      'Ordena los pasos del orden de operaciones (PEMDAS)',
      [
        '1. Paréntesis',
        '2. Exponentes / potencias',
        '3. Multiplicación y división',
        '4. Suma y resta',
      ],
    ),
    MS(
      'order-ms1',
      'Selecciona TODAS las expresiones que valen 10',
      ['2 + 2 × 4', '(2 + 3) × 2', '20 ÷ 2', '3 + 3 + 4', '5 × 2 + 1'],
      [0, 1, 2, 3],
    ),
    TAP(
      'order-tap1',
      'Completa para obtener 10',
      '___ + 3 × ___ = 10',
      ['4', '2'],
      ['5', '3', '6'],
    ),
    MEM(
      'order-mem1',
      'Minijuego: expresión y resultado',
      [
        { a: '2 + 3 × 4', b: '14' },
        { a: '(2 + 3) × 4', b: '20' },
        { a: '10 − 6 ÷ 2', b: '7' },
        { a: '3 + 2² × 5', b: '23' },
      ],
      'Encuentra el par de cada expresión con su resultado correcto.',
    ),
  ],
  simplify: [
    M(
      'simplify-1',
      'Divide numerador y denominador entre su MCD',
      ['1/2', '2/4', '4/8', '1/4'],
      0,
      'Simplifica 4/8',
    ),
    M(
      'simplify-2',
      'Encuentra la forma más simple',
      ['3/4', '1/2', '2/3', '9/12'],
      0,
      'Simplifica 9/12',
    ),
    TF(
      'simplify-tf1',
      'Verdadero o falso',
      '6/9 simplificada es 2/3',
      true,
    ),
    M(
      'simplify-3',
      'Recuerda dividir entre el MCD',
      ['3/5', '1/5', '5/15', '3/7'],
      0,
      'Simplifica 15/25',
    ),
    MATCH(
      'simplify-match1',
      'Empareja cada fracción con su forma simple',
      ['4/8', '10/15', '6/9', '12/16'],
      ['1/2', '2/3', '2/3', '3/4'],
    ),
    MS(
      'simplify-ms1',
      'Selecciona las fracciones que YA están simplificadas',
      ['2/5', '4/6', '3/7', '6/8', '5/9'],
      [0, 2, 4],
    ),
  ],
  'frac-sum': [
    M(
      'fsum-1',
      'Mismo denominador: suma numeradores',
      ['2/8', '1/2', '1/4', '2/4'],
      1,
      '1/4 + 1/4',
    ),
    M(
      'fsum-2',
      'Encuentra denominador común primero',
      ['2/6', '3/4', '1/3', '2/4'],
      1,
      '1/2 + 1/4',
    ),
    TF(
      'fsum-tf1',
      'Verdadero o falso',
      'Para sumar 1/3 + 1/4 puedo sumar directo numeradores y denominadores',
      false,
      'Primero hay que igualar denominadores.',
      true,
    ),
    M(
      'fsum-3',
      'Mismo denominador',
      ['3/5', '3/10', '1/5', '2/10'],
      0,
      '2/5 + 1/5',
    ),
    ORDER(
      'fsum-seq1',
      'Ordena los pasos para sumar fracciones con distinto denominador',
      [
        '1. Encontrar denominador común (mcm).',
        '2. Convertir cada fracción al nuevo denominador.',
        '3. Sumar los numeradores.',
        '4. Simplificar si es posible.',
      ],
    ),
  ],
  'frac-mul': [
    M(
      'fmul-1',
      'Multiplica numerador × numerador y denominador × denominador',
      ['1/6', '2/3', '1/5', '1/3'],
      0,
      '1/2 × 1/3',
    ),
    M(
      'fmul-2',
      'Multiplica y simplifica',
      ['6/20', '5/9', '3/10', '5/20'],
      2,
      '3/4 × 2/5',
    ),
    TF(
      'fmul-tf1',
      'Verdadero o falso',
      'Al multiplicar dos fracciones propias el resultado SIEMPRE es menor que cualquiera de ellas',
      true,
    ),
    M(
      'fmul-3',
      'Un entero es una fracción con denominador 1',
      ['2', '1/8', '4/2', '8'],
      0,
      '1/2 × 4',
    ),
    MS(
      'fmul-ms1',
      'Selecciona las multiplicaciones que dan 1/4',
      ['1/2 × 1/2', '1/3 × 3/4', '1/2 × 1/3', '2/4 × 1/2', '1/8 × 2'],
      [0, 3, 4],
    ),
  ],
  vars: [
    M(
      'vars-1',
      'Sustituye x por su valor',
      ['7', '10', '25', '52'],
      1,
      'Si x = 5, ¿cuánto vale 2x?',
    ),
    M(
      'vars-2',
      'Sustituye y por su valor',
      ['12', '7', '34', '1'],
      1,
      'Si y = 3, ¿cuánto vale y + 4?',
    ),
    TF(
      'vars-tf1',
      'Verdadero o falso',
      '2x significa 2 más x',
      false,
      '2x significa 2 multiplicado por x.',
      true,
    ),
    F('vars-3', 'Sustituye y calcula', 'a = 6, calcula a × 2 =', '12'),
    MATCH(
      'vars-match1',
      'Empareja cada expresión con su valor si x = 4',
      ['x + 3', '2x', 'x²', 'x − 1'],
      ['7', '8', '16', '3'],
    ),
    TAP(
      'vars-tap1',
      'Completa la expresión',
      'Si x = 3, entonces 2x + 1 = ___ y x² = ___.',
      ['7', '9'],
      ['6', '12', '5'],
    ),
  ],
  isolate: [
    M(
      'iso-1',
      'Resta 5 a ambos lados',
      ['5', '10', '15', '50'],
      0,
      'x + 5 = 10  →  x = ?',
    ),
    M(
      'iso-2',
      'Suma 3 a ambos lados',
      ['4', '10', '21', '3'],
      1,
      'x − 3 = 7  →  x = ?',
    ),
    TF(
      'iso-tf1',
      'Verdadero o falso',
      'Al pasar un número de un lado a otro, su signo cambia',
      true,
    ),
    F('iso-3', 'Divide ambos lados entre 4', '4x = 20  →  x =', '5'),
    ORDER(
      'iso-seq1',
      'Ordena los pasos para despejar x en  2x + 4 = 10',
      [
        '1. Restar 4 en ambos lados → 2x = 6.',
        '2. Dividir ambos lados entre 2 → x = 3.',
        '3. Verificar: 2(3) + 4 = 10.',
      ],
    ),
  ],
  linear: [
    M(
      'lin-1',
      'Resta 4 y luego divide entre 2',
      ['2', '3', '5', '7'],
      1,
      '2x + 4 = 10  →  x = ?',
    ),
    M(
      'lin-2',
      'Suma 5 y divide entre 3',
      ['5', '7', '9', '11'],
      1,
      '3x − 5 = 16  →  x = ?',
    ),
    TF(
      'lin-tf1',
      'Verdadero o falso',
      'En 5x = 35, x = 35 − 5',
      false,
      'Se divide, no se resta: x = 35 ÷ 5 = 7.',
      true,
    ),
    F('lin-3', 'Divide entre 5', '5x = 35  →  x =', '7'),
    MATCH(
      'lin-match1',
      'Empareja cada ecuación con la solución de x',
      ['x + 2 = 9', '3x = 21', '2x − 4 = 0', 'x ÷ 2 = 5'],
      ['7', '7', '2', '10'],
    ),
    SR(
      'lin-sr1',
      'Speed Run: despeja x',
      [
        { expression: 'x + 4 = 12', answer: '8' },
        { expression: '3x = 18', answer: '6' },
        { expression: 'x − 7 = 5', answer: '12' },
        { expression: '2x + 1 = 9', answer: '4' },
        { expression: '5x = 25', answer: '5' },
        { expression: 'x / 3 = 4', answer: '12' },
        { expression: '4x − 6 = 10', answer: '4' },
      ],
      35,
      5,
      'Calcula el valor de x en cada ecuación.',
    ),
  ],

  // ---------------- Física ----------------
  speed: [
    M(
      'spd-1',
      'v = d / t',
      ['25 km/h', '50 km/h', '200 km/h', '100 km/h'],
      1,
      '100 km en 2 h, ¿velocidad?',
    ),
    M(
      'spd-2',
      'Recuerda la fórmula',
      ['v = d × t', 'v = d / t', 'v = t / d', 'v = m × a'],
      1,
      '¿Cuál es la fórmula de la velocidad?',
    ),
    TF(
      'spd-tf1',
      'Verdadero o falso',
      'A mayor tiempo recorrido con la misma distancia, mayor velocidad',
      false,
      'A más tiempo con la misma distancia, MENOR velocidad.',
      true,
    ),
    F('spd-3', 'v = d / t (km/h)', '60 km en 1.5 h, v =', '40'),
    MATCH(
      'spd-match1',
      'Empareja distancia / tiempo con la velocidad',
      ['100 km / 2 h', '180 km / 3 h', '60 km / 0.5 h', '120 km / 4 h'],
      ['50 km/h', '60 km/h', '120 km/h', '30 km/h'],
    ),
    TAP(
      'spd-tap1',
      'Completa la fórmula',
      'v = ___ / ___',
      ['d', 't'],
      ['v', 'm', 'a'],
    ),
  ],
  distance: [
    M(
      'dist-1',
      'd = v × t',
      ['30 km', '60 km', '120 km', '180 km'],
      2,
      '60 km/h durante 2 h, ¿distancia?',
    ),
    M(
      'dist-2',
      'Recuerda la fórmula',
      ['d = v × t', 'd = v / t', 'd = t / v', 'd = m + a'],
      0,
      '¿Cuál es la fórmula de la distancia?',
    ),
    TF(
      'dist-tf1',
      'Verdadero o falso',
      'Si voy al doble de velocidad por el mismo tiempo, recorro el doble de distancia',
      true,
    ),
    F('dist-3', 'd = v × t (km)', '80 km/h durante 3 h, d =', '240'),
    MS(
      'dist-ms1',
      'Selecciona los casos donde la distancia es de 100 km',
      ['50 km/h × 2 h', '25 km/h × 4 h', '20 km/h × 6 h', '100 km/h × 1 h'],
      [0, 1, 3],
    ),
  ],
  time: [
    M(
      'time-1',
      't = d / v',
      ['1 h', '2 h', '0.5 h', '5 h'],
      1,
      '100 km a 50 km/h, ¿tiempo?',
    ),
    M(
      'time-2',
      'Recuerda la fórmula',
      ['t = d × v', 't = d / v', 't = v / d', 't = v + d'],
      1,
      '¿Cuál es la fórmula del tiempo?',
    ),
    TF(
      'time-tf1',
      'Verdadero o falso',
      'Si voy más rápido, tardo más en llegar al mismo lugar',
      false,
      'A mayor velocidad → menor tiempo para la misma distancia.',
      true,
    ),
    F('time-3', 't = d / v (h)', '200 km a 100 km/h, t =', '2'),
    TAP(
      'time-tap1',
      'Completa el cálculo',
      'Si recorro ___ km a ___ km/h tardo 2 horas.',
      ['120', '60'],
      ['80', '40', '20'],
    ),
  ],
  mass: [
    M(
      'mass-1',
      'Unidad de masa',
      ['m/s', 'kg', 'N', 'J'],
      1,
      '¿En qué se mide la masa?',
    ),
    TF(
      'mass-tf1',
      'Verdadero o falso',
      'La masa y el peso son lo mismo',
      false,
      'Masa es cantidad de materia (kg), peso es fuerza (N).',
      true,
    ),
    M(
      'mass-2',
      'F = m × a  →  m = F / a',
      ['5 kg', '12 kg', '20 kg', '8 kg'],
      0,
      'F = 10 N, a = 2 m/s², ¿m?',
    ),
    F('mass-3', 'F = m × a (N)', 'm = 7 kg, a = 3 m/s², F =', '21'),
    MATCH(
      'mass-match1',
      'Empareja la magnitud con su unidad',
      ['Masa', 'Fuerza', 'Aceleración', 'Tiempo'],
      ['kg', 'N', 'm/s²', 's'],
    ),
  ],
  force: [
    M(
      'force-1',
      'Unidad de fuerza',
      ['kg', 'N', 'm/s', 'J'],
      1,
      '¿En qué se mide la fuerza?',
    ),
    M(
      'force-2',
      'F = m × a',
      ['9 N', '20 N', '1.25 N', '0.8 N'],
      1,
      'm = 4 kg, a = 5 m/s², ¿F?',
    ),
    TF(
      'force-tf1',
      'Verdadero o falso',
      'Si aumentas la masa pero mantienes la fuerza, la aceleración disminuye',
      true,
    ),
    F('force-3', 'F = m × a (N)', 'm = 10 kg, a = 2 m/s², F =', '20'),
    TAP(
      'force-tap1',
      'Completa la segunda ley de Newton',
      'F = ___ × ___',
      ['m', 'a'],
      ['v', 'd', 't'],
    ),
    MEM(
      'force-mem1',
      'Minijuego: fuerza y movimiento',
      [
        { a: 'F = m × a', b: 'Segunda ley' },
        { a: 'N', b: 'Newton' },
        { a: 'kg', b: 'Kilogramo' },
        { a: 'm/s²', b: 'Aceleración' },
      ],
      'Empareja cada fórmula o unidad con su nombre.',
    ),
    SR(
      'force-sr1',
      'Speed Run: calcula F = m × a',
      [
        { expression: 'm=2 kg, a=3 m/s² → F', answer: '6' },
        { expression: 'm=5 kg, a=4 m/s² → F', answer: '20' },
        { expression: 'm=10 kg, a=2 m/s² → F', answer: '20' },
        { expression: 'm=3 kg, a=7 m/s² → F', answer: '21' },
        { expression: 'm=8 kg, a=5 m/s² → F', answer: '40' },
        { expression: 'm=4 kg, a=9 m/s² → F', answer: '36' },
      ],
      35,
      5,
      'Aplica la segunda ley de Newton lo más rápido posible.',
    ),
  ],
  accel: [
    M(
      'acc-1',
      'Unidad de aceleración',
      ['m/s²', 'N', 'kg', 'm'],
      0,
      '¿En qué se mide la aceleración?',
    ),
    M(
      'acc-2',
      'a = F / m',
      ['5 m/s²', '16 m/s²', '24 m/s²', '80 m/s²'],
      0,
      'F = 20 N, m = 4 kg, ¿a?',
    ),
    TF(
      'acc-tf1',
      'Verdadero o falso',
      'Una aceleración de 0 m/s² significa que el objeto está quieto',
      false,
      'Significa que su velocidad NO cambia, puede moverse a velocidad constante.',
      true,
    ),
    F('acc-3', 'a = F / m (m/s²)', 'F = 50 N, m = 5 kg, a =', '10'),
    MS(
      'acc-ms1',
      'Selecciona casos donde la aceleración es 2 m/s²',
      ['F = 10 N, m = 5 kg', 'F = 20 N, m = 10 kg', 'F = 6 N, m = 2 kg', 'F = 8 N, m = 4 kg'],
      [0, 1, 3],
    ),
    SR(
      'acc-sr1',
      'Speed Run: a = F / m',
      [
        { expression: 'F=20 N, m=4 kg → a', answer: '5' },
        { expression: 'F=30 N, m=6 kg → a', answer: '5' },
        { expression: 'F=12 N, m=3 kg → a', answer: '4' },
        { expression: 'F=18 N, m=2 kg → a', answer: '9' },
        { expression: 'F=50 N, m=10 kg → a', answer: '5' },
        { expression: 'F=24 N, m=8 kg → a', answer: '3' },
      ],
      30,
      5,
      'Despeja la aceleración de la segunda ley de Newton.',
    ),
  ],
  kinetic: [
    M(
      'kin-1',
      'Fórmula de la energía cinética',
      ['E = m × g × h', 'E = ½ × m × v²', 'E = F × d', 'E = m + v'],
      1,
      '¿Cuál es la fórmula de Ec?',
    ),
    M(
      'kin-2',
      'Unidad de la energía',
      ['W', 'N', 'J', 'kg'],
      2,
      '¿En qué se mide la energía?',
    ),
    TF(
      'kin-tf1',
      'Verdadero o falso',
      'Si duplico la velocidad, la energía cinética se cuadruplica',
      true,
    ),
    M(
      'kin-3',
      'Ec = ½ × 2 × 16 = 16',
      ['8 J', '16 J', '32 J', '4 J'],
      1,
      'm = 2 kg, v = 4 m/s, ¿Ec?',
    ),
    TAP(
      'kin-tap1',
      'Completa la fórmula',
      'Ec = ½ × ___ × ___²',
      ['m', 'v'],
      ['g', 'h', 'a'],
    ),
  ],
  potential: [
    M(
      'pot-1',
      'Fórmula de la energía potencial',
      ['Ep = m × g × h', 'Ep = ½ × m × v²', 'Ep = F × d', 'Ep = m / h'],
      0,
      '¿Cuál es la fórmula de Ep?',
    ),
    TF(
      'pot-tf1',
      'Verdadero o falso',
      'Un objeto en el suelo (h = 0) tiene Ep = 0',
      true,
    ),
    M(
      'pot-2',
      'Ep = 3 × 10 × 5 = 150',
      ['18 J', '150 J', '30 J', '75 J'],
      1,
      'm = 3 kg, g = 10, h = 5 m, ¿Ep?',
    ),
    M(
      'pot-3',
      'La altura aumenta la Ep',
      ['Al moverse rápido', 'Al subir de altura', 'Al frenar', 'Al perder masa'],
      1,
      '¿Cuándo aumenta la Ep?',
    ),
    MATCH(
      'pot-match1',
      'Empareja cada tipo de energía con su fórmula',
      ['Cinética', 'Potencial', 'Trabajo', 'Peso'],
      ['½ × m × v²', 'm × g × h', 'F × d', 'm × g'],
    ),
  ],

  // ---------------- Programación ----------------
  tags: [
    M(
      'tags-1',
      'Etiqueta de título principal',
      ['<head>', '<h1>', '<title>', '<p>'],
      1,
      '¿Cuál es la etiqueta del título principal?',
    ),
    M(
      'tags-2',
      'Etiqueta de párrafo',
      ['<p>', '<para>', '{p}', '</p>'],
      0,
      '¿Cómo se abre una etiqueta de párrafo?',
    ),
    TF(
      'tags-tf1',
      'Verdadero o falso',
      'Todas las etiquetas HTML necesitan etiqueta de cierre',
      false,
      'Hay etiquetas auto-cerradas como <img>, <br>, <hr>, <input>.',
      true,
    ),
    M(
      'tags-3',
      'Etiqueta de negrita',
      ['<i>', '<b>', '<u>', '<s>'],
      1,
      '¿Qué etiqueta pone texto en negrita?',
    ),
    MATCH(
      'tags-match1',
      'Empareja cada etiqueta con su función',
      ['<h1>', '<p>', '<a>', '<img>'],
      ['Título principal', 'Párrafo', 'Enlace', 'Imagen'],
    ),
    MS(
      'tags-ms1',
      'Selecciona TODAS las etiquetas de bloque',
      ['<div>', '<span>', '<p>', '<a>', '<section>'],
      [0, 2, 4],
    ),
    TAP(
      'tags-tap1',
      'Completa el HTML',
      'Para abrir y cerrar un párrafo: ___ texto ___',
      ['<p>', '</p>'],
      ['<a>', '</a>', '<br>'],
    ),
    MEM(
      'tags-mem1',
      'Minijuego: etiquetas HTML',
      [
        { a: 'Título principal', b: '<h1>' },
        { a: 'Párrafo', b: '<p>' },
        { a: 'Enlace', b: '<a>' },
        { a: 'Imagen', b: '<img>' },
      ],
      'Empareja cada concepto con su etiqueta.',
    ),
  ],
  titles: [
    M(
      'titles-1',
      'h1 es el más grande, h6 el más chico',
      ['<h6>', '<h1>', '<h0>', '<title>'],
      1,
      '¿Cuál título es el más grande?',
    ),
    M(
      'titles-2',
      'h1 hasta h6',
      ['3', '6', '9', '12'],
      1,
      '¿Cuántos niveles de título tiene HTML?',
    ),
    M(
      'titles-3',
      'Segundo nivel',
      ['<h1>', '<h2>', '<h3>', '<title>'],
      1,
      '¿Etiqueta de subtítulo de segundo nivel?',
    ),
  ],
  paragraphs: [
    M(
      'par-1',
      'Etiqueta <p>',
      [
        '<para>texto</para>',
        '<p>texto</p>',
        '<text>texto</text>',
        '<paragraph>texto</paragraph>',
      ],
      1,
      '¿Cómo se escribe un párrafo?',
    ),
    M(
      'par-2',
      'Etiqueta autocerrada',
      ['<br>', '<lr>', '<line>', '<break>'],
      0,
      '¿Qué etiqueta hace un salto de línea?',
    ),
    M(
      'par-3',
      'Apertura de párrafo',
      ['<p>', '</p>', '<para>', '<text>'],
      0,
      '¿Etiqueta de apertura para un párrafo?',
    ),
  ],
  images: [
    M(
      'img-1',
      'Etiqueta de imagen',
      ['<picture>', '<img>', '<image>', '<photo>'],
      1,
      '¿Etiqueta para insertar una imagen?',
    ),
    M(
      'img-2',
      'Atributo de ruta',
      ['href', 'src', 'link', 'path'],
      1,
      '¿Qué atributo indica la ruta de la imagen?',
    ),
    M(
      'img-3',
      'Texto alternativo',
      ['title', 'alt', 'desc', 'name'],
      1,
      '¿Atributo descriptivo para accesibilidad?',
    ),
  ],
  links: [
    M(
      'link-1',
      'Anchor tag',
      ['<link>', '<a>', '<href>', '<url>'],
      1,
      '¿Etiqueta de un enlace?',
    ),
    M(
      'link-2',
      'href = hyperlink reference',
      ['src', 'href', 'url', 'target'],
      1,
      '¿Atributo para la URL?',
    ),
    M(
      'link-3',
      'target _blank abre nueva pestaña',
      ['target="_blank"', 'open="new"', 'tab="new"', 'window="new"'],
      0,
      '¿Atributo para abrir en pestaña nueva?',
    ),
  ],
  colors: [
    M(
      'col-1',
      'Propiedad color',
      ['text-color', 'color', 'font-color', 'background'],
      1,
      '¿Propiedad para color de texto?',
    ),
    M(
      'col-2',
      'background-color',
      ['color', 'background-color', 'bg', 'back-color'],
      1,
      '¿Propiedad para color de fondo?',
    ),
    M(
      'col-3',
      'Rojo en hex',
      ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'],
      0,
      '¿Cuál es el código hex del rojo?',
    ),
  ],
  margins: [
    M(
      'mar-1',
      'Margin = espacio exterior',
      ['padding', 'margin', 'border', 'spacing'],
      1,
      '¿Qué propiedad crea espacio exterior?',
    ),
    M(
      'mar-2',
      'Padding = espacio interior',
      ['padding', 'margin', 'border', 'outline'],
      0,
      '¿Qué propiedad crea espacio interior?',
    ),
    M(
      'mar-3',
      'margin: auto',
      ['margin: 0', 'margin: auto', 'padding: auto', 'center: true'],
      1,
      '¿Qué valor centra horizontalmente un bloque?',
    ),
  ],
  flex: [
    M(
      'flex-1',
      'display: flex',
      ['display: block', 'display: flex', 'flex: on', 'layout: flex'],
      1,
      '¿Cómo se activa flexbox?',
    ),
    M(
      'flex-2',
      'justify-content alinea eje principal',
      ['align-items', 'justify-content', 'flex-direction', 'flex-wrap'],
      1,
      '¿Propiedad que alinea en el eje principal?',
    ),
    M(
      'flex-3',
      'flex-direction',
      ['flex-direction', 'flex-flow', 'align-items', 'order'],
      0,
      '¿Propiedad para cambiar dirección del flex?',
    ),
    MEM(
      'flex-mem1',
      'Memoria: propiedades flex',
      [
        { a: 'justify-content', b: 'Eje principal' },
        { a: 'align-items', b: 'Eje secundario' },
        { a: 'flex-direction', b: 'Dirección' },
        { a: 'flex-wrap', b: 'Saltos de línea' },
      ],
      'Encuentra los pares de propiedad y su rol.',
    ),
    SR(
      'flex-sr1',
      'Speed Run: alinear en flex',
      [
        { expression: 'Centrar horizontal en row →', answer: 'justify-content' },
        { expression: 'Centrar vertical en row →', answer: 'align-items' },
        { expression: 'Cambiar a columna →', answer: 'flex-direction' },
        { expression: 'Que el contenido salte de línea →', answer: 'flex-wrap' },
      ],
      30,
      3,
      'Escribe la propiedad CSS exacta sin guiones extra.',
    ),
  ],
  'js-vars': [
    M(
      'jsv-1',
      'let permite reasignación',
      ['const', 'let', 'final', 'static'],
      1,
      '¿Cuál palabra declara una variable mutable?',
    ),
    M(
      'jsv-2',
      'const = constante',
      ['const', 'let', 'final', 'static'],
      0,
      '¿Cuál palabra declara una constante?',
    ),
    TF(
      'jsv-tf1',
      'Verdadero o falso',
      'A una variable declarada con const se le puede reasignar otro valor',
      false,
      'const NO se puede reasignar. Para reasignar usa let.',
      true,
    ),
    M(
      'jsv-3',
      'let nombre = valor',
      [
        'let edad = 18',
        'var = edad 18',
        'edad: let = 18',
        'set edad 18',
      ],
      0,
      'Declarar variable "edad" con valor 18',
    ),
    TAP(
      'jsv-tap1',
      'Arma la declaración correcta',
      '___ nombre ___ "Ana";',
      ['let', '='],
      ['const', '==', ':'],
    ),
    MATCH(
      'jsv-match1',
      'Empareja la palabra clave con su uso',
      ['let', 'const', 'var', 'typeof'],
      ['Variable mutable', 'Constante', 'Forma antigua', 'Saber el tipo'],
    ),
    MEM(
      'jsv-mem1',
      'Minijuego: palabras clave de JS',
      [
        { a: 'let', b: 'Mutable' },
        { a: 'const', b: 'Inmutable' },
        { a: 'typeof', b: 'Tipo' },
        { a: 'undefined', b: 'Sin valor' },
      ],
      'Empareja cada palabra clave con su descripción.',
    ),
  ],
  conds: [
    M(
      'cond-1',
      'if (condición) { ... }',
      ['when', 'if', 'case', 'switch'],
      1,
      '¿Cuál palabra inicia una condición?',
    ),
    M(
      'cond-2',
      'edad >= 18 es verdadero',
      ['Nada', 'edad', 'Mayor', '18'],
      2,
      'Si edad = 18, ¿qué muestra console.log("Mayor") dentro del if?',
    ),
    TF(
      'cond-tf1',
      'Verdadero o falso',
      'En JS, "5" == 5 es true',
      true,
      'Con == hay conversión de tipo. Con === sería false.',
    ),
    M(
      'cond-3',
      'Triple igual = estricto',
      ['=', '==', '===', '!='],
      2,
      '¿Operador de igualdad estricta?',
    ),
    TAP(
      'cond-tap1',
      'Completa la condición',
      'if (edad ___ 18) { console.log("Mayor"); }',
      ['>='],
      ['<', '=', '!='],
    ),
    MS(
      'cond-ms1',
      'Selecciona TODOS los operadores de comparación',
      ['===', '+', '!==', '<', '*', '>='],
      [0, 2, 3, 5],
    ),
    SR(
      'cond-sr1',
      'Speed Run: evalúa la expresión',
      [
        { expression: '5 > 3 →', answer: 'true' },
        { expression: '10 === "10" →', answer: 'false' },
        { expression: '4 !== 5 →', answer: 'true' },
        { expression: '"a" === "A" →', answer: 'false' },
        { expression: '7 <= 7 →', answer: 'true' },
        { expression: '0 == false →', answer: 'true' },
        { expression: '"3" === 3 →', answer: 'false' },
      ],
      30,
      5,
      'Responde "true" o "false" tal cual JavaScript lo haría.',
    ),
  ],
  funcs: [
    M(
      'fun-1',
      'function nombre() { ... }',
      ['func', 'function', 'def', 'fun'],
      1,
      '¿Cuál palabra declara una función?',
    ),
    M(
      'fun-2',
      'Se invocan con paréntesis',
      ['call saludar()', 'saludar()', 'exec saludar', 'run saludar'],
      1,
      '¿Cómo se ejecuta una función llamada saludar?',
    ),
    TF(
      'fun-tf1',
      'Verdadero o falso',
      'Una función SIEMPRE debe devolver un valor con return',
      false,
      'Si no hay return, la función devuelve undefined.',
      true,
    ),
    M(
      'fun-3',
      'return devuelve un valor',
      ['return', 'back', 'give', 'out'],
      0,
      '¿Palabra clave para devolver un valor?',
    ),
    ORDER(
      'fun-seq1',
      'Ordena los pasos para usar una función',
      [
        '1. Declarar la función con sus parámetros.',
        '2. Implementar la lógica dentro del cuerpo.',
        '3. Invocar la función pasando los argumentos.',
        '4. Usar el valor devuelto por la función.',
      ],
    ),
    TAP(
      'fun-tap1',
      'Arma la función',
      '___ sumar(a, b) { ___ a + b; }',
      ['function', 'return'],
      ['var', 'const', 'echo'],
    ),
  ],

  // ---------------- Inglés ----------------
  hello: [
    M(
      'hi-1',
      'Saludo en inglés',
      ['Adiós', 'Hola', 'Gracias', 'Por favor'],
      1,
      'Hello significa...',
    ),
    M(
      'hi-2',
      'Hi es informal',
      ['Goodbye', 'Hi', 'Excuse me', 'Thanks'],
      1,
      '¿Cuál es un saludo informal?',
    ),
    TF(
      'hi-tf1',
      'Verdadero o falso',
      '"Hi" se usa en situaciones muy formales como reuniones de trabajo',
      false,
      '"Hi" es informal. Para algo formal usa "Hello" o "Good morning".',
      true,
    ),
    M(
      'hi-3',
      'Buenos días',
      [
        'Buenas noches',
        'Buenas tardes',
        'Buenos días',
        'Hasta luego',
      ],
      2,
      'Good morning significa...',
    ),
    MATCH(
      'hi-match1',
      'Empareja el saludo con su significado',
      ['Hello', 'Good morning', 'Good night', 'Hi'],
      ['Hola', 'Buenos días', 'Buenas noches', 'Hola (informal)'],
    ),
    TAP(
      'hi-tap1',
      'Arma el saludo formal',
      '"___ ___, sir."',
      ['Good', 'morning'],
      ['Hi', 'bye', 'Hello'],
    ),
    MEM(
      'hi-mem1',
      'Minijuego: saludos en inglés',
      [
        { a: 'Hello', b: 'Hola' },
        { a: 'Good morning', b: 'Buenos días' },
        { a: 'Good night', b: 'Buenas noches' },
        { a: 'See you', b: 'Nos vemos' },
      ],
      'Empareja cada saludo con su traducción.',
    ),
    SR(
      'hi-sr1',
      'Speed Run: traduce el saludo',
      [
        { expression: 'Hi! →', answer: 'Hola' },
        { expression: 'Good afternoon →', answer: 'Buenas tardes' },
        { expression: 'How are you? →', answer: 'Cómo estás' },
        { expression: 'Nice to meet you →', answer: 'Mucho gusto' },
        { expression: 'Goodbye →', answer: 'Adiós' },
        { expression: 'See you later →', answer: 'Hasta luego' },
      ],
      40,
      4,
      'Escribe la traducción tal cual aparece (sin signos extra).',
    ),
  ],
  bye: [
    M(
      'bye-1',
      'Despedida en inglés',
      ['Hola', 'Adiós', 'Gracias', 'Lo siento'],
      1,
      'Goodbye significa...',
    ),
    M(
      'bye-2',
      'Bye es informal',
      ['Bye', 'Hello', 'Please', 'Welcome'],
      0,
      '¿Forma informal de decir adiós?',
    ),
    M(
      'bye-3',
      'Despedida casual',
      [
        'Te veo después',
        'Buenos días',
        'Hasta nunca',
        'Lo siento',
      ],
      0,
      'See you later significa...',
    ),
  ],
  howareyou: [
    M(
      'how-1',
      'Pregunta común',
      [
        '¿Cuál es tu nombre?',
        '¿Cómo estás?',
        '¿Cuántos años tienes?',
        '¿De dónde eres?',
      ],
      1,
      'How are you? significa...',
    ),
    M(
      'how-2',
      "Respuesta a How are you?",
      ['Estoy bien', 'Lo siento', 'Por favor', 'Gracias'],
      0,
      "I'm fine significa...",
    ),
    M(
      'how-3',
      'Respuesta cortés',
      [
        'Goodbye',
        "I'm fine, thanks",
        'My name is',
        'I live in',
      ],
      1,
      '¿Respuesta correcta a How are you?',
    ),
  ],
  'i-am': [
    M(
      'iam-1',
      'Primera persona singular',
      ['Tú eres', 'Él es', 'Yo soy', 'Ella es'],
      2,
      'I am significa...',
    ),
    M(
      'iam-2',
      'Construcción correcta',
      [
        'You are student',
        'I am a student',
        'He is student',
        'I student',
      ],
      1,
      '¿Cómo se dice "Yo soy estudiante"?',
    ),
    M(
      'iam-3',
      "I'm = I am",
      ['I will', 'I am', 'I have', 'I do'],
      1,
      "I'm es contracción de...",
    ),
  ],
  'you-are': [
    M(
      'you-1',
      'Segunda persona',
      ['Yo soy', 'Tú eres', 'Ellos son', 'Nosotros somos'],
      1,
      'You are significa...',
    ),
    M(
      'you-2',
      "You're = You are",
      ['You will', 'You have', 'You are', 'You do'],
      2,
      "You're es contracción de...",
    ),
    M(
      'you-3',
      'Construcción correcta',
      [
        'I am my friend',
        'You are my friend',
        'He is my friend',
        'She is my friend',
      ],
      1,
      '¿Cómo se dice "Tú eres mi amigo"?',
    ),
  ],
  'he-is': [
    M(
      'he-1',
      'Tercera persona masculina',
      ['Yo soy', 'Tú eres', 'Él es', 'Ella es'],
      2,
      'He is significa...',
    ),
    M(
      'he-2',
      "He's = He is",
      ['He has', 'He is', 'He will', 'He does'],
      1,
      "He's es contracción de...",
    ),
    M(
      'he-3',
      'Estructura: He is a + sustantivo',
      [
        'She is teacher',
        'He is a teacher',
        'He are teacher',
        'I am teacher',
      ],
      1,
      '¿Cómo se dice "Él es maestro"?',
    ),
  ],
  'en-colors': [
    M(
      'enc-1',
      'Color primario',
      ['Rojo', 'Verde', 'Azul', 'Amarillo'],
      0,
      'Red significa...',
    ),
    M(
      'enc-2',
      'Color del mar',
      ['Red', 'Blue', 'Green', 'Yellow'],
      1,
      '¿Cómo se dice "azul"?',
    ),
    M(
      'enc-3',
      'Color de las plantas',
      ['Amarillo', 'Verde', 'Naranja', 'Negro'],
      1,
      'Green significa...',
    ),
  ],
  numbers: [
    M(
      'num-1',
      'Tercer número',
      ['Dos', 'Tres', 'Cuatro', 'Cinco'],
      1,
      'Three significa...',
    ),
    M(
      'num-2',
      '7 en inglés',
      ['Six', 'Seven', 'Eight', 'Nine'],
      1,
      '¿Cómo se dice "siete"?',
    ),
    M(
      'num-3',
      'Número de dedos en dos manos',
      ['Nueve', 'Diez', 'Once', 'Doce'],
      1,
      'Ten significa...',
    ),
    MEM(
      'num-mem1',
      'Memoria: number ↔ número',
      [
        { a: 'One', b: '1' },
        { a: 'Three', b: '3' },
        { a: 'Five', b: '5' },
        { a: 'Seven', b: '7' },
        { a: 'Nine', b: '9' },
      ],
      'Empareja cada palabra con su cifra.',
    ),
    SR(
      'num-sr1',
      'Speed Run: ¿qué número es?',
      [
        { expression: 'Four', answer: '4' },
        { expression: 'Eight', answer: '8' },
        { expression: 'Twelve', answer: '12' },
        { expression: 'Twenty', answer: '20' },
        { expression: 'Fifteen', answer: '15' },
        { expression: 'Eleven', answer: '11' },
        { expression: 'Six', answer: '6' },
      ],
      30,
      5,
      'Escribe la cifra correspondiente a cada número en inglés.',
    ),
  ],
  objects: [
    M(
      'obj-1',
      'Objeto de lectura',
      ['Mesa', 'Silla', 'Libro', 'Pluma'],
      2,
      'Book significa...',
    ),
    M(
      'obj-2',
      'Mueble plano',
      ['Chair', 'Table', 'Window', 'Door'],
      1,
      '¿Cómo se dice "mesa"?',
    ),
    M(
      'obj-3',
      'Para escribir',
      ['Lápiz', 'Pluma', 'Cuaderno', 'Goma'],
      1,
      'Pen significa...',
    ),
  ],
};

export function getExercisesForTopic(topicId: string): Exercise[] {
  return EXERCISES[topicId] ?? [];
}

export function hasExercises(topicId: string): boolean {
  return (EXERCISES[topicId]?.length ?? 0) > 0;
}
