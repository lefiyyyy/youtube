// Syntax-check all ES modules by compiling them with vm.SourceTextModule-free approach (acorn not needed): use node --input-type=module --check
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
walk('public/js');
let bad = 0;
for (const f of files) {
  try { execSync(`node --input-type=module --check < ${f}`, { stdio: 'pipe' }); }
  catch (e) { bad++; console.log('ERR', f, e.stderr.toString().split('\n').slice(0, 5).join('\n')); }
}
console.log(files.length, 'files checked,', bad, 'errors');
