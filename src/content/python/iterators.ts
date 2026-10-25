import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const iterators: SkillModule = {
  skill: {
    id: 'py.iterators',
    route: 'python',
    title: 'Итераторы и генераторы',
    icon: '🌊',
    summary: 'Протокол итерации, yield, ленивые вычисления и основы itertools.',
    prereqs: ['py.comprehensions', 'py.functions'],
    tier: 4,
    outcomes: [
      'Объясняю протокол итерации: iter(), next(), StopIteration',
      'Пишу генераторы через yield и понимаю, что код функции выполняется порциями',
      'Использую ленивые вычисления для больших и бесконечных последовательностей',
      'Применяю itertools (islice, count, chain) и знаю, что итератор одноразовый',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Итераторы и генераторы позволяют обрабатывать данные, которые не помещаются в память (большие файлы, потоки, бесконечные последовательности), и лежат в основе цикла for, включений и многих библиотек.',
      brief: md`Итерируемый объект отдаёт итератор через §iter()§; §next(it)§ даёт следующий элемент, а в конце возникает §StopIteration§. Функция с §yield§ — **генератор**: вызов не выполняет тело, а возвращает итератор; код идёт порциями до очередного §yield§. Итераторы **одноразовые**.`,
      standard: md`**Протокол итерации.** Цикл §for§ делает за кулисами два шага: получает итератор через §iter(obj)§ и повторно вызывает §next()§, пока не встретит §StopIteration§:

§§§python
it = iter([10, 20])
print(next(it))   # 10
print(next(it))   # 20
next(it)          # StopIteration
§§§

Итерируемый объект (§list§, §str§, §dict§, §range§, файл) умеет создать итератор. Итератор помнит позицию и **одноразовый**: пройти его второй раз нельзя.

**Генератор** — функция с §yield§:

§§§python
def countdown(n):
    while n > 0:
        yield n        # отдать значение и «заморозить» функцию
        n -= 1

g = countdown(3)       # тело ещё НЕ выполнялось
print(next(g))         # 3 — выполнение дошло до первого yield
print(list(g))         # [2, 1] — продолжило с места остановки
§§§

Вызов функции-генератора лишь **создаёт** объект-генератор. Тело выполняется порциями при запросах §next()§; между запросами локальные переменные сохраняются. §return§ или конец функции завершают итерацию (StopIteration).

**Ленивость.** Значения вычисляются по требованию. Поэтому генератор может быть **бесконечным**:

§§§python
def naturals():
    n = 0
    while True:
        yield n
        n += 1
§§§

Брать из него нужное количество можно через §itertools.islice§.

**itertools** — «набор кирпичиков»: §count(start, step)§ (бесконечный счётчик), §islice(it, n)§ (срез итератора), §chain(a, b)§ (склейка), §cycle§, §repeat§, §zip_longest§, §groupby§ и др.

**Свой итератор** можно написать классом с §__iter__§ (возвращает §self§) и §__next__§ (отдаёт значение или бросает §StopIteration§). Но генератор обычно короче и понятнее.`,
      deep: md`**Состояние генератора.** Генератор — объект с замороженным фреймом: указатель инструкции и локальные переменные сохраняются между вызовами §next§. У него есть состояния: создан, приостановлен, выполняется, завершён. Вызов §next§ на завершённом генераторе снова даёт StopIteration.

**Методы генератора.** §send(value)§ передаёт значение внутрь (результат выражения §x = yield§), §throw(exc)§ бросает исключение внутри, §close()§ завершает (внутри возникает GeneratorExit). На этом построены сопрограммы; современный асинхронный код использует §async§/§await§.

**yield from.** §yield from iterable§ делегирует итерацию вложенному итератору: §yield from range(3)§ эквивалентно циклу с §yield§, но корректно передаёт §send§/§throw§ и возвращаемое значение.

**Итерируемый ≠ итератор.** У итерируемого есть §__iter__§, возвращающий итератор. Список можно обходить много раз, потому что §iter(lst)§ каждый раз создаёт **новый** итератор, но это свойство конкретных типов, а не требование протокола. У итератора §__iter__§ возвращает §self§, а §__next__§ отдаёт следующий элемент или бросает StopIteration. Поэтому §g = iter(lst); list(g); list(g)§ — второй раз пусто.

**Память.** Генератор хранит O(1) состояния. Конвейер §sum(x * x for x in data if x % 2)§ обходит данные за один проход без промежуточных списков. Файловые объекты — тоже итераторы по строкам: §for line in f§ читает файл построчно.

**Ловушки.** Не вызывайте §list(gen)§ на бесконечном генераторе — программа зависнет. Исключение StopIteration внутри генератора превращается в RuntimeError (PEP 479), поэтому завершайте генератор через §return§, а не через явный §raise StopIteration§.

**itertools и производительность.** Функции itertools написаны на C и ленивы; §islice§ не копирует данные. §tee§ создаёт независимые копии итератора, но буферизует расхождение между ними — осторожно с большим разрывом.`,
      analogy: 'Итератор — это пакет с одноразовыми билетами из рулона: билет можно оторвать только один раз и только следующий по порядку. Генератор — кассир, который печатает билет, только когда кто-то подошёл, а между покупателями замирает на месте.',
      example: {
        lang: 'python',
        code: py`def count_up(n):
    print("старт")
    for i in range(n):
        yield i

g = count_up(2)
print("создан")
print(next(g))
print(next(g))
try:
    next(g)
except StopIteration:
    print("конец")

it = iter([1, 2, 3])
print(list(it), list(it))

def naturals():
    n = 0
    while True:
        yield n
        n += 1

from itertools import islice
print(list(islice(naturals(), 5)))`,
        steps: [
          'Вызов §count_up(2)§ не печатает «старт»: тело генератора ещё не запускалось; сначала печатается «создан».',
          'Первый §next§ запускает тело — выводится «старт» и отдаётся 0; второй возобновляет цикл и отдаёт 1.',
          'Третий §next§ завершает функцию, и возникает §StopIteration§ — именно его перехватывает цикл §for§.',
          'Итератор §it§ одноразовый: первый §list(it)§ исчерпывает его, второй получает пустой список.',
          'Бесконечный генератор безопасен, пока значения берут по порядку: §islice§ останавливает его после 5 значений.',
        ].map((s) => s.replace(/§/g, '`')),
        output: 'создан\nстарт\n0\n1\nконец\n[1, 2, 3] []\n[0, 1, 2, 3, 4]',
      },
      counterexample: {
        lang: 'python',
        code: py`def squares(n):
    for i in range(n):
        return i * i      # return вместо yield

print(squares(3))         # 0 — а не итератор!`,
        explain: 'return завершает функцию на первой итерации и возвращает одно значение. Чтобы получить последовательность, используйте yield.',
      },
      pitfalls: [
        md`Считать, что вызов функции-генератора выполняет её тело: код стартует только при §next()§ или в цикле §for§.`,
        md`Проходить один и тот же итератор или генератор дважды: во второй раз он пуст.`,
        md`Вызывать §list()§ на бесконечном генераторе: программа зависнет и займёт всю память.`,
        md`Использовать §return значение§ вместо §yield§: функция вернёт одно значение, а не последовательность.`,
      ],
      sources: [
        { title: 'Python Tutorial — Iterators', url: 'https://docs.python.org/3/tutorial/classes.html#iterators' },
        { title: 'Python Tutorial — Generators', url: 'https://docs.python.org/3/tutorial/classes.html#generators' },
        { title: 'Glossary — iterator / generator', url: 'https://docs.python.org/3/glossary.html#term-generator' },
        { title: 'itertools — Functions creating iterators', url: 'https://docs.python.org/3/library/itertools.html' },
        { title: 'Iterator Types', url: 'https://docs.python.org/3/library/stdtypes.html#iterator-types' },
      ],
    },
    misconceptions: [
      {
        id: 'gen-runs-on-call',
        title: 'Вызов функции-генератора сразу выполняет её тело',
        explanation: 'Вызов лишь создаёт объект-генератор. Тело запускается при первом next() и приостанавливается на каждом yield.',
        fix: 'Мысленно: вызов — «подготовить», next() — «выдать следующее».',
      },
      {
        id: 'iterator-reusable',
        title: 'Итератор можно пройти несколько раз',
        explanation: 'Итераторы и генераторы одноразовые: после исчерпания они пусты. Многократно обходить можно итерируемый объект (список), который создаёт новый итератор.',
        fix: 'Нужен повторный проход — сохраните данные в список или создайте генератор заново.',
      },
      {
        id: 'yield-is-return',
        title: 'yield — то же самое, что return',
        explanation: 'return завершает функцию. yield отдаёт значение, сохраняет состояние и позволяет продолжить с того же места.',
        fix: 'Если нужна последовательность значений — используйте yield.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.iterators.1',
      skill: 'py.iterators',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`def count_up(n):
    print("start")
    for i in range(n):
        yield i

g = count_up(2)
print("created")
print(next(g))`,
      answer: 'created\nstart\n0',
      explanation: 'Вызов `count_up(2)` ничего не печатает — он лишь создаёт генератор. Тело стартует при первом `next(g)`: печатается «start» и отдаётся 0.',
    },
    {
      id: 'py.iterators.2',
      skill: 'py.iterators',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет код?',
      code: py`it = iter([1, 2, 3])
list(it)
print(list(it))`,
      options: [
        { text: '[]', correct: true, why: 'Первый list(it) исчерпал итератор, и второй получает пустую последовательность.' },
        { text: '[1, 2, 3]', why: 'Так было бы для самого списка, но итератор одноразовый.', misconception: 'iterator-reusable' },
        { text: 'StopIteration', why: 'list() сам обрабатывает StopIteration и просто возвращает пустой список.' },
        { text: 'None', why: 'list() всегда возвращает список, а не None.' },
      ],
      explanation: 'Итератор «помнит» позицию и не перематывается. Для повторного прохода создайте новый итератор: `iter(lst)`.',
    },
    {
      id: 'py.iterators.3',
      skill: 'py.iterators',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите генератор `countdown(n)`, который отдаёт числа `n, n-1, ..., 1`. Для `n <= 0` ничего не отдаёт.',
      starter: py`def countdown(n):
    pass
`,
      solution: py`def countdown(n):
    while n > 0:
        yield n
        n -= 1
`,
      tests: [
        { expr: 'list(countdown(3))', expect: '[3, 2, 1]' },
        { expr: 'list(countdown(1))', expect: '[1]' },
        { expr: 'list(countdown(0))', expect: '[]', hidden: true, label: 'ноль' },
        { expr: 'list(countdown(-2))', expect: '[]', hidden: true, label: 'отрицательное n' },
        { expr: 'next(countdown(5))', expect: '5', hidden: true, label: 'первое значение через next' },
      ],
      hints: [
        'Чем функция-генератор отличается от обычной по ключевому слову?',
        'Используйте цикл, который уменьшает `n`, и отдавайте значение через `yield`.',
        '`while n > 0: yield n; n -= 1` — и для 0 цикл не выполнится ни разу.',
      ],
      explanation: '`yield` отдаёт текущее значение и замораживает функцию. При n ≤ 0 цикл не выполняется, поэтому генератор пуст.',
    },
    {
      id: 'py.iterators.4',
      skill: 'py.iterators',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите **бесконечный** генератор `evens()`, отдающий 0, 2, 4, 6, … . Тесты берут нужное количество значений через `islice` (импорт уже есть).',
      starter: py`from itertools import islice

def evens():
    pass
`,
      solution: py`from itertools import islice

def evens():
    n = 0
    while True:
        yield n
        n += 2
`,
      tests: [
        { expr: 'list(islice(evens(), 4))', expect: '[0, 2, 4, 6]' },
        { expr: 'list(islice(evens(), 1))', expect: '[0]' },
        { expr: 'list(islice(evens(), 0))', expect: '[]', hidden: true, label: 'ноль значений' },
        { expr: 'list(islice(evens(), 50))[-1]', expect: '98', hidden: true, label: '50-е значение' },
      ],
      hints: [
        'Бесконечный цикл допустим, если в нём есть `yield`: почему генератор не зависнет?',
        'Заведите счётчик `n = 0`, отдавайте его и увеличивайте на 2.',
        '`while True: yield n; n += 2`.',
      ],
      explanation: 'Генератор приостанавливается на каждом `yield`, поэтому `while True` внутри него безопасен: значения вычисляются по запросу, а `islice` забирает нужное количество.',
    },
    {
      id: 'py.iterators.5',
      skill: 'py.iterators',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Допишите метод `__next__` итератора `Fib`: он отдаёт числа Фибоначчи (0, 1, 1, 2, 3, 5, …), пока значение **меньше** `limit`, затем бросает `StopIteration`.',
      starter: py`class Fib:
    def __init__(self, limit):
        self.limit = limit
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        raise NotImplementedError
`,
      solution: py`class Fib:
    def __init__(self, limit):
        self.limit = limit
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.a >= self.limit:
            raise StopIteration
        value = self.a
        self.a, self.b = self.b, self.a + self.b
        return value
`,
      tests: [
        { expr: 'list(Fib(20))', expect: '[0, 1, 1, 2, 3, 5, 8, 13]' },
        { expr: 'list(Fib(2))', expect: '[0, 1, 1]' },
        { expr: 'list(Fib(1))', expect: '[0]', hidden: true, label: 'предел 1' },
        { expr: 'list(Fib(0))', expect: '[]', hidden: true, label: 'предел 0 — пусто' },
      ],
      hints: [
        'Когда итератор должен сообщить, что элементы закончились?',
        'Сначала проверьте `self.a >= self.limit` и бросьте `StopIteration`.',
        'Иначе запомните `value = self.a`, сдвиньте пару `self.a, self.b = self.b, self.a + self.b` и верните `value`.',
      ],
      explanation: 'Протокол итератора: `__next__` либо возвращает следующее значение, либо бросает `StopIteration`. Состояние (`a`, `b`) хранится в атрибутах. Тот же итератор проще записать генератором.',
    },
    {
      id: 'py.iterators.6',
      skill: 'py.iterators',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'runtime',
      prompt: 'Функция должна вернуть среднее удвоенных значений непустого списка, но падает с `ZeroDivisionError`. Исправьте (подсказка: что происходит с генератором после первого прохода?).',
      buggy: py`def avg_double(nums):
    gen = (n * 2 for n in nums)
    return sum(gen) / len(list(gen))
`,
      solution: py`def avg_double(nums):
    doubled = [n * 2 for n in nums]
    return sum(doubled) / len(doubled)
`,
      tests: [
        { expr: 'avg_double([1, 2, 3])', expect: '4.0' },
        { expr: 'avg_double([5])', expect: '10.0' },
        { expr: 'avg_double([-1, 1])', expect: '0.0', hidden: true, label: 'сумма равна нулю' },
      ],
      hints: [
        'Откуда берётся деление на ноль, если список непустой?',
        '`sum(gen)` уже прошёл по генератору до конца. Сколько элементов осталось для `list(gen)`?',
        'Нужны данные для двух проходов — постройте список один раз.',
      ],
      explanation: 'Генераторное выражение одноразовое: `sum(gen)` исчерпал его, и `list(gen)` оказался пустым, поэтому `len(...) == 0`. Список можно обходить многократно.',
    },
    {
      id: 'py.iterators.7',
      skill: 'py.iterators',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`from itertools import chain, islice, count

print(list(chain([1, 2], "ab")))
print(list(islice(count(10, 5), 3)))
g = (n for n in range(3))
print(next(g), list(g), list(g))`,
      answer: "[1, 2, 'a', 'b']\n[10, 15, 20]\n0 [1, 2] []",
      explanation: '`chain` лениво склеивает последовательности; `count(10, 5)` — бесконечный счётчик 10, 15, 20, …, `islice` берёт первые три. Для генератора `g`: `next` забрал 0, первый `list` — остаток [1, 2], второй — пустой список.',
    },
    {
      id: 'py.iterators.8',
      skill: 'py.iterators',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите программу: генератор квадратов `squares(n)` и вывод списка квадратов для `n = 4`.',
      lines: [
        'def squares(n):',
        '    for i in range(n):',
        '        yield i * i',
        'print(list(squares(4)))',
      ],
      distractors: ['        return i * i', 'print(squares(4))'],
      tests: [{ stdout: '[0, 1, 4, 9]' }],
      explanation: '`yield` отдаёт значения по одному и сохраняет состояние. `return` внутри цикла завершил бы функцию на первой итерации, а `print(squares(4))` напечатал бы объект генератора, а не его значения.',
    },
    {
      id: 'py.iterators.9',
      skill: 'py.iterators',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Почему обработку большого файла лучше писать генератором построчно, а не читать все строки в список? Что меняется для памяти и для скорости старта?',
      code: py`def long_lines(path):
    with open(path) as f:
        for line in f:
            if len(line) > 80:
                yield line`,
      keyPoints: [
        'Генератор хранит только текущую строку и состояние, а не весь файл — память почти не растёт',
        'Строки отдаются по мере обнаружения: первый результат доступен после чтения первой подходящей строки, а не всего файла (ленивость)',
        'Цена: итератор одноразовый, нет len() и индексов',
      ],
      modelAnswer: 'Список со всеми строками файла хранится в памяти целиком, и программа не начнёт обработку, пока не прочитает файл полностью. Генератор читает и отдаёт строки по одной: в памяти только текущая строка и состояние функции, а первый результат доступен сразу. Платить приходится одноразовостью: пройти генератор второй раз нельзя, и у него нет len() и индексов, поэтому при повторном использовании данные нужно сохранить в список.',
      explanation: 'Ленивые конвейеры позволяют обрабатывать данные любого размера с постоянным расходом памяти.',
    },
  ],
};
