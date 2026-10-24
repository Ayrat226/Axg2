export interface NavItem {
  path: string;
  icon: string;
  label: string;
  match: string;
}

export const NAV: NavItem[] = [
  { path: '/', icon: '🏠', label: 'Главная', match: '' },
  { path: '/routes', icon: '🧭', label: 'Маршруты', match: 'routes' },
  { path: '/map', icon: '🗺️', label: 'Карта навыков', match: 'map' },
  { path: '/review', icon: '🔁', label: 'Повторение', match: 'review' },
  { path: '/mistakes', icon: '🩹', label: 'Работа над ошибками', match: 'mistakes' },
  { path: '/projects', icon: '🛠️', label: 'Проекты', match: 'projects' },
  { path: '/playground', icon: '🧪', label: 'Песочница', match: 'playground' },
  { path: '/progress', icon: '📈', label: 'Прогресс и портфолио', match: 'progress' },
];
export const SETTINGS_NAV: NavItem = { path: '/settings', icon: '⚙️', label: 'Настройки', match: 'settings' };
