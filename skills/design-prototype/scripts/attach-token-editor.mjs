#!/usr/bin/env node
// Attach an offline parameter editor AFTER a project renderer exported real DS components.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateBundle } from './token-parameters.mjs';
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
if (args.includes('--help')) {
  console.log('node attach-token-editor.mjs --html real-components.html --tokens parameters.json --repo-root <code-repo> --out preview.html');
  process.exit(0);
}
try {
  for (const key of ['--html', '--tokens', '--repo-root', '--out']) if (!opt(key) || opt(key).startsWith('--')) throw new Error(`Missing ${key}`);
  const input = path.resolve(opt('--html')), output = path.resolve(opt('--out')), repo = path.resolve(opt('--repo-root'));
  const identity = file => {
    const resolved = fs.existsSync(file) ? fs.realpathSync(file) : path.resolve(file);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  };
  if (identity(input) === identity(output)) throw new Error('Keep renderer output intact: use a separate --out');
  const bundle = validateBundle(JSON.parse(fs.readFileSync(path.resolve(opt('--tokens')), 'utf8')));
  // Source hashes must match before editing; this verifies freshness, not renderer honesty.
  for (const [relative, expected] of Object.entries(bundle.source.hashes)) {
    const source = path.resolve(repo, relative);
    if (path.relative(repo, source).startsWith('..') || path.isAbsolute(path.relative(repo, source))) throw new Error('Source path outside repo');
    const hash = createHash('sha256').update(fs.readFileSync(source)).digest('hex');
    if (hash !== expected) throw new Error(`Source changed: ${relative}; render again`);
  }
  let html = fs.readFileSync(input, 'utf8');
  if (!/<head\b/i.test(html) || !/<body\b/i.test(html) || !/<\/body>/i.test(html)) throw new Error('Expected a complete rendered HTML document');
  if (html.includes('id="danh-token-data"')) throw new Error('Editor already attached');
  const runtime = fs.readFileSync(fileURLToPath(new URL('./token-parameters.mjs', import.meta.url)), 'utf8').replace(/^export /gm, '');
  const data = JSON.stringify(bundle).replaceAll('<', '\\u003c');
  const script = runtime.replace(/<\/script/gi, '<\\/script');
  html = html.replace(/<\/body>/i, `<script type="application/json" id="danh-token-data">${data}</script><script type="module">${script}\nmountEditor(JSON.parse(document.getElementById('danh-token-data').textContent));</script></body>`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html.replace(/\r\n/g, '\n'), 'utf8');
  console.log(`Created ${output}; verified ${Object.keys(bundle.source.hashes).length} source hashes. This helper does not render components or write design-system tokens.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
