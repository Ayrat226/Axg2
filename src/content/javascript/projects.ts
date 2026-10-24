import type { Project } from '../../core/types';
import { c } from './_c';

// ---------- Проект 1: корзина интернет-магазина ----------

const CART_ADD = c`
  // Корзина — массив объектов { name, price, qty }. Функции не меняют переданную корзину.
  function addItem(cart, name, price, qty = 1) {
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      return cart.map((item) => (item === existing ? { ...item, qty: item.qty + qty } : item));
    }
    return [...cart, { name, price, qty }];
  }
`;

const CART_SUBTOTAL = c`
  function removeItem(cart, name) {
    return cart.filter((item) => item.name !== name);
  }

  function subtotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
`;

const CART_PROMO = c`
  const PROMOS = {
    SAVE10: (total) => total * 0.9,
    MINUS500: (total) => Math.max(0, total - 500),
  };

  function applyPromo(total, code = "") {
    const key = code.trim().toUpperCase();
    return Object.hasOwn(PROMOS, key) ? Math.round(PROMOS[key](total)) : total;
  }
`;

const CART_CHECKOUT = c`
  const SHIPPING = 300;
  const FREE_SHIPPING_FROM = 3000;

  function checkout(cart, code = "") {
    const sum = subtotal(cart);
    const discounted = applyPromo(sum, code);
    const shipping = cart.length === 0 || discounted >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
    return { subtotal: sum, discount: sum - discounted, shipping, total: discounted + shipping };
  }
`;

const CART_RECEIPT = c`
  function row(label, amount) {
    return label.padEnd(14, ".") + String(amount).padStart(7) + " ₽";
  }

  function formatReceipt(cart, code = "") {
    const { discount, shipping, total } = checkout(cart, code);
    const lines = cart.map((item) => row(item.qty > 1 ? \`\${item.name} ×\${item.qty}\` : item.name, item.price * item.qty));
    if (discount > 0) lines.push(row("Скидка", -discount));
    if (shipping > 0) lines.push(row("Доставка", shipping));
    lines.push(row("ИТОГО", total));
    return lines.join("\\n");
  }

  const demo = [
    { name: "Ноутбук", price: 4000, qty: 1 },
    { name: "Мышь", price: 600, qty: 1 },
  ];
  console.log(formatReceipt(demo, "save10"));
`;

