# Hướng dẫn xin phép & cài đặt thư viện UI (Gate G0)

Tài liệu hướng dẫn xử lý khi bước kiểm tra `check-ui-packages.mjs` trả về `ready: false`.

---

## 1. Vì sao phải có cổng kiểm tra (Hard Gate)?

Trong Danh Method, **Gate G0 (Duyệt Design Tokens)** là bước chốt nền móng trực quan trước khi dựng bất kỳ prototype hay viết mã tính năng nào. 

Trước đây, khi chưa cài đặt thư viện UI thật, agent đã tự sinh ra trang HTML thủ công bằng các thẻ HTML thông thường với CSS tự chế. Điều này dẫn tới các rủi ro nghiêm trọng:
- **Tạo ảo giác sai lệch**: Trang xem thử trông có vẻ đẹp, nhưng khi đưa token vào component thật của shadcn/ui hoặc HeroUI thì sai lệch về padding, line-height, focus ring, states (hover/active/disabled), biến thể (variants) và tương thích Dark mode.
- **Không đáng tin cậy**: Người phụ trách sản phẩm duyệt một giao diện không đại diện cho mã nguồn thật sẽ chạy trên sản phẩm.

**Quy tắc cứng**: Không có thư viện UI thật được cài đặt và cấu hình hoàn chỉnh trong repo sản phẩm → **Không sinh token và không dựng trang duyệt token**.

---

## 2. Cách xin phép người dùng & Cổng chọn UI (Protocol)

Quy trình gồm 3 bước:

### Bước 1: Khảo sát hiện trạng (Discovery Scan)
Chạy lệnh kiểm tra khảo sát không gắn cờ `--ui`:
```bash
node <plugin danh-method>/skills/design-tokens/scripts/check-ui-packages.mjs --root <thư-mục-dự-án> --json
```

### Bước 2: Cổng chọn UI bắt buộc (Selection Gate — Chỉ chọn 1 trong 2)
**Quy tắc cứng:** Mỗi dự án **chỉ dùng đúng 1 trong 2** thư viện UI (`shadcn/ui` hoặc `HeroUI`), **không được chọn cả hai**.
Nếu `process/project.md` hoặc prompt chưa xác định rõ thư viện UI mục tiêu, agent **PHẢI DỪNG LẠI** và hỏi người dùng lựa chọn:
> **Xác định thư viện UI cho dự án (Chỉ chọn 1 trong 2)**
> Dự án cần chỉ định 1 thư viện UI duy nhất để dựng trang Token Playground (Gate G0) từ component thực tế:
> 
> Các lựa chọn:
> 1. **shadcn/ui (`--ui shadcn`) (Khuyên dùng)** — Phù hợp nhất với Tailwind CSS v3/v4, React Server Components và kiến trúc copy-paste linh hoạt.
> 2. **HeroUI (`--ui heroui`)** — Hệ thống React Aria compound components hoàn chỉnh (HeroUI v3) với hệ token `--accent`/`--surface`/`--field-*`.
> 3. **Dừng lại (Báo cáo blocker)** — Không cài đặt, dừng quy trình token tại đây để chờ quyết định kỹ thuật từ chủ dự án.

### Bước 3: Kiểm tra nghiêm ngặt (Strict Check)
Sau khi người dùng chọn mục tiêu (`<chosen>` = `shadcn` hoặc `heroui`):
```bash
node <plugin danh-method>/skills/design-tokens/scripts/check-ui-packages.mjs --root <thư-mục-dự-án> --ui <shadcn|heroui> --json
```

### Hậu quả của từng lựa chọn & Xử lý khi thiếu gói
- **Nếu `ready: true`**: Quy trình tiếp tục và truyền cờ `--ui <shadcn|heroui>` sang `scaffold-playground.mjs`.
- **Nếu `ready: false`**:
  - Agent thông báo danh sách chính xác các gói còn thiếu cho target đã chọn (`missing`).
  - Yêu cầu chủ dự án xác nhận đúng thư mục repo sản phẩm và tạo một nhánh git riêng (ví dụ `chore/install-ui-packages`). Tuyệt đối không cài trực tiếp lên nhánh chính khi chưa có kiểm soát.
  - Agent thực thi các lệnh cài đặt chính thức bên dưới.
  - Cài đặt xong, agent chạy lại strict check `check-ui-packages.mjs --root <repo> --ui <shadcn|heroui>`. Nếu `ready: true`, quy trình token mới được tiếp tục.
  - **Tuyệt đối không tự ý âm thầm đổi sang bộ kia** (ví dụ người dùng chọn `heroui` nhưng dự án chỉ có `shadcn` thì vẫn phải báo `ready: false`).
