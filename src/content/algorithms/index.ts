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

export const algorithmsRoute = buildRoute(
  { id: 'algorithms', title: 'Алгоритмы', tagline: '', description: '', lang: 'python', icon: '🧠', color: '#b06cff', outcomes: [] },
  [complexity, search, twoPointers, hashing, sorting, recursion, stacksQueues, linkedTrees, graphs, dp],
);
