# Khung repo spec

## README.md

```markdown
# <Sản phẩm> · Tài liệu sản phẩm

Bản gốc duy nhất của tài liệu sản phẩm (PRD, user flow, task, nghiệm thu, quy trình, prompt). Người phụ trách sản phẩm làm chủ, commit và push thẳng `main`.

- Tài liệu **kỹ thuật** (cách chạy, DB, log, HANDOFF theo nhánh) nằm ở repo code: `<repo-code>/docs/`.
- Bản chia sẻ (claude.ai Docs, PDF) chỉ để đọc; sửa ở đây rồi xuất lại.

## Quy tắc
1. Mỗi feature một thư mục trong `features/`, tên file cố định: `PRD.md`, `USER_FLOW.md`, `GUIDANCE.md`, `TASKS.md`, `REVIEW.md`, `DESIGN-NOTES.md`, `ACCEPTANCE-<ngày>.md`, `prototype/`, `review-screens/`. Tên thư mục trùng tên feature/nhánh bên code.
2. Sửa tài liệu nào thì thêm 1 dòng vào "Chưa release" của `CHANGELOG.md`, bằng lời người đọc hiểu.
3. Repo code gắn tag release thì repo này gắn cùng tag; "Chưa release" đổi thành `## <phiên bản> · <ngày>`.
4. PR bên code ghi "Theo tài liệu: <repo-spec>, `<file>`, commit `<mã>`".
5. `sources/` chỉ đọc; bản mới thì thêm file mới có ngày trong tên.
6. Giả định chưa được duyệt ghi rõ là *giả định*.

## Mục lục
| File | Là gì | Trạng thái |
|---|---|---|
| | | |
```

Mục lục: dòng mới nhất ở trên; cột Trạng thái ghi ngày + tình trạng ("chờ duyệt Q1–Q6", "chờ chạy", "đã nghiệm thu").

## CHANGELOG.md

```markdown
# Changelog tài liệu <Sản phẩm>

Mỗi lần sửa tài liệu thêm 1 dòng vào "Chưa release". Dòng mới nhất ở trên.

## Chưa release

- <dd/mm/yyyy>: <Feature> — <đổi gì, bằng lời người đọc hiểu>.
```

## Thư mục design-system

```
design-system/
├── tokens.html         # trang token (render-token-page.mjs), mở double-click
├── TOKENS-NOTES.md     # phiên bản, ai duyệt, cặp trượt AA, thay đổi so với bản trước
└── review-screens/     # tokens-<viewport>-<theme>.png
```

## Thư mục feature

```
features/<feature>/
├── README.md          # 5 dòng: là gì, trạng thái, file nào đọc trước
├── PRD.md             # quyết định D/W.., quyền, vòng đời, AC, Q chờ duyệt
├── USER_FLOW.md       # entry E1.., task T1.., màn S1.., drawer D1.., số bước
├── GUIDANCE.md        # bản đồ code, mô hình dữ liệu gợi ý, bẫy
├── TASKS.md           # mã task, "xong khi", gate
├── DESIGN-NOTES.md    # bảng kiểm Stage 5 của prototype, câu hỏi, đề xuất ngoài scope
├── REVIEW.md          # các vòng review (RG0/RG1…), điểm cần duyệt
├── ACCEPTANCE-<ngày>.md
├── prototype/         # <feature>.html/.css/.js — mở double-click
├── review-screens/    # PNG 1440/768/390 × light/dark; acceptance-<ngày>/
└── log/
```

## Mã định danh (giữ nhất quán toàn repo)

| Loại | Dạng | Ví dụ |
|---|---|---|
| Quyết định đã chốt | `<chữ đầu feature>NN` | W01, D17 |
| Câu hỏi chờ duyệt | `Q1…Qn` | Q3 — giả định đang dùng: … |
| Tiêu chí nghiệm thu | `AC01…` | AC07 |
| Entry route / Task | `E1…`, `T1…` | E3 đạt 2 bước |
| Màn / Drawer / Mobile | `S1…`, `D1…`, `M1…` | |
| Task thi hành | `<mã feature>-NN` hoặc `<mã><loại>NN` | AW2-03, WL-04, WU-02 |
| Gate | `G1/G2/G3`, `RG0/RG1` | |
| Lỗi review | `lỗi 1…n` hoặc `S1…Sn` theo vòng | |
