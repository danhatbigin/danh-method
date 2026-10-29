#!/usr/bin/env node
// bigin-verify v1.1 — phân loại thay đổi thành "tier", chỉ chạy đúng bộ kiểm tra tier đó cần,
// và báo trạng thái trung thực: PASS / FAIL / SKIPPED / NOT_CONFIGURED.
// Không phụ thuộc thư viện nào. Cần: Node >= 18 và git.
//
//   node .verify/verify.mjs                 phân loại + chạy kiểm tra (lệnh agent cần chạy cuối task)
//   node .verify/verify.mjs --task-start    ghi mốc đầu task (chỉ tính thay đổi từ mốc này)
//   node .verify/verify.mjs --task-end      xoá mốc task
//   node .verify/verify.mjs --classify      chỉ in tier + lý do + lệnh (JSON), không chạy gì
//   node .verify/verify.mjs --dry           in các lệnh sẽ chạy
//   node .verify/verify.mjs --files a,b     chỉ xét danh sách file này (hoặc --files-from <file|->)
//   node .verify/verify.mjs --base <ref>    chỉ xét thay đổi từ commit gốc này đến working tree
//   node .verify/verify.mjs --tier N        ép tier tối thiểu (chỉ nâng). Env: VERIFY_TIER=N
//   node .verify/verify.mjs --batch         gom batch (thường là build một lần)
//   node .verify/verify.mjs --pr            PR gate: full suite + mọi kiểm tra bảo mật (strict)
//   node .verify/verify.mjs --release       trước deploy
//   node .verify/verify.mjs --doctor        báo cáo trung thực: rào chắn nào đang thật sự có hiệu lực
//   node .verify/verify.mjs --grant [phút]  NGƯỜI cấp quyền chạy lệnh nặng tạm thời (cần terminal thật)
//   node .verify/verify.mjs --revoke        thu hồi quyền
//   node .verify/verify.mjs --guard [--agent claude|codex|aionrs]   chế độ hook của agent

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const VERSION = '1.1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const has = (n) => argv.includes(n);
const optv = (n) => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; return v === undefined || v.startsWith('--') ? '' : v; };

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return path.resolve(HERE, '..'); }
})();
const P = (...a) => path.join(HERE, ...a);
const ST = { PASS: 'PASS', FAIL: 'FAIL', SKIPPED: 'SKIPPED', NC: 'NOT_CONFIGURED' };
const KIND_ORDER = ['skip', 'style', 'ui', 'ui+logic', 'test', 'logic', 'risk'];

// ---------- glob ----------
const esc = (s) => s.replace(/[.+^$()|[\]\\]/g, '\\$&');
function globToRe(g) {
  let re = '', i = 0;
  while (i < g.length) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') { if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 3; continue; } re += '.*'; i += 2; continue; }
      re += '[^/]*'; i++; continue;
    }
    if (c === '?') { re += '[^/]'; i++; continue; }
    if (c === '{') { const j = g.indexOf('}', i); re += '(?:' + g.slice(i + 1, j).split(',').map(esc).join('|') + ')'; i = j + 1; continue; }
    re += esc(c); i++;
  }
  return new RegExp('^' + re + '$');
}
const compiled = new Map();
const matchAny = (globs, file) => (globs || []).some((g) => { if (!compiled.has(g)) compiled.set(g, globToRe(g)); return compiled.get(g).test(file); });

