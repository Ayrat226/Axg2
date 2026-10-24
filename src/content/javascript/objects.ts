import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const objects: SkillModule = {
  skill: {
    id: 'js.objects',
    route: 'javascript',
    title: 'Объекты и JSON',
    icon: '🗂️',
    summary: 'Литералы, доступ к свойствам, деструктуризация, spread/rest, ссылочная семантика, Object.keys/entries и JSON.',
    prereqs: ['js.arrays'],
    tier: 2,
    outcomes: [
      'Создаю объекты, читаю свойства через точку и скобки, различаю o.key и o[key]',
      'Использую деструктуризацию, spread и rest для чтения и копирования объектов',
      'Понимаю, что объекты хранятся по ссылке, и отличаю поверхностную копию от глубокой',
      'Перебираю объект через Object.keys/values/entries',
      'Знаю, что теряется при JSON.stringify/parse',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Объекты — основной способ описывать сущности (пользователь, товар, настройки), а JSON — общий язык обмена данными между сервером и клиентом.',
      brief:
        '`{ ключ: значение }` — набор свойств. `obj.key` — фиксированное имя, `obj[expr]` — вычисляемое. `const { a, ...rest } = obj` — деструктуризация; `{ ...obj, a: 1 }` — копия с изменением (поверхностная). Объекты передаются и сравниваются **по ссылке**. `Object.entries(obj)` → пары `[ключ, значение]`. `JSON.stringify` теряет `undefined`, функции и превращает `NaN` в `null`.',
      standard: md(
        '**Литерал объекта** задаёт пары «ключ: значение». Ключи — строки (или символы). Читать можно через точку или скобки:',
        js`
          const user = { name: "Аня", age: 20, "favorite color": "синий" };
          console.log(user.name, user["favorite color"]);
          const key = "age";
          console.log(user[key]);     // 20 — вычисляемое имя
          console.log(user.key);      // undefined — ищется буквально свойство "key"
        `,
        '**Сокращённая запись.** Если имя переменной совпадает с ключом: `{ name, age }`; вычисляемые ключи: `{ [key]: 1 }`; методы: `{ greet() {} }`. Свойства добавляются и удаляются на лету (`obj.x = 1`, `delete obj.x`).',
        '**Проверка наличия:** `"x" in obj` (включая унаследованные), `Object.hasOwn(obj, "x")` (только собственные). Не путайте с `obj.x !== undefined`: свойство может существовать со значением `undefined`.',
        '**Деструктуризация** достаёт значения в переменные, поддерживает значения по умолчанию и переименование:',
        js`
          const { name, age = 18, city: town = "—" } = { name: "Аня" };
          console.log(name, age, town);   // Аня 18 —
        `,
        '**Spread и rest.** `{ ...a, ...b }` копирует свойства (поздние перезаписывают ранние); `const { x, ...rest } = obj` собирает остальные свойства в новый объект.',
        '**Ссылочная семантика.** Объект — это ссылка. `const b = a` не создаёт копию, `{} === {}` — `false`, а копия через spread **поверхностная**: вложенные объекты и массивы по-прежнему общие.',
        js`
          const a = { n: 1, inner: { v: 1 } };
          const b = { ...a };
          b.n = 2;          // a.n не изменится
          b.inner.v = 99;   // а вот a.inner.v изменится!
          console.log(a.n, a.inner.v);   // 1 99
        `,
        '**Перебор.** `Object.keys(obj)`, `Object.values(obj)`, `Object.entries(obj)` возвращают массивы собственных перечислимых свойств; `Object.fromEntries(entries)` собирает объект обратно. Порядок: сначала целочисленные ключи по возрастанию, затем строковые в порядке добавления.',
        '**JSON** — текстовый формат. `JSON.stringify(obj)` → строка, `JSON.parse(text)` → значение. При сериализации пропадают свойства со значением `undefined`, функции и символы, `NaN`/`Infinity` становятся `null`, `Date` превращается в строку.',
      ),
      deep: md(
        '**Прототипы.** У объекта есть скрытая ссылка на прототип. Если свойства нет у самого объекта, поиск идёт по цепочке прототипов. Поэтому `({}).toString` существует, а `"toString" in {}` — `true`. Словарь без наследуемых ключей: `Object.create(null)` или `Map`.',
        '**Ключи — всегда строки или символы.** `obj[1]` и `obj["1"]` — одно и то же; `obj[{}]` превратится в ключ `"[object Object]"`. Для произвольных ключей (в том числе объектов) используйте `Map`.',
        '**Дескрипторы свойств.** Свойства бывают перечислимые/записываемые/конфигурируемые; геттеры и сеттеры задаются как `get x() {}`. `Object.freeze(o)` делает объект неизменяемым **поверхностно**.',
        '**Глубокое копирование.** `structuredClone(obj)` копирует вложенные структуры (Date, Map, Set, циклические ссылки), но не функции и не прототипы. Приём `JSON.parse(JSON.stringify(x))` ломает `Date`, `undefined`, `Map` и бросает ошибку на циклических ссылках.',
        '**Порядок применения spread.** В `{ ...defaults, ...overrides }` побеждает последний. Spread копирует только собственные перечислимые свойства и не копирует прототип.',
        '**Опасный пример: объект как словарь.** `counts[word] = (counts[word] || 0) + 1` ломается на ключах вроде `"constructor"`: `counts["constructor"]` — унаследованная функция, и `||` её не заменит. Используйте `Object.hasOwn`, `Object.create(null)` или `Map`.',
        '**JSON.parse и безопасность.** `JSON.parse` безопасен (в отличие от `eval`), но не проверяет структуру: формат данных проверяйте отдельно. Второй аргумент `reviver` и третий у `stringify` (отступ) удобны для отладки: `JSON.stringify(obj, null, 2)`.',
      ),
      analogy:
        'Объект — это карточка в картотеке с подписанными полями. Переменная хранит не саму карточку, а номер ячейки, где она лежит. Скопировать номер (`b = a`) — не значит сделать вторую карточку.',
      example: {
        lang: 'javascript',
        code: c`
          const user = { name: "Аня", age: 20, tags: ["js", "web"] };
          const { name, ...rest } = user;
          const older = { ...user, age: user.age + 1 };
          console.log(name, rest);
          console.log(older.age, user.age, older.tags === user.tags);
          for (const [k, v] of Object.entries({ a: 1, b: 2 })) console.log(k, v);
          console.log(JSON.stringify(older));
        `,
        steps: [
          'Деструктуризация вынула `name` в переменную, а `...rest` собрал остальные свойства в новый объект.',
          '`{ ...user, age: … }` скопировал свойства и перезаписал `age`; исходный `user.age` остался 20.',
          'Но `older.tags === user.tags` — `true`: копия поверхностная, массив общий.',
          '`Object.entries` даёт массив пар, которые удобно разбирать деструктуризацией в `for…of`.',
          '`JSON.stringify` превращает объект в строку формата JSON (ключи в двойных кавычках).',
        ],
        output: c`
          Аня { age: 20, tags: [ 'js', 'web' ] }
          21 20 true
          a 1
          b 2
          {"name":"Аня","age":21,"tags":["js","web"]}
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const a = { x: 1 };
          const b = a;
          b.x = 2;
          console.log(a.x);   // 2 — это тот же объект
        `,
        explain: 'Присваивание копирует ссылку. Чтобы получить независимую копию, используйте `{ ...a }` (поверхностно) или `structuredClone(a)` (глубоко).',
      },
      pitfalls: [
        'Читать `obj.key`, когда имя свойства лежит в переменной `key`: нужны скобки `obj[key]`.',
        'Считать spread глубоким копированием: вложенные объекты остаются общими.',
        'Сравнивать объекты через `===` по содержимому: сравниваются ссылки.',
        'Использовать обычный объект как словарь для произвольных слов: ключи вроде `constructor` и `__proto__` дают сюрпризы.',
        'Ожидать, что JSON сохранит `undefined`, функции, `NaN` и `Date`.',
      ],
      sources: [
        { title: 'MDN — Working with objects', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects' },
        { title: 'MDN — Destructuring assignment', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment' },
        { title: 'MDN — Spread syntax', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax' },
        { title: 'MDN — JSON', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON' },
        { title: 'MDN — structuredClone()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone' },
      ],
    },
    misconceptions: [
      {
        id: 'object-copy-assign',
        title: 'b = a создаёт копию объекта',
        explanation: 'Копируется ссылка: `a` и `b` указывают на один и тот же объект.',
        fix: 'Копируйте явно: `{ ...a }` или `structuredClone(a)`.',
      },
      {
        id: 'spread-deep',
        title: 'Spread делает глубокую копию',
        explanation: 'Spread копирует только первый уровень. Вложенные объекты и массивы остаются общими.',
        fix: 'Копируйте вложенные уровни отдельно или используйте `structuredClone`.',
      },
      {
        id: 'dot-uses-variable',
        title: 'obj.key берёт имя свойства из переменной key',
        explanation: 'После точки идёт буквальное имя. Имя из переменной читается через скобки: `obj[key]`.',
        fix: 'Если имя вычисляется — `obj[key]`.',
      },
      {
        id: 'object-equals-content',
        title: 'Объекты с одинаковым содержимым равны по ===',
        explanation: '`===` сравнивает ссылки: `{ x: 1 } === { x: 1 }` — `false`.',
        fix: 'Сравнивайте поля вручную или сериализуйте/используйте функцию глубокого сравнения.',
      },
      {
        id: 'json-lossless',
        title: 'JSON сохраняет любые значения',
        explanation: '`undefined`, функции и символы пропадают, `NaN` становится `null`, `Date` — строкой.',
        fix: 'Используйте JSON только для простых данных; для сложных — `structuredClone` или явную сериализацию.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.objects.1',
      skill: 'js.objects',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const a = { x: 1 };
        const b = a;
        b.x = 2;
        console.log(a.x, a === b, { x: 2 } === { x: 2 });
      `,
      answer: '2 true false',
      explanation: '`a` и `b` — один объект, поэтому `a.x` стал 2 и `a === b`. Два разных литерала `{ x: 2 }` — разные объекты, `===` сравнивает ссылки.',
    },
    {
      id: 'js.objects.2',
      skill: 'js.objects',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        const key = "name";
        const o = { key: "Аня", name: "Оля" };
        console.log(o.key, o[key]);
      `,
      options: [
        { text: 'Аня Оля', correct: true, why: '`o.key` — свойство с буквальным именем "key", `o[key]` подставляет значение переменной: `o["name"]`.' },
        { text: 'Оля Оля', why: 'Точка не подставляет переменную: `o.key` ищет свойство "key".', misconception: 'dot-uses-variable' },
        { text: 'Аня Аня', why: 'Скобки с переменной читают свойство по её значению ("name").' },
        { text: 'undefined Оля', why: 'Литерал `{ key: "Аня" }` создаёт свойство "key", оно определено.' },
      ],
      explanation: 'Точка — для фиксированных имён, скобки — для вычисляемых. В литерале `{ key: … }` слово `key` — тоже буквальное имя, не переменная.',
    },
    {
      id: 'js.objects.3',
      skill: 'js.objects',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const base = { a: 1, b: 2 };
        const { a, ...rest } = base;
        const merged = { ...base, b: 20, c: 3 };
        console.log(a, rest, merged);
      `,
      answer: '1 { b: 2 } { a: 1, b: 20, c: 3 }',
      explanation: '`rest` собрал оставшиеся свойства (`b`). В `merged` поздние значения перезаписывают ранние, поэтому `b` стал 20, а `c` добавился.',
    },
    {
      id: 'js.objects.4',
      skill: 'js.objects',
      kind: 'code',
      difficulty: 2,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `pick(obj, keys)`: вернуть новый объект только с теми ключами из `keys`, которые есть в `obj` как собственные свойства.',
      starter: c`
        function pick(obj, keys) {
          // ваш код
        }
      `,
      solution: c`
        function pick(obj, keys) {
          const result = {};
          for (const key of keys) {
            if (Object.hasOwn(obj, key)) result[key] = obj[key];
          }
          return result;
        }
      `,
      tests: [
        { expr: 'pick({ a: 1, b: 2, c: 3 }, ["a", "c"])', expect: '({ a: 1, c: 3 })' },
        { expr: 'pick({ a: 1 }, ["b"])', expect: '({})' },
        { expr: 'pick({}, [])', expect: '({})', hidden: true, label: 'пустой объект и пустой список' },
        { expr: 'pick({ a: undefined }, ["a"])', expect: '({ a: undefined })', hidden: true, label: 'ключ есть, значение undefined — ключ нужно сохранить' },
        { expr: 'pick({ a: 1 }, ["toString"])', expect: '({})', hidden: true, label: 'унаследованные свойства не копируются' },
      ],
      hints: [
        'Как проверить, что у объекта есть собственное свойство?',
        'Пройдите по `keys` циклом и копируйте значение, только если ключ есть.',
        '`Object.hasOwn(obj, key)` отличает собственные свойства от унаследованных и от свойств со значением `undefined`.',
      ],
      explanation: 'Проверка `obj[key] !== undefined` потеряла бы свойства со значением `undefined`, а `key in obj` захватила бы унаследованные (`toString`). `Object.hasOwn` проверяет ровно собственные свойства.',
    },
    {
      id: 'js.objects.5',
      skill: 'js.objects',
      kind: 'code',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Напишите функцию `countWords(words)`: вернуть объект «слово → сколько раз встретилось». Функция должна работать на любых словах, в том числе `"constructor"`.',
      starter: c`
        function countWords(words) {
          // ваш код
        }
      `,
      solution: c`
        function countWords(words) {
          const counts = {};
          for (const w of words) {
            counts[w] = Object.hasOwn(counts, w) ? counts[w] + 1 : 1;
          }
          return counts;
        }
      `,
      tests: [
        { expr: 'countWords(["a", "b", "a"])', expect: '({ a: 2, b: 1 })' },
        { expr: 'countWords([])', expect: '({})' },
        { expr: 'countWords(["x", "x", "x"])', expect: '({ x: 3 })', hidden: true, label: 'одно слово несколько раз' },
        { expr: 'countWords(["constructor", "constructor"])', expect: '({ constructor: 2 })', hidden: true, label: 'слово совпадает с унаследованным свойством' },
        { expr: 'countWords(["toString"])', expect: '({ toString: 1 })', hidden: true, label: 'слово toString' },
      ],
      hints: [
        'Для каждого слова нужно либо увеличить счётчик, либо создать его со значением 1.',
        'Запись `counts[w] || 0` ломается, если у объекта уже есть унаследованное свойство с таким именем.',
        'Проверяйте наличие собственного ключа: `Object.hasOwn(counts, w)`.',
      ],
      explanation: 'У обычного объекта есть унаследованные свойства (`constructor`, `toString`). Поэтому `counts[w]` для таких слов уже «существует». `Object.hasOwn` (или `Map`) решает проблему.',
    },
    {
      id: 'js.objects.6',
      skill: 'js.objects',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: '`withAge(user, age)` должна вернуть **новый** объект пользователя с обновлённым возрастом, не меняя исходный. Сейчас исходный объект портится.',
      buggy: c`
        function withAge(user, age) {
          user.age = age;
          return user;
        }
      `,
      solution: c`
        function withAge(user, age) {
          return { ...user, age };
        }
      `,
      tests: [
        { expr: 'withAge({ name: "Аня", age: 20 }, 21)', expect: '({ name: "Аня", age: 21 })' },
        { expr: 'withAge({ name: "Ян" }, 5)', expect: '({ name: "Ян", age: 5 })' },
        { expr: '(() => { const u = { name: "Аня", age: 20 }; withAge(u, 99); return u.age; })()', expect: '20', hidden: true, label: 'исходный объект не должен меняться' },
        { expr: '(() => { const u = { age: 1 }; return withAge(u, 2) === u; })()', expect: 'false', hidden: true, label: 'возвращается другой объект' },
      ],
      hints: [
        'Объект передаётся в функцию по ссылке. Что делает `user.age = age`?',
        'Нужен новый объект, который содержит все свойства `user`, но с другим `age`.',
        'Spread: `{ ...user, age }`.',
      ],
      explanation: 'Присваивание свойства меняет объект вызывающего кода. `{ ...user, age }` копирует поля и перезаписывает `age` в новом объекте.',
    },
    {
      id: 'js.objects.7',
      skill: 'js.objects',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'logic',
      prompt:
        '`copyUser(user)` должна вернуть независимую копию пользователя (у которого может быть вложенный `address`). Но изменение адреса в копии портит оригинал. Исправьте.',
      buggy: c`
        function copyUser(user) {
          return { ...user };
        }
      `,
      solution: c`
        function copyUser(user) {
          const copy = { ...user };
          if (user.address) copy.address = { ...user.address };
          return copy;
        }
      `,
      tests: [
        { expr: 'copyUser({ name: "Аня", address: { city: "Омск" } })', expect: '({ name: "Аня", address: { city: "Омск" } })' },
        { expr: 'copyUser({ name: "Ян" })', expect: '({ name: "Ян" })' },
        { expr: '(() => { const u = { address: { city: "Омск" } }; const c = copyUser(u); c.address.city = "Тверь"; return u.address.city; })()', expect: '"Омск"', hidden: true, label: 'изменение адреса копии не влияет на оригинал' },
        { expr: '(() => { const u = { name: "Ян" }; return "address" in copyUser(u); })()', expect: 'false', hidden: true, label: 'не добавлять address, если его не было' },
      ],
      hints: [
        'Spread копирует только первый уровень. Что происходит с `address`?',
        'Вложенный объект нужно копировать отдельно.',
        'Скопируйте `address` через spread, но только если он есть.',
      ],
      explanation: 'После `{ ...user }` поле `address` в копии и оригинале ссылается на один объект. Вложенные уровни нужно копировать явно (или применить `structuredClone`).',
    },
    {
      id: 'js.objects.8',
      skill: 'js.objects',
      kind: 'predict',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Что выведет программа? Что происходит с `undefined`, функциями и `NaN` при сериализации в JSON?',
      code: c`
        const data = { n: 1, u: undefined, f() {}, d: [1, undefined, NaN], s: "x" };
        const text = JSON.stringify(data);
        console.log(text);
        console.log(JSON.parse(text));
      `,
      answer: c`
        {"n":1,"d":[1,null,null],"s":"x"}
        { n: 1, d: [ 1, null, null ], s: 'x' }
      `,
      explanation: 'Свойства со значением `undefined` и функции пропускаются; внутри массива `undefined` и `NaN` превращаются в `null`. `JSON.parse` восстанавливает уже «обеднённую» структуру.',
    },
    {
      id: 'js.objects.9',
      skill: 'js.objects',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу: посчитать суммарное количество товаров в наличии (qty > 0) и вывести число видов товаров и сумму.',
      lines: [
        'const stock = { apple: 3, pear: 0, plum: 5 };',
        'let total = 0;',
        'for (const [name, qty] of Object.entries(stock)) {',
        '  if (qty > 0) total += qty;',
        '}',
        'console.log(Object.keys(stock).length, total);',
      ],
      distractors: ['for (const [name, qty] of stock) {', '  if (name > 0) total += name;'],
      tests: [{ stdout: '3 8' }],
      explanation: 'Обычный объект не итерируемый, поэтому `for…of` нужно применять к `Object.entries(stock)`; каждая пара разбирается деструктуризацией. 3 вида, в наличии 3 + 5 = 8.',
    },
    {
      id: 'js.objects.10',
      skill: 'js.objects',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Объясните разницу между копированием ссылки, поверхностной и глубокой копией объекта. Когда `{ ...obj }` недостаточно?',
      code: c`
        const a = { n: 1, inner: { v: 1 } };
        const b = { ...a };
        b.inner.v = 99;
        console.log(a.inner.v);
      `,
      keyPoints: [
        '`b = a` копирует только ссылку — объект один',
        'Spread/`Object.assign` создают новый объект, но вложенные объекты остаются общими (поверхностная копия)',
        'Глубокая копия копирует все уровни: `structuredClone`',
        '`{ ...obj }` недостаточно, если нужно менять вложенные данные независимо',
      ],
      modelAnswer:
        'При `b = a` обе переменные указывают на один и тот же объект. `{ ...a }` создаёт новый объект и копирует его свойства, но если среди них есть вложенные объекты или массивы, то копируются лишь ссылки на них — это поверхностная копия, поэтому `b.inner.v = 99` изменит и `a.inner.v`. Если нужно менять вложенные данные независимо, делают глубокую копию, например `structuredClone(a)`, или копируют вложенный уровень отдельно.',
      explanation: 'Понимание уровней копирования помогает избежать скрытых связей между «разными» объектами, особенно в состоянии приложения.',
    },
  ],
};
