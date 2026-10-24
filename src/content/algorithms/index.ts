import { buildRoute } from '../../core/types';
import { complexity } from './complexity';
import { search } from './search';
import { twoPointers } from './two-pointers';
import { hashing } from './hashing';

export const algorithmsRoute = buildRoute(
  { id: 'algorithms', title: 'Алгоритмы', tagline: '', description: '', lang: 'python', icon: '🧠', color: '#b06cff', outcomes: [] },
  [complexity, search, twoPointers, hashing],
);
