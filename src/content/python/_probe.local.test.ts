import { it } from 'vitest';
import { pyRun } from '../../../tests/helpers/runtimes';
it('probe', async () => {
  const code = `
import sys
print(sys.version)
try:
    int("x")
except ValueError, TypeError:
    print("pep758 ok")
print(round(2.5), round(3.5), round(2.675, 2))
print("ß".casefold())
print(list(zip([1],[2,3], strict=False)))
try:
    list(zip([1],[2,3], strict=True))
except ValueError as e: print("strict", e)
print(hash((1,[2])) if False else "x")
from dataclasses import dataclass, field
try:
    @dataclass
    class A:
        x: list = []
except ValueError as e: print(e)
print(-7 % 3, -17 // 5, -17 % 5)
print(0.1+0.2, 1/0 if False else '')
try: 1.0/0.0
except ZeroDivisionError as e: print("zde", e)
print(float('nan') == float('nan'))
print(len({1,1,2,True}))
print("10" < "9")
`;
  const r = await pyRun(code);
  console.log(r.stdout, r.error);
}, 60000);
