import type { SkillModule } from '../../core/types';
import { SHOP, SHOP_HIDDEN } from './datasets';
import { md, sqlBlock } from './helpers';

const S = 'sql.ddl';

const TEACHERS = `
CREATE TABLE teachers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
INSERT INTO teachers VALUES (1, 'Орлова'), (2, 'Белова');
`;
const TEACHERS_HIDDEN = `
CREATE TABLE teachers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
INSERT INTO teachers VALUES (1, 'Миронов'), (2, 'Кузнецов'), (3, 'Белова');
CREATE TABLE audit_log (id INTEGER PRIMARY KEY, message TEXT);
`;

const INFO = (table: string) =>
  `SELECT p.name, p.type, p."notnull", p.pk, (SELECT COUNT(*) FROM pragma_index_list('${table}') WHERE "unique" = 1) AS uniq FROM pragma_table_info('${table}') AS p ORDER BY p.cid`;

export const ddl: SkillModule = {
  skill: {
    id: S,
    route: 'sql',
    title: 'CREATE TABLE, ограничения и индексы',
    icon: '🏗️',
    summary: 'Создание таблиц, типы SQLite, PRIMARY KEY, NOT NULL, UNIQUE, FOREIGN KEY, CHECK, DEFAULT и индексы.',
    prereqs: ['sql.dml'],
    tier: 3,
    outcomes: [
      'Умею создавать таблицы с типами и ограничениями целостности (PRIMARY KEY, NOT NULL, UNIQUE, CHECK, DEFAULT, FOREIGN KEY)',
      'Понимаю динамическую типизацию SQLite и «сродство типов» (type affinity)',
      'Умею создавать индексы и понимаю, когда они ускоряют запросы, а когда — нет',
      'Понимаю, что ограничения на уровне БД защищают данные лучше, чем проверки только в приложении',
    ],
    estMinutes: 35,
    lesson: {
      why: 'Схема — фундамент данных. Хорошие ограничения не дают сохранить мусор (пустые имена, дубликаты, «осиротевшие» ссылки), а правильные индексы превращают запрос в секунды в запрос в миллисекунды.',
      brief:
        '`CREATE TABLE t (столбец ТИП ограничения, …)` задаёт структуру. Ограничения: `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT`, `FOREIGN KEY … REFERENCES`. `CREATE INDEX` ускоряет поиск и сортировку по столбцам, но замедляет запись и занимает место.',
      standard: md(
        '`CREATE TABLE` описывает столбцы: имя, тип и ограничения.',
        sqlBlock("CREATE TABLE students (\n  id    INTEGER PRIMARY KEY,\n  name  TEXT    NOT NULL,\n  email TEXT    UNIQUE,\n  age   INTEGER CHECK (age >= 0),\n  city  TEXT    DEFAULT 'Москва'\n);"),
        'Ограничения целостности:',
        "- `PRIMARY KEY` — уникальный идентификатор строки (в SQLite `INTEGER PRIMARY KEY` — это алиас внутреннего `rowid`, значение подбирается автоматически);\n- `NOT NULL` — запрещает пустые значения;\n- `UNIQUE` — запрещает дубликаты значений (в таблице может быть несколько UNIQUE, но только один PRIMARY KEY);\n- `CHECK (условие)` — произвольное условие для значения;\n- `DEFAULT значение` — значение, если при вставке столбец не указан;\n- `FOREIGN KEY` — ссылка на строку другой таблицы.",
        '**Внешний ключ** связывает таблицы: значение в дочерней таблице должно существовать в родительской.',
        sqlBlock("CREATE TABLE classes (\n  id         INTEGER PRIMARY KEY,\n  title      TEXT NOT NULL,\n  teacher_id INTEGER,\n  FOREIGN KEY (teacher_id) REFERENCES teachers (id)\n);"),
        '**Типы в SQLite** динамические. У столбца есть «сродство» (affinity): `INTEGER`, `TEXT`, `REAL`, `NUMERIC`, `BLOB`. SQLite пытается преобразовать значение к типу столбца (строку `\'42\'` в INTEGER-столбце превратит в число 42), но если не получается — сохранит как есть. Никаких ошибок типа не будет, пока таблица не объявлена как `STRICT`.',
        '**Индекс** — отсортированная структура (B-дерево), позволяющая быстро находить строки по значению столбца, не просматривая всю таблицу:',
        sqlBlock("CREATE INDEX idx_orders_customer ON orders (customer_id);"),
        'Индекс помогает `WHERE customer_id = 5`, `JOIN … ON o.customer_id = c.id`, `ORDER BY customer_id`. Но каждый индекс занимает место и замедляет `INSERT`/`UPDATE`/`DELETE`, потому что его тоже нужно обновлять.',
        'Изменение структуры: `ALTER TABLE t ADD COLUMN …`, `ALTER TABLE t RENAME TO …`, `DROP TABLE t`, `DROP INDEX i`.',
      ),
      deep: md(
        '**Динамическая типизация.** Тип принадлежит значению, а не столбцу. Правило определения сродства по объявленному типу: содержит `INT` → INTEGER; `CHAR`, `CLOB`, `TEXT` → TEXT; `BLOB` или тип не указан → BLOB (без преобразований); `REAL`, `FLOA`, `DOUB` → REAL; иначе NUMERIC. Поэтому `VARCHAR(10)` — это просто TEXT: длина **не** ограничена. Строгая типизация включается ключевым словом `STRICT` в конце определения таблицы (SQLite ≥ 3.37).',
        '**Внешние ключи по умолчанию отключены.** Чтобы SQLite проверял их, нужно в каждом соединении выполнить `PRAGMA foreign_keys = ON`. После этого вставка со ссылкой на несуществующую строку вызовет ошибку, а действия `ON DELETE CASCADE | SET NULL | RESTRICT` заработают.',
        '**PRIMARY KEY и NULL.** В отличие от стандарта, SQLite для первичных ключей НЕ-INTEGER допускает NULL (историческая особенность) — поэтому пишите `NOT NULL` явно. Для `INTEGER PRIMARY KEY` NULL при вставке означает «подбери автоматически».',
        '**UNIQUE и NULL.** UNIQUE допускает несколько строк с NULL, так как NULL ≠ NULL.',
        '**Когда индекс помогает.** Селективные условия (`WHERE email = ?` возвращает 1 строку из миллиона); соединения по внешнему ключу; сортировка `ORDER BY … LIMIT`; уникальность. **Когда не помогает или вредит:** столбцы с малым числом значений (например, пол или статус из 3 значений) — индекс почти ничего не отсекает; маленькие таблицы; запросы, возвращающие большую долю таблицы; выражения над столбцом (`WHERE UPPER(name) = …`, `price + 1 > 10`) и шаблон `LIKE \'%x\'`, которые не могут использовать обычный индекс; таблицы с интенсивной записью — каждая вставка обновляет все индексы.',
        '**Составные индексы.** Индекс `(a, b)` работает как телефонная книга, отсортированная по фамилии, затем по имени: помогает для `a = …` и `a = … AND b = …`, но почти бесполезен для одного `b = …`. Правило левого префикса: порядок столбцов в индексе важен.',
        '**Покрывающий индекс.** Если все нужные запросу столбцы лежат в индексе, таблицу вообще не читают. Проверить использование индекса можно командой `EXPLAIN QUERY PLAN SELECT …` — ищите `SEARCH … USING INDEX` вместо `SCAN`.',
        '**Ограничения в БД, а не только в приложении.** Приложений может быть несколько, ошибки и гонки случаются, а миграции и ручные правки идут мимо кода. Ограничение в схеме — последний рубеж, который гарантирует целостность данных всегда.',
      ),
      analogy:
        'Схема таблицы — это бланк анкеты: какие графы есть, какие обязательны, какие значения допустимы. Индекс — алфавитный указатель в конце книги: вместо чтения всех страниц вы сразу находите нужную, но указатель нужно обновлять при каждом изменении книги.',
      example: {
        lang: 'sql',
        setup: SHOP,
        code: "CREATE TABLE reviews (\n  id          INTEGER PRIMARY KEY,\n  product_id  INTEGER NOT NULL REFERENCES products (id),\n  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),\n  comment     TEXT DEFAULT ''\n);\nCREATE INDEX idx_reviews_product ON reviews (product_id);\nINSERT INTO reviews (product_id, rating) VALUES (1, 5), (1, 4), (7, 3);\nSELECT product_id, AVG(rating) AS avg_rating FROM reviews GROUP BY product_id;",
        steps: [
          '`id INTEGER PRIMARY KEY` — первичный ключ; значение подбирается автоматически.',
          '`REFERENCES products (id)` — внешний ключ: отзыв относится к существующему товару (проверка включается `PRAGMA foreign_keys = ON`).',
          '`CHECK (rating BETWEEN 1 AND 5)` не пропустит оценки вне диапазона; `DEFAULT \'\'` подставит пустой комментарий.',
          '`CREATE INDEX` ускоряет поиск отзывов конкретного товара и соединения по `product_id`.',
        ],
      },
      counterexample: {
        lang: 'sql',
        code: "CREATE TABLE t (n INTEGER);\nINSERT INTO t VALUES ('abc');\nSELECT n, typeof(n) FROM t;",
        explain:
          'SQLite не выдаст ошибку: текст `\'abc\'` нельзя преобразовать в число, и он сохранится как есть (`typeof` = text). Объявленный тип — не гарантия. Для строгой проверки используйте `STRICT` или `CHECK (typeof(n) = \'integer\')`.',
      },
      pitfalls: [
        'Думать, что `INTEGER` или `VARCHAR(10)` в SQLite ограничивают значения: без STRICT это только «сродство типа».',
        'Внешние ключи не проверяются, пока не выполнено `PRAGMA foreign_keys = ON`.',
        'Индекс на каждый столбец «на всякий случай»: замедляет запись и занимает место.',
        'Индекс по столбцу с 2–3 значениями почти бесполезен: он ничего не отсекает.',
        'Функция над столбцом в WHERE (`UPPER(name)`) не использует обычный индекс.',
        'Порядок столбцов в составном индексе важен: `(a, b)` не поможет запросу только по `b`.',
      ],
      sources: [
        { title: 'SQLite: CREATE TABLE', url: 'https://www.sqlite.org/lang_createtable.html' },
        { title: 'SQLite: типы данных', url: 'https://www.sqlite.org/datatype3.html' },
        { title: 'SQLite: внешние ключи', url: 'https://www.sqlite.org/foreignkeys.html' },
        { title: 'SQLite: CREATE INDEX', url: 'https://www.sqlite.org/lang_createindex.html' },
        { title: 'SQLite: планировщик запросов', url: 'https://www.sqlite.org/queryplanner.html' },
      ],
    },
    misconceptions: [
      {
        id: 'strict-types',
        title: 'SQLite строго проверяет типы столбцов',
        explanation: 'Тип столбца — лишь «сродство». Значение, которое не удаётся преобразовать, сохраняется как есть, без ошибки (если таблица не STRICT).',
        fix: 'Используйте `STRICT` или `CHECK (typeof(col) = …)`.',
      },
      {
        id: 'pk-and-unique-same',
        title: 'PRIMARY KEY и UNIQUE — одно и то же',
        explanation: 'PRIMARY KEY — один на таблицу и идентифицирует строку (в SQLite INTEGER PRIMARY KEY ещё и алиас rowid). UNIQUE можно навесить на любое количество столбцов.',
        fix: 'Первичный ключ — «личность» строки; UNIQUE — дополнительное правило уникальности.',
      },
      {
        id: 'index-always-faster',
        title: 'Чем больше индексов, тем быстрее база',
        explanation: 'Каждый индекс ускоряет чтение по своим столбцам, но замедляет запись и занимает место. Индекс по малоселективному столбцу почти бесполезен.',
        fix: 'Создавайте индексы под реальные запросы (WHERE, JOIN, ORDER BY) и проверяйте через EXPLAIN QUERY PLAN.',
      },
      {
        id: 'fk-always-enforced',
        title: 'FOREIGN KEY всегда защищает от «осиротевших» ссылок',
        explanation: 'В SQLite внешние ключи по умолчанию выключены: проверка начинается после `PRAGMA foreign_keys = ON` в каждом соединении.',
        fix: 'Включайте PRAGMA при открытии соединения.',
      },
    ],
  },
  exercises: [
    {
      id: `${S}.1`,
      skill: S,
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'sql',
      code: "CREATE TABLE t (n INTEGER);\nINSERT INTO t VALUES ('abc');",
      prompt: 'Что произойдёт при выполнении этих команд в SQLite (таблица без STRICT)?',
      options: [
        { text: 'Вставка пройдёт: значение «abc» сохранится как текст', correct: true, why: 'Тип столбца — лишь сродство. Текст, не преобразуемый в число, сохраняется как есть.' },
        { text: 'Ошибка: нельзя вставить текст в INTEGER-столбец', why: 'Так работают строго типизированные СУБД. SQLite без STRICT ошибку не выдаст.', misconception: 'strict-types' },
        { text: 'Вставится 0', why: 'SQLite не подменяет нечисловой текст нулём при вставке.' },
        { text: 'Вставится NULL', why: 'Значение не теряется: оно сохраняется как текст.' },
      ],
      explanation: 'Для строгой проверки типов в SQLite есть STRICT-таблицы и ограничения CHECK.',
    },
    {
      id: `${S}.2`,
      skill: S,
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      prompt: 'Чем PRIMARY KEY отличается от UNIQUE?',
      options: [
        { text: 'PRIMARY KEY в таблице только один (идентифицирует строку), а UNIQUE-ограничений может быть много', correct: true, why: 'Первичный ключ — «личность» строки; UNIQUE — дополнительные правила уникальности.' },
        { text: 'Это одно и то же — два названия одного ограничения', why: 'Это разные ограничения: первичный ключ один, UNIQUE можно задать на несколько наборов столбцов.', misconception: 'pk-and-unique-same' },
        { text: 'UNIQUE быстрее PRIMARY KEY', why: 'Скорость определяется индексами, а не названием ограничения.' },
        { text: 'PRIMARY KEY допускает дубликаты, а UNIQUE — нет', why: 'Наоборот: первичный ключ обязан быть уникальным.' },
      ],
      explanation: 'Один PRIMARY KEY на таблицу, неограниченное количество UNIQUE.',
    },
    {
      id: `${S}.3`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 1,
      diag: true,
      prompt: 'Создайте таблицу `students`: `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL`, `email TEXT UNIQUE`. Типы указывайте именно так.',
      setup: TEACHERS,
      hiddenSetup: TEACHERS_HIDDEN,
      check: INFO('students'),
      starter: 'CREATE TABLE students (\n  -- столбцы\n);',
      solution: 'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE);',
      hints: ['Каждый столбец: имя, тип, затем ограничения.', '`email TEXT UNIQUE` — запрещает дубликаты адресов.'],
      explanation: 'PRIMARY KEY задаёт ключ, NOT NULL запрещает пустое имя, UNIQUE — повтор email.',
    },
    {
      id: `${S}.4`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: 'Создайте таблицу `classes`: `id INTEGER PRIMARY KEY`, `title TEXT NOT NULL`, `teacher_id INTEGER` и внешний ключ `teacher_id` → `teachers(id)`.',
      setup: TEACHERS,
      hiddenSetup: TEACHERS_HIDDEN,
      check: `SELECT 'fk', "from", "table", "to" FROM pragma_foreign_key_list('classes') UNION ALL SELECT 'col', name, type, pk FROM pragma_table_info('classes')`,
      starter: 'CREATE TABLE classes (\n  id INTEGER PRIMARY KEY,\n  title TEXT NOT NULL,\n  teacher_id INTEGER\n);',
      solution:
        'CREATE TABLE classes (id INTEGER PRIMARY KEY, title TEXT NOT NULL, teacher_id INTEGER, FOREIGN KEY (teacher_id) REFERENCES teachers (id));',
      hints: ['Внешний ключ описывается отдельной строкой в конце определения таблицы.', '`FOREIGN KEY (teacher_id) REFERENCES teachers (id)`.'],
      explanation: 'FOREIGN KEY связывает столбец дочерней таблицы с ключом родительской.',
    },
    {
      id: `${S}.5`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: "Создайте таблицу `items`: `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL`, `price REAL NOT NULL CHECK (price >= 0)`, `stock INTEGER NOT NULL DEFAULT 0`. Затем вставьте строку с названием `'Ручка'` и ценой `50`, **не указывая** `stock`.",
      setup: TEACHERS,
      hiddenSetup: TEACHERS_HIDDEN,
      check: "SELECT i.name, i.price, i.stock, (SELECT COUNT(*) FROM sqlite_master WHERE name = 'items' AND sql LIKE '%CHECK%') AS has_check FROM items AS i",
      starter: 'CREATE TABLE items (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);',
      solution:
        "CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL CHECK (price >= 0), stock INTEGER NOT NULL DEFAULT 0); INSERT INTO items (name, price) VALUES ('Ручка', 50);",
      hints: ['DEFAULT и CHECK пишутся прямо в определении столбца.', "При вставке перечислите только `name` и `price`: `INSERT INTO items (name, price) VALUES (…)`."],
      explanation: 'DEFAULT подставит stock = 0 для пропущенного столбца; CHECK защищает от отрицательных цен.',
    },
    {
      id: `${S}.6`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: 'Нужно ускорить поиск заказов клиента и соединение `orders` с `customers`. Создайте индекс `idx_orders_customer` по столбцу `customer_id` таблицы `orders`.',
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      check: "SELECT m.name, m.tbl_name, (SELECT group_concat(name) FROM pragma_index_info(m.name)) AS cols FROM sqlite_master AS m WHERE m.type = 'index' AND m.name = 'idx_orders_customer'",
      starter: 'CREATE INDEX idx_orders_customer ON orders ();',
      solution: 'CREATE INDEX idx_orders_customer ON orders (customer_id);',
      hints: ['Синтаксис: `CREATE INDEX имя ON таблица (столбцы)`.', 'Индексируется внешний ключ `customer_id`.'],
      explanation: 'Индекс по внешнему ключу ускоряет и фильтр по клиенту, и JOIN.',
    },
    {
      id: `${S}.7`,
      skill: S,
      kind: 'fix',
      lang: 'sql',
      difficulty: 2,
      bugType: 'logic',
      prompt: 'Таблица `subscribers` должна запрещать дубликаты email, но сейчас допускает их. Исправьте определение таблицы (имена и типы столбцов не меняйте).',
      setup: TEACHERS,
      hiddenSetup: TEACHERS_HIDDEN,
      check: INFO('subscribers'),
      buggy: 'CREATE TABLE subscribers (\n  id INTEGER PRIMARY KEY,\n  email TEXT NOT NULL\n);',
      solution: 'CREATE TABLE subscribers (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);',
      hints: ['Какое ограничение запрещает повторяющиеся значения?', 'Добавьте `UNIQUE` в определение столбца email.'],
      explanation: 'UNIQUE создаёт уникальный индекс: вторая вставка того же email завершится ошибкой.',
    },
    {
      id: `${S}.8`,
      skill: S,
      kind: 'explain',
      difficulty: 3,
      prompt: 'Коллега предлагает «на всякий случай» создать индекс на каждый столбец таблицы `orders`. Объясните, помогут ли такие индексы, какие у них издержки и как выбрать, какие индексы действительно нужны.',
      keyPoints: [
        'Индекс ускоряет поиск, соединения и сортировку по своим столбцам',
        'Издержки: место на диске и замедление INSERT/UPDATE/DELETE, так как индексы тоже обновляются',
        'Индексы выбирают под реальные запросы и проверяют по EXPLAIN QUERY PLAN; для малоселективных столбцов они бесполезны',
      ],
      modelAnswer:
        'Индекс — отсортированная структура, которая ускоряет WHERE, JOIN и ORDER BY по своим столбцам, но каждый индекс занимает место и обновляется при каждой записи, замедляя вставки и изменения. Индексы «на всё» перегружают запись и часто не используются. Нужно смотреть на реальные запросы (по каким столбцам фильтруют, соединяют, сортируют), индексировать селективные столбцы и внешние ключи и проверять план через EXPLAIN QUERY PLAN.',
      explanation: 'Индекс — компромисс между скоростью чтения и стоимостью записи.',
    },
  ],
};
