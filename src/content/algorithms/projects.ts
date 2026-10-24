import type { Project } from '../../core/types';
import { h, py, t } from './_kit';

const EDGES = '[("A", "B"), ("B", "C"), ("C", "D"), ("B", "E"), ("E", "D"), ("F", "G")]';
const LINKS = '[("A", "P", "L1"), ("P", "Q", "L2"), ("Q", "D", "L3"), ("A", "R", "L4"), ("R", "S", "L4"), ("S", "T", "L4"), ("T", "U", "L4"), ("U", "D", "L4")]';
const TIMED = '[("A", "B", 4), ("A", "C", 1), ("C", "B", 2), ("B", "D", 5), ("C", "D", 8)]';

const metroStep1 = py`
  def build_graph(edges):
      graph = {}
      for a, b in edges:
          graph.setdefault(a, [])
          graph.setdefault(b, [])
          if b not in graph[a]:
              graph[a].append(b)
          if a not in graph[b]:
              graph[b].append(a)
      return graph
`;

const metroHead = py`
  from collections import deque
  import heapq

`;

const metroRouteLength = py`

  def route_length(graph, start, goal):
      if start not in graph or goal not in graph:
          return -1
      dist = {start: 0}
      queue = deque([start])
      while queue:
          v = queue.popleft()
          if v == goal:
              return dist[v]
          for u in graph[v]:
              if u not in dist:
                  dist[u] = dist[v] + 1
                  queue.append(u)
      return -1
`;

const metroFindRoute = py`

  def find_route(graph, start, goal):
      if start not in graph or goal not in graph:
          return []
      parent = {start: None}
      queue = deque([start])
      while queue:
          v = queue.popleft()
          if v == goal:
              break
          for u in graph[v]:
              if u not in parent:
                  parent[u] = v
                  queue.append(u)
      if goal not in parent:
          return []
      path = []
      while goal is not None:
          path.append(goal)
          goal = parent[goal]
      return path[::-1]
`;

const metroTransfers = py`

  def fewest_transfers(links, start, goal):
      adj = {}
      lines_at = {}
      for u, v, line in links:
          adj.setdefault(u, []).append((v, line))
          adj.setdefault(v, []).append((u, line))
          lines_at.setdefault(u, set()).add(line)
          lines_at.setdefault(v, set()).add(line)
      if start not in adj or goal not in adj:
          return -1
      if start == goal:
          return 0
      INF = float("inf")
      dist = {}
      heap = []
      for line in lines_at[start]:
          dist[(start, line)] = 0
          heap.append((0, start, line))
      heapq.heapify(heap)
      while heap:
          d, v, line = heapq.heappop(heap)
          if d > dist.get((v, line), INF):
              continue
          if v == goal:
              return d
          for u, l2 in adj[v]:
              if l2 == line and d < dist.get((u, l2), INF):
                  dist[(u, l2)] = d
                  heapq.heappush(heap, (d, u, l2))
          for l2 in lines_at[v]:
              if l2 != line and d + 1 < dist.get((v, l2), INF):
                  dist[(v, l2)] = d + 1
                  heapq.heappush(heap, (d + 1, v, l2))
      return -1
`;

const metroFastest = py`

  def fastest_route(links, start, goal):
      adj = {}
      for u, v, minutes in links:
          adj.setdefault(u, []).append((v, minutes))
          adj.setdefault(v, []).append((u, minutes))
      if start not in adj or goal not in adj:
          return (-1, [])
      dist = {start: 0}
      parent = {start: None}
      heap = [(0, start)]
      while heap:
          d, v = heapq.heappop(heap)
          if d > dist[v]:
              continue
          if v == goal:
              break
          for u, w in adj[v]:
              nd = d + w
              if nd < dist.get(u, float("inf")):
                  dist[u] = nd
                  parent[u] = v
                  heapq.heappush(heap, (nd, u))
      if goal not in dist:
          return (-1, [])
      path = []
      node = goal
      while node is not None:
          path.append(node)
          node = parent[node]
      return (dist[goal], path[::-1])
`;

