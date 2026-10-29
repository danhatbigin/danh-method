# Mẫu Đề xuất Subagent & Model Tiết Kiệm (Spawn Proposal Template)

Trước khi gọi lệnh `invoke_subagent` để mở bất kỳ subagent nào, người điều phối **BẮT BUỘC** phải in bảng đề xuất dưới đây và chờ người dùng xác nhận hoặc chọn model khác.

```markdown
### 📋 Đề xuất phân công Subagent & Chọn Model

- **Giai đoạn**: [Stage <Mã>] <Tên giai đoạn>
- **Feature**: `<tên-feature>`
- **Hiện trạng**: <Mô tả ngắn gọn trạng thái hiện tại từ detect-stage>

| # | Subagent đề xuất | Tác vụ hẹp | Vùng sở hữu (Glob) | Model đề xuất | Lý do chọn model |
|---|---|---|---|---|---|
| 1 | `<tên-subagent>` | <Mô tả việc cần làm> | `<glob-path>` | `flash` (hoặc `haiku`/`mini`) | <Lý do tiết kiệm quota/chi phí, task đã có mẫu> |
| 2 | `<tên-subagent>` | <Mô tả việc cần làm> | `<glob-path>` | `flash` (hoặc `haiku`/`mini`) | <Lý do tiết kiệm quota/chi phí, task đã có mẫu> |

**Dự kiến kết quả bàn giao:**
- Subagent 1: Commit `<nhánh>` với bằng chứng test / preview HTML.
- Subagent 2: Commit `<nhánh>` với test coverage / data schema.

---
👉 **Anh/bạn muốn tiến hành thế nào?**
- **[1] Đồng ý**: Chạy theo đề xuất trên với model tiết kiệm (`flash` / `haiku` / `mini`).
- **[2] Đổi model**: Nâng subagent nào lên model mạnh (`pro` / `sonnet` / `inherit`).
- **[3] Chạy inline**: Không mở subagent, người điều phối làm trực tiếp trong phiên này.
```

---

## Nguyên tắc chọn Model cho Subagent

1. **Mặc định là Model tiết kiệm (`flash` / `haiku` / `mini`)**:
   - Tác vụ subagent trong Danh Method luôn là tác vụ hẹp, có hợp đồng input/output chặt chẽ và glob sở hữu cô lập.
   - Sử dụng model tiết kiệm giúp bảo toàn quota, giảm chi phí từ 5x–10x và tốc độ phản hồi nhanh hơn.
   - Thích hợp cho: `design-prototyper` (lắp ghép component theo template), `logic-implementer` (viết CRUD/schema/service theo spec), `code-reviewer` (đối chiếu checklist diff), `acceptance-tester` (chạy script E2E/test checklist).

2. **Khi nào đề xuất hoặc người dùng nâng lên Model mạnh (`pro` / `sonnet` / `inherit`)**:
   - Khi task đòi hỏi giải thuật phức tạp hoặc tái cấu trúc kiến trúc đa tầng.
   - Khi đã thử bằng model tiết kiệm mà subagent gặp lỗi logic lặp lại hoặc không hiểu prompt contract.
   - Người điều phối luôn giữ vai trò model mạnh để kiểm tra, tổng hợp và review chéo.

3. **Chỉ spawn khi người dùng đã duyệt**:
   - Tuyệt đối không âm thầm spawn subagent khi chưa có sự xác nhận của người dùng về model và danh sách task.
