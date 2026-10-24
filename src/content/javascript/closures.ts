import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const closures: SkillModule = {
  skill: {
    id: 'js.closures',
    route: 'javascript',
    title: 'Область видимости и замыкания',
    icon: '🔐',
    summary: 'Лексическая область видимости, замыкания, let в циклах против var, временная мёртвая зона и фабрики функций.',
    prereqs: ['js.functions'],
    tier: 3,
    outcomes: [
      'Объясняю лексическую область видимости: что видит функция определяется местом записи, а не вызова',
      'Использую замыкания для хранения состояния (счётчики, фабрики, once)',
      'Понимаю, почему var в цикле даёт одинаковые значения в колбэках, а let — разные',
      'Узнаю временную мёртвую зону (TDZ) по сообщению ReferenceError',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Замыкания лежат в основе колбэков, модулей, мемоизации, React-хуков и приватного состояния. Это одна из самых частых тем собеседований и источник странных багов с циклами.',
      brief:
        'Функция помнит переменные места, где она **создана** (лексическое окружение), и сохраняет их, даже когда внешняя функция уже завершилась. `let` в заголовке `for` создаёт новую переменную на каждую итерацию, `var` — одну на весь цикл. До строки `let/const` имя недоступно (TDZ) — это `ReferenceError`, а не `undefined`.',
      standard: md(
        '**Лексическая область видимости.** Имена ищутся от внутренней области к внешней — по тому, где функция *написана*, а не откуда вызвана:',
        js`
          const x = "global";
          function show() { console.log(x); }
          function run() {
            const x = "local";
            show();
          }
          run();   // global — show «видит» x там, где объявлена
        `,
        '**Замыкание** — функция вместе с ссылкой на окружение, в котором она создана. Переменные окружения живут, пока на них ссылается хоть одна функция:',
        js`
          function makeCounter() {
            let n = 0;
            return () => ++n;
          }
          const a = makeCounter();
          const b = makeCounter();
          a(); a();
          console.log(a(), b());   // 3 1 — у каждого счётчика своё n
        `,
        'Каждый вызов `makeCounter` создаёт **новое** окружение, поэтому счётчики независимы, а `n` недоступна снаружи — это способ организовать приватное состояние.',
        '**Замыкание хранит переменную, а не её значение.** Если переменная потом изменится, функция увидит новое значение:',
        js`
          let price = 100;
          const show = () => price;
          price = 120;
          console.log(show());   // 120
        `,
        '**Циклы: var против let.** С `var` в цикле одна общая переменная — к моменту вызова колбэков она равна конечному значению. `let` в заголовке `for` создаёт свежую переменную для каждой итерации:',
        js`
          const fs = [];
          for (var i = 0; i < 3; i++) fs.push(() => i);
          console.log(fs.map((f) => f()));    // [ 3, 3, 3 ]
          const gs = [];
          for (let j = 0; j < 3; j++) gs.push(() => j);
          console.log(gs.map((g) => g()));    // [ 0, 1, 2 ]
        `,
        '**Временная мёртвая зона (TDZ).** `let`/`const` «известны» с начала блока, но до строки объявления доступа к ним нет: `ReferenceError: Cannot access \'x\' before initialization`. Это защищает от использования переменной до её инициализации.',
      ),
      deep: md(
        '**Окружения и цепочка областей.** Каждый вызов функции создаёт запись окружения (environment record), связанную со внешним окружением. Замыкание — это функциональный объект с внутренней ссылкой `[[Environment]]` на окружение создания. Поиск имени идёт по цепочке до глобальной области.',
        '**Что хранится в памяти.** Современные движки сохраняют в замыкании только те переменные, которые реально используются внутренними функциями. Но крупные структуры, на которые ссылается долгоживущий колбэк, не освобождаются сборщиком мусора — типичная причина утечек памяти (подписки, таймеры, кэши).',
        '**Hoisting.** `var` и объявления функций поднимаются; `let`/`const`/`class` тоже «поднимаются» в том смысле, что имя уже зарезервировано в блоке (поэтому внешняя одноимённая переменная не видна), но остаются в TDZ до инициализации.',
        '**Блочная область и функции в блоках.** Функциональное объявление в `if` в строгом режиме видно только внутри блока; в нестрогом поведение исторически отличается — ещё одна причина писать в строгом режиме и использовать выражения.',
        '**IIFE и модули.** До `let` и модулей изолированную область создавали через `(function () { … })()`. Модульный паттерн — замыкание, возвращающее объект с публичными методами и скрывающее состояние.',
        '**Мемоизация и частичное применение** тоже построены на замыканиях: кэш `Map` в окружении обёртки, и функция `memo(fn)` возвращает функцию, помнящую результаты.',
        '**Замыкания в таймерах и обработчиках.** Колбэк, переданный в `setTimeout`, выполнится позже, но захваченные переменные уже могли измениться; поэтому в циклах используют `let` или передают значение как аргумент.',
      ),
      analogy:
        'Замыкание — это рюкзак, который функция получает при создании: в нём лежат ссылки на все переменные окружающих областей. Куда бы функцию ни унесли, рюкзак с ней.',
      example: {
        lang: 'javascript',
        code: c`
          function makeCounter(step = 1) {
            let count = 0;
            return () => {
              count += step;
              return count;
            };
          }
          const byOne = makeCounter();
          const byTen = makeCounter(10);
          console.log(byOne(), byOne(), byTen());
          const fns = [];
          for (let i = 0; i < 3; i++) fns.push(() => i);
          console.log(fns.map((f) => f()));
          try {
            console.log(late);
          } catch (e) {
            console.log(e.name);
          }
          let late = 1;
        `,
        steps: [
          '`makeCounter` создаёт переменную `count` и возвращает функцию, которая её видит. Для `byOne` и `byTen` — два разных окружения.',
          '`byOne()` дважды увеличивает свой `count` (1, 2), а `byTen()` работает со своим (10).',
          'С `let` каждая итерация цикла получает свою `i`, поэтому функции возвращают 0, 1, 2.',
          'Обращение к `late` до строки `let late = 1` попадает в временную мёртвую зону — это `ReferenceError`, который мы перехватили.',
        ],
        output: c`
          1 2 10
          [ 0, 1, 2 ]
          ReferenceError
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const fs = [];
          for (var i = 0; i < 3; i++) fs.push(() => i);
          console.log(fs.map((f) => f()));   // [ 3, 3, 3 ], а не [ 0, 1, 2 ]
        `,
        explain: '`var i` — одна переменная на всю функцию: к моменту вызова колбэков цикл завершился и `i === 3`. Замена на `let` даёт каждой итерации свою переменную.',
      },
      pitfalls: [
        'Использовать `var` в цикле, создающем колбэки: все колбэки видят одно конечное значение.',
        'Считать, что замыкание «копирует» значение: оно хранит ссылку на переменную, и изменения видны.',
        'Обращаться к `let`/`const` до объявления — ReferenceError (TDZ), а не `undefined`, как у `var`.',
        'Долгоживущие колбэки, захватывающие большие объекты, могут вызывать утечки памяти.',
        'Ожидать, что область видимости определяется местом вызова (как в «динамических» языках): в JS — только местом записи.',
      ],
      sources: [
        { title: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' },
        { title: 'MDN — Grammar and types: variable scope', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variable_scope' },
        { title: 'MDN — let (temporal dead zone)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz' },
        { title: 'ECMAScript — Environment Records', url: 'https://tc39.es/ecma262/#sec-environment-records' },
      ],
    },
    misconceptions: [
      {
        id: 'closure-copies-value',
        title: 'Замыкание копирует значение переменной',
        explanation: 'Замыкание хранит ссылку на **переменную**. Если значение изменится, функция увидит новое.',
        fix: 'Если нужно зафиксировать значение, передайте его аргументом или создайте новую переменную (`let` в цикле).',
      },
      {
        id: 'counter-shared',
        title: 'Все функции из одной фабрики делят одно состояние',
        explanation: 'Каждый вызов фабрики создаёт новое окружение, поэтому у каждой созданной функции свои переменные.',
        fix: 'Общее состояние создаётся *снаружи* фабрики, приватное — внутри.',
      },
      {
        id: 'var-loop-per-iteration',
        title: 'var в цикле создаёт отдельную переменную на каждую итерацию',
        explanation: '`var` одна на функцию. Отдельную переменную на итерацию создаёт `let` в заголовке `for`.',
        fix: 'Используйте `let` в циклах.',
      },
      {
        id: 'tdz-undefined',
        title: 'let до объявления даёт undefined',
        explanation: 'Так ведёт себя `var`. Для `let`/`const` до строки объявления — `ReferenceError` (временная мёртвая зона).',
        fix: 'Объявляйте переменные до использования.',
      },
      {
        id: 'scope-by-call',
        title: 'Функция видит переменные того места, откуда её вызвали',
        explanation: 'Область видимости лексическая: определяется местом записи функции в коде.',
        fix: 'Нужное значение передавайте параметром или держите в общей внешней области.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.closures.1',
      skill: 'js.closures',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const x = "global";
        function show() { console.log(x); }
        function run() {
          const x = "local";
          show();
        }
        run();
      `,
      answer: 'global',
      explanation: '`show` определена на верхнем уровне, поэтому видит глобальную `x`. Локальная `x` внутри `run` для `show` невидима — область видимости лексическая.',
    },
    {
      id: 'js.closures.2',
      skill: 'js.closures',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        function makeCounter() {
          let n = 0;
          return () => ++n;
        }
        const a = makeCounter();
        const b = makeCounter();
        a(); a();
        console.log(a(), b());
      `,
      options: [
        { text: '3 1', correct: true, why: 'У каждого вызова `makeCounter` своё окружение: `a` досчитал до 3, `b` только начал.' },
        { text: '3 3', why: 'Счётчики не разделяют `n`: переменная создаётся заново при каждом вызове фабрики.', misconception: 'counter-shared' },
        { text: '1 1', why: '`a` вызывался уже дважды, его состояние сохраняется между вызовами.' },
        { text: '3 4', why: '`b` не связан с `a`; его первый вызов вернёт 1.' },
      ],
      explanation: 'Замыкание хранит переменную окружения между вызовами, а каждый вызов фабрики создаёт новое окружение.',
    },
    {
      id: 'js.closures.3',
      skill: 'js.closures',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Чем отличаются `var` и `let` в заголовке цикла?',
      code: c`
        const fs = [];
        for (var i = 0; i < 3; i++) fs.push(() => i);
        console.log(fs.map((f) => f()));
        const gs = [];
        for (let j = 0; j < 3; j++) gs.push(() => j);
        console.log(gs.map((g) => g()));
      `,
      answer: c`
        [ 3, 3, 3 ]
        [ 0, 1, 2 ]
      `,
      explanation: '`var i` одна на всю функцию: после цикла она равна 3, и все колбэки возвращают 3. `let j` создаётся заново на каждой итерации.',
    },
    {
      id: 'js.closures.4',
      skill: 'js.closures',
      kind: 'code',
      difficulty: 2,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите фабрику `makeAdder(n)`: она возвращает функцию, прибавляющую `n` к своему аргументу.',
      starter: c`
        function makeAdder(n) {
          // ваш код
        }
      `,
      solution: c`
        function makeAdder(n) {
          return (x) => x + n;
        }
      `,
      tests: [
        { expr: 'makeAdder(5)(3)', expect: '8' },
        { expr: 'makeAdder(-1)(1)', expect: '0' },
        { expr: '(() => { const a = makeAdder(1), b = makeAdder(10); return [a(1), b(1)]; })()', expect: '[2, 11]', hidden: true, label: 'два сумматора независимы' },
        { expr: 'makeAdder(0)(7)', expect: '7', hidden: true, label: 'прибавление нуля' },
      ],
      hints: [
        'Что должна вернуть `makeAdder` — число или функцию?',
        'Внутренняя функция «запомнит» `n` из окружения.',
        '`return (x) => x + n;`',
      ],
      explanation: 'Возвращаемая функция замкнула параметр `n`. Для каждого вызова `makeAdder` создаётся своё окружение, поэтому сумматоры независимы.',
    },
    {
      id: 'js.closures.5',
      skill: 'js.closures',
      kind: 'code',
      difficulty: 3,
      lang: 'javascript',
      prompt:
        'Напишите функцию `once(fn)`: возвращает функцию, которая вызывает `fn` только при первом вызове (передавая ей аргументы), а при последующих возвращает результат первого вызова.',
      starter: c`
        function once(fn) {
          // ваш код
        }
      `,
      solution: c`
        function once(fn) {
          let called = false;
          let result;
          return (...args) => {
            if (!called) {
              called = true;
              result = fn(...args);
            }
            return result;
          };
        }
      `,
      tests: [
        { expr: '(() => { let c = 0; const f = once(() => ++c); f(); f(); return c; })()', expect: '1' },
        { expr: '(() => { const f = once((x) => x * 2); return [f(2), f(5)]; })()', expect: '[4, 4]' },
        { expr: '(() => { let c = 0; const f = once(() => { c++; }); f(); f(); f(); return c; })()', expect: '1', hidden: true, label: 'функция возвращает undefined — вызов всё равно один' },
        { expr: 'once((a, b) => a + b)(1, 2)', expect: '3', hidden: true, label: 'аргументы передаются' },
      ],
      hints: [
        'Где хранить информацию «уже вызывали»? Она должна пережить вызов.',
        'Заведите в замыкании флаг и переменную для результата.',
        'Не проверяйте `result === undefined` — результат первого вызова сам может быть `undefined`. Нужен отдельный флаг `called`.',
      ],
      explanation: 'Флаг `called` и `result` живут в замыкании между вызовами. Отдельный флаг важен: если `fn` вернула `undefined`, по результату определить «уже вызывали» нельзя.',
    },
    {
      id: 'js.closures.6',
      skill: 'js.closures',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`makeFns()` должна вернуть массив из трёх функций, возвращающих `0`, `10`, `20`. Сейчас все функции возвращают одно и то же число. Исправьте.',
      buggy: c`
        function makeFns() {
          const fns = [];
          for (var i = 0; i < 3; i++) {
            fns.push(() => i * 10);
          }
          return fns;
        }
      `,
      solution: c`
        function makeFns() {
          const fns = [];
          for (let i = 0; i < 3; i++) {
            fns.push(() => i * 10);
          }
          return fns;
        }
      `,
      tests: [
        { expr: 'makeFns().map((f) => f())', expect: '[0, 10, 20]' },
        { expr: 'makeFns().length', expect: '3' },
        { expr: 'makeFns()[1]()', expect: '10', hidden: true, label: 'вторая функция' },
        { expr: 'makeFns()[0]()', expect: '0', hidden: true, label: 'первая функция (значение 0)' },
      ],
      hints: [
        'Чему равна `i` к моменту вызова функций из массива?',
        '`var` создаёт одну переменную на всю функцию.',
        'Объявите счётчик цикла через `let`.',
      ],
      explanation: 'Все стрелки замкнули одну и ту же `var i`, которая после цикла равна 3. `let` создаёт свежую `i` на каждой итерации.',
    },
    {
      id: 'js.closures.7',
      skill: 'js.closures',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: '`total(items)` должна вернуть сумму элементов, умноженную на ставку 2, но падает с ReferenceError. Прочитайте сообщение и исправьте.',
      buggy: c`
        function total(items) {
          let sum = 0;
          for (const x of items) {
            sum += x * rate;
          }
          const rate = 2;
          return sum;
        }
      `,
      solution: c`
        function total(items) {
          const rate = 2;
          let sum = 0;
          for (const x of items) {
            sum += x * rate;
          }
          return sum;
        }
      `,
      tests: [
        { expr: 'total([1, 2, 3])', expect: '12' },
        { expr: 'total([5])', expect: '10' },
        { expr: 'total([])', expect: '0', hidden: true, label: 'пустой массив' },
        { expr: 'total([-1, 1, 4])', expect: '8', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Сообщение: «Cannot access \'rate\' before initialization». В какой момент выполняется цикл относительно строки с `const rate`?',
        'Это временная мёртвая зона: `const` нельзя читать до строки объявления.',
        'Перенесите `const rate = 2;` выше цикла.',
      ],
      explanation: 'Цикл читает `rate` раньше, чем выполнена строка `const rate = 2` — это TDZ. Для пустого массива цикл не выполняется и ошибка не проявляется — поэтому её легко пропустить.',
    },
    {
      id: 'js.closures.8',
      skill: 'js.closures',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите счётчик на замыкании: первый вызов `next()` сделан отдельно, а затем выводятся два следующих значения.',
      lines: [
        'function makeCounter() {',
        '  let count = 0;',
        '  return function () {',
        '    count += 1;',
        '    return count;',
        '  };',
        '}',
        'const next = makeCounter();',
        'next();',
        'console.log(next(), next());',
      ],
      distractors: ['  const count = 0;', '    let count = 0;'],
      tests: [{ stdout: '2 3' }],
      explanation: '`count` объявлена во внешней функции, поэтому сохраняется между вызовами. Объявление внутри возвращаемой функции сбрасывало бы счётчик при каждом вызове, а `const` нельзя увеличивать.',
    },
    {
      id: 'js.closures.9',
      skill: 'js.closures',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Объясните, что такое замыкание, и почему два счётчика, созданных одной фабрикой, не влияют друг на друга.',
      code: c`
        function makeCounter() {
          let n = 0;
          return () => ++n;
        }
      `,
      keyPoints: [
        'Замыкание — функция плюс ссылка на окружение, где она создана',
        'Переменные окружения сохраняются, пока на них ссылается функция',
        'Каждый вызов фабрики создаёт новое окружение со своей переменной',
        'Состояние снаружи недоступно — приватность',
      ],
      modelAnswer:
        'Замыкание — это функция вместе со ссылкой на лексическое окружение, в котором она была создана. Поэтому внутренняя функция продолжает видеть `n`, даже когда `makeCounter` уже завершилась. Каждый вызов `makeCounter` создаёт новое окружение со своей переменной `n`, так что функции из разных вызовов хранят независимые счётчики. Доступа к `n` снаружи нет, значит состояние приватно.',
      explanation: 'Замыкания дают приватное состояние без классов — основа модулей, мемоизации и хуков.',
    },
  ],
};
