import { buildRoute } from '../../core/types';
import { select } from './select';

export const sqlRoute = buildRoute(
  { id: 'sql', title: 'SQL', tagline: '', description: '', lang: 'sql', icon: '🗄️', color: '#22c3a6', outcomes: [] },
  [select],
);
