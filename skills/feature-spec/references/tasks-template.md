# Mẫu TASKS — `features/<feature>/TASKS.md`

`TASKS.md` + prompt hợp đồng **chính là plan**. Không cần chạy skill writing-plans riêng.

```markdown
# <Feature> · Tasks

Spec: PRD.md, USER_FLOW.md, GUIDANCE.md (đọc cả ba trước khi làm).
Nhánh: `<feature>` (cắt từ `<main | nhánh phụ thuộc đã được chốt>`). Worktree: `<đường dẫn>`.

## Gate
| Gate | Nội dung | Trạng thái |
|---|---|---|
| G1 | Preview HTML được duyệt | chờ / mở <ngày> |
| G2 | Q1–Qn chốt (hoặc được uỷ quyền rõ dùng mặc định) | |
| G3 | Owner review sau Stage 6 + --pr PASS + bằng chứng AC + hết blocker | |

## Logic
| Task | Việc | Xong khi |
|---|---|---|
| XL-00 | Khảo sát: callers, dữ liệu hiện có, rủi ro migration — **không sửa code** | Chỉ ghi tên đã mở đọc + commit vào HANDOFF; điều phối đối chiếu baseline trước 01 |
| XL-01 | Schema + migration + repository | AC… có test; migration chạy trên DB bản sao |
| XL-0n | View model | AC… có test trần truy vấn |
| XL-09 | Dữ liệu demo ngoài repo | Dump mới có ngày trong tên; không ghi đè DB demo khi chưa hỏi |

## UI (chỉ mở khi G1 xong)
| Task | Việc | Xong khi |
|---|---|---|
| XU-01 | Shell + list | Khớp preview ở 1440/768/390, light/dark |

## Việc kéo theo
- <đổi route cũ → redirect, cập nhật tài liệu feature khác…>

## Global constraints
- <giới hạn cứng: số cửa sổ, polling, kích thước, nhãn UI đặc biệt>

## Review focus
1. <chỗ dễ sai nhất, reviewer phải soi>
```

Quy tắc:
- Task đầu tiên luôn là **khảo sát chỉ đọc** (XX-00).
- Mỗi task một hoặc vài commit nhỏ; "xong khi" phải gắn AC hoặc bằng chứng cụ thể.
- Tách Logic và UI để chạy song song: logic chạy ngay sau khi PRD duyệt; UI chờ preview duyệt.
- Tick `[x]` kèm 1 dòng kết quả có ngày khi xong.

Bổ sung A6.1/D7: hợp đồng type/interface commit trước chia nhánh; UI sau G1 và `<TASK> pushed <hash>` thì fetch+merge trước mỗi task; không đợi hết logic. Phụ thuộc migration/nhánh phải được owner chốt trước thi hành, khác với vòng G3 cuối.