const metro: Project = {
  id: 'algo-metro',
  route: 'algorithms',
  title: 'Навигатор по метро',
  summary: 'Строим карту метро как граф и учим её находить маршруты: самый короткий по станциям, с минимумом пересадок и самый быстрый по времени.',
  lang: 'python',
  prereqs: ['algo.hashing', 'algo.graphs', 'algo.heaps'],
  starter: py`
    # Навигатор по метро. Добавляйте функции шаг за шагом.
    def build_graph(edges):
        return {}
  `,
  steps: [
    {
      title: 'Карта: граф из списка перегонов',
      prompt: 'Напишите build_graph(edges): по списку перегонов (пар названий станций) верните словарь смежности «станция → список соседей». Перегоны двусторонние; соседи идут в порядке появления; повторяющийся перегон не дублируется.',
      tests: [
        t(`build_graph([("A", "B"), ("B", "C")])`, '{"A": ["B"], "B": ["A", "C"], "C": ["B"]}'),
        h('пустая карта', 'build_graph([])', '{}'),
        h('повторяющиеся перегоны не дублируются', 'build_graph([("A", "B"), ("B", "A"), ("A", "B")])', '{"A": ["B"], "B": ["A"]}'),
        h('развилка: порядок соседей', 'build_graph([("X", "Y"), ("X", "Z")])["X"]', '["Y", "Z"]'),
        h('n = 10⁵ перегонов', 'len(build_graph([(i, i + 1) for i in range(100000)]))', '100001'),
      ],
      hints: ['Для каждого перегона (a, b) добавьте b в список соседей a и a — в список соседей b.', 'setdefault(a, []) создаёт список, если станции ещё нет.'],
      solution: metroStep1,
    },
    {
      title: 'Сколько станций ехать? (BFS)',
      prompt: 'Напишите route_length(graph, start, goal): минимальное число перегонов между станциями или -1, если маршрута нет (в том числе если станции нет на карте). Используйте поиск в ширину.',
      tests: [
        t(`route_length(build_graph(${EDGES}), "A", "D")`, '3'),
        h('та же станция', `route_length(build_graph(${EDGES}), "B", "B")`, '0'),
        h('станции в разных частях карты', `route_length(build_graph(${EDGES}), "A", "G")`, '-1'),
        h('неизвестная станция', `route_length(build_graph(${EDGES}), "A", "Z")`, '-1'),
        h('соседние станции', `route_length(build_graph(${EDGES}), "F", "G")`, '1'),
        h('длинная линия (10⁵ станций)', 'route_length(build_graph([(i, i + 1) for i in range(99999)]), 0, 99999)', '99999'),
      ],
      hints: ['Очередь deque и словарь расстояний; пометка станции при добавлении в очередь.', 'Если очередь опустела, а цели нет — верните -1.'],
      solution: metroHead + metroStep1 + metroRouteLength,
    },
    {
      title: 'Маршрут целиком',
      prompt: 'Напишите find_route(graph, start, goal): список станций кратчайшего маршрута (включая начальную и конечную) или [] если маршрута нет. Если кратчайших маршрутов несколько, верните тот, который находит BFS первым при обходе соседей в порядке графа.',
      tests: [
        t(`find_route(build_graph(${EDGES}), "A", "D")`, '["A", "B", "C", "D"]'),
        h('та же станция', `find_route(build_graph(${EDGES}), "E", "E")`, '["E"]'),
        h('маршрута нет', `find_route(build_graph(${EDGES}), "A", "F")`, '[]'),
        h('неизвестная станция', `find_route(build_graph(${EDGES}), "Z", "A")`, '[]'),
        h('короткий путь через пересадку', `find_route(build_graph(${EDGES}), "E", "C")`, '["E", "B", "C"]'),
        h('длинная линия (10⁵ станций)', 'len(find_route(build_graph([(i, i + 1) for i in range(99999)]), 0, 99999))', '100000'),
      ],
      hints: ['Во время BFS запоминайте родителя: parent[u] = v.', 'От цели идите по родителям назад и разверните полученный список.'],
      solution: metroHead + metroStep1 + metroRouteLength + metroFindRoute,
    },
    {
      title: 'Минимум пересадок',
      prompt: 'Теперь у перегонов есть линия: (станция1, станция2, "линия"). Напишите fewest_transfers(links, start, goal): минимальное число пересадок (смен линии) между станциями или -1. Станции могут принадлежать нескольким линиям; пересадка возможна на любой станции, лежащей на обеих линиях. Подсказка: состоянием графа должна быть пара (станция, линия), ехать по той же линии стоит 0, а смена линии — 1.',
      tests: [
        t(`fewest_transfers(${LINKS}, "A", "D")`, '0'),
        t(`fewest_transfers(${LINKS}, "A", "Q")`, '1'),
        h('та же станция', `fewest_transfers(${LINKS}, "P", "P")`, '0'),
        h('неизвестная станция', `fewest_transfers(${LINKS}, "A", "Z")`, '-1'),
        h('две линии: одна пересадка', 'fewest_transfers([("A", "B", "red"), ("B", "C", "blue")], "A", "C")', '1'),
        h('разные части карты', 'fewest_transfers([("A", "B", "red"), ("C", "D", "blue")], "A", "D")', '-1'),
        h('две пересадки', 'fewest_transfers([("A", "B", "x"), ("B", "C", "y"), ("C", "D", "z")], "A", "D")', '2'),
      ],
      hints: [
        'Состояние — (станция, линия). Рёбра: по той же линии (стоимость 0) и «пересадка» на другую линию той же станции (стоимость 1).',
        'Это кратчайший путь с весами 0 и 1: годится Дейкстра на heapq (или 0–1 BFS на deque).',
        'Стартуйте со всех линий начальной станции со стоимостью 0; ответ — стоимость первого извлечения целевой станции.',
      ],
      solution: metroHead + metroStep1 + metroRouteLength + metroFindRoute + metroTransfers,
    },
    {
      title: 'Самый быстрый маршрут (Дейкстра)',
      prompt: 'Каждый перегон занимает разное число минут: (станция1, станция2, минуты). Напишите fastest_route(links, start, goal): кортеж (всего минут, список станций) самого быстрого маршрута или (-1, []) если маршрута нет. Перегоны двусторонние. В тестах быстрейший маршрут единственный.',
      tests: [
        t(`fastest_route(${TIMED}, "A", "D")`, '(8, ["A", "C", "B", "D"])'),
        h('та же станция', `fastest_route(${TIMED}, "B", "B")`, '(0, ["B"])'),
        h('неизвестная станция', `fastest_route(${TIMED}, "A", "Z")`, '(-1, [])'),
        h('нет маршрута', 'fastest_route([("A", "B", 1), ("C", "D", 1)], "A", "D")', '(-1, [])'),
        h('прямой перегон дольше обходного', 'fastest_route([("A", "B", 10), ("A", "C", 1), ("C", "B", 1)], "A", "B")', '(2, ["A", "C", "B"])'),
        h('длинная линия (2·10⁴ станций)', 'fastest_route([(i, i + 1, 1) for i in range(19999)], 0, 19999)[0]', '19999'),
      ],
      hints: [
        'В куче лежат пары (минуты, станция); извлекаем ближайшую необработанную станцию.',
        'Храните parent, чтобы восстановить путь, и пропускайте устаревшие записи кучи (d > dist[v]).',
        'Когда станция-цель извлечена из кучи — её время окончательное, можно останавливаться.',
      ],
      solution: metroHead + metroStep1 + metroRouteLength + metroFindRoute + metroTransfers + metroFastest,
    },
  ],
};

