import { buildRoute } from '../../core/types';
import { select } from './select';
import { where } from './where';
import { sortLimit } from './sortLimit';
import { aggregates } from './aggregates';
import { groupBy } from './groupBy';
import { joins } from './joins';
import { subqueries } from './subqueries';
import { nulls } from './nulls';
import { dml } from './dml';
import { ddl } from './ddl';
import { windowFns } from './window';
import { caseStringsDates } from './caseStringsDates';

export const sqlRoute = buildRoute(
  {
    id: 'sql',
    title: 'SQL',
    tagline: 'Задавайте вопросы данным: от первого SELECT до оконных функций и собеседований.',
    description:
      'Практический курс по SQL на движке SQLite, который работает прямо в браузере. Вы научитесь выбирать, фильтровать и сортировать данные, считать агрегаты и группы, соединять таблицы, писать подзапросы и CTE, безопасно обращаться с NULL, изменять данные и проектировать схему, а затем освоите оконные функции. Каждое упражнение проверяется на двух наборах данных — видимом и скрытом, — поэтому «подогнать» ответ под пример не получится: запрос должен быть действительно верным, в том числе на пустых значениях, повторах и «пустых» группах.',
    lang: 'sql',
    icon: '🗄️',
    color: '#22c3a6',
    outcomes: [
      'Пишу запросы SELECT с фильтрацией, сортировкой, ограничением выдачи и постраничным выводом',
      'Считаю метрики по группам: GROUP BY, HAVING, агрегаты и условная агрегация',
      'Соединяю несколько таблиц (INNER/LEFT JOIN, self-join), нахожу строки без пары и не теряю и не размножаю данные',
      'Решаю двухшаговые задачи подзапросами, EXISTS, CTE и оконными функциями (рейтинги, нарастающие итоги, топ-N в группе)',
      'Корректно обращаюсь с NULL и трёхзначной логикой, избегая тихих ошибок вроде NOT IN с NULL',
      'Безопасно изменяю данные (INSERT/UPDATE/DELETE/UPSERT, транзакции) и проектирую схему с ограничениями и индексами',
    ],
  },
  [
    select,
    where,
    sortLimit,
    aggregates,
    nulls,
    groupBy,
    joins,
    subqueries,
    caseStringsDates,
    dml,
    ddl,
    windowFns,
  ],
);
