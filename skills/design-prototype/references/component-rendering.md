# Component thật và vòng chỉnh token (D1/D2 chốt 29/10/2026)

## Đầu ra bắt buộc

Prototype phải render component thật của design system bằng runtime/compiler đã có trong project. HTML dựng tay chỉ để mô phỏng component không đáp ứng D2. Agent design chuẩn bị source renderer và bundle ở repo spec, đọc repo code; người điều phối chạy renderer, kiểm, chụp ảnh và viết REVIEW.md theo vòng.

Mỗi project có renderer phù hợp stack (React/Vue/web components…). Ghi đường dẫn package nguồn, export/slot/variant, dependency version, CSS input và source hashes. Không cài CLI/dependency mới nếu chưa được phép. Nếu không render được, báo blocker có bằng chứng; không thay âm thầm bằng markup mô phỏng.

1. Mở source component và token/CSS thật. Chọn component theo PRD, không chọn chỉ vì giống hình.
2. Render bằng component export thật. React có thể dùng ReactDOMServer cho xuất markup; **SSR tĩnh không giữ event handler và không chứng minh tương tác**. Muốn đổi state/mở drawer dùng client bundle từ component thật hoặc render sẵn các state bằng component thật và ghi rõ giới hạn. Không thay component bằng hàm mock. Portal phải có chiến lược render/bundle được ghi lại, không bỏ trống rồi báo đã đủ state.
3. Compile CSS bằng tooling project từ đúng component classes, tokens và theme; không dùng CSS source chứa `@apply`/utility chưa compile như thể đã đủ. Bundle local để mở double-click, không phụ thuộc dev server app. Source repository chỉ đọc trong việc prototype.
4. Sinh provenance: hash SHA-256 các source component phụ thuộc, token/CSS, renderer và bundle; ghi HEAD/package versions. Nguồn đổi → render lại, không sửa hash chỉ để bỏ qua kiểm freshness.
5. Bảng chỉnh thông số nằm ngoài canvas sản phẩm, mặc định gập: allowlist token theo vai, light/dark, export JSON, export Markdown, import lại và reset snapshot. Không phát minh token để lách DS; thiếu token phải đề xuất duyệt.

## Helper gắn bảng thông số

`scripts/attach-token-editor.mjs` chỉ gắn editor vào **HTML đã render thật**. Helper kiểm source hashes trước gắn, không thực hiện render và không thể tự chứng minh renderer đã dùng component thật. Điều phối phải đối chiếu renderer/source/provenance.

```text
node <plugin>/skills/design-prototype/scripts/attach-token-editor.mjs \
  --html <spec>/features/<f>/prototype/rendered.html \
  --tokens <spec>/features/<f>/prototype/token-parameters.json \
  --repo-root <code-repo> \
  --out <spec>/features/<f>/prototype/<f>.html
```

`rendered.html` phải có head/body và CSS/bundle cần thiết. Out khác file renderer gốc. Helper dùng Node, không dependency. Input JSON theo hợp đồng dưới; hash phải lấy từ file thật, không dùng placeholder khi chạy:

```json
{
  "schemaVersion": 1,
  "source": {
    "id": "project-ds@<HEAD>",
    "hashes": {
      "packages/ui/src/components/button.tsx": "<sha256>",
      "packages/ui/src/styles/tokens.css": "<sha256>"
    }
  },
  "tokens": {
    "light": { "--primary": "#245544", "--radius-card": "24px" },
    "dark": { "--primary": "#91cbb4", "--radius-card": "24px" }
  }
}
```

Tên token chỉ là ví dụ: map sang biến thật đã đọc, kể cả tên radius của DS khác. JSON xuất giữ nguyên schema/source/token keys; Markdown có cùng JSON trong fenced block. Import kiểm source và tập token của snapshot; khác nguồn/thiếu token/thêm token/giá trị có tải ngoài hoặc chèn CSS bị từ chối. Import vào preview đổi thông số tại chỗ, không tự ghi file nguồn. Helper chỉ chỉnh CSS custom properties; props/layout cần controls riêng của renderer, không dùng token thay quyết định nghiệp vụ.

## Nạp lại DS sau duyệt

1. Điều phối lưu bản JSON/MD đã xuất ở repo spec, ghi người duyệt, ngày, quyết định và diff so snapshot theo từng theme. File xuất vẫn là đề xuất cho đến khi được duyệt.
2. Giao task cập nhật token riêng trong repo code đúng phạm vi được duyệt. Agent đọc JSON hoặc JSON block trong Markdown, so source hashes với code hiện tại; nguồn đổi thì render/đối chiếu lại trước ghi, không ghi đè bản mới.
3. Map biến theo ba lớp primitive → semantic → component hiện hành. Chỉ sửa token đã duyệt ở nguồn duy nhất, không tạo duplicate hoặc rải class vào caller. Dùng compiler/token generator project nếu có; không ghi đè toàn file CSS bằng một snippet.
4. Render lại token page G0 và preview component thật, đo AA/light/dark, radius lồng lớp, breakpoint và caller dùng chung. Test/verify theo tier và ngân sách; ghi quyết định vào TOKENS-NOTES/PRD/REVIEW, commit và báo bằng chứng.

Ảnh và REVIEW do điều phối tạo. Agent design báo “Ảnh: 0 — điều phối chụp”; không xin ngoại lệ Playwright để chụp thay. REVIEW dùng `review-templates.md` B6, ghi R1…Rn và đề xuất chốt trước G1.

Tham chiếu API: [React renderToStaticMarkup](https://react.dev/reference/react-dom/server/renderToStaticMarkup) về giới hạn SSR; [CSS setProperty](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty) cho custom properties; [Blob URL](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob) cho export cục bộ.
