# Mẫu nghiệm thu — `features/<feature>/ACCEPTANCE-<yyyy-mm-dd>.md`

```markdown
# <Feature> · Nghiệm thu trình duyệt Stage 6 (<dd/mm/yyyy>)

Nhánh `<…>`, HEAD `<…>`, PR #<n> (draft). DB bản sao `<tên>_accept_<ngày>`. Admin `http://127.0.0.1:<cổng>`, khách `…:<cổng>`.
Kết luận: **<Đã nghiệm thu | Chưa nghiệm thu — còn n mục>**.

## 1. Tiêu chí chấp nhận
| AC | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|
| AC01 | Đạt | `acceptance-<ngày>/ac01-*.png` | |
| AC02 | Chưa đạt | … | lỗi #2 |
| AC03 | Không kiểm được | — | vì <thiếu dữ liệu / cần quyền> |

## 2. Đường vào
| E | Bước thực tế | Số bước | Đạt |

## 3. Task
| T | Bước thực tế | Số bước | Hành động chính rõ | Đạt |

## 4. Responsive (`scrollWidth === innerWidth`)
| Màn | 1440 L/D | 768 L/D | 390 L/D |

## 5. Tương phản AA (≥ 4.5:1)
| Phần tử | Light | Dark |

## 6. Lỗi và nhận xét
| # | Mức | Issue | Nguyên nhân (nếu biết) | Kết quả | Giải pháp đề xuất |

## 7. Chưa kiểm / để lại
## 8. Dọn dẹp
- Đã tắt PID <…>, <…>. DB bản sao: giữ / xoá.

## 9. Lượt n · sửa và kiểm lại (<ngày>)
| Lỗi | Commit sửa | Kiểm lại | Kết quả |
```
