#!/usr/bin/env node
// spec-guard: khoa test sinh tu spec. Rao giam toc, khong thay the CODEOWNERS/CI.
// Dung: node tools/spec-guard.mjs [--update ID] [--require-spec] [--spec DUONG_DAN]
// Repo spec mac dinh: bien SPEC_REPO, neu khong co thi ../<ten-repo>-spec.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ID = /^[A-Z][A-Z0-9]*-[A-Z0-9]+-\d+$/;
const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', '.turbo', '.verify', '.ci-spec']);
const GUARDED_LINK = /(^|\/)tests(\/spec(\/|$)|$)|(^|\/)tests\/spec-manifest\.json$/;
const STR = String.raw`(['"\x60])(?:(?!\1)[^\\]|\\.)*\1`;
const DISABLED = [
  [/\b(?:xit|xdescribe|xtest)\s*\(/, 'xit/xdescribe/xtest'],
  [/\.\s*(?:skip|todo|only|fixme)\b/, '.skip/.todo/.only/.fixme'],
  [new RegExp(String.raw`\b(?:test|it|describe|suite)\s*\(\s*${STR}\s*,\s*\{[^}]*\b(?:skip|todo)\s*:\s*(?!false\b)`), 'skip/todo option'],
  [/\b(?:test|it|describe|suite)\s*\(\s*\{[^}]*\b(?:skip|todo)\s*:\s*(?!false\b)/, 'skip/todo option'],
];
const EMPTY_TEST = new RegExp(String.raw`\b(?:test|it)\s*\(\s*${STR}\s*,\s*(?:async\s*)?(?:function\s*\w*\s*)?(?:\([^)]*\)|\w+)?\s*(?:=>)?\s*\{\s*(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*\}\s*\)`);
const ASSERTION = /\b(?:assert|expect)\b/;

const inside = (root, file) => { const rel = path.relative(root, file); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');

// Duyet cay thu muc. Symlink khong di theo, nhung duoc ghi lai de guard bao loi neu nam trong vung bi khoa.
function walk(root, visit, links = [], rel = '') {
  for (const ent of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    const name = path.posix.join(rel, ent.name);
    if (ent.isSymbolicLink()) { links.push(name); continue; }
    if (SKIP_DIRS.has(ent.name)) continue;
    if (ent.isDirectory()) walk(root, visit, links, name);
    else if (ent.isFile()) visit(name);
  }
}

export function scenarioVersions(specRoot) {
  const versions = new Map();
  if (!fs.existsSync(specRoot)) return null;
  walk(specRoot, (file) => {
    if (path.posix.basename(file) !== 'SCENARIOS.md') return;
    for (const line of fs.readFileSync(path.join(specRoot, file), 'utf8').split(/\r?\n/)) {
      const cells = line.split('|').map((x) => x.trim());
      if (!ID.test(cells[1] || '') || !/^\d+$/.test(cells[4] || '')) continue;
      const id = cells[1], version = Number(cells[4]);
      if (versions.has(id)) throw new Error(`duplicate scenario: ${id}`);
      versions.set(id, version);
    }
  });
  return versions;
}

export function guard(root, { update, requireSpec = false, specRoot } = {}) {
  root = fs.realpathSync(root);
  specRoot ??= process.env.SPEC_REPO ? path.resolve(process.env.SPEC_REPO) : path.resolve(root, '..', `${path.basename(root)}-spec`);
  const errors = [], notes = [];
  const manifestFile = path.join(root, 'tests/spec-manifest.json');
  if (fs.lstatSync(manifestFile).isSymbolicLink()) throw new Error('manifest must not be a symlink');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8').replace(/^﻿/, ''));
  if (!Array.isArray(manifest)) throw new Error('manifest must be an array');
  const versions = scenarioVersions(specRoot);
  if (!versions && requireSpec) errors.push('spec repo not found but --require-spec was set');
  notes.push(versions ? 'scenario version check: available' : 'spec repo not found: version check skipped');
  const ids = new Set(), paths = new Set();
  for (const entry of manifest) {
    if (!entry || typeof entry !== 'object' || !ID.test(entry.id) || !Number.isSafeInteger(entry.version) || entry.version < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256)) { errors.push('invalid manifest entry'); continue; }
    if (ids.has(entry.id) || paths.has(entry.file)) errors.push(`duplicate manifest entry: ${entry.id}`);
    ids.add(entry.id); paths.add(entry.file);
    if (typeof entry.file !== 'string' || !/^(?:.*\/)?tests\/spec\/.+/.test(entry.file) || entry.file.includes('\\') || !inside(root, path.resolve(root, entry.file))) errors.push(`invalid test path: ${entry.id}`);
  }
  const files = [], links = [];
  walk(root, (file) => { if (/(^|\/)tests\/spec\/.+/.test(file)) files.push(file); }, links);
  for (const link of links) if (GUARDED_LINK.test(link)) errors.push(`symlink in guarded path: ${link}`);
  const headers = new Map();
  for (const file of files.sort()) {
    const data = fs.readFileSync(path.join(root, file));
    const source = data.toString('utf8').replace(/^﻿/, '');
    const header = source.split(/\r?\n/, 1)[0].match(/^\/\/ @spec ([A-Z][A-Z0-9]*-[A-Z0-9]+-\d+) v([1-9]\d*)$/);
    if (!header) { errors.push(`ORPHAN ${file}: missing first-line @spec header`); continue; }
    const [, id, version] = header;
    if (headers.has(id)) errors.push(`duplicate test ID: ${id}`);
    headers.set(id, { id, version: Number(version), file, sha256: digest(data) });
    for (const [re, why] of DISABLED) if (re.test(source)) { errors.push(`disabled spec test: ${id} (${why})`); break; }
    if (EMPTY_TEST.test(source)) errors.push(`empty spec test: ${id}`);
    if (!ASSERTION.test(source)) errors.push(`no assertion: ${id}`);
    if (!ids.has(id) && update !== id) errors.push(`ORPHAN ${id}: ${file}`);
  }
  if (update) {
    const test = headers.get(update), old = manifest.find((entry) => entry.id === update);
    if (!test) errors.push(`MISSING ${update}: cannot update missing test`);
    if (!versions) errors.push('update requires spec repo and scenario version');
    if (test && versions && versions.get(update) !== test.version) errors.push(`scenario version mismatch: ${update}`);
    if (old && test && test.version <= old.version) errors.push(`update requires scenario version increase: ${update}`);
    if (!errors.length) {
      const next = old ? manifest.map((entry) => entry.id === update ? test : entry) : [...manifest, test];
      fs.writeFileSync(manifestFile, JSON.stringify(next, null, 2) + '\n');
      notes.push(`UPDATED ${update} v${test.version}: exactly one ID`);
    }
  }
  for (const entry of manifest) {
    if (!entry || update === entry.id) continue;
    const test = headers.get(entry.id);
    if (!test || test.file !== entry.file) { errors.push(`MISSING ${entry.id}: ${entry.file}`); continue; }
    if (test.version !== entry.version) errors.push(`header version mismatch: ${entry.id}`);
    if (test.sha256 !== entry.sha256) errors.push(`hash mismatch: ${entry.id}`);
    if (versions && versions.get(entry.id) !== entry.version) errors.push(`scenario version mismatch: ${entry.id}`);
  }
  const empty = manifest.length === 0 && headers.size === 0;
  if (empty) notes.push(`EMPTY: no spec tests registered${versions ? `; ${versions.size} scenarios have no test yet` : ''}`);
  return { ok: !errors.length, errors, notes, count: headers.size, empty, versionCheck: versions ? 'checked' : 'skipped' };
}

function parseArgs(argv) {
  const out = { update: undefined, requireSpec: false, spec: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--update' && argv[i + 1]) out.update = argv[++i];
    else if (argv[i] === '--require-spec') out.requireSpec = true;
    else if (argv[i] === '--spec' && argv[i + 1]) out.spec = path.resolve(argv[++i]);
    else throw new Error('usage: node tools/spec-guard.mjs [--update ID] [--require-spec] [--spec PATH]');
  }
  return out;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = guard(process.cwd(), { update: args.update, requireSpec: args.requireSpec, ...(args.spec ? { specRoot: args.spec } : {}) });
    [...result.notes, ...result.errors].forEach((line) => console.log(line));
    console.log(`spec-guard: ${result.ok ? 'PASS' : 'FAIL'} · ${result.count} registered test files${result.empty ? ' · EMPTY' : ''}${result.versionCheck === 'skipped' ? ' · version check SKIPPED' : ''}`);
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) { console.error(`spec-guard: FAIL · ${error.message}`); process.exitCode = 1; }
}
// Fail-closed: chay CLI tru khi nguoi import chu dong tat (selftest). Khong so sanh duong dan, nen symlink/junction/subst khong lam script im lang.
if (process.env.SPEC_GUARD_IMPORT !== '1') main();
