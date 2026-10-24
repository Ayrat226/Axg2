import type { Project } from '../../core/types';
import { py } from './_h';

// ---------- Проект 1: трекер расходов ----------
const e1 = py`def parse_line(line):
    name, amount = line.split(";")
    amount = float(amount)
    if amount <= 0:
        raise ValueError("сумма должна быть положительной")
    return (name.strip().lower(), amount)
`;
const e2 = e1 + py`
def parse_all(lines):
    records = []
    for line in lines:
        try:
            records.append(parse_line(line))
        except ValueError:
            continue
    return records
`;
const e3 = e2 + py`
def totals(records):
    sums = {}
    for name, amount in records:
        sums[name] = round(sums.get(name, 0) + amount, 2)
    return sums
`;
const e4 = e3 + py`
def top_category(sums):
    best = None
    for name in sorted(sums):
        if best is None or sums[name] > sums[best]:
            best = name
    if best is None:
        return None
    return (best, sums[best])
`;
const e5 = e4 + py`
def report(lines):
    records = parse_all(lines)
    if not records:
        return "Нет данных"
    sums = totals(records)
    total = round(sum(sums.values()), 2)
    out = []
    for neg, name in sorted((-a, n) for n, a in sums.items()):
        amount = -neg
        share = amount / total * 100
        out.append(f"{name:<8} {amount:>8.2f} {share:>5.1f}%")
    out.append(f"{'итого':<8} {total:>8.2f}")
    out.append("Топ: " + top_category(sums)[0])
    return "\n".join(out)
`;

