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
  { path: '/daily', icon: '🎯', label: 'Вызов дня', match: 'daily' },
  { path: '/bughunt', icon: '🐞', label: 'Охота на баги', match: 'bughunt' },
  { path: '/mistakes', icon: '🩹', label: 'Разбор ошибок', match: 'mistakes' },
  { path: '/projects', icon: '🛠️', label: 'Проекты', match: 'projects' },
  { path: '/playground', icon: '🧪', label: 'Песочница', match: 'playground' },
  { path: '/progress', icon: '📈', label: 'Прогресс', match: 'progress' },
];
export const SETTINGS_NAV: NavItem = { path: '/settings', icon: '⚙️', label: 'Настройки', match: 'settings' };
