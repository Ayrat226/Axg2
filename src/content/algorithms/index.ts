import { buildRoute } from '../../core/types';
import { complexity } from './complexity';
import { search } from './search';
import { twoPointers } from './two-pointers';
import { hashing } from './hashing';
import { sorting } from './sorting';
import { recursion } from './recursion';
import { stacksQueues } from './stacks-queues';
import { linkedTrees } from './linked-trees';
import { graphs } from './graphs';
import { dp } from './dp';
import { greedy } from './greedy';
import { heaps } from './heaps';
import { algorithmsProjects } from './projects';

export const algorithmsRoute = buildRoute(
  {
    id: 'algorithms',
    title: 'Алгоритмы',
    tagline: 'Научитесь мыслить как инженер: оценивать скорость решения, выбирать структуру данных и узнавать задачу в лицо.',
    description:
      'Маршрут от Big-O до алгоритма Дейкстры: двенадцать тем с интерактивными задачами на Python. Вы оцениваете сложность, пишете бинарный поиск и сортировки, ускоряете код хеш-таблицами, два указателя и окна, обходите деревья и графы, решаете задачи динамикой, жадностью и кучами. Каждая тема — от интуиции и контрпримеров до доказательств, с большими скрытыми тестами, которые отсеивают медленные решения, и двумя проектами: навигатор по метро и автодополнение.',
    lang: 'python',
    icon: '🧠',
    color: '#b06cff',
    outcomes: [
      'Оцениваю время и память решения в нотации O(…) и выбираю подход под ограничения задачи',
      'Пишу бинарный поиск, сортировки, обходы деревьев и графов без ошибок «на единицу»',
      'Ускоряю наивные O(n²) решения: хеш-таблицы, два указателя, скользящее окно, префиксные суммы, стеки и кучи',
      'Решаю задачи динамическим программированием и жадными алгоритмами и умею обосновать корректность',
      'Нахожу кратчайшие пути: BFS на графах и сетках, алгоритм Дейкстры во взвешенных графах',
      'Готов к алгоритмическому собеседованию: узнаю шаблон задачи и объясняю решение словами',
    ],
  },
  [complexity, search, twoPointers, hashing, sorting, recursion, stacksQueues, linkedTrees, graphs, dp, greedy, heaps],
  algorithmsProjects,
);
