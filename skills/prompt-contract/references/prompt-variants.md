# Các biến thể prompt

Mọi biến thể đều có 12 thành phần trong SKILL.md; dưới đây là phần **khác nhau**. Mẫu gốc: các prompt design/logic/ui/acceptance của dự án gốc (10/2026).

## design

- Vai: agent **design**; chuẩn bị prototype render component thật + token controls và export/import MD/JSON để duyệt; không HTML mô phỏng DS. **Không** viết code app, **không** sửa repo code, **không** commit/push.
- Đọc trước: PRD + USER_FLOW (nguồn chính) → design-workflow Stage 3–5 → **feature mẫu đã duyệt + ảnh code thật** → token thật (chỉ đọc) → màn hiện tại.
- Sản phẩm giao: theo skill `design-prototype` §3 (renderer component thật + provenance/source hashes + token parameters MD/JSON + dev bar, đủ S/D/M, test script, DESIGN-NOTES; điều phối render/chụp review-screens và viết REVIEW có E/T, câu hỏi, đề xuất ngoài scope sau công tắc Proposals).
- Quy tắc thiết kế bắt buộc: chép các dòng liên quan từ `design-prototype/references/design-rules.md` + luật riêng project.
- Cách làm: cấu trúc trước → tự kiểm 3 bước → style bằng token. ui-ux-pro-max nếu cần;
- Bàn giao 3–5 dòng: renderer/preview/provenance/parameters, E/T, câu hỏi, đề xuất; “Ảnh: 0 — điều phối chụp”. Điều phối render, chụp và viết REVIEW từng vòng.

## test-translate

- Đầu vào: danh sách ID vN đã đúng người duyệt; đường dẫn SCENARIOS, giao diện công khai, INV liên quan. Không cấp code đang sai để suy expected.
- Trước khi giao: điều phối chạy `spec-lock --unlock <feature> --reason "<IDs>"`.
- Làm: theo `scenario-tests/references/translation-rules.md`; header `@spec`; chứng minh đỏ trước; `spec-guard --update <ID>` từng ID; commit test + manifest.
- Dừng: kịch bản mơ hồ/mâu thuẫn → SI (b)/(c), dịch các ID còn lại.
- Trả về: bảng ID · file · bằng chứng đỏ · `spec-guard:` nguyên văn · SI. Điều phối chạy `spec-lock --lock`.

## slice

- Vai: `slice-implementer`, một lát dọc DB → domain → action → UI. Kèm AGENT-RUN: nhánh/worktree, allowlist, file cấm (`tests/spec/**`, manifest, budget, `.verify/`), INV + bản đồ ghi, test khoá phải xanh, preview G1.
- Mỗi thay đổi ghi dữ liệu: quét mọi writer/caller/job cùng bảng. Test kỹ thuật đỏ khi bỏ bản sửa.
- Không chạy full gate; verify có phạm vi. Bàn giao full SHA, diff/untracked, file đổi so với allowlist, chưa kiểm.
- Lệch test khoá → SI, BLOCKED-SPEC, làm mục khác.

## ui

- Chỉ đường **Nhẹ** (UI thuần, không thêm/đổi đường ghi dữ liệu). Diff lên tier ≥2 hoặc cần action ghi mới → dừng, nâng đường, chuyển `#slice`.

- Vai: agent code làm **giao diện**; logic đã có task cần dùng với dòng `<TASK> pushed <hash>` (nêu nhánh/PR); design đã duyệt. UI fetch+merge nhánh logic trước mỗi task, không đợi toàn bộ logic (A6.1/D7).
- "Quyết định kỹ thuật thuần: tự chọn phương án an toàn, ghi 'giả định' trong HANDOFF, đi tiếp. Dừng theo điều kiện prompt hợp đồng và execute-tasks: PRD chưa trả lời, việc ngoài quyền/phạm vi hoặc lỗi code còn FAIL sau ngân sách; làm tiếp phần độc lập."
- Đọc trước: PRD → USER_FLOW → DESIGN-NOTES (mục Quyết định mới nhất) → prototype đã duyệt (`?scenario=` để mở trạng thái) → **liệt kê rõ chỗ code phải KHÁC prototype theo quyết định mới** → GUIDANCE + view model có sẵn → **code mẫu của feature đã xong** (dùng lại component chung; trùng thì tách thành chung, không copy).
- Phạm vi: bảng WU-xx, mỗi dòng một bề mặt cụ thể.
- Quy tắc: luật UI của project; quyền qua chỗ tập trung + server luôn kiểm; không dữ liệu mẫu; verify theo tier; **không bật dev server** (nghiệm thu là bước riêng).
- Bàn giao ≤ 10 dòng: WU nào xong, **chỗ nào lệch prototype và vì sao**, cần quyết gì.

## acceptance

- Bối cảnh & quyền: worktree, nhánh, HEAD, PR; **DB bản sao** (tạo bằng dump/restore trong container hiện có, không tạo container mới, không đổi cổng DB); cổng app riêng; dữ liệu chỉ sửa trong bản sao; xong phải tắt tiến trình và báo PID.
- Không sửa `.verify/`, không chạy `--pr`, không đổi mã sản phẩm — lỗi chặn thì dừng, ghi, báo người điều phối.
- Việc: liệt kê từng AC thành bước kiểm cụ thể trên trình duyệt (role nào, làm gì, thấy gì); E/T đếm bước; responsive + theme + `scrollWidth === innerWidth`; AA.
- Ảnh vào `review-screens/acceptance-<ngày>/` đặt tên theo AC.
- Báo cáo: ghi **trung thực** (Đạt / Chưa đạt / Không kiểm được và vì sao; không bịa PASS) vào `ACCEPTANCE-<ngày>.md`; báo ≤ 10 dòng.

