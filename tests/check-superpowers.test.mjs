import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repo, 'hooks', 'scripts', 'check-superpowers.mjs');

function runScript(args = [], env = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 10000,
  });
}

test('empty home → installed false and --hook prints note', (t) => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-empty-home-'));
  const fakeCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-empty-cwd-'));
  t.after(() => {
    try { fs.rmSync(fakeHome, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(fakeCwd, { recursive: true, force: true }); } catch {}
  });

  const env = { DANH_HOME: fakeHome, DANH_CWD: fakeCwd };

  // 1. --json flag
  const jsonRes = runScript(['--json'], env);
  assert.equal(jsonRes.status, 0, jsonRes.stderr);
  const data = JSON.parse(jsonRes.stdout);
  assert.equal(data.installed, false);
  assert.deepEqual(data.locations, []);
  assert.deepEqual(data.skills, []);

  // 2. --hook flag
  const hookRes = runScript(['--hook'], env);
  assert.equal(hookRes.status, 0, hookRes.stderr);
  assert.match(hookRes.stdout, /\[danh-method\] Chưa thấy plugin Superpowers/);

  // 3. plain mode
  const plainRes = runScript([], env);
  assert.equal(plainRes.status, 0, plainRes.stderr);
  assert.match(plainRes.stdout, /superpowers: CHƯA CÓ/);
  assert.match(plainRes.stdout, /không thấy/);
});

test('fake home with a superpowers plugin dir → installed true', (t) => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-fake-home-'));
  const fakeCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-fake-cwd-'));
  t.after(() => {
    try { fs.rmSync(fakeHome, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(fakeCwd, { recursive: true, force: true }); } catch {}
  });

  // Create fake superpowers plugin in fakeHome/.claude/plugins/superpowers
  const pluginDir = path.join(fakeHome, '.claude', 'plugins', 'superpowers');
  const skill1Dir = path.join(pluginDir, 'skills', 'brainstorming');
  const skill2Dir = path.join(pluginDir, 'skills', 'writing-plans');
  fs.mkdirSync(skill1Dir, { recursive: true });
  fs.mkdirSync(skill2Dir, { recursive: true });
  fs.writeFileSync(path.join(skill1Dir, 'SKILL.md'), '---\nname: brainstorming\n---\n# Brainstorming\n');
  fs.writeFileSync(path.join(skill2Dir, 'SKILL.md'), '---\nname: writing-plans\n---\n# Writing Plans\n');

  const env = { DANH_HOME: fakeHome, DANH_CWD: fakeCwd };

  // 1. --json flag
  const jsonRes = runScript(['--json'], env);
  assert.equal(jsonRes.status, 0, jsonRes.stderr);
  const data = JSON.parse(jsonRes.stdout);
  assert.equal(data.installed, true);
  assert.ok(data.locations.includes(pluginDir));
  assert.deepEqual(data.skills, ['brainstorming', 'writing-plans']);

  // 2. plain mode
  const plainRes = runScript([], env);
  assert.equal(plainRes.status, 0, plainRes.stderr);
  assert.match(plainRes.stdout, /superpowers: ĐÃ CÓ/);
  assert.match(plainRes.stdout, /skills \(2\): brainstorming, writing-plans/);
});

test('installed → --hook silent', (t) => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-silent-home-'));
  const fakeCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-silent-cwd-'));
  t.after(() => {
    try { fs.rmSync(fakeHome, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(fakeCwd, { recursive: true, force: true }); } catch {}
  });

  const pluginDir = path.join(fakeHome, '.claude', 'plugins', 'superpowers');
  const skillDir = path.join(pluginDir, 'skills', 'brainstorming');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: brainstorming\n---\n# Brainstorming\n');

  const env = { DANH_HOME: fakeHome, DANH_CWD: fakeCwd };

  const hookRes = runScript(['--hook'], env);
  assert.equal(hookRes.status, 0, hookRes.stderr);
  assert.equal(hookRes.stdout.trim(), '');
});