const cartProject: Project = {
  id: 'js.project.cart',
  route: 'javascript',
  title: 'Корзина интернет-магазина',
  summary: 'Построите неизменяемую корзину: добавление товаров, подсчёт суммы, промокоды, доставка и красиво отформатированный чек.',
  lang: 'javascript',
  prereqs: ['js.strings', 'js.arrays', 'js.objects', 'js.functions'],
  starter: c`
    // Корзина — массив объектов { name, price, qty }.
    // Пишите функции шаг за шагом; каждая должна возвращать новое значение, а не менять аргумент.
  `,
  steps: [
    {
      title: 'Добавление товаров',
      prompt:
        'Напишите `addItem(cart, name, price, qty = 1)`. Она возвращает **новую** корзину: если товар с таким названием уже есть — увеличивает его `qty`, иначе добавляет `{ name, price, qty }` в конец. Исходный массив менять нельзя.',
      tests: [
        { expr: 'addItem([], "Хлеб", 50)', expect: '[{ name: "Хлеб", price: 50, qty: 1 }]' },
        { expr: 'addItem([{ name: "Хлеб", price: 50, qty: 1 }], "Хлеб", 50, 2)', expect: '[{ name: "Хлеб", price: 50, qty: 3 }]' },
        { expr: 'addItem([{ name: "A", price: 1, qty: 1 }], "B", 2, 3).length', expect: '2', hidden: true, label: 'новый товар добавляется в конец' },
        { expr: '(() => { const cart = [{ name: "A", price: 1, qty: 1 }]; addItem(cart, "A", 1); return cart[0].qty; })()', expect: '1', hidden: true, label: 'исходная корзина не изменяется' },
      ],
      hints: [
        'Сначала найдите, есть ли уже такой товар (`find`).',
        'Для увеличения количества создайте копию объекта: `{ ...item, qty: item.qty + qty }`, и верните новый массив через `map`.',
        'Если товара нет — `[...cart, { name, price, qty }]`.',
      ],
      solution: CART_ADD,
    },
    {
      title: 'Удаление и сумма',
      prompt: 'Добавьте `removeItem(cart, name)` — корзина без товара с этим названием, и `subtotal(cart)` — сумму `price * qty` по всем позициям (для пустой корзины — 0).',
      tests: [
        { expr: 'subtotal([{ name: "A", price: 50, qty: 2 }, { name: "B", price: 30, qty: 1 }])', expect: '130' },
        { expr: 'removeItem([{ name: "A", price: 1, qty: 1 }, { name: "B", price: 2, qty: 1 }], "A")', expect: '[{ name: "B", price: 2, qty: 1 }]' },
        { expr: 'subtotal([])', expect: '0', hidden: true, label: 'пустая корзина (reduce с начальным значением)' },
        { expr: 'removeItem([{ name: "A", price: 1, qty: 1 }], "Z").length', expect: '1', hidden: true, label: 'удаление отсутствующего товара' },
      ],
      hints: [
        '`filter` оставляет элементы, для которых условие истинно.',
        '`reduce((sum, item) => sum + item.price * item.qty, 0)`',
      ],
      solution: [CART_ADD, CART_SUBTOTAL].join('\n\n'),
    },
    {
      title: 'Промокоды',
      prompt:
        'Напишите `applyPromo(total, code = "")`. Коды (без учёта регистра и пробелов по краям): `SAVE10` — скидка 10 % (результат округлить `Math.round`), `MINUS500` — минус 500, но не ниже 0. Неизвестный код — сумма без изменений.',
      tests: [
        { expr: 'applyPromo(1000, "SAVE10")', expect: '900' },
        { expr: 'applyPromo(300, "MINUS500")', expect: '0' },
        { expr: 'applyPromo(1000, "BAD")', expect: '1000' },
        { expr: 'applyPromo(1000, " save10 ")', expect: '900', hidden: true, label: 'регистр и пробелы в коде' },
        { expr: 'applyPromo(999, "SAVE10")', expect: '899', hidden: true, label: 'округление (899.1 → 899)' },
        { expr: 'applyPromo(100, "toString")', expect: '100', hidden: true, label: 'имя унаследованного свойства — не промокод' },
      ],
      hints: [
        'Храните промокоды в объекте «код → функция скидки».',
        'Нормализуйте код: `code.trim().toUpperCase()`.',
        'Проверяйте наличие кода через `Object.hasOwn(PROMOS, key)`, а не просто `PROMOS[key]`.',
      ],
      solution: [CART_ADD, CART_SUBTOTAL, CART_PROMO].join('\n\n'),
    },
    {
      title: 'Итог заказа и доставка',
      prompt:
        'Напишите `checkout(cart, code = "")`, возвращающую `{ subtotal, discount, shipping, total }`. Скидка — разница между суммой и суммой после промокода. Доставка 300 ₽, бесплатна, если сумма после скидки ≥ 3000 или корзина пуста.',
      tests: [
        { expr: 'checkout([{ name: "A", price: 1000, qty: 1 }], "SAVE10")', expect: '({ subtotal: 1000, discount: 100, shipping: 300, total: 1200 })' },
        { expr: 'checkout([{ name: "Ноутбук", price: 4000, qty: 1 }, { name: "Мышь", price: 600, qty: 1 }])', expect: '({ subtotal: 4600, discount: 0, shipping: 0, total: 4600 })' },
        { expr: 'checkout([])', expect: '({ subtotal: 0, discount: 0, shipping: 0, total: 0 })', hidden: true, label: 'пустая корзина — без доставки' },
        { expr: 'checkout([{ name: "A", price: 3200, qty: 1 }], "SAVE10").shipping', expect: '300', hidden: true, label: 'после скидки сумма ниже порога' },
        { expr: 'checkout([{ name: "A", price: 3000, qty: 1 }]).shipping', expect: '0', hidden: true, label: 'ровно на пороге — доставка бесплатна' },
      ],
      hints: [
        'Используйте уже написанные `subtotal` и `applyPromo`.',
        'Пороги вынесите в константы (`SHIPPING`, `FREE_SHIPPING_FROM`).',
        'Доставка проверяется по сумме **после** скидки.',
      ],
      solution: [CART_ADD, CART_SUBTOTAL, CART_PROMO, CART_CHECKOUT].join('\n\n'),
    },
    {
      title: 'Чек',
      prompt:
        'Напишите `formatReceipt(cart, code = "")`: по строке на товар (`Название ×qty` при qty > 1), затем при необходимости «Скидка» (отрицательная) и «Доставка», затем «ИТОГО». Строка: подпись, дополненная точками до 14 символов (`padEnd`), сумма, дополненная пробелами слева до 7 (`padStart`), и ` ₽`. В конце программы выведите чек для демонстрационной корзины.',
      tests: [
        {
          expr: 'formatReceipt([{ name: "Хлеб", price: 50, qty: 2 }, { name: "Молоко", price: 80, qty: 1 }])',
          expect: '"Хлеб ×2.......    100 ₽\\nМолоко........     80 ₽\\nДоставка......    300 ₽\\nИТОГО.........    480 ₽"',
        },
        {
          stdout: 'Ноутбук.......   4000 ₽\nМышь..........    600 ₽\nСкидка........   -460 ₽\nИТОГО.........   4140 ₽',
        },
        { expr: 'formatReceipt([])', expect: '"ИТОГО.........      0 ₽"', hidden: true, label: 'пустая корзина — только итог' },
        {
          expr: 'formatReceipt([{ name: "Ноутбук", price: 4000, qty: 1 }, { name: "Мышь", price: 600, qty: 1 }], "save10")',
          expect: '"Ноутбук.......   4000 ₽\\nМышь..........    600 ₽\\nСкидка........   -460 ₽\\nИТОГО.........   4140 ₽"',
          hidden: true,
          label: 'скидка отображается отрицательной суммой, доставка бесплатна',
        },
      ],
      hints: [
        'Заведите вспомогательную `row(label, amount)`: `label.padEnd(14, ".") + String(amount).padStart(7) + " ₽"`.',
        'Деструктурируйте `const { discount, shipping, total } = checkout(cart, code)`.',
        'Строки собирайте в массив и соедините через `join("\\n")`; «Скидка» и «Доставка» добавляйте только если они больше нуля.',
      ],
      solution: [CART_ADD, CART_SUBTOTAL, CART_PROMO, CART_CHECKOUT, CART_RECEIPT].join('\n\n'),
    },
  ],
};