## fix (theo review PR / audit · đường Nhẹ hoặc lỗi lẻ; Vừa/Đủ dùng fix-by-group)

- Trước đó: viết spec sửa `features/<f>/FIXES-<ngày>.md` với S1…Sn (mỗi mục: lỗi, file:dòng, tái hiện, "xong khi", "không làm"), nhóm Major / Minor; đối chiếu PRD xác nhận nghiệp vụ nào đúng/sai.
- "Bạn làm một mình, tuần tự, từng mục một. Không mở sub-agent." (khi các mục chạm cùng vùng code)
- Bắt đầu: kiểm nhánh và HEAD mong đợi; working tree có thay đổi lạ → dừng và báo.
- Mỗi mục: test chứng minh lỗi (fail trên code hiện tại) → sửa nhỏ nhất → commit `fix(<feature>): S<n> <mô tả> (<mã review>)`.
- Verify sau nhóm Major, rồi sau nhóm Minor; FAIL → phân loại theo bảng FAIL của execute-tasks; lỗi code tính lượt theo ngân sách, vẫn FAIL thì dừng.
- Điểm dừng bắt buộc liệt kê theo từng mục rủi ro (ví dụ migration có xoá dữ liệu, mục buộc đổi nghiệp vụ).
- Kết thúc: push; HANDOFF có HEAD trước/sau, bảng S1–Sn (commit, tên test, kết quả), dòng `verify:`, phần chưa kiểm, giả định chờ duyệt, ghi chú cho owner; báo ≤ 8 dòng.

## fix-by-group

- Đầu vào: ledger (`LEDGER-<ngày>.md`) đã phân loại ENV/FLAKY/PRE-EXISTING/SPEC/TEST/CODE và nhóm G01…Gn theo nguyên nhân gốc, mỗi nhóm có danh sách mọi hàm/job/caller.
- Mỗi nhóm một commit: nguyên nhân → mọi đường liên quan → test đỏ/xanh/mutation (đổi code thực thi) → bằng chứng. Không chạy tổng giữa các nhóm.
- Nhóm SPEC: không sửa; mở/đối chiếu SI. Nhóm ENV: khắc phục môi trường, không tính lượt.
- Xong: bàn giao để điều phối freeze, kiểm theo vùng một lần, review toàn PR lại.

## observe-diagnose

- Chốt HEAD/base, working tree, Spec SHA, kit/config. **Không vá** trong lượt này.
- Một lượt kiểm theo vùng toàn diff + review toàn PR theo bất biến. ENV khắc phục rồi chạy lại.
- Ra: ledger gộp + nhóm nguyên nhân + đề xuất thứ tự sửa + phần chưa kiểm có người nhận. Người chẩn đoán tách người sửa khi có thể; cùng người thì nói rõ giới hạn.

## feature-kickoff

- Điều phối đọc: operator profile, project config, `danh-method` §2, `subagent-orchestration`, `review-report/references/review-convergence.md`, regression checklist.
- Tạo AGENT-RUN trong `features/<f>/`, khai đường. Chỉ nhận feature/kịch bản đã được giao; không tự chọn feature hay coi nghiệp vụ chưa duyệt là đã duyệt.
- Giao Test, Fix, Review vào ngữ cảnh độc lập; không ghi đồng thời một checkout; chỉ điều phối chạy verifier sau freeze. DB qua `verify-runtime` theo cấu hình người dùng.
- Đủ: hai lượt review sạch cùng commit, PR gate, gói review. Không tự bật CI. Đầu ra: thay đổi, bằng chứng, giới hạn, bước tiếp.

## resume / takeover

```
Tiếp quản tính năng <F>. Đọc theo thứ tự:
1. <operator profile>
2. <prompt gốc> (quy tắc cứng, mẫu HANDOFF) — BỎ QUA <bước đã xong>.
3. <HANDOFF> (mục Trạng thái mới nhất, <giờ>)
4. <TASKS mục …>, <PRD mục …>

SNAPSHOT ĐÃ KIỂM LÚC TIẾP QUẢN (mới hơn HANDOFF; vẫn đối chiếu Git/code thật):
- Nhánh <…>, đã push tới <mã>. <Task> đã tick và commit. <Task> đang dở.
- <PR nào đã merge, commit nào CHƯA vào main, HANDOFF đang ghi sai gì>
- File đang dở chưa commit: <liệt kê> — KHÔNG reset/stash/xoá; đây là việc của phiên trước.

Làm tiếp: <đúng việc gì>, rồi <bàn giao gì>.
```

Viết resume chỉ sau khi **tự kiểm git và PR thật** — không chép HANDOFF.

## audit → sửa

Lượt A chỉ đọc, lập finding ↔ PRD và phương án. Lượt B thi hành đúng finding được giao. Dùng `continuation-templates.md` B2; audit không tự cấp quyền sửa.

## vá thư viện

Ghi dependency/lockfile và lỗi cần vá; pin bản sửa và overrides tối thiểu, không nâng major; verify vùng ảnh hưởng + audit dependency. Buộc đổi kiến trúc/phạm vi thì hỏi.

## tích hợp & dọn

Ghi nhánh/PR, thứ tự merge, merge-tree với mọi nhánh song song, gate sau tích hợp, cổng cần chạy latest và tài nguyên do mình tạo. Chỉ dọn nhánh local khi prompt giao rõ và tag archive đã xác minh (D10). Không remote delete/force-delete/kill tiến trình không rõ chủ.