const expenses: Project = {
  id: 'py.project.expenses',
  route: 'python',
  title: 'Трекер расходов',
  summary: 'Разбираем строки «категория;сумма», считаем итоги по категориям, находим главную статью расходов и печатаем аккуратный отчёт.',
  lang: 'python',
  prereqs: ['py.strings', 'py.dicts', 'py.functions', 'py.errors'],
  starter: py`# Трекер расходов: пишите функции шаг за шагом
def parse_line(line):
    pass
`,
  steps: [
    {
      title: 'Разбор одной строки',
      prompt: 'Напишите `parse_line(line)`: строка вида `"Еда; 250.50"` превращается в кортеж `("еда", 250.5)` — категория в нижнем регистре без пробелов по краям и сумма как `float`. Для некорректной строки (нет `;`, лишние поля, сумма не число или не положительная) функция должна бросать `ValueError`.',
      tests: [
        { expr: 'parse_line("Еда; 250.50")', expect: '("еда", 250.5)' },
        { expr: 'parse_line("  такси ;100")', expect: '("такси", 100.0)' },
        { expr: 'parse_line("КОФЕ;3.5")', expect: '("кофе", 3.5)', hidden: true, label: 'заглавные буквы' },
        { expr: 'parse_line("еда;0.01")', expect: '("еда", 0.01)', hidden: true, label: 'очень маленькая сумма' },
      ],
      hints: [
        'Метод `split(";")` делит строку на части. Что получится, если разделителей больше или меньше одного?',
        'Распаковка `name, amount = line.split(";")` сама бросит ValueError при неверном числе частей.',
        'Преобразуйте сумму через `float(...)`, проверьте `amount <= 0` и бросьте `ValueError`; имя очистите через `strip().lower()`.',
      ],
      solution: e1,
    },
    {
      title: 'Разбор всех строк с пропуском мусора',
      prompt: 'Напишите `parse_all(lines)`: принимает список строк и возвращает список успешно разобранных записей. Пустые и некорректные строки молча пропускаются.',
      tests: [
        { expr: 'parse_all(["еда;100", "", "bad", "кофе;x", "такси;50"])', expect: '[("еда", 100.0), ("такси", 50.0)]' },
        { expr: 'parse_all([])', expect: '[]', hidden: true, label: 'пустой список' },
        { expr: 'parse_all(["еда;-5", "еда;0", "а;1;2"])', expect: '[]', hidden: true, label: 'неположительные суммы и лишние поля' },
      ],
      hints: [
        'Какую функцию вы будете вызывать для каждой строки?',
        'Оберните вызов `parse_line` в `try ... except ValueError`.',
        'В обработчике ошибки просто перейдите к следующей строке (`continue`), а при успехе добавьте результат в список.',
      ],
      solution: e2,
    },
    {
      title: 'Итоги по категориям',
      prompt: 'Напишите `totals(records)`: из списка пар `(категория, сумма)` постройте словарь «категория → общая сумма», округляя суммы до 2 знаков.',
      tests: [
        { expr: 'totals([("еда", 100.0), ("такси", 50.0), ("еда", 25.5)])', expect: '{"еда": 125.5, "такси": 50.0}' },
        { expr: 'totals([])', expect: '{}', hidden: true, label: 'нет записей' },
        { expr: 'totals([("а", 0.1), ("а", 0.2)])', expect: '{"а": 0.3}', hidden: true, label: 'сложение дробных сумм' },
      ],
      hints: [
        'Какая структура данных отвечает на вопрос «сколько в этой категории»?',
        'Шаблон подсчёта: `sums.get(name, 0) + amount`.',
        'Чтобы избежать «хвостов» float, округляйте после каждого сложения: `round(..., 2)`.',
      ],
      solution: e3,
    },
    {
      title: 'Главная статья расходов',
      prompt: 'Напишите `top_category(sums)`: вернуть пару `(категория, сумма)` с наибольшей суммой. При равенстве выигрывает категория, идущая раньше по алфавиту. Для пустого словаря — `None`.',
      tests: [
        { expr: 'top_category({"еда": 125.5, "такси": 50.0})', expect: '("еда", 125.5)' },
        { expr: 'top_category({})', expect: 'None', hidden: true, label: 'пустой словарь' },
        { expr: 'top_category({"b": 5.0, "a": 5.0})', expect: '("a", 5.0)', hidden: true, label: 'ничья — по алфавиту' },
      ],
      hints: [
        'Нужна переменная «лучшая категория на данный момент». Какое у неё начальное значение?',
        'Чтобы при ничьей побеждала категория раньше по алфавиту, обходите ключи в порядке `sorted(sums)` и сравнивайте строго (`>`).',
        'После цикла верните `None`, если лучшей категории нет, иначе пару `(best, sums[best])`.',
      ],
      solution: e4,
    },
    {
      title: 'Отчёт',
      prompt: 'Напишите `report(lines)`: соберите из предыдущих шагов текстовый отчёт. Для каждой категории (по убыванию суммы, при равенстве — по имени) строка `f"{имя:<8} {сумма:>8.2f} {доля:>5.1f}%"`, затем строка `f"{\'итого\':<8} {всего:>8.2f}"` и строка `Топ: <категория>`. Если корректных записей нет — вернуть `"Нет данных"`.',
      tests: [
        {
          expr: 'report(["еда;100", "такси;50", "bad", "еда;50"])',
          expect: JSON.stringify('еда        150.00  75.0%\nтакси       50.00  25.0%\nитого      200.00\nТоп: еда'),
        },
        { expr: 'report([])', expect: '"Нет данных"', hidden: true, label: 'пустой ввод' },
        { expr: 'report(["bad", "x;y"])', expect: '"Нет данных"', hidden: true, label: 'только некорректные строки' },
        {
          expr: 'report(["кофе;3.5"])',
          expect: JSON.stringify('кофе         3.50 100.0%\nитого        3.50\nТоп: кофе'),
          hidden: true,
          label: 'одна категория — 100%',
        },
        {
          expr: 'report(["б;10", "а;10", "в;5"])',
          expect: JSON.stringify('а           10.00  40.0%\nб           10.00  40.0%\nв            5.00  20.0%\nитого       25.00\nТоп: а'),
          hidden: true,
          label: 'ничья по сумме — порядок по имени',
        },
      ],
      hints: [
        'Какие из ваших функций нужно вызвать по порядку: разбор, итоги, главная категория?',
        'Для сортировки по убыванию суммы и затем по имени удобно сортировать пары `(-сумма, имя)`.',
        'Формат строки задаёт спецификатор `{имя:<8}` (влево, ширина 8), `{сумма:>8.2f}` и `{доля:>5.1f}%`; строки соберите через `"\\n".join(...)`.',
      ],
      solution: e5,
    },
  ],
};

