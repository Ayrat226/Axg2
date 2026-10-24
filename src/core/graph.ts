import type { Skill } from './types';

export interface SkillGraph {
  ids: string[];
  byId: Map<string, Skill>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  /** Topological order (prerequisites first, then tier, then declaration order). */
  topo: string[];
  /** Longest prerequisite chain length within the graph (0 for roots). */
  depth: Map<string, number>;
  ancestors(id: string): Map<string, number>;
  descendants(id: string): Map<string, number>;
}

/** Graph restricted to `skills`; prerequisites outside the set are ignored. */
export function buildGraph(skills: Skill[]): SkillGraph {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const s of skills) {
    parents.set(s.id, s.prereqs.filter((p) => byId.has(p)));
    children.set(s.id, []);
  }
  for (const s of skills) for (const p of parents.get(s.id)!) children.get(p)!.push(s.id);

  const depth = new Map<string, number>();
  const depthOf = (id: string, guard = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (guard.has(id)) return 0;
    guard.add(id);
    const d = Math.max(-1, ...parents.get(id)!.map((p) => depthOf(p, guard))) + 1;
    depth.set(id, d);
    return d;
  };
  skills.forEach((s) => depthOf(s.id));
  const order = new Map(skills.map((s, i) => [s.id, i]));
  const topo = [...skills.map((s) => s.id)].sort(
    (a, b) => depth.get(a)! - depth.get(b)! || byId.get(a)!.tier - byId.get(b)!.tier || order.get(a)! - order.get(b)!,
  );

  const walk = (start: string, next: Map<string, string[]>) => {
    const dist = new Map<string, number>();
    const queue: [string, number][] = next.get(start)!.map((n) => [n, 1]);
    while (queue.length) {
      const [id, d] = queue.shift()!;
      if (dist.has(id)) continue;
      dist.set(id, d);
      for (const n of next.get(id) ?? []) queue.push([n, d + 1]);
    }
    return dist;
  };
  return {
    ids: skills.map((s) => s.id),
    byId,
    parents,
    children,
    topo,
    depth,
    ancestors: (id) => walk(id, parents),
    descendants: (id) => walk(id, children),
  };
}
