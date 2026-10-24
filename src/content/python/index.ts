import { buildRoute } from '../../core/types';
import { variables } from './variables';
import { types } from './types';
import { strings } from './strings';
import { conditions } from './conditions';
import { loops } from './loops';
import { lists } from './lists';
import { dicts } from './dicts';
import { functions } from './functions';
import { errors } from './errors';
import { comprehensions } from './comprehensions';
import { oop } from './oop';
import { iterators } from './iterators';
import { modules } from './modules';
import { projects } from './projects';

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
  [variables, types, strings, conditions, loops, lists, dicts, functions, errors, comprehensions, oop, iterators, modules],
  projects,
);
