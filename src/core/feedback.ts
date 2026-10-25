// Error and wrong-answer explanations. Rule-based and deterministic (no AI guessing): each rule maps an
// error pattern to the likely mistaken assumption, steps to fix it independently, and Socratic questions.
// Output is shaped by learner preferences: depth (brief/standard/deep) and tone (friendly/neutral/socratic).
import type { Lang } from './types';
import type { RunError, TestResult } from '../runner/types';

export type FeedbackDepth = 'brief' | 'standard' | 'deep';
export type FeedbackTone = 'friendly' | 'neutral' | 'socratic';
export type TermsStyle = 'ru' | 'ru+en' | 'en-first';
export interface FeedbackPrefs {
  depth: FeedbackDepth;
  tone: FeedbackTone;
  showTerms: boolean;
  /** How a term is written: Russian only, Russian with the English equivalent, or English first. */
  termsStyle?: TermsStyle;
  /** Show the guiding questions first and the explanation only after the learner asks for it. */
  socraticDelay?: boolean;
}

export type ErrorCategory = 'syntax' | 'runtime' | 'logic' | 'edge' | 'timeout' | 'output';

export interface Explanation {
  title: string;
  category: ErrorCategory;
  summary: string;
  causes: string[];
  steps: string[];
  questions: string[];
  deep?: string;
  term?: { en: string; ru: string };
  line?: number | null;
  /** Source line text, when known. */
  snippet?: string;
}

type Draft = Omit<Explanation, 'category' | 'line' | 'snippet'> & { category?: ErrorCategory };
type Rule = { lang: Lang | 'any'; type?: RegExp; msg?: RegExp; build: (m: RegExpExecArray, e: RunError, code: string) => Draft };

const q = (s: string) => `\`${s}\``;

