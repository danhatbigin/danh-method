# Dùng Danh Method ngoài Claude

| Công cụ | Cách dùng |
|---|---|
| **Codex** | Chép `AGENTS.md` này vào `<repo spec>/process/danh-method.md`; trong repo code tạo `AGENTS.override.md` (không commit, thêm vào `.git/info/exclude`) với nội dung: "Đọc `<repo spec>/process/danh-method.md`, `process/operator-<tên>.md`, `process/project.md` trước mọi việc." Codex cũng đọc được thư mục `skills/` (định dạng SKILL.md) nếu anh chép vào thư mục skills của Codex. |
| **Antigravity (Gemini)** | Chép `GEMINI.md` vào gốc repo đang mở (nếu repo chưa track `GEMINI.md`) hoặc vào repo spec và trỏ tới. Có thể chép thư mục `skills/` cạnh bộ superpowers đang cài trên máy để Antigravity nạp như skill. Luôn dán prompt hợp đồng đầy đủ khi giao việc. |
| **AionUI** | Các CLI gắn vào AionUI (Codex, Gemini, Claude) đọc file quy tắc của chính chúng như trên. aionrs: dùng nội dung `AGENTS.md` làm system rules của agent. Hook chặn git chỉ có ở Claude Code; verify-kit có guard cho Codex (cần trust một lần qua `/hooks`). |
| **Claude Code / Cowork** | Cài file `danh-method.plugin` — có đủ skills, subagent, hook. |

ui-ux-pro-max cho Codex/Antigravity: `npm install -g ui-ux-pro-max-cli` rồi `uipro init --ai codex` (hoặc `--ai antigravity`) — chỉ sau khi người dùng đồng ý.

Verify-kit cài cho mọi agent: xem `skills/execute-tasks/assets/verify-kit/README.md`.
