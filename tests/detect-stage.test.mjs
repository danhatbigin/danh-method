import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectStage, parseArgs } from '../skills/danh-method/scripts/detect-stage.mjs';

function createTempDir(prefix = 'detect-stage-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

test('detectStage: Stage 0 when project.md and operator profile are missing', (t) => {
  const root = createTempDir('stage0-');
  t.after(() => removeDir(root));

  const res = detectStage({ code: root, spec: root });
  assert.equal(res.stage, '0');
  assert.equal(res.nextSkill, 'project-setup');
  assert.equal(res.readyForDispatch, false);
  assert.deepEqual(res.proposeSubagents, []);
});

test('detectStage: Stage 0 when project.md exists but operator profile is missing', (t) => {
  const root = createTempDir('stage0-no-op-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');

  const res = detectStage({ code: root, spec: root });
  assert.equal(res.stage, '0');
  assert.equal(res.nextSkill, 'project-setup');
});

test('detectStage: Stage 0.5 when project setup is done but G0 token playground not approved', (t) => {
  const root = createTempDir('stage05-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');

  // Without TOKENS-NOTES.md
  let res = detectStage({ code: root, spec: root });
  assert.equal(res.stage, '0.5');
  assert.equal(res.nextSkill, 'design-tokens');
  assert.equal(res.readyForDispatch, false);

  // With unapproved TOKENS-NOTES.md
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Tokens Draft (not yet approved)');
  res = detectStage({ code: root, spec: root });
  assert.equal(res.stage, '0.5');
});

test('detectStage: Stage 1 when G0 approved but no feature exists', (t) => {
  const root = createTempDir('stage1-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved\nNgười duyệt: anh Danh');

  const res = detectStage({ code: root, spec: root });
  assert.equal(res.stage, '1');
  assert.equal(res.nextSkill, 'feature-spec');
  assert.equal(res.readyForDispatch, false);
});

test('detectStage: Stage 1-3 when feature exists but spec/PRD is incomplete or unapproved', (t) => {
  const root = createTempDir('stage13-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  fs.mkdirSync(path.join(root, 'features', 'billing'), { recursive: true });
  fs.writeFileSync(path.join(root, 'features', 'billing', 'PRD.md'), '# PRD Draft\nstatus: draft');

  const res = detectStage({ code: root, spec: root, feature: 'billing' });
  assert.equal(res.stage, '1-3');
  assert.equal(res.nextSkill, 'feature-spec');
  assert.equal(res.readyForDispatch, false);
});

function baseProject(prefix) {
  const root = createTempDir(prefix);
  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');
  const featDir = path.join(root, 'features', 'orders');
  fs.mkdirSync(featDir, { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# Flow');
  return { root, featDir };
}
const SCEN = '| ID | Loại | Duyệt | v | Tiêu đề |\n|---|---|---|---|---|\n| ORD-AC01-01 | Nghiệp vụ | PO ✅ 01/11 | 1 | A |\n| ORD-INV-01 | Kỹ thuật | PO ✅ · chờ owner | 1 | B |\n';

test('detectStage: Stage 4A runs prototype and test-translator in parallel when scenarios approved', (t) => {
  const { root, featDir } = baseProject('stage4A-');
  t.after(() => removeDir(root));
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [ ] Task S1');
  fs.writeFileSync(path.join(featDir, 'SCENARIOS.md'), SCEN);
  const res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '4A');
  assert.equal(res.track, 'Vừa');
  assert.deepEqual(res.proposeSubagents.map((s) => s.subagent), ['design-prototyper', 'test-translator']);
  assert.match(res.proposeSubagents[1].role, /1 kịch bản/);
});

test('detectStage: Stage 4A without scenarios proposes prototype only and asks for SCENARIOS', (t) => {
  const { root, featDir } = baseProject('stage4A-noscen-');
  t.after(() => removeDir(root));
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [ ] Task S1');
  const res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '4A');
  assert.deepEqual(res.proposeSubagents.map((s) => s.subagent), ['design-prototyper']);
  assert.match(res.nextAction, /SCENARIOS/);
});

test('detectStage: Stage 3S blocks implementation when no approved scenarios (Medium track)', (t) => {
  const { root, featDir } = baseProject('stage3S-');
  t.after(() => removeDir(root));
  fs.mkdirSync(path.join(featDir, 'prototype'));
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), 'Gate G1: approved');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [ ] Task S1');
  const res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '3S');
  assert.equal(res.nextSkill, 'feature-spec');
});

