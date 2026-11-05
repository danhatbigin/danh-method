import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { decide } from '../hooks/scripts/guard-spec-tests.mjs';
import { unlock, lock, readState } from '../skills/scenario-tests/scripts/spec-lock.mjs';
import { approvedScenarios, openIssues, collect } from '../hooks/scripts/pipeline-nudge.mjs';
import { QUESTIONS, normalize } from '../skills/execute-tasks/assets/verify-kit/verify-runtime.mjs';

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

test('guard-spec-tests blocks writes to locked tests unless the Test window is open', () => {
  const root = tmp('guard-');
  fs.mkdirSync(path.join(root, '.danh'));
  const edit = { tool_name: 'Edit', tool_input: { file_path: path.join(root, 'tests', 'spec', 'a.test.mjs') }, cwd: root };
  const bashWrite = { tool_name: 'Bash', tool_input: { command: 'sed -i s/1/2/ tests/spec/a.test.mjs' }, cwd: root };
  const bashRead = { tool_name: 'Bash', tool_input: { command: 'node --test tests/spec/' }, cwd: root };
  const manifest = { tool_name: 'Write', tool_input: { file_path: 'tests/spec-manifest.json' }, cwd: root };
  const other = { tool_name: 'Write', tool_input: { file_path: 'src/tests/specs.ts' }, cwd: root };
  assert.equal(decide(edit).block, true);
  assert.equal(decide(bashWrite).block, true);
  assert.equal(decide(manifest).block, true);
  assert.equal(decide(bashRead).block, false);
  assert.equal(decide(other).block, false);
  assert.match(decide(edit).message, /Spec Issue/);
  unlock(root, { feature: 'orders', reason: 'ORD-AC01-01 v1', minutes: 30 });
  assert.equal(decide(edit).block, false);
  assert.equal(decide(edit, { now: Date.now() + 31 * 60000 }).block, true, 'window expires');
  lock(root);
  assert.equal(decide(edit).block, true);
  assert.equal(readState(root).open, false);
  assert.match(fs.readFileSync(path.join(root, '.danh', 'spec-lock.log'), 'utf8'), /UNLOCK feature=orders[\s\S]*LOCK/);
});

test('spec-lock requires a reason and bounds the window', () => {
  const root = tmp('lock-');
  assert.throws(() => unlock(root, { feature: 'orders' }), /reason/);
  const s = unlock(root, { feature: 'orders', reason: 'x', minutes: 9999, now: 0 });
  assert.equal(Date.parse(s.until), 240 * 60000);
});

test('pipeline-nudge reads approvals, open Spec Issues and track vs diff', () => {
  const ws = tmp('nudge-');
  const code = path.join(ws, 'app'); const spec = path.join(ws, 'app-spec');
  const f = path.join(spec, 'features', 'orders');
  fs.mkdirSync(path.join(f, 'spec-issues'), { recursive: true });
  fs.writeFileSync(path.join(f, 'SCENARIOS.md'), '| ID | Loại | Duyệt | v | Tiêu đề |\n|---|---|---|---|---|\n| ORD-AC01-01 | Nghiệp vụ | PO ✅ 01/11 | 1 | A |\n| ORD-INV-01 | Kỹ thuật | PO ✅ · chờ owner | 1 | B |\n| ORD-AC02-01 | Nghiệp vụ | chờ duyệt | 1 | C |\n');
  fs.writeFileSync(path.join(f, 'spec-issues', 'SI-1.md'), '# SI-1\n- Trạng thái: open → decided → closed (hiện tại: open)\n');
  fs.writeFileSync(path.join(f, 'spec-issues', 'SI-2.md'), '# SI-2\n- Trạng thái: open → decided → closed (closed ngày 04/11/2026; đã PASS)\n');
  assert.deepEqual(approvedScenarios(path.join(f, 'SCENARIOS.md')).map((s) => s.id), ['ORD-AC01-01']);
  assert.deepEqual(openIssues(path.join(f, 'spec-issues')), ['SI-1']);
  fs.mkdirSync(path.join(code, 'db', 'migrations'), { recursive: true });
  git(code, 'init', '-q'); fs.writeFileSync(path.join(code, 'README.md'), 'x'); git(code, 'add', '.');
  git(code, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'base');
  fs.writeFileSync(path.join(code, 'db', 'migrations', '0001_orders.sql'), 'create table x();');
  let notes = collect({ code, spec });
  assert.deepEqual(notes.map((n) => n.kind).sort(), ['blocked-spec', 'declare-track', 'scenario-tests']);
  fs.mkdirSync(path.join(code, '.danh'));
  fs.writeFileSync(path.join(code, '.danh', 'track.json'), JSON.stringify({ track: 'Nhẹ' }));
  notes = collect({ code, spec });
  assert.ok(notes.some((n) => n.kind === 'raise-track' && /Đủ/.test(n.text)));
  fs.writeFileSync(path.join(code, '.danh', 'track.json'), JSON.stringify({ track: 'Đủ' }));
  fs.mkdirSync(path.join(code, 'tests'));
  fs.writeFileSync(path.join(code, 'tests', 'spec-manifest.json'), JSON.stringify([{ id: 'ORD-AC01-01' }]));
  notes = collect({ code, spec });
  assert.deepEqual(notes.map((n) => n.kind), ['blocked-spec']);
});

test('verify-runtime asks the user instead of guessing', () => {
  const ids = QUESTIONS.map((q) => q.id);
  for (const id of ['needsDb', 'mode', 'seed', 'urlEnvs', 'defaultReset', 'prTimeoutSec']) assert.ok(ids.includes(id), id);
  assert.equal(normalize({ needsDb: 'no', mode: 'container' }).mode, 'none');
  assert.deepEqual(normalize({ needsDb: 'yes', mode: 'local', urlEnvs: 'A_URL, B_URL' }).urlEnvs, ['A_URL', 'B_URL']);
  assert.throws(() => normalize({ needsDb: 'yes', mode: 'cloud' }), /mode/);
  assert.throws(() => normalize({ needsDb: 'yes', mode: 'local', defaultReset: 'wipe' }), /defaultReset/);
  const repo = tmp('rt-');
  fs.mkdirSync(path.join(repo, '.verify'));
  fs.copyFileSync(new URL('../skills/execute-tasks/assets/verify-kit/verify-runtime.mjs', import.meta.url), path.join(repo, '.verify', 'verify-runtime.mjs'));
  let r = spawnSync(process.execPath, ['.verify/verify-runtime.mjs'], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 5); assert.match(r.stdout, /Hỏi người dùng/);
  fs.writeFileSync(path.join(repo, 'a.json'), JSON.stringify({ needsDb: 'no', prTimeoutSec: 1200 }));
  r = spawnSync(process.execPath, ['.verify/verify-runtime.mjs', '--init', 'a.json'], { cwd: repo, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(repo, '.verify', 'runtime.json'), 'utf8')).prTimeoutSec, 1200);
});

test('hooks.json wires the new hooks and every referenced script exists', () => {
  const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'hooks.json'), 'utf8'));
  const cmds = JSON.stringify(cfg);
  for (const s of ['guard-spec-tests.mjs', 'pipeline-nudge.mjs', 'guard-git.mjs']) assert.match(cmds, new RegExp(s));
  assert.ok(cfg.hooks.UserPromptSubmit);
  for (const m of cmds.matchAll(/hooks\/scripts\/([\w-]+\.mjs)/g)) assert.ok(fs.existsSync(path.join(root, 'hooks', 'scripts', m[1])), m[1]);
});
