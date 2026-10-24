import type { SkillModule } from '../../core/types';
import { code, defineSkill, explain, fix, h, mcq, md, no, numbered, ok, parsons, predict, py, t } from './_kit';

const ID = 'algo.linked-trees';

const LIST_KIT = py`
  class Node:
      def __init__(self, val, next=None):
          self.val = val
          self.next = next

  def from_list(values):
      head = None
      for v in reversed(values):
          head = Node(v, head)
      return head

  def to_list(head):
      out = []
      while head:
          out.append(head.val)
          head = head.next
      return out
`;

const TREE_KIT = py`
  class TreeNode:
      def __init__(self, val, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right
`;

export const linkedTrees: SkillModule = {
  skill: defineSkill({
    id: ID,
    title: 'Связные списки и бинарные деревья',
    icon: '🌳',
    summary: 'Узлы-объекты, обход списка и дерева (pre/in/post-order), BST: вставка и поиск, высота дерева.',
    prereqs: ['algo.recursion', 'algo.stacks-queues', 'py.oop'],
    tier: 3,
    interview: true,
    estMinutes: 55,
    outcomes: [
      'Строю связный список и бинарное дерево из объектов-узлов и обхожу их',
      'Разворачиваю список, нахожу цикл двумя указателями (быстрый и медленный)',
      'Пишу рекурсивные обходы pre/in/post-order и вычисляю высоту дерева',
      'Реализую вставку и поиск в бинарном дереве поиска и знаю, когда оно вырождается',
    ],
    lesson: {
      why: 'Узлы со ссылками — основа деревьев, графов, деревьев каталогов, DOM, абстрактных синтаксических деревьев и баз данных. Вопросы о списках и деревьях — самая частая тема технических интервью.',
      brief: 'Узел хранит значение и ссылки на соседей. Связный список: val + next. Бинарное дерево: val + left + right. Деревья обходят рекурсивно (структура рекурсии = структура данных). BST: слева меньше, справа больше; поиск и вставка O(h), где h — высота.',
      standard: md`
        ### Связный список
        Каждый узел знает только следующий. Доступ к i-му элементу — O(n) (идти по ссылкам), зато вставка после известного узла — O(1).

        §§§python
        class Node:
            def __init__(self, val, next=None):
                self.val = val
                self.next = next

        head = Node(1, Node(2, Node(3)))
        cur = head
        while cur:                 # обход: пока узел не None
            print(cur.val)
            cur = cur.next
        §§§

        **Разворот списка** — перенаправляем каждую ссылку назад:

        §§§python
        def reverse_list(head):
            prev = None
            while head:
                head.next, prev, head = prev, head, head.next
            return prev
        §§§

        **Цикл в списке** (алгоритм Флойда): быстрый указатель идёт по 2 шага, медленный — по 1. Если есть цикл, они встретятся.

        ### Бинарное дерево
        §§§python
        class TreeNode:
            def __init__(self, val, left=None, right=None):
                self.val, self.left, self.right = val, left, right
        §§§

        Три порядка обхода отличаются положением «посещения» корня:

        - **pre-order**: корень → левое → правое;
        - **in-order**: левое → корень → правое;
        - **post-order**: левое → правое → корень.

        §§§python
        def inorder(node):
            if node is None:               # база рекурсии
                return []
            return inorder(node.left) + [node.val] + inorder(node.right)
        §§§

        **Высота** дерева (число узлов на самом длинном пути от корня): §0§ для пустого, иначе §1 + max(height(left), height(right))§.

        ### Бинарное дерево поиска (BST)
        Для каждого узла: все значения в левом поддереве **меньше**, в правом — **больше**. Поэтому поиск, как бинарный: сравнили и пошли в одну сторону.

        §§§python
        def insert(root, val):
            if root is None:
                return TreeNode(val)
            if val < root.val:
                root.left = insert(root.left, val)
            elif val > root.val:
                root.right = insert(root.right, val)
            return root                    # равные значения не дублируем
        §§§

        In-order обход BST выдаёт значения **по возрастанию**.
      `,
      deep: md`
        **Сложность.** Поиск и вставка в BST — O(h), где h — высота. Для сбалансированного дерева h ≈ log₂ n, для «вытянутого» — n. Если вставлять уже отсортированные значения 1, 2, 3, …, каждое новое окажется правым потомком предыдущего — дерево превращается в связный список, а поиск становится O(n). Поэтому на практике используют **самобалансирующиеся** деревья (AVL, красно-чёрные, B-деревья).

        **Почему in-order на BST отсортирован.** Индукция по высоте: левое поддерево целиком меньше корня и по предположению выдаётся отсортированным, затем корень, затем правое поддерево, целиком большее корня.

        **Обходы через явный стек.** Рекурсивный обход ограничен глубиной стека Python; для глубоких «вытянутых» деревьев используйте итеративный:

        §§§python
        def inorder_iter(root):
            res, stack, cur = [], [], root
            while cur or stack:
                while cur:
                    stack.append(cur)
                    cur = cur.left
                cur = stack.pop()
                res.append(cur.val)
                cur = cur.right
            return res
        §§§

        **Обход по уровням (BFS)** использует очередь: берём узел, добавляем его детей. Результат — список по слоям.

        **Рекурсия на деревьях — шаблон.** Решение для узла выражается через решения для детей: база для §None§, затем комбинируем результаты. Высота, количество узлов, сумма, диаметр, проверка «является ли BST» — все по одному шаблону. Время — O(n) (каждый узел посещается один раз), память — O(h) на стек.

        **Связный список или массив?** В Python встроенный §list§ — динамический массив: индексирование O(1), вставка в середину O(n). Связный список выигрывает только при вставках/удалениях по известному узлу (например, в реализации LRU-кэша) и проигрывает по локальности памяти. В интервью списки — упражнение на работу с ссылками.

        **Три указателя разворота.** В §reverse_list§ важно сохранить §head.next§ до перенаправления ссылки — иначе потеряем хвост. Одновременное присваивание кортежем вычисляет правую часть до записи.

        **Алгоритм Флойда.** Если цикл есть, быстрый и медленный указатели оказываются в нём и расстояние между ними изменяется на 1 за шаг — они обязательно встретятся. Время O(n), память O(1) (в отличие от множества посещённых узлов — O(n)).
      `,
      analogy: 'Связный список — цепочка бумажных записок «следующая записка лежит в шкафу 17»: чтобы найти пятую, нужно пройти все предыдущие. Бинарное дерево — игра «больше/меньше»: каждый вопрос отсекает целую ветку.',
      example: {
        lang: 'python',
        code: py`
          class Node:
              def __init__(self, val, left=None, right=None):
                  self.val, self.left, self.right = val, left, right

          def preorder(n):
              return [] if n is None else [n.val] + preorder(n.left) + preorder(n.right)

          def inorder(n):
              return [] if n is None else inorder(n.left) + [n.val] + inorder(n.right)

          def postorder(n):
              return [] if n is None else postorder(n.left) + postorder(n.right) + [n.val]

          def height(n):
              return 0 if n is None else 1 + max(height(n.left), height(n.right))

          root = Node(4, Node(2, Node(1), Node(3)), Node(6, Node(5), Node(7)))
          print(preorder(root))
          print(inorder(root))
          print(postorder(root))
          print(height(root))
        `,
        steps: [
          'Дерево — BST: слева от каждого узла меньшие значения, справа большие.',
          'Pre-order сначала записывает корень: 4, затем всё левое поддерево (2, 1, 3), затем правое (6, 5, 7).',
          'In-order на BST даёт отсортированную последовательность 1…7.',
          'Post-order записывает корень последним, поэтому 4 стоит в конце. Высота — 3 узла по самому длинному пути.',
        ],
        output: '[4, 2, 1, 3, 6, 5, 7]\n[1, 2, 3, 4, 5, 6, 7]\n[1, 3, 2, 5, 7, 6, 4]\n3',
      },
      counterexample: {
        lang: 'python',
        code: py`
          root = None
          for v in [1, 2, 3, 4, 5]:        # вставляем отсортированные значения
              root = insert(root, v)
          # Дерево вытянулось в цепочку 1 → 2 → 3 → 4 → 5 по правым ссылкам.
          # Высота 5, поиск = O(n), а не O(log n).
        `,
        explain: 'BST быстрый только если он сбалансирован. Без балансировки порядок вставки определяет форму дерева, а отсортированный ввод даёт вырожденную цепочку.',
      },
      pitfalls: [
        'Не проверять §None§: обращение §node.val§ у пустого узла — AttributeError.',
        'Потерять ссылку при развороте: сначала нужно запомнить §head.next§, потом менять.',
        'Считать, что in-order любого бинарного дерева отсортирован: это верно только для BST.',
        'Забыть вернуть корень из рекурсивной вставки и потерять новое поддерево.',
        'Рассчитывать на O(log n) в BST без балансировки.',
        'Смешивать два определения высоты (в узлах и в рёбрах): выберите одно — например, пустое дерево = 0.',
      ],
      sources: [
        { title: 'Linked list — Wikipedia', url: 'https://en.wikipedia.org/wiki/Linked_list' },
        { title: 'Tree traversal — Wikipedia', url: 'https://en.wikipedia.org/wiki/Tree_traversal' },
        { title: 'Binary search tree — Wikipedia', url: 'https://en.wikipedia.org/wiki/Binary_search_tree' },
        { title: 'Cycle detection (Floyd) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Cycle_detection' },
        { title: 'Python docs — Classes', url: 'https://docs.python.org/3/tutorial/classes.html' },
      ],
    },
    misconceptions: [
      {
        id: 'inorder-always-sorted',
        title: 'In-order обход любого бинарного дерева выдаёт отсортированный список',
        explanation: 'Порядок значений обхода определяется их расположением. Только в дереве поиска левое меньше корня, а правое — больше.',
        fix: 'Проверяйте инвариант BST; для общего дерева порядок обхода — просто порядок посещения.',
      },
      {
        id: 'bst-always-log',
        title: 'Поиск в BST всегда O(log n)',
        explanation: 'Время зависит от высоты. При вставке отсортированных значений дерево становится цепочкой высоты n.',
        fix: 'Используйте самобалансирующиеся деревья или перемешивайте вставки; всегда говорите O(h).',
      },
      {
        id: 'linked-index-o1',
        title: 'Элемент связного списка можно получить по индексу за O(1)',
        explanation: 'Чтобы добраться до i-го узла, нужно пройти по i ссылкам — это O(i). Мгновенный доступ по индексу у массива (list).',
        fix: 'Выбирайте структуру по основным операциям: доступ по индексу — массив, вставка по узлу — связный список.',
      },
      {
        id: 'forgot-none-check',
        title: 'Пустого узла можно не бояться: обход сам остановится',
        explanation: 'У дерева и списка есть «хвосты» — None. Без базового случая вы обратитесь к атрибуту None и получите AttributeError.',
        fix: 'Первой строкой рекурсивной функции обрабатывайте None; в цикле используйте while node.',
      },
    ],
  }),
  exercises: numbered(ID, [
    predict({
      difficulty: 2,
      diag: true,
      prompt: 'Что выведет программа (три строки)?',
      code: py`
        class Node:
            def __init__(self, val, left=None, right=None):
                self.val, self.left, self.right = val, left, right

        def pre(n):
            return [] if n is None else [n.val] + pre(n.left) + pre(n.right)

        def ino(n):
            return [] if n is None else ino(n.left) + [n.val] + ino(n.right)

        def post(n):
            return [] if n is None else post(n.left) + post(n.right) + [n.val]

        root = Node(1, Node(2, None, Node(4)), Node(3))
        print(pre(root))
        print(ino(root))
        print(post(root))
      `,
      answer: '[1, 2, 4, 3]\n[2, 4, 1, 3]\n[4, 2, 3, 1]',
      explanation: 'У корня 1 левый потомок 2 (с правым потомком 4) и правый потомок 3. Pre-order: корень первым → 1, 2, 4, 3. In-order: 2 (у которого нет левого), 4, 1, 3. Post-order: 4, 2, 3, 1.',
    }),
    mcq({
      difficulty: 2,
      diag: true,
      prompt: 'В пустое BST по очереди вставляют 1, 2, 3, …, n (по возрастанию). Какова сложность одного поиска в таком дереве в худшем случае?',
      options: [
        ok('O(n): дерево превратилось в цепочку', 'Каждое новое значение больше всех предыдущих и уходит в правое поддерево — высота равна n.'),
        no('O(log n): это же бинарное дерево поиска', 'O(log n) верно только для сбалансированного дерева; здесь высота n.', 'bst-always-log'),
        no('O(1): корень сразу даёт ответ', 'Корень — это 1; поиск n требует спуска по всей цепочке.'),
        no('O(n log n): нужно отсортировать значения', 'Сортировка не нужна: порядок вставки уже определил (плохую) форму дерева.'),
      ],
      explanation: 'Сложность поиска в BST — O(h). Для отсортированного ввода h = n; самобалансирующиеся деревья (AVL, красно-чёрные) гарантируют h = O(log n).',
    }),
    code({
      difficulty: 2,
      prompt: md`
        Напишите §reverse_list(head)§ — разворот односвязного списка **итеративно** (за один проход, O(1) дополнительной памяти). Верните новую голову. Вспомогательные §Node§, §from_list§ и §to_list§ уже даны.

        Скрытый тест разворачивает список из 100 000 узлов: рекурсивное решение упрётся в лимит стека.
      `,
      starter: LIST_KIT + '\ndef reverse_list(head):\n    return None\n',
      solution: LIST_KIT + py`

        def reverse_list(head):
            prev = None
            while head:
                nxt = head.next
                head.next = prev
                prev = head
                head = nxt
            return prev
      `,
      tests: [
        t('to_list(reverse_list(from_list([1, 2, 3])))', '[3, 2, 1]'),
        t('to_list(reverse_list(from_list([1, 2])))', '[2, 1]'),
        h('пустой список', 'reverse_list(None)', 'None'),
        h('один узел', 'to_list(reverse_list(from_list([7])))', '[7]'),
        h('повторяющиеся значения', 'to_list(reverse_list(from_list([1, 1, 2, 2])))', '[2, 2, 1, 1]'),
        h('n = 10⁵', 'to_list(reverse_list(from_list(list(range(100000)))))[:3]', '[99999, 99998, 99997]'),
      ],
      hints: [
        'Понадобятся два указателя: prev (уже развёрнутая часть, сначала None) и head (текущий узел).',
        'Перед перенаправлением ссылки запомните следующий узел: nxt = head.next.',
        'Затем head.next = prev; prev = head; head = nxt. Верните prev.',
      ],
      explanation: 'Каждая ссылка разворачивается ровно один раз: O(n) времени и O(1) памяти. Запоминание head.next до изменения — ключ, иначе хвост теряется.',
    }),
    code({
      difficulty: 3,
      prompt: md`
        Напишите §has_cycle(head)§: верните §True§, если в односвязном списке есть цикл (какой-то §next§ указывает на уже встречавшийся узел), иначе §False§. Используйте алгоритм Флойда (два указателя) — O(1) памяти. Помощник §make_cycle(values, pos)§ создаёт список, у которого хвост ссылается на узел с индексом §pos§ (§-1§ — без цикла).
      `,
      starter: LIST_KIT + py`

        def make_cycle(values, pos):
            head = from_list(values)
            if pos >= 0 and head:
                tail = target = head
                for _ in range(pos):
                    target = target.next
                while tail.next:
                    tail = tail.next
                tail.next = target
            return head

        def has_cycle(head):
            return None
      `,
      solution: LIST_KIT + py`

        def make_cycle(values, pos):
            head = from_list(values)
            if pos >= 0 and head:
                tail = target = head
                for _ in range(pos):
                    target = target.next
                while tail.next:
                    tail = tail.next
                tail.next = target
            return head

        def has_cycle(head):
            slow = fast = head
            while fast and fast.next:
                slow = slow.next
                fast = fast.next.next
                if slow is fast:
                    return True
            return False
      `,
      tests: [
        t('has_cycle(make_cycle([3, 2, 0, -4], 1))', 'True'),
        t('has_cycle(make_cycle([1, 2, 3], -1))', 'False'),
        h('пустой список', 'has_cycle(None)', 'False'),
        h('один узел без цикла', 'has_cycle(make_cycle([1], -1))', 'False'),
        h('один узел ссылается на себя', 'has_cycle(make_cycle([1], 0))', 'True'),
        h('цикл с самого начала', 'has_cycle(make_cycle([1, 2], 0))', 'True'),
        h('n = 10⁵ с циклом', 'has_cycle(make_cycle(list(range(100000)), 50000))', 'True'),
        h('n = 10⁵ без цикла', 'has_cycle(make_cycle(list(range(100000)), -1))', 'False'),
      ],
      hints: [
        'Заведите два указателя: slow двигается на 1 шаг, fast — на 2.',
        'Если цикла нет, fast дойдёт до None. Если есть — указатели встретятся.',
        'Условие цикла: while fast and fast.next; после шага проверяйте slow is fast.',
      ],
      explanation: 'В цикле быстрый указатель «догоняет» медленный: расстояние между ними сокращается на 1 за шаг. O(n) времени, O(1) памяти.',
    }),
    code({
      difficulty: 2,
      prompt: md`
        Напишите рекурсивную §height(root)§ — высоту бинарного дерева в **узлах** (пустое дерево — 0, один узел — 1). Класс §TreeNode§ дан.
      `,
      starter: TREE_KIT + '\ndef height(root):\n    return None\n',
      solution: TREE_KIT + py`

        def height(root):
            if root is None:
                return 0
            return 1 + max(height(root.left), height(root.right))
      `,
      tests: [
        t('height(TreeNode(1, TreeNode(2, TreeNode(4)), TreeNode(3)))', '3'),
        t('height(TreeNode(1))', '1'),
        h('пустое дерево', 'height(None)', '0'),
        h('только левая цепочка', 'height(TreeNode(1, TreeNode(2, TreeNode(3))))', '3'),
        h('только правая цепочка', 'height(TreeNode(1, None, TreeNode(2, None, TreeNode(3, None, TreeNode(4)))))', '4'),
        h(
          'цепочка из 300 узлов',
          'height(__import__("functools").reduce(lambda acc, v: TreeNode(v, acc), range(300), None))',
          '300',
        ),
        h('полное дерево глубины 14', 'height(__import__("functools").reduce(lambda acc, _: TreeNode(0, acc, acc), range(14), None))', '14'),
      ],
      hints: [
        'База: у пустого дерева (None) высота 0.',
        'Высота узла на единицу больше высоты более высокого из двух поддеревьев.',
        'return 1 + max(height(root.left), height(root.right))',
      ],
      explanation: 'Решение для узла выражается через решения для детей — стандартный шаблон работы с деревьями. Время O(n), память стека O(h).',
    }),
    code({
      difficulty: 3,
      prompt: md`
        Напишите §bst_insert(root, val)§ — вставка в бинарное дерево поиска. Возвращает корень (после вставки). Значения, уже присутствующие в дереве, не дублируются. Помощник §inorder§ даёт отсортированный список значений.
      `,
      starter: TREE_KIT + py`

        def inorder(node):
            return [] if node is None else inorder(node.left) + [node.val] + inorder(node.right)

        def bst_insert(root, val):
            return None
      `,
      solution: TREE_KIT + py`

        def inorder(node):
            return [] if node is None else inorder(node.left) + [node.val] + inorder(node.right)

        def bst_insert(root, val):
            if root is None:
                return TreeNode(val)
            if val < root.val:
                root.left = bst_insert(root.left, val)
            elif val > root.val:
                root.right = bst_insert(root.right, val)
            return root
      `,
      tests: [
        t('inorder(__import__("functools").reduce(bst_insert, [5, 3, 8, 1, 4], None))', '[1, 3, 4, 5, 8]'),
        t('__import__("functools").reduce(bst_insert, [5, 3, 8], None).left.val', '3'),
        h('вставка в пустое дерево', 'bst_insert(None, 7).val', '7'),
        h('дубликаты не добавляются', 'inorder(__import__("functools").reduce(bst_insert, [2, 2, 1, 1, 3, 3], None))', '[1, 2, 3]'),
        h('отрицательные значения', 'inorder(__import__("functools").reduce(bst_insert, [0, -5, 5, -1], None))', '[-5, -1, 0, 5]'),
        h(
          'корень не меняется при последующих вставках',
          '__import__("functools").reduce(bst_insert, [10, 5, 15, 3], None).val',
          '10',
        ),
        h(
          'n = 20 000 значений',
          '(lambda vals: inorder(__import__("functools").reduce(bst_insert, vals, None)) == sorted(set(vals)))([(i * 7919) % 20011 for i in range(20000)])',
          'True',
        ),
      ],
      hints: [
        'Если дерево пусто (None) — верните новый узел TreeNode(val).',
        'Иначе сравните val с root.val: меньше — идём влево, больше — вправо; равные пропускаем.',
        'Присваивайте результат рекурсивного вызова ребёнку: root.left = bst_insert(root.left, val), и в конце верните root.',
      ],
      explanation: 'Рекурсия спускается по единственному пути, на котором должно находиться значение: O(h). Присваивание результата ребёнку подключает новый узел.',
    }),
    fix({
      difficulty: 2,
      bugType: 'edge',
      prompt: '§append_node(head, val)§ добавляет значение в конец списка и возвращает голову. На пустом списке она падает. Исправьте.',
      buggy: LIST_KIT + py`

        def append_node(head, val):
            cur = head
            while cur.next:
                cur = cur.next
            cur.next = Node(val)
            return head
      `,
      solution: LIST_KIT + py`

        def append_node(head, val):
            if head is None:
                return Node(val)
            cur = head
            while cur.next:
                cur = cur.next
            cur.next = Node(val)
            return head
      `,
      tests: [
        t('to_list(append_node(from_list([1, 2]), 3))', '[1, 2, 3]'),
        t('to_list(append_node(from_list([5]), 6))', '[5, 6]'),
        h('пустой список', 'to_list(append_node(None, 1))', '[1]'),
        h('голова не меняется', 'append_node(from_list([1, 2]), 3).val', '1'),
        h('несколько добавлений подряд', 'to_list(__import__("functools").reduce(append_node, [1, 2, 3], None))', '[1, 2, 3]'),
      ],
      hints: [
        'Запустите append_node(None, 1): какая строка падает?',
        'У пустого списка нет узла, у которого можно взять .next. Как «добавить» первый узел?',
      ],
      explanation: 'Когда head — None, новый узел сам становится головой. Этот особый случай нужно обработать до обхода.',
    }),
    parsons({
      difficulty: 2,
      prompt: 'Соберите рекурсивный in-order обход. Программа должна вывести [1, 2, 3].',
      lines: [
        'class Node:',
        '    def __init__(self, val, left=None, right=None):',
        '        self.val = val',
        '        self.left = left',
        '        self.right = right',
        'def inorder(node):',
        '    if node is None:',
        '        return []',
        '    return inorder(node.left) + [node.val] + inorder(node.right)',
        'root = Node(2, Node(1), Node(3))',
        'print(inorder(root))',
      ],
      distractors: ['    return inorder(node.right) + [node.val] + inorder(node.left)', '        return None'],
      tests: [{ stdout: '[1, 2, 3]' }],
      explanation: 'In-order: левое поддерево, корень, правое поддерево. База для None возвращает пустой список (не None), иначе сложение списков упадёт.',
    }),
    explain({
      difficulty: 3,
      prompt: 'Почему in-order обход бинарного дерева поиска выдаёт значения по возрастанию? И почему поиск в BST может оказаться O(n)?',
      keyPoints: [
        'В BST всё левое поддерево меньше корня, а всё правое — больше',
        'In-order посещает левое, корень, правое — по индукции получается возрастающий порядок',
        'Время поиска равно высоте дерева; несбалансированное дерево вырождается в цепочку высоты n',
      ],
      modelAnswer: 'В BST все значения левого поддерева меньше значения корня, а правого — больше. In-order обход сначала выдаёт левое поддерево (по предположению индукции — по возрастанию), затем корень, затем правое, поэтому весь список возрастает. Поиск спускается по одному пути, значит его время — O(h). Если вставлять уже отсортированные значения, каждое новое попадает в правое поддерево, дерево превращается в цепочку высоты n, и поиск становится O(n).',
      explanation: 'Инвариант BST объясняет и порядок обхода, и скорость поиска; балансировка защищает высоту.',
    }),
  ]),
};
