import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const kit = path.dirname(fileURLToPath(import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-v12-'));
let seq = 0;
function fixture({ typeFail = false } = {}) {
  const root = path.join(temp, `case-${++seq}`);
  const write = (f, text) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), text); };
  write('.verify/verify.mjs', fs.readFileSync(path.join(kit, 'verify.mjs')));
  write('runner.mjs', String.raw`import fs from 'node:fs'; const [kind,...files]=process.argv.slice(2); fs.appendFileSync('trace.txt',kind+' '+files.join(',')+'\n'); if(kind==='typecheck' && ${typeFail}) {console.error('synthetic type error'); process.exitCode=1;}`);
  const config = {
    db: { dumpEnv: 'TEST_DB_DUMP', urlEnvs: ['TEST_ADMIN_DATABASE_URL', 'DATABASE_URL'], clientFrom: 'packages/db/package.json', autoDetect: 'db:test|packages[\\\\/]db|packages[\\\\/]mock-data' },
    rules: [
      { match: ['**/*.md'], skip: true, kind: 'skip', tier: 0 },
      { match: ['**/*.css'], kind: 'style', tier: 0 },
      { match: ['**/*.tsx'], kind: 'ui', tier: 0, scan: true, bumpTier: 1 },
      { match: ['src/**', 'tests/**'], kind: 'logic', tier: 2 },
    ],
    logicPatterns: 'useState|onClick', defaultTier: 2,
    tiers: { 0: { run: ['node runner.mjs typecheck'] }, 1: { run: ['node runner.mjs lint'] }, 2: { scoped: [{ when: ['src/**'], tests: 'tests/*.test.mjs', run: 'node runner.mjs test {files}', maxFiles: 2 }] } },
    pr: { run: ['node runner.mjs test'] }, security: [{ builtin: 'secrets', always: true }],
  };
  const save = () => write('.verify/config.json', JSON.stringify(config));
  write('.gitignore', '.verify/\ntrace.txt\nnode_modules/\npackages/db/node_modules/\nfixture.dump\n');
  write('src/base.ts', 'export const baseline = 1;\n');
  save();
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' });
  execFileSync('git', ['-c', 'user.name=Pipeline selftest', '-c', 'user.email=pipeline@example.invalid', 'commit', '-qm', 'baseline'], { cwd: root });
  const run = (args = [], env = {}) => {
    const clean = { ...process.env, DATABASE_URL: '', TEST_ADMIN_DATABASE_URL: '', TEST_DB_DUMP: '', ...env };
    return spawnSync(process.execPath, ['.verify/verify.mjs', ...args], { cwd: root, encoding: 'utf8', env: clean, timeout: 20000 });
  };
  const trace = () => fs.existsSync(path.join(root, 'trace.txt')) ? fs.readFileSync(path.join(root, 'trace.txt'), 'utf8') : '';
  const last = () => JSON.parse(fs.readFileSync(path.join(root, '.verify/last.json'), 'utf8'));
  return { root, write, config, save, run, trace, last };
}
function expect(result, code) { assert.equal(result.status, code, result.stdout + result.stderr); }
try {
  let f = fixture(); f.write('src/unmatched.ts', 'export const x=1;'); let r = f.run(); expect(r, 4); assert.equal(f.last().status, 'PARTIAL'); console.log('PASS skipped check => PARTIAL exit 4');
  f = fixture(); f.write('docs/readme.md', '# Docs\n'); expect(f.run(), 0); assert.equal(f.last().status, 'SKIPPED'); assert.equal(f.trace(), ''); console.log('PASS docs-only => SKIPPED exit 0');
  f = fixture(); f.config.areas = [{ name: 'orders', sources: ['src/library.ts'], tests: ['tests/med*.test.mjs'] }]; f.save();
  f.write('src/library.ts', 'export const x=1;');
  for (let i = 0; i < 5; i++) f.write(`tests/med${i}.test.mjs`, '// synthetic text, never executed');
  // Tests are tracked baseline, so selection must come from area rather than changed test names.
  execFileSync('git', ['add', 'tests'], { cwd: f.root }); execFileSync('git', ['-c', 'user.name=Pipeline selftest', '-c', 'user.email=pipeline@example.invalid', 'commit', '-qm', 'synthetic tests'], { cwd: f.root });
  r = f.run(); expect(r, 0); assert.equal(f.last().checks.filter((c) => c.kind === 'test').length, 3);
  for (let i = 0; i < 5; i++) assert.match(f.trace(), new RegExp(`med${i}\\.test\\.mjs`.replaceAll('\\\\', '\\')));
  assert.match(r.stdout, /batch 3\/3/); console.log('PASS area selection + all 5 files in 3 batches');
  f = fixture(); f.config.tiers[2] = { run: ['node runner.mjs test'], scoped: [] }; f.config.tiers[2].run = [];
  f.config.tiers[2].scoped = [{ when: ['src/**'], run: 'node runner.mjs test', requiresDb: true }]; f.save(); f.write('src/change.ts', 'x');
  expect(f.run(), 5); assert.equal(f.last().status, 'ENV'); assert.doesNotMatch(f.trace(), /test /); console.log('PASS missing dump => ENV; test not executed');
  f.write('fixture.dump', 'synthetic fixture marker, not a DB dump');
  expect(f.run([], { TEST_DB_DUMP: path.join(f.root, 'fixture.dump') }), 5); console.log('PASS missing database URL => ENV');
  const env = { TEST_DB_DUMP: path.join(f.root, 'fixture.dump'), TEST_ADMIN_DATABASE_URL: 'postgres://synthetic.invalid/test' };
  f.write('packages/db/package.json', '{}'); f.write('packages/db/node_modules/pg/index.js', 'exports.Client=class { async connect(){throw Error("synthetic offline")} async end(){} };');
  expect(f.run([], env), 5); console.log('PASS failed mocked PostgreSQL handshake => ENV');
  f.write('packages/db/node_modules/pg/index.js', 'exports.Client=class { async connect(){} async query(sql){if(sql!=="select 1")throw Error("unexpected query")} async end(){} };');
  expect(f.run([], env), 0); assert.match(f.trace(), /test /); console.log('PASS successful mocked PostgreSQL preflight permits test');
  f = fixture({ typeFail: true }); f.config.tiers[2] = { run: ['node runner.mjs test'] }; f.save(); f.write('src/change.ts', 'x'); expect(f.run(), 1); assert.match(f.trace(), /typecheck[\s\S]*lint[\s\S]*test/); console.log('PASS tier 2 continues lint/test after typecheck FAIL');
  f = fixture({ typeFail: true }); f.write('view.tsx', 'export const View=()=> <button onClick={()=>{}}>Go</button>;'); expect(f.run(), 1); assert.doesNotMatch(f.trace(), /lint /); console.log('PASS tier 1 retains fail-fast');
  f = fixture(); f.config.tiers[2] = { run: ['node runner.mjs test'] }; f.save(); f.write('tests/spec-manifest.json', '[]'); f.write('tools/spec-guard.mjs', "import fs from 'node:fs'; fs.appendFileSync('trace.txt','spec-guard\\n');".replace("'spec-guard\\n'", "'spec-guard\\n'"));
  expect(f.run(), 0); assert.match(f.trace(), /spec-guard/); console.log('PASS manifest diff invokes spec-guard');
  f = fixture(); f.config.tiers[2] = { run: ['node runner.mjs test'] }; f.save(); f.write('packages/demo/tests/spec/new.mjs', '// synthetic'); f.write('tools/spec-guard.mjs', "import fs from 'node:fs'; fs.appendFileSync('trace.txt','spec-guard\\n');"); expect(f.run(), 0); assert.match(f.trace(), /spec-guard/); console.log('PASS nested spec test diff invokes spec-guard');
  f = fixture(); f.write('view.tsx', 'export const View=()=> <div className="p-4">Text</div>;'); f.write('style.css', '.box {color: blue}'); expect(f.run(), 0); assert.equal(f.last().tier, 0); assert.equal(f.trace().trim(), 'typecheck'); console.log('PASS pure css/tsx => tier 0; typecheck only');
  f = fixture({ typeFail: true }); f.config.knownFailures = [{ command: 'node runner.mjs typecheck', match: 'synthetic type error', reference: 'main synthetic baseline commit' }]; f.config.tiers[2] = { run: ['node runner.mjs test'] }; f.save(); f.write('src/change.ts', 'x'); expect(f.run(), 4); assert.equal(f.last().status, 'PARTIAL'); assert(f.last().checks.some((c) => /known failure on main/.test(c.reason))); console.log('PASS documented main failure => PARTIAL; fix budget exempt');
  f = fixture(); f.config.blockedSpec = ['SI-001 open']; f.config.tiers[2] = { run: ['node runner.mjs test'] }; f.save(); f.write('src/change.ts', 'x'); expect(f.run(), 6); assert.equal(f.last().status, 'BLOCKED-SPEC'); console.log('PASS open Spec Issue => BLOCKED-SPEC');
  // PR/release path: lenh gop (vd. `pnpm check`) co requiresDb phai qua preflight, thieu dump => ENV, khong chay lenh.
  f = fixture(); f.config.pr = { run: ['node runner.mjs check'], requiresDb: true }; f.save(); expect(f.run(['--pr']), 5); assert.equal(f.last().status, 'ENV'); assert.doesNotMatch(f.trace(), /check/); console.log('PASS --pr combined command without dump => ENV; command not executed');
  f.write('fixture.dump', 'synthetic fixture marker, not a DB dump'); f.write('packages/db/package.json', '{}'); f.write('packages/db/node_modules/pg/index.js', 'exports.Client=class { async connect(){} async query(){} async end(){} };');
  expect(f.run(['--pr'], { TEST_DB_DUMP: path.join(f.root, 'fixture.dump'), TEST_ADMIN_DATABASE_URL: 'postgres://synthetic.invalid/test' }), 0); assert.match(f.trace(), /check/); console.log('PASS --pr combined command with mocked preflight => runs');
  f = fixture(); f.config.pr = { run: ['node runner.mjs check'] }; f.save(); expect(f.run(['--pr']), 0); assert.match(f.trace(), /check/); console.log('PASS --pr without requiresDb is unchanged');
  // --release va --batch: co requiresDb di theo nhom lenh .
  f = fixture(); f.config.pr = { run: ['node runner.mjs check'], requiresDb: true }; f.config.batch = { run: ['node runner.mjs build'] }; f.save(); expect(f.run(['--release']), 5); assert.equal(f.last().status, 'ENV'); assert.doesNotMatch(f.trace(), /check/); console.log('PASS --release fallback inherits pr.requiresDb => ENV; check not executed');
  f = fixture(); f.config.pr = { run: ['node runner.mjs check'] }; f.config.release = { run: ['node runner.mjs release'], requiresDb: true }; f.save(); expect(f.run(['--release']), 5); assert.doesNotMatch(f.trace(), /release/); console.log('PASS --release with own run honours release.requiresDb');
  f = fixture(); f.config.batch = { run: ['node runner.mjs build'], requiresDb: true }; f.save(); expect(f.run(['--batch']), 5); assert.doesNotMatch(f.trace(), /build/); console.log('PASS --batch honours batch.requiresDb');
  // Config mau Portal that (examples/monorepo-postgres.json) qua install.mjs: bat hoi quy cua config mau .
  {
    const repo = path.join(temp, 'example-config');
    fs.mkdirSync(repo, { recursive: true });
    fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: 'x', scripts: { typecheck: 'echo t', lint: 'echo l', check: 'echo c', build: 'echo b' } }));
    fs.writeFileSync(path.join(repo, 'pnpm-lock.yaml'), '');
    execFileSync('git', ['init', '-q'], { cwd: repo }); execFileSync('git', ['add', '.'], { cwd: repo });
    execFileSync('git', ['-c', 'user.name=Pipeline selftest', '-c', 'user.email=pipeline@example.invalid', 'commit', '-qm', 'base'], { cwd: repo });
    const env = { ...process.env, HOME: repo, USERPROFILE: repo };
    execFileSync(process.execPath, [path.join(kit, 'install.mjs'), repo, '--mode', 'local', '--config', path.join(kit, 'examples/monorepo-postgres.json'), '--no-preview'], { cwd: repo, env, stdio: 'ignore' });
    const installed = JSON.parse(fs.readFileSync(path.join(repo, '.verify/config.json'), 'utf8'));
    assert.equal(installed.pr?.requiresDb, true); console.log('PASS example config: pr.requiresDb is set');
    const classify = () => JSON.parse(execFileSync(process.execPath, ['.verify/verify.mjs', '--classify'], { cwd: repo, env, encoding: 'utf8' }));
    for (const f2 of ['tools/spec-guard.mjs', 'tools/spec-guard.selftest.mjs']) { fs.mkdirSync(path.join(repo, 'tools'), { recursive: true }); fs.writeFileSync(path.join(repo, f2), '// synthetic'); }
    let c = classify(); assert(c.tier >= 1); assert(c.commands.includes('node tools/spec-guard.mjs')); assert(c.commands.includes('node tools/spec-guard.selftest.mjs')); console.log('PASS example config: editing spec-guard runs guard and selftest');
    fs.rmSync(path.join(repo, 'tools'), { recursive: true });
    const spec = 'packages/mock-data/tests/spec/med-x-01.test.mjs'; fs.mkdirSync(path.dirname(path.join(repo, spec)), { recursive: true }); fs.writeFileSync(path.join(repo, spec), '// synthetic');
    c = classify(); assert(c.commands.some((cmd) => cmd.includes('tests/spec/med-x-01.test.mjs')), JSON.stringify(c.commands)); console.log('PASS example config: changed spec test is selected to run');
  }
  // Sua chinh spec-guard khong duoc bi bo qua o tier 0: guard + selftest cua no phai chay.
  f = fixture(); f.config.rules.unshift({ match: ['tools/**'], kind: 'logic', tier: 1 }); f.save(); f.write('tools/spec-guard.mjs', "import fs from 'node:fs'; fs.appendFileSync('trace.txt','spec-guard\\n');"); f.write('tools/spec-guard.selftest.mjs', "import fs from 'node:fs'; fs.appendFileSync('trace.txt','spec-guard-selftest\\n');");
  expect(f.run(), 0); assert.match(f.trace(), /^spec-guard$/m); assert.match(f.trace(), /spec-guard-selftest/); console.log('PASS editing spec-guard itself runs guard and its selftest');
  console.log('verify-kit selftest: PASS (24 cases; temporary git repos and mocked pg only)');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
