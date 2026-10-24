import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const types: SkillModule = {
  skill: {
    id: 'js.types',
    route: 'javascript',
    title: 'Типы, приведение и сравнение',
    icon: '🧬',
    summary: 'Примитивы, typeof, причуды чисел (0.1 + 0.2, NaN), приведение типов, == и ===, truthy/falsy, null и undefined.',
    prereqs: ['js.basics'],
    tier: 1,
    outcomes: [
      'Перечисляю примитивные типы и определяю тип значения через typeof (включая известные исключения)',
      'Объясняю, почему 0.1 + 0.2 !== 0.3, и сравниваю дробные числа с допуском',
      'Предсказываю результат неявного приведения типов для +, -, == и условий',
      'Всегда выбираю === и знаю единственный разумный случай для == null',
      'Отличаю null от undefined и проверяю значение на NaN правильно',
    ],
    estMinutes: 25,
    lesson: {
      why: 'Большинство «странных» багов в JavaScript — это неявное приведение типов и числа с плавающей точкой. Зная правила, вы читаете такие места как обычный код, а не как лотерею.',
      brief:
        '7 примитивов: `number`, `string`, `boolean`, `undefined`, `null`, `bigint`, `symbol`; остальное — объекты. `+` склеивает, если есть строка; `-`, `*`, `/` приводят к числам. Сравнивайте через `===`. Falsy: `false, 0, -0, 0n, "", null, undefined, NaN` — всё остальное truthy (даже `[]` и `"0"`).',
      standard: md(
        'В JavaScript семь **примитивных типов**: `number`, `string`, `boolean`, `undefined`, `null`, `bigint` и `symbol`. Всё остальное (массивы, функции, объекты) — объекты. Тип значения показывает оператор `typeof`:',
        js`
          console.log(typeof 42);          // "number"
          console.log(typeof "42");        // "string"
          console.log(typeof undefined);   // "undefined"
          console.log(typeof null);        // "object" — историческая ошибка языка
          console.log(typeof [1, 2]);      // "object" — для массива используйте Array.isArray
          console.log(typeof (() => 1));   // "function"
        `,
        '**Числа** в JavaScript — 64-битные числа с плавающей точкой (IEEE 754), целых и дробных «отдельно» нет. Отсюда классическое:',
        js`
          console.log(0.1 + 0.2);            // 0.30000000000000004
          console.log(0.1 + 0.2 === 0.3);    // false
          console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);   // true — сравнение с допуском
          console.log(0 / 0, 1 / 0);          // NaN Infinity
        `,
        '`NaN` («не число») — единственное значение, не равное самому себе: `NaN === NaN` — `false`. Проверять нужно через `Number.isNaN(x)`.',
        '**Приведение типов.** Оператор `+` склеивает строки, если хотя бы один операнд — строка; остальные арифметические операторы приводят операнды к числам:',
        js`
          console.log("5" + 3);   // "53"
          console.log("5" - 3);   // 2
          console.log("5" * "2"); // 10
          console.log(Number("abc"), Number(""), Number(" 42 "));   // NaN 0 42
        `,
        '**== и ===.** `===` сравнивает без приведения: разные типы — сразу `false`. `==` сначала приводит типы по сложным правилам (`0 == ""`, `[] == false` — оба `true`). Используйте `===` всегда; исключение — идиома `x == null`, которая истинна и для `null`, и для `undefined`.',
        '**Truthy и falsy.** В условии значение приводится к булеву. Falsy ровно восемь значений: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Всё остальное — truthy, включая `"0"`, `"false"`, `[]` и `{}`.',
        '**null и undefined.** `undefined` — «значения нет» (переменная не инициализирована, свойства нет, функция ничего не вернула). `null` — осознанное «пусто», которое ставит программист.',
      ),
      deep: md(
        '**Почему 0.1 + 0.2 неточно.** Число 0.1 в двоичной системе — бесконечная периодическая дробь (как 1/3 в десятичной), поэтому хранится приближённо. Точность — около 15–17 значащих цифр. Для денег храните целые копейки (`1999` вместо `19.99`) или используйте `BigInt`/библиотеки десятичной арифметики. `Number.MAX_SAFE_INTEGER` (2^53 − 1 = 9007199254740991) — предел, до которого целые представимы точно.',
        '**`-0`.** Есть и отрицательный ноль: `0 * -1` даёт `-0`. `0 === -0` — `true`, но `Object.is(0, -0)` — `false`. `Object.is` также считает `NaN` равным `NaN`.',
        '**Алгоритм `==`** (упрощённо): `null == undefined` истинно и больше ни с чем не равно; строка и число — строка приводится к числу; булево приводится к числу; объект приводится к примитиву через `valueOf`/`toString`. Поэтому `[] == false`: `[]` → `""` → `0`, `false` → `0`.',
        '**Приведение объектов к примитиву** вызывает `Symbol.toPrimitive`, затем `valueOf`/`toString`. Именно поэтому `[1, 2] + [3]` — это `"1,23"`, а `{} + []` в выражении — `"[object Object]"`.',
        '**Явное преобразование** предпочтительнее неявного: `Number(x)`, `String(x)`, `Boolean(x)` (или `!!x`). `parseInt("12px")` разберёт префикс (12), а `Number("12px")` — `NaN`; `parseInt` всегда передавайте основание: `parseInt(s, 10)`.',
        '**Примитивы неизменяемы** и сравниваются по значению. Объекты сравниваются по ссылке: `{} === {}` — `false`.',
      ),
      analogy:
        'Типы — как единицы измерения: «5 метров + 3 секунды» не имеет смысла, но JavaScript молча вычислит что-нибудь. Явные `Number()`/`String()` — это приведение к одной единице до сложения.',
      example: {
        lang: 'javascript',
        code: c`
          console.log(typeof 42, typeof "42", typeof true, typeof undefined, typeof null, typeof {}, typeof (() => 1));
          console.log(0.1 + 0.2);
          console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);
          console.log("5" * "2", "5" + 2);
        `,
        steps: [
          '`typeof` возвращает строку с названием типа; для `null` — историческое `"object"`, для функции — `"function"`.',
          'Сумма 0.1 + 0.2 хранится приближённо, поэтому печатается `0.30000000000000004`.',
          'Правильное сравнение дробных чисел — по модулю разности с малым допуском (`Number.EPSILON`).',
          '`*` приводит обе строки к числам (10), а `+` с одним строковым операндом склеивает: `"5" + 2` → `"52"`.',
        ],
        output: c`
          number string boolean undefined object object function
          0.30000000000000004
          true
          10 52
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          console.log(0.1 + 0.2 === 0.3);   // false
          console.log(NaN === NaN);         // false
        `,
        explain:
          'Прямое сравнение дробей и NaN обманчиво. Для дробей используйте допуск (`Math.abs(a - b) < eps`), для NaN — `Number.isNaN(x)`.',
      },
      pitfalls: [
        'Проверять тип массива через `typeof` — получите `"object"`. Используйте `Array.isArray`.',
        'Проверять `null` через `typeof x === "object"` — `null` тоже пройдёт. Сравнивайте напрямую: `x === null`.',
        'Использовать глобальный `isNaN("abc")` — он сначала приводит к числу и вернёт `true` для любой нечисловой строки. Нужен `Number.isNaN`.',
        'Считать `[]` и `{}` ложными: в `if ([])` условие истинно. Пустоту массива проверяйте через `arr.length === 0`.',
        'Хранить деньги в дробных числах: `0.1 + 0.2` накапливает ошибку. Считайте в копейках.',
      ],
      sources: [
        { title: 'MDN — JavaScript data types and data structures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures' },
        { title: 'MDN — Equality comparisons and sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness' },
        { title: 'MDN — Falsy', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Falsy' },
        { title: 'ECMAScript — The typeof operator', url: 'https://tc39.es/ecma262/#sec-typeof-operator' },
      ],
    },
    misconceptions: [
      {
        id: 'plus-always-adds',
        title: '`+` всегда складывает числа',
        explanation: 'Если хотя бы один операнд — строка, `+` склеивает: `"5" + 3` = `"53"`. А вот `-`, `*`, `/` всегда приводят к числам.',
        fix: 'Явно преобразуйте ввод: `Number(x) + 3`.',
      },
      {
        id: 'float-exact',
        title: 'Дробные числа хранятся точно',
        explanation: 'Числа — двоичные с плавающей точкой: 0.1 и 0.2 хранятся приближённо, поэтому `0.1 + 0.2 !== 0.3`.',
        fix: 'Сравнивайте с допуском или считайте в целых (копейки).',
      },
      {
        id: 'typeof-null',
        title: '`typeof null` — это "null"',
        explanation: 'Исторически `typeof null === "object"`. Это ошибка языка, оставленная ради совместимости.',
        fix: 'Проверяйте `null` напрямую: `value === null`.',
      },
      {
        id: 'nan-equals-nan',
        title: 'NaN можно найти через === NaN',
        explanation: '`NaN` не равен даже самому себе, поэтому `x === NaN` всегда `false`.',
        fix: 'Используйте `Number.isNaN(x)` (а не глобальный `isNaN`, который приводит аргумент к числу).',
      },
      {
        id: 'empty-is-falsy',
        title: 'Пустой массив и объект ложны',
        explanation: 'Falsy — только восемь значений. `[]`, `{}` и даже строка `"0"` — truthy.',
        fix: 'Проверяйте `arr.length === 0` или `Object.keys(obj).length === 0`.',
      },
      {
        id: 'loose-equals-safe',
        title: '`==` — это «более удобный» `===`',
        explanation: '`==` приводит типы по запутанным правилам: `0 == ""`, `"1" == 1`, `[] == false` — все `true`.',
        fix: 'Всегда `===`; допустимое исключение — `x == null` как проверка на null и undefined.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.types.1',
      skill: 'js.types',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        console.log(0.1 + 0.2 === 0.3, typeof NaN, typeof null);
      `,
      answer: 'false number object',
      explanation: '0.1 + 0.2 хранится приближённо, поэтому сравнение ложно. `NaN` — особое значение типа number. `typeof null` — историческое "object".',
    },
    {
      id: 'js.types.2',
      skill: 'js.types',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        console.log("5" + 3, "5" - 3);
      `,
      options: [
        { text: '53 2', correct: true, why: '`+` со строкой склеивает ("53"), а `-` приводит "5" к числу (2).' },
        { text: '8 2', why: 'Сложение чисел получилось бы, если бы "5" было числом.', misconception: 'plus-always-adds' },
        { text: '53 53', why: '`-` не умеет склеивать строки, он приводит операнды к числам.' },
        { text: '8 8', why: 'Оба оператора ведут себя по-разному со строками.', misconception: 'plus-always-adds' },
      ],
      explanation: 'Оператор `+` перегружен: строка рядом — значит конкатенация. Остальные арифметические операторы всегда числовые.',
    },
    {
      id: 'js.types.3',
      skill: 'js.types',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Какие из значений falsy?',
      code: c`
        console.log(Boolean([]), Boolean(""), Boolean("0"), Boolean(0), Boolean({}), Boolean(NaN));
      `,
      answer: 'true false true false true false',
      explanation: 'Falsy — `""`, `0`, `NaN` (и ещё `false`, `-0`, `0n`, `null`, `undefined`). Пустой массив, пустой объект и строка `"0"` — truthy.',
    },
    {
      id: 'js.types.4',
      skill: 'js.types',
      kind: 'code',
      difficulty: 2,
      diag: true,
      lang: 'javascript',
      prompt:
        'Напишите функцию `toNumberOrNull(s)`: принимает строку и возвращает число, а если строка не является конечным числом (в том числе пустая или из пробелов) — `null`.',
      starter: c`
        function toNumberOrNull(s) {
          // ваш код
        }
      `,
      solution: c`
        function toNumberOrNull(s) {
          const t = s.trim();
          if (t === "") return null;
          const n = Number(t);
          return Number.isFinite(n) ? n : null;
        }
      `,
      tests: [
        { expr: 'toNumberOrNull("42")', expect: '42' },
        { expr: 'toNumberOrNull(" 3.5 ")', expect: '3.5' },
        { expr: 'toNumberOrNull("abc")', expect: 'null' },
        { expr: 'toNumberOrNull("")', expect: 'null', hidden: true, label: 'пустая строка (Number("") даёт 0)' },
        { expr: 'toNumberOrNull("   ")', expect: 'null', hidden: true, label: 'строка из пробелов' },
        { expr: 'toNumberOrNull("0")', expect: '0', hidden: true, label: 'ноль — это число, а не «пусто»' },
        { expr: 'toNumberOrNull("Infinity")', expect: 'null', hidden: true, label: 'Infinity не конечное число' },
      ],
      hints: [
        'Что вернёт `Number("")`? Подойдёт ли это для «не число»?',
        'Сначала уберите пробелы по краям (`trim`) и отдельно обработайте пустую строку.',
        'Для проверки результата используйте `Number.isFinite(n)`, которая отсекает и NaN, и Infinity.',
      ],
      explanation: '`Number("")` и `Number("  ")` дают 0, а не NaN — поэтому пустую строку нужно проверять отдельно. `Number.isFinite` отсекает NaN и ±Infinity.',
    },
    {
      id: 'js.types.5',
      skill: 'js.types',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'edge',
      prompt:
        'Функция `getPort(config)` должна вернуть `config.port`, а если порт не задан (`undefined` или `null`) — 8080. Сейчас она ошибается на одном из значений. Исправьте.',
      buggy: c`
        function getPort(config) {
          return config.port || 8080;
        }
      `,
      solution: c`
        function getPort(config) {
          return config.port == null ? 8080 : config.port;
        }
      `,
      tests: [
        { expr: 'getPort({ port: 3000 })', expect: '3000' },
        { expr: 'getPort({})', expect: '8080' },
        { expr: 'getPort({ port: 0 })', expect: '0', hidden: true, label: 'порт 0 — допустимое значение, а не «пусто»' },
        { expr: 'getPort({ port: null })', expect: '8080', hidden: true, label: 'null означает «не задан»' },
      ],
      hints: [
        'Какие значения `||` считает «ложными» и заменяет на запасное?',
        'Нужно заменять только `undefined` и `null`, а `0` оставлять.',
        'Идиома `x == null` истинна ровно для `null` и `undefined`.',
      ],
      explanation: '`||` реагирует на любое falsy-значение, в том числе `0` и `""`. Когда «пусто» означает только `null`/`undefined`, нужна проверка `== null` (или оператор `??`).',
    },
    {
      id: 'js.types.6',
      skill: 'js.types',
      kind: 'fix',
      difficulty: 1,
      lang: 'javascript',
      bugType: 'logic',
      prompt: 'Функция `isNotANumber(x)` должна возвращать `true` только для значения `NaN`. Исправьте её.',
      buggy: c`
        function isNotANumber(x) {
          return x === NaN;
        }
      `,
      solution: c`
        function isNotANumber(x) {
          return Number.isNaN(x);
        }
      `,
      tests: [
        { expr: 'isNotANumber(NaN)', expect: 'true' },
        { expr: 'isNotANumber(5)', expect: 'false' },
        { expr: 'isNotANumber(0 / 0)', expect: 'true', hidden: true, label: '0 / 0 даёт NaN' },
        { expr: 'isNotANumber("abc")', expect: 'false', hidden: true, label: 'строка — не NaN (глобальный isNaN ошибётся)' },
      ],
      hints: [
        'Чему равно `NaN === NaN`?',
        'В языке есть специальная функция для проверки NaN.',
        'Не используйте глобальный `isNaN` — он приводит строку к числу. Нужен `Number.isNaN`.',
      ],
      explanation: '`NaN` не равен самому себе, поэтому `x === NaN` всегда `false`. `Number.isNaN` не приводит аргумент, а глобальный `isNaN("abc")` вернул бы `true`.',
    },
    {
      id: 'js.types.7',
      skill: 'js.types',
      kind: 'predict',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Что выведет программа? Это нестрогое сравнение `==` со всеми его причудами.',
      code: c`
        console.log(1 == "1", 0 == "", null == undefined, null == 0, NaN == NaN, [] == false);
      `,
      answer: 'true true true false false true',
      explanation:
        '`"1"` и `""` приводятся к числам (1 и 0). `null == undefined` — особое правило; `null == 0` — `false`, потому что `null` равен только `undefined`. `NaN` не равен ничему. `[] == false`: `[]` → `""` → 0 и `false` → 0.',
    },
    {
      id: 'js.types.8',
      skill: 'js.types',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите функцию `kind`, которая различает `null`, массив и остальные типы, и вызовите её.',
      lines: [
        'function kind(v) {',
        '  if (v === null) return "null";',
        '  if (Array.isArray(v)) return "array";',
        '  return typeof v;',
        '}',
        'console.log(kind(null), kind([]), kind(42), kind("a"));',
      ],
      distractors: ['  if (typeof v === "null") return "null";', '  if (typeof v === "array") return "array";'],
      tests: [{ stdout: 'null array number string' }],
      explanation: '`typeof null` — "object", а `typeof []` — "object", поэтому `null` и массивы нужно проверять отдельно: `=== null` и `Array.isArray`. Значения "null" и "array" `typeof` вообще не возвращает.',
    },
    {
      id: 'js.types.9',
      skill: 'js.types',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Объясните, почему `0.1 + 0.2 !== 0.3` в JavaScript и как правильно сравнивать дробные числа или считать деньги.',
      code: c`
        console.log(0.1 + 0.2);
      `,
      keyPoints: [
        'Числа хранятся в двоичном формате с плавающей точкой (IEEE 754)',
        '0.1 и 0.2 не представимы точно в двоичной системе, ошибка округления накапливается',
        'Дробные числа сравнивают через допуск: Math.abs(a - b) < eps',
        'Деньги удобнее хранить целыми (копейки) или использовать BigInt/десятичные библиотеки',
      ],
      modelAnswer:
        'JavaScript хранит все числа как двоичные дроби с плавающей точкой. Число 0.1 в двоичной записи бесконечно (как 1/3 в десятичной), поэтому хранится с округлением, и сумма 0.1 + 0.2 получается 0.30000000000000004. Поэтому дробные числа сравнивают по модулю разности с маленьким допуском, например `Math.abs(a - b) < Number.EPSILON`. Для денег лучше считать в целых копейках, а рубли получать только при выводе.',
      explanation: 'Это не баг JavaScript, а свойство стандарта IEEE 754, общее для большинства языков (Python, Java, C).',
    },
  ],
};
