import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repo, 'skills/design-tokens/scripts/scaffold-playground.mjs');
const scratch = path.join(repo, '..', '.v04-checks', 'test-fixtures');
fs.mkdirSync(scratch, { recursive: true });

function setupFixture(name, ready = true, customCheckResult = null) {
  const dir = fs.mkdtempSync(path.join(scratch, `${name}-`));

  // Create package.json
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: `fixture-${name}`, version: '1.2.3' }, null, 2),
    'utf8'
  );

  // Create sample CSS file
  const cssContent = `:root {
  --background: #ffffff;
  --foreground: #09090b;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --radius: 0.5rem;
  --radius-card: 16px;
}
.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --primary: #60a5fa;
  --primary-foreground: #09090b;
  --radius: 0.5rem;
  --radius-card: 16px;
}
`;
  const cssPath = path.join(dir, 'tokens.css');
  fs.writeFileSync(cssPath, cssContent, 'utf8');

  // Create mock component file
  const compDir = path.join(dir, 'src', 'components', 'ui');
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'button.tsx'), 'export const Button = () => <button />;\n', 'utf8');

  const checkResult = customCheckResult || (ready
    ? {
        shadcn: {
          declared: true,
          installed: true,
          components: ['button.tsx'],
          missing: [],
        },
        heroui: {
          declared: false,
          installed: false,
          wired: false,
          missing: [],
        },
        framework: 'vite',
        tailwind: 4,
        packageManager: 'npm',
        ready: true,
      }
    : {
        shadcn: {
          declared: false,
          installed: false,
          components: [],
          missing: ['components.json'],
        },
        heroui: {
          declared: false,
          installed: false,
          wired: false,
          missing: ['@heroui/react'],
        },
        framework: 'vite',
        tailwind: 4,
        packageManager: 'npm',
        ready: false,
      });

  return {
    dir,
    cssPath,
    checkResult,
    run: (extraArgs = [], env = {}) =>
      spawnSync(
        process.execPath,
        [cli, '--root', dir, '--css', cssPath, ...extraArgs],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            DANH_CHECK_UI_RESULT: JSON.stringify(checkResult),
            ...env,
          },
        }
      ),
  };
}

test('not-ready fixture exits non-zero and writes nothing', () => {
  const { dir, run } = setupFixture('not-ready', false);
  const outDir = path.join(dir, 'design-system', 'playground');
  const res = run(['--out-dir', 'design-system/playground']);

  assert.notEqual(res.status, 0, 'Must exit with non-zero status when not ready');
  assert.match(res.stderr, /chưa sẵn sàng thư viện UI/i);
  assert.equal(fs.existsSync(outDir), false, 'Nothing should be written to outDir');
});

test('ready fixture writes files and generates valid manifest with tokens and hashes', () => {
  const { dir, run, cssPath } = setupFixture('ready', true);
  const outDir = path.join(dir, 'design-system', 'playground');
  const res = run(['--out-dir', 'design-system/playground']);

  assert.equal(res.status, 0, res.stderr);

  // Check generated files
  const requiredFiles = [
    'manifest.json',
    'token-parameters.ts',
    'TokenPlayground.tsx',
    'main.tsx',
    'index.html',
    'controls/ThemeControls.tsx',
    'preview/ShadcnPreview.tsx',
    'preview/HeroUIPreview.tsx',
    'preview/ContrastGrid.tsx',
    'preview/TypographyScale.tsx',
  ];

  for (const rel of requiredFiles) {
    const full = path.join(outDir, rel);
    assert.equal(fs.existsSync(full), true, `File missing: ${rel}`);
  }

  // Check manifest content
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.source.id, 'fixture-ready@1.2.3');
  assert.equal(manifest.tokens.light['--primary'], '#2563eb');
  assert.equal(manifest.tokens.dark['--primary'], '#60a5fa');
  assert.equal(manifest.tokens.light['--radius-card'], '16px');

  // Verify hashes
  const expectedCssHash = createHash('sha256').update(fs.readFileSync(cssPath)).digest('hex');
  assert.equal(manifest.source.hashes['tokens.css'], expectedCssHash);
  assert.ok(manifest.source.hashes['src/components/ui/button.tsx'], 'Should hash button.tsx component');
});

test('existing files without --force are refused and exit non-zero', () => {
  const { run } = setupFixture('refuse-existing', true);
  // First run succeeds
  const first = run(['--out-dir', 'playground']);
  assert.equal(first.status, 0);

  // Second run without --force must fail
  const second = run(['--out-dir', 'playground']);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /đã tồn tại file.*--force/i);
});

test('existing files with --force are overwritten successfully', () => {
  const { run } = setupFixture('overwrite-force', true);
  const first = run(['--out-dir', 'playground']);
  assert.equal(first.status, 0);

  const second = run(['--out-dir', 'playground', '--force']);
  assert.equal(second.status, 0, second.stderr);
});

