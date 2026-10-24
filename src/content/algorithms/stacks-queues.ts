import type { SkillModule } from '../../core/types';
import { code, defineSkill, explain, fix, h, mcq, md, no, numbered, ok, parsons, predict, py, t } from './_kit';

const ID = 'algo.stacks-queues';

export const stacksQueues: SkillModule = {
  skill: defineSkill({
    id: ID,
    title: 'Стеки и очереди',
    icon: '🥞',
    summary: 'LIFO и FIFO, list как стек, collections.deque как очередь, скобки, обратная польская запись, монотонный стек.',
    prereqs: ['algo.complexity', 'py.lists', 'py.functions', 'py.loops'],
    tier: 2,
    interview: true,
    estMinutes: 40,
    outcomes: [
      'Использую list как стек (append/pop) и deque как очередь (append/popleft) за O(1)',
      'Решаю задачи о вложенности (скобки, выражения) стеком',
      'Применяю монотонный стек для «ближайший больший/меньший элемент» за O(n)',
      'Знаю, почему list.pop(0) — плохая очередь',
    ],
    lesson: {
      why: 'Стек и очередь — простейшие структуры, на которых держатся вызовы функций, отмена действий, парсинг выражений, обходы графов. Монотонный стек превращает целый класс задач из O(n²) в O(n).',
      brief: 'Стек: последний пришёл — первый ушёл (LIFO); в Python — list с append() и pop(). Очередь: первый пришёл — первый ушёл (FIFO); используйте collections.deque с append() и popleft(). Все операции O(1). list.pop(0) — O(n).',
      standard: md`
        ### Стек (LIFO)
        §§§python
        stack = []
        stack.append("a")   # положить
        stack.append("b")
        stack.pop()         # "b" — достать верхний
        stack[-1]           # "a" — заглянуть без извлечения
        §§§

        §append§ и §pop()§ работают с **концом** списка за O(1). Проверка пустоты: §if not stack§.

        ### Очередь (FIFO)
        §§§python
        from collections import deque
        q = deque()
        q.append(1); q.append(2)   # в конец
        q.popleft()                # 1 — из начала, O(1)
        §§§

        §list.pop(0)§ сдвигает все остальные элементы: O(n). Для очередей всегда берите §deque§.

        ### Скобки — классика стека
        Открывающую скобку кладём в стек, закрывающая должна совпасть с вершиной:

        §§§python
        def is_balanced(s):
            pairs = {")": "(", "]": "[", "}": "{"}
            stack = []
            for ch in s:
                if ch in "([{":
                    stack.append(ch)
                elif ch in pairs:
                    if not stack or stack.pop() != pairs[ch]:
                        return False
            return not stack
        §§§

        Три проверки: закрывающая без пары (стек пуст), несовпадение типов (§"([)]"§), незакрытые скобки в конце.

        ### Монотонный стек: ближайший больший элемент
        Храним в стеке индексы, значения которых убывают. Когда приходит больший элемент, он является «ответом» для всех меньших на вершине:

        §§§python
        def next_greater(nums):
            res = [-1] * len(nums)
            stack = []                      # индексы
            for i, x in enumerate(nums):
                while stack and nums[stack[-1]] < x:
                    res[stack.pop()] = x
                stack.append(i)
            return res
        §§§
      `,
      deep: md`
        **Амортизация.** В монотонном стеке есть §while§ внутри §for§, но каждый элемент кладётся и извлекается не более одного раза, поэтому всего ≤ 2n операций — O(n).

        **Инвариант монотонного стека.** Значения в стеке от дна к вершине строго убывают (для «следующего большего»). Элемент, вытолкнутый из стека, уже получил свой ответ и больше не нужен — поэтому не теряется информация.

        **Стек вызовов.** Рекурсия — неявный стек. Любую рекурсию можно переписать с явным стеком: например, обход в глубину без рекурсии избавляет от RecursionError.

        **Обратная польская запись.** В выражении «2 1 + 3 *» операнды кладутся в стек, а оператор берёт два верхних, считает и возвращает результат обратно. Скобки и приоритеты не нужны; из обычной записи в польскую переводит алгоритм сортировочной станции (Дейкстра).

        §§§python
        def evaluate_rpn(tokens):
            st = []
            for tok in tokens:
                if tok in "+-*/":
                    b, a = st.pop(), st.pop()
                    if tok == "+": st.append(a + b)
                    elif tok == "-": st.append(a - b)
                    elif tok == "*": st.append(a * b)
                    else: st.append(int(a / b))   # деление с округлением к нулю
                else:
                    st.append(int(tok))
            return st[0]
        §§§

        **deque изнутри.** deque — двусвязный список блоков: быстрые операции с обоими концами (§appendleft§, §popleft§, §append§, §pop§ — O(1)), но обращение по индексу в середину — O(n). Подходит как очередь и как дек (двусторонняя очередь), также §deque(maxlen=k)§ — кольцевой буфер.

        **queue.Queue и heapq.** Для потоков есть потокобезопасный §queue.Queue§ (медленнее). Если нужен приоритет — куча (см. «Кучи»).

        **Скользящий максимум.** Дек индексов с убывающими значениями даёт максимум окна за O(1) на шаг — обобщение монотонного стека.

        **Типичные задачи.** Валидные скобки, отмена/повтор действий (два стека), история браузера, ближайший больший элемент, гистограмма, DFS без рекурсии (стек), BFS (очередь).
      `,
      analogy: 'Стек — стопка тарелок: берёте сверху то, что положили последним. Очередь — очередь в кассу: обслуживают того, кто пришёл раньше всех.',
      example: {
        lang: 'python',
        code: py`
          from collections import deque

          stack = []
          for x in (1, 2, 3):
              stack.append(x)
          print(stack.pop(), stack.pop(), stack)

          queue = deque([1, 2, 3])
          queue.append(4)
          print(queue.popleft(), queue.popleft(), list(queue))
        `,
        steps: [
          'В стек положили 1, 2, 3; pop() достаёт последнее положенное: сначала 3, затем 2.',
          'В стеке остаётся [1] — «дно» стопки.',
          'В очередь добавили 4 в конец: [1, 2, 3, 4]; popleft() забирает самые «старые» элементы: 1, затем 2.',
          'Оба конца deque работают за O(1), поэтому очередь не замедляется с ростом размера.',
        ],
        output: '3 2 [1]\n1 2 [3, 4]',
      },
      counterexample: {
        lang: 'python',
        code: py`
          queue = list(range(100000))
          while queue:
              queue.pop(0)      # каждый pop(0) сдвигает ~n элементов: O(n²) всего
        `,
        explain: 'pop(0) у списка сдвигает все оставшиеся элементы влево. Цикл превращается в O(n²). С deque и popleft() он выполнится за O(n).',
      },
      pitfalls: [
        'Использовать §list.pop(0)§ и §list.insert(0, x)§ как операции очереди: O(n) на каждую.',
        'Вызывать §pop()§ у пустого стека — IndexError; сначала проверяйте §if stack§.',
        'Забыть проверить, что стек пуст в конце обработки скобок: «((» не сбалансировано.',
        'Хранить в монотонном стеке значения вместо индексов, когда нужны расстояния.',
        'Путать порядок операндов при вычитании и делении в RPN: сначала достаётся второй операнд.',
      ],
      sources: [
        { title: 'Python docs — collections.deque', url: 'https://docs.python.org/3/library/collections.html#collections.deque' },
        { title: 'Python tutorial — Using lists as stacks / queues', url: 'https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-stacks' },
        { title: 'Stack (abstract data type) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Stack_(abstract_data_type)' },
        { title: 'Queue (abstract data type) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Queue_(abstract_data_type)' },
        { title: 'Reverse Polish notation — Wikipedia', url: 'https://en.wikipedia.org/wiki/Reverse_Polish_notation' },
      ],
    },
    misconceptions: [
      {
        id: 'pop0-is-fast',
        title: 'list.pop(0) — нормальная операция очереди',
        explanation: 'После удаления первого элемента список сдвигает все остальные: O(n). Серия таких удалений квадратична.',
        fix: 'Используйте collections.deque и popleft().',
      },
      {
        id: 'lifo-fifo',
        title: 'Стек и очередь отличаются только названием',
        explanation: 'Стек извлекает самый новый элемент (LIFO), очередь — самый старый (FIFO). От этого зависит порядок обработки в алгоритмах: DFS использует стек, BFS — очередь.',
        fix: 'Запомните: стек — тарелки, очередь — касса.',
      },
      {
        id: 'count-is-enough',
        title: 'Для скобок достаточно сравнить число открывающих и закрывающих',
        explanation: 'Строки «)(» и «([)]» содержат равное число скобок, но некорректны: важен порядок и вложенность.',
        fix: 'Используйте стек и сверяйте закрывающую скобку с последней открытой.',
      },
      {
        id: 'monotonic-is-quadratic',
        title: 'Вложенный while в монотонном стеке даёт O(n²)',
        explanation: 'Каждый элемент попадает в стек и покидает его не более одного раза; суммарное число итераций while не превосходит n.',
        fix: 'Считайте амортизированно — по общему числу push/pop.',
      },
    ],
  }),
  exercises: numbered(ID, [
    predict({
      difficulty: 1,
      diag: true,
      prompt: 'Что выведет программа?',
      code: py`
        s = []
        s.append(1)
        s.append(2)
        s.append(3)
        print(s.pop(), s.pop(), s)
      `,
      answer: '3 2 [1]',
      explanation: 'Стек работает по принципу LIFO: pop() достаёт последний добавленный элемент.',
    }),
    predict({
      difficulty: 1,
      prompt: 'Что выведет программа?',
      code: py`
        from collections import deque
        q = deque([1, 2, 3])
        q.append(4)
        print(q.popleft(), q.popleft(), list(q))
      `,
      answer: '1 2 [3, 4]',
      explanation: 'Очередь FIFO: popleft() забирает самый старый элемент слева, append() добавляет справа.',
    }),
    mcq({
      difficulty: 2,
      diag: true,
      prompt: 'Вы обрабатываете очередь из n = 10⁵ задач, каждый раз вызывая §tasks.pop(0)§ у списка. Что не так?',
      options: [
        ok('Каждый pop(0) сдвигает оставшиеся элементы — всего O(n²); нужен deque.popleft()', 'Удаление из начала списка линейно, а в цикле их n.'),
        no('Ничего: pop(0) работает за O(1), как и pop()', 'O(1) только у pop() с конца; pop(0) требует сдвига.', 'pop0-is-fast'),
        no('pop(0) выбросит исключение на непустом списке', 'Исключения нет, но операция медленная.'),
        no('Порядок задач нарушится: pop(0) берёт случайный элемент', 'pop(0) всегда берёт первый, порядок не нарушается — проблема в скорости.'),
      ],
      explanation: 'Список — массив: удаление с начала сдвигает хвост. Для очередей предназначен collections.deque.',
    }),
    code({
      difficulty: 2,
      prompt: md`
        Напишите §is_balanced(s)§: проверьте, правильно ли расставлены скобки §()§, §[]§, §{}§ в строке (остальные символы игнорируйте). Скобки должны быть правильно вложены.
      `,
      starter: py`
        def is_balanced(s):
            return None
      `,
      solution: py`
        def is_balanced(s):
            pairs = {")": "(", "]": "[", "}": "{"}
            stack = []
            for ch in s:
                if ch in "([{":
                    stack.append(ch)
                elif ch in pairs:
                    if not stack or stack.pop() != pairs[ch]:
                        return False
            return not stack
      `,
      tests: [
        t('is_balanced("([]{})")', 'True'),
        t('is_balanced("([)]")', 'False'),
        h('пустая строка', 'is_balanced("")', 'True'),
        h('закрывающая без пары', 'is_balanced(")")', 'False'),
        h('незакрытая скобка', 'is_balanced("((")', 'False'),
        h('закрывающая раньше открывающей', 'is_balanced(")(")', 'False'),
        h('посторонние символы', 'is_balanced("a(b[c]d)e")', 'True'),
        h('n = 10⁵ вложенных скобок', 'is_balanced("(" * 50000 + ")" * 50000)', 'True'),
        h('n = 10⁵ открывающих', 'is_balanced("(" * 100000)', 'False'),
      ],
      hints: [
        'Открывающие скобки кладите в стек.',
        'Закрывающая должна соответствовать верхушке стека — иначе это ошибка (и если стек пуст).',
        'В конце стек должен быть пустым: return not stack.',
      ],
      explanation: 'Стек хранит «ожидающие закрытия» скобки в порядке вложенности. Три ошибки: закрывающая без пары, не тот тип, незакрытые остатки.',
    }),
    code({
      difficulty: 3,
      prompt: md`
        **Монотонный стек.** Напишите §daily_temperatures(temps)§: для каждого дня верните, через сколько дней будет **строго теплее** (0, если теплее не будет).

        Пример: §[73, 74, 75, 71, 69, 72, 76, 73]§ → §[1, 1, 4, 2, 1, 1, 0, 0]§. Скрытые тесты — списки по 10⁵ элементов.
      `,
      starter: py`
        def daily_temperatures(temps):
            return None
      `,
      solution: py`
        def daily_temperatures(temps):
            res = [0] * len(temps)
            stack = []
            for i, x in enumerate(temps):
                while stack and temps[stack[-1]] < x:
                    j = stack.pop()
                    res[j] = i - j
                stack.append(i)
            return res
      `,
      tests: [
        t('daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73])', '[1, 1, 4, 2, 1, 1, 0, 0]'),
        t('daily_temperatures([30, 40, 50, 60])', '[1, 1, 1, 0]'),
        h('пустой список', 'daily_temperatures([])', '[]'),
        h('один день', 'daily_temperatures([50])', '[0]'),
        h('одинаковые температуры (строго теплее)', 'daily_temperatures([5, 5, 5])', '[0, 0, 0]'),
        h('n = 10⁵, возрастающие', 'daily_temperatures(list(range(100000))) == [1] * 99999 + [0]', 'True'),
        h('n = 10⁵, убывающие', 'daily_temperatures(list(range(100000, 0, -1))) == [0] * 100000', 'True'),
      ],
      hints: [
        'Для каждого дня нужно найти ближайший день справа с большей температурой.',
        'Храните в стеке индексы дней, ещё не нашедших более тёплый, — их температуры убывают.',
        'Когда приходит тёплый день i, вытолкните все индексы j с меньшей температурой и запишите res[j] = i − j.',
      ],
      explanation: 'Каждый индекс кладётся и извлекается из стека один раз: O(n). Наивный перебор вправо для каждого дня — O(n²).',
    }),
    code({
      difficulty: 2,
      prompt: md`
        Напишите §evaluate_rpn(tokens)§: вычислите выражение в обратной польской записи. Токены — строки: целые числа и операторы §+ - * /§. Деление — целое, с округлением к нулю (§int(a / b)§).

        Пример: §["2", "1", "+", "3", "*"]§ → §9§.
      `,
      starter: py`
        def evaluate_rpn(tokens):
            return None
      `,
      solution: py`
        def evaluate_rpn(tokens):
            st = []
            for tok in tokens:
                if tok in ("+", "-", "*", "/"):
                    b = st.pop()
                    a = st.pop()
                    if tok == "+":
                        st.append(a + b)
                    elif tok == "-":
                        st.append(a - b)
                    elif tok == "*":
                        st.append(a * b)
                    else:
                        st.append(int(a / b))
                else:
                    st.append(int(tok))
            return st[0]
      `,
      tests: [
        t('evaluate_rpn(["2", "1", "+", "3", "*"])', '9'),
        t('evaluate_rpn(["4", "13", "5", "/", "+"])', '6'),
        h('один операнд', 'evaluate_rpn(["42"])', '42'),
        h('вычитание: порядок операндов', 'evaluate_rpn(["3", "5", "-"])', '-2'),
        h('деление округляется к нулю', 'evaluate_rpn(["-7", "2", "/"])', '-3'),
        h('длинное выражение', 'evaluate_rpn(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"])', '22'),
      ],
      hints: [
        'Числа кладите в стек, а оператор берёт два верхних элемента.',
        'Второй операнд достаётся первым: b = st.pop(); a = st.pop(); результат a ∘ b.',
        'Для деления используйте int(a / b): округление к нулю, как в условии.',
      ],
      explanation: 'RPN не нуждается в скобках: порядок вычислений задаётся самой последовательностью токенов, а стек хранит промежуточные результаты.',
    }),
    fix({
      difficulty: 2,
      bugType: 'logic',
      prompt: '§next_greater(nums)§ должна вернуть для каждого элемента ближайший справа **строго больший** (или -1). На списках с равными значениями она отвечает неверно. Исправьте.',
      buggy: py`
        def next_greater(nums):
            res = [-1] * len(nums)
            stack = []
            for i, x in enumerate(nums):
                while stack and nums[stack[-1]] <= x:
                    res[stack.pop()] = x
                stack.append(i)
            return res
      `,
      solution: py`
        def next_greater(nums):
            res = [-1] * len(nums)
            stack = []
            for i, x in enumerate(nums):
                while stack and nums[stack[-1]] < x:
                    res[stack.pop()] = x
                stack.append(i)
            return res
      `,
      tests: [
        t('next_greater([2, 1, 3])', '[3, 3, -1]'),
        t('next_greater([2, 2, 3])', '[3, 3, -1]'),
        h('пустой список', 'next_greater([])', '[]'),
        h('одинаковые числа: ответа нет', 'next_greater([4, 4, 4])', '[-1, -1, -1]'),
        h('убывающие', 'next_greater([5, 4, 3])', '[-1, -1, -1]'),
        h('отрицательные', 'next_greater([-3, -1, -2])', '[-1, -1, -1]'),
      ],
      hints: [
        'Проверьте [4, 4, 4]: должно ли второе 4 быть ответом для первого?',
        'Ближайший больший означает строго больший: равные значения из стека выталкивать нельзя.',
      ],
      explanation: 'Условие <= выталкивает равные элементы и записывает им «больший», хотя он равен. Нужно строгое <.',
    }),
    parsons({
      difficulty: 1,
      prompt: 'Соберите программу, которая переворачивает порядок слов с помощью стека. Вывод: три два один',
      lines: [
        'text = "один два три"',
        'stack = []',
        'for word in text.split():',
        '    stack.append(word)',
        'result = []',
        'while stack:',
        '    result.append(stack.pop())',
        'print(" ".join(result))',
      ],
      distractors: ['    result.append(stack.pop(0))', '    stack.insert(0, word)'],
      tests: [{ stdout: 'три два один' }],
      explanation: 'Слова кладутся в стек по порядку, извлекаются с конца — порядок обращается.',
    }),
    explain({
      difficulty: 3,
      prompt: 'В монотонном стеке есть §while§ внутри §for§. Объясните, почему всё решение работает за O(n), а не O(n²).',
      code: py`
        for i, x in enumerate(nums):
            while stack and nums[stack[-1]] < x:
                res[stack.pop()] = x
            stack.append(i)
      `,
      keyPoints: [
        'Каждый индекс добавляется в стек ровно один раз',
        'Каждый индекс извлекается не более одного раза, поэтому суммарно pop выполняется ≤ n раз',
        'Общее число операций ≤ 2n — амортизированная оценка',
      ],
      modelAnswer: 'Внешний цикл делает n итераций и в каждой выполняет один append — всего n добавлений. Тело while — это pop, а извлечь можно только то, что было добавлено, причём каждый индекс не более одного раза. Значит, суммарно за весь алгоритм выполнится не более n pop. Всего не более 2n элементарных операций — O(n), хотя в отдельной итерации while может сделать много шагов.',
      explanation: 'Амортизированный анализ считает общее число операций, а не «максимум на итерацию × число итераций».',
    }),
  ]),
};
