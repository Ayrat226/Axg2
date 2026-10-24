import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const errors: SkillModule = {
  skill: {
    id: 'js.errors',
    route: 'javascript',
    title: 'Ошибки и отладка',
    icon: '🩺',
    summary: 'Чтение сообщений об ошибках, throw, try/catch/finally, собственные классы ошибок и типичные TypeError.',
    prereqs: ['js.functions'],
    tier: 3,
    outcomes: [
      'Читаю сообщение об ошибке и определяю по нему причину (тип, строка, что именно было undefined)',
      'Использую try/catch/finally и знаю, когда finally выполняется',
      'Создаю собственные классы ошибок и оборачиваю ошибки с cause',
      'Различаю ожидаемые ошибки (их обрабатываем) и ошибки программиста (их не прячем)',
    ],
    estMinutes: 30,
    lesson: {
      why: 'Ошибки — нормальная часть разработки. Умение быстро прочитать сообщение и найти причину экономит больше времени, чем любая другая отладочная привычка.',
      brief:
        'Сообщение ошибки = тип + текст + место: `TypeError: Cannot read properties of undefined (reading \'name\')` — слева от точки было `undefined`. `throw new Error("…")` бросает, `try { } catch (e) { } finally { }` ловит; `finally` выполняется всегда. Свои ошибки — `class X extends Error`. Ловите только то, что умеете обработать.',
      standard: md(
        '**Анатомия ошибки.** У объекта `Error` есть `name` (тип), `message` (текст) и `stack` (путь вызовов). Основные встроенные типы:',
        '- `ReferenceError` — имя не объявлено или находится в TDZ (`x is not defined`, `Cannot access \'x\' before initialization`);\n- `TypeError` — неверный тип: `x is not a function`, `Cannot read properties of undefined (reading \'a\')`, `Assignment to constant variable.`;\n- `SyntaxError` — код (или JSON) нельзя разобрать;\n- `RangeError` — значение вне допустимого диапазона (`Invalid array length`, переполнение стека).',
        '**Как читать сообщение.** В `Cannot read properties of undefined (reading \'name\')` «undefined» — это то, что стоит **слева от точки**, а `name` — свойство, которое пытались прочитать. Ищите, откуда взялся `undefined`: пропущенный аргумент, пустой результат `find`, отсутствующее поле. В `arr.last is not a function` — у `arr` нет метода `last`.',
        '**throw и try/catch/finally:**',
        js`
          function parse(text) {
            try {
              return JSON.parse(text);
            } catch (e) {
              console.log("не JSON:", e.name);
              return null;
            } finally {
              console.log("готово");
            }
          }
          console.log(parse("{\\"a\\":1}"));
          console.log(parse("oops"));
        `,
        '`finally` выполняется **всегда** — после успешного `try`, после `catch` и даже после `return` внутри них. Подходит для освобождения ресурсов. Выбросить можно любое значение, но принято бросать `Error` (или его наследников) — у них есть `stack`.',
        '**Собственные ошибки.** Наследуйтесь от `Error` и задайте `name`: по типу можно отличать «ожидаемые» ошибки домена (`ValidationError`) от остальных:',
        js`
          class ValidationError extends Error {
            constructor(message, field) {
              super(message);
              this.name = "ValidationError";
              this.field = field;
            }
          }
          try {
            throw new ValidationError("Нужно имя", "name");
          } catch (e) {
            if (e instanceof ValidationError) console.log(e.field);   // name
            else throw e;   // чужую ошибку не прячем
          }
        `,
        '**Не прячьте ошибки.** Пустой `catch {}` превращает баг в тишину. Обрабатывайте то, что понимаете, остальное пробрасывайте (`throw e`). Чтобы добавить контекст, оборачивайте: `throw new Error("Не удалось загрузить конфиг", { cause: e })`.',
      ),
      deep: md(
        '**Что ловит `try/catch`.** Только синхронные ошибки внутри блока `try` (и в `await` внутри `async`-функции). Ошибка в колбэке `setTimeout` или в «забытом» промисе в `catch` не попадёт — для промисов нужен `.catch()` или `await` в `try` (см. тему про async).',
        '**Стек вызовов.** `error.stack` — строка со списком функций; формат зависит от движка. По стеку находят, откуда пришёл `undefined`. Не парсьте его в логике программы.',
        '**Optional catch binding.** Если объект ошибки не нужен, можно писать `catch { … }` без `(e)`.',
        '**`finally` и `return`.** Если в `finally` есть `return`, он перекрывает возврат и даже исключение из `try`/`catch` — так легко случайно «проглотить» ошибку. Не делайте `return` в `finally`.',
        '**`cause`.** `new Error(msg, { cause })` сохраняет исходную ошибку, образуя цепочку причин: оборачивание контекстом не теряет диагностику.',
        '**`AggregateError`** хранит несколько ошибок (`Promise.any`). **`DOMException`** используется в браузерных API. Бросать можно и не-`Error`, но у них не будет `stack` — это плохая практика.',
        '**Ошибки программиста и ожидаемые ошибки.** `TypeError`, `ReferenceError` обычно означают баг — исправляйте код, а не ловите. `ValidationError`, ошибка сети, невалидный ввод — ожидаемые: их проверяют и показывают пользователю понятное сообщение.',
        '**Отладка.** Рабочие приёмы: воспроизвести минимальный пример, `console.log` значений перед падением, проверить типы (`typeof`, `Array.isArray`), в браузере — `debugger` и точки останова.',
      ),
      analogy:
        'Ошибка — как аварийная кнопка на станке: `throw` нажимает её, `try/catch` — дежурный, который решает, что делать, а `finally` — уборка рабочего места, которая происходит в любом случае.',
      example: {
        lang: 'javascript',
        code: c`
          class ValidationError extends Error {
            constructor(message, field) {
              super(message);
              this.name = "ValidationError";
              this.field = field;
            }
          }
          function parseUser(json) {
            let data;
            try {
              data = JSON.parse(json);
            } catch (err) {
              throw new Error("Некорректный JSON", { cause: err });
            }
            if (typeof data.name !== "string") throw new ValidationError("Нужно имя", "name");
            return data;
          }
          for (const input of ['{"name":"Аня"}', "{", "{}"]) {
            try {
              console.log("OK:", parseUser(input).name);
            } catch (e) {
              console.log(e.name + ": " + e.message);
            } finally {
              console.log("--");
            }
          }
        `,
        steps: [
          '`ValidationError` расширяет `Error`: вызывает `super(message)` и добавляет `name` и `field`.',
          '`parseUser` оборачивает ошибку разбора JSON в понятную ошибку с `cause`, а структурную проверку выполняет сама.',
          'Для корректного входа выводится имя; для `"{"` — "Error: Некорректный JSON"; для `"{}"` — "ValidationError: Нужно имя".',
          '`finally` печатает разделитель в каждом из трёх случаев.',
        ],
        output: c`
          OK: Аня
          --
          Error: Некорректный JSON
          --
          ValidationError: Нужно имя
          --
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          function readAge(data) {
            try {
              return Number(data.age);
            } catch (e) {
              // пусто: любая ошибка, включая баги, исчезает
            }
          }
          console.log(readAge(null));   // undefined — ошибка проглочена
        `,
        explain: 'Пустой `catch` скрыл TypeError из-за `null.age`. Баг не исчез — он превратился в `undefined`, который «взорвётся» далеко от настоящей причины.',
      },
      pitfalls: [
        'Пустой `catch`, подавляющий все ошибки подряд — баги становятся невидимыми.',
        'Считать, что `try/catch` перехватит ошибку в колбэке `setTimeout` или в забытом промисе.',
        'Использовать `return` внутри `finally` — он перекроет и результат, и исключение.',
        'Бросать строки (`throw "oops"`): нет `stack` и нельзя проверить `instanceof Error`.',
        'Не задать `name` у собственной ошибки: в логе останется «Error», и по имени её не отличить.',
        'Обращаться к вложенному свойству без проверки: `Cannot read properties of undefined` почти всегда означает пропущенные данные.',
      ],
      sources: [
        { title: 'MDN — Error', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error' },
        { title: 'MDN — try...catch', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch' },
        { title: 'MDN — JavaScript error reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors' },
        { title: 'MDN — Error: cause', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause' },
      ],
    },
    misconceptions: [
      {
        id: 'property-is-undefined',
        title: 'В «Cannot read properties of undefined (reading x)» undefined — это свойство x',
        explanation: '`undefined` — значение **слева от точки** (объект, у которого читали свойство `x`). Само свойство тут ни при чём.',
        fix: 'Найдите, откуда взялся `undefined` перед точкой: аргумент, результат `find`, отсутствующее поле.',
      },
      {
        id: 'finally-skipped',
        title: 'После return в try блок finally не выполняется',
        explanation: '`finally` выполняется всегда: после `try`, после `catch` и даже после `return` в них.',
        fix: 'Используйте `finally` для гарантированных действий (закрыть ресурс, снять флаг).',
      },
      {
        id: 'catch-everything',
        title: 'Хороший код ловит все ошибки',
        explanation: 'Перехват всех подряд прячет баги. Ловить нужно то, что вы умеете обработать; остальное пробрасывают.',
        fix: 'Проверяйте тип (`instanceof`) и делайте `throw e` для незнакомых ошибок.',
      },
      {
        id: 'try-catches-async',
        title: 'try/catch ловит ошибки из отложенных колбэков',
        explanation: 'Колбэк `setTimeout` выполняется после завершения блока `try`, поэтому его ошибки `catch` не видит.',
        fix: 'Обрабатывайте ошибки внутри колбэка или используйте промисы с `.catch`/`await`.',
      },
    ],
  },
  exercises: [
    {
      id: 'js.errors.1',
      skill: 'js.errors',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        try {
          console.log("a");
          null.x;
          console.log("b");
        } catch (e) {
          console.log(e.name);
        } finally {
          console.log("c");
        }
      `,
      answer: c`
        a
        TypeError
        c
      `,
      explanation: 'Строка с `null.x` бросает TypeError, остаток `try` пропускается ("b" не печатается), `catch` печатает имя ошибки, `finally` выполняется всегда.',
    },
    {
      id: 'js.errors.2',
      skill: 'js.errors',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что означает сообщение `TypeError: Cannot read properties of undefined (reading \'name\')`?',
      options: [
        { text: 'Значение слева от точки равно undefined — у него пытались прочитать свойство name', correct: true, why: 'Читать свойство у `undefined` нельзя; ищите, откуда взялся `undefined` перед точкой.' },
        { text: 'Свойство name существует, но его значение undefined', why: 'Чтение свойства со значением `undefined` ошибки не вызывает — оно просто вернёт `undefined`.', misconception: 'property-is-undefined' },
        { text: 'Переменная name не объявлена', why: 'Для необъявленной переменной ошибка другая: `ReferenceError: name is not defined`.' },
        { text: 'Функция name вызвана с неверными аргументами', why: 'Речь о чтении свойства, а не о вызове функции.' },
      ],
      explanation: 'Формат сообщения: «читаем свойство X у undefined/null». Причина всегда в том, что выражение слева от точки оказалось пустым.',
    },
    {
      id: 'js.errors.3',
      skill: 'js.errors',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Когда выполняется `finally` и что происходит с `return`?',
      code: c`
        function f() {
          try {
            return "try";
          } finally {
            console.log("finally");
          }
        }
        console.log(f());
        function g() {
          try {
            throw new Error("x");
          } catch (e) {
            return "catch";
          } finally {
            return "finally";
          }
        }
        console.log(g());
      `,
      answer: c`
        finally
        try
        finally
      `,
      explanation: 'В `f` выражение `return "try"` вычисляется, затем выполняется `finally`, и только после этого функция возвращает значение. В `g` `return` внутри `finally` перекрывает `return` из `catch` — поэтому так делать не стоит.',
    },
    {
      id: 'js.errors.4',
      skill: 'js.errors',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Напишите функцию `safeParse(text)`: возвращает результат `JSON.parse(text)`, а если текст — не корректный JSON, возвращает `null`.',
      starter: c`
        function safeParse(text) {
          // ваш код
        }
      `,
      solution: c`
        function safeParse(text) {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        }
      `,
      tests: [
        { expr: 'safeParse("{\\"a\\":1}")', expect: '({ a: 1 })' },
        { expr: 'safeParse("oops")', expect: 'null' },
        { expr: 'safeParse("")', expect: 'null', hidden: true, label: 'пустая строка — не JSON' },
        { expr: 'safeParse("[1, 2]")', expect: '[1, 2]', hidden: true, label: 'корректный массив' },
        { expr: 'safeParse("{bad: 1}")', expect: 'null', hidden: true, label: 'ключ без кавычек' },
      ],
      hints: [
        'Что делает `JSON.parse` с некорректным текстом?',
        'Оберните вызов в `try … catch`.',
        'В `catch` верните `null`.',
      ],
      explanation: '`JSON.parse` бросает `SyntaxError` для некорректного JSON. Здесь ошибка ожидаема, поэтому её уместно перехватить и заменить значением `null`.',
    },
    {
      id: 'js.errors.5',
      skill: 'js.errors',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Напишите класс `ValidationError` (наследник `Error`, имя `"ValidationError"`, поле `field`) и функцию `validateAge(age)`: возвращает `age`, если это целое число от 0 до 150, иначе бросает `ValidationError` с `field = "age"`.',
      starter: c`
        class ValidationError extends Error {
          // ваш код
        }
        function validateAge(age) {
          // ваш код
        }
      `,
      solution: c`
        class ValidationError extends Error {
          constructor(message, field) {
            super(message);
            this.name = "ValidationError";
            this.field = field;
          }
        }
        function validateAge(age) {
          if (!Number.isInteger(age) || age < 0 || age > 150) {
            throw new ValidationError("Некорректный возраст", "age");
          }
          return age;
        }
      `,
      tests: [
        { expr: 'validateAge(30)', expect: '30' },
        { expr: '(() => { try { validateAge(-1); return "нет ошибки"; } catch (e) { return [e instanceof ValidationError, e instanceof Error, e.name, e.field]; } })()', expect: '[true, true, "ValidationError", "age"]' },
        { expr: 'validateAge(0)', expect: '0', hidden: true, label: 'граница 0 допустима' },
        { expr: 'validateAge(150)', expect: '150', hidden: true, label: 'граница 150 допустима' },
        { expr: '(() => { try { validateAge(151); return "нет ошибки"; } catch (e) { return e.name; } })()', expect: '"ValidationError"', hidden: true, label: '151 — вне диапазона' },
        { expr: '(() => { try { validateAge(1.5); return "нет ошибки"; } catch (e) { return e.name; } })()', expect: '"ValidationError"', hidden: true, label: 'дробное число' },
        { expr: '(() => { try { validateAge("30"); return "нет ошибки"; } catch (e) { return e.name; } })()', expect: '"ValidationError"', hidden: true, label: 'строка вместо числа' },
      ],
      hints: [
        'Класс ошибки начинается с `extends Error`. Что нужно вызвать в конструкторе?',
        '`super(message)`, затем задайте `this.name` и `this.field`.',
        'Для проверки подходит `Number.isInteger(age)` — он вернёт `false` для строк и дробей.',
      ],
      explanation: '`Number.isInteger` не приводит типы, поэтому отсекает и строки, и дроби. Собственный класс ошибки позволяет вызывающему коду отличить ошибку валидации от прочих через `instanceof`.',
    },
    {
      id: 'js.errors.6',
      skill: 'js.errors',
      kind: 'fix',
      difficulty: 1,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: '`lastItem(arr)` должна вернуть последний элемент массива (или `undefined` для пустого), но падает с TypeError. Прочитайте сообщение и исправьте.',
      buggy: c`
        function lastItem(arr) {
          return arr.last();
        }
      `,
      solution: c`
        function lastItem(arr) {
          return arr.at(-1);
        }
      `,
      tests: [
        { expr: 'lastItem([1, 2, 3])', expect: '3' },
        { expr: 'lastItem(["a"])', expect: '"a"' },
        { expr: 'lastItem([])', expect: 'undefined', hidden: true, label: 'пустой массив' },
        { expr: 'lastItem([0, 0])', expect: '0', hidden: true, label: 'последний элемент — ноль' },
      ],
      hints: [
        'Сообщение: «arr.last is not a function». Есть ли у массива метод `last`?',
        'У массивов нет метода `last`; нужен способ взять элемент с конца.',
        '`arr.at(-1)` возвращает последний элемент или `undefined`.',
      ],
      explanation: '«X is not a function» значит, что вызываемое значение не функция (здесь метода `last` нет). Для последнего элемента подходит `arr.at(-1)`.',
    },
    {
      id: 'js.errors.7',
      skill: 'js.errors',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'logic',
      prompt:
        '`readAge(data)` должна возвращать `null` для нечислового возраста (`RangeError`), но **не** прятать ошибки программиста вроде `readAge(null)` (TypeError). Сейчас `catch` подавляет всё подряд.',
      buggy: c`
        function readAge(data) {
          try {
            const n = Number(data.age);
            if (Number.isNaN(n)) throw new RangeError("age is not a number");
            return n;
          } catch (e) {
            return null;
          }
        }
      `,
      solution: c`
        function readAge(data) {
          try {
            const n = Number(data.age);
            if (Number.isNaN(n)) throw new RangeError("age is not a number");
            return n;
          } catch (e) {
            if (e instanceof RangeError) return null;
            throw e;
          }
        }
      `,
      tests: [
        { expr: 'readAge({ age: "5" })', expect: '5' },
        { expr: 'readAge({ age: "x" })', expect: 'null' },
        { expr: '(() => { try { readAge(null); return "проглочено"; } catch (e) { return e.name; } })()', expect: '"TypeError"', hidden: true, label: 'ошибка программиста (TypeError) не должна подавляться' },
        { expr: 'readAge({ age: 0 })', expect: '0', hidden: true, label: 'возраст 0 — допустимое число' },
      ],
      hints: [
        'Какие ошибки может поймать этот `catch`, кроме ожидаемой `RangeError`?',
        'Обработайте только тот тип, который знаете, а остальное бросьте дальше.',
        'В `catch`: `if (e instanceof RangeError) return null; throw e;`.',
      ],
      explanation: 'Перехват всех ошибок прячет баги. Правило: ловите конкретные, ожидаемые ошибки и пробрасывайте (`throw e`) всё остальное.',
    },
    {
      id: 'js.errors.8',
      skill: 'js.errors',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите программу: собственная ошибка бросается, перехватывается и проверяется по типу, а `finally` печатает "done".',
      lines: [
        'class AppError extends Error {}',
        'function risky() {',
        '  throw new AppError("boom");',
        '}',
        'try {',
        '  risky();',
        '} catch (e) {',
        '  console.log(e instanceof AppError, e.message);',
        '} finally {',
        '  console.log("done");',
        '}',
      ],
      distractors: ['} finally (e) {', '  throw "boom";'],
      tests: [{ stdout: 'true boom\ndone' }],
      explanation: '`catch` получает объект ошибки; `finally` не принимает параметров. Бросать лучше экземпляры `Error`, а не строки — у строки нет `instanceof AppError` и `message`.',
    },
    {
      id: 'js.errors.9',
      skill: 'js.errors',
      kind: 'predict',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Что выведет программа? Как работает `cause`?',
      code: c`
        try {
          try {
            JSON.parse("{");
          } catch (err) {
            throw new Error("Конфиг повреждён", { cause: err });
          }
        } catch (e) {
          console.log(e.message, "|", e.cause.name, "|", e instanceof Error);
        }
      `,
      answer: 'Конфиг повреждён | SyntaxError | true',
      explanation: 'Внутренний `catch` оборачивает `SyntaxError` в новую ошибку и сохраняет исходную в `cause`. Внешний `catch` видит и понятное сообщение, и первопричину.',
    },
    {
      id: 'js.errors.10',
      skill: 'js.errors',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Почему плохо писать `catch (e) {}` с пустым телом? Как правильно решать, какие ошибки ловить?',
      keyPoints: [
        'Пустой catch скрывает баги: программа продолжает работу с неверными данными',
        'Ловить нужно ожидаемые ошибки, которые вы умеете обработать (например, невалидный ввод)',
        'Незнакомые ошибки пробрасывают дальше (`throw e`)',
        'Собственные классы ошибок и instanceof позволяют различать типы ошибок',
      ],
      modelAnswer:
        'Пустой `catch` проглатывает любые ошибки, включая настоящие баги вроде TypeError, и программа дальше работает с неверным состоянием — диагностировать причину потом очень трудно. Я ловлю только ожидаемые ошибки (некорректный ввод, ответ сервера), для которых знаю, что делать. Тип ошибки проверяю через `instanceof` (для этого удобны собственные классы ошибок), а всё остальное пробрасываю дальше командой `throw e` или оборачиваю в новую ошибку с `cause`.',
      explanation: 'Ошибки — это информация. Хорошая обработка не подавляет её, а превращает в понятное действие или сообщение.',
    },
  ],
};
