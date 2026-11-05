#!/usr/bin/env node
// verify-runtime.mjs · bọc verifier bằng một vòng đời DB do NGƯỜI DÙNG cấu hình.
// Không đổi policy/tham số của verify.mjs; chỉ chuẩn bị môi trường rồi chuyển tiếp.
//
//   node .verify/verify-runtime.mjs [--reset=baseline|archive] [--profile-output=<file.json>] [tham số verify...]
//   node .verify/verify-runtime.mjs --questions        in các câu cần hỏi người dùng (JSON)
//   node .verify/verify-runtime.mjs --init <answers.json>   ghi .verify/runtime.json từ câu trả lời
//   node .verify/verify-runtime.mjs --show             in cấu hình đang dùng
//
// Chưa có .verify/runtime.json → thoát mã 5 (ENV) kèm danh sách câu hỏi. Agent phải HỎI người dùng,
// không tự đoán engine, nguồn dữ liệu hay tên biến môi trường.
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const QUESTIONS = [
  { id: 'needsDb', ask: 'Test của dự án có cần DB thật không?', options: ['no', 'yes'] },
  { id: 'mode', ask: 'DB khi test chạy bằng gì?', options: ['container (Docker, tạo/xoá mỗi lượt)', 'local (DB có sẵn trên máy)', 'remote (dịch vụ từ xa)'], when: 'needsDb=yes' },
  { id: 'engine', ask: 'Loại DB và image (container)?', example: 'postgres · postgres:17-alpine', when: 'mode=container' },
  { id: 'seed', ask: 'Dữ liệu mẫu lấy từ đâu, và biến môi trường nào chứa đường dẫn?', example: 'dump ngoài repo · TEST_DB_DUMP | script seed · pnpm db:seed | không có', when: 'needsDb=yes' },
  { id: 'urlEnvs', ask: 'Tên biến môi trường chứa chuỗi kết nối DB (app và admin)?', example: 'DATABASE_URL, TEST_ADMIN_DATABASE_URL', when: 'needsDb=yes' },
  { id: 'defaultReset', ask: 'Mặc định mỗi lượt: khôi phục sạch từ baseline (nhanh) hay archive thật (chậm, sát thực tế)?', options: ['baseline', 'archive'], when: 'needsDb=yes' },
  { id: 'fingerprintInputs', ask: 'File/thư mục nào đổi thì baseline phải dựng lại (migration, seed)?', example: 'db/migrations, tests/support/seed.mjs', when: 'needsDb=yes' },
  { id: 'prTimeoutSec', ask: 'Trần thời gian cho cổng PR (giây)?', example: '900' },
  { id: 'profileDir', ask: 'Lưu profile thời gian chạy ở đâu?', example: '../<tên>-spec/log/verify-profiles (ngoài repo source)' },
];

const DEFAULTS = {
  version: 1, needsDb: false, mode: 'none', engine: 'postgres', image: 'postgres:17-alpine',
  database: 'app_test', username: 'app_test', seed: { kind: 'none', env: null, command: null },
  urlEnvs: ['DATABASE_URL', 'TEST_ADMIN_DATABASE_URL'], defaultReset: 'baseline',
  fingerprintInputs: [], resetEnv: 'TEST_DB_RESET', baselineEnv: 'TEST_DB_BASELINE', prTimeoutSec: 900, profileDir: null,
  minNode: '18.0',
};

