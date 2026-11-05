#!/usr/bin/env node
// Danh Method · guard-spec-tests
// PreToolUse hook (Edit/Write/MultiEdit/NotebookEdit/Bash): chặn ghi vào test khoá từ kịch bản
// (tests/spec/**, tests/spec-manifest.json) trừ khi cửa sổ Test đang mở (spec-lock --unlock).
// Chặn = exit 2 + hướng dẫn ở stderr. Lỗi đọc input → cho qua (hook không được làm hỏng phiên).
// Giới hạn: policy-only; spec-guard trong verify + CODEOWNERS mới là lớp phát hiện/khoá.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GUARDED = /(^|[\s"'`=:\\/])tests[\\/]spec([\\/]|$)|(^|[\s"'`=:\\/])tests[\\/]spec-manifest\.json\b/;
const READ_ONLY = /^\s*(cat|type|less|more|head|tail|grep|rg|ls|dir|find|wc|stat|file|diff|git\s+(diff|log|show|status|blame|ls-files)|node\s+(--test\b|\S*spec-guard)|pnpm\s+(test|exec\s+node\s+--test)|npm\s+(test|run\s+test)|npx\s+(vitest|jest)|vitest|jest|Get-Content|Select-String)\b/i;
const WRITE_HINT = /(>>?|\btee\b|\brm\b|\bdel\b|\bmv\b|\bmove\b|\bcp\b|\bcopy\b|\bsed\s+-i|\bperl\s+-[a-z]*i|\btruncate\b|\btouch\b|\bunlink\b|\bgit\s+(checkout|restore|rm|mv|apply|am|cherry-pick|revert)|Set-Content|Out-File|Remove-Item|Move-Item|Copy-Item|writeFile|--update\b)/i;

export function findRoot(start) {
  let dir = path.resolve(start || process.cwd());
  for (;;) { if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.danh'))) return dir; const up = path.dirname(dir); if (up === dir) return path.resolve(start || process.cwd()); dir = up; }
}
export function lockOpen(root, now = Date.now()) {
  try { const s = JSON.parse(fs.readFileSync(path.join(root, '.danh', 'spec-lock.json'), 'utf8')); return Boolean(s.until && Date.parse(s.until) > now) ? s : null; } catch { return null; }
}
export function decide(input, { now = Date.now() } = {}) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  let touches = false;
  if (tool === 'Bash') {
    const cmd = String(ti.command || '');
    if (!GUARDED.test(cmd)) return { block: false };
    const segments = cmd.split(/&&|\|\||;|\n/);
    touches = segments.some((seg) => GUARDED.test(seg) && (WRITE_HINT.test(seg) || !READ_ONLY.test(seg)));
  } else if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    touches = GUARDED.test(String(ti.file_path || ti.notebook_path || ''));
  }
  if (!touches) return { block: false };
  const root = findRoot(input.cwd);
  const open = lockOpen(root, now);
  if (open) return { block: false, note: `cửa sổ Test mở cho ${open.feature}` };
  return { block: true, message:
    '[danh-method] Đã chặn: đây là test khoá sinh từ kịch bản đã duyệt (tests/spec/**, manifest).\n' +
    'Không làm test khớp với code. Lệch thì:\n' +
    '  1. Sửa code cho đúng kịch bản; hoặc\n' +
    '  2. Mở Spec Issue (skill scenario-tests, mẫu SPEC-ISSUE) và ghi mục đó BLOCKED-SPEC, làm việc khác.\n' +
    'Chỉ test-translator được ghi, trong cửa sổ Test do điều phối mở: node <plugin>/skills/scenario-tests/scripts/spec-lock.mjs --unlock <feature> --reason "<ID vN đã duyệt>".\n' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    let input; try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    let r; try { r = decide(input); } catch { process.exit(0); }
    if (r.block) { process.stderr.write(r.message); process.exit(2); }
    process.exit(0);
  });
}