// ---------- git ----------
const git = (args, extra = {}) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: (cfg.gitTimeoutSec || 25) * 1000, maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], ...extra });
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const short = (r) => { try { return git(['rev-parse', '--short', r]).trim(); } catch { return String(r).slice(0, 7); } };
const fileHash = (f) => {
  try {
    const p = path.join(ROOT, f); const st = fs.statSync(p);
    if (!st.isFile()) return 'DIR';
    if (st.size > 5e6) return `big:${st.size}:${st.mtimeMs}`;
    return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
  } catch { return 'DELETED'; }
};
function statusFiles() {
  const st = git(['status', '--porcelain', '-z', '-uall', '--no-renames']).split('\0').filter((x) => x.length > 3);
  return { untracked: st.filter((x) => x.startsWith('??')).map((x) => x.slice(3)), tracked: st.filter((x) => !x.startsWith('??')).map((x) => x.slice(3)) };
}
const norm = (f) => {
  let p = f.trim().replace(/^"|"$/g, '').replace(/\\/g, '/'); const r = ROOT.replace(/\\/g, '/');
  if (p.toLowerCase().startsWith(r.toLowerCase() + '/')) p = p.slice(r.length + 1);
  return p.replace(/^\.\//, '');
};

// ---------- phạm vi thay đổi (scope) ----------
const taskName = () => optv('--task') || process.env.VERIFY_TASK || 'default';
const taskFile = (n) => P('tasks', `${n.replace(/[^\w.-]/g, '_')}.json`);

function resolveScope() {
  try {
    const filesArg = optv('--files') ?? process.env.VERIFY_FILES;
    const filesFrom = optv('--files-from');
    const base = optv('--base') ?? optv('--since') ?? process.env.VERIFY_BASE;
    if (filesArg !== undefined && filesArg !== '' || filesFrom) {
      let raw = filesArg || '';
      if (filesFrom) raw = filesFrom === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(filesFrom), 'utf8');
      const files = [...new Set(raw.split(/[,;\n]/).map(norm).filter(Boolean))];
      const tracked = new Set(); for (let i = 0; i < files.length; i += 40) lines(git(['ls-files', '--', ...files.slice(i, i + 40)])).forEach((f) => tracked.add(f));
      const untracked = new Set(files.filter((f) => !tracked.has(f) && fs.existsSync(path.join(ROOT, f))));
      return { files, untracked, source: `danh sách file chỉ định (${files.length})`, ref: base || 'HEAD', kind: 'files' };
    }
    if (base) {
      const committed = lines(git(['diff', '--name-only', '--no-renames', base, 'HEAD']));
      const s = statusFiles();
      return { files: [...new Set([...committed, ...s.tracked, ...s.untracked])], untracked: new Set(s.untracked), source: `base ${short(base)}`, ref: base, kind: 'base' };
    }
    const tf = taskFile(taskName());
    let note;
    if (fs.existsSync(tf)) {
      const t = JSON.parse(fs.readFileSync(tf, 'utf8'));
      const ageH = (Date.now() - Date.parse(t.at)) / 36e5;
      let okBase = true; try { git(['merge-base', '--is-ancestor', t.base, 'HEAD']); } catch { okBase = false; }
      if (ageH > (cfg.taskMaxAgeHours || 24)) note = `mốc task "${t.name}" quá ${Math.round(ageH)}h → bỏ qua, xét cả working tree`;
      else if (!okBase) note = `mốc task "${t.name}" không còn nằm trong lịch sử nhánh hiện tại → bỏ qua`;
      else {
        const committed = lines(git(['diff', '--name-only', '--no-renames', t.base, 'HEAD']));
        const s = statusFiles();
        const dirty = [...s.tracked, ...s.untracked].filter((f) => t.baseline?.[f] === undefined || t.baseline[f] !== fileHash(f));
        return { files: [...new Set([...committed, ...dirty])], untracked: new Set(s.untracked), source: `task "${t.name}" từ ${short(t.base)}`, ref: t.base, kind: 'task' };
      }
    }
    const s = statusFiles();
    if (s.tracked.length || s.untracked.length) return { files: [...new Set([...s.tracked, ...s.untracked])], untracked: new Set(s.untracked), source: 'working tree', ref: 'HEAD', kind: 'tree', note };
    return { files: lines(git(['diff', '--name-only', '--no-renames', 'HEAD~1', 'HEAD'])), untracked: new Set(), source: 'commit cuối', ref: 'HEAD~1', kind: 'last', note };
  } catch (e) {
    return { files: null, untracked: new Set(), source: `git lỗi/timeout (${e.code || String(e.message).split('\n')[0].slice(0, 60)})`, ref: 'HEAD', kind: 'error' };
  }
}

// ---------- các dòng được thêm (để dò logic / bí mật) ----------
const addedCache = new Map();
const BINARY_EXT = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp[34]|webm|glb|pdf|zip|gz|lock|sqlite|db)$/i;
function loadAdded(scope, files) {
  const need = files.filter((f) => !addedCache.has(f) && !BINARY_EXT.test(f));
  const tracked = need.filter((f) => !scope.untracked.has(f));
  for (let i = 0; i < tracked.length; i += 40) {
    let out = ''; try { out = git(['diff', '-U0', '--no-color', '--no-renames', scope.ref, '--', ...tracked.slice(i, i + 40)]); } catch {}
    let cur = null, n = 0;
    for (const l of out.split('\n')) {
      if (l.startsWith('+++ ')) { const m = l.slice(4).replace(/\t.*$/, '').replace(/^"|"$/g, ''); cur = m === '/dev/null' ? null : m.replace(/^b\//, ''); if (cur && !addedCache.has(cur)) addedCache.set(cur, []); continue; }
      if (l.startsWith('@@')) { const m = l.match(/\+(\d+)/); n = m ? Number(m[1]) : 0; continue; }
      if (cur && l.startsWith('+') && !l.startsWith('+++')) { addedCache.get(cur).push({ n, text: l.slice(1) }); n++; }
    }
  }
  for (const f of need) if (!addedCache.has(f)) {
    if (scope.untracked.has(f)) {
      try { const p = path.join(ROOT, f); if (fs.statSync(p).size < 512 * 1024) addedCache.set(f, fs.readFileSync(p, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text }))); else addedCache.set(f, []); } catch { addedCache.set(f, []); }
    } else addedCache.set(f, []);
  }
  return (f) => addedCache.get(f) || [];
}

