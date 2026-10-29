# Mẫu DESIGN-NOTES — `features/<feature>/DESIGN-NOTES.md`

```markdown
# <Feature> · Prototype design review

Prototype: `prototype/<feature>.html` (mở double-click). Ảnh: `review-screens/`.
Vòng hiện tại: <n> · <ngày>.
Renderer component thật: <file/lệnh, package/export/variant>; provenance/hash nguồn: <file>.
Tham số token: <JSON/MD, snapshot, allowlist light/dark, cách export/import/reset>.
Người điều phối chạy renderer/chụp ảnh và viết REVIEW.md Rn; agent design ghi “Ảnh: 0 — điều phối chụp”.

## Quyết định của người phụ trách sản phẩm · <ngày>
- <đóng Q-x: …>
- Token proposal được duyệt: <file MD/JSON @ hash>; task nạp lại DS và nơi dùng chung cần kiểm: <…>.

## Vòng n · đã sửa gì
| Mục | Trước | Sau |
|---|---|---|

## Trạng thái bằng chứng
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Ảnh 1440/768/390 × light/dark | Đủ / Thiếu | |
| Tràn ngang | Không / Có ở … | |
| AA | Đạt / Chưa kiểm | |

## Link trạng thái
- `?role=…&state=…` — <mô tả>

## Phạm vi các màn
| Mã | Có trong prototype | Ghi chú |

## Bảng kiểm Stage 5 · đường vào
| E | Từ | Bước thực tế | Số bước | Đạt |

## Bảng kiểm Stage 5 · task
| T | Bắt đầu | Bước thực tế | Số bước | Hành động chính ở mỗi điểm quyết định | Đạt |

## Ghi chú theo quy tắc bắt buộc
- 6×6: …  · Không viền/không custom: …  · Quyền: …  · Bề mặt khách hàng không lộ: …

## Component dùng lại và component mới
| Component | Lấy từ | Mới? | Lý do nếu mới |

## Giả định đã chọn để prototype hoàn chỉnh (người dùng duyệt sau)
| Mã | Giả định | Lý do chọn |

## Câu hỏi cho người phụ trách sản phẩm
| Mã | Câu hỏi (nêu luồng + vấn đề) | Lựa chọn | Đề xuất |

## Đề xuất ngoài scope (chỉ hiện khi bật Proposals)
| Đề xuất | Vì sao | Chi phí ước |

## Giới hạn phải review
- <chỗ prototype không mô phỏng được, ví dụ realtime, dữ liệu lớn>
```
