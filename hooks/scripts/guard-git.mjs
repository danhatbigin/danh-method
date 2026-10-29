#!/usr/bin/env node
// Danh Method · guard-git
// PreToolUse hook cho Bash: chặn lệnh git có thể làm mất việc dở hoặc ghi đè lịch sử.
// Đọc JSON từ stdin ({ tool_name, tool_input: { command } }). Chặn = exit 2 + lý do ở stderr.
// Không chặn được thì luôn cho qua (exit 0) — hook không được làm hỏng phiên làm việc.

const RULES = [
  { re: /\bgit\b[^;&|\n]*\breset\b[^;&|\n]*--(hard|merge|keep)\b/, why: 'git reset --hard/--merge/--keep xoá việc dở không hồi phục được.', alt: 'Sai thì dùng `git revert <commit>` (tạo commit mới).' },
  { re: /\bgit\b[^;&|\n]*\bstash\b(?![^;&|\n]*\b(list|show)\b)/, why: 'git stash làm việc dở "biến mất" với agent sau.', alt: 'Để nguyên và ghi vào HANDOFF, hoặc commit WIP rõ tên trên nhánh của mình.' },
  { re: /\bgit\b[^;&|\n]*\bclean\b[^;&|\n]*\s-[a-zA-Z]*[fdx]/, why: 'git clean xoá file chưa track (ảnh, prototype, log).', alt: 'Liệt kê file và hỏi người giao việc.' },
  { re: /\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*(\s--force\b|\s--force-with-lease\b|\s-[a-zA-Z]*f\b|\s\+\S)/, why: 'Force push ghi đè lịch sử người khác.', alt: 'Dùng `git merge origin/main` rồi push thường.' },
  { re: /\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*\s--delete\b/, why: 'Xoá nhánh remote là việc của owner.', alt: 'Báo owner.' },
  { re: /\bgit\b[^;&|\n]*\bbranch\b[^;&|\n]*\s-D\b/, why: 'Xoá nhánh cưỡng bức là việc của owner.', alt: 'Báo owner.' },
  { re: /\bgit\b[^;&|\n]*\bcheckout\b[^;&|\n]*\s(--\s|\.(\s|$)|-f\b|--force\b)/, why: 'git checkout -- / . / -f đè thay đổi chưa commit.', alt: 'Hoàn tác đúng phần của mình bằng tay, hoặc hỏi.' },
  { re: /\bgit\b[^;&|\n]*\brestore\b(?![^;&|\n]*--staged\b(?![^;&|\n]*--worktree))[^;&|\n]*(\s\.(\s|$)|\s:\/)/, why: 'git restore . đè toàn bộ thay đổi chưa commit.', alt: 'Hoàn tác đúng file của mình, hoặc hỏi.' },
];

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const input = JSON.parse(raw || '{}');
    if (input.tool_name && input.tool_name !== 'Bash') process.exit(0);
    cmd = String(input?.tool_input?.command || '');
  } catch { process.exit(0); }
  if (!/\bgit\b/.test(cmd)) process.exit(0);
  const hit = RULES.find(r => r.re.test(cmd));
  if (!hit) process.exit(0);
  process.stderr.write(
    `[danh-method] Đã chặn: ${hit.why}\n` +
    `Làm thay: ${hit.alt}\n` +
    `Nếu người phụ trách thật sự muốn chạy lệnh này, họ tự chạy trong terminal của họ.\n`
  );
  process.exit(2);
});