// ---------- phân loại ----------
function classify(scope) {
  if (!scope.files) return { tier: cfg.unknownTier ?? 2, kind: 'unknown', source: scope.source, count: 0, reasons: ['không đọc được diff → chọn tier thận trọng'], files: [], skipOnly: false };
  const logicRe = new RegExp(cfg.logicPatterns || '$^');
  const scanFiles = scope.files.filter((f) => (cfg.rules || []).find((r) => matchAny(r.match, f))?.scan);
  const added = loadAdded(scope, scanFiles);
  const per = [];
  for (const f of scope.files) {
    const rule = (cfg.rules || []).find((r) => matchAny(r.match, f));
    let tier, kind, why;
    if (!rule) { tier = cfg.defaultTier ?? 2; kind = 'logic'; why = 'không khớp rule nào'; }
    else {
      tier = rule.tier; kind = rule.kind || 'logic'; why = rule.name || rule.kind;
      if (rule.scan) {
        const hit = added(f).map((l) => l.text.match(logicRe)).find(Boolean);
        if (hit) { tier = Math.max(tier, rule.bumpTier ?? 1); kind = 'ui+logic'; why = `${rule.name || 'ui'}: dòng thêm có "${hit[0].trim().slice(0, 24)}"`; }
      }
    }
    per.push({ file: f, tier, kind, why, skip: !!rule?.skip });
  }
  const real = per.filter((p) => !p.skip);
  const skipOnly = per.length > 0 && real.length === 0;
  let tier = real.reduce((m, p) => Math.max(m, p.tier), 0);
  const kind = real.reduce((k, p) => (KIND_ORDER.indexOf(p.kind) > KIND_ORDER.indexOf(k) ? p.kind : k), 'skip');
  const forced = Number(optv('--tier') ?? process.env.VERIFY_TIER ?? 0) || 0;
  const forcedNote = forced > tier ? [`ép nâng lên tier ${forced}`] : [];
  tier = Math.max(tier, forced);
  const top = [...real].sort((a, b) => b.tier - a.tier).slice(0, 4).map((p) => `${p.file} → T${p.tier} (${p.why})`);
  return { tier, kind: skipOnly ? 'skip' : kind, source: scope.source, count: per.length, reasons: [...top, ...forcedNote], files: per.map((p) => p.file), skipOnly: skipOnly && !forced };
}

// ---------- kế hoạch kiểm tra ----------
const KINDS = [['test', /\btest\b|vitest|jest|mocha|--test\b|flutter test|playwright/i], ['typecheck', /\btsc\b|typecheck|flutter analyze|dart analyze|mypy/i], ['lint', /\blint\b|eslint|oxlint|biome/i], ['build', /\bbuild\b/i]];
const kindOf = (cmd) => (KINDS.find(([, re]) => re.test(cmd)) || ['other'])[0];
const PM_BUILTIN = new Set(['install', 'i', 'add', 'rm', 'remove', 'update', 'up', 'audit', 'exec', 'dlx', 'store', 'outdated', 'list', 'ls', 'why', 'publish', 'pack', 'init', 'create', 'rebuild', 'prune', 'dedupe', 'link', 'unlink', 'patch', 'env', 'config', 'fetch', 'import', 'licenses', 'approve-builds', 'x']);
function scriptMissing(cmd) {
  const m = cmd.match(/^(pnpm|npm|yarn|bun)\s+(?:--filter\s+(\S+)\s+)?(?:run\s+)?([A-Za-z0-9:_.-]+)\s*$/);
  if (!m) return null;
  const [, , filter, script] = m;
  if (PM_BUILTIN.has(script) && !/^run\s/.test(cmd.replace(/^(pnpm|npm|yarn|bun)\s+(--filter\s+\S+\s+)?/, ''))) return null;
  let dir = ROOT;
  if (filter) { if (!/^[./]/.test(filter)) return null; dir = path.resolve(ROOT, filter); }
  try { const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); return pkg.scripts?.[script] ? null : `script "${script}" không có trong ${path.relative(ROOT, path.join(dir, 'package.json')).replace(/\\/g, '/') || 'package.json'}`; }
  catch { return `không đọc được package.json ở ${filter || '.'}`; }
}
const mk = (cmd, extra = {}) => ({ cmd, kind: extra.kind || kindOf(cmd), status: undefined, ...extra });

