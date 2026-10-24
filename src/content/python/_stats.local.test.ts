import { it } from 'vitest';
import { pythonRoute as r } from './index';
it('stats', () => {
  for (const s of r.skills) {
    const ex = r.exercises.filter((e) => e.skill === s.id);
    const kinds: Record<string, number> = {};
    ex.forEach((e) => (kinds[e.kind] = (kinds[e.kind] || 0) + 1));
    console.log(s.id, 'tier', s.tier, 'prereqs', s.prereqs.join(','), 'n=' + ex.length, JSON.stringify(kinds), 'diag=' + ex.filter((e) => e.diag).map((e) => e.kind).join('+'));
  }
  console.log(r.projects.map((p) => p.id + ':' + p.steps.length).join(' '), 'total ex', r.exercises.length);
});
