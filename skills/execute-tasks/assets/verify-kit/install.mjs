#!/usr/bin/env node
// bigin-verify-kit installer. Thả kit vào (hoặc cạnh) một project rồi chạy:
//   node install.mjs [thư-mục-project] [--mode local|shared] [--preset node|flutter|docs]
//                    [--config file.json] [--update] [--reset-config] [--dry] [--no-preview]
//
// --mode local  (mặc định): không sửa file nào đang được git theo dõi, không đụng package.json.
//               Mọi thứ nằm trong .git/info/exclude → `git status` vẫn sạch, owner repo không thấy gì.
// --mode shared: chèn khối quy tắc vào AGENTS.md/CLAUDE.md, thêm script "verify" và hook vào
//               .claude/settings.json để cả team dùng chung (vẫn KHÔNG tự commit).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KIT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const valueFlags = new Set(['--mode', '--preset', '--config']);
const positional = argv.filter((a, i) => !a.startsWith('--') && !valueFlags.has(argv[i - 1]));

if (flag('--print-aionrs')) {
  console.log(`# Dán vào cấu hình aionrs (user config hoặc .aionrs.toml của project). CHƯA XÁC MINH đường dẫn: thử trên project nháp trước.
# aionrs: pre_tool_use hook, exit code khác 0 sẽ chặn tool; lệnh shell nằm ở biến môi trường TOOL_INPUT_COMMAND.
[[hooks.pre_tool_use]]
name = "bigin-verify-guard"
tool_match = ["ExecCommand"]
command = "node .verify/verify.mjs --guard --agent aionrs"
timeout_ms = 20000`);
  process.exit(0);
}
const MODE = opt('--mode') || 'local';
if (!['local', 'shared'].includes(MODE)) { console.error('--mode phải là local hoặc shared'); process.exit(1); }
const DRY = flag('--dry');
const BEGIN = '<!-- BEGIN:bigin-verify -->';
const END = '<!-- END:bigin-verify -->';

// ---------- tìm project ----------
const exists = (p) => fs.existsSync(p);
let target = positional[0] ? path.resolve(positional[0]) : (exists(path.join(path.dirname(KIT), '.git')) ? path.dirname(KIT) : process.cwd());
const sh = (args, cwd = target) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 }).trim();
let ROOT;
try { ROOT = sh(['rev-parse', '--show-toplevel']); } catch { console.error(`✗ ${target} không nằm trong git repo (verify cần git).`); process.exit(1); }
const insideRepo = path.resolve(KIT).startsWith(path.resolve(ROOT) + path.sep);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const log = [];
const act = (desc, fn) => { log.push(desc); if (!DRY) fn(); };
const isTracked = (f) => { try { sh(['ls-files', '--error-unmatch', f], ROOT); return true; } catch { return false; } };

// ---------- presets ----------
const R = String.raw;
const SKIP_GEN = ['dist/**', 'build/**', '.next/**', '.dart_tool/**', '**/*.tsbuildinfo', '.verify/**', '**/*.g.dart', '**/*.freezed.dart'];
const DOCS = ['**/*.md', 'docs/**', 'prompts/**', '**/*.txt', 'LICENSE*', '.figma/**'];