test('detectStage: Stage 3T blocks slice-implementer until approved scenarios are locked', (t) => {
  const { root, featDir } = baseProject('stage3T-');
  t.after(() => removeDir(root));
  fs.mkdirSync(path.join(featDir, 'prototype'));
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), 'Gate G1: approved');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [ ] Task S1');
  fs.writeFileSync(path.join(featDir, 'SCENARIOS.md'), SCEN);
  let res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '3T');
  assert.equal(res.proposeSubagents[0].subagent, 'test-translator');
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tests', 'spec-manifest.json'), JSON.stringify([{ id: 'ORD-AC01-01' }]));
  res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '4C');
  assert.equal(res.proposeSubagents[0].subagent, 'slice-implementer');
});

test('detectStage: Light track skips scenarios and uses ui-implementer', (t) => {
  const { root, featDir } = baseProject('stageLight-');
  t.after(() => removeDir(root));
  fs.mkdirSync(path.join(featDir, 'prototype'));
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), 'Gate G1: approved');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\nĐường: Nhẹ\n- [ ] Task U1');
  const res = detectStage({ code: root, spec: root, feature: 'orders' });
  assert.equal(res.stage, '4C');
  assert.equal(res.track, 'Nhẹ');
  assert.equal(res.proposeSubagents[0].subagent, 'ui-implementer');
});

