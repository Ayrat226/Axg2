import { buildRoute } from '../../core/types';
import { select } from './select';
import { where } from './where';
import { sortLimit } from './sortLimit';
import { aggregates } from './aggregates';
import { groupBy } from './groupBy';

export const sqlRoute = buildRoute(
  { id: 'sql', title: 'SQL', tagline: '', description: '', lang: 'sql', icon: '🗄️', color: '#22c3a6', outcomes: [] },
  [select, where, sortLimit, aggregates, groupBy],
);
