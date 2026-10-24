import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const asyncSkill: SkillModule = {
  skill: {
    id: 'js.async',
    route: 'javascript',
    title: 'Асинхронность: event loop, Promise, async/await',
    icon: '⏳',
    summary: 'Цикл событий, порядок setTimeout и микрозадач, Promise, async/await, Promise.all и обработка ошибок.',
    prereqs: ['js.errors', 'js.closures'],
    tier: 4,
    outcomes: [
      'Объясняю, как работает event loop, и предсказываю порядок вывода синхронного кода, микрозадач и таймеров',
      'Создаю и комбинирую промисы: then/catch/finally, Promise.all, Promise.race, Promise.allSettled',
      'Пишу async/await и знаю, что async-функция всегда возвращает промис',
      'Различаю последовательное и параллельное выполнение и не использую await внутри forEach',
      'Корректно обрабатываю ошибки в асинхронном коде (try/catch + await, .catch)',
    ],
    estMinutes: 45,
    interview: true,
    lesson: {
      why: 'Сеть, таймеры, файлы и события — всё асинхронно. Без понимания event loop и промисов код получается «случайно работающим», а баги порядка — самые трудные.',
      brief:
        'JavaScript однопоточный: синхронный код → микрозадачи (`then`, `await`) → следующая макрозадача (таймер). `setTimeout(f, 0)` — не «сразу», а «после текущего кода и микрозадач». `async`-функция всегда возвращает `Promise`; `await` приостанавливает **функцию**, а не поток. `Promise.all` запускает параллельно и отклоняется при первой ошибке. `forEach(async …)` никого не ждёт.',
      standard: md(
        '**Event loop.** Код выполняется в одном потоке. Движок берёт задачу, выполняет её до конца, затем **все микрозадачи** (колбэки промисов, продолжения после `await`), и только потом следующую макрозадачу (таймер, событие). Поэтому:',
        js`
          console.log("1");
          setTimeout(() => console.log("таймер"), 0);
          Promise.resolve().then(() => console.log("микрозадача"));
          console.log("2");
          // 1, 2, микрозадача, таймер
        `,
        '**Промис** — объект, представляющий будущий результат; состояния: *pending* → *fulfilled* (значение) или *rejected* (ошибка). Потребитель подписывается через `.then(onOk)`, `.catch(onErr)`, `.finally(fn)`; колбэки всегда вызываются **асинхронно** (как микрозадачи) и каждый `then` возвращает новый промис — отсюда цепочки.',
        js`
          const sleep = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
          sleep(10, "готово").then((v) => console.log(v));
        `,
        '**async/await** — удобная запись поверх промисов. `async`-функция всегда возвращает промис (возвращаемое значение «заворачивается», исключение превращается в отклонение), а `await p` приостанавливает *функцию* до завершения `p`, не блокируя остальной код:',
        js`
          // sleep — из предыдущего примера
          async function load() {
            await sleep(10);
            return 42;
          }
          console.log(typeof load(), load() instanceof Promise);   // object true
        `,
        '**Параллельно или по очереди.** Два `await` подряд выполняются **последовательно**. Для параллельности запускайте промисы сразу и ждите вместе:',
        js`
          // sleep — из примера выше; await на верхнем уровне допустим в нашей среде и в ES-модулях
          const [a, b] = await Promise.all([sleep(20, "A"), sleep(5, "B")]);   // ~20 мс, а не ~25
          console.log(a, b);   // A B — порядок результатов как у входа
        `,
        '`Promise.all` отклоняется при первой же ошибке; `Promise.allSettled` ждёт всех и возвращает статус каждого; `Promise.race` — первый завершившийся (удобно для таймаута); `Promise.any` — первый успешный.',
        '**Обработка ошибок.** Внутри `async`-функции используйте `try/catch` вокруг `await`; у цепочки — `.catch()`. Нельзя забывать `await`: `try { return failingPromise(); }` не поймает отклонение, потому что `return` отдаёт промис «наружу» — нужно `return await failingPromise()`.',
        '**Ловушка `forEach`.** `arr.forEach(async x => { await … })` запускает все задачи и **не ждёт** их: внешняя функция завершится раньше. Для последовательности — `for (const x of arr) { await … }`, для параллели — `await Promise.all(arr.map(async x => …))`.',
      ),
      deep: md(
        '**Очереди.** Есть очередь макрозадач (таймеры, ввод-вывод, события UI) и очередь микрозадач (промисы, `queueMicrotask`, `MutationObserver`). После каждой макрозадачи очередь микрозадач опустошается полностью — в том числе микрозадачи, добавленные по ходу. Бесконечная цепочка микрозадач может «заморозить» страницу, так как таймеры и отрисовка не получат управления.',
        '**`setTimeout(f, 0)`** не гарантирует точной задержки: браузеры ограничивают вложенные таймеры (≥ 4 мс при глубокой вложенности), фоновые вкладки — ещё сильнее. Порядок таймеров с одинаковой задержкой сохраняется, но таймер с меньшей задержкой, поставленный позже, сработает раньше.',
        '**`await` под капотом.** `await x` эквивалентно `Promise.resolve(x).then(продолжение)`: функция «замораживается» (её локальные переменные сохраняются в замыкании-состоянии), управление возвращается вызывающему. Поэтому после `await` код выполняется в микрозадаче, а не сразу.',
        '**Необработанные отклонения.** Если у отклонённого промиса нет обработчика, среда сообщает об `unhandledrejection` (браузер) / завершает процесс (Node ≥ 15). Всегда либо `await` внутри `try`, либо `.catch`.',
        '**Отмена.** У промисов нет встроенной отмены; для `fetch` и других API используют `AbortController`/`AbortSignal`. Таймаут через `Promise.race` не останавливает саму операцию — он лишь перестаёт её ждать.',
        '**Конкурентность и ограничение параллелизма.** `Promise.all(arr.map(fetchOne))` для тысяч элементов запустит все запросы сразу — нужен пул (ограниченная очередь). Порядок завершения задач произвольный; результаты `Promise.all` — в порядке входа.',
        '**Top-level await** доступен в ES-модулях: `const data = await load();` на верхнем уровне. В нашей среде код выполняется внутри async-функции, поэтому `await` на верхнем уровне работает.',
        '**Генераторы и async-итераторы.** `for await (const x of stream)` потребляет асинхронные последовательности (потоки данных, постраничные API).',
      ),
      analogy:
        'Event loop — официант в кафе: он берёт заказ (запускает операцию), не стоит у плиты, а идёт обслуживать других; когда повар готов (операция завершена), официант разносит блюдо. Микрозадачи — срочные поручения «прямо сейчас, пока не ушёл от стола».',
      example: {
        lang: 'javascript',
        code: c`
          const sleep = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
          async function load(name, ms) {
            console.log("старт", name);
            await sleep(ms);
            console.log("готово", name);
            return name.toUpperCase();
          }
          async function main() {
            console.log("1");
            setTimeout(() => console.log("таймер"), 0);
            Promise.resolve().then(() => console.log("микрозадача"));
            const results = await Promise.all([load("a", 20), load("b", 5)]);
            console.log(results);
            try {
              await Promise.reject(new Error("сбой"));
            } catch (e) {
              console.log("поймано:", e.message);
            }
          }
          await main();
          console.log("конец");
        `,
        steps: [
          'Синхронная часть: "1"; затем `setTimeout` и `then` лишь регистрируют работу; обе `load` синхронно печатают "старт" и останавливаются на `await sleep`.',
          'Когда синхронный код закончился, выполняются микрозадачи ("микрозадача"), и только потом — таймер с нулевой задержкой ("таймер").',
          '`Promise.all` запустил обе загрузки параллельно: "b" (5 мс) завершается раньше "a" (20 мс), но результаты в массиве — в порядке входа: `[ \'A\', \'B\' ]`.',
          '`await` отклонённого промиса бросает исключение, которое ловит обычный `try/catch`.',
          '`await main()` дожидается всей цепочки, поэтому "конец" печатается последним.',
        ],
        output: c`
          1
          старт a
          старт b
          микрозадача
          таймер
          готово b
          готово a
          [ 'A', 'B' ]
          поймано: сбой
          конец
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          async function loadAll(ids) {
            const results = [];
            ids.forEach(async (id) => {
              results.push(await sleep(5, id * 2));
            });
            return results;   // [] — forEach не дождался
          }
        `,
        explain: '`forEach` игнорирует возвращаемые промисы: функция вернёт пустой массив, а данные появятся позже. Нужен `for…of` с `await` или `Promise.all(ids.map(…))`.',
      },
      pitfalls: [
        'Считать `setTimeout(f, 0)` немедленным вызовом: он выполнится после синхронного кода и всех микрозадач.',
        'Забыть `await` — вместо значения получите промис (например, `a + b` даст строку "[object Promise]…").',
        'Использовать `await` внутри `forEach`/`map` без `Promise.all` — внешний код не ждёт.',
        'Писать `return promise` внутри `try` без `await` — `catch` отклонение не поймает.',
        'Выполнять независимые операции последовательными `await`, теряя параллелизм.',
        'Оставлять отклонённые промисы без обработчика — это `unhandled rejection`.',
      ],
      sources: [
        { title: 'MDN — Using promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises' },
        { title: 'MDN — async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' },
        { title: 'MDN — The event loop', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop' },
        { title: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
        { title: 'ECMAScript — Promise objects', url: 'https://tc39.es/ecma262/#sec-promise-objects' },
      ],
    },
    misconceptions: [
      {
        id: 'timeout-zero-immediate',
        title: 'setTimeout(f, 0) выполняется сразу',
        explanation: 'Колбэк ставится в очередь макрозадач и выполнится после текущего синхронного кода и всех микрозадач.',
        fix: 'Если нужно «сразу после текущего кода, но раньше таймеров» — используйте промис или `queueMicrotask`.',
      },
      {
        id: 'async-returns-raw',
        title: 'async-функция возвращает обычное значение',
        explanation: 'Любая `async`-функция возвращает `Promise`; значение из `return` оборачивается в него.',
        fix: 'Получайте результат через `await` или `.then`.',
      },
      {
        id: 'await-blocks-thread',
        title: 'await блокирует весь поток',
        explanation: '`await` приостанавливает только текущую async-функцию; остальной код (и другие задачи) продолжают работать.',
        fix: 'Не бойтесь `await`, но запускайте независимые операции параллельно через `Promise.all`.',
      },
      {
        id: 'foreach-await',
        title: 'await внутри forEach заставляет цикл ждать',
        explanation: '`forEach` не ждёт промисы, возвращаемые колбэком, поэтому внешний код идёт дальше сразу.',
        fix: 'Используйте `for…of` с `await` (последовательно) или `Promise.all(arr.map(…))` (параллельно).',
      },
      {
        id: 'then-is-sync',
        title: 'Колбэк then вызывается синхронно, если промис уже готов',
        explanation: 'Колбэки `then` всегда выполняются асинхронно — как микрозадачи, после текущего синхронного кода.',
        fix: 'Планируйте логику с учётом того, что `then`/`await` никогда не выполняются немедленно.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.async.1',
      skill: 'js.async',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа? Порядок: синхронный код, микрозадачи, таймеры.',
      code: c`
        console.log("1");
        setTimeout(() => console.log("timeout"), 0);
        Promise.resolve().then(() => console.log("microtask"));
        console.log("2");
      `,
      answer: c`
        1
        2
        microtask
        timeout
      `,
      explanation: 'Сначала выполняется весь синхронный код ("1", "2"). Затем — микрозадачи (колбэк промиса), и лишь после них — таймер, даже с нулевой задержкой.',
    },
    {
      id: 'js.async.2',
      skill: 'js.async',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        async function f() {
          return 5;
        }
        const r = f();
        console.log(typeof r, r instanceof Promise);
      `,
      options: [
        { text: 'object true', correct: true, why: '`async`-функция всегда возвращает промис, а `typeof` промиса — "object".' },
        { text: 'number false', why: 'Значение 5 заворачивается в промис; число напрямую получить нельзя — нужен `await` или `then`.', misconception: 'async-returns-raw' },
        { text: 'undefined false', why: 'Функция возвращает значение, пусть и обёрнутое в промис.' },
        { text: 'function true', why: '`typeof` промиса — "object", не "function".' },
      ],
      explanation: 'Результат `async`-функции — всегда `Promise`. Значение доступно через `await` или `.then`.',
    },
    {
      id: 'js.async.3',
      skill: 'js.async',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Что происходит на `await`?',
      code: c`
        async function main() {
          console.log("A");
          await null;
          console.log("C");
        }
        main();
        console.log("B");
      `,
      answer: c`
        A
        B
        C
      `,
      explanation: 'Функция выполняется синхронно до первого `await` ("A"), затем приостанавливается и возвращает управление вызвавшему коду ("B"). Продолжение ("C") выполняется позже, как микрозадача.',
    },
    {
      id: 'js.async.4',
      skill: 'js.async',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `delay(ms, value)`, возвращающую промис, который через `ms` миллисекунд выполняется со значением `value`.',
      starter: c`
        function delay(ms, value) {
          // ваш код
        }
      `,
      solution: c`
        function delay(ms, value) {
          return new Promise((resolve) => setTimeout(() => resolve(value), ms));
        }
      `,
      tests: [
        { expr: 'delay(5, "x")', expect: '"x"' },
        { expr: 'delay(1, [1, 2])', expect: '[1, 2]' },
        { expr: 'delay(0, 42)', expect: '42', hidden: true, label: 'нулевая задержка' },
        { expr: 'typeof delay(1).then', expect: '"function"', hidden: true, label: 'возвращает промис (есть then)' },
        { expr: 'delay(1)', expect: 'undefined', hidden: true, label: 'без значения — undefined' },
      ],
      hints: [
        'Что нужно вернуть из функции, чтобы потребитель мог сделать `await delay(…)`?',
        'Создайте `new Promise((resolve) => …)` и вызовите `resolve` по таймеру.',
        '`setTimeout(() => resolve(value), ms)` внутри исполнителя промиса.',
      ],
      explanation: 'Конструктор `Promise` принимает исполнитель, в котором мы сами решаем, когда вызвать `resolve`. Так обычные колбэки (таймеры) оборачивают в промисы.',
    },
    {
      id: 'js.async.5',
      skill: 'js.async',
      kind: 'code',
      difficulty: 3,
      lang: 'javascript',
      prompt:
        'Напишите `async`-функцию `sequential(tasks)`: `tasks` — массив функций, каждая возвращает промис. Запускайте их **строго по очереди** (следующая стартует после завершения предыдущей) и верните массив результатов.',
      starter: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function sequential(tasks) {
          // ваш код
        }
      `,
      solution: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function sequential(tasks) {
          const results = [];
          for (const task of tasks) {
            results.push(await task());
          }
          return results;
        }
      `,
      tests: [
        { expr: 'sequential([() => delay(3, "a"), () => delay(1, "b")])', expect: '["a", "b"]' },
        { expr: 'sequential([])', expect: '[]' },
        {
          expr: '(async () => { const log = []; const mk = (name, ms) => () => delay(ms).then(() => { log.push(name); return name; }); const res = await sequential([mk("a", 15), mk("b", 1)]); return [res, log]; })()',
          expect: '[["a", "b"], ["a", "b"]]',
          hidden: true,
          label: 'порядок выполнения: b не стартует до завершения a',
        },
        { expr: 'sequential([() => delay(1, 0), () => delay(1, 0)])', expect: '[0, 0]', hidden: true, label: 'нулевые результаты сохраняются' },
      ],
      hints: [
        'Если вызвать все задачи сразу, они будут выполняться параллельно. Как запускать по одной?',
        'Цикл `for…of` внутри `async`-функции с `await` ждёт каждую итерацию.',
        'В цикле: `results.push(await task());`.',
      ],
      explanation: '`await` внутри `for…of` приостанавливает цикл до завершения очередной задачи — получается последовательное выполнение. `Promise.all(tasks.map(t => t()))` запустил бы всё сразу.',
    },
    {
      id: 'js.async.6',
      skill: 'js.async',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`sumLater(x, y)` должна вернуть (через промис) сумму `x + y`, полученную с задержкой. Но возвращается странная строка. Найдите пропущенное слово.',
      buggy: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function sumLater(x, y) {
          const a = delay(5, x);
          const b = delay(5, y);
          return a + b;
        }
      `,
      solution: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function sumLater(x, y) {
          const a = delay(5, x);
          const b = delay(5, y);
          return (await a) + (await b);
        }
      `,
      tests: [
        { expr: 'sumLater(1, 2)', expect: '3' },
        { expr: 'sumLater(-1, 1)', expect: '0' },
        { expr: 'sumLater(0, 0)', expect: '0', hidden: true, label: 'нули' },
        { expr: 'sumLater(10, 5.5)', expect: '15.5', hidden: true, label: 'дробное число' },
      ],
      hints: [
        'Что лежит в `a` и `b` сразу после вызова `delay` — число или что-то другое?',
        '`delay` возвращает промис. Чтобы получить значение, нужно подождать.',
        'Перед использованием поставьте `await`: `(await a) + (await b)`.',
      ],
      explanation: 'Без `await` складываются сами промисы (получается строка "[object Promise][object Promise]"). Заметьте: оба `delay` стартуют сразу, поэтому ожидание идёт параллельно.',
    },
    {
      id: 'js.async.7',
      skill: 'js.async',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`loadAll(ids)` должна вернуть массив удвоенных значений, дождавшись всех задач. Сейчас возвращается пустой массив. Исправьте.',
      buggy: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function loadAll(ids) {
          const results = [];
          ids.forEach(async (id) => {
            results.push(await delay(5, id * 2));
          });
          return results;
        }
      `,
      solution: c`
        const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
        async function loadAll(ids) {
          const results = [];
          for (const id of ids) {
            results.push(await delay(5, id * 2));
          }
          return results;
        }
      `,
      tests: [
        { expr: 'loadAll([1, 2, 3])', expect: '[2, 4, 6]' },
        { expr: 'loadAll([])', expect: '[]' },
        { expr: 'loadAll([5])', expect: '[10]', hidden: true, label: 'один элемент' },
        { expr: 'loadAll([0, -1])', expect: '[0, -2]', hidden: true, label: 'ноль и отрицательное число' },
      ],
      hints: [
        'Когда выполняется `return results` относительно колбэков `forEach`?',
        '`forEach` не дожидается промисов из асинхронного колбэка.',
        'Замените `forEach` на `for…of` с `await` (или используйте `Promise.all` и `map`).',
      ],
      explanation: '`forEach` запустил асинхронные колбэки и сразу вернул управление, поэтому `return results` выполнился с пустым массивом. `for…of` с `await` (или `Promise.all(map)`) действительно ждёт.',
    },
    {
      id: 'js.async.8',
      skill: 'js.async',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: '`safeLoad(fn)` должна вернуть результат `await fn()`, а при ошибке — строку `"fallback"`. Но отклонение промиса `catch` не ловит. Исправьте.',
      buggy: c`
        async function safeLoad(fn) {
          try {
            return fn();
          } catch (e) {
            return "fallback";
          }
        }
      `,
      solution: c`
        async function safeLoad(fn) {
          try {
            return await fn();
          } catch (e) {
            return "fallback";
          }
        }
      `,
      tests: [
        { expr: 'safeLoad(() => Promise.resolve(5))', expect: '5' },
        { expr: 'safeLoad(() => Promise.reject(new Error("x")))', expect: '"fallback"' },
        { expr: 'safeLoad(() => { throw new Error("sync"); })', expect: '"fallback"', hidden: true, label: 'синхронное исключение' },
        { expr: 'safeLoad(async () => { throw new Error("async"); })', expect: '"fallback"', hidden: true, label: 'async-функция бросает' },
      ],
      hints: [
        'Что делает `return fn()` внутри `try`, если `fn()` возвращает промис?',
        'Функция возвращает сам промис наружу, и его отклонение происходит уже после выхода из `try`.',
        'Напишите `return await fn();`.',
      ],
      explanation: 'Без `await` промис уходит из `try` не дождавшись результата, и `catch` не видит отклонение. `return await` оставляет ожидание внутри `try`.',
    },
    {
      id: 'js.async.9',
      skill: 'js.async',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу: две задержки запускаются параллельно через `Promise.all`, затем выводится объединённый результат.',
      lines: [
        'const sleep = (ms, v) => new Promise((resolve) => setTimeout(() => resolve(v), ms));',
        'async function main() {',
        '  const [a, b] = await Promise.all([sleep(10, "A"), sleep(5, "B")]);',
        '  console.log(a + b);',
        '}',
        'main();',
      ],
      distractors: ['function main() {', '  const [a, b] = Promise.all([sleep(10, "A"), sleep(5, "B")]);'],
      tests: [{ stdout: 'AB' }],
      explanation: '`await` допустим только внутри `async`-функции, а `Promise.all` без `await` вернул бы промис вместо массива. Порядок результатов совпадает с порядком входного массива, а не с порядком завершения.',
    },
    {
      id: 'js.async.10',
      skill: 'js.async',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Объясните, почему в первом примере "microtask" печатается раньше "timeout", хотя задержка таймера нулевая. Что такое event loop?',
      code: c`
        setTimeout(() => console.log("timeout"), 0);
        Promise.resolve().then(() => console.log("microtask"));
      `,
      keyPoints: [
        'JavaScript выполняет код в одном потоке; event loop берёт задачи из очередей',
        'После каждой макрозадачи (и синхронного кода) выполняются все микрозадачи',
        'Колбэки промисов и продолжения после await — микрозадачи; таймеры — макрозадачи',
        'Нулевая задержка не означает немедленный запуск',
      ],
      modelAnswer:
        'JavaScript выполняет код в одном потоке, а event loop по очереди берёт задачи. Сначала выполняется текущий синхронный код, затем опустошается очередь микрозадач — в неё попадают колбэки промисов и продолжения после `await`, — и только после этого берётся следующая макрозадача, например таймер. `setTimeout(f, 0)` ставит колбэк в очередь макрозадач, а `Promise.resolve().then(…)` — в очередь микрозадач, поэтому "microtask" выводится раньше "timeout".',
      explanation: 'Порядок «синхронный код → микрозадачи → макрозадачи» объясняет большинство вопросов об очерёдности в асинхронном коде.',
    },
  ],
};
