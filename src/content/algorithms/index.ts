import { buildRoute } from '../../core/types';
import { complexity } from './complexity';
import { search } from './search';

export const algorithmsRoute = buildRoute(
  { id: 'algorithms', title: 'Алгоритмы', tagline: '', description: '', lang: 'python', icon: '🧠', color: '#b06cff', outcomes: [] },
  [complexity, search],
);
