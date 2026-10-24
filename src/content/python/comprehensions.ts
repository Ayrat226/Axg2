import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const comprehensions: SkillModule = {
  skill: {
    id: 'py.comprehensions',
    route: 'python',
    title: 'Comprehensions, zip и enumerate',
    icon: '⚡',
    summary: 'Списковые, словарные и множественные включения, условия в них, генераторные выражения, zip и enumerate.',
    prereqs: ['py.lists', 'py.dicts'],
    tier: 3,
    outcomes: [
      'Превращаю цикл «собрать список» в списковое включение и обратно',
      'Использую условия в включениях и различаю фильтр (if в конце) и выбор значения (if/else в начале)',
      'Создаю dict- и set-включения и генераторные выражения, понимая их ленивость',
      'Применяю zip и enumerate вместо ручной работы с индексами',
    ],
    estMinutes: 30,
    lesson: {
      why: 'Включения — самая «питоническая» запись преобразования данных: короче цикла и обычно быстрее. zip и enumerate избавляют от ошибок с индексами.',
      brief: md`§[выражение for x in данные if условие]§ — новый список. Для словарей §{k: v for ...}§, для множеств §{x for ...}§. Круглые скобки §(x for ...)§ — **ленивый** генератор. §zip(a, b)§ идёт параллельно по нескольким последовательностям, §enumerate(a)§ даёт пары (индекс, значение).`,
      standard: md`**Списковое включение** заменяет цикл с §append§:

§§§python
squares = []
for n in range(5):
    squares.append(n * n)

squares = [n * n for n in range(5)]   # то же самое
§§§

**Условия.** Два разных места для §if§:

§§§python
evens = [n for n in nums if n % 2 == 0]         # фильтр: if В КОНЦЕ
signs = ["+" if n > 0 else "-" for n in nums]   # выбор значения: if/else В НАЧАЛЕ
§§§

Если написать §[n for n in nums if n > 0 else 0]§ — будет SyntaxError: у фильтра нет §else§.

**Словари и множества:**

§§§python
lengths = {w: len(w) for w in words}   # dict comprehension
letters = {ch for ch in text}          # set comprehension
§§§

**Генераторное выражение** — те же правила, но круглые скобки и **ленивое** вычисление: значения создаются по одному, когда их запрашивают.

§§§python
total = sum(n * n for n in range(1_000_000))   # список в памяти не создаётся
§§§

**Вложенные циклы** читаются слева направо, как обычные: §[x for row in matrix for x in row]§ — «разворачивание» таблицы.

**enumerate и zip:**

§§§python
for i, name in enumerate(["a", "b"], start=1):   # (1, "a"), (2, "b")
    print(i, name)
pairs = dict(zip(["x", "y"], [10, 20]))          # {"x": 10, "y": 20}
§§§

§zip§ останавливается на **самой короткой** последовательности (лишние элементы отбрасываются молча).`,
      deep: md`**Область видимости.** Переменная включения (§n§ в §[n for n in ...]§) живёт только внутри выражения и не «протекает» наружу (в отличие от цикла §for§). Если включение пишется в теле класса или функции, оно выполняется в отдельной области.

**Ленивость и одноразовость.** Генераторное выражение — итератор: значения берутся один раз. §g = (x for x in data)§; §sum(g)§ исчерпывает его, и второй §sum(g)§ вернёт 0. Нужен повторный обход — стройте список или создавайте генератор заново. У генератора нет §len()§ и индексов.

**Память и скорость.** Список в памяти хранит все элементы, генератор — одно значение за раз: для §sum§, §max§, §any§, §all§ и сборки строк через §"".join(...)§ генератор экономит память. Для небольших данных списковое включение обычно быстрее (нет накладных расходов на генератор), а для больших и «потоковых» — генератор.

**Короткое замыкание.** §any(x > 10 for x in nums)§ останавливается на первом найденном совпадении, а §any([x > 10 for x in nums])§ сначала строит весь список.

**Читаемость.** Включение должно помещаться в одну-две строки. Больше двух уровней вложенности или сложные условия лучше расписать обычным циклом. Не используйте включения ради побочных эффектов (§[print(x) for x in a]§ создаёт ненужный список из None).

**zip и enumerate — тоже итераторы.** §zip(a, b)§ возвращает ленивый итератор кортежей; §zip(*pairs)§ «транспонирует». В Python 3.10+ есть §zip(a, b, strict=True)§, который вызывает ValueError при разной длине. §itertools.zip_longest§ дополняет короткие последовательности значением-заполнителем.

**Словари из пар:** §dict(zip(keys, values))§; при повторяющихся ключах побеждает последний.`,
      analogy: 'Списковое включение — как конвейер на фабрике: вход (данные), фильтр (отбраковка), станок (выражение), выход (новый список). Генераторное выражение — тот же конвейер, но детали сходят с ленты по одной, только когда за ними пришли.',
      example: {
        lang: 'python',
        code: py`nums = [1, 2, 3, 4, 5, 6]
squares = [n * n for n in nums if n % 2 == 0]
labels = ["чёт" if n % 2 == 0 else "нечет" for n in nums[:3]]
lengths = {w: len(w) for w in ["кот", "собака"]}
letters = {ch for ch in "hello"}
total = sum(n * n for n in nums)
print(squares, labels, lengths)
print(sorted(letters), total)
for i, name in enumerate(["a", "b"], start=1):
    print(i, name)
print(dict(zip(["x", "y"], [10, 20])))`,
        steps: [
          'Фильтр §if n % 2 == 0§ в конце оставляет чётные числа, а выражение §n * n§ возводит их в квадрат: 4, 16, 36.',
          'Тернарное выражение §"чёт" if ... else "нечет"§ стоит в начале — оно выбирает значение для каждого элемента.',
          'Словарное включение создаёт пары «слово → длина», множественное — убирает повторяющиеся буквы §l§.',
          'Генераторное выражение внутри §sum§ не создаёт промежуточный список: 1 + 4 + 9 + 16 + 25 + 36 = 91.',
          '§enumerate§ с §start=1§ нумерует с единицы, а §zip§ соединяет два списка попарно.',
        ].map((s) => s.replace(/§/g, '`')),
        output: "[4, 16, 36] ['нечет', 'чёт', 'нечет'] {'кот': 3, 'собака': 6}\n['e', 'h', 'l', 'o'] 91\n1 a\n2 b\n{'x': 10, 'y': 20}",
      },
      counterexample: {
        lang: 'python',
        code: py`gen = (x * 2 for x in range(3))
print(sum(gen))   # 6
print(sum(gen))   # 0 — генератор уже исчерпан!`,
        explain: 'Генераторное выражение — одноразовый итератор. После первого прохода он пуст. Если данные нужны повторно, используйте список.',
      },
      pitfalls: [
        md`Путать место §if§: фильтр — в конце (§... if cond§), выбор значения — §a if cond else b§ в начале.`,
        md`Считать генераторное выражение списком: у него нет §len()§, индексов, и проходить по нему можно один раз.`,
        md`Забывать, что §zip§ молча отбрасывает хвост более длинной последовательности.`,
        md`Писать вложенные включения на три уровня и сложные условия — читаемость важнее краткости.`,
      ],
      sources: [
        { title: 'Python Tutorial — List Comprehensions', url: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions' },
        { title: 'Language Reference — Displays for lists, sets and dictionaries', url: 'https://docs.python.org/3/reference/expressions.html#displays-for-lists-sets-and-dictionaries' },
        { title: 'Built-in Functions — zip()', url: 'https://docs.python.org/3/library/functions.html#zip' },
        { title: 'Built-in Functions — enumerate()', url: 'https://docs.python.org/3/library/functions.html#enumerate' },
      ],
    },
    misconceptions: [
      {
        id: 'if-position',
        title: 'Условие if в включении всегда пишется в конце',
        explanation: 'В конце стоит только фильтр (без else). Если нужно выбрать между двумя значениями, if/else пишется в начале, перед for.',
        fix: 'Фильтр: [x for x in a if cond]. Выбор значения: [a if cond else b for x in data].',
      },
      {
        id: 'generator-is-list',
        title: 'Генераторное выражение — это список в круглых скобках',
        explanation: 'Это ленивый итератор: он не хранит значения, не имеет len(), и после одного прохода пуст.',
        fix: 'Нужен многократный доступ — оберните в list(...).',
      },
      {
        id: 'zip-pads',
        title: 'zip дополняет короткую последовательность пустыми значениями',
        explanation: 'zip останавливается на самой короткой последовательности, лишние элементы отбрасываются без предупреждения.',
        fix: 'Используйте itertools.zip_longest или zip(..., strict=True), если длины должны совпадать.',
      },
      {
        id: 'comp-always-better',
        title: 'Включение всегда лучше цикла',
        explanation: 'Для сложной логики и побочных эффектов цикл читается лучше. Включение предназначено для простого преобразования или фильтрации.',
        fix: 'Если включение не помещается в 1–2 строки, перепишите его циклом.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.comprehensions.1',
      skill: 'py.comprehensions',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`print([x * x for x in range(5) if x % 2 == 0])`,
      answer: '[0, 4, 16]',
      explanation: 'Из чисел 0…4 условие оставляет чётные (0, 2, 4), а выражение возводит их в квадрат.',
    },
    {
      id: 'py.comprehensions.2',
      skill: 'py.comprehensions',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Из `nums = [-1, 2, -3]` нужно получить `[0, 2, 0]` (отрицательные заменить нулями). Какая запись верна?',
      options: [
        { text: '[x if x > 0 else 0 for x in nums]', correct: true, why: 'if/else выбирает значение для каждого элемента, поэтому стоит перед for.' },
        { text: '[x for x in nums if x > 0 else 0]', why: 'SyntaxError: у фильтра (if в конце) не бывает else.', misconception: 'if-position' },
        { text: '[x for x in nums if x > 0]', why: 'Это фильтр — получится [2]: отрицательные элементы пропадут, а не заменятся нулями.', misconception: 'if-position' },
        { text: '[0 for x in nums]', why: 'Все элементы заменятся на 0, включая положительные.' },
      ],
      explanation: 'Фильтр — `if` в конце без `else`; выбор значения — тернарное выражение в начале.',
    },
    {
      id: 'py.comprehensions.3',
      skill: 'py.comprehensions',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите `word_lengths(text)`: вернуть словарь «слово → длина слова» для слов текста (повторяющиеся слова встречаются в словаре один раз).',
      starter: py`def word_lengths(text):
    pass
`,
      solution: py`def word_lengths(text):
    return {w: len(w) for w in text.split()}
`,
      tests: [
        { expr: 'word_lengths("кот собака")', expect: '{"кот": 3, "собака": 6}' },
        { expr: 'word_lengths("aa b aa")', expect: '{"aa": 2, "b": 1}' },
        { expr: 'word_lengths("")', expect: '{}', hidden: true, label: 'пустой текст' },
        { expr: 'word_lengths("  x   yy ")', expect: '{"x": 1, "yy": 2}', hidden: true, label: 'лишние пробелы' },
      ],
      hints: [
        'Какая структура хранит пары «ключ → значение», а какое включение её строит?',
        'Слова получаются через `text.split()`.',
        'Словарное включение: `{w: len(w) for w in ...}`.',
      ],
      explanation: 'Словарное включение собирает пары за один проход; повторяющиеся ключи просто перезаписываются тем же значением.',
    },
    {
      id: 'py.comprehensions.4',
      skill: 'py.comprehensions',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите `pairs(names, scores)`: вернуть словарь «имя → балл», объединив два списка попарно. Если списки разной длины — лишние элементы игнорируются.',
      starter: py`def pairs(names, scores):
    pass
`,
      solution: py`def pairs(names, scores):
    return dict(zip(names, scores))
`,
      tests: [
        { expr: 'pairs(["a", "b"], [1, 2])', expect: '{"a": 1, "b": 2}' },
        { expr: 'pairs(["a", "b", "c"], [1])', expect: '{"a": 1}', hidden: true, label: 'имён больше, чем баллов' },
        { expr: 'pairs(["a"], [1, 2, 3])', expect: '{"a": 1}', hidden: true, label: 'баллов больше, чем имён' },
        { expr: 'pairs([], [])', expect: '{}', hidden: true, label: 'пустые списки' },
      ],
      hints: [
        'Какая встроенная функция соединяет два списка попарно?',
        'Что получится, если передать результат этой функции в `dict(...)`?',
        '`dict(zip(names, scores))` — а лишние элементы `zip` отбросит сам.',
      ],
      explanation: '`zip` останавливается на самой короткой последовательности, а `dict` принимает пары (ключ, значение). Если нужна строгая проверка длины — `zip(..., strict=True)`.',
    },
    {
      id: 'py.comprehensions.5',
      skill: 'py.comprehensions',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Напишите `flatten(matrix)`: превратите список списков в один плоский список (в порядке строк). Пустые строки допустимы.',
      starter: py`def flatten(matrix):
    pass
`,
      solution: py`def flatten(matrix):
    return [x for row in matrix for x in row]
`,
      tests: [
        { expr: 'flatten([[1, 2], [3]])', expect: '[1, 2, 3]' },
        { expr: 'flatten([[1], [2], [3]])', expect: '[1, 2, 3]' },
        { expr: 'flatten([])', expect: '[]', hidden: true, label: 'пустая матрица' },
        { expr: 'flatten([[], [1], []])', expect: '[1]', hidden: true, label: 'пустые строки' },
        { expr: 'flatten([["a", "b"], ["c"]])', expect: '["a", "b", "c"]', hidden: true, label: 'строки вместо чисел' },
      ],
      hints: [
        'Сколько уровней вложенности нужно пройти?',
        'Включение с двумя `for` читается слева направо, как вложенные циклы.',
        '`[x for row in matrix for x in row]`: сначала строки, затем элементы строки.',
      ],
      explanation: 'Порядок `for` в включении такой же, как во вложенных циклах: внешний цикл идёт первым. Пустые строки не добавляют элементов.',
    },
    {
      id: 'py.comprehensions.6',
      skill: 'py.comprehensions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'syntax',
      prompt: 'Функция должна вернуть квадраты только чётных чисел, но код не запускается. Исправьте синтаксис.',
      buggy: py`def even_squares(nums):
    return [n ** 2 if n % 2 == 0 for n in nums]
`,
      solution: py`def even_squares(nums):
    return [n ** 2 for n in nums if n % 2 == 0]
`,
      tests: [
        { expr: 'even_squares([1, 2, 3, 4])', expect: '[4, 16]' },
        { expr: 'even_squares([5, 7])', expect: '[]' },
        { expr: 'even_squares([])', expect: '[]', hidden: true, label: 'пустой список' },
        { expr: 'even_squares([-2, -1])', expect: '[4]', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Прочитайте SyntaxError: какая часть выражения вызывает претензию?',
        '`if` без `else` — это фильтр. Где он должен находиться относительно `for`?',
        'Переместите условие в конец: `... for n in nums if n % 2 == 0`.',
      ],
      explanation: 'Фильтрующий `if` без `else` пишется после `for`. До `for` допустимо только тернарное выражение с обязательным `else`.',
    },
    {
      id: 'py.comprehensions.7',
      skill: 'py.comprehensions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'edge',
      prompt: 'Функция должна вернуть первое число больше 10 или `None`, если такого нет, но иногда падает с `StopIteration`. Исправьте.',
      buggy: py`def first_big(nums):
    return next(x for x in nums if x > 10)
`,
      solution: py`def first_big(nums):
    return next((x for x in nums if x > 10), None)
`,
      tests: [
        { expr: 'first_big([1, 20, 30])', expect: '20' },
        { expr: 'first_big([5, 11])', expect: '11' },
        { expr: 'first_big([])', expect: 'None', hidden: true, label: 'пустой список' },
        { expr: 'first_big([1, 2, 10])', expect: 'None', hidden: true, label: 'подходящих нет (10 не больше 10)' },
      ],
      hints: [
        'Что делает `next`, когда генератор исчерпан, а значения по умолчанию нет?',
        '`next(iterator, default)` принимает второй аргумент.',
        'Генераторное выражение внутри вызова с несколькими аргументами нужно взять в свои скобки: `next((... ), None)`.',
      ],
      explanation: 'Без значения по умолчанию `next` бросает StopIteration, когда элементов не осталось. Второй аргумент возвращается вместо исключения.',
    },
    {
      id: 'py.comprehensions.8',
      skill: 'py.comprehensions',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`gen = (x * 2 for x in range(3))
print(sum(gen), sum(gen))
for i, ch in enumerate("ab", start=1):
    print(i, ch)
print(list(zip([1, 2, 3], "ab")))`,
      answer: "6 0\n1 a\n2 b\n[(1, 'a'), (2, 'b')]",
      explanation: 'Первый `sum` исчерпывает генератор (0 + 2 + 4 = 6), второй получает пустой итератор и возвращает 0. `enumerate(..., start=1)` нумерует с единицы, а `zip` обрезает результат по самой короткой последовательности.',
    },
    {
      id: 'py.comprehensions.9',
      skill: 'py.comprehensions',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Чем отличаются `sum([x * x for x in range(10**7)])` и `sum(x * x for x in range(10**7))` по памяти и когда нужен именно список?',
      code: py`a = sum([x * x for x in range(10**7)])
b = sum(x * x for x in range(10**7))`,
      keyPoints: [
        'Списковое включение сначала строит весь список в памяти, а генераторное выражение выдаёт значения по одному',
        'Для однопроходной агрегации (sum, max, any) генератор экономит память',
        'Список нужен, если данные используются повторно, нужны индексы, len() или срезы',
      ],
      modelAnswer: 'В первой строке сначала создаётся список из десяти миллионов чисел, и только потом sum его обходит — это сотни мегабайт памяти. Во второй генераторное выражение выдаёт числа по одному, и память почти не тратится. Список нужен, когда данные требуются несколько раз, нужен доступ по индексу, len или срезы: генератор одноразовый и ничего этого не поддерживает.',
      explanation: 'Правило: для однократного прохода — генератор, для повторного использования — список.',
    },
  ],
};
