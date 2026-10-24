import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const functions: SkillModule = {
  skill: {
    id: 'py.functions',
    route: 'python',
    title: 'Функции',
    icon: '🧩',
    summary: 'def и return, параметры и аргументы, значения по умолчанию, *args/**kwargs, область видимости.',
    prereqs: ['py.dicts'],
    tier: 2,
    outcomes: [
      'Определяю функции с параметрами, значениями по умолчанию, *args и **kwargs',
      'Чётко различаю return и print и знаю, что функция без return возвращает None',
      'Избегаю ловушки изменяемого значения по умолчанию',
      'Объясняю области видимости (локальная, глобальная, вложенная) и порядок поиска имён LEGB',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Функции — основной способ разбить задачу на проверяемые части и не повторяться. Тесты, библиотеки, фреймворки — всё держится на функциях.',
      brief: md`§def name(params):§ создаёт функцию, §return§ отдаёт результат (без него — §None§). §print§ только выводит текст. Значения по умолчанию вычисляются **один раз** при определении — не используйте §[]§ как умолчание. §*args§ собирает позиционные аргументы в кортеж, §**kwargs§ — именованные в словарь. Переменные внутри функции локальны.`,
      standard: md`**Определение и вызов:**

§§§python
def area(width, height=1):
    return width * height

print(area(3, 4))            # 12
print(area(5))               # 5      (height=1 по умолчанию)
print(area(height=2, width=6)) # 12   (именованные аргументы)
§§§

**Параметр** — имя в определении (§width§), **аргумент** — значение при вызове (§3§). Именованные аргументы позволяют не помнить порядок.

**return против print.** §return§ завершает функцию и **отдаёт значение** вызывающему коду — его можно сохранить, сложить, передать дальше. §print§ лишь показывает текст на экране; функция, которая только печатает, возвращает §None§:

§§§python
def double_print(x):
    print(x * 2)

r = double_print(4)   # напечатает 8
print(r)              # None
§§§

**Значения по умолчанию** вычисляются **один раз**, при выполнении §def§. Поэтому изменяемое значение по умолчанию общее для всех вызовов:

§§§python
def add(x, items=[]):      # ловушка!
    items.append(x)
    return items
add(1); print(add(2))      # [1, 2]
§§§

Правильный шаблон:

§§§python
def add(x, items=None):
    if items is None:
        items = []
    items.append(x)
    return items
§§§

**§*args§ и §**kwargs§.** §def total(*nums)§ — внутри §nums§ — кортеж всех позиционных аргументов; §def tag(name, **attrs)§ — §attrs§ — словарь именованных. При вызове §f(*lst)§ и §f(**d)§ «разворачивают» список и словарь.

**Область видимости.** Переменные, созданные в функции, видны только в ней. Чтение глобальной переменной разрешено; присваивание создаёт **локальную**, если не объявить §global§ (лучше передавать значения параметрами и возвращать результат). Порядок поиска имён — **LEGB**: Local → Enclosing → Global → Built-in.`,
      deep: md`**Функции — объекты.** §def§ создаёт объект-функцию и привязывает имя; функцию можно положить в список, передать параметром, вернуть из другой функции (замыкание):

§§§python
def make_adder(n):
    def add(x):
        return x + n   # n берётся из объемлющей области
    return add
§§§

**Умолчания хранятся в объекте функции** (§f.__defaults__§), поэтому изменяемое умолчание «живёт» между вызовами. Шаблон с §None§ — стандартный выход. Для различения «не передано» и «передано None» используют отдельный объект-«сторож» (§_MISSING = object()§).

**Распределение аргументов.** Параметры после §*§ — только именованные: §def f(a, *, flag=False)§. Параметры до §/§ — только позиционные: §def f(a, b, /)§. Порядок: обычные, §*args§, именованные, §**kwargs§.

**UnboundLocalError.** Если имя где-либо в функции присваивается, оно локально **во всей функции**. Поэтому §count += 1§ без §global§ падает: Python считает §count§ локальным и находит его не заданным.

**Аргументы передаются по «ссылке на объект»** (call by object reference): функция получает ссылку, и изменяемый аргумент можно изменить внутри (см. «Списки»), а вот перепривязка имени параметра на вызывающего не влияет.

**Рекурсия.** Функция может вызывать сама себя; глубина ограничена (по умолчанию около 1000 вызовов, RecursionError). **Документация:** первая строка-строка в теле функции — docstring, доступна через §help(f)§ и §f.__doc__§.

**Аннотации типов** (§def f(x: int) -> str§) не проверяются при выполнении, но помогают редакторам и инструментам вроде mypy.`,
      analogy: 'Функция — рецепт: параметры — список ингредиентов, return — готовое блюдо, которое вы получаете и можете подать куда угодно. print — это «показать блюдо гостям»: блюдо увидели, но в руки оно не вернулось.',
      example: {
        lang: 'python',
        code: py`def area(width, height=1):
    return width * height

def tag(name, **attrs):
    parts = [name]
    for key, value in attrs.items():
        parts.append(f'{key}="{value}"')
    return "<" + " ".join(parts) + ">"

def total(*nums):
    return sum(nums)

print(area(3, 4), area(5), area(height=2, width=6))
print(tag("a", href="/home", id="x"))
print(total(1, 2, 3), total())
result = print("hi")
print(result)`,
        steps: [
          'У §area§ параметр §height§ имеет значение по умолчанию, поэтому §area(5)§ вычисляет 5 × 1; именованные аргументы можно передавать в любом порядке.',
          '§**attrs§ собирает именованные аргументы §href§ и §id§ в словарь, который проходится в порядке передачи.',
          '§*nums§ собирает любое число позиционных аргументов в кортеж; вызов без аргументов даёт пустой кортеж и сумму 0.',
          '§print§ ничего не возвращает, поэтому §result§ равно §None§.',
        ].map((s) => s.replace(/§/g, '`')),
        output: '12 5 12\n<a href="/home" id="x">\n6 0\nhi\nNone',
      },
      counterexample: {
        lang: 'python',
        code: py`def add(x, items=[]):
    items.append(x)
    return items

print(add(1))   # [1]
print(add(2))   # [1, 2] — а не [2]!`,
        explain: 'Список-умолчание создаётся один раз при определении функции и разделяется между вызовами. Используйте items=None и создавайте список внутри.',
      },
      pitfalls: [
        md`Печатать вместо возврата: функция с §print§ внутри вернёт §None§, и результат нельзя использовать дальше.`,
        md`Использовать §[]§ или §{}§ как значение по умолчанию: оно общее для всех вызовов.`,
        md`Присваивать глобальной переменной внутри функции без §global§: Python создаст новую локальную переменную (или вызовет UnboundLocalError при §+=§).`,
        md`Ставить §return§ внутри цикла и ожидать, что цикл дойдёт до конца: функция завершится на первой же итерации.`,
      ],
      sources: [
        { title: 'Python Tutorial — Defining Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' },
        { title: 'Python Tutorial — More on Defining Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions' },
        { title: 'Python Tutorial — Scopes and Namespaces', url: 'https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces' },
        { title: 'FAQ — Why are default values shared between objects?', url: 'https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects' },
      ],
    },
    misconceptions: [
      {
        id: 'print-is-return',
        title: 'print внутри функции — то же, что return',
        explanation: 'print выводит текст на экран, но функция при этом возвращает None. Результат нельзя сохранить или использовать в выражениях.',
        fix: 'Возвращайте значение через return, а печатайте снаружи.',
      },
      {
        id: 'mutable-default-fresh',
        title: 'Значение по умолчанию создаётся заново при каждом вызове',
        explanation: 'Выражение-умолчание вычисляется один раз при определении функции. Изменяемый объект (список, словарь) разделяется между вызовами.',
        fix: 'Используйте None и создавайте объект внутри функции.',
      },
      {
        id: 'local-modifies-global',
        title: 'Присваивание внутри функции меняет глобальную переменную',
        explanation: 'Присваивание создаёт локальное имя. Чтобы изменить глобальное, нужно объявить global, а лучше — вернуть значение.',
        fix: 'Передавайте данные параметрами и возвращайте результат.',
      },
      {
        id: 'return-in-loop',
        title: 'return внутри цикла не прерывает функцию',
        explanation: 'return завершает функцию сразу, поэтому в цикле он вернёт результат первой итерации.',
        fix: 'Возвращайте результат после цикла, если нужны все итерации.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.functions.1',
      skill: 'py.functions',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`def f(x):
    print(x * 2)

r = f(4)
print(r)`,
      answer: '8\nNone',
      explanation: 'Внутри функции `print` выводит 8, но `return` нет, поэтому функция возвращает `None`, и именно оно оказывается в `r`.',
    },
    {
      id: 'py.functions.2',
      skill: 'py.functions',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет код?',
      code: py`def add(x, items=[]):
    items.append(x)
    return items

add(1)
print(add(2))`,
      options: [
        { text: '[1, 2]', correct: true, why: 'Список по умолчанию создан один раз при определении функции и общий для вызовов.' },
        { text: '[2]', why: 'Так было бы, если бы умолчание создавалось заново при каждом вызове — но это не так.', misconception: 'mutable-default-fresh' },
        { text: '[1]', why: 'Второй вызов добавляет 2 в тот же список, поэтому там два элемента.' },
        { text: 'TypeError', why: 'Код синтаксически и типово корректен, ловушка в общем списке.' },
      ],
      explanation: 'Правильный шаблон: `items=None`, а внутри `if items is None: items = []`.',
    },
    {
      id: 'py.functions.3',
      skill: 'py.functions',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите функцию `total(*nums)`, которая возвращает сумму всех переданных аргументов (для вызова без аргументов — 0).',
      starter: py`def total(*nums):
    pass
`,
      solution: py`def total(*nums):
    result = 0
    for n in nums:
        result += n
    return result
`,
      tests: [
        { expr: 'total(1, 2, 3)', expect: '6' },
        { expr: 'total(10)', expect: '10' },
        { expr: 'total()', expect: '0', hidden: true, label: 'без аргументов' },
        { expr: 'total(-1, 1)', expect: '0', hidden: true, label: 'отрицательные числа' },
        { expr: 'total(2.5, 2.5)', expect: '5.0', hidden: true, label: 'дробные числа' },
      ],
      hints: [
        'Во что превращаются аргументы, собранные через `*nums`?',
        'Это кортеж — по нему можно пройтись циклом `for`.',
        'Заведите накопитель `result = 0` до цикла и верните его после цикла.',
      ],
      explanation: '`*nums` собирает позиционные аргументы в кортеж; для пустого вызова цикл не выполняется, и возвращается начальный 0.',
    },
    {
      id: 'py.functions.4',
      skill: 'py.functions',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите функцию `stats(numbers)`, которая возвращает кортеж `(минимум, максимум, среднее)`. Для пустого списка верните `(None, None, None)`.',
      starter: py`def stats(numbers):
    pass
`,
      solution: py`def stats(numbers):
    if not numbers:
        return (None, None, None)
    return (min(numbers), max(numbers), sum(numbers) / len(numbers))
`,
      tests: [
        { expr: 'stats([1, 2, 3])', expect: '(1, 3, 2.0)' },
        { expr: 'stats([5])', expect: '(5, 5, 5.0)' },
        { expr: 'stats([])', expect: '(None, None, None)', hidden: true, label: 'пустой список' },
        { expr: 'stats([-4, 4, 0, 2])', expect: '(-4, 4, 0.5)', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Какие встроенные функции возвращают минимум, максимум и сумму?',
        'Что произойдёт при делении на `len(numbers)`, если список пуст?',
        'Сначала обработайте пустой список ранним `return`, затем вычислите три значения.',
      ],
      explanation: 'Несколько значений возвращают кортежем. Ранний `return` для пустого списка защищает от ZeroDivisionError (и ValueError у `min` на пустой последовательности).',
    },
    {
      id: 'py.functions.5',
      skill: 'py.functions',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Напишите функцию `tag(name, **attrs)`, которая строит HTML-тег: `tag("a", href="/x")` → `<a href="/x">`, `tag("br")` → `<br>`. Атрибуты идут в порядке передачи, значения в двойных кавычках.',
      starter: py`def tag(name, **attrs):
    pass
`,
      solution: py`def tag(name, **attrs):
    parts = [name]
    for key, value in attrs.items():
        parts.append(f'{key}="{value}"')
    return "<" + " ".join(parts) + ">"
`,
      tests: [
        { expr: 'tag("br")', expect: '"<br>"' },
        { expr: 'tag("a", href="/x")', expect: '"<a href=\\"/x\\">"' },
        { expr: 'tag("img", src="a.png", alt="лого")', expect: '"<img src=\\"a.png\\" alt=\\"лого\\">"', hidden: true, label: 'несколько атрибутов, кириллица' },
        { expr: 'tag("p", id=5)', expect: '"<p id=\\"5\\">"', hidden: true, label: 'числовое значение атрибута' },
      ],
      hints: [
        'Во что `**attrs` превращает именованные аргументы?',
        'Пройдите по `attrs.items()` и для каждой пары соберите текст `ключ="значение"`.',
        'Склейте имя тега и все атрибуты через пробел: `" ".join(...)`, и оберните в `<` и `>`.',
      ],
      explanation: '`**attrs` — словарь именованных аргументов, а порядок их передачи сохраняется. Список частей + `" ".join` избавляет от лишнего пробела, когда атрибутов нет.',
    },
    {
      id: 'py.functions.6',
      skill: 'py.functions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'logic',
      prompt: 'Каждый вызов `append_to(x)` без второго аргумента должен возвращать **новый** список `[x]`, но результаты накапливаются между вызовами. Исправьте функцию.',
      buggy: py`def append_to(item, target=[]):
    target.append(item)
    return target
`,
      solution: py`def append_to(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
`,
      tests: [
        { expr: 'append_to(5)', expect: '[5]' },
        { expr: 'append_to(1, [9])', expect: '[9, 1]' },
        { expr: '[append_to(1), append_to(2)]', expect: '[[1], [2]]', hidden: true, label: 'повторные вызовы независимы' },
      ],
      hints: [
        'Вызовите функцию дважды и посмотрите на второй результат. Откуда в нём первый элемент?',
        'Когда создаётся список-умолчание: при каждом вызове или один раз?',
        'Используйте `target=None` и создавайте `[]` внутри функции, если `target is None`.',
      ],
      explanation: 'Значение по умолчанию вычисляется один раз при определении функции. Поэтому изменяемое умолчание общее; шаблон с `None` создаёт свежий список на каждый вызов.',
    },
    {
      id: 'py.functions.7',
      skill: 'py.functions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'runtime',
      prompt: 'Функция `inc()` должна увеличивать глобальный счётчик на 1 и возвращать новое значение, но падает с `UnboundLocalError`. Исправьте.',
      buggy: py`count = 0

def inc():
    count += 1
    return count
`,
      solution: py`count = 0

def inc():
    global count
    count += 1
    return count
`,
      tests: [
        { expr: 'inc()', expect: '1' },
        { expr: '[inc(), inc(), inc()]', expect: '[1, 2, 3]', hidden: true, label: 'счётчик накапливается между вызовами' },
        { expr: '(inc(), count)', expect: '(1, 1)', hidden: true, label: 'глобальная переменная обновилась' },
      ],
      hints: [
        'Прочитайте ошибку: какое имя Python считает локальным?',
        'Присваивание (в том числе `+=`) внутри функции делает имя локальным во всей функции.',
        'Объявите `global count` в начале функции. (Лучший дизайн — передавать значение параметром и возвращать результат.)',
      ],
      explanation: 'Из-за `count += 1` Python считает `count` локальной переменной, читает её до присваивания и падает. `global count` разрешает менять глобальную; в реальном коде чаще лучше вернуть новое значение.',
    },
    {
      id: 'py.functions.8',
      skill: 'py.functions',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа? Подумайте, какое `x` видит `inner`.',
      code: py`x = "global"

def outer():
    x = "outer"
    def inner():
        return x
    return inner()

print(outer(), x)`,
      answer: 'outer global',
      explanation: 'Имена ищутся по правилу LEGB: `inner` не находит `x` у себя, затем смотрит в объемлющую функцию `outer` — там `x = "outer"`. Глобальное `x` осталось нетронутым.',
    },
    {
      id: 'py.functions.9',
      skill: 'py.functions',
      kind: 'explain',
      difficulty: 2,
      lang: 'python',
      prompt: 'Объясните разницу между `return` и `print`. Почему функция, которая только печатает, неудобна для повторного использования?',
      code: py`def double_print(x):
    print(x * 2)

total = double_print(2) + double_print(3)   # TypeError`,
      keyPoints: [
        'return передаёт значение вызывающему коду, print лишь выводит текст на экран',
        'Функция без return возвращает None',
        'Вернувшееся значение можно сохранить, использовать в выражениях и тестировать',
      ],
      modelAnswer: 'return отдаёт значение туда, откуда функцию вызвали, и его можно сохранить в переменную, сложить с другим или передать дальше. print просто выводит текст, а сама функция при этом возвращает None. В примере `double_print(2) + double_print(3)` складывается None с None, поэтому возникает TypeError. Функции с return проще комбинировать и проверять тестами.',
      explanation: 'Правило: вычисление — в return, вывод — снаружи, на границе программы.',
    },
  ],
};