// Chạy test theo file (scoped có "tests"): chỉ các file test đã đổi, hoặc test có tên khớp với file nguồn đã đổi.
// run chứa {files} (đường dẫn tương đối với relTo nếu có). Không khớp gì → SKIPPED; quá maxFiles → SKIPPED (chạy ở --pr).
function listFiles(dirRel) {
  const out = []; const base = path.join(ROOT, dirRel);
  try { for (const e of fs.readdirSync(base, { recursive: true })) out.push(path.posix.join(dirRel, String(e).replace(/\\/g, '/'))); } catch { /* không có thư mục */ }
  return out;
}
function testsFor(s, files) {
  const testGlob = s.tests;
  const inWhen = (f) => !s.when || matchAny(s.when, f);
  const isTest = (f) => matchAny([testGlob], f);
  const srcStems = files.filter((f) => inWhen(f) && !isTest(f))
    .map((f) => path.posix.basename(f).replace(/\.[^.]+$/, '').replace(/\.(test|spec)$/, '').toLowerCase()).filter((s2) => s2.length >= 4);
  const dir = testGlob.split('*')[0].replace(/\/$/, '') || '.';
  const all = listFiles(dir).filter(isTest);
  const picked = new Set([
    ...files.filter(isTest),
    ...all.filter((t) => { const b = path.posix.basename(t).toLowerCase(); return srcStems.some((st) => b.includes(st)); }),
  ]);
  const rel = (f) => s.relTo ? path.posix.relative(s.relTo, f) : f;
  if (!picked.size) return [{ cmd: `test (không có test khớp với thay đổi: ${testGlob})`, extra: { kind: 'test', status: ST.SKIPPED, reason: s.noMatchNote || 'không có test khớp với file đã đổi; test đầy đủ chạy ở --pr' } }];
  const max = s.maxFiles ?? 12;
  if (picked.size > max) return [{ cmd: `test (${picked.size} file)`, extra: { kind: 'test', status: ST.SKIPPED, reason: `khớp ${picked.size} file test (> ${max}); chạy ở --pr hoặc tăng maxFiles` } }];
  const list = [...picked].map(rel).sort().join(' ');
  return [{ cmd: s.run.replace('{files}', list), extra: { kind: 'test' } }];
}

function commandsFor(tier, files) {
  const out = [], seen = new Set();
  const add = (cmd, extra) => { if (cmd && !seen.has(cmd)) { seen.add(cmd); out.push(mk(cmd, extra)); } };
  let start = 0;
  if (cfg.tiers?.[String(tier)]?.inherit === false) start = tier;
  for (let t = start; t <= tier; t++) {
    const tc = cfg.tiers?.[String(t)]; if (!tc) continue;
    (tc.run || []).forEach((c) => add(c));
    for (const s of tc.scoped || []) {
      if (s.tests) { for (const c of testsFor(s, files)) add(c.cmd, c.extra); continue; }
      if (s.when && files.some((f) => matchAny(s.when, f))) add(s.run);
      if (s.re) {
        const re = new RegExp(s.re); const done = new Set();
        for (const f of files) {
          const m = f.match(re); if (!m) continue;
          const sub = (x) => x.replace(/\$(\d)/g, (_, n) => m[Number(n)] || '');
          const cmd = sub(s.run); if (done.has(cmd)) continue; done.add(cmd);
          if (s.ifExists && !fs.existsSync(path.join(ROOT, sub(s.ifExists)))) add(cmd, { status: ST.NC, reason: `không có ${sub(s.ifExists)} để chạy test của vùng này` });
          else add(cmd);
        }
      }
    }
  }
  return out;
}

function planChecks(c, files) {
  if (c.skipOnly) return [];
  const checks = commandsFor(c.tier, files);
  for (const k of checks) { if (k.status) continue; const miss = scriptMissing(k.cmd); if (miss) { k.status = ST.NC; k.reason = miss; } }
  const need = cfg.requireTestAt ?? 2;
  if (c.tier >= need && !checks.some((k) => k.kind === 'test')) {
    const prHasTest = (cfg.pr?.run || []).some((x) => kindOf(x) === 'test' || /\bcheck\b/.test(x));
    checks.push(prHasTest ? { cmd: 'test', kind: 'test', status: ST.SKIPPED, reason: 'test đầy đủ chuyển sang PR gate (node .verify/verify.mjs --pr)' } : { cmd: 'test', kind: 'test', status: ST.NC, reason: `chưa cấu hình test cho thay đổi tier ${c.tier}` });
  }
  return checks;
}

