import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const loops: SkillModule = {
  skill: {
    id: 'js.loops',
    route: 'javascript',
    title: 'Циклы',
    icon: '🔁',
    summary: 'for, while, do…while, for…of и for…in, break/continue и ошибки на единицу.',
    prereqs: ['js.conditions'],
    tier: 2,
    outcomes: [
      'Выбираю подходящий цикл: for, while, do…while, for…of',
      'Различаю for…of (значения) и for…in (ключи-строки) и знаю, когда какой нужен',
      'Управляю циклом через break и continue',
      'Нахожу и предотвращаю ошибки на единицу (off-by-one) и бесконечные циклы',
    ],
    estMinutes: 25,
    lesson: {
      why: 'Циклы обрабатывают коллекции, повторяют действия и ищут решения. Почти все баги с границами ("на единицу больше/меньше") живут именно здесь.',
      brief:
        '`for (let i = 0; i < n; i++)` — счётный цикл; `while (условие)` — пока условие истинно; `do…while` выполняется минимум раз; `for (const x of iterable)` — по значениям; `for (const k in obj)` — по ключам-строкам (для массивов не нужен). `break` выходит из цикла, `continue` переходит к следующей итерации.',
      standard: md(
        '**Счётный цикл `for`** состоит из трёх частей: инициализация, условие, шаг. Условие проверяется *перед* каждой итерацией:',
        js`
          for (let i = 0; i < 3; i++) {
            console.log(i);   // 0, 1, 2
          }
        `,
        '**`while`** подходит, когда число повторений заранее неизвестно. Не забывайте менять переменную условия — иначе цикл станет бесконечным. **`do…while`** сначала выполняет тело, потом проверяет условие, поэтому тело выполнится хотя бы один раз.',
        js`
          let n = 27, steps = 0;
          while (n !== 1) {
            n = n % 2 === 0 ? n / 2 : 3 * n + 1;
            steps++;
          }
          console.log(steps);   // 111
        `,
        '**`for…of`** перебирает **значения** итерируемых объектов (массивы, строки, Map, Set):',
        js`
          for (const ch of "abc") console.log(ch);        // a b c
          for (const [i, x] of ["x", "y"].entries()) {
            console.log(i, x);                            // 0 x, 1 y
          }
        `,
        '**`for…in`** перебирает **имена перечислимых свойств** (всегда строки), включая унаследованные. Он создан для объектов; для массивов он даёт индексы как строки `"0"`, `"1"` и может зацепить лишние свойства. Для массива используйте `for…of`.',
        js`
          const user = { name: "Аня", age: 20 };
          for (const key in user) console.log(key, user[key]);   // name Аня / age 20
        `,
        '**`break`** немедленно завершает цикл, **`continue`** пропускает остаток тела и переходит к следующей итерации (в `for` — к шагу).',
        '**Ошибка на единицу (off-by-one).** Индексы массива идут от `0` до `length - 1`, поэтому условие — `i < arr.length`, а не `<=`. Выход за границу даёт `undefined`, и расчёты тихо превращаются в `NaN`.',
      ),
      deep: md(
        '**`let` в заголовке `for` создаёт новую привязку на каждую итерацию** — это важно для замыканий (см. тему «Замыкания»). С `var` переменная одна на весь цикл и остаётся видимой после него.',
        '**`for…of` работает с любым итерируемым объектом** — тем, у кого есть метод `[Symbol.iterator]`. Обычные объекты итерируемыми не являются: `for (const x of {a: 1})` — TypeError. Для них используйте `Object.keys/values/entries`.',
        '**Порядок `for…in`.** Для строковых ключей порядок — сначала целочисленные ключи по возрастанию, потом остальные в порядке создания. Унаследованные перечислимые свойства тоже попадают в перебор; фильтр — `Object.hasOwn(obj, key)`.',
        '**Метки.** `outer: for (…) { for (…) { if (…) break outer; } }` позволяет выйти из вложенных циклов сразу. Метки применяют редко; часто лучше вынести поиск в функцию и использовать `return`.',
        '**Изменение коллекции во время обхода.** Удаление элементов массива в цикле по индексу сдвигает остальные и приводит к пропускам; безопаснее обходить с конца или строить новый массив через `filter`.',
        '**Циклы и функции высшего порядка.** Для преобразования коллекций `map/filter/reduce` часто выразительнее цикла; но `break`/`continue` есть только у обычных циклов (в `forEach` их нет — выход возможен лишь исключением).',
        '**Асинхронность.** `for…of` с `await` внутри выполняет шаги последовательно, а `forEach(async …)` запускает все сразу и не ждёт (см. тему про async).',
      ),
      analogy:
        'Цикл — это конвейерная лента: `for` — «обработай ровно 10 деталей», `while` — «работай, пока лента не опустеет», `break` — красная кнопка стопа, `continue` — «эту деталь пропусти, дай следующую».',
      example: {
        lang: 'javascript',
        code: c`
          const words = ["один", "два", "три"];
          for (let i = 0; i < words.length; i++) {
            console.log(i, words[i]);
          }
          for (const w of words) {
            if (w === "два") continue;
            console.log(w.toUpperCase());
          }
          let n = 5;
          let steps = 0;
          while (n > 1) {
            n = n % 2 === 0 ? n / 2 : n * 3 + 1;
            steps++;
          }
          console.log(steps);
        `,
        steps: [
          'Счётный цикл идёт по индексам `0 … length - 1`; условие `i < words.length` исключает выход за границу.',
          '`for…of` даёт сами значения; `continue` пропускает слово "два", поэтому печатаются только "ОДИН" и "ТРИ".',
          '`while` повторяется, пока `n > 1`: 5 → 16 → 8 → 4 → 2 → 1 — пять шагов.',
        ],
        output: c`
          0 один
          1 два
          2 три
          ОДИН
          ТРИ
          5
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const arr = [10, 20, 30];
          let sum = 0;
          for (let i = 0; i <= arr.length; i++) sum += arr[i];
          console.log(sum);   // NaN — arr[3] это undefined
        `,
        explain: 'Условие `<=` делает лишнюю итерацию: `arr[3]` — `undefined`, а `60 + undefined` — `NaN`. Правильно `i < arr.length`.',
      },
      pitfalls: [
        'Ошибка на единицу: `i <= arr.length` вместо `i < arr.length`.',
        'Использовать `for…in` для массивов: ключи — строки, порядок и лишние свойства не гарантированы.',
        'Забыть изменить переменную условия в `while` — бесконечный цикл и зависшая вкладка.',
        'Думать, что `continue` выходит из цикла — он лишь переходит к следующей итерации.',
        'Изменять массив (удалять элементы), по которому идёт обход, — элементы пропускаются.',
      ],
      sources: [
        { title: 'MDN — Loops and iteration', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration' },
        { title: 'MDN — for...of', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of' },
        { title: 'MDN — for...in', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in' },
        { title: 'MDN — do...while', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/do...while' },
      ],
    },
    misconceptions: [
      {
        id: 'for-in-values',
        title: 'for…in перебирает значения массива',
        explanation: '`for…in` даёт **ключи** (для массива — индексы-строки `"0"`, `"1"`), а не значения. Значения даёт `for…of`.',
        fix: 'Для массивов и строк используйте `for…of`; `for…in` оставьте объектам.',
      },
      {
        id: 'off-by-one-length',
        title: 'Индекс последнего элемента равен length',
        explanation: 'Индексы идут от 0 до `length - 1`. Элемент `arr[arr.length]` — это `undefined`.',
        fix: 'В цикле по индексу пишите `i < arr.length`.',
      },
      {
        id: 'continue-exits',
        title: 'continue выходит из цикла',
        explanation: '`continue` только пропускает остаток тела и переходит к следующей итерации. Выход — это `break`.',
        fix: 'Для выхода используйте `break` (или `return` в функции).',
      },
      {
        id: 'do-while-zero',
        title: 'do…while не выполнится, если условие сразу ложно',
        explanation: 'У `do…while` условие проверяется после тела, поэтому тело выполнится как минимум один раз.',
        fix: 'Если пустой ввод должен давать ноль итераций, используйте `while`.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.loops.1',
      skill: 'js.loops',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        for (let i = 10; i > 0; i -= 3) {
          console.log(i);
        }
      `,
      answer: c`
        10
        7
        4
        1
      `,
      explanation: 'Шаг `-3`: 10, 7, 4, 1. Следующее значение -2 не удовлетворяет условию `i > 0`, и цикл завершается.',
    },
    {
      id: 'js.loops.2',
      skill: 'js.loops',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        for (const x in ["a", "b"]) {
          console.log(x);
        }
      `,
      options: [
        { text: '"0" и "1" (по отдельным строкам)', correct: true, why: '`for…in` перебирает ключи, а у массива это индексы в виде строк.' },
        { text: '"a" и "b"', why: 'Значения даёт `for…of`. `for…in` — только ключи.', misconception: 'for-in-values' },
        { text: '0 и 1 как числа', why: 'Ключи свойств всегда строки: `typeof x` здесь — "string".' },
        { text: 'TypeError: массив не итерируемый', why: 'Массив итерируем, а `for…in` вообще работает с любым объектом.' },
      ],
      explanation: '`for…in` — про имена свойств (строки), `for…of` — про значения. Для массивов практически всегда нужен `for…of`.',
    },
    {
      id: 'js.loops.3',
      skill: 'js.loops',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `countVowels(s)`, которая возвращает количество гласных (латинских `aeiou` и русских `аеёиоуыэюя`) в строке без учёта регистра.',
      starter: c`
        function countVowels(s) {
          // ваш код
        }
      `,
      solution: c`
        function countVowels(s) {
          const vowels = "aeiouаеёиоуыэюя";
          let count = 0;
          for (const ch of s.toLowerCase()) {
            if (vowels.includes(ch)) count++;
          }
          return count;
        }
      `,
      tests: [
        { expr: 'countVowels("hello")', expect: '2' },
        { expr: 'countVowels("JS")', expect: '0' },
        { expr: 'countVowels("Привет")', expect: '2' },
        { expr: 'countVowels("")', expect: '0', hidden: true, label: 'пустая строка' },
        { expr: 'countVowels("AEIOU")', expect: '5', hidden: true, label: 'заглавные буквы' },
        { expr: 'countVowels("Ёлка")', expect: '2', hidden: true, label: 'заглавная Ё' },
      ],
      hints: [
        'Нужно пройти по каждому символу строки и решить, гласный он или нет.',
        'Цикл `for…of` по строке даёт символы. Заведите счётчик.',
        'Приведите строку к нижнему регистру и проверяйте `"aeiou…".includes(ch)`.',
      ],
      explanation: '`for…of` итерирует строку по символам, `includes` проверяет принадлежность набору, а `toLowerCase` снимает зависимость от регистра.',
    },
    {
      id: 'js.loops.4',
      skill: 'js.loops',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Напишите функцию `collatzSteps(n)`: сколько шагов нужно, чтобы дойти от `n` до 1, если чётное число делить на 2, а нечётное заменять на `3n + 1`. Для `n = 1` — 0 шагов.',
      starter: c`
        function collatzSteps(n) {
          // ваш код
        }
      `,
      solution: c`
        function collatzSteps(n) {
          let steps = 0;
          while (n !== 1) {
            n = n % 2 === 0 ? n / 2 : 3 * n + 1;
            steps++;
          }
          return steps;
        }
      `,
      tests: [
        { expr: 'collatzSteps(6)', expect: '8' },
        { expr: 'collatzSteps(7)', expect: '16' },
        { expr: 'collatzSteps(1)', expect: '0', hidden: true, label: 'уже единица' },
        { expr: 'collatzSteps(27)', expect: '111', hidden: true, label: 'длинная траектория' },
        { expr: 'collatzSteps(16)', expect: '4', hidden: true, label: 'степень двойки' },
      ],
      hints: [
        'Число шагов заранее неизвестно — какой цикл для этого подходит?',
        'Пока `n !== 1`: изменяйте `n` по правилу и увеличивайте счётчик.',
        '`n = n % 2 === 0 ? n / 2 : 3 * n + 1;`',
      ],
      explanation: '`while` идеален, когда число итераций определяется данными. Для `n = 1` условие сразу ложно, и счётчик остаётся нулём.',
    },
    {
      id: 'js.loops.5',
      skill: 'js.loops',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: 'Функция `sumArray(arr)` должна вернуть сумму элементов, но возвращает `NaN`. Найдите ошибку на единицу.',
      buggy: c`
        function sumArray(arr) {
          let sum = 0;
          for (let i = 0; i <= arr.length; i++) {
            sum += arr[i];
          }
          return sum;
        }
      `,
      solution: c`
        function sumArray(arr) {
          let sum = 0;
          for (let i = 0; i < arr.length; i++) {
            sum += arr[i];
          }
          return sum;
        }
      `,
      tests: [
        { expr: 'sumArray([1, 2, 3])', expect: '6' },
        { expr: 'sumArray([5])', expect: '5' },
        { expr: 'sumArray([])', expect: '0', hidden: true, label: 'пустой массив' },
        { expr: 'sumArray([-1, 1])', expect: '0', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Выведите `arr[i]` на последней итерации. Что там?',
        'Индексы массива из n элементов — от 0 до n - 1.',
        'Замените `<=` на `<` в условии цикла.',
      ],
      explanation: 'На итерации `i === arr.length` читается `arr[arr.length]` — это `undefined`, и сумма превращается в `NaN`. Условие должно быть `i < arr.length`.',
    },
    {
      id: 'js.loops.6',
      skill: 'js.loops',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'edge',
      prompt: '`countdown(n)` должна вернуть массив `[n, n-1, …, 1]`, а для `n <= 0` — пустой массив. Для нуля она возвращает `[0]`. Исправьте.',
      buggy: c`
        function countdown(n) {
          const res = [];
          do {
            res.push(n);
            n--;
          } while (n > 0);
          return res;
        }
      `,
      solution: c`
        function countdown(n) {
          const res = [];
          while (n > 0) {
            res.push(n);
            n--;
          }
          return res;
        }
      `,
      tests: [
        { expr: 'countdown(3)', expect: '[3, 2, 1]' },
        { expr: 'countdown(1)', expect: '[1]' },
        { expr: 'countdown(0)', expect: '[]', hidden: true, label: 'ноль: цикл не должен выполниться' },
        { expr: 'countdown(-2)', expect: '[]', hidden: true, label: 'отрицательное число' },
      ],
      hints: [
        'Сколько раз выполнится тело `do…while`, если условие ложно с самого начала?',
        '`do…while` сначала выполняет тело, и только потом проверяет условие.',
        'Замените `do { … } while (…)` на обычный `while (n > 0) { … }`.',
      ],
      explanation: '`do…while` всегда делает хотя бы одну итерацию, поэтому для `n = 0` в массив попадает 0. Если «ноль итераций» допустим, нужен `while`.',
    },
    {
      id: 'js.loops.7',
      skill: 'js.loops',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу, которая выводит сумму нечётных чисел от 1 до 10 (используя `continue`).',
      lines: [
        'let total = 0;',
        'for (let i = 1; i <= 10; i++) {',
        '  if (i % 2 === 0) continue;',
        '  total += i;',
        '}',
        'console.log(total);',
      ],
      distractors: ['  if (i % 2 === 0) break;', 'for (const i = 1; i <= 10; i++) {'],
      tests: [{ stdout: '25' }],
      explanation: '`continue` пропускает чётные числа, остальные суммируются: 1+3+5+7+9 = 25. `break` остановил бы цикл на первом чётном, а счётчик `const` нельзя увеличивать.',
    },
    {
      id: 'js.loops.8',
      skill: 'js.loops',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        for (const ch of "a1b2c3") {
          if (/\\d/.test(ch)) continue;
          if (ch === "c") break;
          console.log(ch);
        }
        for (var i = 0; i < 3; i++) {}
        console.log(i);
      `,
      answer: c`
        a
        b
        3
      `,
      explanation: 'Цифры пропускаются через `continue`, на "c" цикл прерывается `break`, поэтому печатаются "a" и "b". `var i` не ограничена циклом, и после него `i` равна 3.',
    },
    {
      id: 'js.loops.9',
      skill: 'js.loops',
      kind: 'explain',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Объясните разницу между `for…of` и `for…in` и посоветуйте, что использовать для массива и что для объекта.',
      code: c`
        const arr = ["a", "b"];
        for (const x of arr) console.log(x);
        for (const x in arr) console.log(x);
      `,
      keyPoints: [
        '`for…of` даёт значения итерируемых объектов',
        '`for…in` даёт имена перечислимых свойств — строки, в том числе унаследованные',
        'Для массивов нужен `for…of` (или обычный `for`), для объектов — `Object.keys/entries` или `for…in`',
      ],
      modelAnswer:
        '`for…of` перебирает значения итерируемого объекта — массива, строки, Map, Set. `for…in` перебирает имена перечислимых свойств, и это всегда строки; для массива он выдаст "0", "1" и может зацепить унаследованные свойства. Поэтому для массива я использую `for…of`, а для обычного объекта — `Object.entries(obj)` вместе с `for…of`, либо `for…in` с проверкой `Object.hasOwn`.',
      explanation: 'Запомнить легко: of — «из коллекции берём значения», in — «в объекте смотрим имена».',
    },
  ],
};
