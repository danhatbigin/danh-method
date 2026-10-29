// A5.4/D8: exercise the actual CLI in isolated fixtures, with no product commands.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = path.join(repo, '..', '.v03-checks');
fs.mkdirSync(checks, { recursive: true });
function fixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(checks, 'timeout-'));
  const kit = path.join(root, '.verify');
  fs.mkdirSync(kit);
  fs.copyFileSync(path.join(repo, 'skills/execute-tasks/assets/verify-kit/verify.mjs'), path.join(kit, 'verify.mjs'));
  fs.writeFileSync(path.join(root, 'probe.cjs'), 'setTimeout(() => console.log("probe ran"), 250);\n');
  const command = 'node probe.cjs';
  fs.writeFileSync(path.join(kit, 'config.json'), JSON.stringify({
    timeoutSec: 0.02, prTimeoutSec: 3,
    tiers: { 0: { run: [command] } }, rules: [{ match: ['**'], tier: 0, kind: 'style' }],
    pr: { run: [command] }, batch: { run: [command] }, security: [], ...overrides,
  }));
  return (...args) => spawnSync(process.execPath, [path.join(kit, 'verify.mjs'), ...args], { encoding: 'utf8', timeout: 10000 });
}
test('PR uses prTimeoutSec instead of the shorter development timeout', () => {
  const result = fixture()('--pr');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /verify: pr · PASS/);
});
test('batch still uses timeoutSec', () => {
  const result = fixture()('--batch');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /quá 0.02s/);
});
test('PR timeout is reported with its actual configured duration', () => {
  const result = fixture({ prTimeoutSec: 0.02, timeoutSec: 3 })('--pr');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /quá 0.02s/);
});
test('PR without override defaults to 900 seconds, not timeoutSec', () => {
  const result = fixture({ prTimeoutSec: undefined })('--pr');
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
