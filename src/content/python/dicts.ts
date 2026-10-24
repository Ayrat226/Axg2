import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const dicts: SkillModule = {
  skill: {
    id: 'py.dicts',
    route: 'python',
    title: 'Словари и множества',
    icon: '🗂️',
    summary: 'dict и set: get/setdefault, обход items(), шаблон подсчёта, операции над множествами.',
    prereqs: ['py.lists'],
    tier: 2,
    outcomes: [
      'Создаю словари, читаю значения безопасно через get и перебираю пары через items()',
      'Применяю шаблон подсчёта и группировки (counts[k] = counts.get(k, 0) + 1)',
      'Использую множества для удаления дубликатов, проверки принадлежности и операций &, |, -, ^',
      'Объясняю требование хэшируемости ключей и порядок хранения в dict и set',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Словари отвечают на вопрос «что соответствует этому ключу?» за мгновение: частоты слов, настройки, JSON, индексы, кэши. Множества — быстрый способ убрать дубликаты и сравнить наборы.',
      brief: md`§dict§ — пары ключ → значение: §d["k"] = v§, §d.get("k", по_умолчанию)§, §for k, v in d.items()§. Ключи уникальны и хэшируемы. §set§ — набор уникальных элементов без порядка: §&§ пересечение, §|§ объединение, §-§ разность. Пустой словарь — §{}§, пустое множество — §set()§.`,
      standard: md`**Словарь** хранит пары «ключ → значение». Поиск по ключу не зависит от размера словаря:

§§§python
user = {"name": "Аня", "age": 20}
user["city"] = "Омск"        # добавить
user["age"] += 1             # изменить
print(user["name"])          # Аня
print(user.get("phone"))     # None — ключа нет, ошибки нет
print(user.get("phone", "-"))
del user["city"]             # удалить; pop("city", None) — без KeyError
§§§

Обращение §user["phone"]§ к отсутствующему ключу вызывает **KeyError**. Оператор §in§ проверяет **ключи**: §"name" in user§.

**Перебор.** §for k in d§ — по ключам, §d.values()§ — по значениям, §d.items()§ — по парам:

§§§python
for key, value in user.items():
    print(key, value)
§§§

С Python 3.7 словарь **помнит порядок вставки**.

**Шаблон «подсчёт»:**

§§§python
counts = {}
for ch in "abracadabra":
    counts[ch] = counts.get(ch, 0) + 1
§§§

Похожий шаблон «группировка»: §groups.setdefault(key, []).append(item)§ — создаёт пустой список, если ключа ещё нет.

**Множество** (§set§) — неупорядоченный набор **уникальных** элементов. Нет индексов и порядка, зато быстрая проверка §x in s§:

§§§python
a = {1, 2, 3, 4}
b = {3, 4, 5}
print(a & b)    # {3, 4}          пересечение
print(a | b)    # {1, 2, 3, 4, 5} объединение
print(a - b)    # {1, 2}          разность
print(a ^ b)    # {1, 2, 5}       симметрическая разность
unique = set([1, 1, 2])         # дубликаты исчезают
§§§

**Важно:** §{}§ — это **пустой словарь**; пустое множество создаётся только как §set()§. Порядок элементов множества не гарантируется, поэтому при выводе используйте §sorted(s)§.`,
      deep: md`**Хэш-таблицы.** Словарь и множество реализованы как хэш-таблицы: ключ превращается в число через §hash()§, по которому находится ячейка. Поэтому поиск, вставка и удаление — O(1) **в среднем**. Проверка §x in some_list§ — O(n), а §x in some_set§ — O(1): замена списка множеством в «горячих» местах ускоряет программу на порядки.

**Хэшируемость.** Ключом может быть только хэшируемый объект: числа, строки, кортежи из хэшируемых элементов, §frozenset§. Список, словарь и множество — нет: §{[1]: 2}§ → TypeError: unhashable type. Объекты, равные по §==§, должны иметь равные хэши, поэтому §1§, §1.0§ и §True§ — **один и тот же** ключ: §{1: "a", True: "b"}§ → §{1: "b"}§.

**Изменение во время обхода.** Нельзя добавлять или удалять ключи, перебирая словарь: RuntimeError: dictionary changed size during iteration. Меняйте значения существующих ключей или обходите копию §list(d)§.

**Представления (views).** §d.keys()§, §d.values()§, §d.items()§ — «живые» представления: они отражают изменения словаря. §keys()§ и §items()§ ведут себя как множества: §d1.keys() & d2.keys()§ — общие ключи.

**Слияние.** §{**a, **b}§ или §a | b§ (3.9+) объединяют словари; при совпадении ключей побеждает правый. Метод §update§ делает то же на месте.

**Множества и порядок.** Порядок элементов §set§ зависит от хэшей и истории вставок; для строк он меняется между запусками из-за «соли» хэширования (PYTHONHASHSEED). Никогда не полагайтесь на порядок множества — только на §sorted(...)§.

**Когда что выбрать:** дубликаты и принадлежность — §set§; «ключ → значение» — §dict§; упорядоченная последовательность — §list§; запись фиксированной структуры — §tuple§ или класс.`,
      analogy: 'Словарь — как телефонная книга: вы ищете по имени (ключу), а не листаете страницы. Множество — как список гостей на входе: важно, есть ли имя в списке, а не в каком порядке их записали.',
      example: {
        lang: 'python',
        code: py`scores = {"аня": 5, "боб": 3}
scores["ким"] = 4
scores["боб"] += 1
print(scores)
print(scores.get("зоя", 0), "аня" in scores, len(scores))
for name, score in scores.items():
    print(name, score)
counts = {}
for ch in "abracadabra":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)
print(sorted({1, 2, 3} & {2, 3, 4}))`,
        steps: [
          'Присваивание по новому ключу §"ким"§ добавляет пару; §+=§ по существующему ключу читает значение и записывает обновлённое.',
          '§get("зоя", 0)§ не вызывает KeyError и возвращает значение по умолчанию; §in§ проверяет наличие ключа.',
          '§items()§ отдаёт пары (ключ, значение), которые распаковываются в две переменные.',
          'Шаблон подсчёта: §counts.get(ch, 0)§ даёт 0 для нового символа, затем прибавляется 1.',
          'Пересечение множеств §&§ оставляет общие элементы; §sorted§ делает вывод детерминированным.',
        ].map((s) => s.replace(/§/g, '`')),
        output: "{'аня': 5, 'боб': 4, 'ким': 4}\n0 True 3\nаня 5\nбоб 4\nким 4\n{'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1}\n[2, 3]",
      },
      counterexample: {
        lang: 'python',
        code: py`counts = {}
for ch in "aab":
    counts[ch] += 1   # KeyError: 'a'`,
        explain: 'При первом появлении символа ключа ещё нет, и чтение counts[ch] падает с KeyError. Используйте counts.get(ch, 0) + 1 или collections.Counter.',
      },
      pitfalls: [
        md`Читать §d[key]§ для ключа, которого может не быть: используйте §d.get(key)§ или проверяйте §key in d§.`,
        md`Создавать пустое множество через §{}§ — получится словарь. Нужно §set()§.`,
        md`Полагаться на порядок элементов множества или выводить множество «как есть» в тесте — порядок не определён, используйте §sorted§.`,
        md`Использовать список как ключ словаря: TypeError (unhashable). Преобразуйте в кортеж.`,
      ],
      sources: [
        { title: 'Python Tutorial — Dictionaries', url: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries' },
        { title: 'Python Tutorial — Sets', url: 'https://docs.python.org/3/tutorial/datastructures.html#sets' },
        { title: 'Built-in Types — Mapping Types (dict)', url: 'https://docs.python.org/3/library/stdtypes.html#mapping-types-dict' },
        { title: 'Built-in Types — Set Types', url: 'https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset' },
      ],
    },
    misconceptions: [
      {
        id: 'missing-key-none',
        title: 'd[key] для отсутствующего ключа возвращает None',
        explanation: 'Квадратные скобки вызывают KeyError. None возвращает только метод get().',
        fix: 'Используйте d.get(key) или d.get(key, default); либо проверяйте key in d.',
      },
      {
        id: 'empty-braces-set',
        title: '{} — это пустое множество',
        explanation: 'Пустые фигурные скобки создают словарь. Множество из элементов записывается {1, 2}, а пустое — только set().',
        fix: 'Для пустого множества пишите set().',
      },
      {
        id: 'set-ordered',
        title: 'Множество хранит элементы по порядку и поддерживает индексы',
        explanation: 'Множество — неупорядоченная коллекция: s[0] вызывает TypeError, а порядок вывода не гарантирован.',
        fix: 'Нужен порядок — используйте sorted(s) или список.',
      },
      {
        id: 'unhashable-key',
        title: 'Ключом словаря может быть любой объект',
        explanation: 'Ключ должен быть хэшируемым: списки, словари и множества не подходят (TypeError: unhashable type).',
        fix: 'Превратите список в кортеж или frozenset.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.dicts.1',
      skill: 'py.dicts',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`d = {"a": 1, "b": 2}
d["c"] = 3
d["a"] += 10
print(d, len(d), "b" in d, d.get("z", 0))`,
      answer: "{'a': 11, 'b': 2, 'c': 3} 3 True 0",
      explanation: 'Новый ключ добавляется в конец (словарь помнит порядок вставки), `+=` обновляет значение по существующему ключу, `in` проверяет ключи, а `get` с значением по умолчанию возвращает 0 для отсутствующего ключа.',
    },
    {
      id: 'py.dicts.2',
      skill: 'py.dicts',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что вернёт `type({})`?',
      options: [
        { text: "<class 'dict'>", correct: true, why: 'Пустые фигурные скобки — это пустой словарь.' },
        { text: "<class 'set'>", why: 'Множество из элементов пишется {1, 2}, но пустое — только `set()`.', misconception: 'empty-braces-set' },
        { text: "<class 'list'>", why: 'Список записывается квадратными скобками.' },
        { text: 'SyntaxError', why: 'Выражение `{}` корректно: это пустой словарь.' },
      ],
      explanation: 'Пустое множество создаётся только вызовом `set()`.',
    },
    {
      id: 'py.dicts.3',
      skill: 'py.dicts',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите функцию `char_count(text)`, которая возвращает словарь «символ → сколько раз встретился».',
      starter: py`def char_count(text):
    pass
`,
      solution: py`def char_count(text):
    counts = {}
    for ch in text:
        counts[ch] = counts.get(ch, 0) + 1
    return counts
`,
      tests: [
        { expr: 'char_count("abca")', expect: '{"a": 2, "b": 1, "c": 1}' },
        { expr: 'char_count("zzz")', expect: '{"z": 3}' },
        { expr: 'char_count("")', expect: '{}', hidden: true, label: 'пустая строка' },
        { expr: 'char_count("aA")', expect: '{"a": 1, "A": 1}', hidden: true, label: 'регистр различается' },
        { expr: 'char_count("а б")', expect: '{"а": 1, " ": 1, "б": 1}', hidden: true, label: 'пробел и кириллица' },
      ],
      hints: [
        'Что должно быть ключом, а что — значением?',
        'При первой встрече символа его ещё нет в словаре. Чем можно заменить отсутствующее значение?',
        '`counts[ch] = counts.get(ch, 0) + 1` внутри цикла по символам.',
      ],
      explanation: '`get(ch, 0)` возвращает 0 для нового символа, и шаблон работает без проверки `if ch in counts`.',
    },
    {
      id: 'py.dicts.4',
      skill: 'py.dicts',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите функцию `top_key(d)`: вернуть ключ с наибольшим значением. При равенстве — тот, что вставлен раньше. Для пустого словаря — `None`.',
      starter: py`def top_key(d):
    pass
`,
      solution: py`def top_key(d):
    keys = list(d)
    if not keys:
        return None
    best = keys[0]
    for key in keys[1:]:
        if d[key] > d[best]:
            best = key
    return best
`,
      tests: [
        { expr: 'top_key({"a": 1, "b": 3, "c": 2})', expect: '"b"' },
        { expr: 'top_key({"x": 7})', expect: '"x"' },
        { expr: 'top_key({})', expect: 'None', hidden: true, label: 'пустой словарь' },
        { expr: 'top_key({"x": 2, "y": 2})', expect: '"x"', hidden: true, label: 'ничья — первый вставленный' },
        { expr: 'top_key({"a": -5, "b": -2})', expect: '"b"', hidden: true, label: 'отрицательные значения' },
        { expr: 'top_key({None: 5, "a": 3})', expect: 'None', hidden: true, label: 'None — допустимый ключ' },
      ],
      hints: [
        'Нужна переменная «лучший ключ на данный момент». Пустой словарь разберите отдельно, до цикла: `None` тут может быть и настоящим ключом, поэтому не используйте его как признак «лидера ещё нет».',
        'Сравнивайте не ключи, а значения: `d[key] > d[best]`.',
        'Чтобы при равенстве выигрывал первый, используйте строгое `>`.',
      ],
      explanation: 'Пустой словарь обрабатываем отдельно, а лидером сначала делаем первый ключ: так `None` не нужен как признак «лидера нет» и не конфликтует с ключом `None`. Строгое сравнение не заменяет лидера при равенстве, поэтому остаётся ключ, вставленный раньше.',
    },
    {
      id: 'py.dicts.5',
      skill: 'py.dicts',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'runtime',
      prompt: 'Функция должна подсчитать, сколько раз каждое слово встречается в тексте, но падает с KeyError. Исправьте.',
      buggy: py`def word_freq(text):
    freq = {}
    for word in text.split():
        freq[word] += 1
    return freq
`,
      solution: py`def word_freq(text):
    freq = {}
    for word in text.split():
        freq[word] = freq.get(word, 0) + 1
    return freq
`,
      tests: [
        { expr: 'word_freq("a b a")', expect: '{"a": 2, "b": 1}' },
        { expr: 'word_freq("go go go")', expect: '{"go": 3}' },
        { expr: 'word_freq("")', expect: '{}', hidden: true, label: 'пустой текст' },
        { expr: 'word_freq("  x   y  x ")', expect: '{"x": 2, "y": 1}', hidden: true, label: 'лишние пробелы' },
      ],
      hints: [
        'Прочитайте сообщение KeyError: какой ключ не найден и когда?',
        'При первой встрече слова в словаре ещё нет такого ключа.',
        'Используйте `freq.get(word, 0) + 1` вместо `freq[word] + 1`.',
      ],
      explanation: '`freq[word] += 1` сначала читает значение, а оно отсутствует при первой встрече → KeyError. `get` с умолчанием 0 решает проблему.',
    },
    {
      id: 'py.dicts.6',
      skill: 'py.dicts',
      kind: 'predict',
      difficulty: 2,
      lang: 'python',
      prompt: 'Что выведет программа? (Порядок в множествах мы фиксируем через `sorted`.)',
      code: py`a = {1, 2, 3, 4}
b = {3, 4, 5}
print(sorted(a & b), sorted(a | b), sorted(a - b), sorted(a ^ b))
print(len({1, 1, 2, True}), {} == set())`,
      answer: '[3, 4] [1, 2, 3, 4, 5] [1, 2] [1, 2, 5]\n2 False',
      explanation: '`&` — общие элементы, `|` — все, `-` — только из `a`, `^` — элементы, которые есть ровно в одном из множеств. `True == 1` и хэши у них равны, поэтому в множестве {1, 1, 2, True} остаётся два элемента. `{}` — словарь, он не равен пустому множеству.',
    },
    {
      id: 'py.dicts.7',
      skill: 'py.dicts',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Напишите функцию `common_words(a, b)`: вернуть **отсортированный список** слов в нижнем регистре, которые есть в обеих строках (слова разделяются пробелами, знаки препинания не учитываются как особые; сравнение без учёта регистра, без повторов).',
      starter: py`def common_words(a, b):
    pass
`,
      solution: py`def common_words(a, b):
    first = set(a.lower().split())
    second = set(b.lower().split())
    return sorted(first & second)
`,
      tests: [
        { expr: 'common_words("a b c", "B c d")', expect: '["b", "c"]' },
        { expr: 'common_words("red green", "blue")', expect: '[]' },
        { expr: 'common_words("", "x")', expect: '[]', hidden: true, label: 'одна строка пустая' },
        { expr: 'common_words("x x y", "y y x")', expect: '["x", "y"]', hidden: true, label: 'повторы не дублируются' },
        { expr: 'common_words("Привет МИР", "мир привет")', expect: '["мир", "привет"]', hidden: true, label: 'кириллица и регистр' },
      ],
      hints: [
        'Какая структура убирает повторы и умеет искать общие элементы?',
        'Преобразуйте каждую строку: `set(text.lower().split())`.',
        'Пересечение `&` даст общие слова; результат нужно превратить в отсортированный список.',
      ],
      explanation: 'Множества автоматически убирают дубли, а `&` находит общие элементы. `sorted` превращает неупорядоченный результат в детерминированный список.',
    },
    {
      id: 'py.dicts.8',
      skill: 'py.dicts',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите программу, которая суммирует цены из словаря и печатает итог (`8`).',
      lines: [
        'prices = {"apple": 3, "pear": 5}',
        'total = 0',
        'for name, price in prices.items():',
        '    total += price',
        'print(total)',
      ],
      distractors: ['for name, price in prices:', '    total += name'],
      tests: [{ stdout: '8' }],
      explanation: 'Чтобы получить пары «ключ, значение», нужно перебирать `prices.items()`. Прямой обход словаря даёт только ключи, и распаковка `name, price` не сработает.',
    },
    {
      id: 'py.dicts.9',
      skill: 'py.dicts',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Почему кортеж можно использовать как ключ словаря, а список — нельзя? Что такое хэш и как он ускоряет поиск?',
      code: py`d = {}
d[(1, 2)] = "ok"
d[[1, 2]] = "boom"   # TypeError: unhashable type: 'list'`,
      keyPoints: [
        'Ключ превращается в число (хэш), по которому находится место хранения значения',
        'Хэш должен быть постоянным для объекта; у изменяемого списка содержимое, а значит хэш, может измениться',
        'Кортеж из неизменяемых элементов хэшируется, поэтому подходит в качестве ключа',
        'Поиск по хэшу занимает в среднем O(1), а не перебор всех элементов',
      ],
      modelAnswer: 'Словарь — хэш-таблица: из ключа вычисляется число (хэш), которое сразу указывает на место, где лежит значение, поэтому поиск в среднем не зависит от размера словаря. Чтобы это работало, хэш ключа не должен меняться. У списка содержимое можно изменить, и ключ «потерялся» бы в таблице, поэтому список нехэшируем (TypeError). Кортеж из неизменяемых значений не меняется, значит его хэш стабилен, и он годится в ключи.',
      explanation: 'Требование хэшируемости — цена за быстрый поиск и одновременно защита от «потерянных» ключей.',
    },
  ],
};