const acHead = py`
  from bisect import bisect_left
  import heapq

`;

const acIndex = py`
  def build_index(words):
      return sorted({w.lower() for w in words})
`;

const acComplete = py`

  def complete(index, prefix):
      prefix = prefix.lower()
      lo = bisect_left(index, prefix)
      hi = bisect_left(index, prefix + "\uffff")
      return index[lo:hi]
`;

const acTrie = py`

  def build_trie(words):
      root = {}
      for w in words:
          node = root
          for ch in w.lower():
              node = node.setdefault(ch, {})
          node["$"] = True
      return root


  def trie_complete(trie, prefix):
      prefix = prefix.lower()
      node = trie
      for ch in prefix:
          if ch not in node:
              return []
          node = node[ch]
      result = []
      stack = [(node, prefix)]
      while stack:
          cur, text = stack.pop()
          if "$" in cur:
              result.append(text)
          for ch, child in cur.items():
              if ch != "$":
                  stack.append((child, text + ch))
      return sorted(result)
`;

const acSuggest = py`

  def suggest(freq, prefix, k):
      candidates = trie_complete(build_trie(freq), prefix)
      return heapq.nsmallest(k, candidates, key=lambda w: (-freq[w], w))
`;

const acSession = py`

  def session(events):
      freq = {}
      answers = []
      for event in events:
          if event[0] == "add":
              word = event[1].lower()
              freq[word] = freq.get(word, 0) + 1
          else:
              _, prefix, k = event
              answers.append(suggest(freq, prefix, k))
      return answers
`;

