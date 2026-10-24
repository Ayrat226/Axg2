import type { SkillModule } from '../../core/types';
import { SCHOOL, SCHOOL_HIDDEN, SHOP, SHOP_HIDDEN } from './datasets';
import { md, sqlBlock } from './helpers';

const S = 'sql.null';

const CONTACTS = `
CREATE TABLE contacts (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT);
INSERT INTO contacts VALUES
 (1, 'Анна', '+7-900-111'),
 (2, 'Борис', ''),
 (3, 'Вера', NULL),
 (4, 'Глеб', '+7-900-222');
`;
const CONTACTS_HIDDEN = `
CREATE TABLE contacts (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT);
INSERT INTO contacts VALUES
 (1, 'Дима', NULL),
 (2, 'Ева', '+7-911-333'),
 (3, 'Жора', ''),
 (4, 'Зоя', '');
`;

export const nulls: SkillModule = {
  skill: {
    id: S,
    route: 'sql',
    title: 'NULL и трёхзначная логика',
    icon: '∅',
    summary: 'NULL как «неизвестно», сравнения с NULL, ловушка NOT IN, COALESCE и NULLIF.',
    prereqs: ['sql.where'],
    tier: 2,
    interview: true,
    outcomes: [
      'Объясняю, что NULL — это «неизвестно», а не ноль и не пустая строка',
      'Предсказываю результат выражений с NULL (трёхзначная логика TRUE / FALSE / UNKNOWN)',
      'Знаю ловушку NOT IN с NULL и пользуюсь NOT EXISTS или фильтрацией NULL',
      'Умею заменять и порождать NULL через COALESCE и NULLIF',
    ],
    estMinutes: 30,
    lesson: {
      why: 'NULL — самый частый источник «тихих» ошибок в SQL: пропавшие строки, неверные суммы, пустые результаты. Вопросы про NULL — классика собеседований, потому что они проверяют понимание логики SQL, а не синтаксис.',
      brief:
        'NULL означает «значение неизвестно/отсутствует». Любое сравнение с NULL (`=`, `<>`, `<`) даёт UNKNOWN, а WHERE пропускает только TRUE. Проверяют `IS NULL`. `x NOT IN (…, NULL)` никогда не бывает истинным. `COALESCE(a, b)` — первое непустое, `NULLIF(a, b)` — NULL, если a = b.',
      standard: md(
        '`NULL` — не число, не пустая строка и не «ничего», а **маркер неизвестного значения**. Поэтому результат любой операции с неизвестным тоже неизвестен: `NULL + 1` → `NULL`, `\'a\' || NULL` → `NULL`, `NULL = NULL` → `NULL`.',
        '**Трёхзначная логика.** Условие в SQL может быть `TRUE`, `FALSE` или `UNKNOWN`. Основные правила: `NOT UNKNOWN = UNKNOWN`; `TRUE AND UNKNOWN = UNKNOWN`; `FALSE AND UNKNOWN = FALSE`; `TRUE OR UNKNOWN = TRUE`; `FALSE OR UNKNOWN = UNKNOWN`. `WHERE` оставляет строку **только** при TRUE — и FALSE, и UNKNOWN отбрасываются.',
        sqlBlock("-- клиент с city = NULL не попадёт ни в один из запросов:\nSELECT name FROM customers WHERE city = 'Москва';\nSELECT name FROM customers WHERE city <> 'Москва';"),
        'Чтобы проверить пустоту, есть специальные операторы: `IS NULL` и `IS NOT NULL`. Чтобы включить пустые значения в «неравенство», добавляйте их явно:',
        sqlBlock("SELECT name\nFROM customers\nWHERE city <> 'Москва' OR city IS NULL;"),
        '**COALESCE(a, b, …)** возвращает первое непустое значение — удобно для значений по умолчанию:',
        sqlBlock("SELECT name, COALESCE(email, 'не указан') AS email_shown\nFROM customers;"),
        '**NULLIF(a, b)** возвращает NULL, если `a = b`, иначе `a`. Помогает превратить «пустую строку» в настоящий NULL или избежать деления на ноль в СУБД, где оно вызывает ошибку:',
        sqlBlock("SELECT name, COALESCE(NULLIF(phone, ''), 'нет') AS phone_shown\nFROM contacts;"),
        '**NOT IN и NULL.** `x NOT IN (1, 2, NULL)` не может быть TRUE: оно раскрывается в `x <> 1 AND x <> 2 AND x <> NULL`, а последний член — UNKNOWN. Результат — пустой набор. Для «нет в другой таблице» используйте `NOT EXISTS`.',
      ),
      deep: md(
        '**Агрегаты и NULL.** `COUNT(*)` считает все строки, `COUNT(x)`, `SUM(x)`, `AVG(x)`, `MIN(x)`, `MAX(x)` игнорируют NULL. Если все значения NULL (или строк нет), `SUM`/`AVG`/`MIN`/`MAX` вернут NULL, а `COUNT(x)` — 0.',
        '**Группировка, DISTINCT, UNIQUE.** Тут NULL ведёт себя «как равный себе»: `GROUP BY` и `DISTINCT` собирают все NULL в одну группу. А вот в ограничении `UNIQUE` NULL-значения **не конфликтуют** друг с другом — можно вставить несколько строк с NULL. (В SQLite это так для UNIQUE-индексов; в SQL Server — иначе.)',
        '**Сортировка.** SQLite считает NULL наименьшим значением: в `ORDER BY x ASC` NULL идут первыми.',
        '**IS DISTINCT FROM.** Стандартный оператор «равенства с учётом NULL» в SQLite записывается как `IS` / `IS NOT`: `a IS b` истинно, если оба NULL или значения равны. Например `WHERE city IS NOT \'Москва\'` вернёт и обычные города, и NULL.',
        '**Булево NULL в CASE.** `CASE WHEN x > 5 THEN … ELSE … END` при x = NULL уйдёт в ELSE, потому что условие не TRUE. Это часто неожиданно: NULL «проваливается» в ветку по умолчанию.',
        '**Проектирование схемы.** NULL — не значение по умолчанию. Если «неизвестно» не имеет смысла, объявляйте столбец `NOT NULL` с осмысленным `DEFAULT`. Но не подменяйте NULL магическими числами (-1, \'N/A\'): они портят агрегаты.',
        '**Пустая строка и NULL — разные значения.** В Oracle пустая строка = NULL, в SQLite, PostgreSQL, MySQL — нет. Поэтому `WHERE phone = \'\'` не найдёт NULL, а `WHERE phone IS NULL` не найдёт пустые строки.',
      ),
      analogy:
        'NULL — это не «0 рублей», а «в анкете графа не заполнена». Спросите «равна ли неизвестная зарплата Ивана неизвестной зарплате Петра?» — честный ответ «не знаю», а не «да» и не «нет». SQL отвечает именно так: UNKNOWN.',
      example: {
        lang: 'sql',
        setup: SHOP,
        code: "SELECT name,\n       COALESCE(city, 'город не указан') AS city_shown\nFROM customers\nWHERE city <> 'Москва' OR city IS NULL\nORDER BY name;",
        steps: [
          '`city <> \'Москва\'` для клиента с `city = NULL` даёт UNKNOWN, и WHERE его бы отбросил.',
          'Добавленное `OR city IS NULL` возвращает таким строкам TRUE — клиент попадает в результат.',
          '`COALESCE(city, …)` подставляет понятную надпись вместо NULL — только в результате, данные не меняются.',
          '`ORDER BY name` сортирует итог по имени.',
        ],
      },
      counterexample: {
        lang: 'sql',
        code: 'SELECT name\nFROM customers\nWHERE id NOT IN (SELECT customer_id FROM orders);',
        explain:
          'Если хотя бы у одного заказа `customer_id IS NULL` (например, гостевой заказ), условие `NOT IN` станет неизвестным для всех клиентов, и запрос вернёт пустой результат. Надёжнее: `NOT EXISTS` или `NOT IN (… WHERE customer_id IS NOT NULL)`.',
      },
      pitfalls: [
        '`= NULL` и `<> NULL` не работают — используйте `IS NULL` / `IS NOT NULL`.',
        '`NOT IN (подзапрос)` возвращает пусто, если в подзапросе есть NULL.',
        '`col <> \'x\'` молча отбрасывает строки, где col NULL.',
        '`\'текст\' || NULL` даёт NULL: используйте COALESCE перед склейкой.',
        'AVG и SUM игнорируют NULL — «средняя оценка» считается только по заполненным значениям.',
        'Пустая строка и NULL — разные значения; проверяйте оба варианта (`COALESCE(NULLIF(x, \'\'), …)`).',
      ],
      sources: [
        { title: 'SQLite: NULL в SQLite и других СУБД', url: 'https://www.sqlite.org/nulls.html' },
        { title: 'SQLite: выражения (IS, IN, CASE)', url: 'https://www.sqlite.org/lang_expr.html' },
        { title: 'SQLite: COALESCE и NULLIF', url: 'https://www.sqlite.org/lang_corefunc.html' },
      ],
    },
    misconceptions: [
      {
        id: 'null-equals',
        title: 'NULL = NULL истинно',
        explanation: 'Сравнение с неизвестным значением даёт неизвестное (NULL), а не TRUE. Поэтому и `x = NULL` никогда не находит строки.',
        fix: 'Используйте `IS NULL`, а для «равны с учётом NULL» — `IS`.',
      },
      {
        id: 'not-in-null',
        title: 'NOT IN просто исключает значения из списка',
        explanation: 'Если в списке или подзапросе есть NULL, то `x NOT IN (…)` никогда не TRUE: результат всегда пуст.',
        fix: 'Используйте NOT EXISTS или отфильтруйте NULL в подзапросе.',
      },
      {
        id: 'null-is-empty',
        title: 'NULL — это ноль или пустая строка',
        explanation: 'NULL означает «неизвестно». Ноль и пустая строка — обычные значения, которые участвуют в сравнениях и агрегатах.',
        fix: 'Если нужно значение по умолчанию, используйте COALESCE.',
      },
      {
        id: 'inequality-includes-null',
        title: '`<>` возвращает всё, что не равно значению, включая NULL',
        explanation: 'Для NULL результат неравенства — UNKNOWN, строка отбрасывается.',
        fix: 'Добавьте `OR col IS NULL`, если NULL нужны.',
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
      code: 'SELECT NULL = NULL;',
      prompt: 'Что вернёт этот запрос?',
      options: [
        { text: 'NULL (неизвестно)', correct: true, why: 'Сравнение неизвестного с неизвестным — неизвестно.' },
        { text: '1 (истина)', why: 'Два неизвестных значения нельзя считать равными.', misconception: 'null-equals' },
        { text: '0 (ложь)', why: 'Ложью было бы, если бы значения были известны и различны.' },
        { text: 'Ошибку', why: 'Запрос корректен.' },
      ],
      explanation: 'Любое сравнение с NULL даёт NULL. Чтобы сравнить «с учётом NULL», используют `IS`.',
    },
    {
      id: `${S}.2`,
      skill: S,
      kind: 'mcq',
      difficulty: 2,
      diag: true,
      lang: 'sql',
      code: "SELECT 'да'\nWHERE 3 NOT IN (1, 2, NULL);",
      prompt: 'Что вернёт этот запрос?',
      options: [
        { text: 'Ни одной строки', correct: true, why: '`3 NOT IN (1, 2, NULL)` = `3<>1 AND 3<>2 AND 3<>NULL` = TRUE AND TRUE AND UNKNOWN = UNKNOWN; WHERE отбрасывает.' },
        { text: 'Строку «да»', why: 'Это было бы без NULL в списке. NULL делает всё условие неизвестным.', misconception: 'not-in-null' },
        { text: 'Строку со значением NULL', why: 'Запрос без FROM либо выдаёт строку, либо нет; здесь условие не TRUE.' },
        { text: 'Ошибку синтаксиса', why: 'Синтаксис верный.' },
      ],
      explanation: 'NULL в списке NOT IN «отравляет» результат — используйте NOT EXISTS.',
    },
    {
      id: `${S}.3`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 1,
      diag: true,
      prompt: "Верните имя клиента и email, подставив текст `'не указан'` вместо NULL: столбцы `name`, `email_shown`.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      starter: 'SELECT name, email AS email_shown\nFROM customers;',
      solution: "SELECT name, COALESCE(email, 'не указан') AS email_shown FROM customers;",
      hints: ['Нужна функция, возвращающая первое непустое значение из списка.', "`COALESCE(email, 'не указан')`."],
      explanation: 'COALESCE подставляет значение по умолчанию, если первый аргумент NULL.',
    },
    {
      id: `${S}.4`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: "Верните клиентов, чей город **не** `'Москва'`, включая клиентов с неизвестным городом (NULL): один столбец `name`.",
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      starter: "SELECT name\nFROM customers\nWHERE city <> 'Москва';",
      solution: "SELECT name FROM customers WHERE city <> 'Москва' OR city IS NULL;",
      hints: ['Для NULL результат `<>` — UNKNOWN, строка отбрасывается.', 'Добавьте второе условие через OR.'],
      explanation: 'Неравенство не пропускает NULL; их нужно включить явно через `OR city IS NULL`.',
    },
    {
      id: `${S}.5`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: "В таблице `contacts` телефон может быть NULL или пустой строкой `''`. Верните `name` и `phone_shown`: телефон или текст `'нет'`, если телефон отсутствует (NULL **или** пустая строка).",
      setup: CONTACTS,
      hiddenSetup: CONTACTS_HIDDEN,
      starter: "SELECT name, COALESCE(phone, 'нет') AS phone_shown\nFROM contacts;",
      solution: "SELECT name, COALESCE(NULLIF(phone, ''), 'нет') AS phone_shown FROM contacts;",
      hints: ['COALESCE видит только NULL, а пустая строка для него — значение.', 'NULLIF(phone, \'\') превращает пустую строку в NULL.'],
      explanation: 'NULLIF сначала превращает пустую строку в NULL, а COALESCE подставляет значение по умолчанию.',
    },
    {
      id: `${S}.6`,
      skill: S,
      kind: 'code',
      lang: 'sql',
      difficulty: 2,
      prompt: 'Посчитайте средний балл по всем записям `enrollments`, считая отсутствие оценки (NULL) за 0. Один столбец `avg_score`.',
      setup: SCHOOL,
      hiddenSetup: SCHOOL_HIDDEN,
      starter: 'SELECT AVG(score) AS avg_score\nFROM enrollments;',
      solution: 'SELECT AVG(COALESCE(score, 0)) AS avg_score FROM enrollments;',
      hints: ['Обычный AVG пропускает NULL.', 'Замените NULL на 0 внутри агрегата.'],
      explanation: '`AVG(COALESCE(score, 0))` включает неоценённые записи в делитель.',
    },
    {
      id: `${S}.7`,
      skill: S,
      kind: 'fix',
      lang: 'sql',
      difficulty: 3,
      bugType: 'edge',
      prompt: 'Запрос ищет клиентов без заказов (столбец `name`). На текущих данных он работает, но после появления гостевого заказа (`customer_id IS NULL`) начинает возвращать пустой результат. Исправьте.',
      setup: SHOP,
      hiddenSetup: SHOP_HIDDEN,
      buggy: 'SELECT name\nFROM customers\nWHERE id NOT IN (SELECT customer_id FROM orders);',
      solution: 'SELECT name FROM customers AS c WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);',
      hints: ['Что делает NOT IN, если в подзапросе встречается NULL?', 'Используйте NOT EXISTS либо добавьте в подзапрос `WHERE customer_id IS NOT NULL`.'],
      explanation: 'NOT IN с NULL в списке не бывает истинным. NOT EXISTS сравнивает только реальные связи.',
    },
    {
      id: `${S}.8`,
      skill: S,
      kind: 'explain',
      difficulty: 2,
      prompt: "Почему запрос `SELECT name FROM customers WHERE city <> 'Москва'` не вернёт клиента с `city = NULL`, хотя NULL, казалось бы, «не Москва»? Как исправить, если такой клиент нужен?",
      lang: 'sql',
      code: "SELECT name\nFROM customers\nWHERE city <> 'Москва';",
      keyPoints: [
        'NULL означает «неизвестно», а не «другое значение»',
        'Сравнение с NULL даёт UNKNOWN, а WHERE пропускает только TRUE',
        'Нужно явно добавить `OR city IS NULL`',
      ],
      modelAnswer:
        'NULL — это неизвестное значение: нельзя утверждать ни что город равен Москве, ни что не равен. Поэтому `city <> \'Москва\'` для NULL даёт UNKNOWN, а WHERE оставляет только строки с результатом TRUE. Если такие клиенты нужны, нужно записать `WHERE city <> \'Москва\' OR city IS NULL`.',
      explanation: 'Трёхзначная логика: в WHERE проходят только строки, для которых условие точно истинно.',
    },
  ],
};
