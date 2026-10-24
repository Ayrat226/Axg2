import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const conditions: SkillModule = {
  skill: {
    id: 'py.conditions',
    route: 'python',
    title: 'Условия и логика',
    icon: '🔀',
    summary: 'if/elif/else, сравнения, and/or/not, истинность значений, цепочки сравнений.',
    prereqs: ['py.types'],
    tier: 1,
    outcomes: [
      'Пишу ветвления if/elif/else и понимаю, что выполняется только первая подходящая ветка',
      'Комбинирую условия через and, or, not и знаю про ленивое вычисление',
      'Определяю истинность значений (пустое — ложно, непустое — истинно) и пишу if x: вместо if x == True',
      'Использую цепочки сравнений вида 0 <= x < 10',
    ],
    estMinutes: 25,
    lesson: {
      why: 'Программы принимают решения: проверка ввода, граничные случаи, ветки алгоритма. Большинство багов — в неверно составленных условиях.',
      brief: md`§if/elif/else§ выполняет **первую** подходящую ветку. Сравнения: §== != < <= > >=§. Логика: §and§, §or§, §not§. Ложны: §0§, §""§, §[]§, §{}§, §None§, §False§. Можно писать §0 <= x < 10§.`,
      standard: md`**Ветвление.** Условие вычисляется до §True§/§False§; блок определяется отступом (4 пробела):

§§§python
temperature = 23
if temperature > 30:
    print("жара")
elif temperature > 15:
    print("тепло")
else:
    print("прохладно")
§§§

Ветки §elif§ проверяются по порядку, срабатывает **только первая** истинная. Отдельные подряд идущие §if§ — независимы, и могут сработать несколько.

**Сравнения и логика.**

- §==§ равенство, §!=§ неравенство, §<§, §<=§, §>§, §>=§;
- §and§ — оба истинны, §or§ — хотя бы одно, §not§ — отрицание;
- приоритет: §not§ сильнее §and§, а §and§ сильнее §or§; скобки делают намерение явным.

**Цепочки сравнений.** §0 <= x < 10§ означает «0 ≤ x и x < 10» — так записывают проверку диапазона.

**Истинность.** В условии любое значение приводится к bool. Ложными считаются §0§, §0.0§, §""§, §[]§, §{}§, §()§, §set()§, §None§, §False§. Всё остальное — истина, в том числе строка §"0"§ и §"False"§.

§§§python
items = []
if not items:
    print("пусто")   # вместо if len(items) == 0 или if items == []
§§§

**Типичная ловушка.** §if x == 1 or 2§ читается как §(x == 1) or 2§, а §2§ всегда истинно. Правильно: §x == 1 or x == 2§ или §x in (1, 2)§.`,
      deep: md`**Ленивое вычисление.** §and§ и §or§ вычисляют правый операнд только при необходимости и **возвращают сам операнд**, а не обязательно bool: §0 or "x"§ → §"x"§, §"" and 5§ → §""§. Поэтому §if items and items[0] > 5:§ безопасно для пустого списка, а §name or "аноним"§ — идиома «значение по умолчанию».

**Цепочки сравнений** вычисляют каждый операнд один раз: в §a < f() < b§ функция §f§ вызывается один раз. Цепочка работает и для ==: §a == b == c§. Но §a < b > c§ — допустимая, хоть и необычная, запись.

**Тернарное выражение:** §label = "чёт" if n % 2 == 0 else "нечет"§. Подходит для простых выборов; вложенные тернарные операторы читаются плохо.

**§is§ и §==§.** §==§ сравнивает значения, §is§ — идентичность объектов. Для §None§ используйте §is None§. Сравнение §x is 5§ ненадёжно (и вызывает SyntaxWarning), потому что кэширование малых чисел — деталь реализации.

**Кастомная истинность.** Объект считается ложным, если его §__bool__§ возвращает False или (при отсутствии §__bool__§) §__len__§ возвращает 0.

**Особые значения.** §float("nan")§ не равно ничему, даже самому себе: §nan == nan§ → False. Разнотипные сравнения порядка (§"3" < 5§) — TypeError, а §1 == 1.0§ → True. Строки сравниваются лексикографически: §"10" < "9"§.

**Оператор match (3.10+)** — структурное сопоставление: удобен для разбора форм данных, но для простых диапазонов по-прежнему лучше if/elif.`,
      analogy: 'Цепочка if/elif/else — как проход через турникеты по порядку: вы выходите через первый, который вас пропустил, и остальные уже не проверяются.',
      example: {
        lang: 'python',
        code: py`temperature = 23
raining = False
if temperature > 25 and not raining:
    print("пляж")
elif temperature > 15 and not raining:
    print("прогулка")
else:
    print("дома")
print(10 < temperature <= 30)
print("" or "запасное")
print(bool([]), bool([0]))`,
        steps: [
          'Условие 23 > 25 ложно, поэтому первая ветка пропускается.',
          'Во втором условии §temperature > 15§ и §not raining§ оба истинны — печатается «прогулка», а §else§ не проверяется.',
          '§10 < temperature <= 30§ — цепочка сравнений: оба неравенства верны.',
          '§"" or "запасное"§ возвращает первый истинный операнд — «запасное».',
          'Пустой список ложен, а список §[0]§ с одним элементом истинен (важно содержимое «контейнера», а не его элементов).',
        ].map((s) => s.replace(/§/g, '`')),
        output: 'прогулка\nTrue\nзапасное\nFalse True',
      },
      counterexample: {
        lang: 'python',
        code: py`color = "green"
if color == "red" or "yellow":
    print("стоп")   # выполнится всегда!`,
        explain: 'Python разбирает условие как (color == "red") or "yellow", а непустая строка всегда истинна. Нужно color == "red" or color == "yellow" или color in ("red", "yellow").',
      },
      pitfalls: [
        md`Писать §x == 1 or 2§ вместо §x == 1 or x == 2§ — условие станет всегда истинным.`,
        md`Использовать цепочку §if§ там, где нужна взаимоисключающая §elif§: несколько веток сработают одновременно.`,
        md`Расставлять ветки §elif§ от общего к частному: §score >= 60§ перед §score >= 90§ перехватит все высокие оценки.`,
        md`Сравнивать с булевыми литералами: §if flag == True§ избыточно, пишите §if flag§; для None — §is None§.`,
      ],
      sources: [
        { title: 'Python Tutorial — if Statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements' },
        { title: 'Truth Value Testing', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing' },
        { title: 'Language Reference — Comparisons', url: 'https://docs.python.org/3/reference/expressions.html#comparisons' },
        { title: 'Boolean operations', url: 'https://docs.python.org/3/reference/expressions.html#boolean-operations' },
      ],
    },
    misconceptions: [
      {
        id: 'or-with-values',
        title: '«x == 1 or 2» означает «x равно 1 или 2»',
        explanation: 'or соединяет два целых выражения: (x == 1) и 2. Число 2 всегда истинно, поэтому условие истинно всегда.',
        fix: 'Повторяйте сравнение: x == 1 or x == 2, либо используйте x in (1, 2).',
      },
      {
        id: 'if-chain-all-run',
        title: 'Подряд идущие if работают как if/elif',
        explanation: 'Каждый if проверяется независимо, поэтому могут сработать несколько блоков. Взаимоисключение обеспечивает только elif/else.',
        fix: 'Если ветки взаимоисключающие — используйте elif и else.',
      },
      {
        id: 'truthy-only-bool',
        title: 'В условии значимы только True и False',
        explanation: 'Любое значение приводится к bool: пустая строка и ноль ложны, непустая строка «"0"» — истинна.',
        fix: 'Проверяйте истинность напрямую (if items:) и помните список ложных значений.',
      },
      {
        id: 'elif-order',
        title: 'Порядок веток elif не важен',
        explanation: 'Срабатывает первая истинная ветка. Общее условие, поставленное раньше частного, «съедает» все случаи.',
        fix: 'Проверяйте более строгие условия раньше (>= 90, затем >= 75 и т. д.).',
      },
    ],
  },
  exercises: [
    {
      id: 'py.conditions.1',
      skill: 'py.conditions',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`x = 15
if x > 10:
    print("A")
if x > 20:
    print("B")
elif x > 12:
    print("C")
else:
    print("D")`,
      answer: 'A\nC',
      explanation: 'Первый `if` независим и срабатывает (A). Второй блок — цепочка: `x > 20` ложно, `x > 12` истинно — печатается C, а `else` пропускается.',
    },
    {
      id: 'py.conditions.2',
      skill: 'py.conditions',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Что делает условие при x = 5?',
      code: py`x = 5
if x == 1 or 2:
    print("да")
else:
    print("нет")`,
      options: [
        { text: 'Печатает «да»: выражение «2» истинно, поэтому условие истинно для любого x', correct: true, why: 'Парсится как (x == 1) or 2, а ненулевое число истинно.' },
        { text: 'Печатает «нет»: 5 не равно ни 1, ни 2', why: 'Так читается по-человечески, но Python сравнивает только x == 1; вторая часть — просто число 2.', misconception: 'or-with-values' },
        { text: 'SyntaxError', why: 'Синтаксически выражение корректно, ошибка логическая.' },
        { text: 'Печатает «да» только для x равного 1 или 2', why: 'Это поведение для `x in (1, 2)`; здесь условие всегда истинно.', misconception: 'or-with-values' },
      ],
      explanation: 'Верная запись: `x == 1 or x == 2` либо `x in (1, 2)`.',
    },
    {
      id: 'py.conditions.3',
      skill: 'py.conditions',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите функцию `grade(score)`: 90 и выше — `"A"`, от 75 до 89 — `"B"`, от 60 до 74 — `"C"`, ниже 60 — `"D"`.',
      starter: py`def grade(score):
    pass
`,
      solution: py`def grade(score):
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 60:
        return "C"
    else:
        return "D"
`,
      tests: [
        { expr: 'grade(95)', expect: '"A"' },
        { expr: 'grade(80)', expect: '"B"' },
        { expr: 'grade(65)', expect: '"C"' },
        { expr: 'grade(30)', expect: '"D"' },
        { expr: 'grade(90)', expect: '"A"', hidden: true, label: 'граница 90' },
        { expr: 'grade(89)', expect: '"B"', hidden: true, label: 'сразу ниже 90' },
        { expr: 'grade(60)', expect: '"C"', hidden: true, label: 'граница 60' },
        { expr: 'grade(0)', expect: '"D"', hidden: true, label: 'ноль' },
      ],
      hints: [
        'Сколько разных результатов? Сколько границ нужно проверить?',
        'Проверяйте от самой высокой границы к низкой, используя `elif`.',
        'Последний случай (меньше 60) — это `else`: отдельное условие не нужно.',
      ],
      explanation: 'При проверке сверху вниз в каждой ветке уже известно, что предыдущие условия ложны, поэтому нижняя граница не нужна.',
    },
    {
      id: 'py.conditions.4',
      skill: 'py.conditions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'edge',
      prompt: 'Функция определяет високосный год, но ошибается для некоторых лет. Исправьте её по правилам: год високосный, если он делится на 4, кроме годов, делящихся на 100, но не кроме делящихся на 400.',
      buggy: py`def is_leap(year):
    return year % 4 == 0 and year % 100 != 0
`,
      solution: py`def is_leap(year):
    return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0
`,
      tests: [
        { expr: 'is_leap(2024)', expect: 'True' },
        { expr: 'is_leap(2023)', expect: 'False' },
        { expr: 'is_leap(1900)', expect: 'False', hidden: true, label: 'век, не кратный 400' },
        { expr: 'is_leap(2000)', expect: 'True', hidden: true, label: 'год, кратный 400' },
      ],
      hints: [
        'Проверьте 2000 год вручную: что вернёт функция и что должна вернуть?',
        'Какое правило из условия не учтено в выражении?',
        'Добавьте альтернативу через `or`: год кратен 400.',
      ],
      explanation: 'Год 2000 делится на 100, поэтому левая часть ложна, но он кратен 400. Нужна ещё одна ветка `or year % 400 == 0`; скобки показывают приоритет `and` над `or`.',
    },
    {
      id: 'py.conditions.5',
      skill: 'py.conditions',
      kind: 'predict',
      difficulty: 2,
      lang: 'python',
      prompt: 'Что выведет программа? Помните: `and`/`or` возвращают один из операндов.',
      code: py`items = []
name = "0"
print(bool(items), bool(name), 0 or "default", "" or [] or None)`,
      answer: 'False True default None',
      explanation: 'Пустой список ложен, а строка "0" непуста, значит истинна. `0 or "default"` возвращает первый истинный операнд, а в цепочке `"" or [] or None` все ложны, поэтому возвращается последний — None.',
    },
    {
      id: 'py.conditions.6',
      skill: 'py.conditions',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите функцию `fizz(n)`: вернуть `"FizzBuzz"`, если n делится на 3 и на 5; `"Fizz"` — только на 3; `"Buzz"` — только на 5; иначе — само число в виде строки.',
      starter: py`def fizz(n):
    pass
`,
      solution: py`def fizz(n):
    if n % 15 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    return str(n)
`,
      tests: [
        { expr: 'fizz(9)', expect: '"Fizz"' },
        { expr: 'fizz(10)', expect: '"Buzz"' },
        { expr: 'fizz(7)', expect: '"7"' },
        { expr: 'fizz(15)', expect: '"FizzBuzz"' },
        { expr: 'fizz(0)', expect: '"FizzBuzz"', hidden: true, label: 'ноль делится на всё' },
        { expr: 'fizz(-3)', expect: '"Fizz"', hidden: true, label: 'отрицательное число' },
      ],
      hints: [
        'Какой случай нужно проверять первым, чтобы он не «скрылся» за более общими?',
        'Делится на 3 и на 5 — это то же, что делится на 15.',
        'Порядок: 15, затем 3, затем 5; в конце `return str(n)`.',
      ],
      explanation: 'Самое специфичное условие (кратность 15) ставится первым, иначе его перехватит ветка «Fizz». Результат — строка, поэтому в конце `str(n)`.',
    },
    {
      id: 'py.conditions.7',
      skill: 'py.conditions',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'logic',
      prompt: 'Функция `clamp(x, lo, hi)` должна ограничивать x диапазоном [lo, hi], но для чисел внутри диапазона возвращает не то, что нужно. Исправьте.',
      buggy: py`def clamp(x, lo, hi):
    if x < lo:
        return lo
    elif x > hi:
        return hi
`,
      solution: py`def clamp(x, lo, hi):
    if x < lo:
        return lo
    elif x > hi:
        return hi
    return x
`,
      tests: [
        { expr: 'clamp(5, 0, 10)', expect: '5' },
        { expr: 'clamp(-3, 0, 10)', expect: '0' },
        { expr: 'clamp(42, 0, 10)', expect: '10' },
        { expr: 'clamp(0, 0, 10)', expect: '0', hidden: true, label: 'значение на нижней границе' },
        { expr: 'clamp(10, 0, 10)', expect: '10', hidden: true, label: 'значение на верхней границе' },
      ],
      hints: [
        'Что возвращает функция, если ни одно условие не сработало?',
        'Функция без выполненного `return` возвращает `None`.',
        'Добавьте возврат для случая «x уже в диапазоне».',
      ],
      explanation: 'Если ни `if`, ни `elif` не сработали, функция завершается без return и возвращает None. Добавьте финальный `return x` для значения внутри диапазона.',
    },
    {
      id: 'py.conditions.8',
      skill: 'py.conditions',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите программу определения билета: до 6 лет — «Бесплатно», до 18 лет — «Детский», иначе — «Взрослый». Возраст вводится с клавиатуры.',
      lines: [
        'age = int(input())',
        'if age < 6:',
        '    print("Бесплатно")',
        'elif age < 18:',
        '    print("Детский")',
        'else:',
        '    print("Взрослый")',
      ],
      distractors: ['elif age >= 18:', 'age = input()'],
      tests: [
        { stdin: ['3'], stdout: 'Бесплатно' },
        { stdin: ['6'], stdout: 'Детский' },
        { stdin: ['18'], stdout: 'Взрослый' },
      ],
      explanation: 'Условия идут от меньшего порога к большему; `elif` гарантирует, что сработает только одна ветка, а `int()` нужен, чтобы сравнивать число с числом.',
    },
    {
      id: 'py.conditions.9',
      skill: 'py.conditions',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Почему `if items and items[0] > 5:` безопасно работает с пустым списком, а `if items[0] > 5 and items:` — нет?',
      code: py`items = []
if items and items[0] > 5:
    print("big")`,
      keyPoints: [
        'and вычисляется слева направо и останавливается, как только результат известен (ленивое вычисление)',
        'Пустой список ложен, поэтому правая часть items[0] > 5 не вычисляется',
        'В обратном порядке items[0] выполнится первым и вызовет IndexError',
      ],
      modelAnswer: 'Оператор and вычисляет левый операнд, и если он ложен, правый вообще не вычисляется. Пустой список ложен, поэтому items[0] не выполняется и ошибки нет. Если поменять части местами, сначала будет вычислено items[0] > 5, что для пустого списка вызовет IndexError ещё до проверки items.',
      explanation: 'Порядок условий — это ещё и защита: проверку «можно ли обращаться» ставьте левее самого обращения.',
    },
  ],
};
