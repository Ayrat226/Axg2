import { buildRoute } from '../../core/types';
import { variables } from './variables';
import { types } from './types';
import { strings } from './strings';
import { conditions } from './conditions';

export const pythonRoute = buildRoute(
  {
    id: 'python',
    title: 'Python',
    tagline: 'От первой строки до ООП и генераторов',
    description: 'Системный курс Python: типы, управление потоком, коллекции, функции, исключения, ООП, итераторы.',
    lang: 'python',
    icon: '🐍',
    color: '#4f8cff',
    outcomes: ['Пишу и отлаживаю программы на Python', 'Читаю трейсбеки', 'Использую коллекции и функции'],
  },
  [variables, types, strings, conditions],
);