// ---------- Проект 2: мини-библиотека задач ----------

const TODO_V1 = c`
  class TodoList {
    #tasks = [];
    #nextId = 1;

    add(title) {
      const text = String(title).trim();
      if (!text) throw new Error("Название не может быть пустым");
      const task = { id: this.#nextId++, title: text, done: false };
      this.#tasks.push(task);
      return { ...task };
    }

    list() {
      return this.#tasks.map((task) => ({ ...task }));
    }
  }
`;

const TODO_V2 = c`
  class TodoList {
    #tasks = [];
    #nextId = 1;

    add(title) {
      const text = String(title).trim();
      if (!text) throw new Error("Название не может быть пустым");
      const task = { id: this.#nextId++, title: text, done: false };
      this.#tasks.push(task);
      return { ...task };
    }

    toggle(id) {
      const task = this.#tasks.find((t) => t.id === id);
      if (!task) return false;
      task.done = !task.done;
      return true;
    }

    remove(id) {
      const index = this.#tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      this.#tasks.splice(index, 1);
      return true;
    }

    list() {
      return this.#tasks.map((task) => ({ ...task }));
    }
  }
`;

const TODO_V3 = c`
  class TodoList {
    #tasks = [];
    #nextId = 1;

    add(title) {
      const text = String(title).trim();
      if (!text) throw new Error("Название не может быть пустым");
      const task = { id: this.#nextId++, title: text, done: false };
      this.#tasks.push(task);
      return { ...task };
    }

    toggle(id) {
      const task = this.#tasks.find((t) => t.id === id);
      if (!task) return false;
      task.done = !task.done;
      return true;
    }

    remove(id) {
      const index = this.#tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      this.#tasks.splice(index, 1);
      return true;
    }

    list() {
      return this.#tasks.map((task) => ({ ...task }));
    }

    filter(mode = "all") {
      if (mode === "all") return this.list();
      if (mode === "active") return this.list().filter((t) => !t.done);
      if (mode === "done") return this.list().filter((t) => t.done);
      throw new RangeError(\`Неизвестный фильтр: \${mode}\`);
    }

    stats() {
      const done = this.#tasks.filter((t) => t.done).length;
      return { total: this.#tasks.length, done, active: this.#tasks.length - done };
    }
  }
`;

