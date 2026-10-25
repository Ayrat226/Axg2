import type { SkillModule } from '../../core/types';
import { c, js, md } from './_c';

export const classes: SkillModule = {
  skill: {
    id: 'js.classes',
    route: 'javascript',
    title: 'Классы и this',
    icon: '🏗️',
    summary: 'class, constructor, методы, геттеры, наследование и super, ловушки привязки this, static.',
    prereqs: ['js.objects', 'js.closures'],
    tier: 3,
    outcomes: [
      'Описываю сущности через class: constructor, методы, геттеры/сеттеры, static, приватные поля #',
      'Строю иерархии через extends и super и помню порядок: super() раньше обращения к this',
      'Понимаю, как определяется this при вызове метода, и умею чинить потерянный this (bind, стрелка, обёртка)',
      'Отличаю свойства экземпляра от свойств прототипа и статических членов',
    ],
    estMinutes: 40,
    lesson: {
      why: 'Классы — стандартный способ описывать сущности с состоянием и поведением; на них построены многие библиотеки и фреймворки. А потерянный `this` — самая частая ошибка в объектно-ориентированном JavaScript.',
      brief:
        '`class A { constructor() {…} method() {…} }` создаёт конструктор; экземпляры — `new A()`. `extends` + `super` — наследование. `get x()` — геттер (значение вычисляется при чтении), `static` — член класса, `#x` — приватное поле. `this` определяется **способом вызова**: `obj.method()` → `obj`, а оторванный метод `const f = obj.method; f()` теряет `this`.',
      standard: md(
        '**Класс** описывает шаблон объектов. Метод `constructor` вызывается при `new` и заполняет поля; остальные методы лежат на прототипе и общие для всех экземпляров:',
        js`
          class Point {
            constructor(x, y) {
              this.x = x;
              this.y = y;
            }
            length() {
              return Math.hypot(this.x, this.y);
            }
          }
          const p = new Point(3, 4);
          console.log(p, p.length());   // Point { x: 3, y: 4 } 5
        `,
        '**Геттеры и сеттеры** выглядят как свойства, но выполняют код: `get area() { return … }`, использование — `shape.area` (без скобок). **Статические члены** принадлежат классу, а не экземплярам: `static create() {}`, вызов — `Class.create()`. **Приватные поля** `#balance` доступны только внутри тела класса.',
        '**Наследование.** `class Dog extends Animal` берёт поля и методы родителя. В конструкторе потомка сначала нужно вызвать `super(…)`, и только затем можно использовать `this`. Через `super.method()` вызывается версия родителя:',
        js`
          class Animal {
            constructor(name) { this.name = name; }
            speak() { return this.name + " издаёт звук"; }
          }
          class Dog extends Animal {
            speak() { return super.speak() + ": гав"; }
          }
          console.log(new Dog("Рекс").speak());   // Рекс издаёт звук: гав
        `,
        '**Как определяется `this`.** Это не свойство функции, а результат *способа вызова*:',
        '- `obj.method()` — `this` равен `obj`;\n- `const f = obj.method; f()` — `this` не определён (`undefined` в строгом режиме и в классах), поэтому `this.name` бросает `TypeError`;\n- `new Class()` — `this` — новый объект;\n- стрелочная функция не имеет своего `this`: берёт его из места определения.',
        '**Починка потерянного `this`:** обёртка `() => obj.method()`, `obj.method.bind(obj)` или стрелочная функция как поле класса (`handle = () => { … }`).',
        '**Классы не «работают до объявления», как функции.** Привязка класса поднимается, но остаётся в TDZ: использовать класс до строки объявления нельзя. Вызов `Point()` без `new` — `TypeError`.',
      ),
      deep: md(
        '**Классы и прототипы.** `class` создаёт конструктор, а обычные методы кладёт в `Class.prototype`. Но класс — не просто «сахар»: его нельзя вызвать без `new`, до объявления он находится в TDZ, тело класса выполняется в строгом режиме, а приватные поля `#x` недоступны снаружи. Поиск метода идёт по цепочке: экземпляр → `Class.prototype` → родительский прототип → … → `Object.prototype`. `instanceof` проверяет, есть ли `Class.prototype` в этой цепочке.',
        '**Поля класса.** Запись `count = 0;` в теле класса создаёт поле у **каждого экземпляра** при создании. Методы же общие, на прототипе. Поэтому изменяемое состояние (массивы, объекты) нельзя помещать на прототип — оно будет общим для всех.',
        '**Приватность.** Поля `#x` — настоящая приватность на уровне языка (нельзя прочитать снаружи даже через рефлексию). Соглашение `_x` — лишь договорённость, ничего не защищает. Проверка наличия приватного поля: `#x in obj`.',
        '**Порядок в конструкторе потомка.** Объект создаёт базовый конструктор; поэтому до `super()` `this` не существует (ReferenceError: Must call super constructor…). Если у потомка нет конструктора, используется неявный `constructor(...args) { super(...args); }`.',
        '**`static` и наследование.** Статические члены наследуются потомками (`Dog.create === Animal.create`); внутри статического метода `this` — это тот класс, на котором вызвали (`new this(...)` создаст `Dog`, если вызвали `Dog.create()`).',
        '**Композиция вместо наследования.** Глубокие иерархии хрупки. Часто лучше собрать поведение из небольших объектов или функций («has-a» вместо «is-a»). Наследуйте, когда отношение «является» действительно верно и API родителя подходит потомку.',
        '**`toString`, `Symbol.toPrimitive`, `toJSON`.** Классы могут настраивать, как их экземпляры превращаются в строки и JSON: `JSON.stringify` вызывает `toJSON()`, если он есть.',
        '**Геттеры в выводе.** Геттеры и методы лежат на прототипе и не попадают в `Object.keys` и `console.log` экземпляра: в логе вы увидите только собственные публичные поля (приватные `#x` не показываются).',
      ),
      analogy:
        'Класс — чертёж, экземпляры — дома, построенные по нему. `this` — слово «этот дом»: оно значит то, у кого вы позвонили в дверь (`house.open()`), а не то, что написано в чертеже.',
      example: {
        lang: 'javascript',
        code: c`
          class Account {
            #balance = 0;
            static count = 0;
            constructor(owner) {
              this.owner = owner;
              Account.count++;
            }
            deposit(sum) {
              this.#balance += sum;
              return this;
            }
            get balance() {
              return this.#balance;
            }
          }
          class Savings extends Account {
            constructor(owner, rate) {
              super(owner);
              this.rate = rate;
            }
            addInterest() {
              return this.deposit(this.balance * this.rate);
            }
          }
          const s = new Savings("Аня", 0.1);
          s.deposit(100).addInterest();
          console.log(s.balance, s.owner, Account.count);
          console.log(s);
        `,
        steps: [
          '`#balance` — приватное поле: его не прочитать снаружи, доступ — только через геттер `balance`.',
          '`static count` хранится в самом классе и считает созданные счета.',
          '`Savings` расширяет `Account`: сначала `super(owner)`, затем собственное поле `rate`.',
          '`deposit` возвращает `this`, поэтому вызовы можно объединять в цепочку: `deposit(100).addInterest()`.',
          'В `console.log(s)` видны только собственные поля экземпляра; приватные поля, геттеры и методы не показываются.',
        ],
        output: c`
          110 Аня 1
          Savings { owner: 'Аня', rate: 0.1 }
        `,
      },
      counterexample: {
        lang: 'javascript',
        code: c`
          class User {
            constructor(name) { this.name = name; }
            hi() { return "Привет, " + this.name; }
          }
          const u = new User("Аня");
          const f = u.hi;
          f();   // TypeError: Cannot read properties of undefined (reading 'name')
        `,
        explain: 'Метод оторван от объекта, и при вызове `f()` `this` не определён. Передавайте `() => u.hi()` или `u.hi.bind(u)`.',
      },
      pitfalls: [
        'Передать метод как колбэк (`setTimeout(obj.method)`, `arr.map(obj.method)`) — `this` потеряется.',
        'Обратиться к `this` в конструкторе потомка до вызова `super()` — ReferenceError.',
        'Вызвать класс без `new` — TypeError: Class constructor cannot be invoked without \'new\'.',
        'Считать `_name` приватным: соглашение с подчёркиванием ничего не защищает; для приватности используйте `#name`.',
        'Класть изменяемое состояние (массив/объект) на прототип — оно будет общим для всех экземпляров.',
        'Использовать стрелочную функцию как метод прототипа ожидая `this` экземпляра — у стрелки `this` лексический.',
      ],
      sources: [
        { title: 'MDN — Classes', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes' },
        { title: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' },
        { title: 'MDN — Private elements', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements' },
        { title: 'MDN — extends', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends' },
        { title: 'MDN — Inheritance and the prototype chain', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain' },
      ],
    },
    misconceptions: [
      {
        id: 'this-is-bound',
        title: 'Метод всегда помнит свой объект (this привязан к классу)',
        explanation: '`this` определяется способом вызова. У оторванного метода (`const f = obj.method; f()`) `this` не определён.',
        fix: 'Привяжите явно: `bind`, стрелочная обёртка или стрелочное поле класса.',
      },
      {
        id: 'class-hoisted',
        title: 'Классы можно использовать до объявления, как функции',
        explanation: 'Объявление `class` не поднимается как `function`: до его строки имя находится в TDZ.',
        fix: 'Объявляйте классы до использования.',
      },
      {
        id: 'underscore-private',
        title: 'Имя с подчёркиванием делает поле приватным',
        explanation: '`_x` — только договорённость. Поле остаётся общедоступным.',
        fix: 'Для настоящей приватности используйте `#x`.',
      },
      {
        id: 'static-on-instance',
        title: 'static-методы вызываются у экземпляра',
        explanation: 'Статические члены принадлежат классу: `Class.method()`, а у экземпляра их нет (`obj.method` — `undefined`).',
        fix: 'Вызывайте через класс; для методов экземпляра не используйте `static`.',
      },
      {
        id: 'this-before-super',
        title: 'В конструкторе потомка this можно использовать сразу',
        explanation: 'До вызова `super()` объект ещё не создан: обращение к `this` даёт ReferenceError.',
        fix: 'Вызывайте `super(...)` до любого обращения к `this` (обычно — первой строкой).',
      },
    ],
  },
  exercises: [
    {
      id: 'js.classes.1',
      skill: 'js.classes',
      kind: 'predict',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что выведет программа?',
      code: c`
        class Point {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
        }
        const p = new Point(1, 2);
        console.log(p, p instanceof Point, typeof Point);
      `,
      answer: 'Point { x: 1, y: 2 } true function',
      explanation: '`new Point(1, 2)` создаёт объект с полями `x` и `y`. Класс в JavaScript — это функция, поэтому `typeof Point` равен "function".',
    },
    {
      id: 'js.classes.2',
      skill: 'js.classes',
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt: 'Что произойдёт при выполнении кода?',
      code: c`
        class User {
          constructor(name) { this.name = name; }
          hi() { return "Привет, " + this.name; }
        }
        const u = new User("Аня");
        const f = u.hi;
        f();
      `,
      options: [
        { text: 'TypeError: Cannot read properties of undefined (reading \'name\')', correct: true, why: 'Метод оторван от объекта: `this` при вызове `f()` не определён.' },
        { text: 'Вернёт "Привет, Аня"', why: 'Так было бы при `u.hi()`. Здесь `this` не передаётся.', misconception: 'this-is-bound' },
        { text: 'Вернёт "Привет, undefined"', why: 'Так было бы, если бы `this` указывал на пустой объект. Вызов `f()` идёт без объекта слева от точки, а в классах (строгий режим) `this` в таком вызове — `undefined`, и чтение `.name` падает.', misconception: 'this-is-bound' },
        { text: 'ReferenceError: f is not defined', why: '`f` объявлена и содержит функцию.' },
      ],
      explanation: '`this` определяется способом вызова. Вызов `f()` — без объекта слева от точки, значит `this` — `undefined`, и обращение к `.name` бросает TypeError.',
    },
    {
      id: 'js.classes.3',
      skill: 'js.classes',
      kind: 'predict',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Что выведет программа? Обратите внимание на `super`, геттер и `static`.',
      code: c`
        class Animal {
          constructor(name) { this.name = name; }
          speak() { return \`\${this.name} издаёт звук\`; }
          static create(name) { return new this(name); }
        }
        class Dog extends Animal {
          speak() { return super.speak() + ": гав"; }
          get title() { return "пёс " + this.name; }
        }
        const d = Dog.create("Рекс");
        console.log(d.speak());
        console.log(d.title, d instanceof Animal, d.constructor.name);
      `,
      answer: c`
        Рекс издаёт звук: гав
        пёс Рекс true Dog
      `,
      explanation: 'В статическом методе `this` — класс, на котором вызвали (`Dog`), поэтому создаётся `Dog`. `super.speak()` вызывает метод родителя, геттер читается без скобок.',
    },
    {
      id: 'js.classes.4',
      skill: 'js.classes',
      kind: 'code',
      difficulty: 1,
      diag: true,
      lang: 'javascript',
      prompt:
        'Опишите класс `Rectangle` с конструктором `(width, height)`, геттером `area` (площадь) и методом `perimeter()` (периметр).',
      starter: c`
        class Rectangle {
          // ваш код
        }
      `,
      solution: c`
        class Rectangle {
          constructor(width, height) {
            this.width = width;
            this.height = height;
          }
          get area() {
            return this.width * this.height;
          }
          perimeter() {
            return 2 * (this.width + this.height);
          }
        }
      `,
      tests: [
        { expr: 'new Rectangle(3, 4).area', expect: '12' },
        { expr: 'new Rectangle(2, 5).perimeter()', expect: '14' },
        { expr: 'new Rectangle(0, 5).area', expect: '0', hidden: true, label: 'нулевая сторона' },
        { expr: '(() => { const r = new Rectangle(1, 2); r.width = 10; return r.area; })()', expect: '20', hidden: true, label: 'геттер учитывает изменённое поле' },
      ],
      hints: [
        'Где в классе записываются начальные значения полей?',
        'В `constructor` сохраните аргументы в `this.width` и `this.height`.',
        'Геттер объявляется как `get area() { … }`, а вызывается без скобок.',
      ],
      explanation: '`area` — геттер (свойство-аксессор): значение считается при каждом обращении, поэтому всегда актуально.',
    },
    {
      id: 'js.classes.5',
      skill: 'js.classes',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Опишите класс `Stack` с методами `push(x)`, `pop()` (удаляет и возвращает последний элемент или `undefined`, если стек пуст), `peek()` (возвращает последний элемент без удаления или `undefined`, если стек пуст) и геттером `size` (количество элементов). `push(x)` ничего не возвращает.',
      starter: c`
        class Stack {
          // ваш код
        }
      `,
      solution: c`
        class Stack {
          #items = [];
          push(x) {
            this.#items.push(x);
          }
          pop() {
            return this.#items.pop();
          }
          peek() {
            return this.#items[this.#items.length - 1];
          }
          get size() {
            return this.#items.length;
          }
        }
      `,
      tests: [
        { expr: '(() => { const s = new Stack(); s.push(1); s.push(2); return [s.pop(), s.size]; })()', expect: '[2, 1]' },
        { expr: '(() => { const s = new Stack(); s.push("a"); return s.peek(); })()', expect: '"a"' },
        { expr: 'new Stack().pop()', expect: 'undefined', hidden: true, label: 'pop на пустом стеке' },
        { expr: 'new Stack().size', expect: '0', hidden: true, label: 'размер нового стека' },
        { expr: '(() => { const a = new Stack(), b = new Stack(); a.push(1); return b.size; })()', expect: '0', hidden: true, label: 'экземпляры не делят данные' },
        { expr: '(() => { const s = new Stack(); s.push(5); s.peek(); return s.size; })()', expect: '1', hidden: true, label: 'peek не удаляет элемент' },
      ],
      hints: [
        'Где хранить элементы? Они должны быть у каждого экземпляра свои.',
        'Заведите поле-массив (например, `#items = []`) и используйте методы массива.',
        '`peek` — это последний элемент без удаления: `this.#items[this.#items.length - 1]`.',
      ],
      explanation: 'Поле класса создаётся для каждого экземпляра отдельно, поэтому стеки независимы. Приватное поле `#items` скрывает реализацию.',
    },
    {
      id: 'js.classes.6',
      skill: 'js.classes',
      kind: 'code',
      difficulty: 2,
      lang: 'javascript',
      prompt:
        'Допишите класс `Cat`: он наследует `Animal`, имеет поле `lives`: конструктор `Cat(name, lives = 9)` — если `lives` не передан, используется 9 и метод `speak()`, который возвращает то, что вернул бы `Animal`, плюс `", мяу"`.',
      starter: c`
        class Animal {
          constructor(name) { this.name = name; }
          speak() { return this.name + " издаёт звук"; }
        }
        class Cat extends Animal {
          // ваш код
        }
      `,
      solution: c`
        class Animal {
          constructor(name) { this.name = name; }
          speak() { return this.name + " издаёт звук"; }
        }
        class Cat extends Animal {
          constructor(name, lives = 9) {
            super(name);
            this.lives = lives;
          }
          speak() {
            return super.speak() + ", мяу";
          }
        }
      `,
      tests: [
        { expr: 'new Cat("Мурка").speak()', expect: '"Мурка издаёт звук, мяу"' },
        { expr: 'new Cat("М").lives', expect: '9' },
        { expr: 'new Cat("М", 3).lives', expect: '3', hidden: true, label: 'явно заданное число жизней' },
        { expr: 'new Cat("Т").name', expect: '"Т"', hidden: true, label: 'имя передано родителю' },
        { expr: 'new Cat("Т") instanceof Animal', expect: 'true', hidden: true, label: 'Cat — это Animal' },
      ],
      hints: [
        'В конструкторе потомка что нужно вызвать первым делом?',
        '`super(name)` передаёт имя родительскому конструктору; затем можно использовать `this`.',
        'В `speak` вызовите `super.speak()` и добавьте `", мяу"`.',
      ],
      explanation: '`super(name)` инициализирует поля родителя, а `super.speak()` вызывает родительскую версию метода, расширяя её поведение.',
    },
    {
      id: 'js.classes.7',
      skill: 'js.classes',
      kind: 'fix',
      difficulty: 2,
      lang: 'javascript',
      bugType: 'runtime',
      prompt:
        '`useCounter(n)` должна увеличить счётчик `n` раз через вспомогательную `repeat` и вернуть итог. Сейчас падает с TypeError. Исправьте, не меняя классы и `repeat`.',
      buggy: c`
        class Counter {
          constructor() { this.count = 0; }
          inc() { this.count++; }
        }
        function repeat(n, fn) {
          for (let i = 0; i < n; i++) fn();
        }
        function useCounter(n) {
          const c = new Counter();
          repeat(n, c.inc);
          return c.count;
        }
      `,
      solution: c`
        class Counter {
          constructor() { this.count = 0; }
          inc() { this.count++; }
        }
        function repeat(n, fn) {
          for (let i = 0; i < n; i++) fn();
        }
        function useCounter(n) {
          const c = new Counter();
          repeat(n, () => c.inc());
          return c.count;
        }
      `,
      tests: [
        { expr: 'useCounter(3)', expect: '3' },
        { expr: 'useCounter(1)', expect: '1' },
        { expr: 'useCounter(0)', expect: '0', hidden: true, label: 'ноль повторов' },
        { expr: 'useCounter(10)', expect: '10', hidden: true, label: 'много повторов' },
      ],
      hints: [
        'Чему равен `this` внутри `inc`, когда её вызывают как `fn()`?',
        'Передавая `c.inc`, вы передаёте функцию без объекта `c`.',
        'Передайте обёртку `() => c.inc()` или `c.inc.bind(c)`.',
      ],
      explanation: '`repeat` вызывает `fn()` без объекта слева от точки, поэтому `this` в `inc` не определён. Обёртка-стрелка вызывает метод именно на `c`.',
    },
    {
      id: 'js.classes.8',
      skill: 'js.classes',
      kind: 'fix',
      difficulty: 3,
      lang: 'javascript',
      bugType: 'runtime',
      prompt: 'Создание `new Item(1, "A")` падает с ReferenceError про `super`. Исправьте конструктор `Item`.',
      buggy: c`
        class Base {
          constructor(id) { this.id = id; }
        }
        class Item extends Base {
          constructor(id, title) {
            this.title = title;
            super(id);
          }
        }
      `,
      solution: c`
        class Base {
          constructor(id) { this.id = id; }
        }
        class Item extends Base {
          constructor(id, title) {
            super(id);
            this.title = title;
          }
        }
      `,
      tests: [
        { expr: 'new Item(1, "A").id', expect: '1' },
        { expr: 'new Item(1, "A").title', expect: '"A"' },
        { expr: 'new Item(2, "B") instanceof Base', expect: 'true', hidden: true, label: 'Item — наследник Base' },
        { expr: 'Object.keys(new Item(3, "C"))', expect: '["id", "title"]', hidden: true, label: 'поля id и title' },
      ],
      hints: [
        'Прочитайте сообщение: что нужно сделать до обращения к `this` в производном классе?',
        'Объект создаёт родительский конструктор — он вызывается через `super(...)`.',
        'Поставьте `super(id)` первой строкой, затем `this.title = title`.',
      ],
      explanation: 'В производном классе `this` появляется только после `super(...)`. Порядок полей тоже меняется: `id` создаётся родителем, затем добавляется `title`.',
    },
    {
      id: 'js.classes.9',
      skill: 'js.classes',
      kind: 'parsons',
      difficulty: 2,
      lang: 'javascript',
      prompt: 'Соберите класс `Temperature` с геттером `fahrenheit` и статической фабрикой `fromFahrenheit`, затем выведите результаты.',
      lines: [
        'class Temperature {',
        '  constructor(celsius) {',
        '    this.celsius = celsius;',
        '  }',
        '  get fahrenheit() {',
        '    return this.celsius * 9 / 5 + 32;',
        '  }',
        '  static fromFahrenheit(f) {',
        '    return new Temperature((f - 32) * 5 / 9);',
        '  }',
        '}',
        'console.log(Temperature.fromFahrenheit(212).celsius, new Temperature(100).fahrenheit);',
      ],
      distractors: ['  fahrenheit() {', '    return Temperature((f - 32) * 5 / 9);'],
      tests: [{ stdout: '100 212' }],
      explanation: 'Геттер объявляется с `get` и читается без скобок. Статическая фабрика вызывается на классе и создаёт экземпляр через `new` — без `new` класс вызвать нельзя.',
    },
    {
      id: 'js.classes.10',
      skill: 'js.classes',
      kind: 'explain',
      difficulty: 3,
      lang: 'javascript',
      prompt: 'Почему метод, сохранённый в переменной или переданный как колбэк, «теряет» `this`? Как определяется `this` и какими способами это чинят?',
      code: c`
        const f = user.hi;
        f();
      `,
      keyPoints: [
        '`this` определяется способом вызова, а не местом объявления метода',
        'Вызов `obj.method()` задаёт `this = obj`, а `f()` — нет',
        'Решения: стрелочная обёртка, `bind`, стрелочное поле класса',
        'Стрелочные функции берут `this` из окружения, где определены',
      ],
      modelAnswer:
        'В JavaScript `this` — не свойство функции, а результат способа вызова. При `obj.method()` объект слева от точки становится `this`. Если метод передать как колбэк или записать в переменную (`const f = obj.method`), вызов `f()` идёт без объекта, и `this` не определён (в классах — `undefined`). Это чинят стрелочной обёрткой `() => obj.method()`, привязкой `obj.method.bind(obj)` или определением метода как стрелочного поля класса. Стрелочные функции не имеют собственного `this` и берут его из места определения.',
      explanation: 'Правило «смотри на то, что слева от точки при вызове» объясняет большинство ошибок с `this`.',
    },
  ],
};