test('--dry runs check and extraction without writing any files', () => {
  const { dir, run } = setupFixture('dry-run', true);
  const outDir = path.join(dir, 'dry-playground');
  const res = run(['--out-dir', 'dry-playground', '--dry']);

  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /\[DRY RUN\]/);
  assert.equal(fs.existsSync(outDir), false, 'Dry run must not create outDir');
});

test('--ui shadcn flag only enables shadcn in manifest and preview', () => {
  const { dir, run } = setupFixture('ui-shadcn-only', true);
  const outDir = path.join(dir, 'playground-shadcn');
  const res = run(['--out-dir', 'playground-shadcn', '--ui', 'shadcn']);

  assert.equal(res.status, 0, res.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.ui.shadcn.installed, true);
  assert.equal(manifest.ui.heroui.installed, false);
});

test('--ui both flag fails when only shadcn is installed', () => {
  const { dir, run } = setupFixture('ui-both-missing-heroui', true);
  const outDir = path.join(dir, 'playground-both');
  const res = run(['--out-dir', 'playground-both', '--ui', 'both']);

  assert.notEqual(res.status, 0, 'Must exit non-zero when target both is not met');
  assert.equal(fs.existsSync(outDir), false, 'Nothing should be written on failure');
});

test('--ui heroui extracts HeroUI variables and generates compound component preview', () => {
  const dir = fs.mkdtempSync(path.join(scratch, 'heroui-scaffold-'));

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'heroui-app', version: '2.0.0' }, null, 2)
  );

  // Mock variables.css
  const stylesDir = path.join(dir, 'node_modules', '@heroui', 'styles', 'dist', 'themes', 'default');
  fs.mkdirSync(stylesDir, { recursive: true });
  const heroVariablesCss = `:root {
  --accent: oklch(0.62 0.19 253);
  --accent-foreground: #ffffff;
  --surface: #ffffff;
  --surface-foreground: #09090b;
  --field-radius: 0.75rem;
}
.dark {
  --surface: #121212;
  --surface-foreground: #fafafa;
}
`;
  const heroVariablesPath = path.join(stylesDir, 'variables.css');
  fs.writeFileSync(heroVariablesPath, heroVariablesCss, 'utf8');

  // Project CSS
  const projectCss = `:root { --custom-color: #10b981; } .dark { --custom-color: #059669; }`;
  const cssPath = path.join(dir, 'project.css');
  fs.writeFileSync(cssPath, projectCss, 'utf8');

  const checkResult = {
    shadcn: { declared: false, installed: false, components: [], missing: ['components.json'] },
    heroui: {
      declared: true,
      installed: true,
      version: '3.2.7',
      majorVersion: 3,
      mode: 'monolithic',
      stylesCssPath: heroVariablesPath,
      components: ['card', 'checkbox', 'switch', 'slider', 'tabs', 'table', 'alert', 'modal', 'dropdown'],
      anatomy: {
        card: ['Root', 'Header', 'Title', 'Description', 'Content', 'Footer'],
        checkbox: ['Root', 'Content', 'Control', 'Indicator'],
      },
      wired: true,
      missing: [],
    },
    framework: 'vite',
    tailwind: 4,
    packageManager: 'npm',
    ready: true,
  };

  const outDir = path.join(dir, 'playground-hero');
  const res = spawnSync(
    process.execPath,
    [cli, '--root', dir, '--css', cssPath, '--out-dir', 'playground-hero', '--ui', 'heroui'],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DANH_CHECK_UI_RESULT: JSON.stringify(checkResult),
      },
    }
  );

  assert.equal(res.status, 0, res.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.ui.heroui.installed, true);
  assert.equal(manifest.ui.shadcn.installed, false);
  // Verify HeroUI tokens extracted from variables.css
  assert.equal(manifest.tokens.light['--accent'], 'oklch(0.62 0.19 253)');
  assert.equal(manifest.tokens.light['--field-radius'], '0.75rem');
  assert.equal(manifest.tokens.dark['--surface'], '#121212');

  // Verify preview/HeroUIPreview.tsx generated with compound components
  const heroPreviewCode = fs.readFileSync(path.join(outDir, 'preview', 'HeroUIPreview.tsx'), 'utf8');
  assert.match(heroPreviewCode, /<Alert status="accent">/);
  assert.match(heroPreviewCode, /<Card\.Header/);
  assert.match(heroPreviewCode, /<Checkbox/);
  assert.match(heroPreviewCode, /<Checkbox\.Control>/);
  assert.match(heroPreviewCode, /<Switch\.Control>/);
  assert.match(heroPreviewCode, /<Slider\.Track>/);
  assert.match(heroPreviewCode, /<Tabs\.ListContainer>/);
  assert.match(heroPreviewCode, /<Table\.ScrollContainer>/);
  assert.match(heroPreviewCode, /<Modal\.Trigger>/);
});