const WORDS = '["apple", "apply", "ape", "banana", "band", "bandana", "cat"]';

const autocomplete: Project = {
  id: 'algo-autocomplete',
  route: 'algorithms',
  title: 'Автодополнение',
  summary: 'Строим подсказки поиска: отсортированный индекс и bisect, затем префиксное дерево (trie), затем топ-k самых частых слов через кучу и поток событий.',
  lang: 'python',
  prereqs: ['algo.search', 'algo.sorting', 'algo.hashing', 'algo.heaps'],
  starter: py`
    # Автодополнение. Добавляйте функции шаг за шагом.
    def build_index(words):
        return []
  `,
  steps: [
    {
      title: 'Индекс слов',
      prompt: 'Напишите build_index(words): верните отсортированный по алфавиту список уникальных слов в нижнем регистре.',
      tests: [
        t('build_index(["Banana", "apple", "apple", "Cherry"])', '["apple", "banana", "cherry"]'),
        h('пустой список', 'build_index([])', '[]'),
        h('регистр: одно и то же слово', 'build_index(["Cat", "cat", "CAT"])', '["cat"]'),
        h('исходный список не меняется', '(lambda w: (build_index(w), w))(["b", "a"])', '(["a", "b"], ["b", "a"])'),
        h('n = 10⁵ слов с повторами', 'len(build_index(["w%d" % (i % 5000) for i in range(100000)]))', '5000'),
      ],
      hints: ['Множество убирает дубликаты, sorted упорядочивает.', 'Не забудьте w.lower().'],
      solution: acIndex,
    },
    {
      title: 'Подсказки через bisect',
      prompt: 'Напишите complete(index, prefix): все слова индекса, начинающиеся с prefix (без учёта регистра у prefix), в алфавитном порядке. Решение должно использовать бинарный поиск: за O(log n + ответ), а не просмотр всех слов. Пустой префикс даёт все слова.',
      tests: [
        t(`complete(build_index(${WORDS}), "ap")`, '["ape", "apple", "apply"]'),
        h('префикс без совпадений', `complete(build_index(${WORDS}), "z")`, '[]'),
        h('пустой префикс — все слова', `complete(build_index(${WORDS}), "")`, '["ape", "apple", "apply", "banana", "band", "bandana", "cat"]'),
        h('префикс равен слову', `complete(build_index(${WORDS}), "band")`, '["band", "bandana"]'),
        h('регистр префикса', `complete(build_index(${WORDS}), "BA")`, '["banana", "band", "bandana"]'),
        h('пустой индекс', 'complete([], "a")', '[]'),
        h(
          '10⁵ слов, 5000 запросов',
          '(lambda idx: sum(len(complete(idx, "w%05d" % (i % 1000))) for i in range(5000)))(["w%06d" % i for i in range(100000)])',
          '50000',
        ),
      ],
      hints: [
        'Слова с общим префиксом в отсортированном списке образуют непрерывный блок.',
        'Левая граница блока — bisect_left(index, prefix).',
        'Правая — bisect_left(index, prefix + "\\uffff"): «символ больше любого обычного».',
      ],
      solution: acHead + acIndex + acComplete,
    },
    {
      title: 'Префиксное дерево (trie)',
      prompt: 'Постройте trie. build_trie(words) — вложенные словари: ключ — буква, специальный ключ "$" помечает конец слова. trie_complete(trie, prefix) — список всех слов с этим префиксом в алфавитном порядке. Слова приводите к нижнему регистру. Обход делайте без рекурсии.',
      tests: [
        t(`trie_complete(build_trie(${WORDS}), "ap")`, '["ape", "apple", "apply"]'),
        h('нет совпадений', `trie_complete(build_trie(${WORDS}), "bz")`, '[]'),
        h('префикс равен слову', `trie_complete(build_trie(${WORDS}), "ape")`, '["ape"]'),
        h('пустой префикс', `trie_complete(build_trie(${WORDS}), "")`, '["ape", "apple", "apply", "banana", "band", "bandana", "cat"]'),
        h('пустое дерево', 'trie_complete(build_trie([]), "a")', '[]'),
        h('дубликаты слов', 'trie_complete(build_trie(["go", "go", "Go"]), "g")', '["go"]'),
        h('структура: вложенные словари', 'build_trie(["ab"])', '{"a": {"b": {"$": True}}}'),
      ],
      hints: [
        'Для каждой буквы слова спускайтесь в дочерний словарь: node = node.setdefault(ch, {}).',
        'После последней буквы запишите node["$"] = True.',
        'Для подсказок спуститесь по префиксу, затем соберите все слова поддерева стеком и отсортируйте.',
      ],
      solution: acHead + acIndex + acComplete + acTrie,
    },
    {
      title: 'Топ-k самых частых',
      prompt: 'Напишите suggest(freq, prefix, k): freq — словарь «слово (в нижнем регистре) → частота». Верните не более k слов с данным префиксом: сначала более частые, при равной частоте — по алфавиту. Используйте trie_complete и кучу (heapq.nsmallest с ключом).',
      tests: [
        t('suggest({"apple": 5, "apply": 9, "ape": 5}, "ap", 2)', '["apply", "ape"]'),
        h('k больше числа кандидатов', 'suggest({"a": 1, "ab": 2}, "a", 10)', '["ab", "a"]'),
        h('k = 0', 'suggest({"a": 1}, "a", 0)', '[]'),
        h('нет совпадений', 'suggest({"a": 1}, "z", 3)', '[]'),
        h('равные частоты — по алфавиту', 'suggest({"b": 2, "a": 2, "c": 2}, "", 2)', '["a", "b"]'),
        h(
          '20 000 слов',
          'suggest({"w%05d" % i: i % 100 for i in range(20000)}, "w0", 3)',
          '["w00099", "w00199", "w00299"]',
        ),
      ],
      hints: [
        'Кандидаты: trie_complete(build_trie(freq), prefix) — итерация по словарю даёт его ключи.',
        'heapq.nsmallest(k, кандидаты, key=...) с ключом (−частота, слово) даст нужный порядок.',
      ],
      solution: acHead + acIndex + acComplete + acTrie + acSuggest,
    },
    {
      title: 'Живой поток запросов',
      prompt: 'Подсказки должны учиться на ходу. session(events): события — кортежи ("add", слово) (слово набрали: частота +1, регистр не важен) и ("query", префикс, k). Верните список ответов suggest для каждого "query" в порядке событий.',
      tests: [
        t('session([("add", "cat"), ("add", "car"), ("add", "cat"), ("query", "ca", 2)])', '[["cat", "car"]]'),
        h('нет запросов', 'session([("add", "a")])', '[]'),
        h('запрос до добавлений', 'session([("query", "a", 3)])', '[[]]'),
        h('ответы меняются по мере обучения', 'session([("add", "go"), ("add", "gone"), ("query", "g", 1), ("add", "gone"), ("add", "gone"), ("query", "g", 1)])', '[["go"], ["gone"]]'),
        h('регистр слов не важен', 'session([("add", "Hi"), ("add", "hI"), ("query", "h", 1)])', '[["hi"]]'),
        h('пустые события', 'session([])', '[]'),
      ],
      hints: ['Ведите словарь частот и обновляйте его на add.', 'На query вызывайте suggest(freq, prefix, k) и складывайте результат в список ответов.'],
      solution: acHead + acIndex + acComplete + acTrie + acSuggest + acSession,
    },
  ],
};

export const algorithmsProjects: Project[] = [metro, autocomplete];
