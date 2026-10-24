import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const modulesIteration: SkillModule = {
  skill: {
    id: 'js.modules-iteration',
    route: 'javascript',
    title: 'Итераторы, генераторы, Map/Set и модули',
    icon: '🧩',
    summary: 'Протокол итерации, Symbol.iterator, генераторы, Map и Set на практике и модули ES (концептуально).',
    prereqs: ['js.objects', 'js.classes'],
    tier: 4,
    outcomes: [
      'Объясняю протокол итерации и делаю собственные классы итерируемыми через Symbol.iterator',
      'Пишу генераторы (function*, yield) и понимаю их ленивость и одноразовость',
      'Выбираю между Map/Set и объектом/массивом и применяю паттерны: счётчики, группировка, дедупликация',
      'Понимаю, как устроены модули ES (import/export), и чем модуль отличается от глобального скрипта',
    ],
    estMinutes: 40,
    lesson: {
      why: 'Итерация лежит в основе for…of, spread, деструктуризации и потоков данных. Map и Set — правильные структуры для словарей и уникальных значений, а модули позволяют разбить программу на независимые файлы.',
      brief:
        'Объект итерируем, если у него есть метод `[Symbol.iterator]()`, возвращающий итератор с `next()`. Генератор (`function*`) создаёт итератор автоматически: тело выполняется **лениво** по `next()` и приостанавливается на `yield`; обойти его можно один раз. `Map` — словарь с ключами любого типа и порядком вставки, `Set` — коллекция уникальных значений. Модуль ES — файл с `import`/`export`, выполняется один раз и имеет собственную область видимости.',
      standard: md(
        '**Протокол итерации.** Итерируемые объекты (массивы, строки, Map, Set, генераторы) можно перебирать через `for…of`, разворачивать `[...x]`, передавать в `Array.from`, `new Set`, `Promise.all`. Технически: у такого объекта есть метод `[Symbol.iterator]()`, возвращающий итератор — объект с методом `next()`, который отдаёт `{ value, done }`.',
        js`
          class Countdown {
            constructor(n) { this.n = n; }
            [Symbol.iterator]() {
              let i = this.n;
              return {
                next: () => (i > 0 ? { value: i--, done: false } : { value: undefined, done: true }),
              };
            }
          }
          console.log([...new Countdown(3)]);   // [ 3, 2, 1 ]
        `,
        '**Генераторы** делают то же короче. Функция `function*` при вызове **не выполняет тело**, а возвращает объект-генератор; тело стартует при первом `next()` и приостанавливается на каждом `yield`:',
        js`
          function* range(start, end) {
            for (let i = start; i < end; i++) yield i;
          }
          console.log([...range(1, 4)]);     // [ 1, 2, 3 ]
          const it = range(0, 1e9);          // ничего не вычислено — генератор ленивый
          console.log(it.next().value, it.next().value);   // 0 1
        `,
        'Генератор — это одноразовый итератор: после завершения повторный обход ничего не даст. Чтобы можно было обходить много раз, делайте итерируемый объект (метод `[Symbol.iterator]` создаёт новый итератор при каждом обходе — например, `*[Symbol.iterator]() { … }`). Делегирование: `yield* другойИтерируемый`.',
        '**Map** хранит пары «ключ → значение»; ключом может быть **любое** значение (число, объект), порядок — по вставке. API: `set`, `get`, `has`, `delete`, `size`, итерация `for (const [k, v] of map)`. В обычном объекте ключи превращаются в строки: `obj[1]` и `obj["1"]` — одно и то же.',
        '**Set** хранит уникальные значения (сравнение SameValueZero: `NaN` равен `NaN`, а два разных объекта — разные). Типичные паттерны:',
        js`
          const unique = [...new Set([3, 1, 3, 2, 1])];       // [ 3, 1, 2 ]
          const visits = new Map();
          for (const page of ["home", "docs", "home"]) {
            visits.set(page, (visits.get(page) ?? 0) + 1);    // счётчик
          }
          console.log(visits);   // Map(2) { 'home' => 2, 'docs' => 1 }
        `,
        '**Модули (концептуально).** Файл `.js`/`.mjs` с `import`/`export` — модуль ES. Он выполняется **один раз** при первом импорте и кэшируется; его переменные не попадают в глобальную область, а доступны только через `export`. Импорты — **живые привязки** (live bindings) к экспортированным переменным, а не копии значений. В строгом режиме по умолчанию.',
        js`
          // math.js
          export const PI = 3.14159;
          export function area(r) { return PI * r * r; }
          export default class Circle {}

          // main.js
          import Circle, { area, PI as pi } from "./math.js";
          // динамический импорт: const m = await import("./math.js");
        `,
        'В нашей учебной среде файлов-модулей нет, поэтому в заданиях вы работаете с итерацией, Map и Set; синтаксис модулей важно знать для реальных проектов (Vite, Node, браузер с `<script type="module">`).',
      ),
      deep: md(
        '**Итератор и итерируемый — разные вещи.** *Итерируемый* имеет `[Symbol.iterator]()`. *Итератор* имеет `next()`. Генератор — и то, и другое: его `[Symbol.iterator]()` возвращает его же. Поэтому генератор одноразовый, а массив — многоразовый (каждый обход получает новый итератор).',
        '**Что делает `for…of` при `break`.** Вызывает у итератора метод `return()` (если есть) — генератор корректно завершается, срабатывает его `finally`. То же при `return`/исключении внутри цикла.',
        '**Двусторонние генераторы.** `const x = yield y;` — `next(v)` передаёт значение в генератор. Это основа корутин и когда-то — `async/await` (через библиотеки вроде co).',
        '**Итерационные помощники.** Новые методы `Iterator.prototype.map/filter/take` (ES2025) работают лениво; в старых средах эквивалент пишется на генераторах, как `take` в упражнениях.',
        '**Map против объекта.** Map: любые ключи, порядок вставки гарантирован, быстрый `size`, нет унаследованных ключей (`constructor`, `__proto__`), оптимизирован под частые добавления/удаления. Объект: литералы, JSON, удобная запись `obj.key`. Для словарей с произвольными ключами — Map.',
        '**WeakMap и WeakSet** хранят объекты как «слабые» ссылки: запись исчезает, когда на объект больше нет других ссылок. Применяются для приватных данных и кэшей, привязанных к времени жизни объекта; их нельзя итерировать.',
        '**Сравнение ключей.** Map/Set используют SameValueZero: `NaN` находится, `+0` и `-0` равны, объекты сравниваются по ссылке. Копия Map — `new Map(old)`. Преобразования: `Object.fromEntries(map)`, `new Map(Object.entries(obj))`.',
        '**Модули: циклические зависимости и порядок.** Модули выполняются в порядке зависимостей (глубина-вперёд), каждый один раз. При цикле импорт может увидеть ещё не инициализированную привязку (TDZ). Статический `import` анализируется до запуска (поэтому работает tree shaking), а динамический `import()` возвращает промис и грузит код по требованию.',
        '**CommonJS против ES-модулей.** `require`/`module.exports` в Node — старая система: синхронная, значения копируются. ES-модули — стандарт языка: асинхронная загрузка, живые привязки, `import`/`export`. Смешивание требует внимания к настройкам (`"type": "module"`).',
      ),
      analogy:
        'Итератор — закладка в книге: `next()` перелистывает на следующую страницу и сообщает, закончилась ли книга. Генератор — рассказчик, который читает вслух ровно столько, сколько вы попросили, и ждёт между фразами. Map — картотека, где метки могут быть любыми, а Set — список гостей, в котором каждое имя записано один раз.',
      example: {
        lang: 'javascript',
        code: c`
          class Playlist {
            constructor(...songs) {
              this.songs = songs;
            }
            *[Symbol.iterator]() {
              yield* this.songs;
            }
          }
          function* take(iterable, n) {
            let i = 0;
            for (const x of iterable) {
              if (i++ === n) return;
              yield x;
            }
          }
          const p = new Playlist("A", "B", "C", "D");
          console.log([...take(p, 2)]);
          const visits = new Map();
          for (const page of ["home", "docs", "home", "home"]) {
            visits.set(page, (visits.get(page) ?? 0) + 1);
          }
          console.log(visits);
          console.log(new Set([3, 1, 3, 2, 1]));
          console.log(Object.fromEntries(visits));
        `,
        steps: [
          '`Playlist` итерируемый: метод-генератор `*[Symbol.iterator]()` делегирует обход массиву через `yield*`.',
          '`take` — ленивый генератор: берёт элементы из любого итерируемого и останавливается после `n`, не читая остальное.',
          '`Map` считает посещения: `get(page) ?? 0` даёт начальное значение, `set` обновляет счётчик. Порядок ключей — по первой вставке.',
          '`Set` убирает повторы, сохраняя порядок первого появления; `Object.fromEntries` превращает Map в обычный объект.',
        ],
        output: c`
          [ 'A', 'B' ]
          Map(2) { 'home' => 3, 'docs' => 1 }
          Set(3) { 3, 1, 2 }
          { home: 3, docs: 1 }
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          function* g() { yield 1; yield 2; }
          const it = g();
          console.log([...it], [...it]);   // [ 1, 2 ] [] — генератор уже исчерпан
        `,
        explain: 'Генератор — одноразовый итератор: второй обход начинается с конца. Если нужен многоразовый обход, сохраните результат в массив (`[...it]`) или оформите итерируемый объект с методом `[Symbol.iterator]`.',
      },
      pitfalls: [
        'Ожидать, что вызов генератора выполняет тело: оно стартует только при первом `next()`.',
        'Пытаться обойти исчерпанный генератор второй раз — он вернёт пустой результат.',
        'Использовать `for…of` с обычным объектом: он не итерируемый (TypeError); нужны `Object.entries/keys/values`.',
        'Рассчитывать, что `Set` уберёт «одинаковые» объекты — сравниваются ссылки, а не содержимое.',
        'Использовать объект как словарь с произвольными ключами: числа и объекты превращаются в строки, возможны конфликты с `constructor`.',
        'Считать, что `import` копирует значения и каждый импорт заново запускает модуль: модуль выполняется один раз, экспорты — живые привязки.',
      ],
      sources: [
        { title: 'MDN — Iteration protocols', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols' },
        { title: 'MDN — function* (generators)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*' },
        { title: 'MDN — Map', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' },
        { title: 'MDN — Set', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set' },
        { title: 'MDN — JavaScript modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' },
        { title: 'ECMAScript — Modules', url: 'https://tc39.es/ecma262/#sec-modules' },
      ],
    },
    misconceptions: [
      {
        id: 'map-is-object',
        title: 'Map — это тот же объект, только с другим синтаксисом',
        explanation: 'В объекте ключи превращаются в строки, а у Map ключом может быть любое значение (число, объект); у Map есть `size` и гарантированный порядок вставки.',
        fix: 'Для словарей с произвольными ключами и частыми изменениями используйте Map.',
      },
      {
        id: 'set-structural',
        title: 'Set убирает объекты с одинаковым содержимым',
        explanation: 'Set сравнивает значения по SameValueZero: объекты считаются равными только если это одна и та же ссылка.',
        fix: 'Для дедупликации по полю используйте Set (или Map) от ключа: `seen.has(item.id)`.',
      },
      {
        id: 'generator-eager',
        title: 'Вызов генератора выполняет его тело',
        explanation: 'Вызов `g()` лишь создаёт объект-генератор. Тело выполняется порциями при каждом `next()`.',
        fix: 'Запускайте обход через `for…of`, spread или `next()`.',
      },
      {
        id: 'iterator-reusable',
        title: 'Генератор можно обойти несколько раз',
        explanation: 'Генератор — итератор, и он исчерпывается. Второй обход даст пустую последовательность.',
        fix: 'Сохраните значения в массив или создавайте новый генератор для каждого обхода.',
      },
      {
        id: 'module-per-import',
        title: 'Каждый import заново выполняет модуль',
        explanation: 'Модуль выполняется один раз и кэшируется; все импортёры получают одни и те же экспортируемые привязки.',
        fix: 'Состояние, общее для приложения, можно хранить в модуле; для независимых копий экспортируйте фабрику.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.modules-iteration.1',
      skill: 'js.modules-iteration',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const s = new Set([1, 2, 2, 3, 1]);
        const m = new Map([["a", 1]]);
        m.set("b", 2).set("a", 10);
        console.log(s.size, [...s], m.get("a"), m.size);
      `,
      answer: '3 [ 1, 2, 3 ] 10 2',
      explanation: 'Set хранит уникальные значения (1, 2, 3). `m.set("a", 10)` перезаписывает существующий ключ, а не добавляет новый, поэтому в Map два элемента.',
    },
    {
      id: 'js.modules-iteration.2',
      skill: 'js.modules-iteration',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код и в каком порядке?',
      code: c`
        function* g() {
          console.log("start");
          yield 1;
        }
        const it = g();
        console.log("created");
        it.next();
      `,
      options: [
        { text: 'created, затем start', correct: true, why: 'Вызов `g()` тело не запускает; оно стартует при первом `it.next()`.' },
        { text: 'start, затем created', why: 'Так было бы, если бы вызов генератора сразу выполнял тело — но он только создаёт объект-генератор.', misconception: 'generator-eager' },
        { text: 'Только created', why: '`it.next()` запускает тело до первого `yield`, и "start" печатается.' },
        { text: 'Только start', why: '"created" печатается синхронно, сразу после создания генератора.' },
      ],
      explanation: 'Генераторы ленивы: код внутри выполняется порциями по запросу `next()` — до ближайшего `yield`.',
    },
    {
      id: 'js.modules-iteration.3',
      skill: 'js.modules-iteration',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Чем ключи Map отличаются от ключей объекта?',
      code: c`
        const key = { id: 1 };
        const m = new Map([[key, "obj"], [1, "num"], ["1", "str"]]);
        const o = {};
        o[1] = "num";
        o["1"] = "str";
        o[key] = "obj";
        console.log(m.size, m.get(1), m.get("1"), Object.keys(o));
      `,
      answer: "3 num str [ '1', '[object Object]' ]",
      explanation: 'В Map ключи `1`, `"1"` и объект различны. В объекте все ключи становятся строками: `1` и `"1"` совпадают, а объект превращается в `"[object Object]"`.',
    },
    {
      id: 'js.modules-iteration.4',
      skill: 'js.modules-iteration',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `unique(arr)`: вернуть новый массив без повторов, сохраняя порядок первого появления.',
      starter: c`
        function unique(arr) {
          // ваш код
        }
      `,
      solution: c`
        function unique(arr) {
          return [...new Set(arr)];
        }
      `,
      tests: [
        { expr: 'unique([1, 2, 2, 3, 1])', expect: '[1, 2, 3]' },
        { expr: 'unique([])', expect: '[]' },
        { expr: 'unique(["a", "b", "a"])', expect: '["a", "b"]', hidden: true, label: 'строки' },
        { expr: 'unique([NaN, NaN])', expect: '[NaN]', hidden: true, label: 'NaN считается равным самому себе' },
        { expr: 'unique([{ a: 1 }, { a: 1 }]).length', expect: '2', hidden: true, label: 'разные объекты не склеиваются' },
        { expr: 'unique([3, 1, 3, 2]).join()', expect: '"3,1,2"', hidden: true, label: 'порядок первого появления' },
      ],
      hints: [
        'Какая коллекция хранит только уникальные значения?',
        '`new Set(arr)` убирает повторы и помнит порядок.',
        'Превратите Set обратно в массив: `[...new Set(arr)]`.',
      ],
      explanation: 'Set дедуплицирует по SameValueZero (поэтому `NaN` схлопывается), а spread превращает его обратно в массив с сохранением порядка вставки.',
    },
    {
      id: 'js.modules-iteration.5',
      skill: 'js.modules-iteration',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Напишите функцию `groupBy(items, keyFn)`: вернуть `Map`, где ключ — результат `keyFn(item)`, а значение — массив элементов с этим ключом (в исходном порядке).',
      starter: c`
        function groupBy(items, keyFn) {
          // ваш код
        }
      `,
      solution: c`
        function groupBy(items, keyFn) {
          const groups = new Map();
          for (const item of items) {
            const key = keyFn(item);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
          }
          return groups;
        }
      `,
      tests: [
        { expr: 'groupBy([1, 2, 3, 4], (x) => x % 2)', expect: 'new Map([[1, [1, 3]], [0, [2, 4]]])' },
        { expr: 'groupBy([], (x) => x).size', expect: '0' },
        { expr: 'groupBy(["a", "bb", "c"], (s) => s.length)', expect: 'new Map([[1, ["a", "c"]], [2, ["bb"]]])', hidden: true, label: 'группировка строк по длине' },
        { expr: '[...groupBy([3, 1, 2], (x) => x % 2).keys()]', expect: '[1, 0]', hidden: true, label: 'порядок ключей — по первому появлению' },
        { expr: 'groupBy([0, 1], (x) => x > 0).get(false)', expect: '[0]', hidden: true, label: 'ключ false (falsy) работает' },
      ],
      hints: [
        'Для каждого элемента нужно получить ключ и положить элемент в «корзину» этого ключа.',
        'Если корзины ещё нет — создайте пустой массив: `if (!map.has(key)) map.set(key, [])`.',
        'Затем `map.get(key).push(item)`. Не проверяйте корзину через `map.get(key) || …` — это лишнее, достаточно `has`.',
      ],
      explanation: 'Map допускает любые ключи (в том числе `false` и числа), сохраняет порядок вставки и даёт явную проверку `has`, поэтому он удобнее объекта для группировки.',
    },
    {
      id: 'js.modules-iteration.6',
      skill: 'js.modules-iteration',
      kind: 'code',
      difficulty: 3,
      lang: 'javascript',
      prompt:
        'Сделайте класс `Countdown` итерируемым: `[...new Countdown(3)]` должно давать `[3, 2, 1]`. Обход должен быть возможен многократно.',
      starter: c`
        class Countdown {
          constructor(n) {
            this.n = n;
          }
          // ваш код
        }
      `,
      solution: c`
        class Countdown {
          constructor(n) {
            this.n = n;
          }
          *[Symbol.iterator]() {
            for (let i = this.n; i > 0; i--) yield i;
          }
        }
      `,
      tests: [
        { expr: '[...new Countdown(3)]', expect: '[3, 2, 1]' },
        { expr: '[...new Countdown(0)]', expect: '[]' },
        { expr: '(() => { const c = new Countdown(2); return [[...c], [...c]]; })()', expect: '[[2, 1], [2, 1]]', hidden: true, label: 'повторный обход того же объекта' },
        { expr: '(() => { let s = 0; for (const x of new Countdown(4)) s += x; return s; })()', expect: '10', hidden: true, label: 'работает в for…of' },
      ],
      hints: [
        'Какой метод должен быть у объекта, чтобы по нему можно было итерировать?',
        'Метод с именем `[Symbol.iterator]`; удобнее всего сделать его генератором (`*[Symbol.iterator]() { … }`).',
        'Внутри: `for (let i = this.n; i > 0; i--) yield i;` — каждый обход создаёт новый генератор.',
      ],
      explanation: 'Метод-генератор `*[Symbol.iterator]()` при каждом обходе возвращает новый итератор, поэтому объект можно обходить сколько угодно раз — в отличие от одного генератора.',
    },
    {
      id: 'js.modules-iteration.7',
      skill: 'js.modules-iteration',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'edge',
      prompt:
        '`stats(iterable)` должна вернуть `{ sum, count }` для любого итерируемого объекта, в том числе генератора. Для генератора `count` почему-то равен 0. Исправьте.',
      buggy: c`
        function* range(a, b) {
          for (let i = a; i < b; i++) yield i;
        }
        function stats(iterable) {
          let sum = 0;
          let count = 0;
          for (const x of iterable) sum += x;
          for (const x of iterable) count++;
          return { sum, count };
        }
      `,
      solution: c`
        function* range(a, b) {
          for (let i = a; i < b; i++) yield i;
        }
        function stats(iterable) {
          const items = [...iterable];
          let sum = 0;
          let count = 0;
          for (const x of items) sum += x;
          for (const x of items) count++;
          return { sum, count };
        }
      `,
      tests: [
        { expr: 'stats([1, 2])', expect: '({ sum: 3, count: 2 })' },
        { expr: 'stats(range(1, 4))', expect: '({ sum: 6, count: 3 })' },
        { expr: 'stats(new Set([1, 1, 2]))', expect: '({ sum: 3, count: 2 })', hidden: true, label: 'Set' },
        { expr: 'stats(range(0, 0))', expect: '({ sum: 0, count: 0 })', hidden: true, label: 'пустой генератор' },
      ],
      hints: [
        'Что происходит с генератором после первого полного обхода?',
        'Генератор одноразовый: второй `for…of` стартует с конца и не получает элементов.',
        'Скопируйте значения в массив один раз: `const items = [...iterable];` и обходите массив.',
      ],
      explanation: 'Массив и Set можно обходить многократно, а генератор — только один раз. Преобразование в массив делает код независимым от того, одноразовый итератор пришёл или нет.',
    },
    {
      id: 'js.modules-iteration.8',
      skill: 'js.modules-iteration',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt:
        '`uniqueUsers(users)` должна убрать пользователей с повторяющимся `id`, оставив первого. Сейчас повторы остаются. Исправьте.',
      buggy: c`
        function uniqueUsers(users) {
          return [...new Set(users)];
        }
      `,
      solution: c`
        function uniqueUsers(users) {
          const seen = new Set();
          const result = [];
          for (const u of users) {
            if (!seen.has(u.id)) {
              seen.add(u.id);
              result.push(u);
            }
          }
          return result;
        }
      `,
      tests: [
        { expr: 'uniqueUsers([{ id: 1, n: "a" }, { id: 2, n: "b" }, { id: 1, n: "c" }])', expect: '[{ id: 1, n: "a" }, { id: 2, n: "b" }]' },
        { expr: 'uniqueUsers([])', expect: '[]' },
        { expr: 'uniqueUsers([{ id: 1 }, { id: 1 }, { id: 1 }]).length', expect: '1', hidden: true, label: 'все с одним id' },
        { expr: 'uniqueUsers([{ id: 0, n: "x" }, { id: 0, n: "y" }])', expect: '[{ id: 0, n: "x" }]', hidden: true, label: 'id равен 0 (falsy)' },
      ],
      hints: [
        'Как Set сравнивает объекты — по содержимому или по ссылке?',
        'Объекты с одинаковым `id`, но разные по ссылке, Set считает разными. Дедуплицировать нужно по ключу `id`.',
        'Заведите `Set` из уже встреченных `id` и добавляйте пользователя в результат только при первой встрече.',
      ],
      explanation: 'Set сравнивает объекты по ссылке, поэтому `new Set(users)` ничего не убирает. Для дедупликации по полю храним в Set не объекты, а значения ключа.',
    },
    {
      id: 'js.modules-iteration.9',
      skill: 'js.modules-iteration',
      kind: 'parsons',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Соберите ленивый конвейер: бесконечный генератор натуральных чисел и `take`, который берёт первые `k` элементов.',
      lines: [
        'function* naturals() {',
        '  let n = 1;',
        '  while (true) yield n++;',
        '}',
        'function* take(it, k) {',
        '  let i = 0;',
        '  for (const x of it) {',
        '    if (i++ >= k) return;',
        '    yield x;',
        '  }',
        '}',
        'console.log([...take(naturals(), 3)]);',
      ],
      distractors: ['console.log(take(naturals(), 3));', '  while (true) return n++;'],
      tests: [{ stdout: '[ 1, 2, 3 ]' }],
      explanation: 'Генераторы ленивы: `naturals` бесконечен, но `take` запрашивает только нужные элементы и завершается через `return`. Без spread `[...]` в `console.log` попал бы объект-генератор, а не значения.',
    },
    {
      id: 'js.modules-iteration.10',
      skill: 'js.modules-iteration',
      kind: 'mcq',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Два разных файла проекта делают `import { counter } from "./state.js"`. Модуль `state.js` при загрузке печатает "loaded". Сколько раз он напечатает и что получат файлы?',
      options: [
        { text: 'Один раз; оба файла получают привязки к одним и тем же экспортам', correct: true, why: 'Модуль ES выполняется один раз и кэшируется; все импортёры используют общие экспорты.' },
        { text: 'Два раза — каждый import заново выполняет модуль и даёт свою копию', why: 'Это поведение «include» в некоторых языках; в ES-модулях модуль выполняется один раз.', misconception: 'module-per-import' },
        { text: 'Один раз, но каждый файл получит копию значения на момент импорта', why: 'Импорты — живые привязки: если модуль изменит экспортируемую переменную, импортёры увидят новое значение.' },
        { text: 'Зависит от порядка файлов в папке', why: 'Порядок определяется графом зависимостей, а не расположением файлов; количество выполнений — всегда один.' },
      ],
      explanation: 'Модули ES кэшируются по адресу: выполняются один раз, их область видимости изолирована, а экспорты — общие живые привязки.',
    },
    {
      id: 'js.modules-iteration.11',
      skill: 'js.modules-iteration',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Когда вы выберете `Map` вместо обычного объекта и `Set` вместо массива? Что означает «итерируемый объект»?',
      keyPoints: [
        'Map — произвольные ключи (не только строки), порядок вставки, size, нет унаследованных ключей',
        'Set — уникальные значения, быстрая проверка has и дедупликация',
        'Итерируемый объект имеет метод [Symbol.iterator], возвращающий итератор с next()',
        'for…of, spread и деструктуризация работают с любыми итерируемыми объектами',
      ],
      modelAnswer:
        'Map я выберу, когда ключи — не только строки, когда важен порядок вставки и размер или когда ключи могут совпасть с унаследованными свойствами объекта (`constructor`). Set — когда нужна коллекция уникальных значений и быстрая проверка наличия или дедупликация массива. Итерируемый объект — тот, у которого есть метод `[Symbol.iterator]()`, возвращающий итератор с методом `next()`, выдающим `{ value, done }`. Благодаря этому протоколу `for…of`, spread и деструктуризация одинаково работают для массивов, строк, Map, Set и генераторов.',
      explanation: 'Правильный выбор структуры данных упрощает код и убирает целые классы ошибок: произвольные ключи, дубликаты, порядок.',
    },
  ],
};
