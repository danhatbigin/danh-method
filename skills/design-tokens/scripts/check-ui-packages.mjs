#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const args = { root: process.cwd(), json: false, ui: null };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      args.json = true;
    } else if (arg === '--root' && i + 1 < argv.length) {
      args.root = argv[++i];
    } else if (arg.startsWith('--root=')) {
      args.root = arg.slice('--root='.length);
    } else if (arg === '--ui' && i + 1 < argv.length) {
      args.ui = argv[++i].toLowerCase();
    } else if (arg.startsWith('--ui=')) {
      args.ui = arg.slice('--ui='.length).toLowerCase();
    }
  }
  args.root = path.resolve(args.root);
  return args;
}

function stripJsonComments(str) {
  return str
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1');
}

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      return JSON.parse(content);
    } catch {
      return JSON.parse(stripJsonComments(content));
    }
  } catch {
    return null;
  }
}

function resolvePackageDir(pkgName, startDir) {
  let cur = path.resolve(startDir);
  const rootDir = path.parse(cur).root;
  const parts = pkgName.split('/');
  while (true) {
    const candidate = path.join(cur, 'node_modules', ...parts);
    if (fs.existsSync(candidate)) return candidate;
    if (cur === rootDir) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function isPackageResolvable(pkgName, startDir) {
  if (resolvePackageDir(pkgName, startDir)) return true;
  try {
    const req = createRequire(path.join(startDir, 'package.json'));
    req.resolve(pkgName);
    return true;
  } catch {
    return false;
  }
}

function getPackageVersion(pkgName, startDir) {
  const pkgDir = resolvePackageDir(pkgName, startDir);
  if (pkgDir) {
    const pkgJson = readJsonSafe(path.join(pkgDir, 'package.json'));
    if (pkgJson?.version) return pkgJson.version;
  }
  try {
    const req = createRequire(path.join(startDir, 'package.json'));
    const resolvedPath = req.resolve(pkgName);
    let cur = path.dirname(resolvedPath);
    while (cur && cur !== path.dirname(cur)) {
      const p = path.join(cur, 'package.json');
      if (fs.existsSync(p)) {
        const pkg = readJsonSafe(p);
        if (pkg?.name === pkgName && pkg?.version) return pkg.version;
      }
      cur = path.dirname(cur);
    }
  } catch {}
  return null;
}

function collectAllDeps(root) {
  const allDeps = {};
  let cur = path.resolve(root);
  const rootDir = path.parse(cur).root;
  while (true) {
    const pkgJson = readJsonSafe(path.join(cur, 'package.json'));
    if (pkgJson) {
      if (pkgJson.dependencies) Object.assign(allDeps, pkgJson.dependencies);
      if (pkgJson.devDependencies) Object.assign(allDeps, pkgJson.devDependencies);
      if (pkgJson.peerDependencies) Object.assign(allDeps, pkgJson.peerDependencies);
    }
    if (cur === rootDir) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return allDeps;
}

function detectPackageManager(root) {
  let cur = path.resolve(root);
  const rootDir = path.parse(cur).root;
  while (true) {
    if (fs.existsSync(path.join(cur, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(cur, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(cur, 'bun.lockb')) || fs.existsSync(path.join(cur, 'bun.lock'))) return 'bun';
    if (fs.existsSync(path.join(cur, 'package-lock.json'))) return 'npm';
    const pkgJson = readJsonSafe(path.join(cur, 'package.json'));
    if (pkgJson?.packageManager) {
      const name = pkgJson.packageManager.split('@')[0];
      if (['pnpm', 'yarn', 'bun', 'npm'].includes(name)) return name;
    }
    if (cur === rootDir) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return fs.existsSync(path.join(root, 'package.json')) ? 'npm' : null;
}

function detectFramework(root, allDeps) {
  if (allDeps.next || fs.existsSync(path.join(root, 'next.config.js')) || fs.existsSync(path.join(root, 'next.config.mjs')) || fs.existsSync(path.join(root, 'next.config.ts'))) {
    return 'next';
  }
  if (allDeps.vite || fs.existsSync(path.join(root, 'vite.config.js')) || fs.existsSync(path.join(root, 'vite.config.ts')) || fs.existsSync(path.join(root, 'vite.config.mjs'))) {
    return 'vite';
  }
  // Check monorepo parent / apps
  let cur = path.resolve(root);
  const rootDir = path.parse(cur).root;
  while (cur !== rootDir) {
    const parent = path.dirname(cur);
    const appsDir = path.join(parent, 'apps');
    if (fs.existsSync(appsDir)) {
      try {
        const appDirs = fs.readdirSync(appsDir, { withFileTypes: true });
        for (const app of appDirs) {
          if (app.isDirectory()) {
            const p = path.join(appsDir, app.name, 'package.json');
            const pkg = readJsonSafe(p);
            if (pkg?.dependencies?.next || pkg?.devDependencies?.next) return 'next';
            if (pkg?.dependencies?.vite || pkg?.devDependencies?.vite) return 'vite';
          }
        }
      } catch {}
    }
    cur = parent;
  }
  return 'other';
}

function detectTailwindVersion(root, allDeps) {
  const ver = getPackageVersion('tailwindcss', root);
  if (ver) {
    const major = parseInt(ver.split('.')[0], 10);
    if (!Number.isNaN(major)) return major;
  }
  const declared = allDeps.tailwindcss || allDeps['@tailwindcss/postcss'];
  if (typeof declared === 'string') {
    const match = declared.match(/\^?~?(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function resolveUiDirectory(root, compJson) {
  const uiAlias = compJson?.aliases?.ui || '@/components/ui';

  // Read tsconfig / jsconfig paths
  let paths = {};
  let baseUrl = '.';
  for (const configName of ['tsconfig.json', 'jsconfig.json']) {
    const cfg = readJsonSafe(path.join(root, configName));
    if (cfg?.compilerOptions) {
      if (cfg.compilerOptions.paths) paths = { ...paths, ...cfg.compilerOptions.paths };
      if (cfg.compilerOptions.baseUrl) baseUrl = cfg.compilerOptions.baseUrl;
      break;
    }
  }

  // Also check parent dir tsconfig if in monorepo
  if (Object.keys(paths).length === 0) {
    const parentCfg = readJsonSafe(path.join(root, '..', '..', 'tsconfig.json'));
    if (parentCfg?.compilerOptions?.paths) {
      paths = parentCfg.compilerOptions.paths;
      baseUrl = parentCfg.compilerOptions.baseUrl || '.';
    }
  }

  for (const [pattern, targets] of Object.entries(paths)) {
    const prefix = pattern.replace(/\*$/, '');
    if (uiAlias.startsWith(prefix) && Array.isArray(targets) && targets.length > 0) {
      const rest = uiAlias.slice(prefix.length);
      const targetPrefix = targets[0].replace(/\*$/, '');
      const rel = path.join(baseUrl, targetPrefix, rest);
      const candidate = path.resolve(root, rel);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }
  }

  const stripped = uiAlias.replace(/^[@~]\//, '');
  const candidates = [
    path.resolve(root, stripped),
    path.resolve(root, 'src', stripped),
    path.resolve(root, 'components/ui'),
    path.resolve(root, 'src/components/ui'),
    path.resolve(root, 'src/components'),
    path.resolve(root, 'components')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      return c;
    }
  }
  return null;
}

function findComponentsInDir(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => {
        if (!/\.(tsx|jsx)$/i.test(file)) return false;
        if (/\.(test|spec|stories)\.(tsx|jsx)$/i.test(file)) return false;
        return true;
      })
      .sort();
  } catch {
    return [];
  }
}

function checkHeroUiWiring(root) {
  // Check tailwind.config.*
  let cur = path.resolve(root);
  const rootDir = path.parse(cur).root;
  while (true) {
    for (const ext of ['.js', '.cjs', '.mjs', '.ts']) {
      const cfgPath = path.join(cur, `tailwind.config${ext}`);
      if (fs.existsSync(cfgPath)) {
        try {
          const content = fs.readFileSync(cfgPath, 'utf8');
          if (/heroui\s*\(/.test(content) || /herouiPlugin/.test(content) || /@heroui\//.test(content)) {
            return true;
          }
        } catch {}
      }
    }
    if (cur === rootDir) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  // Check hero.ts / hero.js
  for (const dir of [root, path.join(root, 'src'), path.join(root, 'app')]) {
    for (const name of ['hero.ts', 'hero.js', 'hero.mjs']) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          if (/heroui\s*\(/.test(content)) return true;
        } catch {}
      }
    }
  }

  // Check CSS files for @plugin / @import @heroui
  function checkCssInDir(dir, depth = 0) {
    if (!fs.existsSync(dir) || depth > 3) return false;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git' && ent.name !== 'dist') {
          if (checkCssInDir(full, depth + 1)) return true;
        } else if (ent.isFile() && ent.name.endsWith('.css')) {
          const content = fs.readFileSync(full, 'utf8');
          if (
            /@plugin\s+['"].*hero.*['"]/.test(content) ||
            /@import\s+['"]@heroui\/styles['"]/.test(content) ||
            /@import\s+['"]@heroui\/theme['"]/.test(content)
          ) {
            return true;
          }
        }
      }
    } catch {}
    return false;
  }

  if (checkCssInDir(root)) return true;
  return false;
}

function parseCompoundAnatomy(code) {
  const parts = [];
  const match = code.match(/Object\.assign\s*\([^,]+,\s*\{([^}]+)\}\)/s);
  if (!match) return parts;
  const body = match[1];
  const lines = body.split(',');
  for (const rawLine of lines) {
    const cleanLine = rawLine.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!cleanLine) continue;
    const m = cleanLine.match(/^([A-Za-z0-9_$]+)(\s*:)?/);
    if (m && m[1]) {
      parts.push(m[1]);
    }
  }
  return parts;
}

function scanHeroUi(root, allDeps, herouiInstalled, herouiVersion) {
  let majorVersion = null;
  if (herouiVersion) {
    const parsed = parseInt(herouiVersion.split('.')[0], 10);
    if (!Number.isNaN(parsed)) majorVersion = parsed;
  }

  const reactPkgDir = resolvePackageDir('@heroui/react', root);
  let mode = null;
  if (reactPkgDir && fs.existsSync(reactPkgDir)) {
    mode = 'monolithic';
  } else if (Object.keys(allDeps).some((d) => d.startsWith('@heroui/'))) {
    mode = 'individual';
  }

  // stylesCssPath
  let stylesCssPath = null;
  const stylesPkgDir = resolvePackageDir('@heroui/styles', root);
  if (stylesPkgDir) {
    const candidate = path.join(stylesPkgDir, 'dist', 'themes', 'default', 'variables.css');
    if (fs.existsSync(candidate)) {
      stylesCssPath = candidate;
    }
  }
  if (!stylesCssPath) {
    const fallbackCandidate = path.join(root, 'node_modules', '@heroui', 'styles', 'dist', 'themes', 'default', 'variables.css');
    if (fs.existsSync(fallbackCandidate)) {
      stylesCssPath = fallbackCandidate;
    }
  }

  const components = [];
  const anatomy = {};

  if (mode === 'monolithic' && reactPkgDir) {
    const compsDir = path.join(reactPkgDir, 'dist', 'components');
    if (fs.existsSync(compsDir)) {
      try {
        const entries = fs.readdirSync(compsDir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            components.push(ent.name);
            const compIndex = path.join(compsDir, ent.name, 'index.js');
            if (fs.existsSync(compIndex)) {
              try {
                const code = fs.readFileSync(compIndex, 'utf8');
                const parts = parseCompoundAnatomy(code);
                if (parts.length > 0) {
                  anatomy[ent.name] = parts;
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
  } else if (mode === 'individual') {
    const herouiScopeDir = resolvePackageDir('@heroui', root);
    if (herouiScopeDir && fs.existsSync(herouiScopeDir)) {
      try {
        const entries = fs.readdirSync(herouiScopeDir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory() && !['theme', 'styles', 'system', 'react'].includes(ent.name)) {
            components.push(ent.name);
            for (const sub of ['index.js', path.join('dist', 'index.js')]) {
              const compIndex = path.join(herouiScopeDir, ent.name, sub);
              if (fs.existsSync(compIndex)) {
                try {
                  const code = fs.readFileSync(compIndex, 'utf8');
                  const parts = parseCompoundAnatomy(code);
                  if (parts.length > 0) {
                    anatomy[ent.name] = parts;
                  }
                } catch {}
                break;
              }
            }
          }
        }
      } catch {}
    }
  }

  components.sort();

  return {
    majorVersion,
    mode,
    stylesCssPath,
    components,
    anatomy
  };
}

export function checkUiPackages(targetRoot = process.cwd(), uiTarget = null) {
  const root = path.resolve(targetRoot);
  const compJsonPath = path.join(root, 'components.json');
  const hasCompJson = fs.existsSync(compJsonPath);
  const compJson = hasCompJson ? readJsonSafe(compJsonPath) : null;
  const allDeps = collectAllDeps(root);

  // --- shadcn/ui check ---
  const shadcnDeclared = Boolean(hasCompJson || allDeps.shadcn || allDeps['@shadcn/ui']);
  const shadcnMissing = [];

  let shadcnComponents = [];
  if (hasCompJson) {
    const uiDir = resolveUiDirectory(root, compJson);
    if (uiDir) {
      shadcnComponents = findComponentsInDir(uiDir);
      if (shadcnComponents.length === 0) {
        shadcnMissing.push('component files in aliases.ui directory (no .tsx found)');
      }
    } else {
      shadcnMissing.push(`aliases.ui directory not found (${compJson?.aliases?.ui || '@/components/ui'})`);
    }
  } else {
    shadcnMissing.push('components.json');
  }

  // Required runtime dependencies
  const hasRadix =
    isPackageResolvable('radix-ui', root) ||
    Object.keys(allDeps).some((d) => d.startsWith('@radix-ui/') && isPackageResolvable(d, root)) ||
    Boolean(resolvePackageDir('@radix-ui', root));
  if (!hasRadix) {
    shadcnMissing.push('radix-ui or @radix-ui/*');
  }

  if (!isPackageResolvable('class-variance-authority', root)) {
    shadcnMissing.push('class-variance-authority');
  }

  const hasCn = isPackageResolvable('cn', root);
  const hasClsx = isPackageResolvable('clsx', root);
  const hasTwMerge = isPackageResolvable('tailwind-merge', root);
  if (!hasCn && (!hasClsx || !hasTwMerge)) {
    if (!hasClsx) shadcnMissing.push('clsx');
    if (!hasTwMerge) shadcnMissing.push('tailwind-merge');
  }

  const hasTailwind =
    isPackageResolvable('tailwindcss', root) ||
    isPackageResolvable('@tailwindcss/postcss', root) ||
    Boolean(allDeps.tailwindcss || allDeps['@tailwindcss/postcss']);
  if (!hasTailwind) {
    shadcnMissing.push('tailwindcss');
  }

  const shadcnInstalled = Boolean(hasCompJson && shadcnComponents.length > 0 && shadcnMissing.length === 0);

  // --- HeroUI check ---
  const herouiDeclared = Boolean(
    allDeps['@heroui/react'] ||
    Object.keys(allDeps).some((d) => d.startsWith('@heroui/'))
  );
  const herouiMissing = [];
  let herouiVersion = getPackageVersion('@heroui/react', root);
  if (!herouiVersion) {
    for (const dep of Object.keys(allDeps)) {
      if (dep.startsWith('@heroui/')) {
        herouiVersion = getPackageVersion(dep, root);
        if (herouiVersion) break;
      }
    }
  }

  const herouiInstalled = Boolean(herouiDeclared && herouiVersion !== null);
  if (!herouiDeclared) {
    herouiMissing.push('@heroui/react in package.json');
  } else if (!herouiInstalled) {
    herouiMissing.push('@heroui/react in node_modules');
  }

  const herouiWired = checkHeroUiWiring(root);
  if (herouiInstalled && !herouiWired) {
    herouiMissing.push('tailwind wiring (heroui() plugin in tailwind config or @plugin / @import @heroui/styles in CSS)');
  }

  const herouiScan = scanHeroUi(root, allDeps, herouiInstalled, herouiVersion);

  // --- Framework, Tailwind, PackageManager ---
  const framework = detectFramework(root, allDeps);
  const tailwind = detectTailwindVersion(root, allDeps);
  const packageManager = detectPackageManager(root);

  // Available targets calculation (strictly 1 of 2: shadcn OR heroui, never both)
  const availableTargets = [];
  if (shadcnInstalled) availableTargets.push('shadcn');
  if (herouiInstalled && herouiWired) availableTargets.push('heroui');

  // Ready gate evaluation based on uiTarget
  let ready = false;
  let invalidTarget = false;
  let error = null;
  const normalizedTarget = uiTarget ? uiTarget.toLowerCase() : null;
  if (normalizedTarget === 'shadcn') {
    ready = shadcnInstalled;
  } else if (normalizedTarget === 'heroui') {
    ready = Boolean(herouiInstalled && herouiWired);
  } else if (normalizedTarget !== null) {
    ready = false;
    invalidTarget = true;
    error = 'Chỉ được chọn 1 trong 2 thư viện UI: --ui shadcn hoặc --ui heroui (không được chọn cả 2).';
  } else {
    // Discovery scan (uiTarget === null): ready only when exactly 1 library is installed; if both exist, user must choose 1 via --ui
    ready = availableTargets.length === 1;
    if (availableTargets.length > 1) {
      error = 'Dự án đang có cả shadcn/ui và HeroUI. Vui lòng chọn đúng 1 thư viện qua --ui shadcn hoặc --ui heroui.';
    }
  }

  return {
    uiTarget: normalizedTarget,
    availableTargets,
    invalidTarget,
    ...(error ? { error } : {}),
    shadcn: {
      declared: shadcnDeclared,
      installed: shadcnInstalled,
      components: shadcnComponents,
      missing: shadcnMissing
    },
    heroui: {
      declared: herouiDeclared,
      installed: herouiInstalled,
      version: herouiVersion,
      majorVersion: herouiScan.majorVersion,
      mode: herouiScan.mode,
      stylesCssPath: herouiScan.stylesCssPath,
      components: herouiScan.components,
      anatomy: herouiScan.anatomy,
      wired: herouiWired,
      missing: herouiMissing
    },
    framework,
    tailwind,
    packageManager,
    ready
  };
}

function runCli() {
  const args = parseArgs(process.argv);
  const result = checkUiPackages(args.root, args.ui);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  console.log(`\n=== Kiểm tra thư viện UI: ${args.root} ===\n`);
  console.log(`Target UI       : ${result.uiTarget || 'Tất cả (khảo sát tự động)'}`);
  console.log(`Mục tiêu khả dụng: ${result.availableTargets.length > 0 ? result.availableTargets.join(', ') : 'Chưa có'}`);
  console.log(`Framework       : ${result.framework}`);
  console.log(`Tailwind        : ${result.tailwind ? `v${result.tailwind}` : 'chưa xác định'}`);
  console.log(`Package Manager : ${result.packageManager || 'không rõ'}`);
  console.log(`Trạng thái chung: ${result.ready ? 'SẴN SÀNG (Đạt gate G0)' : 'CHƯA SẴN SÀNG (Gate G0 bị khoá)'}\n`);

  console.log('--- shadcn/ui ---');
  console.log(`  Khai báo    : ${result.shadcn.declared ? 'Có' : 'Không'}`);
  console.log(`  Cài đặt     : ${result.shadcn.installed ? 'Đầy đủ' : 'Chưa đủ'}`);
  console.log(`  Components  : ${result.shadcn.components.length} file (${result.shadcn.components.slice(0, 5).join(', ')}${result.shadcn.components.length > 5 ? '...' : ''})`);
  if (result.shadcn.missing.length > 0) {
    console.log(`  Thiếu       : ${result.shadcn.missing.join(', ')}`);
  }

  console.log('\n--- HeroUI ---');
  console.log(`  Khai báo    : ${result.heroui.declared ? 'Có' : 'Không'}`);
  console.log(`  Cài đặt     : ${result.heroui.installed ? `Có (v${result.heroui.version}, major: ${result.heroui.majorVersion || '?'}, mode: ${result.heroui.mode || '?'})` : 'Không'}`);
  console.log(`  Components  : ${result.heroui.components.length} components (${result.heroui.components.slice(0, 5).join(', ')}${result.heroui.components.length > 5 ? '...' : ''})`);
  console.log(`  Styles CSS  : ${result.heroui.stylesCssPath || 'Không tìm thấy'}`);
  console.log(`  Tailwind wire: ${result.heroui.wired ? 'Đã cấu hình' : 'Chưa cấu hình'}`);
  if (result.heroui.missing.length > 0) {
    console.log(`  Thiếu       : ${result.heroui.missing.join(', ')}`);
  }

  console.log('');
  if (!result.ready) {
    console.log('CẢNH BÁO: Dự án chưa đạt điều kiện cho target UI yêu cầu. Vui lòng xin phép và cài đặt theo references/install-ui-packages.md trước khi dựng token review page.\n');
    process.exit(1);
  }
  process.exit(0);
}

// Only run CLI if executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
