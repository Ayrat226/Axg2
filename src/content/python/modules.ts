import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const modules: SkillModule = {
  skill: {
    id: 'py.modules',
    route: 'python',
    title: 'Модули и стандартная библиотека',
    icon: '📦',
    summary: 'import, math, random с seed, collections (Counter, defaultdict), datetime и if __name__ == "__main__".',
    prereqs: ['py.functions', 'py.dicts'],
    tier: 3,
    outcomes: [
      'Импортирую модули тремя способами (import, from … import, as) и понимаю, что делает import',
      'Использую math, random (с seed), collections.Counter/defaultdict и datetime для типовых задач',
      'Пишу модуль-скрипт с проверкой if __name__ == "__main__"',
      'Нахожу нужное в документации через help(), dir() и docs.python.org',
    ],
    estMinutes: 30,
    lesson: {
      why: '«Батарейки в комплекте»: стандартная библиотека решает большинство повседневных задач без установки пакетов. Умение подключать и искать модули ускоряет работу в разы.',
      brief: md`§import math§ подключает модуль, §from math import sqrt§ — имя из него. Первый импорт **выполняет** модуль целиком и кэширует результат. §random.seed(n)§ делает случайность воспроизводимой. §Counter§ считает, §defaultdict§ подставляет значения по умолчанию, §datetime§ работает с датами. §if __name__ == "__main__":§ — код только при запуске файла, но не при импорте.`,
      standard: md`**Импорт.** Модуль — это файл с кодом на Python; импорт делает его имена доступными:

§§§python
import math                      # math.sqrt(16)
from math import sqrt, pi        # sqrt(16) — без префикса
import datetime as dt            # короткий псевдоним
§§§

Первый §import§ **выполняет** модуль сверху вниз (определения функций, а также любые вызовы §print§ на верхнем уровне) и сохраняет объект в §sys.modules§; повторные импорты берут готовый объект. Не используйте §from module import *§: он засоряет пространство имён и затрудняет чтение.

**Обзор стандартной библиотеки.**

- §math§ — §sqrt§, §floor§, §ceil§, §gcd§, §pi§, §isclose§, §log§;
- §random§ — §random()§, §randint(a, b)§, §choice§, §shuffle§ (на месте), §sample§;
- §collections§ — §Counter§, §defaultdict§, §deque§, §namedtuple§;
- §datetime§ — §date§, §datetime§, §timedelta§;
- также §itertools§, §json§, §pathlib§, §re§, §statistics§, §functools§.

**random и seed.** Числа «случайны», но определяются начальным состоянием. После §random.seed(7)§ последовательность всегда одна и та же — это нужно для тестов и воспроизводимых экспериментов. Для паролей и токенов используйте модуль §secrets§, а не §random§.

**collections:**

§§§python
from collections import Counter, defaultdict
Counter("mississippi").most_common(2)     # [('i', 4), ('s', 4)]
groups = defaultdict(list)
groups["a"].append("ant")                 # ключ создаётся автоматически
§§§

**datetime:**

§§§python
from datetime import date, timedelta
d = date(2024, 2, 28) + timedelta(days=2)    # 2024-03-01
print(d.strftime("%d.%m.%Y"))                # 01.03.2024
print((date(2024, 3, 1) - date(2024, 1, 1)).days)  # 60
§§§

**if __name__ == "__main__".** Когда файл запускают напрямую, §__name__ == "__main__"§; когда его импортируют — §__name__§ равен имени модуля. Поэтому код «запуска» прячут под этим условием:

§§§python
def main():
    print("hello")

if __name__ == "__main__":
    main()
§§§

Теперь файл можно и запустить, и безопасно импортировать ради функций.`,
      deep: md`**Как работает поиск.** §import x§ ищет модуль в §sys.modules§, затем по путям из §sys.path§ (текущая папка, стандартная библиотека, установленные пакеты). Поэтому файл с именем §random.py§ рядом со скриптом **затмит** стандартный модуль («shadowing»), и вы получите странные ошибки вроде «module has no attribute». Не называйте свои файлы как стандартные модули.

**Пакеты.** Папка с §__init__.py§ (или без него — «пространство имён») — пакет: §import package.sub.mod§. Относительные импорты (§from . import x§) работают только внутри пакетов. Круговые импорты (A импортирует B, B — A) приводят к ImportError/частично инициализированным модулям: выносите общее в третий модуль или импортируйте внутри функции.

**Зависимости.** Сторонние пакеты ставят через §pip§ в виртуальное окружение (§python -m venv .venv§), чтобы проекты не конфликтовали по версиям.

**random.** Генератор — Mersenne Twister; для одного seed результат воспроизводим на всех платформах (для основных функций). §random.Random(seed)§ создаёт **независимый** генератор — лучше для тестов, чем глобальное состояние. §random.choices§ выбирает с повторениями (и весами), §random.sample§ — без повторений.

**Counter и defaultdict.** §Counter§ — подкласс dict: §c["нет"]§ → 0 (без KeyError), поддерживает §+§, §-§ и §most_common(n)§ (при равных счётчиках порядок — по первому появлению). §defaultdict(фабрика)§ вызывает фабрику при обращении к отсутствующему ключу — и **вставляет** результат; обычное чтение §dd[k]§ меняет словарь.

**datetime.** Объекты бывают «наивными» (без часового пояса) и «осведомлёнными» (с §tzinfo§). Для работы с поясами используйте §zoneinfo§. Разбор и формат: §datetime.strptime(text, "%Y-%m-%d")§, §date.fromisoformat("2024-03-01")§. Вычитание дат даёт §timedelta§. Для календарных вычислений есть модуль §calendar§ (§monthrange§, §isleap§).

**Скорость импорта.** Тяжёлые модули импортируют лениво, внутри функции, если они нужны не всегда. Сам §import§ кэшируется, повторный вызов дёшев.`,
      analogy: 'Стандартная библиотека — общий инструментальный склад: на каждом инструменте ярлык (имя модуля). import — взять инструмент со склада; from … import — сразу положить конкретную отвёртку в карман. Но склад открывается один раз: при первом заходе всё расставляется по местам.',
      example: {
        lang: 'python',
        code: py`import math
import random
from collections import Counter, defaultdict
from datetime import date, timedelta

print(round(math.sqrt(2), 3), math.gcd(12, 18), math.floor(-2.5))
random.seed(1)
a = random.randint(1, 100)
random.seed(1)
print(a == random.randint(1, 100))
print(Counter("mississippi").most_common(2))
groups = defaultdict(list)
for w in ["ant", "bee", "ape"]:
    groups[w[0]].append(w)
print(dict(groups))
d = date(2024, 2, 28) + timedelta(days=2)
print(d, d.strftime("%d.%m.%Y"), d.weekday())
print(__name__ == "__main__")`,
        steps: [
          '§math.sqrt(2)§ округляем для читаемого вывода; §gcd§ — наибольший общий делитель, §floor(-2.5)§ округляет вниз до −3.',
          'После одинакового §seed§ §randint§ даёт то же число, поэтому сравнение истинно — так делают воспроизводимые тесты.',
          '§Counter§ считает символы и §most_common(2)§ возвращает два самых частых: 4 раза «i» и 4 раза «s» (при равенстве — по порядку первого появления).',
          '§defaultdict(list)§ создаёт пустой список при первом обращении к новому ключу — не нужно проверять §if key in dict§.',
          '§date + timedelta§ даёт 1 марта 2024 (високосный год: в феврале 29 дней); §weekday()§ равен 4 — пятница (0 — понедельник).',
          'Файл запущен напрямую, поэтому §__name__ == "__main__"§ истинно.',
        ].map((s) => s.replace(/§/g, '`')),
        output: "1.414 6 -3\nTrue\n[('i', 4), ('s', 4)]\n{'a': ['ant', 'ape'], 'b': ['bee']}\n2024-03-01 01.03.2024 4\nTrue",
      },
      counterexample: {
        lang: 'python',
        code: py`# файл utils.py
def helper():
    return 42

print("загружен utils")   # выполняется при КАЖДОМ первом import utils

# другой файл:
# import utils            # напечатает "загружен utils"`,
        explain: 'Импорт выполняет модуль целиком. Код верхнего уровня с побочными эффектами (print, запуск программы) лучше убрать под if __name__ == "__main__":.',
      },
      pitfalls: [
        md`Назвать свой файл как стандартный модуль (§random.py§, §math.py§): он «затмит» библиотеку.`,
        md`Использовать §from module import *§: непонятно, откуда имя, и возможны конфликты.`,
        md`Полагаться на «случайные» числа в тестах без §seed§: результаты будут разными при каждом запуске.`,
        md`Забыть, что §defaultdict§ создаёт ключ даже при чтении, а §Counter§ нет: чтение отсутствующего ключа вернёт 0, но не добавит его.`,
      ],
      sources: [
        { title: 'Python Tutorial — Modules', url: 'https://docs.python.org/3/tutorial/modules.html' },
        { title: 'Python Tutorial — Brief Tour of the Standard Library', url: 'https://docs.python.org/3/tutorial/stdlib.html' },
        { title: 'collections — Container datatypes', url: 'https://docs.python.org/3/library/collections.html' },
        { title: 'datetime — Basic date and time types', url: 'https://docs.python.org/3/library/datetime.html' },
        { title: '__main__ — Top-level code environment', url: 'https://docs.python.org/3/library/__main__.html' },
      ],
    },
    misconceptions: [
      {
        id: 'import-only-defines',
        title: 'import только подключает имена и ничего не запускает',
        explanation: 'При первом импорте модуль выполняется целиком: любой код верхнего уровня (включая print) сработает.',
        fix: 'Прячьте код запуска под if __name__ == "__main__":.',
      },
      {
        id: 'star-import-fine',
        title: 'from module import * — удобно и безопасно',
        explanation: 'Звёздочка засоряет пространство имён и может незаметно затереть ваши имена; непонятно, откуда взялась функция.',
        fix: 'Импортируйте конкретные имена или весь модуль с префиксом.',
      },
      {
        id: 'random-reproducible',
        title: 'random даёт одну и ту же последовательность при каждом запуске',
        explanation: 'Без seed состояние инициализируется случайно (из системы), и результаты различаются. Воспроизводимость даёт только random.seed(n).',
        fix: 'Задавайте seed в тестах и экспериментах.',
      },
      {
        id: 'shadow-stdlib',
        title: 'Имя собственного файла не влияет на импорты',
        explanation: 'Файл random.py рядом со скриптом импортируется вместо стандартного модуля и ломает код с непонятными ошибками.',
        fix: 'Не называйте свои модули как стандартные.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.modules.1',
      skill: 'py.modules',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`import math
print(math.sqrt(16), math.floor(-2.5), math.ceil(2.1), math.gcd(12, 18))`,
      answer: '4.0 -3 3 6',
      explanation: '`sqrt` всегда возвращает float (4.0); `floor` округляет вниз (−2.5 → −3), `ceil` — вверх (2.1 → 3); `gcd(12, 18)` — наибольший общий делитель 6.',
    },
    {
      id: 'py.modules.2',
      skill: 'py.modules',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Файл `utils.py` содержит функцию `helper()` и строку `print("loaded")` на верхнем уровне. Что произойдёт при `import utils` в другом файле?',
      options: [
        { text: 'Напечатается «loaded»: при импорте модуль выполняется целиком', correct: true, why: 'Импорт запускает код модуля сверху вниз, в том числе print на верхнем уровне.' },
        { text: 'Ничего не напечатается: import только делает имена доступными', why: 'Имена появляются именно потому, что модуль выполняется; побочные эффекты сработают.', misconception: 'import-only-defines' },
        { text: 'Напечатается «loaded» при каждом вызове helper()', why: 'print находится на верхнем уровне, а не внутри функции.' },
        { text: 'Возникнет ошибка, потому что print нельзя использовать в модуле', why: 'В модулях можно писать любой код; вопрос лишь в том, когда он выполняется.' },
      ],
      explanation: 'Чтобы такой код не срабатывал при импорте, поместите его под `if __name__ == "__main__":`.',
    },
    {
      id: 'py.modules.3',
      skill: 'py.modules',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите `top_chars(text, n)`: вернуть список из `n` самых частых символов в виде пар `(символ, количество)` (самые частые первыми; при равенстве — в порядке первого появления). Используйте `collections.Counter`.',
      starter: py`from collections import Counter

def top_chars(text, n):
    pass
`,
      solution: py`from collections import Counter

def top_chars(text, n):
    return Counter(text).most_common(n)
`,
      tests: [
        { expr: 'top_chars("abracadabra", 2)', expect: '[("a", 5), ("b", 2)]' },
        { expr: 'top_chars("aab", 1)', expect: '[("a", 2)]' },
        { expr: 'top_chars("", 3)', expect: '[]', hidden: true, label: 'пустая строка' },
        { expr: 'top_chars("aab", 5)', expect: '[("a", 2), ("b", 1)]', hidden: true, label: 'n больше числа различных символов' },
        { expr: 'top_chars("ab", 0)', expect: '[]', hidden: true, label: 'n = 0' },
      ],
      hints: [
        'Какой класс из `collections` считает элементы?',
        'У `Counter` есть метод, который сразу возвращает самые частые элементы.',
        '`Counter(text).most_common(n)`; при равных счётчиках порядок — по первому появлению.',
      ],
      explanation: '`Counter` решает «подсчёт» одной строкой, а `most_common(n)` возвращает список пар (элемент, счётчик). Для n больше числа символов вернётся столько, сколько есть.',
    },
    {
      id: 'py.modules.4',
      skill: 'py.modules',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите `group_anagrams(words)`: вернуть словарь, где ключ — буквы слова в алфавитном порядке (строка), а значение — список слов с этим набором букв (в исходном порядке). Используйте `defaultdict(list)`, но верните обычный `dict`.',
      starter: py`from collections import defaultdict

def group_anagrams(words):
    pass
`,
      solution: py`from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        key = "".join(sorted(w))
        groups[key].append(w)
    return dict(groups)
`,
      tests: [
        { expr: 'group_anagrams(["eat", "tea", "tan"])', expect: '{"aet": ["eat", "tea"], "ant": ["tan"]}' },
        { expr: 'group_anagrams(["a"])', expect: '{"a": ["a"]}' },
        { expr: 'group_anagrams([])', expect: '{}', hidden: true, label: 'пустой список' },
        { expr: 'group_anagrams(["ab", "ba", "ab"])', expect: '{"ab": ["ab", "ba", "ab"]}', hidden: true, label: 'повторяющиеся слова' },
      ],
      hints: [
        'Как получить одинаковый ключ у слов «eat» и «tea»?',
        '`"".join(sorted(word))` сортирует буквы и склеивает их обратно.',
        'Для каждого слова: `groups[key].append(word)`; `defaultdict` сам создаст пустой список.',
      ],
      explanation: 'Отсортированные буквы — «подпись» анаграммы. `defaultdict(list)` избавляет от проверки наличия ключа; результат превращаем в обычный `dict`.',
    },
    {
      id: 'py.modules.5',
      skill: 'py.modules',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите `days_between(start, end)`: принимает две даты в формате `"ГГГГ-ММ-ДД"` и возвращает число дней от `start` до `end` (отрицательное, если `end` раньше).',
      starter: py`from datetime import date

def days_between(start, end):
    pass
`,
      solution: py`from datetime import date

def days_between(start, end):
    return (date.fromisoformat(end) - date.fromisoformat(start)).days
`,
      tests: [
        { expr: 'days_between("2024-01-01", "2024-03-01")', expect: '60' },
        { expr: 'days_between("2023-12-31", "2024-01-01")', expect: '1' },
        { expr: 'days_between("2024-05-05", "2024-05-05")', expect: '0', hidden: true, label: 'одна и та же дата' },
        { expr: 'days_between("2024-03-01", "2024-01-01")', expect: '-60', hidden: true, label: 'обратный порядок' },
        { expr: 'days_between("2024-02-28", "2024-03-01")', expect: '2', hidden: true, label: 'високосный год: есть 29 февраля' },
      ],
      hints: [
        'Как превратить строку «2024-03-01» в объект даты?',
        '`date.fromisoformat(text)` разбирает формат ГГГГ-ММ-ДД.',
        'Разность двух дат — `timedelta`; у него есть атрибут `.days`.',
      ],
      explanation: 'Вычитание объектов `date` даёт `timedelta`, а его атрибут `days` — целое число дней со знаком. Календарные тонкости (високосный год) библиотека учитывает сама.',
    },
    {
      id: 'py.modules.6',
      skill: 'py.modules',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'edge',
      prompt: 'Функция должна вернуть число дней в месяце, но ошибается для февраля. Исправьте — лучше с помощью стандартного модуля `calendar`.',
      buggy: py`def days_in_month(year, month):
    if month in (4, 6, 9, 11):
        return 30
    return 31
`,
      solution: py`import calendar

def days_in_month(year, month):
    return calendar.monthrange(year, month)[1]
`,
      tests: [
        { expr: 'days_in_month(2023, 1)', expect: '31' },
        { expr: 'days_in_month(2023, 4)', expect: '30' },
        { expr: 'days_in_month(2023, 2)', expect: '28', hidden: true, label: 'февраль невисокосного года' },
        { expr: 'days_in_month(2024, 2)', expect: '29', hidden: true, label: 'февраль високосного года' },
        { expr: 'days_in_month(1900, 2)', expect: '28', hidden: true, label: 'век, не кратный 400' },
      ],
      hints: [
        'Для какого месяца функция вернёт неверный результат всегда?',
        'Высчитывать правила високосных лет вручную не нужно — в стандартной библиотеке есть модуль `calendar`.',
        '`calendar.monthrange(year, month)` возвращает пару (день недели первого числа, число дней).',
      ],
      explanation: 'Февраль — граничный случай: 28 или 29 дней. `calendar.monthrange` знает правила високосных лет (включая 1900 и 2000), поэтому не нужно изобретать их заново.',
    },
    {
      id: 'py.modules.7',
      skill: 'py.modules',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа? (Конкретные «случайные» числа выводить не нужно — важна воспроизводимость.)',
      code: py`import random
from collections import Counter, defaultdict

random.seed(7)
a = [random.randint(1, 100) for _ in range(3)]
random.seed(7)
b = [random.randint(1, 100) for _ in range(3)]
print(a == b, len(a))

dd = defaultdict(list)
dd["x"].append(1)
print(dict(dd), Counter("aab")["z"])`,
      answer: "True 3\n{'x': [1]} 0",
      explanation: 'После одинакового `seed` последовательность повторяется, поэтому `a == b`. `defaultdict(list)` создаёт пустой список при первом обращении к ключу `"x"`. `Counter` для отсутствующего ключа возвращает 0 и не бросает KeyError.',
    },
    {
      id: 'py.modules.8',
      skill: 'py.modules',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите скрипт, который печатает `hello` при запуске, но безопасен для импорта (не печатает при `import`).',
      lines: [
        'def main():',
        '    print("hello")',
        'if __name__ == "__main__":',
        '    main()',
      ],
      distractors: ['if name == "main":', '    print(main)'],
      tests: [{ stdout: 'hello' }],
      explanation: 'Имена `__name__` и `"__main__"` пишутся с двойными подчёркиваниями. Условие истинно только при прямом запуске файла, поэтому при импорте функция `main()` не вызывается.',
    },
    {
      id: 'py.modules.9',
      skill: 'py.modules',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Зачем нужна проверка `if __name__ == "__main__":` и что произойдёт без неё, если другой файл импортирует ваш модуль?',
      code: py`def helper():
    return 42

main_result = helper() * 2
print("результат:", main_result)`,
      keyPoints: [
        'При импорте модуль выполняется целиком, включая код верхнего уровня',
        'При прямом запуске __name__ равен "__main__", при импорте — имени модуля',
        'Проверка отделяет «библиотечную» часть (функции) от «скриптовой» (запуск)',
      ],
      modelAnswer: 'Когда другой файл делает import, Python выполняет модуль целиком, поэтому print и любые вычисления верхнего уровня сработают при импорте — как побочный эффект. Переменная __name__ равна "__main__" только если файл запущен напрямую; при импорте она равна имени модуля. Если спрятать запуск под if __name__ == "__main__":, модуль можно и запускать как программу, и безопасно импортировать ради его функций и классов.',
      explanation: 'Это стандартный шаблон: функции — на верхнем уровне, запуск — под условием.',
    },
  ],
};
