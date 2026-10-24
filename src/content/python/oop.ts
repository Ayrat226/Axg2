import type { SkillModule } from '../../core/types';
import { md, py } from './_h';

export const oop: SkillModule = {
  skill: {
    id: 'py.oop',
    route: 'python',
    title: 'Классы и объекты',
    icon: '🏗️',
    summary: 'Классы, __init__, методы, атрибуты, __str__/__repr__, наследование и dataclasses.',
    prereqs: ['py.functions', 'py.dicts'],
    tier: 3,
    outcomes: [
      'Определяю классы с __init__, атрибутами и методами и понимаю роль self',
      'Различаю атрибуты экземпляра и атрибуты класса и знаю ловушку с изменяемым атрибутом класса',
      'Реализую __str__ и __repr__ и знаю, где используется каждый',
      'Строю иерархии через наследование и super() и упрощаю простые классы через @dataclass',
    ],
    estMinutes: 40,
    lesson: {
      why: 'Классы объединяют данные и поведение в одну сущность: пользователь, заказ, игровой персонаж. Почти все библиотеки Python устроены вокруг классов.',
      brief: md`§class§ описывает тип, §Класс(...)§ создаёт экземпляр и вызывает §__init__§. Первый параметр методов — §self§ (сам объект). Атрибуты экземпляра задают через §self.x = ...§. §__str__§ — для людей (§print§), §__repr__§ — для разработчиков. Наследование: §class B(A)§ и §super()§. §@dataclass§ генерирует §__init__§, §__repr__§, §__eq__§.`,
      standard: md`**Класс и экземпляр.** Класс — чертёж, экземпляр (объект) — конкретная вещь по чертежу:

§§§python
class Rectangle:
    def __init__(self, width, height):
        self.width = width        # атрибуты экземпляра
        self.height = height

    def area(self):
        return self.width * self.height

r = Rectangle(3, 4)
print(r.area())    # 12
§§§

При вызове §Rectangle(3, 4)§ Python создаёт пустой объект и вызывает §__init__(объект, 3, 4)§. Первый параметр §self§ — **сам объект**, его нужно писать в каждом методе; при вызове §r.area()§ Python подставляет §r§ автоматически. Без §self§ в определении метода получите TypeError (метод принял на один аргумент больше).

**Атрибуты класса и экземпляра.** Атрибут, объявленный в теле класса, общий для всех экземпляров:

§§§python
class Cart:
    items = []                 # ЛОВУШКА: общий список для всех корзин
    def __init__(self):
        self.owner = None      # у каждого экземпляра своё значение
§§§

Изменяемые данные (списки, словари) создавайте в §__init__§, иначе они будут общими.

**Строковое представление.** §__str__§ вызывается в §print(obj)§ и §str(obj)§ — «красивый» текст для пользователя. §__repr__§ используется в консоли, в списках (§print([obj])§) и отладке — по возможности однозначный текст вроде §Account('Аня', 100)§. Если нет §__str__§, Python использует §__repr__§.

**Наследование.** Дочерний класс получает всё от родителя и может переопределять методы. §super()§ обращается к родительской версии:

§§§python
class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name)    # иначе родительский __init__ не вызовется
        self.tricks = []
§§§

**dataclass** убирает шаблонный код для «классов-записей»:

§§§python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0

print(Point(1))        # Point(x=1, y=0)
print(Point(1) == Point(1, 0))   # True
§§§`,
      deep: md`**Всё — объекты.** Классы тоже объекты: §type(r)§ — это §Rectangle§, а §type(Rectangle)§ — §type§. Атрибуты хранятся в словаре §r.__dict__§; методы — функции в §Rectangle.__dict__§, которые при доступе через экземпляр «привязываются» к нему (bound method).

**Поиск атрибута.** §obj.x§ ищет в экземпляре, затем в классе, затем в родителях по порядку **MRO** (§Class.__mro__§). Присваивание §obj.x = 1§ **всегда** создаёт атрибут в экземпляре, а не меняет атрибут класса, — поэтому §self.count += 1§ для числа создаёт экземплярный атрибут, а §self.items.append()§ изменяет общий список класса.

**Специальные методы (dunder).** §__eq__§ (равенство), §__lt__§ (сортировка), §__len__§, §__iter__§, §__getitem__§, §__add__§ и др. позволяют объектам вести себя как встроенные типы. Если определить §__eq__§ без §__hash__§, объект станет нехэшируемым.

**property.** Декоратор §@property§ превращает метод в «вычисляемый атрибут» (§r.area§ без скобок) и позволяет позже добавить проверку без изменения интерфейса. Приватность в Python — соглашение: §_name§ — «внутреннее», §__name§ — искажение имени (name mangling).

**dataclass подробнее.** Генерирует §__init__§, §__repr__§, §__eq__§; параметры §frozen=True§ (неизменяемость и хэшируемость), §order=True§ (сравнения). Изменяемое значение по умолчанию задаётся через §field(default_factory=list)§ — прямое §= []§ запрещено (ValueError), чтобы не повторить ловушку общего атрибута.

**Композиция против наследования.** Наследование выражает «является» (Собака — это Животное), композиция — «содержит» (Машина содержит Двигатель). Глубокие иерархии хрупки: часто достаточно композиции и обычных функций. §isinstance(obj, Cls)§ учитывает наследников, а §type(obj) is Cls§ — нет.

**§__slots__§** фиксирует набор атрибутов и экономит память при миллионах объектов.`,
      analogy: 'Класс — это чертёж дома, экземпляр — построенный по нему дом. Атрибуты экземпляра — мебель в конкретном доме, атрибут класса — табличка в чертеже, общая для всех домов. Наследование — «такой же дом, но с мансардой».',
      example: {
        lang: 'python',
        code: py`class Account:
    bank = "LearnBank"

    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self

    def __str__(self):
        return f"{self.owner}: {self.balance}"

    def __repr__(self):
        return f"Account({self.owner!r}, {self.balance})"

class Savings(Account):
    def __init__(self, owner, balance=0, rate=0.05):
        super().__init__(owner, balance)
        self.rate = rate

    def add_interest(self):
        self.balance += self.balance * self.rate
        return self

a = Account("Аня").deposit(100)
s = Savings("Боб", 200).add_interest()
print(a)
print(repr(s))
print([a])
print(isinstance(s, Account), Account.bank, s.bank)`,
        steps: [
          '§Account("Аня")§ создаёт объект и вызывает §__init__§: заполняются атрибуты экземпляра §owner§ и §balance§ (по умолчанию 0).',
          '§deposit§ изменяет §self.balance§ и возвращает §self§, поэтому вызовы можно объединять в цепочку.',
          '§print(a)§ использует §__str__§ («Аня: 100»), а §repr(s)§ и вывод списка — §__repr__§; §Savings§ унаследовал оба метода.',
          '§super().__init__(owner, balance)§ запускает родительскую инициализацию; без неё у Savings не было бы §owner§ и §balance§. 200 + 200 × 0.05 = 210.0.',
          '§bank§ — атрибут класса: он общий и доступен и через класс, и через любой экземпляр, включая экземпляр наследника.',
        ].map((s) => s.replace(/§/g, '`')),
        output: "Аня: 100\nAccount('Боб', 210.0)\n[Account('Аня', 100)]\nTrue LearnBank LearnBank",
      },
      counterexample: {
        lang: 'python',
        code: py`class Team:
    members = []              # общий для всех команд!
    def add(self, name):
        self.members.append(name)

a, b = Team(), Team()
a.add("Аня")
print(b.members)              # ['Аня'] — чужой участник!`,
        explain: 'Список создан один раз в теле класса и принадлежит классу. Все экземпляры используют его совместно. Создавайте изменяемые атрибуты в __init__: self.members = [].',
      },
      pitfalls: [
        md`Забыть §self§ первым параметром метода: вызов упадёт с TypeError (передан лишний аргумент).`,
        md`Создавать изменяемый атрибут (список, словарь) в теле класса: он будет общим для всех экземпляров.`,
        md`Не вызвать §super().__init__(...)§ в дочернем классе: атрибуты родителя не появятся (AttributeError).`,
        md`Обращаться к атрибуту без §self.§ внутри метода: §balance§ — это локальная переменная/NameError, а не поле объекта.`,
      ],
      sources: [
        { title: 'Python Tutorial — Classes', url: 'https://docs.python.org/3/tutorial/classes.html' },
        { title: 'Data Model — special method names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names' },
        { title: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html' },
        { title: 'Python Tutorial — Inheritance', url: 'https://docs.python.org/3/tutorial/classes.html#inheritance' },
      ],
    },
    misconceptions: [
      {
        id: 'forget-self',
        title: 'self можно не писать — Python сам поймёт, о каком объекте речь',
        explanation: 'Метод — это функция, первым аргументом которой Python подставляет экземпляр. В обычном методе экземпляра без параметра self вызов через объект не совпадёт с сигнатурой (TypeError: объект передаётся первым аргументом), а без префикса self. имена будут обычными локальными переменными. У @staticmethod self не нужен, у @classmethod первым параметром обычно идёт cls.',
        fix: 'Первым параметром обычного метода экземпляра пишите self, а поля объекта читайте и записывайте как self.поле.',
      },
      {
        id: 'class-attr-shared',
        title: 'Атрибут, объявленный в теле класса, у каждого экземпляра свой',
        explanation: 'Атрибуты класса общие. Изменяемый объект (список, словарь) в теле класса разделяется между всеми экземплярами.',
        fix: 'Создавайте изменяемые данные в __init__ через self.',
      },
      {
        id: 'super-automatic',
        title: 'Родительский __init__ вызывается автоматически',
        explanation: 'Если дочерний класс определяет свой __init__, родительский не вызывается сам. Атрибуты родителя не будут созданы.',
        fix: 'Вызывайте super().__init__(...) в начале дочернего __init__.',
      },
      {
        id: 'str-repr-same',
        title: '__str__ и __repr__ — одно и то же',
        explanation: '__str__ нужен для читаемого вывода пользователю (print), __repr__ — для однозначного представления в отладке и внутри контейнеров.',
        fix: 'Определите __repr__ всегда, а __str__ — при необходимости «красивого» вывода.',
      },
    ],
  },
  exercises: [
    {
      id: 'py.oop.1',
      skill: 'py.oop',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`class Counter:
    def __init__(self):
        self.n = 0

    def inc(self):
        self.n += 1
        return self

c = Counter()
c.inc().inc()
d = Counter()
print(c.n, d.n)`,
      answer: '2 0',
      explanation: '`inc` возвращает `self`, поэтому вызовы можно объединить в цепочку: `c.n` стало 2. У `d` собственный атрибут `n`, который остался равным 0.',
    },
    {
      id: 'py.oop.2',
      skill: 'py.oop',
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'python',
      prompt: 'Что выведет код?',
      code: py`class Cart:
    items = []

    def add(self, x):
        self.items.append(x)

a = Cart()
b = Cart()
a.add(1)
print(b.items)`,
      options: [
        { text: '[1]', correct: true, why: 'Список `items` принадлежит классу и общий для всех экземпляров.' },
        { text: '[]', why: 'Так было бы, если бы у каждой корзины был свой список, созданный в __init__.', misconception: 'class-attr-shared' },
        { text: 'AttributeError: у b нет items', why: 'Атрибуты класса доступны всем экземплярам через поиск по классу.' },
        { text: 'TypeError', why: 'Вызов add и обращение к items корректны, ошибки не будет.' },
      ],
      explanation: 'Чтобы у каждого экземпляра был свой список, создайте его в `__init__`: `self.items = []`.',
    },
    {
      id: 'py.oop.3',
      skill: 'py.oop',
      kind: 'code',
      difficulty: 1,
      lang: 'python',
      prompt: 'Напишите класс `Rectangle`: конструктор `Rectangle(width, height)` сохраняет размеры в атрибутах экземпляра `self.width` и `self.height`; методы `area()` (площадь) и `perimeter()` (периметр).',
      starter: py`class Rectangle:
    pass
`,
      solution: py`class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)
`,
      tests: [
        { expr: 'Rectangle(3, 4).area()', expect: '12' },
        { expr: 'Rectangle(3, 4).perimeter()', expect: '14' },
        { expr: 'Rectangle(0, 5).area()', expect: '0', hidden: true, label: 'нулевая ширина' },
        { expr: 'Rectangle(2.5, 2).area()', expect: '5.0', hidden: true, label: 'дробные размеры' },
        { expr: 'Rectangle(1, 1).perimeter()', expect: '4', hidden: true, label: 'квадрат 1×1' },
      ],
      hints: [
        'Что должно произойти при создании `Rectangle(3, 4)`? Какой метод для этого нужен?',
        'В `__init__` сохраните аргументы в `self.width` и `self.height`.',
        'В остальных методах обращайтесь к полям через `self.`, а не к голым именам.',
      ],
      explanation: '`__init__` сохраняет данные в экземпляре, а методы читают их через `self`. Один класс — любое число прямоугольников с разными размерами.',
    },
    {
      id: 'py.oop.4',
      skill: 'py.oop',
      kind: 'code',
      difficulty: 2,
      lang: 'python',
      prompt: 'Напишите класс `BankAccount`: `BankAccount(balance=0)`; методы `deposit(amount)` и `withdraw(amount)` изменяют баланс и **возвращают self** (для цепочек); если средств не хватает, `withdraw` ничего не меняет. `str(account)` должен давать `"Счёт: <баланс>"`.',
      starter: py`class BankAccount:
    pass
`,
      solution: py`class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount
        return self

    def __str__(self):
        return f"Счёт: {self.balance}"
`,
      tests: [
        { expr: 'BankAccount(100).deposit(50).balance', expect: '150' },
        { expr: 'BankAccount(100).withdraw(30).balance', expect: '70' },
        { expr: 'str(BankAccount(5))', expect: '"Счёт: 5"' },
        { expr: 'BankAccount().balance', expect: '0', hidden: true, label: 'баланс по умолчанию 0' },
        { expr: 'BankAccount(100).withdraw(500).balance', expect: '100', hidden: true, label: 'недостаточно средств — баланс не меняется' },
        { expr: 'BankAccount(100).deposit(50).withdraw(150).balance', expect: '0', hidden: true, label: 'цепочка: снять весь баланс' },
      ],
      hints: [
        'Какое значение параметра `balance` по умолчанию и где оно сохраняется?',
        'Чтобы поддержать цепочки `acc.deposit(1).withdraw(2)`, что должен возвращать каждый метод?',
        'В `withdraw` сначала проверьте `amount <= self.balance`; метод `__str__` вернёт f-строку с балансом.',
      ],
      explanation: 'Возврат `self` позволяет строить цепочки вызовов. Проверка в `withdraw` не даёт списать больше, чем есть на счёте (при неотрицательной сумме), а `__str__` задаёт текстовое представление для `print`/`str`.',
    },
    {
      id: 'py.oop.5',
      skill: 'py.oop',
      kind: 'code',
      difficulty: 3,
      lang: 'python',
      prompt: 'Дан базовый класс `Animal`. Напишите `Dog(Animal)` (звук `"Гав"`), `Cat(Animal)` (звук `"Мяу"`) и `Kitten(Cat)`, у которого имя автоматически превращается в `"<имя> (котёнок)"` (через `super().__init__`).',
      starter: py`class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name}: {self.speak()}"

# напишите Dog, Cat и Kitten
`,
      solution: py`class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name}: {self.speak()}"

class Dog(Animal):
    def speak(self):
        return "Гав"

class Cat(Animal):
    def speak(self):
        return "Мяу"

class Kitten(Cat):
    def __init__(self, name):
        super().__init__(name + " (котёнок)")
`,
      tests: [
        { expr: 'Dog("Рекс").describe()', expect: '"Рекс: Гав"' },
        { expr: 'Cat("Мурка").describe()', expect: '"Мурка: Мяу"' },
        { expr: 'Kitten("Пух").describe()', expect: '"Пух (котёнок): Мяу"' },
        { expr: 'Animal("Некто").describe()', expect: '"Некто: ..."', hidden: true, label: 'базовый класс работает как раньше' },
        { expr: 'isinstance(Kitten("К"), Animal)', expect: 'True', hidden: true, label: 'котёнок — тоже животное' },
      ],
      hints: [
        'Dog и Cat отличаются от Animal только одним методом. Нужен ли им собственный `__init__`?',
        'Переопределите `speak` в Dog и Cat; `describe` переиспользуется без изменений.',
        'У Kitten свой `__init__(self, name)`; передайте родителю изменённое имя: `super().__init__(name + " (котёнок)")`.',
      ],
      explanation: 'Дочерние классы переопределяют только то, что отличается. `describe` вызывает `self.speak()`, поэтому у каждого животного срабатывает его версия метода (полиморфизм). `super().__init__` передаёт управление родительской инициализации.',
    },
    {
      id: 'py.oop.6',
      skill: 'py.oop',
      kind: 'fix',
      difficulty: 2,
      lang: 'python',
      bugType: 'runtime',
      prompt: 'Метод `hello` падает с TypeError при вызове `Greeter("Аня").hello()`. Найдите ошибку и исправьте.',
      buggy: py`class Greeter:
    def __init__(self, name):
        self.name = name

    def hello():
        return f"Привет, {self.name}"
`,
      solution: py`class Greeter:
    def __init__(self, name):
        self.name = name

    def hello(self):
        return f"Привет, {self.name}"
`,
      tests: [
        { expr: 'Greeter("Аня").hello()', expect: '"Привет, Аня"' },
        { expr: 'Greeter("Боб").hello()', expect: '"Привет, Боб"' },
        { expr: 'Greeter("").hello()', expect: '"Привет, "', hidden: true, label: 'пустое имя' },
      ],
      hints: [
        'Прочитайте ошибку: сколько аргументов ожидает `hello` и сколько ему передали?',
        'При вызове `obj.hello()` Python подставляет объект первым аргументом.',
        'Добавьте параметр `self` в определение метода.',
      ],
      explanation: 'TypeError: hello() takes 0 positional arguments but 1 was given. Python неявно передаёт экземпляр первым аргументом, а в сигнатуре его нет. Параметр `self` также нужен, чтобы получить доступ к `self.name`.',
    },
    {
      id: 'py.oop.7',
      skill: 'py.oop',
      kind: 'predict',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что выведет программа?',
      code: py`from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0

p = Point(1)
print(p, p == Point(1, 0), p.x + p.y)

class A:
    def hi(self):
        return "A"

class B(A):
    def hi(self):
        return "B" + super().hi()

print(B().hi())`,
      answer: 'Point(x=1, y=0) True 1\nBA',
      explanation: '`@dataclass` сгенерировал `__init__` (с умолчанием y=0), `__repr__` («Point(x=1, y=0)») и `__eq__` (сравнение по полям). `B.hi` вызывает родительскую версию через `super()` и добавляет «B» перед её результатом «A».',
    },
    {
      id: 'py.oop.8',
      skill: 'py.oop',
      kind: 'parsons',
      difficulty: 2,
      lang: 'python',
      prompt: 'Соберите класс `Dog` с именем и методом `bark`, затем создайте экземпляр и выведите `Рекс гавкает`.',
      lines: [
        'class Dog:',
        '    def __init__(self, name):',
        '        self.name = name',
        '    def bark(self):',
        '        return self.name + " гавкает"',
        'print(Dog("Рекс").bark())',
      ],
      distractors: ['    def __init__(name):', '        name = name'],
      tests: [{ stdout: 'Рекс гавкает' }],
      explanation: 'В `__init__` обязателен `self` первым параметром, а поле нужно записать как `self.name = name`: просто `name = name` изменило бы только локальную переменную.',
    },
    {
      id: 'py.oop.9',
      skill: 'py.oop',
      kind: 'explain',
      difficulty: 3,
      lang: 'python',
      prompt: 'Что такое `self` и чем атрибут экземпляра отличается от атрибута класса? Почему `items = []` в теле класса — ловушка?',
      code: py`class Team:
    members = []
    def add(self, name):
        self.members.append(name)`,
      keyPoints: [
        'self — это сам экземпляр, который Python неявно передаёт первым аргументом метода',
        'Атрибуты экземпляра (self.x) у каждого объекта свои, атрибуты класса — общие',
        'Изменяемый атрибут класса (список) разделяется всеми экземплярами; его нужно создавать в __init__',
      ],
      modelAnswer: 'self — ссылка на текущий объект: при вызове team.add("Аня") Python передаёт team первым аргументом, поэтому метод может работать с данными именно этого объекта. Атрибуты, заданные через self, принадлежат экземпляру и у каждого свои, а атрибуты из тела класса общие для всех. Список members = [] создаётся один раз при определении класса, и append через любой экземпляр меняет этот единственный список, так что команды «видят» чужих участников. Правильно создавать self.members = [] в __init__.',
      explanation: 'Правило: данные экземпляра — в `__init__` через self; в теле класса — константы и общие настройки.',
    },
  ],
};
