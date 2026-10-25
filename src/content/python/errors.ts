import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

// Вспомогательная функция для проверки исключений в тестах: показана и в заготовке упражнения.
const ATTEMPT = py`def attempt(fn, *args):
    # Вспомогательная функция: вернёт "ok: результат" или "ТипОшибки: сообщение"
    try:
        return "ok: " + str(fn(*args))
    except Exception as e:
        return type(e).__name__ + ": " + str(e)
`;

export const errors: SkillModule = {
  skill: {
    id: 'py.errors',
    route: 'python',
    title: 'Ошибки и исключения',
    icon: '🛟',
    summary: 'Чтение трейсбеков, типовые исключения, try/except/else/finally, raise и свои исключения.',
    prereqs: ['py.functions'],
    tier: 3,
    outcomes: [
      'Читаю трейсбек снизу вверх: тип ошибки, сообщение, место сбоя',
      'Узнаю типовые исключения (ValueError, TypeError, KeyError, IndexError, ZeroDivisionError, NameError, AttributeError)',
      'Пишу try/except/else/finally, ловлю конкретные исключения и не глотаю лишнего',
      'Генерирую исключения через raise и определяю собственные классы исключений',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Ошибки неизбежны: плохой ввод, отсутствующий файл, сбой сети. Умение читать сообщения и обрабатывать исключения отличает программу, которая падает, от программы, которая сообщает, что пошло не так.',
      brief: md`Трейсбек читают **снизу**: последняя строка — тип и сообщение, ближайший к ней §File§ — место сбоя. §try§ — опасный код, §except Тип§ — реакция, §else§ — если ошибки не было, §finally§ — выполнится всегда. §raise ValueError("текст")§ создаёт ошибку. Ловите конкретные типы, не голый §except:§.`,
      standard: md`**Как читать трейсбек.** Python показывает цепочку вызовов от входа в программу к месту ошибки:

§§§text
Traceback (most recent call last):
  File "main.py", line 7, in <module>
    print(average([]))
  File "main.py", line 3, in average
    return sum(nums) / len(nums)
ZeroDivisionError: division by zero
§§§

Читайте **снизу вверх**: 1) последняя строка — **тип** ошибки и сообщение; 2) предыдущий блок — строка кода, где она произошла; 3) выше — кто эту функцию вызвал.

**Типовые исключения:**

- §ValueError§ — значение неподходящее (§int("abc")§);
- §TypeError§ — неверный тип (§"a" + 1§, вызов не-функции);
- §KeyError§ / §IndexError§ — нет ключа / индекса;
- §ZeroDivisionError§, §NameError§ (неизвестное имя), §AttributeError§ (нет атрибута), §SyntaxError§ (код не разобран — выявляется до запуска).

**try / except / else / finally:**

§§§python
try:
    n = int(text)             # код, который может упасть
except ValueError:            # реакция на конкретную ошибку
    print("не число")
else:
    print("успех:", n)        # только если исключения не было
finally:
    print("всегда")           # выполняется в любом случае
§§§

Можно ловить несколько типов: §except (ValueError, TypeError) as e:§, а §e§ — объект ошибки (§str(e)§ — сообщение). Первый подходящий §except§ срабатывает, остальные пропускаются, поэтому **частные** типы ставят **выше** общих.

**raise.** Исключение создаёт сам код:

§§§python
def set_age(age):
    if age < 0:
        raise ValueError("возраст не может быть отрицательным")
§§§

Внутри §except§ голый §raise§ повторно бросает пойманную ошибку. Конструкция §raise NewError(...) from e§ сохраняет причину.

**Свои исключения** — классы-наследники §Exception§:

§§§python
class InsufficientFunds(Exception):
    pass
§§§

Ловить нужно **конкретные** исключения, которые вы умеете обработать. Голый §except:§ или §except Exception: pass§ прячет настоящие баги.`,
      deep: md`**Иерархия.** Все исключения — классы: §BaseException§ → §Exception§ → §ValueError§, §TypeError§, §LookupError§ (родитель §KeyError§ и §IndexError§), §ArithmeticError§ (родитель §ZeroDivisionError§), §OSError§ (§FileNotFoundError§ и др.). §except LookupError§ поймает и §KeyError§, и §IndexError§. Голый §except:§ ловит даже §KeyboardInterrupt§ и §SystemExit§ — именно поэтому его избегают.

**finally сильнее return.** Блок §finally§ выполняется даже при §return§ внутри §try§; если в §finally§ тоже есть §return§ — он **перекроет** исходный результат и подавит исключение. Поэтому в §finally§ делают очистку (закрыть файл, снять блокировку), но не возвращают значения. Для ресурсов обычно удобнее §with§.

**Цепочки исключений.** При §raise X from e§ у нового исключения заполняется §__cause__§, в трейсбеке видно «The above exception was the direct cause». Если исключение возникло внутри §except§ без §from§, Python сам запишет §__context__§. §from None§ скрывает предысторию.

**EAFP и LBYL.** Python-идиома — «проще попросить прощения, чем разрешения» (EAFP): пробуем действие и ловим ошибку, вместо многочисленных предварительных проверок (LBYL). EAFP устойчивее к гонкам (файл мог исчезнуть между проверкой и открытием).

**Стоимость.** Вход в §try§ почти бесплатен; дорого именно срабатывание исключения. Используйте исключения для исключительных ситуаций, а не для обычной логики в горячем цикле.

**Новое в современных версиях.** Подсказки «Did you mean…» в сообщениях NameError/AttributeError (3.10+); §e.add_note("контекст")§ добавляет заметку к исключению (3.11+); группы исключений и §except*§ (3.11+). С Python 3.14 допускается писать §except A, B:§ без скобок (если нет §as§); запись §except (A, B):§ остаётся универсальной.

**§assert§** проверяет внутренние предположения (§assert x > 0, "x должен быть положительным"§) и отключается флагом §-O§, поэтому не годится для проверки пользовательского ввода.`,
      analogy: 'Исключение — как сигнал пожарной тревоги: он прерывает обычный ход дел и идёт «вверх по этажам» (по стеку вызовов), пока кто-то не возьмёт ответственность за него (except). Трейсбек — журнал, по какому маршруту тревога поднималась.',
      example: {
        lang: 'python',
        code: py`class InsufficientFunds(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(f"нужно {amount}, есть {balance}")
    return balance - amount

for amount in (30, 500):
    try:
        left = withdraw(100, amount)
    except InsufficientFunds as e:
        print("отказ:", e)
    else:
        print("остаток:", left)
    finally:
        print("операция завершена")

try:
    int("12a")
except ValueError as e:
    print(type(e).__name__, "-", e)`,
        steps: [
          '§InsufficientFunds§ — собственный класс исключения; наследование от §Exception§ делает его «ловимым».',
          '§withdraw§ сама проверяет условие и бросает §raise§ — это явный способ сообщить о недопустимой операции.',
          'Для 30 ошибки нет: выполняются §else§ (печать остатка) и §finally§. Для 500 срабатывает §except§ — §else§ пропускается, а §finally§ всё равно выполняется.',
          'У пойманного объекта §e§ можно взять тип (§type(e).__name__§) и сообщение (§str(e)§).',
        ].map((s) => s.replace(/§/g, '`')),
        output: "остаток: 70\nоперация завершена\nотказ: нужно 500, есть 100\nоперация завершена\nValueError - invalid literal for int() with base 10: '12a'",
      },
      counterexample: {
        lang: 'python',
        code: py`def read_age(text):
    try:
        return int(text)
    except:            # ловит всё подряд
        return 0

print(read_age("abc"))   # 0 — ошибка скрыта
print(read_age(None))    # 0 — а это уже баг в вызывающем коде`,
        explain: 'Голый except прячет разные причины: плохой формат (ValueError) и неверный тип (TypeError, баг программиста). Ловите только то, что умеете обработать: except ValueError.',
      },
      pitfalls: [
        md`Писать голый §except:§ или §except Exception: pass§: настоящие баги исчезнут без следа.`,
        md`Ставить общий §except Exception§ выше частного §except ValueError§: частный блок никогда не выполнится.`,
        md`Читать трейсбек сверху: причина ошибки — в **последних** строках.`,
        md`Оборачивать в §try§ большие блоки: ловите ошибку только вокруг строки, которая действительно может упасть.`,
      ],
      sources: [
        { title: 'Python Tutorial — Errors and Exceptions', url: 'https://docs.python.org/3/tutorial/errors.html' },
        { title: 'Built-in Exceptions (иерархия)', url: 'https://docs.python.org/3/library/exceptions.html' },
        { title: 'Language Reference — The try statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-try-statement' },
        { title: 'Glossary — EAFP', url: 'https://docs.python.org/3/glossary.html#term-EAFP' },
      ],
    },
    misconceptions: [
      {
        id: 'traceback-top-is-cause',
        title: 'Причина ошибки указана в начале трейсбека',
        explanation: 'Верхние строки показывают, откуда начался вызов. Место, где реально возникла ошибка, и её тип — внизу.',
        fix: 'Читайте трейсбек снизу вверх: тип и сообщение, затем строка кода.',
      },
      {
        id: 'bare-except-fine',
        title: 'Голый except — удобный способ «чтобы не падало»',
        explanation: 'Он скрывает любые ошибки, включая опечатки и баги, и даже KeyboardInterrupt. Программа продолжает работать с неверными данными.',
        fix: 'Ловите конкретные исключения и обрабатывайте или логируйте их осмысленно.',
      },
      {
        id: 'finally-only-on-error',
        title: 'finally выполняется только при ошибке',
        explanation: 'finally выполняется всегда: после успешного try, после except и даже при return внутри try.',
        fix: 'Используйте finally для очистки ресурсов, а else — для кода «только если всё прошло успешно».',
      },
      {
        id: 'except-order',
        title: 'Порядок except не важен',
        explanation: 'Срабатывает первый подходящий except. Если родительский класс (Exception) стоит раньше дочернего (ZeroDivisionError), дочерний недостижим.',
        fix: 'Располагайте блоки от частных исключений к общим.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.errors.1',
      skill: 'py.errors',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Дан трейсбек. Что из него следует?',
      code: py`Traceback (most recent call last):
  File "main.py", line 7, in <module>
    print(average([]))
  File "main.py", line 3, in average
    return sum(nums) / len(nums)
ZeroDivisionError: division by zero`,
      options: [
        { text: 'Ошибка ZeroDivisionError возникла в функции average на строке 3, а функция вызвана из строки 7', correct: true, why: 'Последняя строка — тип ошибки; ближайший к ней блок File — место сбоя; выше — цепочка вызовов.' },
        { text: 'Ошибка находится на строке 7, потому что трейсбек начинается с неё', why: 'Строка 7 — только место вызова. Реальное деление на ноль произошло глубже — в average.', misconception: 'traceback-top-is-cause' },
        { text: 'Ошибка синтаксическая: Python не смог прочитать файл', why: 'Синтаксические ошибки — SyntaxError и выявляются до выполнения.' },
        { text: 'Нужно исправить `sum(nums)`, потому что сумма пустого списка не определена', why: 'sum([]) корректно равно 0. Падает именно деление на len(nums) == 0.' },
      ],
      explanation: 'Деление на `len(nums)` для пустого списка — классический пограничный случай: проверьте список заранее или обработайте ZeroDivisionError.',
    },
    {
      id: 'py.errors.2',
      skill: 'py.errors',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`try:
    n = int("12a")
except ValueError:
    print("bad")
else:
    print("ok")
finally:
    print("done")`,
      answer: 'bad\ndone',
      explanation: '`int("12a")` вызывает ValueError, выполняется `except` (bad); `else` пропускается, потому что ошибка была; `finally` выполняется всегда (done).',
    },
    {
      id: 'py.errors.3',
      skill: 'py.errors',
      kind: 'predict',
      difficulty: 2,
      lang: 'python',
      prompt: 'Что выведет программа? Обратите внимание на порядок вывода.',
      code: py`def f():
    try:
        return "try"
    finally:
        print("cleanup")

print(f())`,
      answer: 'cleanup\ntry',
      explanation: 'Значение `"try"` вычислено, но перед выходом из функции обязательно выполняется `finally` (печатает cleanup). Только потом результат возвращается и печатается внешним `print`.',
    },
    {
      id: 'py.errors.4',
      skill: 'py.errors',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите функцию `safe_int(text, default=0)`: возвращает `int(text)`, а если преобразовать нельзя (неверный формат или `None`) — значение `default`.',
      starter: py`def safe_int(text, default=0):
    pass
`,
      solution: py`def safe_int(text, default=0):
    try:
        return int(text)
    except (ValueError, TypeError):
        return default
`,
      tests: [
        { expr: 'safe_int("42")', expect: '42' },
        { expr: 'safe_int("abc")', expect: '0' },
        { expr: 'safe_int("x", -1)', expect: '-1' },
        { expr: 'safe_int(" 7 ")', expect: '7', hidden: true, label: 'пробелы по краям допустимы' },
        { expr: 'safe_int(None)', expect: '0', hidden: true, label: 'None вызывает TypeError' },
        { expr: 'safe_int("3.5")', expect: '0', hidden: true, label: 'дробная строка — ValueError' },
      ],
      hints: [
        'Какое исключение даёт `int("abc")`? А `int(None)`?',
        'Оберните вызов `int(text)` в `try`, а в `except` верните `default`.',
        'Перечислите оба типа в скобках: `except (ValueError, TypeError):`.',
      ],
      explanation: '`int("abc")` → ValueError, `int(None)` → TypeError. Перечисляем только те типы, которые ожидаем: голый `except` скрыл бы и настоящие баги.',
    },
    {
      id: 'py.errors.5',
      skill: 'py.errors',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Напишите `parse_age(text)`: возвращает возраст как `int`. Если текст не целое число — `raise ValueError("возраст должен быть числом")`; если число вне диапазона 0…150 — `raise ValueError("возраст вне диапазона 0..150")`. Вспомогательная функция `attempt` уже есть — она нужна тестам.',
      starter: ATTEMPT + '\ndef parse_age(text):\n    pass\n',
      solution: ATTEMPT + py`
def parse_age(text):
    try:
        age = int(text)
    except ValueError:
        raise ValueError("возраст должен быть числом") from None
    if not 0 <= age <= 150:
        raise ValueError("возраст вне диапазона 0..150")
    return age
`,
      tests: [
        { expr: 'attempt(parse_age, "42")', expect: '"ok: 42"' },
        { expr: 'attempt(parse_age, "abc")', expect: '"ValueError: возраст должен быть числом"' },
        { expr: 'attempt(parse_age, "-1")', expect: '"ValueError: возраст вне диапазона 0..150"', hidden: true, label: 'отрицательный возраст' },
        { expr: 'attempt(parse_age, "151")', expect: '"ValueError: возраст вне диапазона 0..150"', hidden: true, label: 'слишком большой возраст' },
        { expr: 'attempt(parse_age, "0")', expect: '"ok: 0"', hidden: true, label: 'граница 0' },
        { expr: 'attempt(parse_age, " 30 ")', expect: '"ok: 30"', hidden: true, label: 'пробелы по краям' },
      ],
      hints: [
        'Две разные проверки — две разные причины для `raise`. Какая из них требует `try`?',
        'Преобразование `int(text)` оберните в `try ... except ValueError`, внутри `except` бросьте своё `ValueError` с нужным текстом.',
        'После успешного преобразования проверьте диапазон цепочкой `0 <= age <= 150` и бросьте `ValueError`, если условие не выполнено.',
      ],
      explanation: 'Функция сообщает о проблеме исключением, а не возвращает «специальное значение». `from None` скрывает показ исходного исключения (`ValueError` от `int`) в трейсбеке, оставляя только понятное сообщение нового.',
    },
    {
      id: 'py.errors.6',
      skill: 'py.errors',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'logic',
      prompt: 'Функция должна вернуть `"деление на ноль"` при делении на 0 и `"ошибка"` при любых других проблемах (например, строка вместо числа). Сейчас особый случай не срабатывает. Исправьте.',
      buggy: py`def check(x):
    try:
        return 10 / x
    except Exception:
        return "ошибка"
    except ZeroDivisionError:
        return "деление на ноль"
`,
      solution: py`def check(x):
    try:
        return 10 / x
    except ZeroDivisionError:
        return "деление на ноль"
    except Exception:
        return "ошибка"
`,
      tests: [
        { expr: 'check(5)', expect: '2.0' },
        { expr: 'check(0)', expect: '"деление на ноль"' },
        { expr: 'check("a")', expect: '"ошибка"', hidden: true, label: 'строка вместо числа (TypeError)' },
      ],
      hints: [
        'Для `check(0)` какой `except` срабатывает первым?',
        'ZeroDivisionError — потомок Exception. Что это значит для порядка блоков?',
        'Поставьте частный `except ZeroDivisionError` выше общего `except Exception`.',
      ],
      explanation: 'Срабатывает первый подходящий `except`. `Exception` ловит и ZeroDivisionError, поэтому второй блок был недостижим. Частное — выше, общее — ниже.',
    },
    {
      id: 'py.errors.7',
      skill: 'py.errors',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'edge',
      prompt: 'Функция должна превратить в числа все строки, которые можно преобразовать, и **пропустить** остальные. Но на первой же плохой строке она останавливается. Исправьте.',
      buggy: py`def parse_all(items):
    result = []
    for s in items:
        try:
            result.append(int(s))
        except ValueError:
            break
    return result
`,
      solution: py`def parse_all(items):
    result = []
    for s in items:
        try:
            result.append(int(s))
        except ValueError:
            continue
    return result
`,
      tests: [
        { expr: 'parse_all(["1", "2", "3"])', expect: '[1, 2, 3]' },
        { expr: 'parse_all(["1", "x", "3"])', expect: '[1, 3]' },
        { expr: 'parse_all([])', expect: '[]', hidden: true, label: 'пустой список' },
        { expr: 'parse_all(["a", "b"])', expect: '[]', hidden: true, label: 'все строки некорректны' },
        { expr: 'parse_all(["x", "5"])', expect: '[5]', hidden: true, label: 'плохая строка в начале' },
      ],
      hints: [
        'Проверьте на `["1", "x", "3"]`: сколько элементов вернётся и почему?',
        'Что делает `break` внутри `except`?',
        'Чтобы перейти к следующему элементу, нужен `continue` (или просто `pass`).',
      ],
      explanation: '`break` завершает весь цикл на первой же ошибке, поэтому остальные строки не обрабатываются. Нужно пропустить только текущую итерацию — `continue`.',
    },
    {
      id: 'py.errors.8',
      skill: 'py.errors',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите программу: читает строку; если это целое число — печатает его удвоенным, иначе — «не число»; в любом случае в конце печатает «конец».',
      lines: [
        'text = input()',
        'try:',
        '    n = int(text)',
        'except ValueError:',
        '    print("не число")',
        'else:',
        '    print(n * 2)',
        'finally:',
        '    print("конец")',
      ],
      distractors: ['except Value:', '    print(n / 0)'],
      tests: [
        { stdin: ['21'], stdout: '42\nконец' },
        { stdin: ['x'], stdout: 'не число\nконец' },
      ],
      explanation: '`else` выполняется только при отсутствии ошибки, `finally` — всегда. Тип исключения в `except` должен существовать (`ValueError`).',
    },
    {
      id: 'py.errors.9',
      skill: 'py.errors',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Почему голый `except:` (или `except Exception: pass`) считается плохой практикой? Что лучше делать?',
      code: py`try:
    value = int(user_input)   # опечатка: имя user_input не определено
except:
    value = 0`,
      keyPoints: [
        'Голый except ловит любые ошибки, включая баги программиста (NameError, TypeError) и KeyboardInterrupt',
        'Ошибка молча скрывается, программа продолжает работать с неверными данными',
        'Нужно ловить конкретные исключения, которые умеете обработать, и обрабатывать или логировать их осмысленно',
      ],
      modelAnswer: 'Голый except перехватывает вообще всё: и ожидаемую ValueError от плохого ввода, и баги вроде NameError из-за опечатки, и даже Ctrl+C. Программа не падает, а продолжает работать с неверным значением, и найти причину очень трудно. Правильнее ловить конкретный тип (except ValueError), в обработчике сообщать пользователю или логировать ошибку, а неожиданные исключения оставлять всплывать.',
      explanation: 'Трейсбек — ваш друг: скрывая исключение, вы лишаете себя единственной подсказки.',
    },
  ],
};
