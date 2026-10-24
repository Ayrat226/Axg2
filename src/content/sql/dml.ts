import type { SkillModule } from '../../core/types';
import { SHOP, SHOP_HIDDEN } from './datasets';
import { md, sqlBlock } from './helpers';

const S = 'sql.dml';

const INVENTORY = `
CREATE TABLE inventory (sku TEXT PRIMARY KEY, qty INTEGER NOT NULL);
INSERT INTO inventory VALUES ('A1', 5), ('B2', 0);
`;
const INVENTORY_HIDDEN = `
CREATE TABLE inventory (sku TEXT PRIMARY KEY, qty INTEGER NOT NULL);
INSERT INTO inventory VALUES ('B2', 1), ('C3', 7);
`;

export const dml: SkillModule = {
  skill: {
    id: S,
    route: 'sql',
    title: 'INSERT, UPDATE, DELETE и транзакции',
    icon: '✏️',
    summary: 'Изменение данных: INSERT, UPDATE и DELETE с WHERE, UPSERT (ON CONFLICT) и идея транзакции.',
    prereqs: ['sql.where'],
    tier: 2,
    outcomes: [
      'Умею добавлять строки через INSERT (в том числе несколько за раз) и указывать столбцы явно',
      'Умею безопасно менять и удалять данные: UPDATE/DELETE всегда с продуманным WHERE',
      'Умею вставлять или обновлять одной командой через INSERT … ON CONFLICT (UPSERT)',
      'Понимаю назначение транзакции (BEGIN / COMMIT / ROLLBACK) и свойство «всё или ничего»',
    ],
    estMinutes: 30,
    lesson: {
      why: 'Приложения не только читают данные, но и создают, меняют и удаляют их. Забытый WHERE в UPDATE или DELETE — одна из самых дорогих ошибок в практике разработчиков, а транзакции — основа надёжности данных.',
      brief:
        '`INSERT INTO t (a, b) VALUES (…)` добавляет строки; `UPDATE t SET a = … WHERE …` меняет; `DELETE FROM t WHERE …` удаляет. Без WHERE затрагиваются **все** строки. `ON CONFLICT … DO UPDATE` — вставка-или-обновление. Транзакция группирует изменения: либо все применяются (COMMIT), либо ни одно (ROLLBACK).',
      standard: md(
        '**INSERT** добавляет строки. Столбцы лучше перечислять явно — запрос переживёт изменение порядка столбцов в таблице. Пропущенные столбцы получают значение по умолчанию (`DEFAULT` или NULL), а `INTEGER PRIMARY KEY` присваивается автоматически.',
        sqlBlock("INSERT INTO products (name, category, price, stock)\nVALUES ('Чайник', 'Дом', 2900, 15),\n       ('Тарелка', 'Дом', 350, 80);"),
        '**UPDATE** меняет значения в существующих строках. В правой части можно использовать текущие значения столбцов:',
        sqlBlock("UPDATE products\nSET price = price + 100\nWHERE category = 'Книги';"),
        '**DELETE** удаляет строки целиком:',
        sqlBlock("DELETE FROM orders\nWHERE status = 'cancelled';"),
        '**Главная опасность:** без `WHERE` UPDATE и DELETE затрагивают **все** строки таблицы. Привычка, которая спасает: сначала напишите `SELECT … WHERE …` с тем же условием и убедитесь, что выбираются нужные строки, и только потом замените SELECT на UPDATE/DELETE.',
        '**UPSERT** — «вставить, а если такая запись уже есть, обновить»:',
        sqlBlock("INSERT INTO inventory (sku, qty)\nVALUES ('A1', 10)\nON CONFLICT (sku) DO UPDATE\n  SET qty = qty + excluded.qty;"),
        'Здесь `excluded` — это строка, которую пытались вставить; `qty` справа без префикса — текущее значение в таблице.',
        '**Транзакция** объединяет несколько операторов в одну неделимую операцию:',
        sqlBlock("BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;   -- или ROLLBACK; чтобы отменить обе операции"),
        'Если между двумя UPDATE произойдёт сбой, `ROLLBACK` (или автоматический откат при падении) вернёт данные к состоянию до `BEGIN` — деньги не «исчезнут».',
      ),
      deep: md(
        '**ACID.** Транзакции дают четыре гарантии: *атомарность* (всё или ничего), *согласованность* (ограничения не нарушены), *изолированность* (параллельные транзакции не видят друг друга «наполовину») и *долговечность* (после COMMIT данные пережили сбой). SQLite реализует это через журнал (rollback journal или WAL).',
        '**Автокоммит.** Вне явной транзакции каждый оператор выполняется в собственной транзакции и немедленно фиксируется — откатить уже выполненный `UPDATE` отдельно нельзя. Поэтому опасные операции удобно оборачивать в `BEGIN … ROLLBACK`, проверять результат, и лишь потом заменять на `COMMIT`.',
        '**Порядок удаления и внешние ключи.** Если на строку ссылаются другие таблицы, удаление «родителя» нарушит связь. По умолчанию SQLite **не проверяет** внешние ключи — для этого нужно `PRAGMA foreign_keys = ON`. После включения можно описать действие: `ON DELETE CASCADE` (удалить дочерние), `SET NULL`, `RESTRICT`. Без этого удаляйте сначала «детей» (позиции заказа), потом «родителя» (заказ).',
        '**RETURNING.** SQLite ≥ 3.35 умеет возвращать изменённые строки: `DELETE FROM orders WHERE status = \'cancelled\' RETURNING id;` — удобно для логирования и проверки.',
        '**Пакетная вставка.** Одна транзакция на 10 000 строк на порядки быстрее, чем 10 000 отдельных автокоммитов, потому что каждый коммит требует записи на диск.',
        '**INSERT OR REPLACE vs ON CONFLICT DO UPDATE.** `INSERT OR REPLACE` удаляет конфликтующую строку и вставляет новую целиком (теряются значения других столбцов, срабатывают триггеры удаления). `ON CONFLICT DO UPDATE` меняет только указанные столбцы — обычно это то, что нужно.',
        '**TRUNCATE** в SQLite нет: полная очистка — `DELETE FROM t;` (без WHERE), а `DROP TABLE` удаляет саму таблицу вместе со структурой.',
      ),
      analogy:
        'Таблица — это бумажный журнал. INSERT — дописать строку, UPDATE — исправить записи ручкой, DELETE — вычеркнуть. Транзакция — это «черновик»: вы вносите несколько правок и либо принимаете их все (COMMIT), либо выбрасываете черновик (ROLLBACK).',
      example: {
        lang: 'sql',
        setup: SHOP,
        code: "UPDATE products\nSET price = price + 100\nWHERE category = 'Книги';\n\nSELECT name, price FROM products WHERE category = 'Книги';",
        steps: [
          'UPDATE выбирает строки по WHERE — здесь только категория «Книги».',
          '`SET price = price + 100` для каждой выбранной строки берёт текущую цену и прибавляет 100.',
          'Остальные строки таблицы не затрагиваются — именно для этого нужен WHERE.',
          'Контрольный SELECT показывает итоговое состояние: так проверяют результат изменения.',
        ],
      },
      counterexample: {
        lang: 'sql',
        code: 'UPDATE products\nSET stock = 0;',
        explain:
          'Без WHERE обнулится остаток у **всех** товаров. Откатить это можно только из резервной копии или (если вы в транзакции) через ROLLBACK. Всегда проверяйте условие сначала SELECT-ом.',
      },
      pitfalls: [
        'UPDATE/DELETE без WHERE изменяют или удаляют все строки таблицы.',
        'INSERT без списка столбцов зависит от порядка столбцов в таблице и ломается после ALTER TABLE.',
        'Удаление «родительских» строк раньше «дочерних» при включённых внешних ключах вызовет ошибку; при выключенных — оставит «осиротевшие» ссылки.',
        '`INSERT OR REPLACE` затирает строку целиком — используйте ON CONFLICT DO UPDATE, если нужно обновить часть столбцов.',
        'Без явной транзакции каждый оператор фиксируется сразу: «отменить последнее» не получится.',
      ],
      sources: [
        { title: 'SQLite: INSERT', url: 'https://www.sqlite.org/lang_insert.html' },
        { title: 'SQLite: UPDATE', url: 'https://www.sqlite.org/lang_update.html' },
        { title: 'SQLite: DELETE', url: 'https://www.sqlite.org/lang_delete.html' },
        { title: 'SQLite: UPSERT', url: 'https://www.sqlite.org/lang_upsert.html' },
        { title: 'SQLite: транзакции', url: 'https://www.sqlite.org/lang_transaction.html' },
      ],
    },
    misconceptions: [
      {
        id: 'dml-requires-where',
        title: 'UPDATE без WHERE вызовет ошибку или обновит одну строку',
        explanation: 'Синтаксис разрешает UPDATE и DELETE без WHERE — они затрагивают все строки таблицы и выполняются без предупреждений.',
        fix: 'Сначала проверьте SELECT-ом с тем же WHERE, а изменяющие операции выполняйте в транзакции.',
      },
      {
        id: 'rollback-last-only',
        title: 'ROLLBACK отменяет только последний оператор',
        explanation: 'ROLLBACK отменяет все изменения с момента BEGIN — всю транзакцию целиком.',
        fix: 'Для частичной отмены используйте SAVEPOINT / ROLLBACK TO.',
      },
      {
        id: 'autocommit-undo',
        title: 'Выполненный UPDATE можно отменить через ROLLBACK',
        explanation: 'Без явного BEGIN каждый оператор сразу фиксируется (автокоммит). ROLLBACK ничего не вернёт.',
        fix: 'Открывайте транзакцию заранее: BEGIN; … ROLLBACK;.',
      },
      {
        id: 'delete-drop',
        title: 'DELETE FROM t — то же самое, что DROP TABLE t',
        explanation: 'DELETE удаляет строки, оставляя таблицу и её структуру. DROP TABLE удаляет саму таблицу.',
        fix: 'Для очистки данных — DELETE, для удаления структуры — DROP TABLE.',
      },
    ],
  },
  exercises: [
    {
      id: `${S}.1`,
      skill: S,
      kind: 'mcq',
      difficulty: 1,
      diag: true,
      lang: 'sql',
      code: 'UPDATE products\nSET price = 0;',
      prompt: 'Что произойдёт при выполнении этой команды?',
      options: [
        { text: 'Цена обнулится у всех товаров в таблице', correct: true, why: 'Без WHERE условие отбора отсутствует — изменяются все строки.' },
        { text: 'Команда завершится ошибкой: нужен WHERE', why: 'SQL разрешает UPDATE без WHERE.', misconception: 'dml-requires-where' },
        { text: 'Обновится только первая строка таблицы', why: 'UPDATE не ограничивается одной строкой, если вы сами не указали условие.', misconception: 'dml-requires-where' },
        { text: 'Ничего не изменится', why: 'Данные будут изменены.' },
      ],
      explanation: 'UPDATE и DELETE без WHERE затрагивают каждую строку таблицы.',
    },
    {
      id: `${S}.2`,
      skill: S,
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'sql',
      code: 'BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nROLLBACK;',
      prompt: 'Каково состояние таблицы `accounts` после выполнения этих команд?',
      options: [
        { text: 'Такое же, как до BEGIN — обе операции отменены', correct: true, why: 'ROLLBACK откатывает всю транзакцию целиком.' },
        { text: 'Первое списание применено, второе зачисление отменено', why: 'ROLLBACK не откатывает «только последний оператор».', misconception: 'rollback-last-only' },
        { text: 'Оба изменения применены', why: 'Применение фиксируется командой COMMIT, а не ROLLBACK.' },
        { text: 'Транзакция завершится ошибкой, таблица заблокирована', why: 'Это корректная последовательность команд.' },
      ],
      explanation: 'Транзакция — «всё или ничего»: ROLLBACK возвращает данные к состоянию на момент BEGIN.',
    },
    {
      id: `${S}.3`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 1,
      diag: true,
      prompt: "Добавьте в `products` товар: название `'Чайник'`, категория `'Дом'`, цена `2900`, остаток `15`. Столбец `id` назначится автоматически — не указывайте его.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      check: "SELECT name, category, price, stock FROM products WHERE name = 'Чайник'",
      starter: 'INSERT INTO products (name, category) VALUES ();',
      solution: "INSERT INTO products (name, category, price, stock) VALUES ('Чайник', 'Дом', 2900, 15);",
      hints: ['Перечислите столбцы в скобках после имени таблицы.', "`VALUES ('Чайник', 'Дом', 2900, 15)` — значения в том же порядке."],
      explanation: 'INSERT с явным списком столбцов; id присваивается автоматически, так как это INTEGER PRIMARY KEY.',
    },
    {
      id: `${S}.4`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 1,
      prompt: "Увеличьте цену на 100 у всех товаров категории `'Книги'`. Остальные товары не должны измениться.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      check: 'SELECT id, price FROM products',
      starter: "UPDATE products\nSET price = price;",
      solution: "UPDATE products SET price = price + 100 WHERE category = 'Книги';",
      hints: ['В SET можно использовать текущее значение столбца.', 'Не забудьте WHERE, иначе изменятся все товары.'],
      explanation: '`SET price = price + 100` + WHERE ограничивают изменение нужной категорией.',
    },
    {
      id: `${S}.5`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: "Удалите все заказы со статусом `'cancelled'` **и их позиции** в `order_items`. Сначала удаляйте позиции (дочерние строки), затем заказы. Можно использовать несколько операторов через `;`.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      check: "SELECT 'order', id FROM orders UNION ALL SELECT 'item', order_id FROM order_items",
      starter: "DELETE FROM orders\nWHERE status = 'cancelled';",
      solution:
        "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled'); DELETE FROM orders WHERE status = 'cancelled';",
      hints: ['Если сначала удалить заказы, позиции потеряют способ найти «свои» заказы.', 'Позиции отбираются подзапросом: `order_id IN (SELECT id FROM orders WHERE …)`.'],
      explanation: 'Дочерние строки удаляют до родительских, пока их можно найти через связь.',
    },
    {
      id: `${S}.6`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 3,
      prompt: "Пришла поставка: добавьте в `inventory` позиции `('A1', 10)` и `('C3', 4)`. Если такой `sku` уже есть, **увеличьте** `qty` на размер поставки, а не заменяйте. Делайте это одним оператором INSERT … ON CONFLICT.",
      setup: INVENTORY,
      hiddenSetup: INVENTORY_HIDDEN,
      check: 'SELECT sku, qty FROM inventory',
      starter: "INSERT INTO inventory (sku, qty)\nVALUES ('A1', 10), ('C3', 4);",
      solution:
        "INSERT INTO inventory (sku, qty) VALUES ('A1', 10), ('C3', 4) ON CONFLICT (sku) DO UPDATE SET qty = qty + excluded.qty;",
      hints: ['При дубликате первичного ключа вставка падает с ошибкой — нужно описать, что делать при конфликте.', '`ON CONFLICT (sku) DO UPDATE SET qty = qty + excluded.qty`.'],
      explanation: '`excluded.qty` — вставляемое значение, `qty` — текущее; их сумма даёт накопительный остаток.',
    },
    {
      id: `${S}.7`,
      skill: S,
      kind: 'fix',
      lang: 'sql',
      difficulty: 2,
      bugType: 'logic',
      prompt: "Нужно обнулить остаток (`stock = 0`) только у товаров категории `'Дом'`. Команда обнуляет остаток у всех товаров. Исправьте.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      check: 'SELECT id, stock FROM products',
      buggy: 'UPDATE products\nSET stock = 0;',
      solution: "UPDATE products SET stock = 0 WHERE category = 'Дом';",
      hints: ['Что отбирает строки для изменения?', 'Добавьте условие по категории.'],
      explanation: 'Без WHERE UPDATE затрагивает все строки.',
    },
    {
      id: `${S}.8`,
      skill: S,
      kind: 'explain',
      difficulty: 2,
      prompt: 'Объясните, зачем перевод денег между двумя счетами выполняют в одной транзакции, и что произойдёт без неё, если приложение упадёт между двумя UPDATE.',
      lang: 'sql',
      code: 'UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n-- здесь приложение упало\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;',
      keyPoints: [
        'Транзакция атомарна: применяются все операции или ни одной',
        'Без транзакции первый UPDATE уже зафиксирован (автокоммит): деньги списаны, но не зачислены',
        'При сбое ROLLBACK возвращает данные к состоянию до BEGIN',
      ],
      modelAnswer:
        'Перевод состоит из двух шагов, и данные корректны только если выполнены оба. В транзакции (`BEGIN … COMMIT`) они применяются как единое целое: при сбое откат вернёт всё как было. Без транзакции каждый UPDATE фиксируется сразу — после падения между ними деньги будут списаны с первого счёта и не зачислены на второй.',
      explanation: 'Атомарность транзакции — основа согласованности данных.',
    },
  ],
};