const TODO_V4 = c`
  class TodoList {
    #tasks = [];
    #nextId = 1;
    #history = [];

    #snapshot() {
      this.#history.push(this.#tasks.map((task) => ({ ...task })));
    }

    add(title) {
      const text = String(title).trim();
      if (!text) throw new Error("Название не может быть пустым");
      this.#snapshot();
      const task = { id: this.#nextId++, title: text, done: false };
      this.#tasks.push(task);
      return { ...task };
    }

    toggle(id) {
      const task = this.#tasks.find((t) => t.id === id);
      if (!task) return false;
      this.#snapshot();
      task.done = !task.done;
      return true;
    }

    remove(id) {
      const index = this.#tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      this.#snapshot();
      this.#tasks.splice(index, 1);
      return true;
    }

    undo() {
      const previous = this.#history.pop();
      if (!previous) return false;
      this.#tasks = previous;
      return true;
    }

    list() {
      return this.#tasks.map((task) => ({ ...task }));
    }

    filter(mode = "all") {
      if (mode === "all") return this.list();
      if (mode === "active") return this.list().filter((t) => !t.done);
      if (mode === "done") return this.list().filter((t) => t.done);
      throw new RangeError(\`Неизвестный фильтр: \${mode}\`);
    }

    stats() {
      const done = this.#tasks.filter((t) => t.done).length;
      return { total: this.#tasks.length, done, active: this.#tasks.length - done };
    }
  }
`;

const TODO_V5 = c`
  class TodoList {
    #tasks = [];
    #nextId = 1;
    #history = [];

    #snapshot() {
      this.#history.push(this.#tasks.map((task) => ({ ...task })));
    }

    add(title) {
      const text = String(title).trim();
      if (!text) throw new Error("Название не может быть пустым");
      this.#snapshot();
      const task = { id: this.#nextId++, title: text, done: false };
      this.#tasks.push(task);
      return { ...task };
    }

    toggle(id) {
      const task = this.#tasks.find((t) => t.id === id);
      if (!task) return false;
      this.#snapshot();
      task.done = !task.done;
      return true;
    }

    remove(id) {
      const index = this.#tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      this.#snapshot();
      this.#tasks.splice(index, 1);
      return true;
    }

    undo() {
      const previous = this.#history.pop();
      if (!previous) return false;
      this.#tasks = previous;
      return true;
    }

    list() {
      return this.#tasks.map((task) => ({ ...task }));
    }

    filter(mode = "all") {
      if (mode === "all") return this.list();
      if (mode === "active") return this.list().filter((t) => !t.done);
      if (mode === "done") return this.list().filter((t) => t.done);
      throw new RangeError(\`Неизвестный фильтр: \${mode}\`);
    }

    stats() {
      const done = this.#tasks.filter((t) => t.done).length;
      return { total: this.#tasks.length, done, active: this.#tasks.length - done };
    }

    save() {
      return JSON.stringify(this.#tasks);
    }

    static load(text) {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Некорректные данные");
      }
      const valid =
        Array.isArray(data) &&
        data.every((t) => Number.isInteger(t?.id) && typeof t.title === "string" && typeof t.done === "boolean");
      if (!valid) throw new Error("Некорректные данные");
      const list = new TodoList();
      list.#tasks = data;
      list.#nextId = data.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      return list;
    }
  }
`;

