# Trang Playground duyệt Design Token (Gate G0)

Tài liệu hướng dẫn thiết lập, vận hành và quy trình duyệt token thông qua trang tương tác `TokenPlayground` (lấy cảm hứng từ giao diện `https://ui.shadcn.com/create`).

---

## 1. Mục đích và Ý nghĩa

Trước đây, trang xem trước token tĩnh (`render-token-page.mjs`) chỉ hiển thị bảng màu và markup giả lập, thiếu sự kết nối trực tiếp với component mã nguồn thật của dự án. 

**Token Playground** giải quyết triệt để vấn đề này:
- **Sidebar điều khiển bên trái:** Gom nhóm trực quan các thông số thiết kế:
  - Chế độ giao diện (Light / Dark / Song song Side-by-side).
  - Màu nền tảng Neutral (60%): `--background`, `--foreground`, bề mặt card/popover.
  - Màu chủ đạo Primary (10%): Bảng màu kèm **xem trước 5 sắc độ** theo chuẩn Danh Method (100 subtle, 300 disabled, 500 base, 600 hover, 700 active).
  - Màu ngữ nghĩa Semantic: `--secondary` (30%), `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`.
  - Bo góc Radius: Thanh trượt (0px–24px), các mức preset (0, sm, md, lg, xl) và bo góc theo vai (`--radius-card`, `--radius-tile`, `--radius-popover`, `--radius-item`).
  - Kiểu chữ Font family: Thang font `--font-sans`, `--font-heading`, `--font-mono`.
  - Khoảng cách & Mật độ: `--spacing` hoặc mật độ giao diện.
- **Canvas xem trước bên phải:** Render **COMPONENT THẬT 100%**:
  - Không dùng markup giả lập hay component vẽ tay.
  - Tích hợp đúng **1 thư viện UI duy nhất** mà dự án đã chọn: **shadcn/ui** (`--ui shadcn`, từ alias `@/components/ui/*`) **HOẶC** **HeroUI** (`--ui heroui`, compound components từ `@heroui/react`), không dùng cả hai.
  - Bao gồm: Bộ card Dashboard KPI, form hoàn chỉnh (input, select, checkbox, switch, slider), các biến thể và kích cỡ button, badges/chips, tabs, bảng dữ liệu (table), dialog và dropdown triggers, alerts thông báo, thang kiểu chữ và bảng đo độ tương phản WCAG 2.1 AA trực tiếp.
- **Cập nhật động (Live DOM Update):** Thay đổi giá trị trên control sẽ áp dụng ngay tức thì vào biến CSS `:root` và `.dark`. Tuyệt đối **không phát minh token mới** nằm ngoài danh mục CSS đã khai báo.
- **Thanh công cụ Toolbar:**
  - Khôi phục về snapshot ban đầu.
  - Xuất CSS (`:root` và `.dark`).
  - Xuất JSON và Markdown đề xuất tuân thủ hợp đồng `schemaVersion: 1` và băm provenance nguồn (`source.id` và `source.hashes`).
  - Nhập JSON/Markdown để xem lại hoặc kiểm chứng trước khi nạp lại mã nguồn.

---

## 2. Tiền điều kiện (Prerequisites)

Dự án phải có sẵn thư viện UI thật trước khi scaffold:
1. Chạy lệnh kiểm tra tính sẵn sàng:
   ```bash
   node skills/design-tokens/scripts/check-ui-packages.mjs --root <thư-mục-dự-án>
   ```
2. Dự án được xác nhận `ready === true` khi:
   - Đã cài đặt **shadcn/ui** (có `components.json`, các file component trong `components/ui`, các thư viện hỗ trợ như `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/*` hoặc `radix-ui`), **HOẶC**
   - Đã cài đặt **HeroUI** (`@heroui/react`, `framer-motion` và đã cấu hình trong Tailwind CSS).

Nếu script báo thiếu thư viện, cần xin phép người dùng và thực hiện cài đặt trước; script scaffold sẽ từ chối chạy và không ghi file trên dự án chưa sẵn sàng.

---

## 3. Khởi tạo Playground (Scaffold)

Sử dụng script `scaffold-playground.mjs`:

```bash
node skills/design-tokens/scripts/scaffold-playground.mjs \
  --root <thư-mục-dự-án> \
  --ui <shadcn|heroui> \
  --css <đường-dẫn-file-token.css> \
  [--css <đường-dẫn-file-token-khác.css>] \
  [--out-dir design-system/playground] \
  [--force]
```

