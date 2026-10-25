import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const loops: SkillModule = {
  skill: {
    id: 'py.loops',
    route: 'python',
    title: 'Циклы',
    icon: '🔁',
    summary: 'while, for, range, break/continue, накопители, вложенные циклы и ошибки на единицу.',
    prereqs: ['py.conditions'],
    tier: 2,
    outcomes: [
      'Выбираю между for и while и пишу циклы, которые гарантированно завершаются',
      'Точно предсказываю значения range(start, stop, step), включая границы',
      'Применяю шаблон «накопитель»: инициализация до цикла, обновление внутри',
      'Использую break, continue и вложенные циклы, нахожу ошибки на единицу',
    ],
    estMinutes: 30,
    lesson: {
      why: 'Цикл — способ обработать тысячи элементов тем же кодом, что и один. Подсчёты, поиск, генерация, чтение ввода — всё это циклы.',
      brief: md`§for x in последовательность:§ — когда известно, что перебирать; §while условие:§ — пока условие истинно (изменяйте его внутри!). §range(a, b, step)§ не включает §b§. Накопитель создают **до** цикла. §break§ выходит из цикла, §continue§ переходит к следующей итерации.`,
      standard: md`**for** перебирает элементы любого итерируемого объекта — строки, списка, §range§, словаря, файла:

§§§python
for ch in "abc":
    print(ch)
for i in range(3):        # 0, 1, 2
    print(i)
§§§

**range** задаёт арифметическую прогрессию: §range(stop)§, §range(start, stop)§, §range(start, stop, step)§. Конец **не включается**: §range(1, 5)§ — это 1, 2, 3, 4 (4 значения, §stop − start§). Шаг может быть отрицательным: §range(10, 0, -3)§ → 10, 7, 4, 1.

**while** повторяет блок, пока условие истинно. Внутри цикла что-то обязано приближать условие к ложному, иначе цикл бесконечен:

§§§python
n = 10
steps = 0
while n > 1:
    n = n // 2     # прогресс: n уменьшается
    steps += 1
§§§

**Накопитель** — переменная, которая копит результат (сумма, счётчик, строка, список). Её нужно задать **до** цикла: если поставить §total = 0§ внутри, на каждой итерации она будет обнуляться.

**break и continue.** §break§ завершает цикл целиком (например, при нахождении ответа). §continue§ пропускает остаток тела и идёт к следующей итерации.

**Вложенные циклы:** внутренний цикл выполняется полностью на каждую итерацию внешнего. Для таблицы §n × m§ тело внутреннего выполнится §n·m§ раз.

**Ошибка на единицу (off-by-one)** — самая частая: §range(n)§ даёт 0…n−1; чтобы получить 1…n, пишите §range(1, n + 1)§.`,
      deep: md`**Как работает for.** Под капотом §for§ вызывает §iter()§ у объекта и повторно §next()§, пока не появится StopIteration (см. тему «Итераторы»). Поэтому §for§ работает с любым итерируемым объектом: файлом, словарём, генератором.

**range — компактная последовательность, а не список.** §range(10**9)§ создаётся мгновенно и занимает константную память: хранятся только §start§, §stop§, §step§. Для него работают §len()§, индексация §r[i]§ и проверка §x in r§ за O(1).

**Переменная цикла «живёт» после него.** После §for i in range(3):§ имя §i§ остаётся и равно 2. Если последовательность пуста, §i§ не получает значения: если имя раньше не определяли, обращение к нему даст NameError, иначе останется старое значение.

**else у циклов.** Блок §else§ после §for§/§while§ выполняется, если цикл завершился **без** §break§: удобный шаблон для поиска («не найдено»).

**Не меняйте список, по которому идёте.** §for x in items: items.remove(x)§ пропускает элементы, потому что индексы сдвигаются. Итерируйтесь по копии (§items[:]§) или собирайте результат в новый список.

**Сложность.** Один цикл по n элементам — O(n), два вложенных — O(n²). 10 000 × 10 000 = 10⁸ операций — уже ощутимо долго в Python. Часто вложенный поиск заменяют множеством или словарём (см. «Словари и множества»).

**Идиомы.** §for _ in range(k):§ — «повторить k раз, значение не нужно»; §while True:§ + §break§ — цикл с условием выхода в середине; встроенные §sum§, §max§, §min§, §any§, §all§ нередко заменяют ручной накопитель.`,
      analogy: 'Накопитель — как копилка: её нужно поставить на полку до начала сбора монет. Если на каждой итерации покупать новую пустую копилку (total = 0 внутри цикла), накопить ничего не получится.',
      example: {
        lang: 'python',
        code: py`total = 0
for i in range(1, 6):
    if i == 4:
        continue
    total += i
    print(i, total)

n = 10
steps = 0
while n > 1:
    n = n // 2
    steps += 1
print("шагов:", steps)

for row in range(1, 4):
    line = ""
    for col in range(1, 4):
        line += str(row * col) + " "
    print(line)`,
        steps: [
          '§total§ объявлен до цикла и накапливает сумму; §range(1, 6)§ даёт 1…5.',
          'При §i == 4§ срабатывает §continue§: остаток тела пропущен, поэтому 4 в сумму не попадает.',
          'В §while§ переменная §n§ уменьшается вдвое: 10 → 5 → 2 → 1, это 3 итерации — условие §n > 1§ перестаёт выполняться.',
          'Во вложенных циклах внутренний цикл целиком проходит три значения на каждую строку внешнего.',
        ].map((s) => s.replace(/§/g, '`')),
        output: '1 1\n2 3\n3 6\n5 11\nшагов: 3\n1 2 3\n2 4 6\n3 6 9',
      },
      counterexample: {
        lang: 'python',
        code: py`total = 0
for p in [10, 20, 30]:
    total = 0          # обнуление на каждом шаге!
    total += p
print(total)           # 30, а не 60`,
        explain: 'Присваивание total = 0 внутри цикла стирает накопленное. Инициализацию нужно вынести перед циклом.',
      },
      pitfalls: [
        md`Ожидать, что §range(5)§ включает 5: она даёт 0, 1, 2, 3, 4. Для 1…5 пишите §range(1, 6)§.`,
        md`Писать §while§ без изменения переменной условия — цикл будет бесконечным (остановить можно Ctrl+C).`,
        md`Инициализировать накопитель внутри цикла: сумма или счётчик будут сбрасываться.`,
        md`Удалять элементы из списка во время обхода по нему: часть элементов будет пропущена.`,
      ],
      sources: [
        { title: 'Python Tutorial — for Statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements' },
        { title: 'Python Tutorial — The range() Function', url: 'https://docs.python.org/3/tutorial/controlflow.html#the-range-function' },
        { title: 'break, continue and else on loops', url: 'https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements-and-else-clauses-on-loops' },
        { title: 'Ranges (built-in type)', url: 'https://docs.python.org/3/library/stdtypes.html#ranges' },
      ],
    },
    misconceptions: [
      {
        id: 'range-inclusive',
        title: 'range(n) включает n',
        explanation: 'range(a, b) идёт от a до b − 1. Число значений равно b − a. range(5) — это 0, 1, 2, 3, 4.',
        fix: 'Для 1…n пишите range(1, n + 1).',
      },
      {
        id: 'while-no-update',
        title: 'Цикл while сам «понимает», когда пора остановиться',
        explanation: 'while проверяет только условие. Если переменные условия не меняются в теле, цикл бесконечен.',
        fix: 'Перед запуском убедитесь: что именно в теле приближает условие к False?',
      },
      {
        id: 'accumulator-reset',
        title: 'Накопитель можно создавать внутри цикла',
        explanation: 'Присваивание total = 0 внутри цикла выполняется на каждой итерации и стирает накопленный результат; после пустого цикла переменная вовсе не создана.',
        fix: 'Инициализируйте накопитель до цикла.',
      },
      {
        id: 'break-vs-continue',
        title: 'continue и break делают одно и то же',
        explanation: 'break завершает весь цикл, а continue лишь пропускает остаток текущей итерации.',
        fix: 'break — «хватит», continue — «этот не подходит, дальше».',
      },
    ],
  },
  exercises: [
    {
      id: 'py.loops.1',
      skill: 'py.loops',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`for i in range(2, 10, 3):
    print(i, end=" ")`,
      answer: '2 5 8',
      explanation: '`range(2, 10, 3)` — это 2, 5, 8 (следующее значение 11 уже не меньше 10). `end=" "` заменяет перевод строки пробелом.',
    },
    {
      id: 'py.loops.2',
      skill: 'py.loops',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Сколько раз выполнится тело цикла?',
      code: py`for i in range(1, 5):
    print(i)`,
      options: [
        { text: '4 раза (1, 2, 3, 4)', correct: true, why: 'Конец range не включается: значений stop − start = 4.' },
        { text: '5 раз (1, 2, 3, 4, 5)', why: 'Правая граница range исключена, 5 не попадёт в перебор.', misconception: 'range-inclusive' },
        { text: '3 раза', why: 'Левая граница включена: перебор начинается с 1, а не с 2.' },
        { text: 'Бесконечно', why: 'range конечен, цикл for завершается после последнего значения.' },
      ],
      explanation: 'При шаге 1 и `a < b` `range(a, b)` содержит `b - a` значений: от a до b − 1.',
    },
    {
      id: 'py.loops.3',
      skill: 'py.loops',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите функцию `sum_to(n)`, которая возвращает сумму чисел от 1 до целого n включительно. Для `n <= 0` результат — 0.',
      starter: py`def sum_to(n):
    pass
`,
      solution: py`def sum_to(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total
`,
      tests: [
        { expr: 'sum_to(5)', expect: '15' },
        { expr: 'sum_to(1)', expect: '1' },
        { expr: 'sum_to(0)', expect: '0', hidden: true, label: 'ноль' },
        { expr: 'sum_to(-4)', expect: '0', hidden: true, label: 'отрицательное n' },
        { expr: 'sum_to(100)', expect: '5050', hidden: true, label: 'большое n' },
      ],
      hints: [
        'Какая переменная будет копить сумму и где её нужно создать?',
        'Для чисел 1…n нужен `range(1, n + 1)`.',
        'Накопитель `total = 0` — до цикла, `total += i` — внутри, `return total` — после цикла.',
      ],
      explanation: 'Для n ≤ 0 `range(1, n + 1)` пуст, цикл не выполняется и возвращается начальное значение накопителя — 0.',
    },
    {
      id: 'py.loops.4',
      skill: 'py.loops',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'logic',
      prompt: 'Функция должна вернуть сумму списка цен, но возвращает не то. Найдите и исправьте ошибку (учтите и пустой список).',
      buggy: py`def total(prices):
    for p in prices:
        result = 0
        result += p
    return result
`,
      solution: py`def total(prices):
    result = 0
    for p in prices:
        result += p
    return result
`,
      tests: [
        { expr: 'total([1, 2, 3])', expect: '6' },
        { expr: 'total([10])', expect: '10' },
        { expr: 'total([])', expect: '0', hidden: true, label: 'пустой список' },
        { expr: 'total([5, -5, 7])', expect: '7', hidden: true, label: 'отрицательные числа' },
      ],
      hints: [
        'Выполните код вручную для [1, 2, 3]: чему равен result после каждой итерации?',
        'Где выполняется `result = 0` и сколько раз?',
        'Перенесите инициализацию накопителя до цикла.',
      ],
      explanation: 'Инициализация внутри цикла обнуляет накопитель на каждой итерации, а для пустого списка `result` не получает значения, и обращение к нему даёт UnboundLocalError.',
    },
    {
      id: 'py.loops.5',
      skill: 'py.loops',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'edge',
      prompt: 'Функция должна вернуть список квадратов чисел от 1 до n включительно, но пропускает последний элемент. Исправьте.',
      buggy: py`def squares(n):
    result = []
    for i in range(1, n):
        result.append(i * i)
    return result
`,
      solution: py`def squares(n):
    result = []
    for i in range(1, n + 1):
        result.append(i * i)
    return result
`,
      tests: [
        { expr: 'squares(3)', expect: '[1, 4, 9]' },
        { expr: 'squares(1)', expect: '[1]' },
        { expr: 'squares(0)', expect: '[]', hidden: true, label: 'n = 0' },
        { expr: 'squares(5)', expect: '[1, 4, 9, 16, 25]', hidden: true, label: 'n = 5' },
      ],
      hints: [
        'Сколько элементов вернёт `squares(3)` сейчас? Сколько должно быть?',
        'Какое последнее значение даёт `range(1, n)`?',
        'Правая граница range не включается — увеличьте её на единицу.',
      ],
      explanation: 'Классическая ошибка на единицу: `range(1, n)` заканчивается на n − 1. Чтобы включить n, нужна граница `n + 1`.',
    },
    {
      id: 'py.loops.6',
      skill: 'py.loops',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа? Обратите внимание на `continue`, `break` и `else` у цикла.',
      code: py`for n in range(2, 8):
    if n % 2 == 0:
        continue
    if n == 7:
        break
    print(n)
else:
    print("конец")
print("готово")`,
      answer: '3\n5\nготово',
      explanation: 'Чётные числа пропускаются через continue, печатаются 3 и 5. На n = 7 срабатывает break, поэтому блок else (он выполняется только при нормальном завершении цикла) не запускается.',
    },
    {
      id: 'py.loops.7',
      skill: 'py.loops',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Программа читает число `n` и печатает таблицу умножения n × n: `n` строк, в каждой `n` произведений через пробел. Для `3` вывод: `1 2 3`, `2 4 6`, `3 6 9` (каждая строка отдельно).',
      starter: py`n = int(input())
# выведите таблицу
`,
      solution: py`n = int(input())
for i in range(1, n + 1):
    line = ""
    for j in range(1, n + 1):
        line += str(i * j) + " "
    print(line)
`,
      tests: [
        { stdin: ['3'], stdout: '1 2 3\n2 4 6\n3 6 9' },
        { stdin: ['1'], stdout: '1' },
        { stdin: ['0'], stdout: '', hidden: true, label: 'n = 0: ничего не печатать' },
        { stdin: ['4'], stdout: '1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16', hidden: true, label: 'n = 4' },
      ],
      hints: [
        'Нужно два уровня: строки и столбцы. Какие циклы это дают?',
        'Внешний цикл по `i` от 1 до n, внутренний по `j` от 1 до n; произведение — `i * j`.',
        'Собирайте строку во внутреннем цикле (`line += ...`), а `print(line)` вызывайте после внутреннего цикла.',
      ],
      explanation: 'Строка собирается внутри внутреннего цикла, а вывод выполняется один раз на итерацию внешнего. Этот проверщик не учитывает пробелы в конце строк, но в других системах лучше выводить без лишнего пробела.',
    },
    {
      id: 'py.loops.8',
      skill: 'py.loops',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите программу, считающую сумму цифр неотрицательного целого числа через `while`. Для `1234` ответ `10`.',
      lines: [
        'n = int(input())',
        'total = 0',
        'while n > 0:',
        '    total += n % 10',
        '    n //= 10',
        'print(total)',
      ],
      distractors: ['    n /= 10', 'while n >= 0:'],
      tests: [
        { stdin: ['1234'], stdout: '10' },
        { stdin: ['0'], stdout: '0' },
        { stdin: ['9005'], stdout: '14' },
      ],
      explanation: '`n % 10` — последняя цифра, `n //= 10` отбрасывает её (это и есть прогресс цикла). `/=` превращает `n` в float и не отбрасывает последнюю цифру (дробная часть остаётся), так что сумма получится неверной; `>= 0` — бесконечный цикл.',
    },
    {
      id: 'py.loops.9',
      skill: 'py.loops',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Как убедиться, что цикл `while` завершится? Разберите на примере кода ниже: что здесь «приближает» условие к ложному?',
      code: py`n = 100
count = 0
while n > 1:
    n = n // 2
    count += 1`,
      keyPoints: [
        'Условие цикла зависит от переменной, которая меняется в теле',
        'Каждая итерация строго уменьшает n и гарантирует выход за конечное число шагов',
        'Если в теле нет изменения переменных условия, а условие изначально истинно, цикл бесконечен',
      ],
      modelAnswer: 'Условие n > 1 зависит от n, а в теле n на каждой итерации заменяется на n // 2 — целое число уменьшается и рано или поздно станет не больше 1, поэтому цикл завершится (примерно за log₂(n) шагов). Если бы в теле не менялись переменные условия, оно оставалось бы истинным навсегда.',
      explanation: 'Перед запуском while полезно назвать величину, которая монотонно приближается к границе, — тогда завершение гарантировано.',
    },
  ],
};