const todoProject: Project = {
  id: 'js.project.todo',
  route: 'javascript',
  title: 'Мини-библиотека задач с фильтрами и undo',
  summary: 'Напишете класс TodoList: добавление, отметка выполнения, фильтры и статистика, отмена действий и сохранение в JSON.',
  lang: 'javascript',
  prereqs: ['js.arrays', 'js.objects', 'js.classes', 'js.errors'],
  starter: c`
    class TodoList {
      // ваш код
    }
  `,
  steps: [
    {
      title: 'Добавление и список',
      prompt:
        'В классе `TodoList` реализуйте `add(title)` и `list()`. `add` обрезает пробелы по краям, присваивает задаче числовой `id` (1, 2, 3, …), `done: false`, и возвращает копию задачи; пустой (после обрезки) заголовок — `Error("Название не может быть пустым")`. `list()` возвращает **копию** массива задач.',
      tests: [
        {
          expr: '(() => { const t = new TodoList(); t.add("Купить хлеб"); t.add("  Позвонить  "); return t.list().map((x) => [x.id, x.title, x.done]); })()',
          expect: '[[1, "Купить хлеб", false], [2, "Позвонить", false]]',
        },
        { expr: '(() => { try { new TodoList().add("   "); return "нет ошибки"; } catch (e) { return e.message; } })()', expect: '"Название не может быть пустым"' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.list().push({}); return t.list().length; })()', expect: '1', hidden: true, label: 'list() возвращает копию — внешние изменения не влияют' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.list()[0].done = true; return t.list()[0].done; })()', expect: 'false', hidden: true, label: 'задачи в списке тоже копии' },
      ],
      hints: [
        'Состояние храните в приватных полях: `#tasks = []`, `#nextId = 1`.',
        'Проверьте заголовок после `trim()`: пустая строка — falsy.',
        'Возвращайте копии: `{ ...task }` и `this.#tasks.map((t) => ({ ...t }))`.',
      ],
      solution: TODO_V1,
    },
    {
      title: 'Выполнение и удаление',
      prompt:
        'Добавьте `toggle(id)` (переключает `done`) и `remove(id)` (удаляет задачу). Оба возвращают `true`, если задача найдена, и `false` иначе. Идентификаторы удалённых задач повторно не используются.',
      tests: [
        { expr: '(() => { const t = new TodoList(); t.add("a"); const r1 = t.toggle(1); const r2 = t.toggle(99); return [r1, r2, t.list()[0].done]; })()', expect: '[true, false, true]' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); return [t.remove(1), t.remove(1), t.list().length]; })()', expect: '[true, false, 0]' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.toggle(1); t.toggle(1); return t.list()[0].done; })()', expect: 'false', hidden: true, label: 'двойное переключение возвращает исходное состояние' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.add("b"); t.remove(1); return t.add("c").id; })()', expect: '3', hidden: true, label: 'id удалённой задачи не переиспользуется' },
      ],
      hints: [
        '`find` вернёт саму задачу из `#tasks` — её можно изменить, список-копию наружу вы отдаёте отдельно.',
        'Для удаления найдите индекс (`findIndex`) и вырежьте `splice(index, 1)`.',
        'Не забудьте `return false`, если задачи нет.',
      ],
      solution: TODO_V2,
    },
    {
      title: 'Фильтры и статистика',
      prompt:
        'Добавьте `filter(mode = "all")` (режимы `"all"`, `"active"`, `"done"`; неизвестный режим — `RangeError` с сообщением `Неизвестный фильтр: <режим>`) и `stats()` — `{ total, done, active }`.',
      tests: [
        {
          expr: '(() => { const t = new TodoList(); t.add("a"); t.add("b"); t.add("c"); t.toggle(2); return [t.filter("done").map((x) => x.title), t.filter("active").map((x) => x.title), t.filter().length]; })()',
          expect: '[["b"], ["a", "c"], 3]',
        },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.add("b"); t.toggle(1); return t.stats(); })()', expect: '({ total: 2, done: 1, active: 1 })' },
        { expr: '(() => { try { new TodoList().filter("zzz"); return "нет ошибки"; } catch (e) { return [e.name, e.message]; } })()', expect: '["RangeError", "Неизвестный фильтр: zzz"]', hidden: true, label: 'неизвестный режим фильтра' },
        { expr: 'new TodoList().filter("done")', expect: '[]', hidden: true, label: 'фильтр пустого списка' },
        { expr: 'new TodoList().stats()', expect: '({ total: 0, done: 0, active: 0 })', hidden: true, label: 'статистика пустого списка' },
      ],
      hints: [
        'Для `filter` удобно начинать с `this.list()` (копии) и применять `Array.prototype.filter`.',
        'Незнакомый режим — `throw new RangeError(...)` после всех проверок.',
        '`active` = `total - done`.',
      ],
      solution: TODO_V3,
    },
    {
      title: 'Отмена действий (undo)',
      prompt:
        'Добавьте `undo()`: отменяет последнее успешное изменение (`add`, `toggle`, `remove`) и возвращает `true`; если отменять нечего — `false`. Неудачные операции (`toggle`/`remove` несуществующей задачи, пустой заголовок) в историю не попадают. Счётчик `id` при отмене не откатывается.',
      tests: [
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.add("b"); const r = t.undo(); return [r, t.list().map((x) => x.title)]; })()', expect: '[true, ["a"]]' },
        { expr: 'new TodoList().undo()', expect: 'false' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.toggle(1); t.undo(); return t.list()[0].done; })()', expect: 'false' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.toggle(99); t.undo(); return t.list().length; })()', expect: '0', hidden: true, label: 'неудачный toggle не попадает в историю' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.remove(1); t.undo(); return t.list().map((x) => x.title); })()', expect: '["a"]', hidden: true, label: 'undo возвращает удалённую задачу' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); t.undo(); return [t.undo(), t.add("b").id]; })()', expect: '[false, 2]', hidden: true, label: 'история исчерпана; id не переиспользуется' },
        { expr: '(() => { const t = new TodoList(); try { t.add(""); } catch {} return t.undo(); })()', expect: 'false', hidden: true, label: 'неудачный add не попадает в историю' },
      ],
      hints: [
        'Перед каждым успешным изменением сохраняйте снимок списка в стек `#history`.',
        'Снимок — копия задач: `this.#tasks.map((t) => ({ ...t }))`, иначе изменения «протекут» в историю.',
        '`undo` — `pop()` из истории и замена `#tasks`; делайте снимок только после того, как убедились, что операция пройдёт.',
      ],
      solution: TODO_V4,
    },
    {
      title: 'Сохранение в JSON',
      prompt:
        'Добавьте `save()` — JSON-строку со списком задач — и статический метод `TodoList.load(text)`, создающий список из такой строки. Некорректный JSON или неверная структура (массив объектов `{ id: целое, title: строка, done: булево }`) — `Error("Некорректные данные")`. Новые `id` после загрузки продолжаются с максимального `id` + 1, история пуста.',
      tests: [
        {
          expr: '(() => { const t = new TodoList(); t.add("a"); t.add("b"); t.toggle(2); return TodoList.load(t.save()).list(); })()',
          expect: '[{ id: 1, title: "a", done: false }, { id: 2, title: "b", done: true }]',
        },
        { expr: '(() => { try { TodoList.load("oops"); return "нет ошибки"; } catch (e) { return e.message; } })()', expect: '"Некорректные данные"' },
        { expr: `(() => { try { TodoList.load('[{"id":1}]'); return "нет ошибки"; } catch (e) { return e.message; } })()`, expect: '"Некорректные данные"', hidden: true, label: 'корректный JSON, но неверная структура' },
        { expr: `TodoList.load('[{"id":5,"title":"x","done":false}]').add("y").id`, expect: '6', hidden: true, label: 'id продолжается с максимального' },
        { expr: 'TodoList.load("[]").list()', expect: '[]', hidden: true, label: 'пустой список' },
        { expr: '(() => { const t = new TodoList(); t.add("a"); return TodoList.load(t.save()).undo(); })()', expect: 'false', hidden: true, label: 'после загрузки история пуста' },
        { expr: 'new TodoList().save()', expect: '"[]"', hidden: true, label: 'сохранение пустого списка' },
      ],
      hints: [
        '`save()` — `JSON.stringify(this.#tasks)`. Не называйте метод `toJSON`: `JSON.stringify` вызвал бы его сам.',
        'В `load` оберните `JSON.parse` в `try/catch` и бросьте свою ошибку; затем проверьте структуру через `Array.isArray` и `every`.',
        'Внутри статического метода есть доступ к приватным полям созданного экземпляра: `list.#tasks = data`.',
      ],
      solution: TODO_V5,
    },
  ],
};

export const projects: Project[] = [cartProject, todoProject];