function nodePreset(root) {
  const pkg = exists(path.join(root, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) : {};
  const sc = pkg.scripts || {};
  const pm = exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : exists(path.join(root, 'yarn.lock')) ? 'yarn' : exists(path.join(root, 'bun.lockb')) ? 'bun' : 'npm';
  const run = (s) => (pm === 'npm' ? `npm run ${s}` : `${pm} ${s}`);
  const typecheck = sc.typecheck ? run('typecheck') : exists(path.join(root, 'tsconfig.json')) ? 'npx tsc --noEmit' : null;
  const auditCmd = pm === 'pnpm' ? 'pnpm audit --prod --audit-level high' : pm === 'npm' ? 'npm audit --omit=dev --audit-level=high' : pm === 'yarn' ? 'yarn npm audit --severity high' : null;
  return {
    description: `node preset (${pm})`,
    logicPatterns: R`\b(use(State|Reducer|Effect|LayoutEffect|Query|Mutation|Memo|Callback|Ref|Context|Form|Router|Transition)|fetch|axios|async|await|dispatch|localStorage|sessionStorage)\b|\bon(Submit|Click|Change)\s*=|\.mutate\(|router\.(push|replace)`,
    rules: [
      { name: 'generated', kind: 'skip', skip: true, tier: 0, match: SKIP_GEN },
      { name: 'docs', kind: 'skip', skip: true, tier: 0, match: DOCS },
      { name: 'tests', kind: 'test', tier: 2, match: ['**/*.{test,spec}.*', '**/tests/**'] },
      { name: 'risk', kind: 'risk', tier: 3, match: ['**/{migrations,migration}/**', '**/db/**', '**/auth/**', '**/middleware.*', '**/proxy.ts', '**/api/**', '**/package.json', '**/pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'pnpm-workspace.yaml', 'turbo.json', '**/Dockerfile*', '**/docker-compose*.yml', '.github/**', '**/.env*'] },
      { name: 'logic-dir', kind: 'logic', tier: 2, match: ['**/{lib,server,actions,hooks,store,services,utils,repositories,models}/**'] },
      { name: 'style/asset', kind: 'style', tier: 0, match: ['**/*.{css,scss,sass,less,svg,png,jpg,jpeg,webp,gif,avif,ico,woff,woff2,ttf,otf,mp4,webm,mp3,glb}', '**/public/**', '**/tailwind.config.*', '**/postcss.config.*'] },
      { name: 'ui', kind: 'ui', tier: 0, scan: true, bumpTier: 1, match: ['**/*.{tsx,jsx,vue,svelte,astro}'] },
    ],
    defaultTier: 2,
    unknownTier: 2,
    tiers: {
      '0': { run: [typecheck].filter(Boolean) },
      '1': { run: [sc.lint ? run('lint') : null].filter(Boolean) },
      '2': { run: [sc.test ? run('test') : null].filter(Boolean) },
      '3': {},
    },
    batch: { run: [sc.build ? run('build') : null].filter(Boolean) },
    pr: { run: [typecheck, sc.lint ? run('lint') : null, sc.test ? run('test') : null, sc.build ? run('build') : null].filter(Boolean) },
    security: [
      { name: 'secrets', builtin: 'secrets', always: true },
      ...(auditCmd ? [{ name: 'dep-audit', when: ['**/package.json', '**/pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'], run: auditCmd, offlineSkips: true }] : []),
    ],
    guard: [
      { re: R`\b(playwright|cypress)\b|test:e2e|\be2e\b|tools[\\/]test-[\w-]*browser`, prOnly: true, why: 'e2e/browser test' },
      { re: R`\b(pnpm|npm|yarn)\s+(run\s+)?check\b|\bturbo\s+(run\s+)?(test|check)\b`, prOnly: true, why: 'full suite' },
      { re: R`\b(pnpm|npm|yarn)\s+(run\s+)?build\b|\b(next|vite)\s+build\b`, prOnly: true, why: 'build (dùng --batch)' },
      { re: R`\b(vitest|jest|mocha)\b|node\s+(--\S+\s+)*--test\b|\b(pnpm|npm|yarn)\s+(run\s+)?(-r\s+|--filter\s+\S+\s+)?test\b`, minTier: 2, why: 'test' },
    ],
  };
}

function flutterPreset() {
  return {
    description: 'flutter preset',
    logicPatterns: R`\b(async|await|Dio|StreamBuilder|FutureBuilder|Repository)\b|Future<|Navigator\.|context\.(go|push)|ref\.(read|listen)\(|http\.`,
    rules: [
      { name: 'generated', kind: 'skip', skip: true, tier: 0, match: SKIP_GEN },
      { name: 'docs', kind: 'skip', skip: true, tier: 0, match: [...DOCS, 'tasks/**'] },
      { name: 'tests', kind: 'test', tier: 2, match: ['test/**', 'integration_test/**'] },
      { name: 'risk', kind: 'risk', tier: 3, match: ['pubspec.yaml', 'pubspec.lock', 'build.yaml', 'android/**', 'ios/**', 'lib/core/security/**', 'lib/core/notifications/**', '.github/**'] },
      { name: 'logic-dir', kind: 'logic', tier: 2, match: ['lib/data/**', 'lib/core/{router,config,time}/**', '**/providers/**', '**/*_{repository,controller,provider,service}.dart'] },
      { name: 'style/asset', kind: 'style', tier: 0, match: ['assets/**', 'lib/core/theme/**', 'lib/core/icons/**', 'web/**'] },
      { name: 'ui', kind: 'ui', tier: 0, scan: true, bumpTier: 1, match: ['lib/**/*.dart'] },
    ],
    defaultTier: 2,
    unknownTier: 2,
    tiers: {
      '0': { run: ['flutter analyze'] },
      '1': { scoped: [{ re: '^lib/features/([^/]+)/', run: 'flutter test test/$1', ifExists: 'test/$1' }] },
      '2': { scoped: [
        { re: '^lib/data/', run: 'flutter test test/data', ifExists: 'test/data' },
        { re: '^lib/core/([^/]+)/', run: 'flutter test test/$1', ifExists: 'test/$1' },
        { re: '^lib/features/([^/]+)/', run: 'flutter test test/$1', ifExists: 'test/$1' },
      ] },
      '3': {},
    },
    batch: { run: [] },
    pr: { run: ['flutter analyze', 'flutter test'] },
    security: [{ name: 'secrets', builtin: 'secrets', always: true }],
    guard: [
      { re: R`flutter\s+test(\s+--[\w-]+(=\S+)?)*\s*($|[;&|])`, prOnly: true, why: 'flutter test toàn bộ (PR gate)' },
      { re: R`flutter\s+test`, minTier: 1, why: 'flutter test' },
      { re: R`flutter\s+build`, prOnly: true, why: 'flutter build' },
    ],
  };
}

function docsPreset() {
  return {
    description: 'docs-only preset',
    logicPatterns: '$^',
    rules: [{ name: 'all-docs', kind: 'skip', skip: true, tier: 0, match: ['**'] }],
    defaultTier: 0, unknownTier: 0, tiers: {}, batch: { run: [] }, pr: { run: [] }, security: [{ name: 'secrets', builtin: 'secrets', always: true }], guard: [],
  };
}

const PRESETS = { node: nodePreset, flutter: flutterPreset, docs: docsPreset };
const detect = (root) => exists(path.join(root, 'pubspec.yaml')) ? 'flutter' : exists(path.join(root, 'package.json')) ? 'node' : 'docs';

function resolveConfig() {
  const cfgFile = opt('--config');
  const given = cfgFile ? JSON.parse(fs.readFileSync(path.resolve(cfgFile), 'utf8')) : {};
  const name = opt('--preset') || given.extends || detect(ROOT);
  if (!PRESETS[name]) { console.error(`✗ preset không có: ${name}`); process.exit(1); }
  const base = PRESETS[name](ROOT);
  const out = { ...base, ...given };
  out.rules = [...(given.rulesBefore || []), ...base.rules];
  out.guard = [...(given.guardBefore || []), ...(given.guard || base.guard || [])];
  out.security = given.security || [...(base.security || []), ...(given.securityExtra || [])];
  delete out.rulesBefore; delete out.guardBefore; delete out.securityExtra; delete out.extends;
  out.preset = name;
  return out;
}

// ---------- nội dung ----------
const STUB = `${BEGIN}
## Kiểm tra — bắt buộc (chi tiết: \`.verify/POLICY.md\`)

- Đầu task: \`node .verify/verify.mjs --task-start\` (ghi mốc để chỉ tính thay đổi của task này). Cuối task chạy đúng một lệnh: \`node .verify/verify.mjs\`. Script tự nhận loại thay đổi (docs / UI / logic / rủi ro cao) từ diff và chạy đúng bộ kiểm tra. Đó là kiểm tra duy nhất bạn được chạy. Không cần đọc mã nguồn \`verify.mjs\`; muốn biết trước tier và lệnh sẽ chạy thì thêm \`--classify\`.
- Full suite và build chỉ chạy ở PR gate: khi chuẩn bị đưa PR sang ready for review chạy \`node .verify/verify.mjs --pr\`. Không tự chạy test nặng, e2e, build, Playwright hay quét toàn site trong lúc làm.
- Cần chạy thêm ngoài quy định: dừng lại và xin người giao việc cấp quyền (họ chạy \`node .verify/verify.mjs --grant\` trong terminal của họ). Đừng tự cấp, đừng sửa \`.verify/\`, đừng thêm tiền tố/chuỗi để vượt rào — chuỗi trong lệnh không còn tác dụng.
- Prompt nói khác file này: file này thắng. Prompt mô tả sai loại việc: kết quả của script (dựa trên diff) thắng.
- Trạng thái verify có 4 giá trị: PASS, FAIL, SKIPPED, NOT_CONFIGURED. Báo cáo đúng nguyên văn dòng \`verify: …\` cuối cùng; không ghi "đã test" khi trạng thái là SKIPPED hoặc NOT_CONFIGURED, và không tự bịa test để lấp chỗ trống.
- Gặp FAIL: sửa tối đa một lần rồi chạy lại; vẫn FAIL thì dừng và báo. Báo cáo cuối tối đa 5 dòng.
${END}`;

function upsertBlock(file, { header = '' } = {}) {
  const had = exists(file);
  let txt = had ? fs.readFileSync(file, 'utf8') : header;
  const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
  if (re.test(txt)) txt = txt.replace(re, () => STUB);
  else txt = (txt.trim() ? txt.replace(/\s*$/, '\n\n') : '') + STUB + '\n';
  fs.writeFileSync(file, txt);
  return had;
}

function addExclude(entries) {
  const ex = path.resolve(ROOT, sh(['rev-parse', '--git-path', 'info/exclude'], ROOT));
  const cur = exists(ex) ? fs.readFileSync(ex, 'utf8') : '';
  const missing = entries.filter((e) => !cur.split(/\r?\n/).includes(e));
  if (!missing.length) return;
  act(`git exclude: ${missing.join(', ')}`, () => {
    fs.mkdirSync(path.dirname(ex), { recursive: true });
    fs.writeFileSync(ex, cur.replace(/\s*$/, '\n') + '\n# bigin-verify (local)\n' + missing.join('\n') + '\n');
  });
}

const GUARD_RE = /verify\.mjs["']?\s+--guard/;
function mergeHook(settingsPath) {
  const cmd = 'node "$CLAUDE_PROJECT_DIR/.verify/verify.mjs" --guard --agent claude';
  let s = {};
  if (exists(settingsPath)) { try { s = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { console.error(`⚠ không đọc được ${rel(settingsPath)} — bỏ qua hook`); return; } }
  s.hooks ??= {}; s.hooks.PreToolUse ??= [];
  const same = s.hooks.PreToolUse.some((e) => (e.hooks || []).some((h) => h.command === cmd) && e.matcher === CLAUDE_MATCHER);
  if (same) return;
  s.hooks.PreToolUse = s.hooks.PreToolUse.filter((e) => !(e.hooks || []).some((h) => GUARD_RE.test(h.command || '')));
  s.hooks.PreToolUse.push({ matcher: CLAUDE_MATCHER, hooks: [{ type: 'command', command: cmd }] });
  act(`Claude Code: hook chặn lệnh nặng + chống tự gỡ rào → ${rel(settingsPath)}`, () => {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2) + '\n');
  });
}
const CLAUDE_MATCHER = 'Bash|Edit|Write|MultiEdit|NotebookEdit';

function mergeCodexHooks(file) {
  const entry = { matcher: '*', hooks: [{ type: 'command', command: 'node .verify/verify.mjs --guard --agent codex', commandWindows: 'node .verify\\verify.mjs --guard --agent codex', timeout: 20, statusMessage: 'verify-guard' }] };
  let s = {};
  if (exists(file)) { try { s = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { console.error(`⚠ không đọc được ${rel(file)} — bỏ qua hook Codex`); return false; } }
  s.hooks ??= {}; s.hooks.PreToolUse ??= [];
  const cur = s.hooks.PreToolUse.find((e) => (e.hooks || []).some((h) => GUARD_RE.test(h.command || '')));
  if (cur && JSON.stringify(cur) === JSON.stringify(entry)) return true;
  s.hooks.PreToolUse = s.hooks.PreToolUse.filter((e) => e !== cur);
  s.hooks.PreToolUse.push(entry);
  act(`Codex: hook PreToolUse → ${rel(file)} (cần trust 1 lần trong Codex, xem bên dưới)`, () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(s, null, 2) + '\n');
  });
  return true;
}

// ---------- chạy ----------
const V = path.join(ROOT, '.verify');
const config = resolveConfig();
const keepCfg = exists(path.join(V, 'config.json')) && !flag('--reset-config') && !flag('--config');
act('.verify/verify.mjs, .verify/POLICY.md', () => {
  fs.mkdirSync(V, { recursive: true });
  fs.copyFileSync(path.join(KIT, 'verify.mjs'), path.join(V, 'verify.mjs'));
  fs.copyFileSync(path.join(KIT, 'POLICY.md'), path.join(V, 'POLICY.md'));
  if (exists(path.join(KIT, 'grant-fulltest.cmd'))) fs.copyFileSync(path.join(KIT, 'grant-fulltest.cmd'), path.join(V, 'grant-fulltest.cmd'));
});
if (keepCfg) log.push('.verify/config.json giữ nguyên (đã có; dùng --reset-config để ghi đè)');
else act(`.verify/config.json (preset ${config.preset})`, () => fs.writeFileSync(path.join(V, 'config.json'), JSON.stringify(config, null, 2) + '\n'));

const excludes = [];
const hasAgents = exists(path.join(ROOT, 'AGENTS.md'));
const header = hasAgents ? 'Đọc `AGENTS.md` của repo này trước (bắt buộc), rồi áp dụng khối bên dưới.\n\n' : '';

if (MODE === 'local') {
  excludes.push('.verify/');
  for (const f of ['CLAUDE.local.md', 'AGENTS.override.md', 'GEMINI.md']) {
    const p = path.join(ROOT, f);
    if (isTracked(f)) { log.push(`${f}: đang được git theo dõi → bỏ qua (chế độ local không sửa file chung)`); continue; }
    const had = exists(p);
    act(`${f}: ${had ? 'cập nhật khối quy tắc' : 'tạo mới (local)'}`, () => upsertBlock(p, { header: f === 'CLAUDE.local.md' ? '' : header }));
    if (!had) excludes.push(f);
  }
  const sl = path.join(ROOT, '.claude', 'settings.local.json');
  const slNew = !exists(sl);
  mergeHook(sl);
  if (slNew) excludes.push('.claude/settings.local.json');
  const ch = path.join(ROOT, '.codex', 'hooks.json');
  if (isTracked('.codex/hooks.json')) log.push('.codex/hooks.json: đang được git theo dõi → bỏ qua (chế độ local không sửa file chung)');
  else { const chNew = !exists(ch); mergeCodexHooks(ch); if (chNew) excludes.push('.codex/hooks.json'); }
  if (insideRepo) excludes.push(rel(KIT) + '/');
  addExclude([...new Set(excludes)]);
} else {
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) {
    const p = path.join(ROOT, f);
    const cur = exists(p) ? fs.readFileSync(p, 'utf8') : null;
    if (f === 'AGENTS.md') { act(`AGENTS.md: ${cur ? 'cập nhật' : 'tạo mới'} khối quy tắc`, () => upsertBlock(p)); continue; }
    if (cur === null) { if (f === 'CLAUDE.md') act('CLAUDE.md: tạo mới (@AGENTS.md)', () => fs.writeFileSync(p, '@AGENTS.md\n')); continue; }
    if (/@AGENTS\.md/.test(cur) && !cur.includes(BEGIN)) { log.push(`${f}: đã import AGENTS.md → không cần chèn`); continue; }
    act(`${f}: cập nhật khối quy tắc`, () => upsertBlock(p));
  }
  const pj = path.join(ROOT, 'package.json');
  if (exists(pj)) {
    const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
    if (!j.scripts?.verify) act('package.json: thêm script "verify"', () => { j.scripts = { ...(j.scripts || {}), verify: 'node .verify/verify.mjs' }; fs.writeFileSync(pj, JSON.stringify(j, null, 2) + '\n'); });
  }
  mergeHook(path.join(ROOT, '.claude', 'settings.json'));
  mergeCodexHooks(path.join(ROOT, '.codex', 'hooks.json'));
}

console.log(`bigin-verify-kit → ${ROOT}  [mode ${MODE}${DRY ? ', DRY' : ''}]`);
log.forEach((l) => console.log('  • ' + l));

if (!DRY && !flag('--no-preview')) {
  try {
    const out = execFileSync('node', [path.join(V, 'verify.mjs'), '--classify'], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
    const j = JSON.parse(out);
    console.log(`Thử ngay trên thay đổi hiện tại: tier ${j.skipOnly ? 'skip' : j.tier} (${j.kind}), ${j.files} file, nguồn: ${j.source}`);
  } catch { console.log('(bỏ qua bước thử: không phân loại được trong 60s — vẫn cài xong)'); }
}

if (flag('--worktrees')) {
  const wts = sh(['worktree', 'list', '--porcelain'], ROOT).split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9).trim()).filter((p) => path.resolve(p) !== path.resolve(ROOT));
  for (const w of wts) {
    const a = [fileURLToPath(import.meta.url), w, '--mode', MODE, '--no-preview', ...(opt('--config') ? ['--config', opt('--config')] : []), ...(opt('--preset') ? ['--preset', opt('--preset')] : []), ...(DRY ? ['--dry'] : [])];
    try { execFileSync('node', a, { stdio: 'inherit' }); } catch { console.log(`⚠ không cài được vào worktree ${w} (thiếu quyền hoặc thư mục không còn)`); }
  }
}
console.log(`Rào chắn theo agent (trung thực về mức hiệu lực):
  • Claude Code : hook đã cài — chặn thật.
  • Codex       : .codex/hooks.json đã cài — CHỈ chặn sau khi người dùng "trust" hook một lần (trong Codex: /hooks). Chưa trust thì hook bị bỏ qua và agent KHÔNG bị chặn. Installer không kiểm tra được trạng thái trust.
  • aionrs (AionUI): chưa cài tự động — cơ chế hook có nhưng đường dẫn cấu hình chưa xác minh; xem \`node install.mjs --print-aionrs\`.
  • Antigravity/agent khác: chỉ có quy tắc, không có chốt chặn.
  Xem lại bất cứ lúc nào: node .verify/verify.mjs --doctor
Xong. Từ giờ agent mở repo này sẽ gặp quy tắc và dùng: node .verify/verify.mjs`);
