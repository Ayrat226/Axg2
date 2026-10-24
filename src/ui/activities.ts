import type { Activity } from '../core/planner';
import { ALL_PROJECTS, ROUTE_BY_ID, SKILL_BY_ID } from '../content';

export function activityView(a: Activity): { icon: string; title: string; link: string } {
  const sk = 'skill' in a ? SKILL_BY_ID.get(a.skill) : undefined;
  switch (a.type) {
    case 'diagnostic': return { icon: '🩺', title: `Умная диагностика: ${ROUTE_BY_ID.get(a.route)?.title}`, link: `/diag/${a.route}` };
    case 'check': return { icon: '⏰', title: `Отсроченная проверка: ${sk?.title}`, link: `/practice/${a.skill}?mode=check` };
    case 'review': return { icon: '🔁', title: `Повторение: ${a.skills.length} ${a.skills.length === 1 ? 'тема' : 'темы'}`, link: `/review?route=${SKILL_BY_ID.get(a.skills[0])?.route ?? ''}` };
    case 'verify': return { icon: '✅', title: `Подтвердить: ${sk?.title}`, link: `/practice/${a.skill}?mode=verify` };
    case 'learn': return { icon: sk?.icon ?? '📘', title: `Новая тема: ${sk?.title}`, link: `/skill/${a.skill}` };
    case 'practice': return { icon: '🏋️', title: `Практика: ${sk?.title}`, link: `/practice/${a.skill}` };
    case 'mistakes': return { icon: '🩹', title: `Работа над ошибками (${a.count})`, link: '/mistakes/practice' };
    case 'project': return { icon: '🛠️', title: `Проект: ${ALL_PROJECTS.find((p) => p.id === a.project)?.title}`, link: `/project/${a.project}` };
  }
}
