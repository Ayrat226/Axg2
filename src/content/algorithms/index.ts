import { buildRoute } from '../../core/types';
import { complexity } from './complexity';

export const algorithmsRoute = buildRoute(
  { id: 'algorithms', title: 'Алгоритмы', tagline: '', description: '', lang: 'python', icon: '🧠', color: '#b06cff', outcomes: [] },
  [complexity],
);
