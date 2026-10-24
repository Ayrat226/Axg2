import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const conditions: SkillModule = {
  skill: {
    id: 'js.conditions',
    route: 'javascript',
    title: 'Условия и логические операторы',
    icon: '🔀',
    summary: 'if/else, тернарный оператор, switch, && и || как операторы, возвращающие операнды, ?? и ?.',
    prereqs: ['js.types'],
    tier: 1,
    outcomes: [
      'Пишу ветвления через if/else if/else и тернарный оператор там, где он читается проще',
      'Использую switch и не забываю про break и провал (fall-through)',
      'Знаю, что && и || возвращают один из операндов, а не true/false, и пользуюсь короткими вычислениями',
      'Выбираю ?? вместо || для значений по умолчанию, когда 0 и "" допустимы',
      'Безопасно читаю вложенные свойства через ?.',
    ],
    estMinutes: 25,
    lesson: {
      why: 'Ветвления превращают набор инструкций в программу, которая принимает решения. А операторы `??` и `?.` избавляют от целых лесов проверок `if (a && a.b && a.b.c)`.',
      brief:
        '`if (…) {…} else {…}`; `cond ? a : b`; `switch` сравнивает через `===` и «проваливается» без `break`. `a && b` вернёт `a`, если он falsy, иначе `b`; `a || b` — `a`, если он truthy, иначе `b`. `a ?? b` подставляет `b` только для `null`/`undefined`. `obj?.x` не падает на `null`/`undefined`.',
      standard: md(
        '**if / else if / else** проверяют условие, приведённое к булеву значению (truthy/falsy из прошлой темы). Выполняется ровно одна ветка — первая подходящая:',
        js`
          function grade(score) {
            if (score >= 90) return "A";
            else if (score >= 75) return "B";
            else return "C";
          }
          console.log(grade(80));   // B
        `,
        'Порядок веток важен: более узкое условие ставится раньше более широкого.',
        '**Тернарный оператор** `условие ? значениеЕслиДа : значениеЕслиНет` — это *выражение*, поэтому его удобно использовать внутри присваивания и шаблонной строки. Не вкладывайте несколько тернарников друг в друга — читается тяжело.',
        '**switch** сравнивает значение с `case` через `===` и выполняет код с первого совпавшего `case` **до `break`** — без него выполнение «проваливается» в следующие ветки:',
        js`
          function kind(day) {
            switch (day) {
              case "sat":
              case "sun":            // намеренный провал: два case на одну ветку
                return "выходной";
              default:
                return "будний";
            }
          }
          console.log(kind("sun"), kind("mon"));   // выходной будний
        `,
        '**&& и || возвращают операнд, а не булево значение.** `a && b` — если `a` falsy, вернёт `a`, иначе `b`. `a || b` — если `a` truthy, вернёт `a`, иначе `b`. Правый операнд при этом **не вычисляется**, если результат уже известен (*короткое вычисление*):',
        js`
          console.log(1 && 2);          // 2
          console.log(0 && 2);          // 0
          console.log(null || "гость"); // гость
          console.log("" || 0);         // 0
        `,
        '**?? (nullish coalescing)** — запасное значение только для `null` и `undefined`. В отличие от `||`, он не трогает `0`, `""` и `false`:',
        js`
          const volume = 0;
          console.log(volume || 50);   // 50 — ошибка: ноль потерян
          console.log(volume ?? 50);   // 0  — верно
        `,
        '**?. (optional chaining)** обрывает цепочку и возвращает `undefined`, если слева `null`/`undefined`: `user?.profile?.name`, `arr?.[0]`, `fn?.()`.',
      ),
      deep: md(
        '**Приоритет.** `&&` выполняется раньше `||`, а `??` нельзя смешивать с `&&`/`||` без скобок (SyntaxError): `a ?? b || c` — ошибка, нужно `(a ?? b) || c`.',
        '**Короткое вычисление и побочные эффекты.** Правая часть `&&`/`||`/`??` не вычисляется, если результат ясен по левой. Это основа идиом `cond && doSomething()` и `value ?? compute()`. Но для действий предпочтительнее обычный `if`: он читается как намерение.',
        '**Операторы присваивания с логикой:** `a ||= b`, `a &&= b`, `a ??= b` присваивают только при выполнении условия: `config.port ??= 8080` ставит значение по умолчанию, не трогая `0`.',
        '**Optional chaining и вызовы.** `obj.method?.()` вызовет метод, только если он существует. Короткое замыкание затрагивает всю оставшуюся цепочку: в `a?.b.c.d` при `a == null` выражение целиком вернёт `undefined`, не вычисляя `.b.c.d`. Не злоупотребляйте: `?.` скрывает ошибки там, где данные обязаны быть.',
        '**switch(true)** — известный приём для диапазонов: `switch (true) { case x < 0: … }`. Он работает, но обычная цепочка `if` читается проще.',
        '**Сравнение значений в switch использует `===`**, без приведения: `case "1"` не совпадёт с числом `1`. Для объектов сравниваются ссылки.',
        '**Условия и NaN:** `NaN` falsy, а любые сравнения с ним ложны (`NaN < 1`, `NaN > 1`, `NaN === NaN`). Ветка `else` может выполниться для `NaN` совершенно неожиданно — проверяйте его явно.',
      ),
      analogy:
        '`if` — развилка на дороге, где вы выбираете один путь. `&&` и `||` — турникеты: `&&` пропускает дальше, пока всё «да», и отдаёт последнее значение; `||` останавливается на первом «да».',
      example: {
        lang: 'javascript',
        code: c`
          function describe(user) {
            const name = user?.name ?? "гость";
            const role = user && user.admin ? "админ" : "пользователь";
            return \`\${name} — \${role}\`;
          }
          console.log(describe({ name: "Аня", admin: true }));
          console.log(describe({}));
          console.log(describe(null));
          const n = 7;
          switch (n % 3) {
            case 0:
              console.log("делится");
              break;
            case 1:
              console.log("остаток 1");
              break;
            default:
              console.log("остаток 2");
          }
        `,
        steps: [
          '`user?.name ?? "гость"`: если `user` — `null` или в нём нет имени, берём "гость"; иначе — имя.',
          '`user && user.admin ? … : …` — для `null` левая часть `&&` falsy, поэтому идёт ветка «пользователь».',
          'Шаблонная строка собирает результат; для `describe({})` имя берётся по умолчанию.',
          '`7 % 3` равно 1, поэтому в `switch` срабатывает `case 1`, `break` не даёт перейти в `default`.',
        ],
        output: c`
          Аня — админ
          гость — пользователь
          гость — пользователь
          остаток 1
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          const count = 0;
          const shown = count || "нет данных";
          console.log(shown);   // "нет данных" — но 0 это корректное значение!
        `,
        explain: '`||` заменяет любое falsy-значение, включая 0. Для «настоящего отсутствия» используйте `count ?? "нет данных"`.',
      },
      pitfalls: [
        'Забыть `break` в `switch`: выполнение «проваливается» в следующий `case`.',
        'Использовать `||` для значений по умолчанию, когда `0`, `""` или `false` — допустимые значения.',
        'Писать `if (x = 5)` вместо `if (x === 5)`: это присваивание, условие всегда истинно.',
        'Вкладывать тернарные операторы друг в друга — код становится нечитаемым; используйте `if` или таблицу значений.',
        'Опираться на `?.` там, где данные обязаны существовать: вы скроете настоящую ошибку и получите `undefined` далеко от источника проблемы.',
      ],
      sources: [
        { title: 'MDN — Control flow and error handling', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling' },
        { title: 'MDN — Nullish coalescing operator (??)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing' },
        { title: 'MDN — Optional chaining (?.)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining' },
        { title: 'MDN — switch', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch' },
      ],
    },
    misconceptions: [
      {
        id: 'logic-returns-boolean',
        title: '&& и || всегда возвращают true или false',
        explanation: 'Они возвращают один из операндов: `1 && 2` → `2`, `null || "x"` → `"x"`.',
        fix: 'Если нужен булев результат, оберните: `Boolean(a && b)` или `!!(a && b)`.',
      },
      {
        id: 'or-default-safe',
        title: '`||` — надёжный способ задать значение по умолчанию',
        explanation: '`||` заменяет любое falsy-значение, поэтому `0`, `""` и `false` теряются.',
        fix: 'Используйте `??`, который реагирует только на `null` и `undefined`.',
      },
      {
        id: 'switch-auto-break',
        title: 'switch сам выходит после выполненного case',
        explanation: 'Без `break` (или `return`) выполнение продолжается в следующие `case`, пока не встретит выход.',
        fix: 'Ставьте `break` в конце каждой ветки; пустой `case` для группировки — намеренный провал.',
      },
      {
        id: 'assign-in-condition',
        title: '`=` внутри условия сравнивает',
        explanation: '`if (x = 5)` присваивает 5 и всегда истинно. Сравнение — это `===`.',
        fix: 'Для сравнения используйте `===`; линтер ловит такие опечатки.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.conditions.1',
      skill: 'js.conditions',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа? Вспомните, что `&&`, `||` и `??` возвращают операнды.',
      code: c`
        console.log(1 && 2, 0 && 2, null || "x", "" || 0, 0 ?? 5, null ?? 5);
      `,
      answer: '2 0 x 0 0 5',
      explanation:
        '`1 && 2` → 2 (первый truthy, берём последний). `0 && 2` → 0 (первый falsy). `null || "x"` → "x". `"" || 0` → 0 (оба falsy — последний). `0 ?? 5` → 0, потому что `??` реагирует только на null/undefined.',
    },
    {
      id: 'js.conditions.2',
      skill: 'js.conditions',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет код?',
      code: c`
        const n = 2;
        switch (n) {
          case 1: console.log("one");
          case 2: console.log("two");
          case 3: console.log("three"); break;
          default: console.log("other");
        }
      `,
      options: [
        { text: 'two, затем three', correct: true, why: 'Совпал `case 2`; `break` нет, поэтому выполнение провалилось в `case 3`, где `break` остановил его.' },
        { text: 'Только two', why: '`switch` не завершается сам: без `break` он идёт дальше.', misconception: 'switch-auto-break' },
        { text: 'one, two, three', why: '`case 1` не совпал — выполнение начинается с совпавшего `case`, а не с начала.' },
        { text: 'two, three, other', why: '`break` в `case 3` прерывает `switch`, до `default` дело не дойдёт.' },
      ],
      explanation: '`switch` — это «прыжок» на совпавший `case` и далее по порядку до `break`. Поэтому `break` нужен в каждой ветке, если провал не задуман.',
    },
    {
      id: 'js.conditions.3',
      skill: 'js.conditions',
      kind: 'code',
      difficulty: 1,
      lang: 'javascript',
      prompt: 'Напишите функцию `grade(score)`: от 90 — `"A"`, от 75 — `"B"`, от 50 — `"C"`, иначе `"D"`.',
      starter: c`
        function grade(score) {
          // ваш код
        }
      `,
      solution: c`
        function grade(score) {
          if (score >= 90) return "A";
          if (score >= 75) return "B";
          if (score >= 50) return "C";
          return "D";
        }
      `,
      tests: [
        { expr: 'grade(95)', expect: '"A"' },
        { expr: 'grade(80)', expect: '"B"' },
        { expr: 'grade(60)', expect: '"C"' },
        { expr: 'grade(10)', expect: '"D"' },
        { expr: 'grade(90)', expect: '"A"', hidden: true, label: 'граница 90 включительно' },
        { expr: 'grade(75)', expect: '"B"', hidden: true, label: 'граница 75 включительно' },
        { expr: 'grade(49)', expect: '"D"', hidden: true, label: 'на единицу ниже порога' },
      ],
      hints: [
        'Какие значения попадают сразу в несколько условий? В каком порядке их проверять?',
        'Проверяйте от самого строгого порога к самому мягкому; границы включаются (`>=`).',
        'Цепочка `if … return` — после первого сработавшего return дальнейшие условия не проверяются.',
      ],
      explanation: 'Условия проверяются сверху вниз; `return` завершает функцию, поэтому достаточно идти от большего порога к меньшему.',
    },
    {
      id: 'js.conditions.4',
      skill: 'js.conditions',
      kind: 'code',
      difficulty: 2,
      diag: true,
      lang: 'javascript',
      prompt:
        'Напишите функцию `getName(user)`: вернуть `user.profile.name`, а если пользователя, профиля или имени нет (`null`/`undefined`) — `"Аноним"`. Пустая строка — допустимое имя.',
      starter: c`
        function getName(user) {
          // ваш код
        }
      `,
      solution: c`
        function getName(user) {
          return user?.profile?.name ?? "Аноним";
        }
      `,
      tests: [
        { expr: 'getName({ profile: { name: "Аня" } })', expect: '"Аня"' },
        { expr: 'getName({})', expect: '"Аноним"' },
        { expr: 'getName(null)', expect: '"Аноним"', hidden: true, label: 'сам user равен null' },
        { expr: 'getName({ profile: null })', expect: '"Аноним"', hidden: true, label: 'profile равен null' },
        { expr: 'getName({ profile: { name: "" } })', expect: '""', hidden: true, label: 'пустая строка — допустимое имя (?? не заменяет)' },
      ],
      hints: [
        'Как безопасно дойти до вложенного свойства, если промежуточное значение может быть null?',
        'Оператор `?.` прерывает цепочку и даёт `undefined`.',
        'Для запасного значения подойдёт `??`, а не `||` — иначе пустое имя будет заменено.',
      ],
      explanation: '`?.` защищает от `null`/`undefined` в середине цепочки, а `??` подставляет запасное значение только для них — пустая строка остаётся нетронутой.',
    },
    {
      id: 'js.conditions.5',
      skill: 'js.conditions',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt: 'Функция `label(code)` должна вернуть `"one"` для 1, `"two"` для 2 и `"many"` для остальных. Но `label(1)` возвращает не то. Найдите ошибку.',
      buggy: c`
        function label(code) {
          let r;
          switch (code) {
            case 1:
              r = "one";
            case 2:
              r = "two";
              break;
            default:
              r = "many";
          }
          return r;
        }
      `,
      solution: c`
        function label(code) {
          let r;
          switch (code) {
            case 1:
              r = "one";
              break;
            case 2:
              r = "two";
              break;
            default:
              r = "many";
          }
          return r;
        }
      `,
      tests: [
        { expr: 'label(1)', expect: '"one"' },
        { expr: 'label(2)', expect: '"two"' },
        { expr: 'label(5)', expect: '"many"', hidden: true, label: 'значение по умолчанию' },
        { expr: 'label("1")', expect: '"many"', hidden: true, label: 'строка "1" не равна числу 1 (сравнение ===)' },
      ],
      hints: [
        'Проследите по шагам, какие строки выполнятся при `code = 1`.',
        'После `r = "one"` нет выхода из `switch`.',
        'Добавьте `break;` после `r = "one";`.',
      ],
      explanation: 'Без `break` выполнение из `case 1` проваливается в `case 2` и перезаписывает `r`. Каждый «рабочий» `case` должен заканчиваться `break` или `return`.',
    },
    {
      id: 'js.conditions.6',
      skill: 'js.conditions',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: 'Функция `city(user)` должна вернуть город пользователя или `"неизвестно"`, но падает с TypeError, если у пользователя нет адреса. Исправьте.',
      buggy: c`
        function city(user) {
          return user.address.city || "неизвестно";
        }
      `,
      solution: c`
        function city(user) {
          return user.address?.city ?? "неизвестно";
        }
      `,
      tests: [
        { expr: 'city({ address: { city: "Омск" } })', expect: '"Омск"' },
        { expr: 'city({})', expect: '"неизвестно"' },
        { expr: 'city({ address: null })', expect: '"неизвестно"', hidden: true, label: 'адрес равен null' },
        { expr: 'city({ address: {} })', expect: '"неизвестно"', hidden: true, label: 'адрес есть, города нет' },
        { expr: 'city({ address: { city: "" } })', expect: '""', hidden: true, label: 'пустая строка не заменяется' },
      ],
      hints: [
        'Прочитайте ошибку: «Cannot read properties of undefined». Что именно равно undefined?',
        '`user.address` может отсутствовать — его нужно читать безопасно.',
        'Замените `.address.city` на `.address?.city`, а `||` на `??`, чтобы не потерять пустую строку.',
      ],
      explanation: 'Обращение к свойству у `undefined` — частый TypeError. `?.` прерывает цепочку, а `??` не подменяет «пустые, но валидные» значения.',
    },
    {
      id: 'js.conditions.7',
      skill: 'js.conditions',
      kind: 'predict',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Что выведет программа? Помните про приоритет операторов (`&&` сильнее `||`) и короткое вычисление.',
      code: c`
        function log(x) {
          console.log("call", x);
          return x;
        }
        const r = log(0) || log(2) && log(3);
        console.log(r);
      `,
      answer: c`
        call 0
        call 2
        call 3
        3
      `,
      explanation: 'Выражение читается как `log(0) || (log(2) && log(3))`. `log(0)` falsy → вычисляется правая часть; `log(2)` truthy → вычисляется `log(3)`, результат 3.',
    },
    {
      id: 'js.conditions.8',
      skill: 'js.conditions',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите функцию `fizz(n)`: кратное 15 → "FizzBuzz", кратное 3 → "Fizz", кратное 5 → "Buzz", иначе число строкой. Порядок проверок важен.',
      lines: [
        'function fizz(n) {',
        '  if (n % 15 === 0) return "FizzBuzz";',
        '  if (n % 3 === 0) return "Fizz";',
        '  if (n % 5 === 0) return "Buzz";',
        '  return String(n);',
        '}',
        'console.log(fizz(15), fizz(9), fizz(10), fizz(7));',
      ],
      distractors: ['  if (n % 3 = 0) return "Fizz";', '  if (n % 15 === 0) return "Fizz";'],
      tests: [{ stdout: 'FizzBuzz Fizz Buzz 7' }],
      explanation: 'Условие для 15 должно идти раньше условий для 3 и 5: иначе число 15 попало бы в первую подходящую, более широкую ветку.',
    },
    {
      id: 'js.conditions.9',
      skill: 'js.conditions',
      kind: 'explain',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Чем `??` отличается от `||` при задании значений по умолчанию? Приведите случай, где `||` даёт неверный результат.',
      code: c`
        const volume = 0;
        console.log(volume || 50, volume ?? 50);
      `,
      keyPoints: [
        '`||` заменяет любое falsy-значение: 0, "", false, NaN, null, undefined',
        '`??` заменяет только null и undefined',
        'Пример ошибки: громкость или счётчик равны 0, а `||` подставляет значение по умолчанию',
      ],
      modelAnswer:
        'Оператор `||` возвращает правый операнд, если левый — любое falsy-значение, а их восемь, включая `0`, `""` и `false`. Оператор `??` считает «пустыми» только `null` и `undefined`. Поэтому для `volume = 0` выражение `volume || 50` вернёт 50 и потеряет настоящий ноль, а `volume ?? 50` вернёт 0. Для значений по умолчанию, когда ноль или пустая строка допустимы, нужен `??`.',
      explanation: 'Выбор между `||` и `??` — вопрос о том, что считать «отсутствием значения». Обычно это только `null`/`undefined`.',
    },
  ],
};
