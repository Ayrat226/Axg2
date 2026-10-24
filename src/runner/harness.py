# LearnLab Python harness. Shared by the browser worker (Pyodide) and content tests (Pyodide in Node).
# Entry point: __ll_main(request_json) -> response_json
import sys, io, json, math, traceback, builtins, copy

_MAX_OUT = 20000
_MAX_STEPS = 400


class _Stdin:
    def __init__(self, lines):
        self.lines = list(lines or [])

    def __call__(self, prompt=''):
        if prompt:
            sys.stdout.write(str(prompt))
        if not self.lines:
            raise EOFError('input(): данные для ввода закончились')
        return self.lines.pop(0)


def _error_info(exc):
    tb = exc.__traceback__
    line = None
    if isinstance(exc, SyntaxError) and exc.filename == '<main>':
        line = exc.lineno
    else:
        for frame, lineno in traceback.walk_tb(tb):
            if frame.f_code.co_filename == '<main>':
                line = lineno
    frames = [f for f in traceback.extract_tb(tb) if f.filename == '<main>']
    text = ''.join(traceback.format_list(frames)) + ''.join(traceback.format_exception_only(type(exc), exc))
    return {'type': type(exc).__name__, 'message': str(exc), 'line': line, 'traceback': text}


def _exec(code, stdin=None, ns=None):
    out = io.StringIO()
    old_out, old_err, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout = sys.stderr = out
    builtins.input = _Stdin(stdin)
    ns = ns if ns is not None else {'__name__': '__main__'}
    err = None
    try:
        exec(compile(code, '<main>', 'exec'), ns)
    except BaseException as e:  # noqa: BLE001 — learner code may raise anything, incl. SystemExit
        if isinstance(e, SystemExit) and not e.code:
            pass
        else:
            err = _error_info(e)
    finally:
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_input
    return out.getvalue()[:_MAX_OUT], err, ns


def _eq(a, b):
    if isinstance(b, float) or isinstance(a, float):
        if isinstance(a, bool) or isinstance(b, bool):
            return False
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12)
        return False
    if type(a) is not type(b):
        return False
    if isinstance(a, (list, tuple)):
        return len(a) == len(b) and all(_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(_eq(a[k], b[k]) for k in a)
    return a == b


def _norm(s):
    return '\n'.join(line.rstrip() for line in str(s).replace('\r\n', '\n').split('\n')).rstrip('\n')


def _short(v, n=300):
    r = repr(v)
    return r if len(r) <= n else r[:n] + '…'


def _run_tests(code, tests):
    results = []
    for t in tests:
        res = {'hidden': bool(t.get('hidden')), 'label': t.get('label'), 'pass': False}
        if t.get('stdout') is not None:
            out, err, _ = _exec(code, t.get('stdin') or [])
            res.update({'kind': 'stdout', 'stdin': t.get('stdin') or [], 'expected': t['stdout'], 'actual': out})
            if err:
                res['error'] = err
            res['pass'] = err is None and _norm(out) == _norm(t['stdout'])
        else:
            out, err, ns = _exec(code, t.get('stdin') or [])
            res.update({'kind': 'expr', 'expr': t['expr'], 'expected': t['expect']})
            if err:
                res['error'] = err
            else:
                try:
                    expected = eval(t['expect'], {})
                    actual = eval(compile(t['expr'], '<test>', 'eval'), ns)
                    res['actual'] = _short(actual)
                    res['pass'] = _eq(actual, expected)
                except BaseException as e:  # noqa: BLE001
                    res['error'] = {'type': type(e).__name__, 'message': str(e), 'line': None,
                                    'traceback': ''.join(traceback.format_exception_only(type(e), e))}
        results.append(res)
    return results


def _trace(code, stdin):
    steps = []
    out = io.StringIO()

    def safe_locals(frame):
        d = {}
        for k, v in list(frame.f_locals.items()):
            if k.startswith('__') or type(v).__name__ == 'module':
                continue
            if isinstance(v, type):
                d[k] = '<класс ' + v.__name__ + '>'
            elif callable(v):
                d[k] = '<функция ' + getattr(v, '__name__', '?') + '>'
            else:
                d[k] = _short(v, 120)
        return d

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<main>':
            return None
        if len(steps) >= _MAX_STEPS:
            raise RuntimeError('Достигнут лимит шагов визуализации (' + str(_MAX_STEPS) + ')')
        if event in ('line', 'return', 'exception'):
            depth = 0
            f = frame
            while f is not None:
                if f.f_code.co_filename == '<main>':
                    depth += 1
                f = f.f_back
            step = {'line': frame.f_lineno, 'event': event, 'func': frame.f_code.co_name,
                    'depth': depth, 'locals': safe_locals(frame), 'out': len(out.getvalue())}
            if event == 'return':
                step['ret'] = _short(arg, 120)
            steps.append(step)
        return tracer

    old_out, old_err, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout = sys.stderr = out
    builtins.input = _Stdin(stdin)
    err = None
    try:
        code_obj = compile(code, '<main>', 'exec')
        sys.settrace(tracer)
        exec(code_obj, {'__name__': '__main__'})
    except BaseException as e:  # noqa: BLE001
        err = _error_info(e)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_input
    return {'steps': steps, 'stdout': out.getvalue()[:_MAX_OUT], 'error': err}


def __ll_main(request_json):
    req = json.loads(request_json)
    mode = req.get('mode')
    code = req.get('code', '')
    if mode == 'run':
        out, err, _ = _exec(code, req.get('stdin') or [])
        return json.dumps({'stdout': out, 'error': err})
    if mode == 'test':
        return json.dumps({'results': _run_tests(code, req.get('tests') or [])})
    if mode == 'trace':
        return json.dumps(_trace(code, req.get('stdin') or []))
    return json.dumps({'error': {'type': 'HarnessError', 'message': 'unknown mode', 'line': None, 'traceback': ''}})