- **Nếu chọn 3 (Dừng lại)**:
  - Báo cáo rõ ràng trạng thái: *Quy trình duyệt token (Gate G0) bị khoá vì chưa có thư viện UI.*
  - **Tuyệt đối không tự ý fallback** về trang HTML thủ công (`render-token-page.mjs`) để thay thế bằng chứng duyệt G0.

---

## 3. Lệnh cài đặt chính thức (Verified Official Commands)

### A. shadcn/ui
Nguồn tài liệu chính thức:
- Hướng dẫn cài đặt Next.js: https://ui.shadcn.com/docs/installation/next
- Hướng dẫn cài đặt Vite: https://ui.shadcn.com/docs/installation/vite
- CLI Reference: https://ui.shadcn.com/docs/cli

#### Bước 1: Khởi tạo shadcn/ui trong dự án
```bash
# Với npm
npx shadcn@latest init

# Với pnpm
pnpm dlx shadcn@latest init

# Với bun
bunx --bun shadcn@latest init
```
*(Nếu là dự án mới chưa có cấu hình: thêm `-t next` hoặc `-t vite` tương ứng).*

#### Bước 2: Cài đặt danh sách component bắt buộc cho Token Playground
Token Playground cần hiển thị đầy đủ các vai trò UI trong ngữ cảnh token thực tế, bao gồm:
```bash
# Chạy lệnh add với danh sách component đầy đủ
npx shadcn@latest add button card input select switch checkbox badge tabs dialog dropdown-menu slider label separator tooltip avatar table
```
*(Với pnpm: thay `npx shadcn@latest` bằng `pnpm dlx shadcn@latest`).*

---

### B. HeroUI
Nguồn tài liệu chính thức:
- Hướng dẫn cài đặt chung: https://www.heroui.com/docs/guide/installation

#### Trường hợp 1: Tạo dự án mới qua HeroUI CLI
```bash
# Next.js App Router
npx heroui-cli@latest init -t app

# Vite
npx heroui-cli@latest init -t vite
```

#### Trường hợp 2: Cài đặt vào dự án hiện có (HeroUI v2 / React)
1. Cài đặt package phụ thuộc:
```bash
npm install @heroui/react framer-motion
# Hoặc với pnpm:
# pnpm add @heroui/react framer-motion
```
*(Lưu ý với pnpm: nếu cần, thêm `public-hoist-pattern[]=*@heroui/*` vào `.npmrc` rồi chạy lại `pnpm install`).*

2. Cấu hình Tailwind:
- **Tailwind CSS v3**: Thêm plugin vào `tailwind.config.js`:
  ```js
  const { heroui } = require("@heroui/react");
  module.exports = {
    content: [
      "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    plugins: [heroui()]
  };
  ```
- **Tailwind CSS v4**: Tạo file cấu hình `hero.ts`:
  ```ts
  import { heroui } from "@heroui/react";
  export default heroui();
  ```
  Và khai báo trong file CSS chính (ví dụ `globals.css`):
  ```css
  @import "tailwindcss";
  @plugin "./hero.ts";
  @source "../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}";
  ```
  *(Với HeroUI v3 CSS-first trên Tailwind v4: cài `@heroui/styles @heroui/react` và khai báo `@import "@heroui/styles";` ngay sau `@import "tailwindcss";`).*

---

## 4. Kiểm tra lại sau khi cài đặt

Sau khi hoàn tất lệnh cài đặt, luôn chạy lệnh kiểm tra để xác nhận cổng G0 đã mở:
```bash
node <plugin danh-method>/skills/design-tokens/scripts/check-ui-packages.mjs --root <đường-dẫn-repo-sản-phẩm> --ui <chosen> --json
```
Chỉ khi kết quả trả về `"ready": true`, agent mới chuyển sang bước sinh token và dựng Token Playground.
