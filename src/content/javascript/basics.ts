import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const basics: SkillModule = {
  skill: {
    id: 'js.basics',
    route: 'javascript',
    title: 'Основы: переменные, вывод, строгий режим',
    icon: '🧱',
    summary: 'let/const/var, console.log, шаблонные строки, комментарии и "use strict".',
    prereqs: [],
    tier: 1,
    outcomes: [
      'Выбираю между const и let и понимаю, почему var почти не нужен',
      'Вывожу значения через console.log и собираю строки шаблонными литералами',
      'Знаю, что const запрещает переприсваивание имени, а не изменение объекта',
      'Читаю ввод через prompt() и помню, что он возвращает строку',
      'Понимаю, что даёт строгий режим ("use strict") и почему присваивание необъявленной переменной — ошибка',
    ],
    estMinutes: 20,
    lesson: {
      why: 'Любая программа хранит данные в переменных и сообщает результат. console.log — ваш главный инструмент отладки, а правильный выбор const/let предотвращает целый класс багов.',
      brief:
        '`const x = 1` — имя нельзя переприсвоить; `let x = 1` — можно. `var` — устаревший вариант с функциональной областью видимости. `console.log(a, b)` печатает значения через пробел. Шаблонная строка: `` `Итого: ${a + b}` ``.',
      standard: md(
        'В современном JavaScript переменные объявляют двумя ключевыми словами:',
        '- `const` — по умолчанию. Имя **нельзя переприсвоить**.\n- `let` — когда значение действительно меняется (счётчик, накопитель).\n- `var` — старый способ, в новом коде не нужен.',
        js`
          const name = "Аня";
          let score = 0;
          score = score + 10;   // можно: let
          // name = "Оля";      // TypeError: Assignment to constant variable.
          console.log(name, score);   // Аня 10
        `,
        '`console.log` принимает любое число аргументов и печатает их через пробел. Строки в кавычках `"…"` или `\'…\'` — одно и то же; обратные кавычки создают **шаблонную строку**, в которую можно подставлять выражения через `${…}`:',
        js`
          const price = 120;
          const count = 3;
          console.log(\`Итого: \${price * count} ₽\`);   // Итого: 360 ₽
          console.log("Итого: " + price * count);        // тоже работает, но менее удобно
        `,
        'Комментарии: `// до конца строки` и `/* многострочный */`. Они не выполняются и объясняют *почему*, а не *что* делает код.',
        'Строгий режим включается директивой `"use strict"` в начале скрипта (в модулях и классах он включён всегда). Он превращает тихие ошибки в явные: например, присваивание необъявленной переменной `count = 1` вызовет `ReferenceError` вместо того, чтобы молча создать глобальную переменную. В этом курсе код выполняется в строгом режиме.',
        '`prompt()` (в нашей среде) читает следующую строку ввода и **всегда возвращает строку**: `prompt() + prompt()` для `"2"` и `"3"` даст `"23"`. Для чисел используйте `Number(prompt())`.',
      ),
      deep: md(
        '**`const` защищает связь имени со значением, а не само значение.** Если в `const` лежит объект или массив, его содержимое менять можно: `const a = []; a.push(1)` работает. Неизменяемость объекта обеспечивает `Object.freeze` (и то поверхностно).',
        '**Области видимости.** `let` и `const` блочные: живут внутри ближайших `{ }`. `var` видна во всей функции и «поднимается» (hoisting) — объявление считается выполненным в начале функции, со значением `undefined`. Поэтому `console.log(x); var x = 1;` печатает `undefined`, а не падает. У `let`/`const` тоже есть hoisting, но до строки объявления они находятся в **временной мёртвой зоне** (TDZ): обращение вызывает `ReferenceError` (подробнее — в теме про замыкания).',
        '**Автоматическая вставка точек с запятой (ASI).** Движок сам добавляет `;` в некоторых местах, но не везде: строка, начинающаяся с `(` или `[`, склеивается с предыдущей. Поэтому надёжнее ставить `;` явно или придерживаться одного стиля линтера.',
        '**Имена.** Допустимы буквы, цифры, `_` и `$`, но не начинаются с цифры; регистр важен (`score` ≠ `Score`). Принят стиль `camelCase`; константы-«настройки» часто пишут `UPPER_SNAKE_CASE`.',
        '**Что печатает `console.log`.** Для объектов и массивов он выводит читаемое представление, не `toString()`: `console.log([1, 2])` покажет `[ 1, 2 ]`. Строки на верхнем уровне выводятся без кавычек, внутри структур — в одинарных.',
      ),
      analogy:
        '`const` — это коробка, приклеенная к полке: вы не можете переставить её на другое место, но можете достать и поменять то, что лежит внутри. `let` — коробка, которую можно переставлять.',
      example: {
        lang: 'javascript',
        code: c`
          const product = "Ноутбук";
          let price = 50000;
          const discount = 0.1;
          price = price * (1 - discount);
          console.log(\`\${product}: \${price} ₽\`);
          console.log("Скидка:", discount * 100 + "%");
        `,
        steps: [
          '`product` и `discount` объявлены через `const` — они не изменятся. `price` — через `let`, потому что мы пересчитаем его.',
          'Правая часть `price * (1 - discount)` вычисляется первой (50000 · 0.9 = 45000), затем результат записывается обратно в `price`.',
          'Шаблонная строка подставляет значения `product` и `price` вместо `${…}`.',
          '`console.log` с двумя аргументами печатает их через пробел; `discount * 100 + "%"` сначала умножает, потом склеивает с символом процента.',
        ],
        output: c`
          Ноутбук: 45000 ₽
          Скидка: 10%
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const count = 0;
          count = count + 1;   // TypeError: Assignment to constant variable.
        `,
        explain:
          'Счётчик, который должен меняться, нужно объявлять через `let`. `const` сообщит об ошибке сразу, а не позволит случайно перезаписать значение — в этом его польза.',
      },
      pitfalls: [
        'Присваивать значение необъявленной переменной: в строгом режиме это ReferenceError, а в «нестрогом» молча создаётся глобальная переменная — источник трудных багов.',
        'Думать, что `const` делает объект неизменяемым: `const user = {}; user.name = "x"` — допустимо.',
        'Забывать, что `prompt()` возвращает строку: `"2" + "3"` — это `"23"`.',
        'Ставить обычные кавычки вместо обратных: `"${x}"` выведет текст `${x}` буквально.',
      ],
      sources: [
        { title: 'MDN — Grammar and types', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types' },
        { title: 'MDN — const', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const' },
        { title: 'MDN — Template literals', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals' },
        { title: 'MDN — Strict mode', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode' },
      ],
    },
    misconceptions: [
      {
        id: 'const-deep-freeze',
        title: 'const делает значение неизменяемым',
        explanation: '`const` запрещает только переприсвоить имя. Содержимое объекта или массива, на который оно указывает, менять можно.',
        fix: 'Для защиты содержимого используйте `Object.freeze` или иммутабельный стиль (копирование вместо изменения).',
      },
      {
        id: 'var-block-scope',
        title: 'var видна только внутри блока',
        explanation: 'У `var` нет блочной области видимости: объявленная в `if` или цикле, она доступна во всей функции.',
        fix: 'Используйте `let`/`const` — они ограничены блоком.',
      },
      {
        id: 'quotes-interpolate',
        title: 'Подстановка `${}` работает в любых кавычках',
        explanation: 'Интерполяция есть только у шаблонных строк в обратных кавычках. В "…" и \'…\' текст `${x}` остаётся буквальным.',
        fix: 'Для подстановок используйте обратные кавычки: `Привет, ${name}`.',
      },
      {
        id: 'prompt-is-number',
        title: 'prompt() возвращает число',
        explanation: 'Ввод всегда приходит строкой. `"2" + "3"` — это `"23"`, а не 5.',
        fix: 'Преобразуйте явно: `Number(prompt())`.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.basics.1',
      skill: 'js.basics',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        let a = 3;
        let b = a;
        a = 10;
        console.log(a, b);
      `,
      answer: '10 3',
      explanation: '`b = a` копирует текущее значение 3. Последующее `a = 10` на `b` не влияет — числа копируются по значению.',
    },
    {
      id: 'js.basics.2',
      skill: 'js.basics',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что произойдёт при выполнении кода?',
      code: c`
        const user = { name: "Аня" };
        user.name = "Оля";
        console.log(user.name);
      `,
      options: [
        { text: 'Выведет Оля', correct: true, why: '`const` запрещает переприсвоить `user`, но свойства объекта изменять можно.' },
        { text: 'TypeError: Assignment to constant variable.', why: 'Такая ошибка была бы при `user = {}`, а здесь меняется свойство, а не имя.', misconception: 'const-deep-freeze' },
        { text: 'Выведет Аня', why: 'Присваивание свойства сработает — `const` не замораживает объект.', misconception: 'const-deep-freeze' },
        { text: 'Выведет undefined', why: 'Свойство `name` существует и получит новое значение.' },
      ],
      explanation: '`const` фиксирует связь имени с объектом, но не содержимое объекта. Для настоящей неизменяемости нужен `Object.freeze`.',
    },
    {
      id: 'js.basics.3',
      skill: 'js.basics',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Обратите внимание на тип кавычек и порядок вычислений.',
      code: c`
        const name = "Аня";
        const age = 20;
        console.log(\`\${name} через год: \${age + 1}\`);
        console.log("\${name}");
        console.log("2 + 2 = " + 2 + 2);
      `,
      answer: c`
        Аня через год: 21
        \${name}
        2 + 2 = 22
      `,
      explanation:
        'В обратных кавычках `${…}` вычисляется. В обычных кавычках остаётся текстом. В третьей строке `+` вычисляется слева направо: `"2 + 2 = " + 2` уже строка, к ней приклеивается ещё `2`.',
    },
    {
      id: 'js.basics.4',
      skill: 'js.basics',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Программа получает два целых числа (каждое на своей строке через `prompt()`) и выводит их сумму в формате `Сумма: N`.',
      starter: c`
        const a = prompt();
        const b = prompt();
        // выведите сумму
      `,
      solution: c`
        const a = Number(prompt());
        const b = Number(prompt());
        console.log(\`Сумма: \${a + b}\`);
      `,
      tests: [
        { stdin: ['2', '3'], stdout: 'Сумма: 5' },
        { stdin: ['10', '-4'], stdout: 'Сумма: 6' },
        { stdin: ['0', '0'], stdout: 'Сумма: 0', hidden: true, label: 'нули' },
        { stdin: ['-7', '-8'], stdout: 'Сумма: -15', hidden: true, label: 'оба отрицательные' },
        { stdin: ['12', '30'], stdout: 'Сумма: 42', hidden: true, label: 'двузначные числа (не склейка "1230")' },
      ],
      hints: [
        'Что возвращает prompt() — число или строку? Что делает `+` со строками?',
        'Преобразуйте каждое значение: `Number(prompt())`.',
        'Вывод: console.log(`Сумма: ${a + b}`) — обратные кавычки.',
      ],
      explanation: 'Без `Number()` сложение строк склеит их: `"2" + "3"` = `"23"`. Преобразование — первое, что нужно делать с вводом.',
    },
    {
      id: 'js.basics.5',
      skill: 'js.basics',
      kind: 'fix',
      difficulty: 1,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: 'Программа читает цену и скидку (по одному числу в строке) и должна вывести `Цена: N` после вычета скидки. Сейчас она падает. Исправьте.',
      buggy: c`
        const price = Number(prompt());
        const discount = Number(prompt());
        price = price - discount;
        console.log(\`Цена: \${price}\`);
      `,
      solution: c`
        let price = Number(prompt());
        const discount = Number(prompt());
        price = price - discount;
        console.log(\`Цена: \${price}\`);
      `,
      tests: [
        { stdin: ['100', '20'], stdout: 'Цена: 80' },
        { stdin: ['50', '0'], stdout: 'Цена: 50' },
        { stdin: ['10', '10'], stdout: 'Цена: 0', hidden: true, label: 'скидка равна цене' },
        { stdin: ['5', '8'], stdout: 'Цена: -3', hidden: true, label: 'скидка больше цены' },
      ],
      hints: [
        'Прочитайте сообщение об ошибке: что именно нельзя делать с `const`?',
        'Значение `price` меняется — какое ключевое слово подходит для таких переменных?',
        'Замените `const price` на `let price`.',
      ],
      explanation: '`price = price - discount` переприсваивает имя, а для `const` это TypeError. Переменные, которые меняются, объявляют через `let`.',
    },
    {
      id: 'js.basics.6',
      skill: 'js.basics',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: 'Программа должна прочитать число и вывести его удвоенное значение. В строгом режиме она падает с ReferenceError. Исправьте объявление.',
      buggy: c`
        const n = Number(prompt());
        doubled = n * 2;
        console.log(doubled);
      `,
      solution: c`
        const n = Number(prompt());
        const doubled = n * 2;
        console.log(doubled);
      `,
      tests: [
        { stdin: ['4'], stdout: '8' },
        { stdin: ['-3'], stdout: '-6' },
        { stdin: ['0'], stdout: '0', hidden: true, label: 'ноль' },
        { stdin: ['2.5'], stdout: '5', hidden: true, label: 'дробное число' },
      ],
      hints: [
        'Какая переменная в ошибке «is not defined»? Где она объявлена?',
        'Перед первым присваиванием имя нужно объявить.',
        'Напишите `const doubled = n * 2;`.',
      ],
      explanation:
        'В строгом режиме присваивание необъявленному имени — ReferenceError. В «нестрогом» оно тихо создало бы глобальную переменную, что опасно: опечатка в имени породила бы новую переменную.',
    },
    {
      id: 'js.basics.7',
      skill: 'js.basics',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу, которая выводит `Привет, Мир и JS!` с помощью шаблонной строки.',
      lines: ['const first = "Мир";', 'const second = "JS";', 'const greeting = `Привет, ${first} и ${second}!`;', 'console.log(greeting);'],
      distractors: ['const greeting = "Привет, ${first} и ${second}!";', 'first = "Мир";'],
      tests: [{ stdout: 'Привет, Мир и JS!' }],
      explanation: 'Подстановка `${…}` работает только в обратных кавычках; в обычных кавычках выведется буквальный текст `${first}`.',
    },
    {
      id: 'js.basics.8',
      skill: 'js.basics',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? (`typeof` необъявленного имени не падает, а возвращает строку `"undefined"`.)',
      code: c`
        if (true) {
          var a = 1;
          let b = 2;
        }
        console.log(typeof a, typeof b);
      `,
      answer: 'number undefined',
      explanation: '`var a` не ограничена блоком `if`, поэтому видна снаружи. `let b` живёт только внутри `{ }`, снаружи имя `b` не объявлено.',
    },
    {
      id: 'js.basics.9',
      skill: 'js.basics',
      kind: 'explain',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Объясните своими словами, как выбрать между `const` и `let`, и почему в новом коде обычно избегают `var`.',
      keyPoints: [
        '`const` по умолчанию: имя нельзя переприсвоить, код легче читать',
        '`let` — только когда значение действительно меняется (счётчики, накопители)',
        '`var` имеет функциональную область видимости и hoisting со значением undefined, что приводит к неожиданным багам',
        '`const` не делает содержимое объекта неизменяемым',
      ],
      modelAnswer:
        'Я объявляю переменную через `const`, если не собираюсь её переприсваивать, — так читатель сразу видит, что значение стабильно. Если нужно менять значение (счётчик, сумма), использую `let`. `var` избегаю: она видна во всей функции, а не в блоке, и «поднимается» с значением undefined, из-за чего ошибки с областью видимости трудно заметить. Важно помнить, что `const` защищает только имя: свойства объекта по-прежнему можно менять.',
      explanation: 'Привычка «const по умолчанию» делает намерения кода явными и ловит случайные перезаписи на раннем этапе.',
    },
  ],
};
