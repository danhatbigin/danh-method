import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkUiPackages } from '../skills/design-tokens/scripts/check-ui-packages.mjs';

function createTempDir(prefix = 'check-ui-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

test('nothing installed → ready false with missing list', (t) => {
  const dir = createTempDir('empty-');
  t.after(() => removeDir(dir));

  const result = checkUiPackages(dir);
  assert.equal(result.ready, false);
  assert.equal(result.shadcn.installed, false);
  assert.equal(result.shadcn.declared, false);
  assert.ok(result.shadcn.missing.length > 0);
  assert.ok(result.shadcn.missing.includes('components.json'));
  assert.equal(result.heroui.installed, false);
  assert.equal(result.heroui.declared, false);
  assert.ok(result.heroui.missing.length > 0);
});

test('shadcn fixture installed → shadcn.installed true', (t) => {
  const dir = createTempDir('shadcn-');
  t.after(() => removeDir(dir));

  // 1. package.json
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'test-shadcn',
      dependencies: {
        'radix-ui': '^1.0.0',
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        'tailwindcss': '^4.0.0'
      }
    }, null, 2)
  );

  // 2. components.json
  fs.writeFileSync(
    path.join(dir, 'components.json'),
    JSON.stringify({
      $schema: 'https://ui.shadcn.com/schema.json',
      aliases: {
        ui: '@/components/ui'
      }
    }, null, 2)
  );

  // 3. tsconfig.json
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@/*': ['./*']
        }
      }
    }, null, 2)
  );

  // 4. component file
  const compDir = path.join(dir, 'components', 'ui');
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'button.tsx'), 'export const Button = () => null;');
  fs.writeFileSync(path.join(compDir, 'card.tsx'), 'export const Card = () => null;');

  // 5. mock node_modules
  for (const pkg of ['radix-ui', 'class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss']) {
    const pkgDir = path.join(dir, 'node_modules', pkg);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: pkg, version: '1.0.0' }));
  }

  const result = checkUiPackages(dir);
  assert.equal(result.shadcn.declared, true);
  assert.equal(result.shadcn.installed, true);
  assert.deepEqual(result.shadcn.missing, []);
  assert.deepEqual(result.shadcn.components, ['button.tsx', 'card.tsx']);
  assert.equal(result.ready, true);
});

test('heroui declared but not in node_modules → installed false', (t) => {
  const dir = createTempDir('heroui-missing-');
  t.after(() => removeDir(dir));

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'test-heroui',
      dependencies: {
        '@heroui/react': '^2.0.0'
      }
    }, null, 2)
  );

  const result = checkUiPackages(dir);
  assert.equal(result.heroui.declared, true);
  assert.equal(result.heroui.installed, false);
  assert.equal(result.heroui.version, null);
  assert.ok(result.heroui.missing.includes('@heroui/react in node_modules'));
  assert.equal(result.ready, false);
});

test('heroui installed and wired → heroui.installed true and ready true', (t) => {
  const dir = createTempDir('heroui-installed-');
  t.after(() => removeDir(dir));

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'test-heroui-ok',
      dependencies: {
        '@heroui/react': '^2.4.0'
      }
    }, null, 2)
  );

  // Mock node_modules/@heroui/react
  const pkgDir = path.join(dir, 'node_modules', '@heroui', 'react');
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@heroui/react', version: '2.4.0' }));

  // Mock tailwind config wiring
  fs.writeFileSync(path.join(dir, 'tailwind.config.js'), 'const { heroui } = require("@heroui/react"); module.exports = { plugins: [heroui()] };');

  const result = checkUiPackages(dir);
  assert.equal(result.heroui.declared, true);
  assert.equal(result.heroui.installed, true);
  assert.equal(result.heroui.version, '2.4.0');
  assert.equal(result.heroui.wired, true);
  assert.equal(result.ready, true);
});

test('--ui selection gate: strict check matches chosen target', (t) => {
  const dir = createTempDir('ui-targets-');
  t.after(() => removeDir(dir));

  // Install only shadcn
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'test-targets',
      dependencies: {
        'radix-ui': '^1.0.0',
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        'tailwindcss': '^4.0.0'
      }
    }, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, 'components.json'),
    JSON.stringify({
      aliases: { ui: '@/components/ui' }
    }, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } }
    }, null, 2)
  );
  const compDir = path.join(dir, 'components', 'ui');
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'button.tsx'), 'export const Button = () => null;');

  for (const pkg of ['radix-ui', 'class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss']) {
    const pkgDir = path.join(dir, 'node_modules', pkg);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: pkg, version: '1.0.0' }));
  }

  // 1. Discovery scan (uiTarget: null) -> ready is true, availableTargets has 'shadcn'
  const disc = checkUiPackages(dir, null);
  assert.equal(disc.uiTarget, null);
  assert.deepEqual(disc.availableTargets, ['shadcn']);
  assert.equal(disc.ready, true);

  // 2. Strict check --ui shadcn -> ready: true
  const shadcnRes = checkUiPackages(dir, 'shadcn');
  assert.equal(shadcnRes.uiTarget, 'shadcn');
  assert.equal(shadcnRes.ready, true);

  // 3. Strict check --ui heroui -> ready: false
  const herouiRes = checkUiPackages(dir, 'heroui');
  assert.equal(herouiRes.uiTarget, 'heroui');
  assert.equal(herouiRes.ready, false);

  // 4. Strict check --ui both -> rejected (invalidTarget: true, ready: false; only 1 of 2 allowed)
  const bothRes = checkUiPackages(dir, 'both');
  assert.equal(bothRes.uiTarget, 'both');
  assert.equal(bothRes.invalidTarget, true);
  assert.equal(bothRes.ready, false);
});

test('HeroUI deep-scan: detects majorVersion, mode, stylesCssPath, components and compound anatomy', (t) => {
  const dir = createTempDir('heroui-deep-');
  t.after(() => removeDir(dir));

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'test-heroui-deep',
      dependencies: {
        '@heroui/react': '^3.2.7',
        '@heroui/styles': '^3.2.7'
      }
    }, null, 2)
  );

  // Mock @heroui/styles
  const stylesDir = path.join(dir, 'node_modules', '@heroui', 'styles', 'dist', 'themes', 'default');
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'node_modules', '@heroui', 'styles', 'package.json'), JSON.stringify({ name: '@heroui/styles', version: '3.2.7' }));
  fs.writeFileSync(path.join(stylesDir, 'variables.css'), ':root { --accent: #2563eb; }');

  // Mock @heroui/react with components
  const reactDir = path.join(dir, 'node_modules', '@heroui', 'react');
  const compsDir = path.join(reactDir, 'dist', 'components');
  fs.mkdirSync(compsDir, { recursive: true });
  fs.writeFileSync(path.join(reactDir, 'package.json'), JSON.stringify({ name: '@heroui/react', version: '3.2.7' }));

  // Create card component with compound anatomy
  const cardDir = path.join(compsDir, 'card');
  fs.mkdirSync(cardDir, { recursive: true });
  fs.writeFileSync(
    path.join(cardDir, 'index.js'),
    `const Card = Object.assign(CardRoot, {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter
});
export { Card };`
  );

  // Create checkbox component with compound anatomy
  const checkDir = path.join(compsDir, 'checkbox');
  fs.mkdirSync(checkDir, { recursive: true });
  fs.writeFileSync(
    path.join(checkDir, 'index.js'),
    `const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Content: CheckboxContent,
  Control: CheckboxControl,
  Indicator: CheckboxIndicator
});
export { Checkbox };`
  );

  // Wiring in index.css
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'index.css'), '@import "@heroui/styles";');

  const res = checkUiPackages(dir, 'heroui');
  assert.equal(res.heroui.installed, true);
  assert.equal(res.heroui.version, '3.2.7');
  assert.equal(res.heroui.majorVersion, 3);
  assert.equal(res.heroui.mode, 'monolithic');
  assert.ok(res.heroui.stylesCssPath.endsWith('variables.css'));
  assert.deepEqual(res.heroui.components, ['card', 'checkbox']);
  assert.deepEqual(res.heroui.anatomy.card, ['Root', 'Header', 'Title', 'Description', 'Content', 'Footer']);
  assert.deepEqual(res.heroui.anatomy.checkbox, ['Root', 'Content', 'Control', 'Indicator']);
  assert.equal(res.heroui.wired, true);
  assert.equal(res.ready, true);
});