// ---------- Проект 2: мини-интерпретатор калькулятора ----------
const c1 = py`def tokenize(text):
    tokens = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == " ":
            i += 1
        elif ch in "+-*/()":
            tokens.append(ch)
            i += 1
        elif ch.isdigit() or ch == ".":
            j = i
            while j < len(text) and (text[j].isdigit() or text[j] == "."):
                j += 1
            try:
                tokens.append(float(text[i:j]))
            except ValueError:
                raise ValueError("неверное число: " + text[i:j]) from None
            i = j
        else:
            raise ValueError("неизвестный символ: " + ch)
    return tokens
`;
const c2 = c1 + py`
def evaluate_flat(tokens):
    if not tokens or len(tokens) % 2 == 0:
        raise ValueError("некорректное выражение")
    for k, t in enumerate(tokens):
        if k % 2 == 0:
            ok = isinstance(t, float)
        else:
            ok = t in ("+", "-", "*", "/")
        if not ok:
            raise ValueError("некорректное выражение")
    stack = [tokens[0]]
    i = 1
    while i < len(tokens):
        op = tokens[i]
        num = tokens[i + 1]
        if op == "*":
            stack[-1] = stack[-1] * num
        elif op == "/":
            stack[-1] = stack[-1] / num
        else:
            stack.append(op)
            stack.append(num)
        i += 2
    result = stack[0]
    for k in range(1, len(stack), 2):
        if stack[k] == "+":
            result += stack[k + 1]
        else:
            result -= stack[k + 1]
    return result
`;
const c3 = c2 + py`
def evaluate(tokens):
    tokens = list(tokens)
    while "(" in tokens:
        if ")" not in tokens:
            raise ValueError("скобки не сбалансированы")
        close = tokens.index(")")
        start = close - 1
        while start >= 0 and tokens[start] != "(":
            start -= 1
        if start < 0:
            raise ValueError("скобки не сбалансированы")
        value = evaluate_flat(tokens[start + 1:close])
        tokens[start:close + 1] = [value]
    if ")" in tokens:
        raise ValueError("скобки не сбалансированы")
    return evaluate_flat(tokens)
`;
const c4 = c3 + py`
def format_number(value):
    if value == int(value):
        return str(int(value))
    return str(round(value, 6))

def calc(text):
    try:
        return format_number(evaluate(tokenize(text)))
    except ZeroDivisionError:
        return "Ошибка: деление на ноль"
    except OverflowError:
        return "Ошибка: слишком большое число"
    except ValueError as e:
        return "Ошибка: " + str(e)
`;
const c5 = c4.replace(
  'def evaluate(tokens):\n    tokens = list(tokens)\n',
  py`def fold_unary(tokens):
    result = []
    for t in tokens:
        if result and isinstance(t, float) and result[-1] == "-" and (len(result) == 1 or result[-2] in ("+", "-", "*", "/", "(")):
            result[-1] = -t
        else:
            result.append(t)
    return result

def evaluate(tokens):
    tokens = fold_unary(tokens)
`,
);
const c6 = c5 + py`
def run_session(lines):
    out = []
    n = 0
    for line in lines:
        if not line.strip():
            continue
        n += 1
        out.append(f"[{n}] {line.strip()} = {calc(line)}")
    return out
`;