// ---------- chạy ----------
const NOT_FOUND = /is not recognized as an internal or external command|command not found|not found: |ENOENT/i;
const OFFLINE = /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ECONNRESET|getaddrinfo|fetch failed|network|offline/i;
function runOne(k, opts = {}) {
  const t0 = Date.now();
  const r = spawnSync(k.cmd, { shell: true, cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: (cfg.timeoutSec || 900) * 1000, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
  k.secs = ((Date.now() - t0) / 1000).toFixed(1);
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  if (r.error?.code === 'ETIMEDOUT') { k.status = ST.FAIL; k.reason = `quá ${cfg.timeoutSec || 900}s`; k.tail = out.split('\n').slice(-10).join('\n'); return; }
  if (r.status === 0) { k.status = ST.PASS; return; }
  if (r.status === 127 || r.status === 9009 || (out.length < 600 && NOT_FOUND.test(out))) { k.status = ST.NC; k.reason = 'lệnh/công cụ không có trên máy này'; k.tail = out.split('\n').slice(-3).join('\n'); return; }
  if (opts.offlineSkips && OFFLINE.test(out)) { k.status = ST.SKIPPED; k.reason = 'không có mạng — chưa kiểm tra được'; return; }
  k.status = ST.FAIL; k.tail = out.split('\n').slice(-(cfg.failTailLines || 40)).join('\n');
}
function runChecks(checks, opts = {}) {
  let failed = false;
  for (const k of checks) {
    if (k.status) continue;
    if (failed) { k.status = ST.SKIPPED; k.reason = 'bỏ qua vì check trước đã FAIL'; continue; }
    runOne(k, opts);
    if (k.status === ST.FAIL) failed = true;
  }
  return checks;
}
const count = (checks, s) => checks.filter((k) => k.status === s).length;
function overall(checks) {
  if (count(checks, ST.FAIL)) return ST.FAIL;
  if (count(checks, ST.NC)) return ST.NC;
  if (!checks.length || !count(checks, ST.PASS)) return ST.SKIPPED;
  return ST.PASS;
}
const mark = { PASS: '✓ PASS         ', FAIL: '✗ FAIL         ', SKIPPED: '– SKIPPED      ', NOT_CONFIGURED: '? NOT_CONFIGURED' };
function printChecks(checks) {
  for (const k of checks) {
    console.log(`  ${mark[k.status]} ${k.cmd}${k.secs ? ` (${k.secs}s)` : ''}${k.reason ? ` — ${k.reason}` : ''}`);
    if (k.status === ST.FAIL && k.tail) console.log(k.tail.split('\n').map((l) => '      ' + l).join('\n'));
  }
}
const summaryLine = (checks) => ['PASS', 'FAIL', 'SKIPPED', 'NOT_CONFIGURED'].map((s) => [s, count(checks, s)]).filter(([, n]) => n).map(([s, n]) => `${n} ${s}`).join(', ');

// ---------- bảo mật bắt buộc ----------
const SECRET_PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['API key kiểu sk-', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Stripe live key', /\b[rs]k_live_[A-Za-z0-9]{16,}\b/],
];
const SENSITIVE_FILE = /(^|\/)(\.env(\.[\w.-]+)?|id_rsa|id_ed25519|[^/]+\.(pem|p12|pfx|key))$/i;
const SENSITIVE_OK = /(^|\/)\.env\.(example|sample|template|static\.example)$|\.example$/i;
function secretsScan(scope) {
  const k = { cmd: 'builtin:secrets', kind: 'security' };
  if (!scope.files) { k.status = ST.SKIPPED; k.reason = 'không đọc được diff'; return k; }
  const files = scope.files.filter((f) => !matchAny(cfg.secretAllow, f));
  const problems = [];
  for (const f of files) if (SENSITIVE_FILE.test(f) && !SENSITIVE_OK.test(f)) problems.push(`${f}: file nhạy cảm nằm trong thay đổi`);
  const text = files.filter((f) => !BINARY_EXT.test(f)).slice(0, 400);
  const added = loadAdded(scope, text);
  for (const f of text) for (const l of added(f)) for (const [name, re] of SECRET_PATTERNS) if (re.test(l.text)) problems.push(`${f}:${l.n}: ${name}`);
  if (problems.length) { k.status = ST.FAIL; k.tail = problems.slice(0, 10).join('\n') + (problems.length > 10 ? `\n… +${problems.length - 10}` : ''); k.reason = `${problems.length} phát hiện (giá trị không được in ra)`; }
  else { k.status = ST.PASS; k.reason = `${text.length} file đã quét`; }
  return k;
}
function securityChecks(scope, files, all) {
  const out = [];
  for (const s of cfg.security || []) {
    const applies = all || s.always || (s.when && files.some((f) => matchAny(s.when, f)));
    if (!applies) continue;
    if (s.builtin === 'secrets') { out.push(secretsScan(scope)); continue; }
    const k = mk(s.run, { kind: 'security', offlineSkips: s.offlineSkips });
    const miss = scriptMissing(k.cmd); if (miss) { k.status = ST.NC; k.reason = miss; }
    if (!k.status) runOne(k, { offlineSkips: s.offlineSkips });
    k.cmd = `${s.name || 'security'}: ${k.cmd}`;
    out.push(k);
  }
  return out;
}

// ---------- grant (người cấp quyền chạy lệnh nặng) ----------
const AGENT_ENV = /^(CLAUDECODE|CLAUDE_CODE_.*|CODEX_(THREAD|SESSION|SANDBOX|CI).*|AIONUI_.*|AIONRS_.*|GEMINI_CLI.*|AGY_.*)$/;
function grantState() {
  try { const g = JSON.parse(fs.readFileSync(P('grant.json'), 'utf8')); return Date.parse(g.expires_at) > Date.now() ? { active: true, ...g } : { active: false, expired: true }; } catch { return { active: false }; }
}
async function doGrant() {
  const agentVars = Object.keys(process.env).filter((k) => AGENT_ENV.test(k));
  if (agentVars.length) { console.error(`✗ Từ chối: lệnh này chạy trong môi trường của agent (${agentVars.slice(0, 3).join(', ')}). Chỉ người dùng mới cấp quyền, từ terminal của họ.`); process.exit(1); }
  if (!process.stdin.isTTY || !process.stdout.isTTY) { console.error('✗ Từ chối: cần terminal thật (người dùng chạy tay hoặc bấm đúp .verify/grant-fulltest.cmd).'); process.exit(1); }
  const minutes = Math.min(Math.max(Number(optv('--grant')) || 30, 1), cfg.grantMaxMinutes || 240);
  const code = String(Math.floor(1000 + Math.random() * 9000));
  console.log(`Cấp quyền chạy lệnh test/build/e2e nặng cho agent trong repo này, ${minutes} phút.\nGõ lại mã ${code} để xác nhận (Enter để huỷ):`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((r) => rl.question('> ', r)); rl.close();
  if (ans.trim() !== code) { console.log('Đã huỷ.'); process.exit(1); }
  fs.writeFileSync(P('grant.json'), JSON.stringify({ created_at: new Date().toISOString(), expires_at: new Date(Date.now() + minutes * 6e4).toISOString(), minutes, via: 'tty', user: os.userInfo().username }, null, 1));
  console.log(`✓ Đã cấp quyền đến ${new Date(Date.now() + minutes * 6e4).toLocaleTimeString()}. Thu hồi sớm: node .verify/verify.mjs --revoke`);
}

// ---------- guard (hook của agent) ----------
const PROTECTED = /\.verify[\\/](config\.json|verify\.mjs|POLICY\.md|grant\.json|grant-fulltest\.cmd)|\.claude[\\/]settings\.local\.json|\.codex[\\/]hooks\.json/i;
const WRITE_VERB = /(>|\btee\b|\bsed\s+-i|\brm\b|\bdel\b|\bmv\b|\bcp\b|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|\bni\b|\bsc\b|writeFile|WriteAllText|\bsponge\b|\btruncate\b)/i;
const isPureVerify = (cmd) => !/[;&|`$<>()\n\r]/.test(cmd) && /^\s*node\s+["']?(\.[\\/])?\.verify[\\/]verify\.mjs["']?(\s+--[A-Za-z][\w-]*(=\S+)?(\s+[\w./,:\\-]+)?)*\s*$/.test(cmd) && !/--grant\b/.test(cmd);
function audit(entry) { try { fs.appendFileSync(P('audit.log'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n'); } catch {} }

function guard() {
  const agent = optv('--agent') || 'claude';
  const block = (msg) => { console.error(msg); if (agent === 'aionrs') console.log(msg); process.exit(agent === 'aionrs' ? 1 : 2); };
  try {
    let j = {};
    if (!process.stdin.isTTY) { try { j = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {} }
    const ti = j.tool_input || {};
    const tool = String(j.tool_name || process.env.TOOL_NAME || '');
    const cmd = typeof ti.command === 'string' ? ti.command : process.env.TOOL_INPUT_COMMAND;
    const raw = JSON.stringify(ti) + (process.env.TOOL_INPUT_FILE_PATH || '');
    const isShell = typeof cmd === 'string';
    // 1) chống tự gỡ rào / tự cấp quyền
    if (!isShell && /edit|write|patch|replace/i.test(tool) && PROTECTED.test(raw)) block(`[verify-guard] Chặn: không được sửa file rào chắn (${(raw.match(PROTECTED) || [''])[0]}). Cần đổi quy tắc kiểm tra thì báo người giao việc.`);
    if (isShell) {
      if (/--grant\b|grant\.json/.test(cmd)) block('[verify-guard] Chặn: chỉ NGƯỜI DÙNG được cấp quyền chạy lệnh nặng (node .verify/verify.mjs --grant trong terminal của họ). Agent không tự cấp.');
      if (PROTECTED.test(cmd) && WRITE_VERB.test(cmd)) block(`[verify-guard] Chặn: không được sửa file rào chắn (${(cmd.match(PROTECTED) || [''])[0]}).`);
      if (isPureVerify(cmd)) process.exit(0);
    } else process.exit(0);
    // 2) lệnh nặng
    const scan = /^\s*git\s/.test(cmd) ? cmd.replace(/"[^"]*"|'[^']*'/g, '""') : cmd;
    const hit = (cfg.guard || []).find((g) => new RegExp(g.re, 'i').test(scan));
    if (!hit) process.exit(0);
    const g = grantState();
    if (g.active) { audit({ cmd: cmd.slice(0, 200), allowed: 'grant' }); process.exit(0); }
    if (hit.prOnly) block(`[verify-guard] Chặn lệnh: "${cmd.slice(0, 90)}"\nLệnh này (${hit.why || 'full suite'}) chỉ chạy ở PR gate hoặc CI: dùng \`node .verify/verify.mjs --pr\` khi chuẩn bị đưa PR sang ready for review (build gom batch: \`--batch\`).\nCần chạy ngay: xin người giao việc cấp quyền bằng \`node .verify/verify.mjs --grant\` (họ chạy trong terminal của họ).`);
    const c = classify(resolveScope());
    const tier = c.skipOnly ? 0 : c.tier;
    if (tier >= (hit.minTier ?? 0)) process.exit(0);
    block(`[verify-guard] Chặn lệnh: "${cmd.slice(0, 90)}"\nThay đổi hiện tại là tier ${tier} (${c.kind}); lệnh này (${hit.why || 'kiểm tra nặng'}) chỉ dành cho tier ≥ ${hit.minTier}.\nLàm thế này: chạy \`node .verify/verify.mjs\` (script tự chạy đúng bộ kiểm tra). Cần test nặng hơn: xin người giao việc cấp quyền bằng \`node .verify/verify.mjs --grant\`.`);
  } catch (e) { process.exit(0); /* hỏng thì mở (fail-open) để không làm tê liệt agent */ }
}

// ---------- task ----------
function taskStart() {
  const name = optv('--task-start') || optv('--task') || 'default';
  const head = git(['rev-parse', 'HEAD']).trim();
  const s = statusFiles(); const baseline = {};
  for (const f of [...s.tracked, ...s.untracked]) baseline[f] = fileHash(f);
  fs.mkdirSync(P('tasks'), { recursive: true });
  fs.writeFileSync(taskFile(name), JSON.stringify({ name, at: new Date().toISOString(), base: head, branch: (() => { try { return git(['branch', '--show-current']).trim(); } catch { return ''; } })(), baseline }, null, 1));
  console.log(`verify: task "${name}" bắt đầu tại ${head.slice(0, 7)} — ${Object.keys(baseline).length} file đang thay đổi sẵn được ghi nhận và sẽ không tính vào task này.`);
}
function taskEnd() {
  const name = optv('--task-end') || optv('--task') || 'default';
  try { fs.unlinkSync(taskFile(name)); console.log(`verify: đã xoá mốc task "${name}"`); } catch { console.log(`verify: không có mốc task "${name}"`); }
}

// ---------- doctor ----------
function doctor() {
  const ex = (p) => fs.existsSync(path.join(ROOT, p));
  const rd = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return ''; } };
  console.log(`bigin-verify ${VERSION} · repo ${ROOT}\npreset: ${cfg.preset || '?'} · rules: ${(cfg.rules || []).length} · guard patterns: ${(cfg.guard || []).length}`);
  console.log('Rào chắn theo agent (trung thực về mức hiệu lực):');
  console.log(`  Claude Code : ${/verify\.mjs.*--guard/.test(rd('.claude/settings.local.json') + rd('.claude/settings.json')) ? 'hook đã cài (.claude/settings*.json)' : 'CHƯA cài hook'} — chặn thật khi agent là Claude Code`);
  console.log(`  Codex       : ${/verify\.mjs.*--guard/.test(rd('.codex/hooks.json')) ? 'hooks.json đã cài' : 'CHƯA cài .codex/hooks.json'} — chỉ chặn nếu hook đã được "trust" (Codex: /hooks). Script KHÔNG kiểm tra được trạng thái trust → coi như chưa chắc`);
  console.log('  aionrs      : KHÔNG tự cài (đường dẫn cấu hình hook chưa xác minh) — xem README, mục "aionrs"');
  console.log('  Antigravity : KHÔNG cài (AionUI tự quản lý hooks.json của agy)');
  console.log('  Agent khác  : chỉ có quy tắc (CLAUDE.local.md/AGENTS.override.md/GEMINI.md), không có chốt chặn');
  const g = grantState(); console.log(`grant: ${g.active ? `ĐANG BẬT đến ${g.expires_at}` : g.expired ? 'đã hết hạn' : 'không có'}`);
  try { const t = JSON.parse(fs.readFileSync(taskFile(taskName()), 'utf8')); console.log(`task "${t.name}": từ ${t.base.slice(0, 7)} lúc ${t.at}`); } catch { console.log(`task "${taskName()}": chưa có mốc (dùng --task-start)`); }
  const all = new Set(); for (let t = 0; t <= 3; t++) { const tc = cfg.tiers?.[String(t)]; (tc?.run || []).forEach((c) => all.add(c)); (tc?.scoped || []).forEach((s) => all.add(s.run)); }
  (cfg.pr?.run || []).forEach((c) => all.add(c)); (cfg.batch?.run || []).forEach((c) => all.add(c));
  const bad = [...all].map((c) => [c, scriptMissing(c)]).filter(([, m]) => m);
  console.log(bad.length ? `Lệnh cấu hình nhưng THIẾU script (sẽ báo NOT_CONFIGURED):\n${bad.map(([c, m]) => `  - ${c}: ${m}`).join('\n')}` : 'Mọi lệnh package-script được cấu hình đều tồn tại.');
}

