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

function setupFixture(name, ready = true) {
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

  const checkResult = ready
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
      };

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
