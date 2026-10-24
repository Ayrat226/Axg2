// Self-host Pyodide and sql.js so code execution works offline and without third-party CDNs.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function copy(pkgDir, dest, filter) {
  const dir = join(root, 'node_modules', pkgDir);
  if (!existsSync(dir)) { console.warn(`[copy-runtimes] ${pkgDir} not installed`); return; }
  const out = join(root, 'public', dest);
  mkdirSync(out, { recursive: true });
  const files = readdirSync(dir).filter(filter);
  for (const f of files) cpSync(join(dir, f), join(out, f));
  console.log(`[copy-runtimes] ${pkgDir} -> public/${dest}: ${files.join(', ')}`);
}
copy('pyodide', 'pyodide', (f) => /^(pyodide\.mjs|pyodide\.asm\.(mjs|wasm)|python_stdlib\.zip|pyodide-lock\.json)$/.test(f));
copy('sql.js/dist', 'sqljs', (f) => f === 'sql-wasm-browser.js' || f === 'sql-wasm-browser.wasm' || f === 'sql-wasm.wasm' || f === 'sql-wasm.js');