### Các đối số:
- `--root <path>`: Thư mục gốc của dự án sản phẩm (mặc định: thư mục hiện tại).
- `--ui <shadcn|heroui>`: Bắt buộc chỉ chọn 1 trong 2 thư viện UI (`shadcn` hoặc `heroui`, không chọn cả hai).
- `--css <path>`: Đường dẫn file CSS chứa khai báo token (có thể lặp lại nhiều lần theo thứ tự import).
- `--out-dir <dir>`: Thư mục lưu mã nguồn Playground bên trong dự án (mặc định: `design-system/playground`).
- `--dry`: Chạy thử, in báo cáo kiểm tra và không ghi file.
- `--force`: Cho phép ghi đè nếu thư mục đích đã tồn tại file.

### Quy trình tự động:
1. Kiểm tra tính sẵn sàng thông qua `check-ui-packages.mjs`.
2. Trích xuất toàn bộ biến CSS custom properties (`--*`) trong `:root`, `html`, `@theme`, `@theme inline` và `.dark`.
3. Băm mã SHA-256 của các file CSS và component thật đã cài đặt để tạo provenance.
4. Sinh file `manifest.json` và sao chép cấu trúc mã nguồn React + TypeScript vào thư mục `--out-dir`.

---

## 4. Chạy và Build với Tooling của Dự án

Playground tận dụng trực tiếp build tool đã có trong dự án, không cài đặt thêm package ngoài:

### Đối với Vite:
- **Chạy dev độc lập:**
  ```bash
  npx vite design-system/playground
  ```
  *Hoặc import component vào `src/App.tsx`:*
  ```tsx
  import { TokenPlayground } from './design-system/playground/TokenPlayground';

  export default function App() {
    return <TokenPlayground />;
  }
  ```
  rồi chạy `npm run dev`.
- **Build thư mục tĩnh:**
  ```bash
  npx vite build --base=./ design-system/playground --outDir dist-playground
  ```

### Đối với Next.js (App Router):
- **Tạo route dev chuyên dụng:**
  Tạo file `app/(design-system)/token-playground/page.tsx`:
  ```tsx
  import { TokenPlayground } from '@/design-system/playground/TokenPlayground';

  export default function Page() {
    return <TokenPlayground />;
  }
  ```
- **Chạy dev server:** `npx next dev` và truy cập `/token-playground`.
- **Xuất / Build:** `npx next build`.

---

## 5. Chụp ảnh Review (Gate G0)

Người điều phối (coordinator) chịu trách nhiệm chụp ảnh màn hình nghiệm thu theo tiêu chuẩn:
```bash
node skills/design-prototype/scripts/capture-screens.mjs \
  <đường-dẫn-hoặc-url-playground> \
  <thư-mục-lưu-ảnh> \
  --states "tokens:" \
  --viewports 1440,768,390 \
  --themes light,dark
```
- Playground tự động đọc tham số URL `?theme=dark` hoặc `?theme=light` để hiển thị đúng chế độ khi chụp.
- Script chụp ảnh sẽ kiểm tra hiện tượng tràn ngang (`overflow`) trên các kích thước màn hình 1440px (Desktop), 768px (Tablet) và 390px (Mobile).

---

## 6. Quy trình duyệt và nạp lại Design System

1. **Điều chỉnh trên giao diện:** Người phụ trách sản phẩm thao tác trên thanh trượt, bảng màu, kiểm tra tỷ lệ tương phản WCAG AA hiển thị trực tiếp.
2. **Xuất đề xuất (Proposal):**
   - Bấm **Xuất JSON** (file `token-parameters.json`) hoặc **Xuất Markdown** (file `token-parameters.md`).
   - File xuất chứa đầy đủ chữ ký hash nguồn và danh mục token đề xuất.
3. **Ghi nhật ký TOKENS-NOTES:**
   - Lưu trữ bản xuất vào `design-system/TOKENS-NOTES.md` ở repo spec.
   - Ghi rõ ngày duyệt, người duyệt và lý do điều chỉnh.
4. **Nạp lại DS (Gate G0 chốt):**
   - Tạo task riêng giao cho lập trình viên cập nhật lại mã nguồn token (`globals.css` / `tokens.css`).
   - Phân bổ theo 3 lớp chuẩn: Primitive → Semantic → Component.
   - Tuyệt đối không ghi đè cẩu thả hay phát sinh token mồ côi.