export function normalize(answers = {}) {
  const c = { ...DEFAULTS, ...answers };
  c.needsDb = c.needsDb === true || c.needsDb === 'yes';
  if (!c.needsDb) c.mode = 'none';
  else if (!['container', 'local', 'remote'].includes(c.mode)) throw new Error('mode phải là container | local | remote');
  if (!['baseline', 'archive'].includes(c.defaultReset)) throw new Error('defaultReset phải là baseline | archive');
  if (typeof c.urlEnvs === 'string') c.urlEnvs = c.urlEnvs.split(',').map((s) => s.trim()).filter(Boolean);
  if (typeof c.fingerprintInputs === 'string') c.fingerprintInputs = c.fingerprintInputs.split(',').map((s) => s.trim()).filter(Boolean);
  c.prTimeoutSec = Number(c.prTimeoutSec) || 900;
  return c;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.basename(here) === '.verify' ? path.dirname(here) : process.cwd();
const CONFIG = path.join(ROOT, '.verify', 'runtime.json');

function hashInputs(cfg, hash) {
  const visit = (p) => {
    if (!fs.existsSync(p)) { hash.update(`missing:${p}`); return; }
    const st = fs.statSync(p);
    if (st.isDirectory()) for (const e of fs.readdirSync(p).sort()) { hash.update(e); visit(path.join(p, e)); }
    else hash.update(fs.readFileSync(p));
  };
  for (const rel of cfg.fingerprintInputs) visit(path.resolve(ROOT, rel));
}

async function main(argv) {
  if (argv.includes('--questions')) { console.log(JSON.stringify(QUESTIONS, null, 2)); return 0; }
  const initAt = argv.indexOf('--init');
  if (initAt >= 0) {
    const file = argv[initAt + 1];
    if (!file) throw new Error('--init cần đường dẫn file câu trả lời JSON');
    const cfg = normalize(JSON.parse(fs.readFileSync(file, 'utf8')));
    fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
    fs.writeFileSync(CONFIG, `${JSON.stringify(cfg, null, 2)}\n`);
    console.log(`verify-runtime: đã ghi ${path.relative(ROOT, CONFIG)} (mode ${cfg.mode})`);
    return 0;
  }
  if (!fs.existsSync(CONFIG)) {
    console.log('verify-runtime: ENV · chưa có .verify/runtime.json. Hỏi người dùng các câu sau rồi chạy --init <answers.json>:');
    for (const q of QUESTIONS) console.log(`- [${q.id}] ${q.ask}${q.options ? ` (${q.options.join(' / ')})` : ''}${q.example ? ` · ví dụ: ${q.example}` : ''}`);
    return 5;
  }
  const cfg = normalize(JSON.parse(fs.readFileSync(CONFIG, 'utf8')));
  if (argv.includes('--show')) { console.log(JSON.stringify(cfg, null, 2)); return 0; }

  let reset = cfg.defaultReset; let output = null; const forwarded = [];
  for (const a of argv) {
    if (a.startsWith('--reset=')) reset = a.slice(8);
    else if (a.startsWith('--profile-output=')) output = path.resolve(a.slice(17));
    else forwarded.push(a);
  }
  if (!['baseline', 'archive'].includes(reset)) throw new Error('Chọn --reset=baseline hoặc --reset=archive.');
  if (!output && cfg.profileDir) output = path.resolve(ROOT, cfg.profileDir, `verify-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

  try { process.loadEnvFile?.(path.join(ROOT, '.env')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const hash = createHash('sha256');
  if (cfg.seed?.kind === 'dump') {
    const dump = process.env[cfg.seed.env];
    if (!dump || !fs.existsSync(dump)) { console.log(`verify-runtime: ENV · ${cfg.seed.env} phải trỏ tới file dữ liệu mẫu (ngoài repo).`); return 5; }
    hash.update(fs.readFileSync(dump));
  }
  hashInputs(cfg, hash);
  const fingerprint = hash.digest('hex').slice(0, 32);
  const metrics = { mode: cfg.mode, reset, node: process.versions.node, fingerprint, phases: [] };
  const started = performance.now();
  const env = { ...process.env, [cfg.resetEnv]: reset, [cfg.baselineEnv]: fingerprint, VERIFY_RUNTIME_ID: randomBytes(8).toString('hex') };
  let container = null;
  try {
    if (cfg.mode === 'container') {
      let mod;
      try { mod = createRequire(path.join(ROOT, 'package.json'))('@testcontainers/postgresql'); }
      catch { console.log('verify-runtime: ENV · thiếu @testcontainers/postgresql trong dự án; xin phép người dùng trước khi cài.'); return 5; }
      if (cfg.engine !== 'postgres') { console.log(`verify-runtime: ENV · engine ${cfg.engine} chưa có adapter; dùng mode local/remote.`); return 5; }
      const t = performance.now();
      container = await new mod.PostgreSqlContainer(cfg.image).withDatabase(cfg.database).withUsername(cfg.username).withPassword(randomBytes(24).toString('hex')).start();
      metrics.phases.push({ phase: 'container-start', ms: Math.round(performance.now() - t) });
      const admin = new URL(container.getConnectionUri()); admin.pathname = '/postgres';
      const [appEnv, adminEnv] = cfg.urlEnvs;
      if (appEnv) env[appEnv] = container.getConnectionUri();
      if (adminEnv) env[adminEnv] = admin.toString();
    } else if (cfg.mode !== 'none') {
      if (!cfg.urlEnvs.some((n) => process.env[n])) { console.log(`verify-runtime: ENV · cần ${cfg.urlEnvs.join(' / ')} cho mode ${cfg.mode}.`); return 5; }
    }
    const verify = path.join(ROOT, '.verify', 'verify.mjs');
    const code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, [verify, ...forwarded], { cwd: ROOT, env, stdio: 'inherit', windowsHide: true });
      child.on('error', reject); child.on('close', (c) => done(c ?? 1));
    });
    return code;
  } catch {
    // Lỗi runtime có thể chứa URL kết nối: không in ra log dùng chung.
    console.error('verify-runtime: chuẩn bị hoặc chạy thất bại; kiểm Docker/DB và điều kiện runtime.');
    return 1;
  } finally {
    if (container) { const t = performance.now(); try { await container.stop(); } catch { console.error('verify-runtime: dọn container thất bại.'); } metrics.phases.push({ phase: 'container-cleanup', ms: Math.round(performance.now() - t) }); }
    metrics.totalMs = Math.round(performance.now() - started);
    if (output) { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(metrics, null, 2)}\n`); }
    console.log(`verify-runtime-summary: ${JSON.stringify({ mode: cfg.mode, reset, totalMs: metrics.totalMs })}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error(`verify-runtime: ${e.message}`); process.exitCode = 1; });
}
