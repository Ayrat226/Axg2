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
    tagline: 'От первой строки до ООП и генераторов — с проверкой каждого шага',
    description:
      'Системный курс Python 3.14: 13 тем от переменных и типов до классов, исключений, генераторов и стандартной библиотеки. В каждой теме — урок трёх уровней глубины, 6–9 упражнений разных форматов (предсказание вывода, поиск бага, сборка кода, самообъяснение) с проверкой в браузере, диагностические вопросы для подбора маршрута и два сквозных проекта.',
    lang: 'python',
    icon: '🐍',
    color: '#4f8cff',
    outcomes: [
      'Пишу и отлаживаю программы на Python: условия, циклы, функции, классы',
      'Читаю трейсбеки и обрабатываю исключения через try/except, raise и собственные ошибки',
      'Уверенно использую списки, словари, множества, срезы и comprehensions',
      'Понимаю изменяемость, алиасинг и область видимости — главные источники багов новичков',
      'Пишу генераторы и использую стандартную библиотеку (collections, datetime, random, itertools)',
      'Довожу задачу до рабочей программы: разбор данных, проверка граничных случаев, аккуратный вывод',
    ],
  },
  [variables, types, strings, conditions, loops, lists, dicts, functions, errors, comprehensions, oop, iterators, modules],
  projects,
);