test('detectStage: Stage 4B coordinator reviews preview and gates G1', (t) => {
  const root = createTempDir('stage4B-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  const featDir = path.join(root, 'features', 'workouts');
  fs.mkdirSync(path.join(featDir, 'prototype'), { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD Workouts\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# User Flow');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [ ] Task L1\n- [ ] Task U1');
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<!doctype html><html><body>Preview</body></html>');

  const res = detectStage({ code: root, spec: root, feature: 'workouts' });
  assert.equal(res.stage, '4B');
  assert.equal(res.nextSkill, 'design-prototype');
  assert.equal(res.readyForDispatch, false);
});

test('detectStage: Stage 4C dispatches slice-implementer after G1 approved (legacy feature with logic pushed)', (t) => {
  const root = createTempDir('stage4C-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  const featDir = path.join(root, 'features', 'workouts');
  fs.mkdirSync(path.join(featDir, 'prototype'), { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD Workouts\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# User Flow');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [x] Task L1 pushed a1b2c3d\n- [ ] Task U1');
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), '# Review Round 1\nGate G1: approved\nNgười duyệt: anh Danh');

  const res = detectStage({ code: root, spec: root, feature: 'workouts' });
  assert.equal(res.stage, '4C');
  assert.equal(res.nextSkill, 'subagent-orchestration');
  assert.equal(res.readyForDispatch, true);
  assert.equal(res.proposeSubagents.length, 1);
  assert.equal(res.proposeSubagents[0].subagent, 'slice-implementer');
  assert.equal(res.proposeSubagents[0].recommendedModel, 'inherit');
});

test('detectStage: Stage 5 dispatches code-reviewer (read-only) with flash model', (t) => {
  const root = createTempDir('stage5-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  const featDir = path.join(root, 'features', 'workouts');
  fs.mkdirSync(path.join(featDir, 'prototype'), { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD Workouts\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# User Flow');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [x] Task L1 pushed a1b2c3d\n- [x] Task U1 pushed e4f5g6h');
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), '# Review Round 1\nGate G1: approved');

  const res = detectStage({ code: root, spec: root, feature: 'workouts' });
  assert.equal(res.stage, '5');
  assert.equal(res.nextSkill, 'review-report');
  assert.equal(res.readyForDispatch, true);
  assert.equal(res.proposeSubagents.length, 1);
  assert.equal(res.proposeSubagents[0].subagent, 'code-reviewer');
  assert.equal(res.proposeSubagents[0].recommendedModel, 'flash');
  assert.match(res.proposeSubagents[0].glob, /read-only/i);
});

test('detectStage: Stage 6 dispatches acceptance-tester with flash model', (t) => {
  const root = createTempDir('stage6-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  const featDir = path.join(root, 'features', 'workouts');
  fs.mkdirSync(path.join(featDir, 'prototype'), { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD Workouts\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# User Flow');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [x] Task L1\n- [x] Task U1');
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), '# Review Round 1\nGate G1: approved');
  fs.writeFileSync(path.join(featDir, 'REVIEW-REPORT.md'), '# Code Review: All Clean');

  const res = detectStage({ code: root, spec: root, feature: 'workouts' });
  assert.equal(res.stage, '6');
  assert.equal(res.nextSkill, 'design-review');
  assert.equal(res.readyForDispatch, true);
  assert.equal(res.proposeSubagents.length, 1);
  assert.equal(res.proposeSubagents[0].subagent, 'acceptance-tester');
  assert.equal(res.proposeSubagents[0].recommendedModel, 'flash');
});

test('detectStage: COMPLETE stage when acceptance report exists', (t) => {
  const root = createTempDir('stage-complete-');
  t.after(() => removeDir(root));

  fs.mkdirSync(path.join(root, 'process'), { recursive: true });
  fs.writeFileSync(path.join(root, 'process', 'project.md'), '# Project Config');
  fs.writeFileSync(path.join(root, 'process', 'operator-danh.md'), '# Operator Danh');
  fs.mkdirSync(path.join(root, 'design-system'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system', 'TOKENS-NOTES.md'), '# Gate G0: approved');

  const featDir = path.join(root, 'features', 'workouts');
  fs.mkdirSync(path.join(featDir, 'prototype'), { recursive: true });
  fs.writeFileSync(path.join(featDir, 'PRD.md'), '# PRD Workouts\nstatus: approved');
  fs.writeFileSync(path.join(featDir, 'USER_FLOW.md'), '# User Flow');
  fs.writeFileSync(path.join(featDir, 'TASKS.md'), '# Tasks\n- [x] Task L1\n- [x] Task U1');
  fs.writeFileSync(path.join(featDir, 'prototype', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(featDir, 'REVIEW.md'), '# Review Round 1\nGate G1: approved');
  fs.writeFileSync(path.join(featDir, 'REVIEW-REPORT.md'), '# Code Review: All Clean');
  fs.writeFileSync(path.join(featDir, 'ACCEPTANCE.md'), '# Acceptance: PASS on cloned DB');

  const res = detectStage({ code: root, spec: root, feature: 'workouts' });
  assert.equal(res.stage, 'COMPLETE');
  assert.equal(res.readyForDispatch, false);
  assert.deepEqual(res.proposeSubagents, []);
});

test('parseArgs: properly parses command-line flags and detects spec candidates', () => {
  const args1 = parseArgs(['node', 'script.js', '--spec', '/my/spec', '--code', '/my/code', '--feature', 'auth', '--json']);
  assert.equal(args1.json, true);
  assert.equal(args1.feature, 'auth');
  assert.ok(args1.spec.endsWith('spec'));
  assert.ok(args1.code.endsWith('code'));

  const args2 = parseArgs(['node', 'script.js', '--spec=/my/spec2', '--code=/my/code2', '--feature=dash']);
  assert.equal(args2.json, false);
  assert.equal(args2.feature, 'dash');
});