// ---------- main ----------
async function main() {
  if (has('--version')) { console.log(VERSION); return 0; }
  if (has('--guard')) { guard(); return 0; }
  if (has('--grant')) { await doGrant(); return 0; }
  if (has('--revoke')) { try { fs.unlinkSync(P('grant.json')); console.log('✓ Đã thu hồi quyền.'); } catch { console.log('Không có quyền nào đang bật.'); } return 0; }
  if (has('--task-start')) { taskStart(); return 0; }
  if (has('--task-end')) { taskEnd(); return 0; }
  if (has('--doctor')) { doctor(); return 0; }

  const strict = has('--ci') || has('--pr') || has('--release');
  const exitFor = (st) => (st === ST.FAIL ? 1 : st === ST.NC ? (strict ? 1 : 3) : 0);
  const save = (obj) => { try { fs.writeFileSync(P('last.json'), JSON.stringify({ version: VERSION, at: new Date().toISOString(), ...obj }, null, 1)); } catch {} };

  if (has('--batch') || has('--pr') || has('--release')) {
    const key = has('--release') ? 'release' : has('--pr') ? 'pr' : 'batch';
    const list = (cfg[key]?.run?.length ? cfg[key].run : key === 'release' ? (cfg.pr?.run || []).concat(cfg.batch?.run || []) : []);
    if (cfg[key]?.note) console.log(`note: ${cfg[key].note}`);
    const checks = list.map((c) => mk(c)); for (const k of checks) { const m = scriptMissing(k.cmd); if (m) { k.status = ST.NC; k.reason = m; } }
    if (!checks.length) checks.push({ cmd: key, kind: 'other', status: ST.NC, reason: `chưa cấu hình "${key}" trong .verify/config.json` });
    if (has('--dry')) { checks.forEach((k) => console.log('would run:', k.cmd)); return 0; }
    runChecks(checks);
    const scope = resolveScope();
    const sec = key === 'batch' ? [] : securityChecks(scope.files ? scope : { ...scope, files: [] }, scope.files || [], true);
    printChecks(checks); if (sec.length) { console.log('  bảo mật:'); printChecks(sec); }
    const st = overall([...checks, ...sec]);
    console.log(`verify: ${key} · ${st} · ${summaryLine([...checks, ...sec])}`);
    save({ mode: key, status: st, checks: [...checks, ...sec].map(({ tail, ...k }) => k) });
    return exitFor(st);
  }

  const scope = resolveScope();
  const c = classify(scope);
  const checks = planChecks(c, c.files);

  if (has('--classify')) {
    console.log(JSON.stringify({ tier: c.tier, kind: c.kind, source: c.source, files: c.count, skipOnly: c.skipOnly, reasons: c.reasons, commands: checks.map((k) => k.cmd), notConfigured: checks.filter((k) => k.status === ST.NC).map((k) => `${k.cmd}: ${k.reason}`) }, null, 1));
    return 0;
  }
  const label = c.skipOnly ? 'chỉ docs/file sinh ra — không cần kiểm tra tier' : `tier ${c.tier} (${c.kind})`;
  console.log(`verify: ${label} · ${c.count} file · ${c.source}`);
  if (scope.note) console.log(`  lưu ý: ${scope.note}`);
  if (c.reasons.length && !c.skipOnly) console.log('  ' + c.reasons.slice(0, 3).join('\n  '));
  if (has('--dry')) { checks.forEach((k) => console.log(`would run: ${k.cmd}${k.status ? ` [${k.status}: ${k.reason}]` : ''}`)); return 0; }

  if (!checks.length && !c.skipOnly) checks.push({ cmd: `tier ${c.tier}`, kind: 'other', status: ST.NC, reason: 'chưa cấu hình lệnh kiểm tra nào cho tier này' });
  runChecks(checks);
  const sec = securityChecks(scope, c.files, false);
  printChecks(checks);
  if (sec.length) { console.log('  bảo mật (bắt buộc):'); printChecks(sec); }
  let st = c.skipOnly ? ST.SKIPPED : overall(checks);
  if (count(sec, ST.FAIL)) st = ST.FAIL; else if (st !== ST.FAIL && count(sec, ST.NC)) st = ST.NC;
  const tail = [summaryLine(checks), sec.length ? `security: ${overall(sec)}` : ''].filter(Boolean).join(' · ');
  console.log(`verify: tier ${c.skipOnly ? 'skip' : c.tier} · ${st}${tail ? ` · ${tail}` : ''}`);
  save({ mode: 'dev', tier: c.tier, kind: c.kind, status: st, scope: c.source, files: c.count, checks: [...checks, ...sec].map(({ tail: _t, ...k }) => k) });
  return exitFor(st);
}
process.exit(await main());
