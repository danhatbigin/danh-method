import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.env.SPEC_GUARD_IMPORT = '1';
const { guard } = await import('./spec-guard.mjs');
const guardFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'spec-guard.mjs');

// Chi dung van ban gia lap trong mkdtemp; khong import hay chay test cua app.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-guard-'));
let cases = 0, skipped = 0;
const ok = (name) => { cases++; console.log(`PASS ${name}`); };
try {
  const root = path.join(temp, 'app'), specRoot = path.join(temp, 'app-spec');
  const write = (file, text) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); };
  fs.mkdirSync(path.join(specRoot, 'features/demo'), { recursive: true });
  const scenarios = (v) => fs.writeFileSync(path.join(specRoot, 'features/demo/SCENARIOS.md'), `| ID | Loại | Duyệt | v | Tiêu đề |\n| DEM-AC01-01 | Kỹ thuật | Owner | ${v} | First |\n| DEM-AC01-02 | Kỹ thuật | Owner | 1 | Second |\n`);
  const body = (id, v = 1, extra = '') => `// @spec ${id} v${v}\nimport assert from "node:assert/strict";\ntest("t", () => { assert.equal(1, 1); });\n${extra}`;
  const a = body('DEM-AC01-01'), b = body('DEM-AC01-02');
  const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
  const entry = (id, file, text, version = 1) => ({ id, version, file, sha256: sha(text) });
  const manifest = [entry('DEM-AC01-01', 'packages/demo/tests/spec/first.mjs', a), entry('DEM-AC01-02', 'packages/demo/tests/spec/second.mjs', b)];
  const reset = () => { fs.rmSync(root, { recursive: true, force: true }); write(manifest[0].file, a); write(manifest[1].file, b); write('tests/spec-manifest.json', JSON.stringify(manifest)); scenarios(1); };
  const run = (opts = {}) => guard(root, { specRoot, ...opts });
  const errs = (r) => r.errors.join('\n');
  const cli = (args = [], script = guardFile) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, SPEC_GUARD_IMPORT: '' } });

  reset(); assert.equal(run().ok, true); ok('matching hash');
  write(manifest[0].file, a + '// changed\n'); assert.match(errs(run()), /hash mismatch/); ok('edited content => FAIL');
  for (const [label, from, to] of [['test.skip', 'test(', 'test.skip('], ['xit', 'test(', 'xit('], ['xdescribe', 'test(', 'xdescribe('], ['.only', 'test(', 'test.only('], ['.fixme', 'test(', 'test.fixme('], ['.todo', 'test(', 'test.todo(']]) {
    reset(); write(manifest[0].file, a.replace(from, to)); assert.match(errs(run()), /disabled spec test/); ok(`${label} => FAIL`);
  }
  reset(); write(manifest[0].file, a.replace('() =>', '{ skip: true }, () =>')); assert.match(errs(run()), /disabled spec test/); ok('{ skip: true } option => FAIL');
  reset(); write(manifest[0].file, a.replace('t", () => {', 't", () => { const row = { todo: "buy milk" };')); assert.doesNotMatch(errs(run()), /disabled spec test/); ok('data field named todo is not a false positive');
  reset(); write(manifest[0].file, '// @spec DEM-AC01-01 v1\ntest("t", () => {});\n'); assert.match(errs(run()), /empty spec test/); ok('empty test body => FAIL');
  reset(); write(manifest[0].file, '// @spec DEM-AC01-01 v1\ntest("t", () => { const x = 1; });\n'); assert.match(errs(run()), /no assertion/); ok('no assertion => FAIL');
  reset(); write('tests/spec/orphan.mjs', body('DEM-AC99-01')); assert.match(errs(run()), /ORPHAN/); ok('orphan => ORPHAN');
  reset(); fs.unlinkSync(path.join(root, manifest[0].file)); assert.match(errs(run()), /MISSING/); ok('deleted file => MISSING');
  reset(); scenarios(2); assert.match(errs(run()), /scenario version mismatch/); ok('scenario version mismatch => FAIL');
  reset(); assert.equal(run({ update: 'DEM-AC01-01' }).ok, false); ok('update without version increase => FAIL');
  reset(); scenarios(2); write(manifest[0].file, a.replace('v1', 'v2')); const before = fs.readFileSync(path.join(root, 'tests/spec-manifest.json'), 'utf8');
  assert.equal(run({ update: 'DEM-AC01-01' }).ok, true);
  const after = JSON.parse(fs.readFileSync(path.join(root, 'tests/spec-manifest.json'), 'utf8'));
  assert.deepEqual(after[1], JSON.parse(before)[1]); assert.equal(after[0].version, 2); assert.equal(run().ok, true); ok('--update changes exactly one ID');
  reset(); scenarios(2); write(manifest[0].file, a.replace('v1', 'v2').replace('test(', 'test.skip(')); const beforeDisabled = fs.readFileSync(path.join(root, 'tests/spec-manifest.json'), 'utf8');
  assert.equal(run({ update: 'DEM-AC01-01' }).ok, false); assert.equal(fs.readFileSync(path.join(root, 'tests/spec-manifest.json'), 'utf8'), beforeDisabled); ok('--update refuses a disabled test and leaves manifest untouched');
  reset(); write('packages/demo/tests/spec/new.mjs', body('DEM-AC01-02', 1)); assert.match(errs(run()), /duplicate test ID/); ok('duplicate test ID => FAIL');
  reset(); write('tests/spec-manifest.json', JSON.stringify([{ id: 'bad', version: 0, file: 'x', sha256: 'y' }])); assert.match(errs(run()), /invalid manifest entry/); ok('invalid manifest entry => FAIL');
  reset(); write('tests/spec-manifest.json', JSON.stringify([...manifest.slice(1), { ...manifest[0], file: '../outside/tests/spec/x.mjs' }])); assert.match(errs(run()), /invalid test path/); ok('path escape => FAIL');
  reset(); write('tests/spec-manifest.json', JSON.stringify([...manifest.slice(1), { ...manifest[0], file: 'packages\\demo\\tests\\spec\\first.mjs' }])); assert.match(errs(run()), /invalid test path/); ok('backslash path => FAIL');
  reset(); write(manifest[0].file, '﻿' + a); assert.match(errs(run()), /hash mismatch/); assert.doesNotMatch(errs(run()), /ORPHAN/); ok('BOM is tolerated in header but still changes the hash');
  reset(); fs.writeFileSync(path.join(specRoot, 'SCENARIOS.md'), '| DEM-AC77-01 | Kỹ thuật | Owner | 1 | Root |\n'); assert.equal(run().ok, true); fs.rmSync(path.join(specRoot, 'SCENARIOS.md')); ok('SCENARIOS.md at spec root is read');
  reset(); fs.mkdirSync(path.join(temp, 'elsewhere'), { recursive: true });
  try { fs.symlinkSync(path.join(temp, 'elsewhere'), path.join(root, 'apps-tests-link'), 'dir'); fs.rmSync(path.join(root, 'apps-tests-link')); fs.mkdirSync(path.join(root, 'pkg'), { recursive: true }); fs.symlinkSync(path.join(temp, 'elsewhere'), path.join(root, 'pkg/tests'), 'dir'); assert.match(errs(run()), /symlink in guarded path/); ok('symlinked tests dir => FAIL'); } catch (e) { if (e.code === 'EPERM' || e.code === 'EACCES') { skipped++; console.log('SKIPPED symlink case: no permission to create symlinks here'); } else throw e; }
  reset(); write('.ci-spec/features/x/tests/spec/stray.mjs', 'no header'); assert.equal(run().ok, true); fs.rmSync(path.join(root, '.ci-spec'), { recursive: true }); ok('.ci-spec (Spec checkout inside CI workspace) is not scanned');
  reset(); fs.writeFileSync(path.join(root, 'tests/spec-manifest.json'), '[]'); fs.rmSync(path.join(root, 'packages'), { recursive: true }); { const r = run(); assert.equal(r.ok, true); assert.equal(r.empty, true); assert(r.notes.some((n) => /EMPTY.*2 scenarios have no test/.test(n))); } ok('empty manifest is reported as EMPTY, not a silent PASS');
  const absent = run({ specRoot: path.join(temp, 'absent') }); assert.equal(absent.versionCheck, 'skipped'); assert(absent.notes.includes('spec repo not found: version check skipped')); ok('absent spec repo => version check SKIPPED');
  reset(); const req = run({ specRoot: path.join(temp, 'absent'), requireSpec: true }); assert.equal(req.ok, false); assert.match(errs(req), /--require-spec/); ok('--require-spec with absent spec repo => FAIL');
  // CLI: chay that bang process rieng (nhanh main + exit code)
  reset(); let r = cli(); assert.equal(r.status, 0); assert.match(r.stdout, /spec-guard: PASS · 2 registered test files/); ok('CLI PASS => exit 0');
  write(manifest[0].file, a + '// changed\n'); r = cli(); assert.equal(r.status, 1); assert.match(r.stdout, /spec-guard: FAIL/); ok('CLI FAIL => exit 1');
  reset(); r = cli(['--bogus']); assert.equal(r.status, 1); assert.match(r.stderr, /usage/); ok('CLI usage error => exit 1');
  reset(); r = cli(['--require-spec', '--spec', path.join(temp, 'absent')]); assert.equal(r.status, 1); ok('CLI --require-spec with absent spec => exit 1');
  reset(); const link = path.join(temp, 'guard-link.mjs');
  try { fs.symlinkSync(guardFile, link); write(manifest[0].file, a + '// changed\n'); r = cli([], link); assert.equal(r.status, 1); ok('CLI through a symlinked script path still runs and fails'); } catch (e) { if (e.code === 'EPERM' || e.code === 'EACCES') { skipped++; console.log('SKIPPED symlinked-script case: no permission to create symlinks here'); } else throw e; }
  console.log(`spec-guard selftest: PASS (${cases} cases${skipped ? `, ${skipped} SKIPPED` : ''}; temporary files only)`);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
