import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const functions: SkillModule = {
  skill: {
    id: 'js.functions',
    route: 'javascript',
    title: 'Функции',
    icon: '⚙️',
    summary: 'Объявления, выражения и стрелочные функции, параметры по умолчанию, rest, hoisting и функции высшего порядка.',
    prereqs: ['js.loops'],
    tier: 2,
    outcomes: [
      'Объявляю функции тремя способами и знаю, чем они отличаются (hoisting, this, arguments)',
      'Использую параметры по умолчанию и rest-параметры',
      'Не путаю return, неявный возврат стрелочной функции и возврат объектного литерала',
      'Передаю функции как значения и возвращаю функции из функций (функции высшего порядка)',
      'Понимаю, что аргументы-объекты передаются по ссылке, а переприсваивание параметра не меняет внешнюю переменную',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Функции — единица повторного использования и главный строительный блок JavaScript. Функции как значения лежат в основе колбэков, обработчиков событий, промисов и фреймворков.',
      brief:
        '`function f() {}` поднимается целиком (hoisting); `const f = function() {}` и `const f = () => {}` — нет. У стрелочной функции с телом в `{}` нужен `return`. Параметры могут иметь значения по умолчанию (`a = 1`, срабатывают на `undefined`) и собирать остаток (`...rest`). Функции — обычные значения: их передают и возвращают.',
      standard: md(
        '**Три способа создать функцию:**',
        js`
          function add(a, b) { return a + b; }          // объявление (function declaration)
          const sub = function (a, b) { return a - b; }; // функциональное выражение
          const mul = (a, b) => a * b;                   // стрелочная функция
          console.log(add(2, 3), sub(5, 1), mul(3, 4));  // 5 4 12
        `,
        '**return.** Функция без `return` (или с пустым `return`) возвращает `undefined`. У стрелочной функции с выражением вместо тела (`x => x * 2`) значение возвращается неявно; если вы открыли фигурные скобки, `return` нужно писать самому. Объектный литерал в неявном возврате оборачивают в скобки: `() => ({ a: 1 })`.',
        '**Параметры по умолчанию** подставляются, когда аргумент `undefined` (не `null`!). Они могут зависеть от предыдущих параметров. **Rest-параметр** `...rest` собирает остаток аргументов в настоящий массив:',
        js`
          function f(a, b = a * 2, ...rest) { return [a, b, rest]; }
          console.log(f(1));              // [ 1, 2, [] ]
          console.log(f(1, undefined, 3, 4));   // [ 1, 2, [ 3, 4 ] ]
          console.log(f(1, null));        // [ 1, null, [] ]
        `,
        '**Hoisting.** Объявление функции поднимается вместе с телом — вызвать её можно до строки объявления. Переменная с `const`/`let` недоступна до своей строки (TDZ), а `var` поднимается как `undefined`; поэтому вызов функционального выражения до присваивания — ошибка.',
        '**Аргументы и ссылки.** Примитивы копируются, а для объектов копируется ссылка: функция может изменить переданный объект, но присваивание параметру (`arr = []`) только переназначает локальное имя.',
        '**Функции высшего порядка** принимают или возвращают функции. Именно так работают `map`, `filter`, `sort` с компаратором:',
        js`
          const twice = (f) => (x) => f(f(x));
          const square = (x) => x * x;
          console.log(twice(square)(3));    // 81
          console.log([1, 2, 3].map(square));   // [ 1, 4, 9 ]
        `,
        '**Чистые функции** (результат зависит только от аргументов, нет побочных эффектов) проще тестировать и комбинировать.',
      ),
      deep: md(
        '**Функции — объекты первого класса.** У них есть свойства (`name`, `length` — число параметров до первого значения по умолчанию), их можно хранить в массивах и объектах. Вызов — это просто применение оператора `()` к значению.',
        '**Стрелочные функции** не имеют собственных `this`, `arguments`, `super` и `new.target`; их нельзя вызвать через `new`. `this` берётся из окружающего лексического контекста — поэтому они удобны как колбэки внутри методов и неудобны как методы объектов.',
        '**`arguments`** — «псевдомассив» только в обычных функциях. В новом коде предпочитайте rest-параметры: это настоящий массив и работает в стрелочных функциях.',
        '**Область видимости параметров по умолчанию.** Значения по умолчанию вычисляются при каждом вызове, в собственной области видимости: `function f(x = []) {}` создаёт новый массив при каждом вызове (в отличие от Python).',
        '**IIFE** — немедленно вызываемое функциональное выражение `(() => { … })()` — классический способ создать изолированную область видимости до появления модулей и блочных `let`.',
        '**Рекурсия и стек.** Каждый вызов занимает кадр стека; слишком глубокая рекурсия даёт `RangeError: Maximum call stack size exceeded`. TCO в JavaScript не гарантирован.',
        '**Именованные функциональные выражения** (`const f = function fact(n) { … fact(n - 1) }`) удобны для рекурсии и дают осмысленное имя в стеке вызовов.',
        '**Каррирование и частичное применение** строятся на замыканиях: `const add = (a) => (b) => a + b; add(1)(2)`. Функция `bind` создаёт функцию с зафиксированными `this` и частью аргументов.',
      ),
      analogy:
        'Функция — это рецепт: его можно записать (объявить), передать другому повару (как аргумент) и приготовить блюдо много раз с разными ингредиентами (параметрами).',
      example: {
        lang: 'javascript',
        code: c`
          const square = (x) => x * x;
          function sum(...nums) {
            return nums.reduce((a, b) => a + b, 0);
          }
          function greet(name = "гость") {
            return \`Привет, \${name}!\`;
          }
          const twice = (f) => (x) => f(f(x));
          console.log(square(5), sum(1, 2, 3), greet(), greet("Аня"));
          console.log(twice(square)(3));
          console.log([1, 2, 3].map(square));
        `,
        steps: [
          '`square` — стрелочная функция с неявным возвратом: результат выражения `x * x`.',
          '`sum(...nums)` собирает все аргументы в массив и сворачивает его через `reduce`.',
          '`greet()` без аргумента использует значение по умолчанию "гость"; `greet("Аня")` — переданное.',
          '`twice` принимает функцию и возвращает новую функцию, применяющую её дважды: `square(square(3))` = 81.',
          '`map` получает `square` как значение — это и есть функция высшего порядка.',
        ],
        output: c`
          25 6 Привет, гость! Привет, Аня!
          81
          [ 1, 4, 9 ]
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const double = (x) => { x * 2 };
          console.log(double(4));   // undefined — в теле {} нужен return
        `,
        explain: 'Фигурные скобки превращают тело в блок инструкций, а не в выражение. Либо `(x) => x * 2`, либо `(x) => { return x * 2; }`.',
      },
      pitfalls: [
        'Забыть `return` в стрелочной функции с фигурными скобками — функция вернёт `undefined`.',
        'Вернуть объектный литерал без скобок: `() => { a: 1 }` — это блок с меткой, а не объект. Нужно `() => ({ a: 1 })`.',
        'Вызвать функциональное выражение до его определения: `const f = …` не поднимается.',
        'Ожидать, что `null` активирует параметр по умолчанию — срабатывает только `undefined`.',
        'Думать, что присваивание параметру `arr = []` очистит массив вызывающего кода: переназначается лишь локальное имя.',
        'Передавать метод как колбэк (`setTimeout(obj.method, 0)`): `this` теряется (подробнее в теме про классы).',
      ],
      sources: [
        { title: 'MDN — Functions (guide)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
        { title: 'MDN — Arrow function expressions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions' },
        { title: 'MDN — Default parameters', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters' },
        { title: 'MDN — Rest parameters', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters' },
        { title: 'MDN — Hoisting', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting' },
      ],
    },
    misconceptions: [
      {
        id: 'arrow-braces-return',
        title: 'Стрелочная функция с {} сама возвращает последнее выражение',
        explanation: 'Неявный возврат работает только когда тело — одно выражение без фигурных скобок. В блоке нужен явный `return`.',
        fix: 'Пишите `x => x * 2` или `x => { return x * 2; }`.',
      },
      {
        id: 'function-expr-hoisted',
        title: 'Все функции доступны до места определения',
        explanation: 'Поднимаются только объявления `function f() {}`. Функциональные выражения и стрелочные функции, записанные в `const`/`let`/`var`, нет.',
        fix: 'Определяйте функции-выражения до использования или применяйте объявления.',
      },
      {
        id: 'default-param-null',
        title: 'Значение по умолчанию подставляется и для null',
        explanation: 'Параметр по умолчанию срабатывает только на `undefined`. `null` — это обычное переданное значение.',
        fix: 'Для обработки `null` используйте `??` внутри функции.',
      },
      {
        id: 'param-reassign-changes-caller',
        title: 'Присваивание параметру меняет переменную вызывающего',
        explanation: 'Параметр — локальное имя. `arr = []` переназначает его локально; изменяет объект вызывающего только мутация (`arr.push`, `arr.length = 0`).',
        fix: 'Для изменения переданного массива мутируйте его; для чистоты — возвращайте новое значение.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.functions.1',
      skill: 'js.functions',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа? Обратите внимание на hoisting.',
      code: c`
        console.log(add(2, 3));
        console.log(typeof sub);
        function add(a, b) { return a + b; }
        var sub = function () {};
        console.log(typeof sub);
      `,
      answer: c`
        5
        undefined
        function
      `,
      explanation: 'Объявление `add` поднимается целиком, поэтому вызов до него работает. `var sub` поднимается как `undefined`; функция присваивается позже.',
    },
    {
      id: 'js.functions.2',
      skill: 'js.functions',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        const f = (x) => { x * 2 };
        console.log(f(4));
      `,
      options: [
        { text: 'undefined', correct: true, why: 'В теле с фигурными скобками нет `return`, значит функция возвращает `undefined`.' },
        { text: '8', why: 'Неявный возврат есть только у `x => x * 2` (без скобок).', misconception: 'arrow-braces-return' },
        { text: '4', why: 'Функция не возвращает аргумент — она ничего не возвращает.' },
        { text: 'SyntaxError', why: 'Синтаксически код корректен: `{ x * 2 }` — это блок с выражением.' },
      ],
      explanation: 'Фигурные скобки — блок инструкций. Без `return` результат — `undefined`, даже если внутри вычисляется выражение.',
    },
    {
      id: 'js.functions.3',
      skill: 'js.functions',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Когда срабатывает значение по умолчанию?',
      code: c`
        function f(a, b = a * 2, ...rest) { return [a, b, rest]; }
        console.log(f(1));
        console.log(f(1, undefined, 3, 4));
        console.log(f(1, null));
      `,
      answer: c`
        [ 1, 2, [] ]
        [ 1, 2, [ 3, 4 ] ]
        [ 1, null, [] ]
      `,
      explanation: 'Значение по умолчанию `a * 2` подставляется только при `undefined`. `null` остаётся `null`. `rest` — всегда массив, пустой, если лишних аргументов нет.',
    },
    {
      id: 'js.functions.4',
      skill: 'js.functions',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `sumAll`, принимающую любое число аргументов (через rest-параметр) и возвращающую их сумму. Без аргументов — 0.',
      starter: c`
        function sumAll() {
          // ваш код
        }
      `,
      solution: c`
        function sumAll(...nums) {
          let total = 0;
          for (const n of nums) total += n;
          return total;
        }
      `,
      tests: [
        { expr: 'sumAll(1, 2, 3)', expect: '6' },
        { expr: 'sumAll(5)', expect: '5' },
        { expr: 'sumAll()', expect: '0', hidden: true, label: 'без аргументов' },
        { expr: 'sumAll(-1, 1, -5)', expect: '-5', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Как функции принять произвольное число аргументов?',
        'Используйте rest-параметр `...nums` — это настоящий массив.',
        'Пройдите по `nums` циклом (или `reduce` с начальным значением 0).',
      ],
      explanation: 'Rest-параметр собирает аргументы в массив; для пустого вызова это пустой массив, и сумма равна начальному значению 0.',
    },
    {
      id: 'js.functions.5',
      skill: 'js.functions',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Напишите функцию `compose(f, g)`, которая возвращает новую функцию `x => f(g(x))`: сначала применяется `g`, затем `f`.',
      starter: c`
        function compose(f, g) {
          // ваш код
        }
      `,
      solution: c`
        function compose(f, g) {
          return (x) => f(g(x));
        }
      `,
      tests: [
        { expr: 'compose((x) => x + 1, (x) => x * 2)(5)', expect: '11' },
        { expr: 'compose(String, Math.abs)(-3)', expect: '"3"' },
        { expr: 'compose((x) => x + "a", (x) => x + "b")("")', expect: '"ba"', hidden: true, label: 'порядок: сначала g, потом f' },
        { expr: 'typeof compose((x) => x, (x) => x)', expect: '"function"', hidden: true, label: 'результат — функция' },
      ],
      hints: [
        'Что должна вернуть `compose`: число, строку или что-то другое?',
        'Она возвращает новую функцию одного аргумента.',
        '`return (x) => f(g(x));`',
      ],
      explanation: '`compose` — функция высшего порядка: принимает функции и возвращает функцию. Порядок вложенных вызовов `f(g(x))` задаёт порядок применения.',
    },
    {
      id: 'js.functions.6',
      skill: 'js.functions',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'edge',
      prompt: '`average(...nums)` должна вернуть среднее арифметическое аргументов, а без аргументов — 0. Сейчас для пустого вызова результат неверен.',
      buggy: c`
        function average(...nums) {
          return nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      `,
      solution: c`
        function average(...nums) {
          if (nums.length === 0) return 0;
          return nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      `,
      tests: [
        { expr: 'average(2, 4)', expect: '3' },
        { expr: 'average(5)', expect: '5' },
        { expr: 'average()', expect: '0', hidden: true, label: 'без аргументов (деление 0 на 0)' },
        { expr: 'average(-1, 1)', expect: '0', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Чему равно `0 / 0` в JavaScript?',
        'Пустой набор нужно обработать до деления.',
        'Добавьте `if (nums.length === 0) return 0;`.',
      ],
      explanation: 'Для пустого набора `0 / 0` даёт `NaN`. Крайний случай (пустой ввод) нужно обрабатывать явно.',
    },
    {
      id: 'js.functions.7',
      skill: 'js.functions',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'syntax',
      prompt: 'Стрелочная функция `toPoint(x, y)` должна возвращать объект `{ x, y }`, но код не работает. Исправьте запись.',
      buggy: c`
        const toPoint = (x, y) => { x: x, y: y };
      `,
      solution: c`
        const toPoint = (x, y) => ({ x: x, y: y });
      `,
      tests: [
        { expr: 'toPoint(1, 2)', expect: '({ x: 1, y: 2 })' },
        { expr: 'toPoint(0, 0)', expect: '({ x: 0, y: 0 })' },
        { expr: 'toPoint(-1, 5)', expect: '({ x: -1, y: 5 })', hidden: true, label: 'отрицательная координата' },
      ],
      hints: [
        'Как JavaScript читает `{` сразу после `=>`: как объект или как блок?',
        'После `=>` фигурные скобки открывают тело функции (блок), а не объект.',
        'Оберните объектный литерал в круглые скобки: `=> ({ … })`.',
      ],
      explanation: 'После `=>` символ `{` начинает тело-блок, и `x: x, y: y` читается как метка и выражение — это синтаксическая ошибка. Круглые скобки превращают `{ … }` в выражение-объект.',
    },
    {
      id: 'js.functions.8',
      skill: 'js.functions',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`clear(arr)` должна очистить переданный массив (изменить его на месте). Но массив вызывающего кода остаётся прежним. Исправьте.',
      buggy: c`
        function clear(arr) {
          arr = [];
        }
      `,
      solution: c`
        function clear(arr) {
          arr.length = 0;
        }
      `,
      tests: [
        { expr: '(() => { const a = [1, 2, 3]; clear(a); return a; })()', expect: '[]' },
        { expr: '(() => { const a = ["x"]; clear(a); return a.length; })()', expect: '0' },
        { expr: '(() => { const a = []; clear(a); return a; })()', expect: '[]', hidden: true, label: 'уже пустой массив' },
        { expr: '(() => { const a = [1, 2]; const b = a; clear(a); return b; })()', expect: '[]', hidden: true, label: 'другая ссылка на тот же массив тоже очищена' },
      ],
      hints: [
        'Что именно меняет `arr = []`: сам массив или только имя `arr` внутри функции?',
        'Чтобы изменить массив вызывающего, нужно мутировать тот же объект.',
        'Установите `arr.length = 0`.',
      ],
      explanation: 'Параметр — локальное имя, переназначение не затрагивает внешнюю переменную. Мутация (`length = 0`, `splice`) меняет сам объект, на который указывают обе ссылки.',
    },
    {
      id: 'js.functions.9',
      skill: 'js.functions',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите функцию высшего порядка `repeat(n, action)`, вызывающую `action(i)` для `i = 0 … n-1`, и вызовите её.',
      lines: [
        'function repeat(n, action) {',
        '  for (let i = 0; i < n; i++) {',
        '    action(i);',
        '  }',
        '}',
        'repeat(3, (i) => console.log("шаг", i + 1));',
      ],
      distractors: ['    action[i];', 'repeat(3, console.log("шаг"));'],
      tests: [{ stdout: 'шаг 1\nшаг 2\nшаг 3' }],
      explanation: 'Функция передаётся как значение и вызывается через `action(i)`. Запись `repeat(3, console.log(...))` вызвала бы `console.log` сразу и передала бы `undefined`.',
    },
    {
      id: 'js.functions.10',
      skill: 'js.functions',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Сравните объявление функции, функциональное выражение и стрелочную функцию: чем они отличаются на практике?',
      keyPoints: [
        'Объявление поднимается целиком — его можно вызвать до строки определения',
        'Функциональное выражение и стрелка присваиваются переменной и недоступны до присваивания',
        'У стрелочной функции нет собственных this и arguments, её нельзя вызвать через new',
        'Стрелка с выражением вместо тела возвращает значение неявно',
      ],
      modelAnswer:
        'Объявление `function f() {}` поднимается вместе с телом, поэтому вызвать его можно выше по коду. Функциональное выражение и стрелочная функция — это значения, записанные в переменную: пока строка с присваиванием не выполнена, вызывать их нельзя. Стрелочная функция к тому же не имеет собственных `this` и `arguments` (берёт их из окружения), не работает с `new` и позволяет короткую запись с неявным возвратом: `x => x * 2`. Поэтому стрелки удобны как колбэки, а объявления — для основных именованных функций модуля.',
      explanation: 'Различия важны при работе с колбэками, методами объектов и классами — особенно вокруг `this`.',
    },
  ],
};
