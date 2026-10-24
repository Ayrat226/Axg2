import { buildRoute } from '../../core/types';
import { basics } from './basics';
import { types } from './types';
import { strings } from './strings';
import { conditions } from './conditions';
import { loops } from './loops';
import { arrays } from './arrays';
import { objects } from './objects';
import { functions } from './functions';

export const javascriptRoute = buildRoute(
  {
    id: 'javascript',
    title: 'JavaScript',
    tagline: 'Язык веба: от первой переменной до async/await — с живым кодом и проверкой на каждом шагу.',
    description:
      'Полный маршрут по современному JavaScript (ES2023): типы и их причуды, функции и замыкания, массивы и объекты, классы, ошибки, асинхронность и итераторы. Каждая тема — короткий урок, ловушки, которые реально встречаются в коде, и задания разных видов: предсказать вывод, починить баг, собрать программу, объяснить своими словами. Два итоговых проекта закрепляют всё на мини-приложениях.',
    lang: 'javascript',
    icon: '🟨',
    color: '#f7c948',
    outcomes: [
      'Уверенно читаю и пишу современный JavaScript: let/const, стрелочные функции, деструктуризация, spread/rest',
      'Понимаю причуды типов и приведения (==, NaN, truthy/falsy, null vs undefined) и умею их обходить',
      'Работаю с массивами и объектами в функциональном стиле: map/filter/reduce, копирование без мутаций',
      'Объясняю замыкания, область видимости, hoisting и this — и нахожу связанные с ними баги',
      'Читаю сообщения об ошибках, использую try/catch/finally и собственные классы ошибок',
      'Понимаю event loop, Promise и async/await и умею писать надёжный асинхронный код',
      'Использую классы, итераторы, генераторы, Map и Set для чистой архитектуры небольших программ',
    ],
  },
  [basics, types, strings, conditions, loops, arrays, objects, functions],
  [],
);