const RULES: Rule[] = [
  // ---------------- Python: syntax ----------------
  {
    lang: 'python', type: /IndentationError|TabError/, msg: /.*/,
    build: (m) => ({
      title: 'Ошибка отступов', category: 'syntax',
      summary: /expected an indented block/.test(m[0]) ? 'После строки с двоеточием Python ждёт блок с отступом.' : /unexpected indent/.test(m[0]) ? 'Лишний отступ: строка сдвинута, хотя блок не начинался.' : 'Отступы в блоке не совпадают по ширине.',
      causes: ['В Python отступ — часть синтаксиса: он задаёт, какие строки входят в блок if/for/def.', 'Смешаны пробелы и табуляция или разное число пробелов.'],
      steps: ['Посмотрите на строку из сообщения и строку над ней.', 'Выровняйте все строки одного блока одинаково (обычно 4 пробела).', 'Если блок пока пустой, напишите в нём `pass`.'],
      questions: ['Какие строки должны выполняться внутри этого блока?', 'Одинаковый ли отступ у всех строк одного уровня?'],
      deep: 'Лексер Python превращает изменения отступа в токены INDENT/DEDENT. Если отступ строки не совпадает ни с одним из открытых уровней, разбор останавливается.',
      term: { en: 'indentation', ru: 'отступ' },
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /expected ':'/,
    build: () => ({
      title: 'Пропущено двоеточие', category: 'syntax',
      summary: 'Строки с if, elif, else, for, while, def, class, try, with заканчиваются двоеточием.',
      causes: ['Двоеточие открывает блок; без него Python не понимает, где начинается тело.'],
      steps: ['Добавьте `:` в конец строки, указанной в ошибке.', 'Проверьте, что следующая строка сдвинута вправо.'],
      questions: ['Чем заканчивается заголовок блока в Python?'],
      term: { en: 'colon', ru: 'двоеточие' },
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /unterminated (?:triple-quoted )?string/,
    build: () => ({
      title: 'Незакрытая строка', category: 'syntax',
      summary: 'Строка начата кавычкой, но не закрыта такой же кавычкой.',
      causes: ['Пропущена закрывающая кавычка.', 'Кавычки разного вида: открыта `"`, закрыта `\'`.', 'Внутри строки та же кавычка, что и снаружи.'],
      steps: ['Найдите на указанной строке открывающую кавычку и закройте строку такой же.', 'Если внутри нужна кавычка — используйте другой вид снаружи или `\\"`.'],
      questions: ['Где заканчивается ваша строка по мнению Python?'],
      term: { en: 'string literal', ru: 'строковый литерал' },
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /'(.)' was never closed|unmatched '(.)'|closing parenthesis '(.)' does not match/,
    build: () => ({
      title: 'Скобки не сбалансированы', category: 'syntax',
      summary: 'Открывающих и закрывающих скобок разное количество (или они разного вида).',
      causes: ['Пропущена закрывающая скобка — часто в длинных вызовах print(...) или int(input()).'],
      steps: ['Посчитайте скобки на строке из ошибки и на строке выше.', 'Подсветка парной скобки в редакторе помогает найти пару.'],
      questions: ['Каждой ли открывающей скобке соответствует закрывающая того же вида?'],
      deep: 'Внутри незакрытой скобки Python продолжает читать следующие строки как одно выражение, поэтому ошибка иногда указывает на строку ниже реального места.',
      term: { en: 'parenthesis', ru: 'круглая скобка' },
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /Maybe you meant '==' or ':='|cannot assign to/,
    build: () => ({
      title: 'Присваивание вместо сравнения', category: 'syntax',
      summary: '`=` — присваивание, а для сравнения нужно `==`.',
      causes: ['В условии if/while написано `=`.', 'Слева от `=` стоит выражение, которому нельзя присвоить значение.'],
      steps: ['В условиях используйте `==` (равно) или `!=` (не равно).', 'Слева от `=` должно быть имя переменной, элемент списка или атрибут.'],
      questions: ['Вы хотите изменить значение или проверить его?'],
      term: { en: 'assignment vs comparison', ru: 'присваивание и сравнение' },
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /Missing parentheses in call to '(\w+)'/,
    build: (m) => ({
      title: `${m[1]} — это функция`, category: 'syntax',
      summary: `В Python 3 ${q(m[1])} вызывается со скобками: ${q(m[1] + '(...)')}.`,
      causes: ['Синтаксис Python 2 (`print x`) больше не работает.'],
      steps: [`Оберните аргументы в скобки: ${q(m[1] + '("текст")')}.`],
      questions: ['Как в Python вызывается функция?'],
    }),
  },
  {
    lang: 'python', type: /SyntaxError/, msg: /.*/,
    build: (m) => ({
      title: 'Синтаксическая ошибка', category: 'syntax',
      summary: 'Python не смог разобрать код — программа даже не начала выполняться.',
      causes: ['Пропущены двоеточие, скобка или кавычка.', 'Опечатка в ключевом слове.', 'Оператор стоит не на своём месте.', `Сообщение интерпретатора: ${m[0]}`],
      steps: ['Посмотрите на отмеченную строку и на строку выше — ошибка часто там.', 'Сравните конструкцию с примером из урока.'],
      questions: ['Какой символ мог быть пропущен на этой или предыдущей строке?'],
      term: { en: 'syntax error', ru: 'синтаксическая ошибка' },
    }),
  },
  // ---------------- Python: runtime ----------------
  {
    lang: 'python', type: /^NameError$/, msg: /name '(\w+)' is not defined(?:. Did you mean: '(\w+)'\?)?/,
    build: (m, _e, code) => {
      const name = m[1];
      const suggestion = m[2];
      const caseVariant = new RegExp(`\\b${name}\\b`, 'i').test(code.replace(new RegExp(`\\b${name}\\b`, 'g'), ''));
      const causes = [`Имя ${q(name)} используется до того, как ему присвоили значение, или с опечаткой.`];
      if (suggestion) causes.unshift(`Возможно, вы имели в виду ${q(suggestion)} — похожее имя существует.`);
      if (caseVariant) causes.push('Регистр важен: `Total` и `total` — разные имена.');
      if (/^[А-Яа-яЁё]/.test(name) || /^[a-z]+$/i.test(name)) causes.push(`Если ${q(name)} — это текст, его нужно взять в кавычки: ${q(`"${name}"`)}.`);
      return {
        title: `Имя ${name} не определено`, category: 'runtime',
        summary: `Python не знает, что такое ${q(name)}.`,
        causes,
        steps: [`Найдите, где ${q(name)} должно получать значение, и проверьте, что это происходит раньше.`, 'Сравните написание имени во всех местах.', 'Если переменная создаётся внутри функции, снаружи она не видна.'],
        questions: [`На какой строке ${q(name)} впервые получает значение?`, 'Выполняется ли эта строка до места ошибки?'],
        deep: 'Python ищет имя по правилу LEGB: локальная область, объемлющие функции, глобальная, встроенные. NameError значит, что имени нет ни в одной.',
        term: { en: 'name / scope', ru: 'имя / область видимости' },
      };
    },
  },
  {
    lang: 'python', type: /UnboundLocalError/, msg: /local variable '(\w+)'/,
    build: (m) => ({
      title: 'Локальная переменная без значения', category: 'runtime',
      summary: `Внутри функции есть присваивание ${q(m[1])}, поэтому Python считает её локальной — но читается она раньше присваивания.`,
      causes: ['Изменение глобальной переменной внутри функции без `global`.', 'Присваивание происходит только в одной ветке if.'],
      steps: ['Передайте значение в функцию параметром и верните результат через return — так лучше, чем `global`.', 'Или присвойте переменной начальное значение в начале функции.'],
      questions: ['Где эта переменная получает значение внутри функции?'],
      deep: 'Решение «локальная или нет» принимается при компиляции функции целиком: одно присваивание в любом месте делает имя локальным во всей функции.',
      term: { en: 'local scope', ru: 'локальная область видимости' },
    }),
  },
  {
    lang: 'python', type: /TypeError/, msg: /can only concatenate str \(not "(\w+)"\) to str|unsupported operand type\(s\) for ([^:]+): '(\w+)' and '(\w+)'/,
    build: (m) => {
      const types = m[1] ? ['str', m[1]] : [m[3], m[4]];
      const strNum = types.includes('str') && types.some((t) => t === 'int' || t === 'float');
      const none = types.includes('NoneType');
      return {
        title: 'Несовместимые типы в операции', category: 'runtime',
        summary: `Операцию нельзя применить к значениям типов ${types.map(q).join(' и ')}.`,
        causes: [
          ...(strNum ? ['Число и строку нельзя сложить: Python не угадывает, хотите вы склеить текст или посчитать сумму.', 'Значение из `input()` — всегда строка.'] : []),
          ...(none ? ['Одно из значений — None: скорее всего, функция ничего не вернула (нет return).'] : []),
          'Значение имеет не тот тип, который вы ожидали.',
        ],
        steps: strNum
          ? ['Для арифметики преобразуйте строку: `int(s)` / `float(s)`.', 'Для текста используйте f-строку: `f"Итого: {n}"` или `str(n)`.']
          : ['Выведите `type(значение)` перед строкой с ошибкой, чтобы увидеть реальный тип.'],
        questions: ['Какого типа каждое значение в этой операции?', 'Откуда пришло значение неожиданного типа?'],
        deep: 'Python строго типизирован динамически: тип проверяется во время выполнения, неявных преобразований между str и числами нет (в отличие от JavaScript).',
        term: { en: 'type', ru: 'тип данных' },
      };
    },
  },
  {
    lang: 'python', type: /TypeError/, msg: /'(\w+)' object is not (callable|subscriptable|iterable)/,
    build: (m) => {
      const [, t, what] = m;
      const none = t === 'NoneType';
      const map: Record<string, Draft> = {
        callable: {
          title: `Объект ${t} нельзя вызвать`, summary: `После значения типа ${q(t)} стоят скобки (), как у функции.`,
          causes: ['Имя функции перезаписано переменной (например, `sum = 0`, затем `sum(...)`).', 'Лишние скобки после значения.'],
          steps: ['Не называйте переменные как встроенные функции: list, sum, max, str, input.', 'Проверьте, что вызываете именно функцию.'],
          questions: ['Что хранится в этом имени в момент вызова?'],
        },
        subscriptable: {
          title: `К объекту ${t} нельзя обратиться по индексу`, summary: `Квадратные скобки [] применены к значению типа ${q(t)}.`,
          causes: none ? ['Значение — None: функция без return или метод, изменяющий список на месте (`sort()`, `append()`), возвращает None.'] : ['Индексировать можно последовательности и словари, а не числа или функции.'],
          steps: none ? ['Используйте `sorted(lst)` вместо `lst = lst.sort()`.', 'Проверьте, что функция возвращает значение через return.'] : ['Проверьте тип значения через `type()`.'],
          questions: ['Что на самом деле вернула предыдущая операция?'],
        },
        iterable: {
          title: `По объекту ${t} нельзя пройти циклом`, summary: `for пытается перебрать значение типа ${q(t)}.`,
          causes: t === 'int' ? ['Перебор числа: нужно `for i in range(n)`, а не `for i in n`.'] : none ? ['Значение — None: функция ничего не вернула.'] : ['Значение не является коллекцией.'],
          steps: t === 'int' ? ['Замените `for i in n` на `for i in range(n)`.'] : ['Проверьте, что перебираете список/строку/словарь.'],
          questions: ['Какая коллекция должна быть справа от in?'],
        },
      };
      return { ...map[what], category: 'runtime', term: { en: what === 'iterable' ? 'iterable' : what, ru: what === 'iterable' ? 'итерируемый объект' : what === 'callable' ? 'вызываемый объект' : 'индексируемый объект' } };
    },
  },
  {
    lang: 'python', type: /TypeError/, msg: /(\w+)\(\) (missing (\d+) required positional argument|takes (\d+) positional arguments? but (\d+) (?:were|was) given)/,
    build: (m) => ({
      title: 'Неверное число аргументов', category: 'runtime',
      summary: `Функция ${q(m[1])} вызвана не с тем количеством аргументов.`,
      causes: [
        m[3] ? `Не передан обязательный аргумент (${m[3]}).` : `Передано ${m[5]}, а функция принимает ${m[4]}.`,
        'Для метода класса: первый параметр — `self`; его забыли в определении или вызывают метод у класса, а не у объекта.',
      ],
      steps: ['Сравните заголовок `def` и место вызова: число и порядок параметров.', 'Для необязательных параметров задайте значения по умолчанию.'],
      questions: ['Сколько параметров объявлено в def и сколько вы передаёте?'],
      term: { en: 'positional argument', ru: 'позиционный аргумент' },
    }),
  },
  {
    lang: 'python', type: /TypeError/, msg: /'(\w+)' object does not support item assignment/,
    build: (m) => ({
      title: `${m[1]} — неизменяемый тип`, category: 'runtime',
      summary: `Элементы значения типа ${q(m[1])} нельзя менять на месте.`,
      causes: ['Строки и кортежи неизменяемы.'],
      steps: m[1] === 'str' ? ['Соберите новую строку: срезы, `replace()` или `"".join(...)`.'] : ['Преобразуйте в список `list(t)`, измените, при необходимости верните `tuple(...)`.'],
      questions: ['Можно ли создать новое значение вместо изменения старого?'],
      term: { en: 'immutable', ru: 'неизменяемый' },
    }),
  },
  {
    lang: 'python', type: /TypeError/, msg: /unhashable type: '(\w+)'/,
    build: (m) => ({
      title: 'Изменяемый объект как ключ', category: 'runtime',
      summary: `Значение типа ${q(m[1])} нельзя использовать как ключ словаря или элемент множества.`,
      causes: ['Ключи должны быть неизменяемыми (хешируемыми): числа, строки, кортежи.'],
      steps: ['Используйте кортеж вместо списка: `tuple(lst)`.'],
      questions: ['Почему ключ не должен меняться после добавления в словарь?'],
      deep: 'Словарь находит ключ по хешу. Если бы ключ изменился, его хеш стал бы другим, и запись «потерялась» бы.',
      term: { en: 'hashable', ru: 'хешируемый' },
    }),
  },
  {
    lang: 'python', type: /TypeError/, msg: /.*/,
    build: (m) => ({
      title: 'Ошибка типа', category: 'runtime',
      summary: 'Операция или функция получила значение неподходящего типа.',
      causes: [`Сообщение: ${m[0]}`, 'Часто причина — None из функции без return или строка из input().'],
      steps: ['Выведите `type(x)` для значений в строке с ошибкой.', 'Проверьте, что каждая функция возвращает то, что вы ожидаете.'],
      questions: ['Какого типа значения участвуют в этой строке?'],
      term: { en: 'TypeError', ru: 'ошибка типа' },
    }),
  },
  {
    lang: 'python', type: /ValueError/, msg: /invalid literal for (int|float)\(\)[^:]*: '(.*)'/,
    build: (m) => ({
      title: 'Строку нельзя превратить в число', category: 'runtime',
      summary: `${q(m[1] + '()')} не может преобразовать ${q(m[2])} в число.`,
      causes: ['В строке есть пробелы, буквы, запятая вместо точки или она пустая.', m[1] === 'int' ? '`int("3.5")` не работает: сначала `float()`.' : 'Неверный формат числа.'],
      steps: ['Выведите строку через `repr(s)`, чтобы увидеть скрытые символы.', 'Очистите ввод: `s.strip()`.'],
      questions: ['Что именно содержит строка перед преобразованием?'],
      term: { en: 'literal', ru: 'литерал' },
    }),
  },
  {
    lang: 'python', type: /ValueError/, msg: /(too many|not enough) values to unpack/,
    build: (m) => ({
      title: 'Распаковка не совпала по количеству', category: 'runtime',
      summary: `Слева и справа от = разное число элементов (${m[1] === 'too many' ? 'справа больше' : 'справа меньше'}).`,
      causes: ['Перебор словаря без `.items()`: `for k, v in d` перебирает только ключи.', 'split() вернул не столько частей, сколько ожидалось.'],
      steps: ['Выведите значение справа и посчитайте элементы.', 'Для словаря используйте `for k, v in d.items()`.'],
      questions: ['Сколько элементов в значении справа?'],
      term: { en: 'unpacking', ru: 'распаковка' },
    }),
  },
  {
    lang: 'python', type: /IndexError/, msg: /.*/,
    build: (m) => ({
      title: 'Индекс вне диапазона', category: 'edge',
      summary: /pop from empty/.test(m[0]) ? 'Попытка взять элемент из пустого списка.' : 'Обращение к позиции, которой нет в последовательности.',
      causes: ['Индексы идут от 0 до len - 1: элемента с индексом len нет.', 'Цикл `range(len(a) + 1)` или `i + 1` на последнем шаге.', 'Список пуст.'],
      steps: ['Выведите `len(...)` и индекс перед ошибкой.', 'Проверьте границы цикла и случай пустого списка.', 'Часто лучше перебирать элементы напрямую: `for x in a`.'],
      questions: ['Какой последний допустимый индекс?', 'Что произойдёт на последней итерации цикла?', 'Работает ли код для пустого списка?'],
      term: { en: 'off-by-one', ru: 'ошибка на единицу' },
    }),
  },
  {
    lang: 'python', type: /KeyError/, msg: /.*/,
    build: (m) => ({
      title: `Ключа ${m[0]} нет в словаре`, category: 'edge',
      summary: 'Чтение по ключу, которого нет в словаре.',
      causes: ['Ключ ещё не добавлен (например, при подсчёте первый раз).', 'Разный тип или регистр ключа: `1` и `"1"` — разные ключи.'],
      steps: ['Используйте `d.get(key, default)`.', 'Для подсчёта: `d[k] = d.get(k, 0) + 1` или `collections.Counter`.', 'Проверьте наличие: `if key in d`.'],
      questions: ['Был ли этот ключ добавлен до чтения?'],
      term: { en: 'key', ru: 'ключ' },
    }),
  },
  {
    lang: 'python', type: /AttributeError/, msg: /'(\w+)' object has no attribute '(\w+)'/,
    build: (m) => {
      const [, t, attr] = m;
      const jsHabit: Record<string, string> = { push: 'append', length: 'len(...)', toUpperCase: 'upper', forEach: 'цикл for', trim: 'strip', includes: 'оператор in' };
      const causes: string[] = [];
      if (t === 'NoneType') causes.push('Значение — None: функция ничего не вернула или метод изменил объект на месте и вернул None (например, `lst = lst.sort()`).');
      if (jsHabit[attr]) causes.push(`${q(attr)} — это из JavaScript; в Python: ${q(jsHabit[attr])}.`);
      if (t === 'str' && ['append', 'remove'].includes(attr)) causes.push('Строки неизменяемы и не имеют методов списка.');
      causes.push(`У типа ${q(t)} нет атрибута ${q(attr)} — проверьте написание и тип значения.`);
      return {
        title: `Нет атрибута ${attr}`, category: 'runtime',
        summary: `У объекта типа ${q(t)} нет атрибута или метода ${q(attr)}.`,
        causes,
        steps: [`Посмотрите доступные методы: \`dir(${t === 'NoneType' ? 'x' : t})\`.`, 'Проверьте, что переменная имеет ожидаемый тип.'],
        questions: ['Какого типа объект на самом деле?', 'Какой метод этого типа делает нужное?'],
        term: { en: 'attribute', ru: 'атрибут' },
      };
    },
  },
  {
    lang: 'python', type: /ZeroDivisionError/, msg: /.*/,
    build: () => ({
      title: 'Деление на ноль', category: 'edge',
      summary: 'Знаменатель оказался равен нулю.',
      causes: ['Не обработан граничный случай: пустой список (len = 0), нулевое количество.'],
      steps: ['Добавьте проверку перед делением: `if n == 0: ...`.', 'Решите, что функция должна возвращать в этом случае (по условию задачи).'],
      questions: ['При каких входных данных знаменатель станет 0?'],
      term: { en: 'edge case', ru: 'граничный случай' },
    }),
  },
  {
    lang: 'python', type: /RecursionError/, msg: /.*/,
    build: () => ({
      title: 'Слишком глубокая рекурсия', category: 'logic',
      summary: 'Функция вызывает себя без остановки (или слишком много раз).',
      causes: ['Нет базового случая или он недостижим.', 'Рекурсивный вызов не приближает к базовому случаю (аргумент не уменьшается).'],
      steps: ['Проверьте условие остановки для самых маленьких входов.', 'Убедитесь, что аргумент каждого вызова «меньше» предыдущего.', 'Проследите 2–3 вызова в визуализаторе.'],
      questions: ['Какой вход обрабатывается без рекурсии?', 'Как меняется аргумент от вызова к вызову?'],
      deep: 'По умолчанию Python ограничивает глубину стека (~1000 кадров), чтобы не переполнить стек интерпретатора.',
      term: { en: 'base case', ru: 'базовый случай' },
    }),
  },
  {
    lang: 'python', type: /EOFError/, msg: /.*/,
    build: () => ({
      title: 'Закончился ввод', category: 'runtime',
      summary: 'Программа вызвала input() больше раз, чем строк во входных данных.',
      causes: ['Лишний вызов input().', 'Ожидается ввод в цикле без условия остановки.'],
      steps: ['Сравните число вызовов input() с числом строк входа.', 'В песочнице введите данные в поле «Ввод (stdin)», по строке на вызов.'],
      questions: ['Сколько строк читает программа?'],
    }),
  },
  {
    lang: 'python', type: /ModuleNotFoundError|ImportError/, msg: /.*/,
    build: (m) => ({
      title: 'Модуль недоступен', category: 'runtime',
      summary: 'Импорт не удался.',
      causes: ['Опечатка в имени модуля.', 'Сторонние пакеты (requests, numpy) в учебной среде не установлены — доступна стандартная библиотека.', `Сообщение: ${m[0]}`],
      steps: ['Проверьте написание.', 'Используйте модули стандартной библиотеки.'],
      questions: ['Входит ли модуль в стандартную библиотеку Python?'],
    }),
  },
  {
    lang: 'python', type: /AssertionError/, msg: /.*/,
    build: () => ({
      title: 'Проверка assert не прошла', category: 'logic',
      summary: 'Условие в assert оказалось ложным.',
      causes: ['Значение не такое, как ожидалось в этой точке программы.'],
      steps: ['Выведите значения, участвующие в assert.'],
      questions: ['Какое значение вы ожидали и какое получилось?'],
    }),
  },
  // ---------------- JavaScript ----------------
  {
    lang: 'javascript', type: /ReferenceError/, msg: /Cannot access '(\w+)' before initialization/,
    build: (m) => ({
      title: 'Обращение до объявления (TDZ)', category: 'runtime',
      summary: `${q(m[1])} объявлена через let/const/class ниже по коду — до строки объявления её использовать нельзя.`,
      causes: ['let/const «поднимаются», но остаются в «временной мёртвой зоне» до объявления.'],
      steps: ['Переместите объявление выше места использования.'],
      questions: ['На какой строке объявлена переменная, и где она впервые используется?'],
      deep: 'В отличие от var (который инициализируется undefined), let/const/class неинициализированы до выполнения своей строки — это защищает от незаметных ошибок.',
      term: { en: 'temporal dead zone', ru: 'временная мёртвая зона' },
    }),
  },
  {
    lang: 'javascript', type: /ReferenceError/, msg: /(\w+) is not defined/,
    build: (m) => ({
      title: `${m[1]} не определено`, category: 'runtime',
      summary: `Имя ${q(m[1])} не объявлено в доступной области видимости.`,
      causes: ['Опечатка или другой регистр.', 'Переменная объявлена внутри блока/функции и снаружи не видна.', 'В строгом режиме присваивание без let/const тоже даёт эту ошибку.', ['document', 'window', 'fetch'].includes(m[1]) ? 'В учебной песочнице нет браузерных API (DOM, сеть) — код выполняется изолированно.' : ''].filter(Boolean),
      steps: [`Объявите переменную: ${q(`let ${m[1]} = ...`)}.`, 'Проверьте, в каком блоке { } она объявлена.'],
      questions: ['Где объявлена эта переменная?', 'Видна ли она в этом блоке?'],
      term: { en: 'scope', ru: 'область видимости' },
    }),
  },
  {
    lang: 'javascript', type: /TypeError/, msg: /Assignment to constant variable/,
    build: () => ({
      title: 'Изменение const', category: 'runtime',
      summary: 'Переменной, объявленной через const, нельзя присвоить новое значение.',
      causes: ['const запрещает переприсваивание (но содержимое объекта/массива менять можно).'],
      steps: ['Если значение должно меняться — объявите через let.'],
      questions: ['Должна ли эта переменная меняться?'],
      term: { en: 'constant', ru: 'константа' },
    }),
  },
  {
    lang: 'javascript', type: /TypeError/, msg: /Cannot (?:read|set) properties of (undefined|null) \((?:reading|setting) '([^']+)'\)/,
    build: (m) => ({
      title: `Обращение к свойству ${m[2]} у ${m[1]}`, category: 'edge',
      summary: `Значение слева от ${q('.' + m[2])} оказалось ${q(m[1])}.`,
      causes: ['Функция ничего не вернула (нет return).', 'Индекс за пределами массива даёт undefined.', 'Опечатка в имени свойства на шаг раньше.', 'Не обработан пустой результат (find вернул undefined).'],
      steps: ['Выведите значение перед точкой через console.log.', 'Используйте `?.` для необязательных значений или добавьте проверку.'],
      questions: ['Какое значение вы ожидали слева от точки?', 'Откуда там взялся undefined?'],
      term: { en: 'undefined', ru: 'не определено' },
    }),
  },
  {
    lang: 'javascript', type: /TypeError/, msg: /([\w.$[\]]+) is not a function/,
    build: (m) => {
      const name = m[1];
      const pyHabit: Record<string, string> = { append: 'push', len: '.length', upper: 'toUpperCase', strip: 'trim', lower: 'toLowerCase' };
      const last = name.split('.').pop()!;
      return {
        title: `${name} — не функция`, category: 'runtime',
        summary: `Значение ${q(name)} вызывается как функция, но функцией не является.`,
        causes: [
          ...(pyHabit[last] ? [`${q(last)} — это из Python; в JavaScript: ${q(pyHabit[last])}.`] : []),
          'Опечатка в имени метода.',
          'Метод вызван у значения другого типа (например, map у объекта, а не массива).',
        ],
        steps: ['Проверьте тип значения: `typeof x`, `Array.isArray(x)`.', 'Сверьте имя метода с документацией.'],
        questions: ['Какого типа значение, у которого вызывается метод?'],
        term: { en: 'function', ru: 'функция' },
      };
    },
  },
  {
    lang: 'javascript', type: /TypeError/, msg: /is not iterable/,
    build: () => ({
      title: 'Значение нельзя перебрать', category: 'runtime',
      summary: 'for...of или spread применены к значению, которое не является итерируемым.',
      causes: ['Обычный объект не итерируем: используйте Object.keys/values/entries.', 'Значение — undefined.'],
      steps: ['Для объекта: `for (const [k, v] of Object.entries(obj))`.'],
      questions: ['Что именно стоит справа от of?'],
      term: { en: 'iterable', ru: 'итерируемый' },
    }),
  },
  {
    lang: 'javascript', type: /TypeError/, msg: /Reduce of empty array with no initial value/,
    build: () => ({
      title: 'reduce на пустом массиве', category: 'edge',
      summary: 'reduce без начального значения не может обработать пустой массив.',
      causes: ['Не учтён граничный случай пустого входа.'],
      steps: ['Передайте начальное значение: `arr.reduce((s, x) => s + x, 0)`.'],
      questions: ['Что должна вернуть функция для пустого массива?'],
      term: { en: 'initial value', ru: 'начальное значение' },
    }),
  },
  {
    lang: 'javascript', type: /RangeError/, msg: /Maximum call stack size exceeded/,
    build: () => ({
      title: 'Переполнение стека вызовов', category: 'logic',
      summary: 'Рекурсия не останавливается.',
      causes: ['Нет базового случая или он недостижим.'],
      steps: ['Проверьте условие выхода и что аргумент приближается к нему.'],
      questions: ['При каком входе функция не вызывает себя?'],
      term: { en: 'call stack', ru: 'стек вызовов' },
    }),
  },
  {
    lang: 'javascript', type: /SyntaxError/, msg: /.*/,
    build: (m) => ({
      title: 'Синтаксическая ошибка', category: 'syntax',
      summary: 'JavaScript не смог разобрать код — он не начал выполняться.',
      causes: [
        /Unexpected end of input/.test(m[0]) ? 'Не закрыта фигурная/круглая скобка или строка.' : '',
        /already been declared/.test(m[0]) ? 'Переменная объявлена дважды через let/const в одной области.' : '',
        /Invalid or unexpected token/.test(m[0]) ? 'Незакрытая строка или недопустимый символ (например, «умные» кавычки).' : '',
        /missing \) after argument list/.test(m[0]) ? 'Пропущена закрывающая скобка или запятая между аргументами.' : '',
        `Сообщение: ${m[0]}`,
      ].filter(Boolean),
      steps: ['Проверьте парность скобок {} () [] и кавычек.', 'Ищите ошибку на строке перед местом, где её «заметил» разборщик.'],
      questions: ['Все ли скобки и кавычки закрыты?'],
      term: { en: 'syntax error', ru: 'синтаксическая ошибка' },
    }),
  },
  // ---------------- SQL (SQLite) ----------------
  {
    lang: 'sql', msg: /no such table: (\S+)/,
    build: (m) => ({
      title: `Таблицы ${m[1]} нет`, category: 'syntax', summary: 'Запрос ссылается на несуществующую таблицу.',
      causes: ['Опечатка или единственное/множественное число (order/orders).'],
      steps: ['Посмотрите схему данных над редактором.'], questions: ['Как точно называется таблица в схеме?'],
    }),
  },
  {
    lang: 'sql', msg: /no such column: (\S+)/,
    build: (m) => ({
      title: `Столбца ${m[1]} нет`, category: 'syntax', summary: 'Запрос ссылается на несуществующий столбец.',
      causes: ['Опечатка в имени.', 'Псевдоним из SELECT использован в WHERE — WHERE выполняется раньше SELECT.', 'Строка в двойных кавычках: в SQL строки пишутся в одинарных кавычках.'],
      steps: ['Сверьте имя со схемой.', "Строковые значения: 'текст'."],
      questions: ['В каком порядке выполняются части запроса?'],
      deep: 'Логический порядок: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Псевдонимы SELECT доступны только в ORDER BY.',
      term: { en: 'column', ru: 'столбец' },
    }),
  },
  {
    lang: 'sql', msg: /ambiguous column name: (\S+)/,
    build: (m) => ({
      title: 'Неоднозначный столбец', category: 'syntax', summary: `${q(m[1])} есть в нескольких таблицах соединения.`,
      causes: ['При JOIN одинаковые имена столбцов нужно уточнять таблицей.'], steps: [`Пишите ${q('таблица.' + m[1])} или используйте псевдонимы таблиц.`],
      questions: ['Из какой таблицы нужен этот столбец?'],
    }),
  },
  {
    lang: 'sql', msg: /misuse of aggregate|aggregate functions are not allowed|GROUP BY clause is required before HAVING/,
    build: () => ({
      title: 'Агрегат не на своём месте', category: 'logic', summary: 'Агрегатные функции (COUNT, SUM, AVG…) нельзя использовать в WHERE.',
      causes: ['Условие на агрегат должно быть в HAVING после GROUP BY.'],
      steps: ['Перенесите условие с агрегатом в HAVING.', 'Условия на отдельные строки оставьте в WHERE.'],
      questions: ['Условие относится к отдельной строке или к группе?'],
      term: { en: 'aggregate', ru: 'агрегатная функция' },
    }),
  },
  {
    lang: 'sql', msg: /(NOT NULL|UNIQUE|FOREIGN KEY|CHECK) constraint failed/,
    build: (m) => ({
      title: `Нарушено ограничение ${m[1]}`, category: 'runtime', summary: 'Изменение данных нарушает правило целостности таблицы.',
      causes: [m[1] === 'NOT NULL' ? 'Не задано значение обязательного столбца.' : m[1] === 'UNIQUE' ? 'Такое значение уже есть.' : m[1] === 'FOREIGN KEY' ? 'Ссылка на несуществующую строку.' : 'Значение не проходит условие CHECK.'],
      steps: ['Посмотрите определение таблицы и данные.'], questions: ['Какое правило нарушает ваше изменение?'],
      term: { en: 'constraint', ru: 'ограничение' },
    }),
  },
  {
    lang: 'sql', msg: /near "([^"]*)": syntax error|incomplete input/,
    build: (m) => ({
      title: 'Синтаксическая ошибка SQL', category: 'syntax',
      summary: m[1] ? `Разбор запроса остановился около ${q(m[1])}.` : 'Запрос оборван — не хватает его окончания.',
      causes: ['Лишняя или пропущенная запятая в списке столбцов.', 'Неверный порядок частей: WHERE после GROUP BY, ORDER BY до WHERE.', 'Ключевое слово использовано как имя.'],
      steps: ['Порядок частей: SELECT … FROM … JOIN … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT.'],
      questions: ['Что стоит прямо перед указанным словом?'],
    }),
  },
  // ---------------- any ----------------
  {
    lang: 'any', type: /^Timeout$/,
    build: () => ({
      title: 'Программа выполнялась слишком долго', category: 'timeout',
      summary: 'Выполнение остановлено по таймауту — вероятно, бесконечный цикл или очень медленный алгоритм.',
      causes: ['Условие while никогда не становится ложным (переменная не меняется).', 'Ожидание ввода, которого нет.', 'Алгоритм перебирает слишком много вариантов для большого входа.'],
      steps: ['Проверьте, что в теле цикла меняется переменная из условия.', 'Добавьте print в цикл и запустите с маленьким входом.', 'Для больших данных оцените сложность алгоритма.'],
      questions: ['Что в цикле приближает его к завершению?'],
      term: { en: 'infinite loop', ru: 'бесконечный цикл' },
    }),
  },
];

export function explainError(err: RunError, lang: Lang, code: string): Explanation {
  for (const r of RULES) {
    if (r.lang !== 'any' && r.lang !== lang) continue;
    if (r.type && !r.type.test(err.type)) continue;
    const m = (r.msg ?? /.*/).exec(err.message);
    if (!m) continue;
    const d = r.build(m, err, code);
    return finish(d, err, code);
  }
  return finish(
    {
      title: `${err.type}`,
      category: 'runtime',
      summary: err.message || 'Ошибка во время выполнения.',
      causes: ['Значение в момент ошибки не такое, как вы ожидали.'],
      steps: ['Посмотрите на строку из сообщения и выведите значения переменных перед ней.'],
      questions: ['Что делает строка с ошибкой и какие значения в ней участвуют?'],
    },
    err,
    code,
  );
}

function finish(d: Draft, err: RunError, code: string): Explanation {
  const line = err.line ?? null;
  const snippet = line ? code.split('\n')[line - 1]?.trim() : undefined;
  return { category: 'runtime', ...d, line, snippet };
}

// ---------------- wrong answers without exceptions ----------------

function parseNumber(s?: string): number | null {
  if (s === undefined) return null;
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
}

const stripQuotes = (s: string) => s.replace(/^['"]|['"]$/g, '');

export function explainWrongResult(r: TestResult, lang: Lang, code: string): Explanation {
  const base = { line: null as number | null };
  const actual = r.actual ?? '';
  const expected = r.expected ?? '';
  const hiddenNote = r.hidden && r.label ? [`Скрытый тест проверяет случай: «${r.label}».`] : [];

  if (r.kind === 'sql') {
    const rows = (s: string) => s.split('\n').filter((l) => !/^… ещё/.test(l)).length - 1;
    const more = (s: string) => Number(/… ещё (\d+)/.exec(s)?.[1] ?? 0);
    const ra = rows(actual) + more(actual), re = rows(expected) + more(expected);
    const ca = actual.split('\n')[0]?.split(' | ').length ?? 0, ce = expected.split('\n')[0]?.split(' | ').length ?? 0;
    const causes: string[] = [];
    if (ca !== ce) causes.push(`Число столбцов: у вас ${ca}, нужно ${ce}. Выбирайте ровно те столбцы, что указаны в задании, в том же порядке.`);
    if (ra > re) causes.push('Лишние строки: условие WHERE слишком мягкое, JOIN размножил строки или не хватает DISTINCT/GROUP BY.');
    if (ra < re) causes.push('Не хватает строк: слишком строгое условие, INNER JOIN вместо LEFT JOIN, или NULL отбросился в сравнении.');
    if (ra === re && ca === ce) causes.push('Строк столько же, но значения отличаются: проверьте выражения, агрегаты и порядок (ORDER BY), если он важен.');
    return {
      ...base, title: 'Результат запроса отличается', category: r.hidden ? 'edge' : 'logic',
      summary: r.hidden ? 'На другом наборе данных запрос даёт неверный результат — возможно, он подогнан под видимые данные.' : 'Запрос выполняется, но возвращает не то.',
      causes: [...hiddenNote, ...causes],
      steps: ['Запустите запрос и сравните таблицы построчно.', 'Проверьте каждую часть отдельно: сначала FROM/JOIN, затем WHERE, затем группировку.'],
      questions: ['Какие строки лишние или каких не хватает?', 'На каком шаге запроса они появляются или теряются?'],
    };
  }

  if (r.kind === 'stdout') {
    const a = actual.replace(/\s+$/, ''), e = expected.replace(/\s+$/, '');
    const causes: string[] = [...hiddenNote];
    let title = 'Вывод отличается';
    if (a.replace(/\s+/g, ' ') === e.replace(/\s+/g, ' ')) { title = 'Отличаются пробелы или переносы строк'; causes.push('Текст совпадает, но пробелы/переводы строк — нет. Проверьте sep/end в print и лишние пробелы.'); }
    else if (a.toLowerCase() === e.toLowerCase()) { title = 'Отличается регистр букв'; causes.push('Сравните заглавные и строчные буквы.'); }
    else if (a.includes(e)) causes.push('В выводе есть лишние строки — например, отладочные print или подсказка в input("...").');
    else if (e.includes(a)) causes.push('Вывод неполный: выполняются не все ветки или цикл заканчивается раньше.');
    else causes.push('Сравните вывод с ожидаемым построчно.');
    return {
      ...base, title, category: r.hidden ? 'edge' : 'logic',
      summary: r.stdin?.length ? `При вводе ${r.stdin.map((s) => `«${s}»`).join(', ')} вывод не совпал с ожидаемым.` : 'Вывод программы не совпал с ожидаемым.',
      causes, steps: ['Запустите программу с теми же входными данными.', 'Сравните первую отличающуюся строку.'],
      questions: ['На какой строке вывод начинает расходиться?'],
    };
  }

  // expression tests
  const causes: string[] = [...hiddenNote];
  const steps: string[] = [];
  const questions: string[] = [];
  let title = 'Неверный результат';
  const noneLike = lang === 'python' ? 'None' : 'undefined';
  const na = parseNumber(actual), ne = parseNumber(expected);
  if (actual === noneLike && expected !== noneLike) {
    title = 'Функция ничего не возвращает';
    causes.push(lang === 'python' ? 'Функция без return возвращает None.' : 'Функция без return возвращает undefined.');
    if (/print\(|console\.log\(/.test(code)) causes.push('print/console.log только показывает значение на экране, но не возвращает его вызывающему коду.');
    steps.push('Замените вывод на `return значение` в конце функции.');
    questions.push('Чем отличается «показать значение» от «вернуть значение»?');
  } else if (na !== null && ne !== null && Math.abs(na - ne) === 1) {
    title = 'Ответ отличается на единицу';
    causes.push('Типичная ошибка «на единицу»: граница цикла/range или < вместо <=.');
    steps.push('Проверьте первую и последнюю итерацию цикла вручную.');
    questions.push('Включается ли последний элемент в ваш диапазон?');
  } else if (na !== null && ne !== null && Number.isInteger(ne) && !Number.isInteger(na) && Math.trunc(na) === ne) {
    title = 'Дробная часть лишняя';
    causes.push(lang === 'python' ? 'Оператор `/` всегда даёт float; целочисленное деление — `//`.' : 'Деление даёт дробь; используйте Math.floor/Math.trunc.');
    steps.push('Определите, нужно ли целочисленное деление.');
  } else if (stripQuotes(actual) === stripQuotes(expected) && actual !== expected) {
    title = 'Не тот тип значения';
    causes.push(`Значение совпадает, но тип — нет: получено ${actual}, ожидается ${expected} (строка ≠ число).`);
    steps.push('Преобразуйте результат к нужному типу.');
    questions.push('Какой тип должен возвращать код?');
  } else if (/^[[(]/.test(actual) && /^[[(]/.test(expected)) {
    const items = (s: string) => s.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean).sort().join(',');
    if (items(actual) === items(expected)) {
      title = 'Элементы те же, порядок другой';
      causes.push('Проверьте порядок обхода и сортировку.');
    } else if (actual.length < expected.length) {
      causes.push('Не хватает элементов: цикл заканчивается раньше или условие отбрасывает лишнее.');
    } else {
      causes.push('Лишние элементы: условие отбора слишком мягкое или элементы добавляются повторно.');
    }
    if (actual.startsWith('(') !== expected.startsWith('(')) causes.push('Кортеж и список — разные типы: (1, 2) ≠ [1, 2].');
    steps.push('Проследите, как список заполняется, на маленьком примере.');
  } else if (/^(True|False|true|false)$/.test(actual) && /^(True|False|true|false)$/.test(expected)) {
    title = 'Условие работает наоборот';
    causes.push('Проверьте логику условия: and/or, not, знак сравнения.');
    questions.push('Для каких входов условие должно быть истинным?');
  } else {
    causes.push('Результат отличается от ожидаемого.');
  }
  if (!steps.length) steps.push('Вызовите функцию с этим входом сами и выведите промежуточные значения.', 'Попробуйте визуализатор, чтобы проследить выполнение по шагам.');
  if (!questions.length) questions.push('Что делает код на этом входе шаг за шагом?');
  if (r.hidden) questions.unshift(`Что особенного во входе «${r.label}»?`);
  return { ...base, title, category: r.hidden ? 'edge' : 'logic', summary: r.hidden ? `Не пройден скрытый тест (${r.label}).` : `${r.expr ?? ''} → ${actual}, ожидалось ${expected}.`, causes, steps, questions };
}

const OPENERS: Record<FeedbackTone, string[]> = {
  friendly: ['Это очень частая ошибка — с ней сталкиваются все.', 'Хорошая новость: ошибка подсказывает, где искать.', 'Ничего страшного — разберёмся по шагам.'],
  neutral: [''],
  socratic: ['Попробуйте найти причину сами — вот вопросы, которые помогут.'],
};

export function formatTerm(term: { en: string; ru: string }, style: TermsStyle = 'ru+en'): string {
  if (style === 'ru') return term.ru;
  return style === 'en-first' ? `${term.en} — ${term.ru}` : `${term.ru} — ${term.en}`;
}

/** Shape an explanation for the learner's preferences. */
export function shape(e: Explanation, p: FeedbackPrefs, seed = 0) {
  const opener = OPENERS[p.tone][seed % OPENERS[p.tone].length];
  const show = {
    opener,
    title: e.title,
    summary: e.summary,
    causes: p.depth === 'brief' ? e.causes.slice(0, 1) : e.causes,
    steps: p.depth === 'brief' ? e.steps.slice(0, 1) : e.steps,
    questions: p.tone === 'socratic' ? e.questions : p.socraticDelay ? e.questions.slice(0, 2) : p.depth === 'deep' ? e.questions.slice(0, 1) : [],
    /** With a delay, the explanation stays hidden until requested — only when there is a question to think about. */
    gated: !!p.socraticDelay && e.questions.length > 0,
    /** Socratic mode hides direct fixes behind a toggle. */
    stepsCollapsed: p.tone === 'socratic',
    deep: p.depth === 'deep' ? e.deep : undefined,
    term: p.showTerms ? e.term : undefined,
    termLabel: p.showTerms && e.term ? formatTerm(e.term, p.termsStyle) : undefined,
    line: e.line,
    snippet: e.snippet,
    category: e.category,
  };
  return show;
}
export type ShapedExplanation = ReturnType<typeof shape>;
