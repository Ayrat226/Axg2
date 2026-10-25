import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const arrays: SkillModule = {
  skill: {
    id: 'js.arrays',
    route: 'javascript',
    title: 'Массивы и их методы',
    icon: '📚',
    summary: 'push/pop/slice/splice, map/filter/reduce/find/some/every, подводные камни sort и разница между мутацией и копией.',
    prereqs: ['js.loops'],
    tier: 2,
    outcomes: [
      'Добавляю, удаляю и вырезаю элементы, различая методы, которые меняют массив, и методы, которые возвращают копию',
      'Преобразую данные цепочками map/filter/reduce вместо ручных циклов',
      'Ищу элементы через find/findIndex/some/every/includes и помню про falsy-ловушку find',
      'Сортирую числа и строки правильно: с компаратором и без мутации исходных данных',
      'Знаю, что присваивание массива копирует ссылку, и копирую явно ([...arr], slice)',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Массив — главная коллекция JavaScript: списки товаров, ответы сервера, строки таблицы. Методы map/filter/reduce — основа выразительного кода.',
      brief:
        '`push/pop` — конец, `unshift/shift` — начало, `slice` — копия части, `splice` — вырезать/вставить **на месте**. `map` преобразует, `filter` отбирает, `reduce` сворачивает, `find`/`some`/`every` ищут. `sort()` без компаратора сортирует **как строки** и меняет массив на месте. `b = a` не копирует массив — только ссылку.',
      standard: md(
        '**Создание и доступ.** `[1, 2, 3]`, `arr[0]`, `arr.at(-1)`, `arr.length`. Массивы изменяемы и могут содержать значения разных типов.',
        '**Методы, меняющие массив на месте (мутирующие):** `push`/`pop` (конец), `unshift`/`shift` (начало), `splice`, `sort`, `reverse`, `fill`. **Возвращающие новый массив:** `slice`, `map`, `filter`, `concat`, `flat`, spread `[...a]`, а также ES2023 `toSorted`, `toReversed`, `toSpliced`, `with`.',
        js`
          const a = [1, 2, 3, 4, 5];
          console.log(a.slice(1, 3));    // [ 2, 3 ]      — копия, a не меняется
          console.log(a.splice(1, 2));   // [ 2, 3 ]      — вырезал из a
          console.log(a);                // [ 1, 4, 5 ]
        `,
        '**Функции-обратные вызовы** передают поведение методу. Запись `x => x * 2` — стрелочная функция (подробнее в теме «Функции»): «вход → результат».',
        js`
          const nums = [1, 2, 3, 4];
          console.log(nums.map((x) => x * 2));           // [ 2, 4, 6, 8 ]
          console.log(nums.filter((x) => x % 2 === 0));  // [ 2, 4 ]
          console.log(nums.reduce((sum, x) => sum + x, 0));   // 10
        `,
        '- `map` — тот же размер, каждый элемент преобразован.\n- `filter` — только те элементы, для которых функция вернула truthy.\n- `reduce(f, начальное)` — сворачивает массив в одно значение; **всегда передавайте начальное значение**, иначе на пустом массиве будет `TypeError`.\n- `find` — первый подходящий элемент (или `undefined`), `findIndex` — его индекс (или -1).\n- `some` — есть ли хоть один подходящий; `every` — все ли подходят; `includes(x)` — есть ли значение.',
        '**Сортировка.** `sort()` без аргументов сравнивает элементы **как строки**: `[10, 9, 1].sort()` → `[ 1, 10, 9 ]`. Для чисел нужен компаратор: `arr.sort((a, b) => a - b)`. Метод **меняет исходный массив**; чтобы сохранить его, сортируйте копию: `[...arr].sort(...)` или `arr.toSorted(...)`.',
        '**Ссылочная природа.** `const b = a` — обе переменные указывают на один массив: `b.push(4)` виден и через `a`. Копия создаётся явно: `[...a]` или `a.slice()`. Копия **поверхностная**: вложенные объекты остаются общими.',
      ),
      deep: md(
        '**Разреженные массивы.** `new Array(3)` создаёт «дыры» (`<3 empty items>`): `map` и `forEach` их пропускают. Создавайте массив заполненным: `Array.from({ length: 3 }, (_, i) => i)` или `new Array(3).fill(0)`.',
        '**`length` записываема.** `arr.length = 0` очищает массив на месте; присваивание индекса за границей (`arr[10] = 1`) создаёт дыры. Отрицательные индексы `arr[-1]` — это обычное свойство, а не последний элемент; для хвоста используйте `at(-1)`.',
        '**Сортировка стабильна** (с ES2019): элементы с равными ключами сохраняют исходный порядок. Компаратор должен быть согласованным: `(a, b) => a > b` (возвращает boolean) — классическая ошибка; результат должен быть отрицательным, нулевым или положительным.',
        '**`reduce` — универсальный инструмент**, но часто менее читаем, чем цепочка `map`/`filter`. Он выражает «накопление» — суммы, группировки, построение объектов.',
        '**`forEach` не возвращает значения и не умеет `break`**. Для раннего выхода используйте `for…of`, `some` или `find`.',
        '**Равенство.** `includes` использует SameValueZero (находит `NaN`), а `indexOf` — `===` (не находит `NaN`). Для объектов сравниваются ссылки: `[{a: 1}].includes({a: 1})` — `false`.',
        '**Поверхностное копирование и вложенность.** `structuredClone(arr)` делает глубокую копию для данных (без функций). Spread и `slice` копируют только первый уровень.',
        '**Производительность.** `shift`/`unshift` сдвигают все элементы (O(n)), `pop` и (амортизированно) `push` дёшевы — O(1). Для очередей на больших данных используют индекс-«голову» или другие структуры.',
      ),
      analogy:
        'Массив — это конвейерная лента с пронумерованными ячейками. `map/filter/reduce` — станции на ленте: одна красит детали, другая отбраковывает, третья упаковывает всё в одну коробку. А `b = a` — не копия ленты, а второй ярлык на ту же ленту.',
      example: {
        lang: 'javascript',
        code: c`
          const prices = [120, 80, 45, 300];
          const cheap = prices.filter((p) => p < 100);
          const withTax = prices.map((p) => Math.round(p * 1.2));
          const total = prices.reduce((sum, p) => sum + p, 0);
          console.log(cheap, withTax, total);
          console.log(prices.find((p) => p > 100), prices.some((p) => p > 200), prices.every((p) => p > 50));
          const sorted = [...prices].sort((a, b) => a - b);
          console.log(sorted, prices);
        `,
        steps: [
          '`filter` оставил цены меньше 100; `map` создал новый массив с налогом; `reduce` свернул весь массив в сумму 545 (0 — начальное значение).',
          '`find` вернул первый элемент больше 100 (120). `some` истинно (есть 300 > 200), `every` ложно (45 не больше 50).',
          'Сортируем **копию** `[...prices]` с числовым компаратором: исходный `prices` остался в прежнем порядке.',
        ],
        output: c`
          [ 80, 45 ] [ 144, 96, 54, 360 ] 545
          120 true false
          [ 45, 80, 120, 300 ] [ 120, 80, 45, 300 ]
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          console.log([10, 9, 1, 100].sort());   // [ 1, 10, 100, 9 ]
        `,
        explain: 'Без компаратора элементы сравниваются как строки: "10" < "100" < "9". Правильно: `.sort((a, b) => a - b)`.',
      },
      pitfalls: [
        '`arr.sort()` для чисел даёт лексикографический порядок и меняет исходный массив.',
        'Присваивание `const b = a` не копирует массив — изменения через `b` видны в `a`.',
        '`reduce` без начального значения падает на пустом массиве (`TypeError: Reduce of empty array with no initial value`).',
        '`!!arr.find(…)` считает найденный `0` или `""` как «не найдено» — используйте `some`/`includes`/`findIndex`.',
        '`splice` и `slice` путают: `splice` меняет массив, `slice` — нет; у них разные вторые аргументы (количество и конечный индекс).',
        '`forEach(async …)` и `map(async …)` не дожидаются завершения — это источник гонок.',
      ],
      sources: [
        { title: 'MDN — Array', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array' },
        { title: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
        { title: 'MDN — Array.prototype.reduce()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce' },
        { title: 'MDN — Indexed collections (guide)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections' },
      ],
    },
    misconceptions: [
      {
        id: 'sort-numeric',
        title: 'sort() сортирует числа по значению',
        explanation: 'Без компаратора `sort` приводит элементы к строкам и сравнивает их посимвольно: 10 окажется раньше 9.',
        fix: 'Передавайте компаратор: `arr.sort((a, b) => a - b)`.',
      },
      {
        id: 'sort-copies',
        title: 'sort и reverse возвращают новый массив',
        explanation: 'Они меняют исходный массив на месте (и возвращают его же).',
        fix: 'Копируйте перед сортировкой: `[...arr].sort(…)` или используйте `toSorted`.',
      },
      {
        id: 'assign-copies-array',
        title: 'const b = a создаёт копию массива',
        explanation: 'Копируется ссылка, массив остаётся один. Изменение через `b` видно в `a`.',
        fix: 'Для копии используйте `[...a]` или `a.slice()`.',
      },
      {
        id: 'splice-is-slice',
        title: 'splice и slice — одно и то же',
        explanation: '`slice(from, to)` возвращает копию части и не меняет массив; `splice(from, count)` удаляет элементы из самого массива.',
        fix: 'Если исходный массив менять нельзя — используйте `slice` или `toSpliced`.',
      },
      {
        id: 'find-returns-boolean',
        title: 'find возвращает true/false',
        explanation: '`find` возвращает сам найденный элемент (или `undefined`). Если элемент falsy (`0`, `""`), проверка `if (arr.find(…))` не сработает.',
        fix: 'Для проверки наличия используйте `some` или `includes`.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.arrays.1',
      skill: 'js.arrays',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const a = [1, 2, 3];
        const b = a;
        b.push(4);
        console.log(a, a.length);
      `,
      answer: '[ 1, 2, 3, 4 ] 4',
      explanation: '`b` и `a` — две переменные на один и тот же массив. `push` через `b` изменил общий массив, поэтому `a` тоже стал длиннее.',
    },
    {
      id: 'js.arrays.2',
      skill: 'js.arrays',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что вернёт выражение?',
      code: c`
        [10, 9, 1, 100].sort()
      `,
      options: [
        { text: '[ 1, 10, 100, 9 ]', correct: true, why: 'Без компаратора сравниваются строки: "1" < "10" < "100" < "9".' },
        { text: '[ 1, 9, 10, 100 ]', why: 'Числовой порядок получился бы только с компаратором `(a, b) => a - b`.', misconception: 'sort-numeric' },
        { text: '[ 100, 10, 9, 1 ]', why: 'Это числа по убыванию; `sort()` по умолчанию сортирует как строки по возрастанию.' },
        { text: '[ 10, 9, 1, 100 ]', why: '`sort` изменяет массив; порядок меняется.' },
      ],
      explanation: 'Метод `sort` по умолчанию приводит элементы к строкам. Всегда передавайте компаратор для чисел.',
    },
    {
      id: 'js.arrays.3',
      skill: 'js.arrays',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? `slice` и `splice` — разные методы.',
      code: c`
        const a = [1, 2, 3, 4, 5];
        const s = a.slice(1, 4);
        const r = a.splice(1, 2);
        console.log(s, r, a);
      `,
      answer: '[ 2, 3, 4 ] [ 2, 3 ] [ 1, 4, 5 ]',
      explanation: '`slice(1, 4)` — копия элементов с индексами 1–3, массив не меняется. `splice(1, 2)` удаляет два элемента начиная с индекса 1 и возвращает их; в `a` остаются 1, 4, 5.',
    },
    {
      id: 'js.arrays.4',
      skill: 'js.arrays',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt:
        'Напишите функцию `doubleEvens(arr)`: вернуть **новый** массив из удвоенных чётных чисел исходного массива. Исходный массив менять нельзя.',
      starter: c`
        function doubleEvens(arr) {
          // ваш код
        }
      `,
      solution: c`
        function doubleEvens(arr) {
          return arr.filter((x) => x % 2 === 0).map((x) => x * 2);
        }
      `,
      tests: [
        { expr: 'doubleEvens([1, 2, 3, 4])', expect: '[4, 8]' },
        { expr: 'doubleEvens([])', expect: '[]' },
        { expr: 'doubleEvens([1, 3])', expect: '[]', hidden: true, label: 'нет чётных' },
        { expr: 'doubleEvens([0, 5])', expect: '[0]', hidden: true, label: 'ноль — чётное число' },
        { expr: '(() => { const a = [2, 3]; doubleEvens(a); return a; })()', expect: '[2, 3]', hidden: true, label: 'исходный массив не меняется' },
      ],
      hints: [
        'Нужно сначала отобрать элементы, а потом преобразовать их. Какие методы это делают?',
        '`filter` отбирает чётные (`x % 2 === 0`), `map` умножает на 2.',
        '`arr.filter((x) => x % 2 === 0).map((x) => x * 2)`.',
      ],
      explanation: '`filter` и `map` возвращают новые массивы и не трогают исходный; цепочкой они образуют конвейер «отобрать → преобразовать».',
    },
    {
      id: 'js.arrays.5',
      skill: 'js.arrays',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Напишите функцию `sortNumbers(arr)`: вернуть массив чисел по возрастанию. Исходный массив менять нельзя.',
      starter: c`
        function sortNumbers(arr) {
          // ваш код
        }
      `,
      solution: c`
        function sortNumbers(arr) {
          return [...arr].sort((a, b) => a - b);
        }
      `,
      tests: [
        { expr: 'sortNumbers([10, 9, 1, 100])', expect: '[1, 9, 10, 100]' },
        { expr: 'sortNumbers([3, -1, 2])', expect: '[-1, 2, 3]' },
        { expr: 'sortNumbers([])', expect: '[]', hidden: true, label: 'пустой массив' },
        { expr: 'sortNumbers([2, 2, 1])', expect: '[1, 2, 2]', hidden: true, label: 'повторяющиеся значения' },
        { expr: '(() => { const a = [3, 1, 2]; sortNumbers(a); return a; })()', expect: '[3, 1, 2]', hidden: true, label: 'исходный массив не изменяется' },
      ],
      hints: [
        'Что делает `sort()` без аргументов с числами? И что он делает с исходным массивом?',
        'Нужен компаратор `(a, b) => a - b` и копия массива перед сортировкой.',
        '`[...arr].sort((a, b) => a - b)`.',
      ],
      explanation: '`sort` мутирует массив, поэтому сначала копируем (`[...arr]`). Компаратор `a - b` возвращает отрицательное/нулевое/положительное число, задавая числовой порядок.',
    },
    {
      id: 'js.arrays.6',
      skill: 'js.arrays',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Напишите функцию `longestWord(words)` через `reduce`: вернуть самое длинное слово из массива. При равной длине — первое из них. Для пустого массива — пустая строка.',
      starter: c`
        function longestWord(words) {
          // ваш код
        }
      `,
      solution: c`
        function longestWord(words) {
          return words.reduce((best, w) => (w.length > best.length ? w : best), "");
        }
      `,
      tests: [
        { expr: 'longestWord(["a", "abc", "ab"])', expect: '"abc"' },
        { expr: 'longestWord(["x"])', expect: '"x"' },
        { expr: 'longestWord([])', expect: '""', hidden: true, label: 'пустой массив (нужно начальное значение reduce)' },
        { expr: 'longestWord(["aa", "bb"])', expect: '"aa"', hidden: true, label: 'при равной длине — первое слово' },
        { expr: 'longestWord(["кот", "слон", "ёж"])', expect: '"слон"', hidden: true, label: 'кириллица' },
      ],
      hints: [
        '`reduce` накапливает результат. Что будет «лучшим словом», пока мы ничего не видели?',
        'Начальное значение — пустая строка. На каждом шаге оставляйте более длинное из пары.',
        'Строгое сравнение `>` оставит первое слово при равной длине.',
      ],
      explanation: 'Начальное значение `""` и для пустого массива даёт корректный результат; без него `reduce` упадёт. Строгое `>` сохраняет первое слово при ничьей.',
    },
    {
      id: 'js.arrays.7',
      skill: 'js.arrays',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`withoutLast(arr)` должна вернуть копию массива без последнего элемента, не меняя исходный массив. Сейчас она портит данные вызывающего кода.',
      buggy: c`
        function withoutLast(arr) {
          arr.pop();
          return arr;
        }
      `,
      solution: c`
        function withoutLast(arr) {
          return arr.slice(0, -1);
        }
      `,
      tests: [
        { expr: 'withoutLast([1, 2, 3])', expect: '[1, 2]' },
        { expr: 'withoutLast([7])', expect: '[]' },
        { expr: '(() => { const a = [1, 2, 3]; withoutLast(a); return a; })()', expect: '[1, 2, 3]', hidden: true, label: 'исходный массив не должен изменяться' },
        { expr: 'withoutLast([])', expect: '[]', hidden: true, label: 'пустой массив' },
      ],
      hints: [
        '`pop` — мутирующий метод. Что происходит с массивом, переданным в функцию?',
        'Нужен метод, который возвращает копию части массива, не меняя оригинал.',
        '`arr.slice(0, -1)` берёт всё, кроме последнего элемента.',
      ],
      explanation: 'Функция получает значение ссылки на тот же массив, поэтому `pop` внутри функции меняет массив вызывающего (а присваивание `arr = []` внутри функции вызывающий код не затронуло бы). `slice` возвращает новую копию.',
    },
    {
      id: 'js.arrays.8',
      skill: 'js.arrays',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'edge',
      prompt: '`contains(arr, x)` должна вернуть `true`, если значение есть в массиве. Но для некоторых значений она возвращает `false`. Найдите, для каких, и исправьте.',
      buggy: c`
        function contains(arr, x) {
          return !!arr.find((e) => e === x);
        }
      `,
      solution: c`
        function contains(arr, x) {
          return arr.includes(x);
        }
      `,
      tests: [
        { expr: 'contains([1, 2], 2)', expect: 'true' },
        { expr: 'contains([1, 2], 5)', expect: 'false' },
        { expr: 'contains([0, 1], 0)', expect: 'true', hidden: true, label: 'значение 0 найдено, но falsy' },
        { expr: 'contains([""], "")', expect: 'true', hidden: true, label: 'пустая строка тоже falsy' },
        { expr: 'contains([], 1)', expect: 'false', hidden: true, label: 'пустой массив' },
      ],
      hints: [
        'Что возвращает `find` — булево значение или сам элемент?',
        'Если найденный элемент равен `0` или `""`, как его превращает `!!`?',
        'Для проверки наличия есть `includes` (или `some`).',
      ],
      explanation: '`find` возвращает элемент, а не флаг. Элемент `0` или `""` — falsy, поэтому `!!` превращает успешный поиск в `false`. `includes` возвращает булево значение и подходит для этой задачи, в том числе для `NaN`. `some` тоже возвращает булево значение, но с предикатом `e === x` не найдёт `NaN` (используйте `Object.is`).',
    },
    {
      id: 'js.arrays.9',
      skill: 'js.arrays',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите конвейер: из чисел больше 4 удвоить каждое и вывести сумму.',
      lines: [
        'const nums = [5, 12, 8, 3, 20];',
        'const result = nums',
        '  .filter((n) => n > 4)',
        '  .map((n) => n * 2)',
        '  .reduce((acc, n) => acc + n, 0);',
        'console.log(result);',
      ],
      distractors: ['  .filter((n) => n < 4)', '  .map(n * 2)'],
      tests: [{ stdout: '90' }],
      explanation: 'Сначала отбор (5, 12, 8, 20), потом удвоение (10, 24, 16, 40), потом сумма 90. Порядок звеньев цепочки определяет результат.',
    },
    {
      id: 'js.arrays.10',
      skill: 'js.arrays',
      kind: 'explain',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Объясните, какие методы массива меняют исходный массив, а какие возвращают копию, и почему это важно при передаче массива в функцию.',
      keyPoints: [
        'Мутирующие: push, pop, shift, unshift, splice, sort, reverse, fill',
        'Возвращают новый массив: slice, map, filter, concat, toSorted, toReversed (а также литерал со spread: [...arr])',
        'В функцию передаётся значение ссылки на тот же массив: мутация внутри функции видна снаружи, а переприсваивание параметра (arr = []) снаружи не видно',
        'Для безопасной работы копируйте массив перед мутацией',
      ],
      modelAnswer:
        'Методы `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill` изменяют массив на месте, а `slice`, `map`, `filter`, `concat`, литерал `[...arr]` и ES2023 `toSorted`/`toReversed` возвращают новый массив. Это важно, потому что при передаче массива в функцию передаётся значение ссылки на тот же массив: если функция вызовет `sort`, массив у вызывающего кода тоже окажется отсортирован — неожиданный побочный эффект. Поэтому, если исходные данные менять нельзя, я сначала копирую массив через `[...arr]` или использую немутирующие методы.',
      explanation: 'Побочные эффекты на разделяемых данных — частая причина «таинственных» багов; немутирующий стиль их исключает.',
    },
  ],
};