const calculator: Project = {
  id: 'py.project.calculator',
  route: 'python',
  title: 'Мини-интерпретатор калькулятора',
  summary: 'Пишем калькулятор выражений с нуля: токенизатор, приоритеты операций, скобки, обработка ошибок, унарный минус и сессия с историей.',
  lang: 'python',
  prereqs: ['py.strings', 'py.loops', 'py.lists', 'py.functions', 'py.errors'],
  starter: py`# Калькулятор выражений: пишите функции шаг за шагом
def tokenize(text):
    pass
`,
  steps: [
    {
      title: 'Токенизатор',
      prompt: 'Напишите `tokenize(text)`: разбейте выражение на «токены» — числа (как `float`, допускается десятичная точка) и символы операций `+ - * / ( )` (как строки). Пробелы пропускаются. Пример: `"12 * (3.5)"` → `[12.0, "*", "(", 3.5, ")"]`. Неизвестный символ — `ValueError("неизвестный символ: <символ>")`, некорректное число вроде `1.2.3` — `ValueError("неверное число: 1.2.3")`.',
      tests: [
        { expr: 'tokenize("2+3")', expect: '[2.0, "+", 3.0]' },
        { expr: 'tokenize("12 * (3.5)")', expect: '[12.0, "*", "(", 3.5, ")"]' },
        { expr: 'tokenize("")', expect: '[]', hidden: true, label: 'пустая строка' },
        { expr: 'tokenize("  7  ")', expect: '[7.0]', hidden: true, label: 'пробелы по краям' },
        { expr: 'tokenize("10/4-1")', expect: '[10.0, "/", 4.0, "-", 1.0]', hidden: true, label: 'числа и операции без пробелов' },
      ],
      hints: [
        'Пройдите по строке индексом `i` в цикле `while`: какие три вида символов нужно различать?',
        'Для числа найдите конец: пока следующий символ — цифра или точка, увеличивайте `j`; затем `float(text[i:j])`.',
        'Операции из `"+-*/()"` просто добавляйте в список; пробелы пропускайте; для остальных символов бросайте `ValueError`.',
      ],
      solution: c1,
    },
    {
      title: 'Приоритет операций (без скобок)',
      prompt: 'Напишите `evaluate_flat(tokens)`: вычислите список токенов без скобок с учётом приоритета (`*` и `/` раньше `+` и `-`) и левой ассоциативностью (`9-3-2 = 4`). Результат — `float`. Для некорректного списка (пустой, операции подряд, оператор в конце) бросайте `ValueError("некорректное выражение")`.',
      tests: [
        { expr: 'evaluate_flat(tokenize("2+3*4"))', expect: '14.0' },
        { expr: 'evaluate_flat(tokenize("10/4-1"))', expect: '1.5' },
        { expr: 'evaluate_flat(tokenize("8"))', expect: '8.0', hidden: true, label: 'одно число' },
        { expr: 'evaluate_flat(tokenize("9-3-2"))', expect: '4.0', hidden: true, label: 'левая ассоциативность вычитания' },
        { expr: 'evaluate_flat(tokenize("8/2/2"))', expect: '2.0', hidden: true, label: 'левая ассоциативность деления' },
        { expr: 'evaluate_flat(tokenize("2*3+4*5"))', expect: '26.0', hidden: true, label: 'несколько произведений' },
      ],
      hints: [
        'Сначала вычислите все `*` и `/` (слева направо), а потом сложите/вычтите то, что осталось.',
        'Заведите список-«стек»: начните с первого числа; если операция `*` или `/`, замените последний элемент результатом, иначе добавьте операцию и число.',
        'Затем пройдите по стеку тройками (операция, число) и выполните `+` или `-`.',
      ],
      solution: c2,
    },
    {
      title: 'Скобки',
      prompt: 'Напишите `evaluate(tokens)`: поддержите скобки. Идея — находить самую внутреннюю пару `( … )`, вычислять её через `evaluate_flat` и заменять на число. Несбалансированные скобки — `ValueError("скобки не сбалансированы")`.',
      tests: [
        { expr: 'evaluate(tokenize("(2+3)*4"))', expect: '20.0' },
        { expr: 'evaluate(tokenize("2*(3+(4-1))"))', expect: '12.0' },
        { expr: 'evaluate(tokenize("((1))"))', expect: '1.0', hidden: true, label: 'лишние скобки вокруг числа' },
        { expr: 'evaluate(tokenize("2+3*4"))', expect: '14.0', hidden: true, label: 'выражение без скобок по-прежнему работает' },
        { expr: 'evaluate(tokenize("(1+2)*(3+4)"))', expect: '21.0', hidden: true, label: 'две независимые пары скобок' },
      ],
      hints: [
        'Пока в списке есть `"("`, найдите первую `")"` — самая внутренняя пара закрывается именно ей.',
        'Идите влево от `")"`, пока не найдёте ближайшую `"("`.',
        'Замените срез от `"("` до `")"` одним числом: `tokens[start:close + 1] = [value]`.',
      ],
      solution: c3,
    },
    {
      title: 'Ошибки и красивый вывод',
      prompt: 'Напишите `calc(text)`, возвращающую строку: результат без лишнего `.0` (`14.0` → `"14"`, `2.5` → `"2.5"`, шесть знаков после запятой максимум). При ошибках функция **не падает**, а возвращает `"Ошибка: <причина>"` (деление на ноль → `"Ошибка: деление на ноль"`, остальные — сообщение `ValueError`).',
      tests: [
        { expr: 'calc("2+3*4")', expect: '"14"' },
        { expr: 'calc("10/4")', expect: '"2.5"' },
        { expr: 'calc("1/0")', expect: '"Ошибка: деление на ноль"' },
        { expr: 'calc("1/3")', expect: '"0.333333"', hidden: true, label: 'округление до 6 знаков' },
        { expr: 'calc("0.1+0.2")', expect: '"0.3"', hidden: true, label: 'хвосты float скрыты' },
        { expr: 'calc("2 $ 3")', expect: '"Ошибка: неизвестный символ: $"', hidden: true, label: 'неизвестный символ' },
        { expr: 'calc("(1+")', expect: '"Ошибка: скобки не сбалансированы"', hidden: true, label: 'незакрытая скобка' },
        { expr: 'calc("2 +")', expect: '"Ошибка: некорректное выражение"', hidden: true, label: 'оператор без правого операнда' },
        { expr: 'calc("")', expect: '"Ошибка: некорректное выражение"', hidden: true, label: 'пустое выражение' },
        { expr: 'calc("1.2.3")', expect: '"Ошибка: неверное число: 1.2.3"', hidden: true, label: 'некорректное число' },
      ],
      hints: [
        'Сначала решите, как превратить float в красивую строку: когда число целое?',
        'Оберните `evaluate(tokenize(text))` в `try` и отдельно перехватите `ZeroDivisionError`.',
        'Остальные ошибки калькулятора — `ValueError`: верните `"Ошибка: " + str(e)`.',
      ],
      solution: c4,
    },
    {
      title: 'Унарный минус',
      prompt: 'Поддержите отрицательные числа: `-5+3`, `2*-3`, `(-2)*3`, `5--2`. Минус — унарный, если он стоит в начале выражения, после оператора или после `(`. Идея: перед вычислением «склеивайте» такой минус со следующим числом (функция `fold_unary`).',
      tests: [
        { expr: 'calc("-5+3")', expect: '"-2"' },
        { expr: 'calc("2*-3")', expect: '"-6"' },
        { expr: 'calc("(-2)*3")', expect: '"-6"', hidden: true, label: 'отрицательное число в скобках' },
        { expr: 'calc("5--2")', expect: '"7"', hidden: true, label: 'бинарный минус и унарный подряд' },
        { expr: 'calc("-")', expect: '"Ошибка: некорректное выражение"', hidden: true, label: 'одинокий минус' },
        { expr: 'calc("2+3*4")', expect: '"14"', hidden: true, label: 'прежнее поведение не сломано' },
      ],
      hints: [
        'Минус — бинарный, если слева от него число или `)`. Когда он унарный?',
        'Идите по токенам и складывайте их в новый список; если встретили число, а перед ним в новом списке стоит `"-"` в «унарной позиции», замените этот минус на `-число`.',
        'Унарная позиция — минус стоит первым в списке или ему предшествует один из `+ - * / (`. Вызовите `fold_unary` в начале `evaluate`.',
      ],
      solution: c5,
    },
    {
      title: 'Сессия с историей',
      prompt: 'Напишите `run_session(lines)`: для каждой непустой строки вернуть `"[N] выражение = результат"` (N — порядковый номер среди непустых строк, выражение без пробелов по краям, результат — из `calc`).',
      tests: [
        { expr: 'run_session(["2+2", "", "1/0"])', expect: '["[1] 2+2 = 4", "[2] 1/0 = Ошибка: деление на ноль"]' },
        { expr: 'run_session([])', expect: '[]', hidden: true, label: 'пустая сессия' },
        { expr: 'run_session(["  -5+3  "])', expect: '["[1] -5+3 = -2"]', hidden: true, label: 'пробелы по краям и унарный минус' },
        { expr: 'run_session(["   ", ""])', expect: '[]', hidden: true, label: 'только пустые строки' },
      ],
      hints: [
        'Нужен счётчик непустых строк. Где его создать и когда увеличивать?',
        'Пропускайте строки, для которых `line.strip()` пуст, через `continue`.',
        'Для каждой остальной: `out.append(f"[{n}] {line.strip()} = {calc(line)}")`.',
      ],
      solution: c6,
    },
  ],
};

export const projects: Project[] = [expenses, calculator];
