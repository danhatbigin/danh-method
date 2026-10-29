import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repo, 'skills/design-prototype/scripts/attach-token-editor.mjs');
const scratch = path.join(repo, '..', '.v03-checks'); fs.mkdirSync(scratch, { recursive: true });
function fixture() {
  const dir = fs.mkdtempSync(path.join(scratch, 'editor-'));
  fs.writeFileSync(path.join(dir, 'component.js'), 'export const componentVersion=1;\n');
  const hashes = { 'component.js': createHash('sha256').update(fs.readFileSync(path.join(dir, 'component.js'))).digest('hex') };
  fs.writeFileSync(path.join(dir, 'tokens.json'), JSON.stringify({ schemaVersion: 1, source: { id: 'fixture', hashes }, tokens: { light: { '--primary': '#123456' }, dark: { '--primary': '#abcdef' } } }));
  fs.writeFileSync(path.join(dir, 'rendered.html'), '<!doctype html><html><head><title>Fixture</title></head><body><button>Fixture, not a DS render test</button></body></html>');
  return { dir, run: (out = 'preview.html') => spawnSync(process.execPath, [cli, '--html', path.join(dir, 'rendered.html'), '--tokens', path.join(dir, 'tokens.json'), '--repo-root', dir, '--out', path.join(dir, out)], { encoding: 'utf8' }) };
}
test('CLI preserves renderer markup and attaches a self-contained editor after freshness checks', () => {
  const { dir, run } = fixture(), result = run();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(dir, 'preview.html'), 'utf8');
  assert.match(html, /Fixture, not a DS render test/); assert.match(html, /danh-token-data/); assert.match(html, /mountEditor/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'rendered.html'), 'utf8'), /danh-token-data/);
});
test('stale source is refused and no preview is written', () => {
  const { dir, run } = fixture(); fs.appendFileSync(path.join(dir, 'component.js'), '// changed');
  const result = run(); assert.equal(result.status, 1); assert.match(result.stderr, /Source changed/);
  assert.equal(fs.existsSync(path.join(dir, 'preview.html')), false);
});
test('CLI refuses to overwrite original renderer output', () => {
  const { run } = fixture(), result = run('rendered.html'); assert.equal(result.status, 1); assert.match(result.stderr, /separate --out/);
});
test('CLI refuses Windows case aliases of renderer output', { skip: process.platform !== 'win32' }, () => {
  const { run } = fixture(), result = run('RENDERED.html'); assert.equal(result.status, 1); assert.match(result.stderr, /separate --out/);
});
