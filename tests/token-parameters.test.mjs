import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBundle, parseBundle, toMarkdown } from '../skills/design-prototype/scripts/token-parameters.mjs';
const base = { schemaVersion: 1, source: { id: 'real-ds', hashes: { 'button.tsx': 'abc' } }, tokens: { light: { '--radius-card': '24px', '--primary': '#123456' }, dark: { '--radius-card': '24px', '--primary': '#abcdef' } } };
test('JSON and Markdown preserve light/dark token values and provenance', () => {
  for (const text of [JSON.stringify(base), toMarkdown(base)]) assert.deepEqual(parseBundle(text, base), base);
});
test('parameter edits are accepted only for declared tokens', () => {
  const changed = structuredClone(base); changed.tokens.dark['--radius-card'] = '28px';
  assert.equal(validateBundle(changed, base).tokens.dark['--radius-card'], '28px');
  changed.tokens.light['--invented'] = '1px';
  assert.throws(() => validateBundle(changed, base), /token/i);
});
test('import refuses source mismatch, missing modes and removed tokens', () => {
  const changed = structuredClone(base); changed.source.hashes['button.tsx'] = 'different';
  assert.throws(() => validateBundle(changed, base), /source/i);
  const missing = structuredClone(base); delete missing.tokens.dark;
  assert.throws(() => validateBundle(missing, base), /mode/i);
  const removed = structuredClone(base); delete removed.tokens.light['--primary'];
  assert.throws(() => validateBundle(removed, base), /token/i);
});
test('CSS injection and external loads are rejected before preview changes', () => {
  for (const value of ['red; color: blue', '</script>', 'url(https://example.com/a)', 'image-set("https://example.invalid/test.png" 1x)', '-webkit-image-set("asset.png" 1x)', 'image("asset.png")', 'red\n!important', 'expression(alert(1))']) {
    const changed = structuredClone(base); changed.tokens.light['--primary'] = value;
    assert.throws(() => validateBundle(changed, base), /value/i);
  }
});
