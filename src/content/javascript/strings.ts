import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const strings: SkillModule = {
  skill: {
    id: 'js.strings',
    route: 'javascript',
    title: 'Строки',
    icon: '🔤',
    summary: 'Методы строк, неизменяемость, slice/substring, split/join, padStart, includes и основы Unicode.',
    prereqs: ['js.types'],
    tier: 1,
    outcomes: [
      'Помню, что строки неизменяемы и методы возвращают новую строку',
      'Выбираю между slice и substring и понимаю отрицательные индексы',
      'Разбиваю и собираю текст через split/join, выравниваю через padStart/padEnd',
      'Ищу подстроки через includes/startsWith/indexOf и не путаю индекс 0 с «не найдено»',
      'Понимаю, что length считает кодовые единицы UTF-16, и умею итерировать по символам',
    ],
    estMinutes: 25,
    lesson: {
      why: 'Почти любые данные приходят в программу текстом: ввод пользователя, JSON, URL, файлы. Строковые методы — самый частый инструмент повседневного кода.',
      brief:
        'Строки неизменяемы: `s.toUpperCase()` возвращает новую строку, `s` не меняется. `slice(from, to)` понимает отрицательные индексы. `split(sep)` режет в массив, `join(sep)` склеивает обратно. `padStart(n, "0")` дополняет слева. `indexOf` возвращает -1, если не нашёл, — а 0 бывает валидным результатом.',
      standard: md(
        '**Строка — неизменяемая последовательность** символов. Любой «изменяющий» метод возвращает новую строку, а старая остаётся прежней:',
        js`
          const s = "hello";
          const t = s.toUpperCase();
          console.log(s, t);   // hello HELLO
          // s[0] = "J";       // в строгом режиме — TypeError, строку менять нельзя
        `,
        '**Доступ и длина.** `s.length`, `s[0]`, `s.at(-1)` (последний символ), `s.charAt(0)` (пустая строка вместо `undefined`, если индекс вне диапазона).',
        '**Вырезание.** `s.slice(start, end)` — от `start` до `end` **не включая** `end`; отрицательные индексы отсчитываются с конца. `substring` похож, но отрицательные значения считает нулём и меняет аргументы местами, если `start > end` — поэтому проще всегда использовать `slice`.',
        js`
          const w = "abcdef";
          console.log(w.slice(1, 3));    // bc
          console.log(w.slice(-2));      // ef
          console.log(w.substring(-2));  // abcdef — отрицательное стало 0
        `,
        '**Поиск.** `includes("x")` → `true/false`, `startsWith`, `endsWith`, `indexOf("x")` → индекс или `-1`. Не пишите `if (s.indexOf("a"))`: индекс 0 — это *ложь*, а «не найдено» (-1) — *истина*.',
        '**Разбиение и сборка.** `"a-b-c".split("-")` → `[ "a", "b", "c" ]`, `["a", "b"].join("+")` → `"a+b"`. Пустой разделитель режет на отдельные единицы: `"abc".split("")`.',
        '**Замена.** `replace("-", "+")` заменяет **только первое** вхождение (если первый аргумент — строка), `replaceAll` — все.',
        '**Форматирование.** `trim()`, `toUpperCase()`, `toLowerCase()`, `repeat(n)`, `padStart(width, fill)` и `padEnd`. Типичный пример — время:',
        js`
          const hh = String(7).padStart(2, "0");
          const mm = String(5).padStart(2, "0");
          console.log(\`\${hh}:\${mm}\`);   // 07:05
        `,
      ),
      deep: md(
        '**Внутри — UTF-16.** Строка JavaScript — последовательность 16-битных кодовых единиц. Символы вне базовой плоскости (многие эмодзи, редкие иероглифы) занимают две единицы — «суррогатную пару». Поэтому `"😀".length === 2`, а `"😀"[0]` — «половинка» символа. Итерация `for…of` и spread `[..."😀"]` работают по **кодовым точкам**, и `[..."😀"].length === 1`.',
        '**Составные символы.** Даже кодовая точка — не всегда то, что человек считает «буквой»: `"é"` может быть одной точкой (U+00E9) или `e` + combining accent (U+0065 U+0301). `"é".normalize("NFC")` приводит строки к единой форме перед сравнением. Для графем (то, что видит пользователь) есть `Intl.Segmenter`.',
        '**Сравнение и сортировка.** `a < b` сравнивает по кодовым единицам, а не по алфавиту языка. Для человеческой сортировки есть `a.localeCompare(b, "ru")`. Регистр без учёта локали лучше обрабатывать через `toLocaleLowerCase`.',
        '**Производительность.** Конкатенация в цикле (`s += x`) в современных движках оптимизирована (строки-«верёвки»), но для больших объёмов накопление в массив и `join` остаётся чистым и предсказуемым вариантом.',
        '**Строка-примитив и объект.** `"abc".length` работает, потому что движок временно оборачивает примитив в `String` — поэтому присвоить свойство строке нельзя (в строгом режиме — TypeError). Конструктор `new String("a")` создаёт объект и почти всегда не нужен.',
        '**Экранирование.** `\\n` — перевод строки, `\\t` — табуляция, `\\\\` — обратная косая, `\\u{1F600}` — кодовая точка Unicode. В шаблонных строках переносы строки можно писать буквально.',
      ),
      analogy:
        'Строка — как напечатанная на бумаге фраза: вы не можете поправить букву, но можете напечатать новую фразу на основе старой. Методы строки — это «ксерокс с правками».',
      example: {
        lang: 'javascript',
        code: c`
          const raw = "  Hello, World  ";
          const clean = raw.trim();
          console.log(clean.toUpperCase(), clean.length);
          console.log(clean.slice(0, 5), clean.slice(-5));
          console.log(clean.split(", "));
          console.log(clean.includes("World"), clean.indexOf("o"));
          console.log("7".padStart(3, "0"), clean.at(-1));
        `,
        steps: [
          '`trim()` вернул новую строку без пробелов по краям; `raw` не изменилась.',
          '`slice(0, 5)` берёт символы с индексами 0–4, а `slice(-5)` — последние пять.',
          '`split(", ")` разрезал строку по разделителю в массив из двух слов.',
          '`indexOf("o")` вернул индекс первого вхождения (4), `includes` — булев результат.',
          '`padStart(3, "0")` дополнил "7" нулями слева до длины 3; `at(-1)` взял последний символ.',
        ],
        output: c`
          HELLO, WORLD 12
          Hello World
          [ 'Hello', 'World' ]
          true 4
          007 d
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          let s = "hello";
          s.toUpperCase();
          console.log(s);   // hello — результат выброшен
        `,
        explain: 'Метод вернул новую строку, но мы её не сохранили. Правильно: `s = s.toUpperCase()` или `const t = s.toUpperCase()`.',
      },
      pitfalls: [
        'Вызвать `s.toUpperCase()` и не использовать результат: строка не изменится.',
        'Писать `if (s.indexOf("x"))`: индекс 0 ложен, а -1 истинен. Используйте `includes` или сравнение `!== -1`.',
        'Рассчитывать, что `replace("-", "+")` заменит все вхождения — только первое; нужен `replaceAll` или регулярное выражение с флагом `g`.',
        'Считать `length` числом «букв»: для эмодзи и некоторых символов это число кодовых единиц.',
        '`charAt(i)` для выхода за границы вернёт `""`, а `s[i]` — `undefined`: ветвление по результату зависит от того, что вы использовали.',
      ],
      sources: [
        { title: 'MDN — String', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String' },
        { title: 'MDN — String.prototype.slice()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice' },
        { title: 'MDN — String.prototype.padStart()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart' },
        { title: 'MDN — JavaScript strings (guide)', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Strings' },
      ],
    },
    misconceptions: [
      {
        id: 'strings-mutable',
        title: 'Методы строки меняют саму строку',
        explanation: '`s.toUpperCase()`, `s.trim()` и другие возвращают **новую** строку. Исходная не меняется — строки неизменяемы.',
        fix: 'Сохраняйте результат: `s = s.trim()` или `const t = s.trim()`.',
      },
      {
        id: 'slice-negative',
        title: 'substring и slice одинаково работают с отрицательными индексами',
        explanation: '`slice(-3)` отсчитывает с конца, а `substring(-3)` считает отрицательное число нулём и вернёт всю строку.',
        fix: 'Используйте `slice` — у него предсказуемое поведение.',
      },
      {
        id: 'replace-all-default',
        title: '`replace` заменяет все вхождения',
        explanation: 'Со строковым шаблоном `replace` заменяет только первое вхождение.',
        fix: 'Применяйте `replaceAll` (или регулярное выражение с флагом `g`).',
      },
      {
        id: 'indexof-boolean',
        title: '`indexOf` возвращает true/false',
        explanation: '`indexOf` возвращает индекс или -1. Индекс 0 — «ложь» в условии, а -1 — «истина».',
        fix: 'Для проверки наличия используйте `includes` или `indexOf(...) !== -1`.',
      },
      {
        id: 'length-is-chars',
        title: '`length` — это число символов',
        explanation: '`length` считает кодовые единицы UTF-16. Эмодзи вроде 😀 дают 2.',
        fix: 'Для подсчёта кодовых точек используйте `[...s].length`, для графем — `Intl.Segmenter`.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.strings.1',
      skill: 'js.strings',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        const s = "hello";
        const t = s.toUpperCase();
        console.log(s, t, s.length);
      `,
      answer: 'hello HELLO 5',
      explanation: 'Строки неизменяемы: `toUpperCase` возвращает новую строку, а `s` остаётся прежней.',
    },
    {
      id: 'js.strings.2',
      skill: 'js.strings',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что вернёт выражение?',
      code: c`
        "abcdef".slice(-3)
      `,
      options: [
        { text: '"def"', correct: true, why: '`slice` с отрицательным индексом отсчитывает от конца: последние три символа.' },
        { text: '"abcdef"', why: 'Так ведёт себя `substring(-3)` — отрицательное становится нулём. У `slice` иначе.', misconception: 'slice-negative' },
        { text: '"abc"', why: 'Первые три символа получились бы при `slice(0, 3)`.' },
        { text: '"cde"', why: 'Это был бы срез `slice(2, 5)`.' },
      ],
      explanation: '`slice(-3)` = «начиная с третьего символа с конца до конца строки». Это самый удобный способ взять хвост строки.',
    },
    {
      id: 'js.strings.3',
      skill: 'js.strings',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Чем отличаются `replace` и `replaceAll`?',
      code: c`
        console.log("a-b-c".split("-"));
        console.log("a-b-c".replace("-", "+"));
        console.log("a-b-c".replaceAll("-", "+"));
      `,
      answer: c`
        [ 'a', 'b', 'c' ]
        a+b-c
        a+b+c
      `,
      explanation: '`split` вернул массив из трёх строк. `replace` со строковым образцом заменил только первое `-`, а `replaceAll` — оба.',
    },
    {
      id: 'js.strings.4',
      skill: 'js.strings',
      kind: 'code',
      difficulty: 2,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `formatTime(h, m)`, которая возвращает время в формате `ЧЧ:ММ` с ведущими нулями: `formatTime(9, 5)` → `"09:05"`.',
      starter: c`
        function formatTime(h, m) {
          // ваш код
        }
      `,
      solution: c`
        function formatTime(h, m) {
          return \`\${String(h).padStart(2, "0")}:\${String(m).padStart(2, "0")}\`;
        }
      `,
      tests: [
        { expr: 'formatTime(9, 5)', expect: '"09:05"' },
        { expr: 'formatTime(12, 30)', expect: '"12:30"' },
        { expr: 'formatTime(0, 0)', expect: '"00:00"', hidden: true, label: 'полночь' },
        { expr: 'formatTime(23, 59)', expect: '"23:59"', hidden: true, label: 'двузначные значения не меняются' },
        { expr: 'formatTime(7, 45)', expect: '"07:45"', hidden: true, label: 'только часы с нулём' },
      ],
      hints: [
        'Нужен метод, который дополняет строку до заданной длины. Он есть только у строк, не у чисел.',
        'Сначала превратите число в строку: `String(h)`.',
        '`String(h).padStart(2, "0")` — и то же для минут; соедините через двоеточие.',
      ],
      explanation: '`padStart` определён для строк, поэтому число сначала преобразуют через `String()`. Двузначные значения метод не трогает.',
    },
    {
      id: 'js.strings.5',
      skill: 'js.strings',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Напишите функцию `capitalize(s)`: первая буква заглавная, остальные строчные. Для пустой строки вернуть пустую строку.',
      starter: c`
        function capitalize(s) {
          // ваш код
        }
      `,
      solution: c`
        function capitalize(s) {
          return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        }
      `,
      tests: [
        { expr: 'capitalize("hELLO")', expect: '"Hello"' },
        { expr: 'capitalize("js")', expect: '"Js"' },
        { expr: 'capitalize("")', expect: '""', hidden: true, label: 'пустая строка' },
        { expr: 'capitalize("a")', expect: '"A"', hidden: true, label: 'один символ' },
        { expr: 'capitalize("привет")', expect: '"Привет"', hidden: true, label: 'кириллица' },
      ],
      hints: [
        'Что вернёт `s[0]` для пустой строки? Что вернёт `s.charAt(0)`?',
        'Возьмите первый символ и приведите к верхнему регистру, остальное — `slice(1)` — к нижнему.',
        '`s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()`.',
      ],
      explanation: '`s[0]` для пустой строки — `undefined`, и вызов `.toUpperCase()` упал бы. `charAt(0)` вернёт `""`, `slice(1)` тоже — код работает на любых строках.',
    },
    {
      id: 'js.strings.6',
      skill: 'js.strings',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'logic',
      prompt:
        'Функция `isPalindrome(s)` должна возвращать `true`, если строка читается одинаково в обе стороны **без учёта регистра и пробелов**. Сейчас она работает только для простых слов. Исправьте.',
      buggy: c`
        function isPalindrome(s) {
          return s === s.split("").reverse().join("");
        }
      `,
      solution: c`
        function isPalindrome(s) {
          const t = s.toLowerCase().replaceAll(" ", "");
          return t === t.split("").reverse().join("");
        }
      `,
      tests: [
        { expr: 'isPalindrome("level")', expect: 'true' },
        { expr: 'isPalindrome("hello")', expect: 'false' },
        { expr: 'isPalindrome("Race car")', expect: 'true', hidden: true, label: 'регистр и пробел' },
        { expr: 'isPalindrome("А роза упала на лапу Азора")', expect: 'true', hidden: true, label: 'фраза-перевёртыш на кириллице' },
        { expr: 'isPalindrome("")', expect: 'true', hidden: true, label: 'пустая строка' },
      ],
      hints: [
        'Запустите с "Race car": какие две строки сравниваются?',
        'Перед сравнением нужно привести строку к единому виду: регистр и пробелы.',
        'Сохраните нормализованную строку `t` и сравните `t` с её же перевёрнутой версией. Для пробелов — `replaceAll(" ", "")`.',
      ],
      explanation: 'Сравнивать нужно нормализованную строку с её перевёрнутой копией. `replace(" ", "")` убрал бы только первый пробел — нужен `replaceAll`.',
    },
    {
      id: 'js.strings.7',
      skill: 'js.strings',
      kind: 'predict',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Что выведет программа? Обратите внимание на эмодзи: из скольких кодовых единиц UTF-16 он состоит?',
      code: c`
        console.log("😀".length, [..."😀"].length, "abc".at(-1), "abc".indexOf("z"));
      `,
      answer: '2 1 c -1',
      explanation: 'Эмодзи 😀 — суррогатная пара (две кодовые единицы), поэтому `length` равен 2, а spread разбивает строку по кодовым точкам (1). `at(-1)` берёт последний символ, `indexOf` без совпадения даёт -1.',
    },
    {
      id: 'js.strings.8',
      skill: 'js.strings',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу, которая выводит число слов в строке с лишними пробелами и затем слова через дефис.',
      lines: [
        'const text = "  раз два  три  ";',
        'const words = text.trim().split(/\\s+/);',
        'console.log(words.length);',
        'console.log(words.join("-"));',
      ],
      distractors: ['const words = text.split(" ");', 'console.log(words.concat("-"));'],
      tests: [{ stdout: '3\nраз-два-три' }],
      explanation: '`trim()` убирает края, `split(/\\s+/)` режет по любому числу пробелов. `split(" ")` оставил бы пустые строки между двойными пробелами.',
    },
    {
      id: 'js.strings.9',
      skill: 'js.strings',
      kind: 'explain',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Объясните, что значит «строки неизменяемы» и как это влияет на то, как вы пишете код. Приведите пример ошибки, которую это вызывает.',
      code: c`
        let s = "hello";
        s.toUpperCase();
        console.log(s);
      `,
      keyPoints: [
        'Строку нельзя изменить на месте: все методы возвращают новую строку',
        'Результат метода нужно сохранить в переменную или вернуть',
        'Присваивание s[0] = "J" не работает (в строгом режиме — TypeError)',
      ],
      modelAnswer:
        'Неизменяемость значит, что содержимое строки нельзя поправить «на месте». Методы вроде `toUpperCase`, `trim`, `replace` создают и возвращают новую строку, а исходная остаётся прежней. Поэтому вызов `s.toUpperCase()` без сохранения результата ничего не меняет — в примере выведется `hello`. Нужно писать `s = s.toUpperCase()` или использовать результат сразу.',
      explanation: 'Это свойство всех примитивов в JavaScript. Оно делает код предсказуемым: строка, переданная в функцию, не может быть испорчена снаружи.',
    },
  ],
};
