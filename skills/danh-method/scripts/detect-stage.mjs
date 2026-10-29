#!/usr/bin/env node
// Danh Method · detect-stage.mjs
// Tự động nhận diện giai đoạn (Stage) của dự án/feature dựa trên trạng thái file và Git thật trên đĩa,
// đồng thời đề xuất command, skill và subagent + model tiết kiệm phù hợp.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseArgs(argv) {
  const args = {
    spec: null,
    code: process.cwd(),
    feature: null,
    json: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') {
      args.json = true;
    } else if (a === '--spec' && argv[i + 1]) {
      args.spec = argv[++i];
    } else if (a.startsWith('--spec=')) {
      args.spec = a.slice('--spec='.length);
    } else if (a === '--code' && argv[i + 1]) {
      args.code = argv[++i];
    } else if (a.startsWith('--code=')) {
      args.code = a.slice('--code='.length);
    } else if (a === '--feature' && argv[i + 1]) {
      args.feature = argv[++i];
    } else if (a.startsWith('--feature=')) {
      args.feature = a.slice('--feature='.length);
    }
  }

  args.code = path.resolve(args.code);

  // Auto-detect spec dir if not provided
  if (!args.spec) {
    const candidates = [
      path.join(args.code, 'docs'),
      path.join(args.code, '..', 'docs'),
      path.join(path.dirname(args.code), `${path.basename(args.code)}-spec`),
      args.code,
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'process', 'project.md')) || fs.existsSync(path.join(c, 'specs')) || fs.existsSync(path.join(c, 'features'))) {
        args.spec = c;
        break;
      }
    }
    if (!args.spec) {
      args.spec = fs.existsSync(path.join(args.code, 'docs')) ? path.join(args.code, 'docs') : (fs.existsSync(path.join(args.code, '..', 'docs')) ? path.join(args.code, '..', 'docs') : args.code);
    }
  }
  args.spec = path.resolve(args.spec);

  return args;
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

export function detectStage(options = {}) {
  const codeRoot = path.resolve(options.code || process.cwd());
  const specRoot = path.resolve(options.spec || codeRoot);
  let featureName = options.feature || null;

  // 1. Stage 0 Check: Project Setup & Operator Profile
  const projectMdInSpec = path.join(specRoot, 'process', 'project.md');
  const projectMdInCode = path.join(codeRoot, 'process', 'project.md');
  const hasProjectConfig = exists(projectMdInSpec) || exists(projectMdInCode);

  let hasOperatorProfile = false;
  const processDir = exists(path.join(specRoot, 'process')) ? path.join(specRoot, 'process') : (exists(path.join(codeRoot, 'process')) ? path.join(codeRoot, 'process') : null);
  if (processDir) {
    try {
      const files = fs.readdirSync(processDir);
      hasOperatorProfile = files.some((f) => /^operator-.*\.md$/i.test(f));
    } catch {}
  }

  if (!hasProjectConfig || !hasOperatorProfile) {
    return {
      stage: '0',
      stageName: 'Setup dự án & hồ sơ làm việc',
      feature: null,
      status: 'Chưa có cấu hình process/project.md hoặc hồ sơ operator profile.',
      nextSkill: 'project-setup',
      nextAction: 'Khởi tạo cấu hình dự án, hồ sơ người làm và kiểm tra companion plugins (Superpowers, ui-ux-pro-max).',
      proposeSubagents: [],
      readyForDispatch: false,
    };
  }

  // 2. Stage 0.5 Check: Design Tokens & Gate G0 (Token Playground)
  const tokensNotesSpec = path.join(specRoot, 'design-system', 'TOKENS-NOTES.md');
  const tokensNotesCode = path.join(codeRoot, 'design-system', 'TOKENS-NOTES.md');
  const tokensNotesPath = exists(tokensNotesSpec) ? tokensNotesSpec : (exists(tokensNotesCode) ? tokensNotesCode : null);

  let g0Approved = false;
  if (tokensNotesPath) {
    const content = readSafe(tokensNotesPath);
    if (/gate\s*g0\s*:\s*(approved|đã duyệt|chốt)/i.test(content) || /người duyệt/i.test(content)) {
      g0Approved = true;
    }
  }

  if (!g0Approved) {
    return {
      stage: '0.5',
      stageName: 'Gate G0 · Chốt Design Tokens & Token Playground',
      feature: null,
      status: 'Chưa hoàn tất duyệt Design Tokens trên Token Playground (G0).',
      nextSkill: 'design-tokens',
      nextAction: 'Chạy check-ui-packages.mjs, chọn 1 thư viện UI (shadcn hoặc heroui), scaffold Token Playground và trình duyệt G0.',
      proposeSubagents: [],
      readyForDispatch: false,
    };
  }

  // 3. Find Features in specRoot (or codeRoot)
  const featuresDir = exists(path.join(specRoot, 'features'))
    ? path.join(specRoot, 'features')
    : (exists(path.join(specRoot, 'specs')) ? path.join(specRoot, 'specs') : null);

  const availableFeatures = [];
  if (featuresDir) {
    try {
      const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') {
          availableFeatures.push(ent.name);
        }
      }
    } catch {}
  }

  if (!featureName) {
    if (availableFeatures.length === 1) {
      featureName = availableFeatures[0];
    } else if (availableFeatures.length > 1) {
      // Pick the most recently modified feature directory
      let latestTime = 0;
      for (const f of availableFeatures) {
        try {
          const stat = fs.statSync(path.join(featuresDir, f));
          if (stat.mtimeMs > latestTime) {
            latestTime = stat.mtimeMs;
            featureName = f;
          }
        } catch {}
      }
    }
  }

  if (!featureName) {
    return {
      stage: '1',
      stageName: 'Khởi tạo Feature mới',
      feature: null,
      availableFeatures,
      status: 'Chưa có feature nào được chọn hoặc tạo trong thư mục features/.',
      nextSkill: 'feature-spec',
      nextAction: 'Tạo thư mục features/<tên-feature>/ và bắt đầu viết PRD / User Flow.',
      proposeSubagents: [],
      readyForDispatch: false,
    };
  }

  const fDir = path.join(featuresDir, featureName);

  // Check Spec files
  const prdPath = path.join(fDir, 'PRD.md');
  const flowPath = path.join(fDir, 'USER_FLOW.md');
  const tasksPath = path.join(fDir, 'TASKS.md');
  const guidancePath = path.join(fDir, 'GUIDANCE.md');

  const hasPrd = exists(prdPath);
  const hasFlow = exists(flowPath);
  const hasTasks = exists(tasksPath);

  let prdApproved = false;
  if (hasPrd) {
    const prdText = readSafe(prdPath);
    if (/status\s*:\s*(approved|đã duyệt)/i.test(prdText) || /duyệt\s*prd/i.test(prdText) || hasTasks) {
      prdApproved = true;
    }
  }

  // 4. Stage 1-3 Check: Spec & PRD approval
  if (!hasPrd || !hasFlow || !hasTasks || !prdApproved) {
    return {
      stage: '1-3',
      stageName: 'Đặc tả Feature (PRD / Flow / Guidance / Tasks)',
      feature: featureName,
      status: `Đặc tả feature "${featureName}" chưa hoàn tất hoặc PRD chưa được duyệt.`,
      nextSkill: 'feature-spec',
      nextAction: 'Hoàn thiện PRD, USER_FLOW, GUIDANCE, TASKS và chốt danh sách câu hỏi Q# với người phụ trách.',
      proposeSubagents: [],
      readyForDispatch: false,
    };
  }

  // Check Prototype & Review G1
  const prototypeDir = path.join(fDir, 'prototype');
  let hasRenderedPrototype = false;
  if (exists(prototypeDir)) {
    try {
      const pFiles = fs.readdirSync(prototypeDir);
      hasRenderedPrototype = pFiles.some((f) => f.endsWith('.html'));
    } catch {}
  }

  const reviewMdPath = path.join(fDir, 'REVIEW.md');
  let g1Approved = false;
  if (exists(reviewMdPath)) {
    const revText = readSafe(reviewMdPath);
    if (/gate\s*g1\s*:\s*(approved|đã duyệt|pass)/i.test(revText) || /kết quả review\s*:\s*đạt/i.test(revText)) {
      g1Approved = true;
    }
  }

  // Check Task status in TASKS.md or HANDOFF
  const tasksText = readSafe(tasksPath);
  const logicTasksDone = /\[x\]\s*(task\s*l|logic)/i.test(tasksText) || /pushed\s+[a-f0-9]{7,40}/i.test(tasksText);
  const uiTasksDone = /\[x\]\s*(task\s*u|ui)/i.test(tasksText);

  // 5. Stage 4A: Parallel Prototype & Logic Dispatch (Right after PRD approval)
  if (!hasRenderedPrototype && !logicTasksDone) {
    return {
      stage: '4A',
      stageName: 'Thi hành song song Prototype (Design) & Logic Backend',
      feature: featureName,
      status: `PRD feature "${featureName}" đã duyệt. Chưa có HTML prototype và chưa có commit logic.`,
      nextSkill: 'subagent-orchestration',
      nextAction: 'Kích hoạt 2 subagent chạy song song: design-prototyper dựng preview component thật, logic-implementer dựng schema/logic.',
      proposeSubagents: [
        {
          subagent: 'design-prototyper',
          role: 'Dựng prototype component thật kèm controls chỉnh token & provenance',
          glob: `features/${featureName}/prototype/**, features/${featureName}/DESIGN-NOTES.md`,
          recommendedModel: 'flash',
          modelRationale: 'Tiết kiệm chi phí & quota, tối ưu cho tác vụ chuyển đổi spec thành code preview theo mẫu.',
        },
        {
          subagent: 'logic-implementer',
          role: 'Triển khai schema, service, API endpoints và unit test',
          glob: 'packages/server/**, src/services/**, tests/unit/**',
          recommendedModel: 'flash',
          modelRationale: 'Tiết kiệm chi phí & quota, đủ thông minh cho TDD và implement schema/logic theo hợp đồng data.',
        },
      ],
      readyForDispatch: true,
    };
  }

  // 6. Stage 4B: Coordinator Preview Capture & Review G1
  if (hasRenderedPrototype && !g1Approved) {
    return {
      stage: '4B',
      stageName: 'Điều phối viên nghiệm thu Preview & Chốt Gate G1',
      feature: featureName,
      status: `Đã có file prototype tại features/${featureName}/prototype/, chưa có duyệt G1 trong REVIEW.md.`,
      nextSkill: 'design-prototype',
      nextAction: 'Điều phối viên tự chạy renderer, chụp ảnh 1440/768/390 light+dark và lập REVIEW.md để người phụ trách duyệt G1.',
      proposeSubagents: [],
      readyForDispatch: false,
    };
  }

  // 7. Stage 4C: UI Implementation (G1 approved + Logic has pushed hash)
  if (g1Approved && !uiTasksDone) {
    return {
      stage: '4C',
      stageName: 'Triển khai Giao diện UI (ui-implementer)',
      feature: featureName,
      status: `Preview Gate G1 đã duyệt và Logic đã có commit. Sẵn sàng ráp UI hoàn chỉnh.`,
      nextSkill: 'subagent-orchestration',
      nextAction: 'Spawn ui-implementer để ráp màn hình theo đúng preview đã duyệt và kết nối logic API.',
      proposeSubagents: [
        {
          subagent: 'ui-implementer',
          role: 'Triển khai giao diện UI theo đúng preview G1 đã duyệt và kết nối dữ liệu logic',
          glob: 'packages/ui/**, src/components/**, src/pages/**',
          recommendedModel: 'flash',
          modelRationale: 'Tiết kiệm chi phí & quota, tập trung bám sát markup/style đã chốt ở preview.',
        },
      ],
      readyForDispatch: true,
    };
  }

  // Check Code Review status
  const auditPath = path.join(fDir, 'REVIEW-REPORT.md');
  const reviewReportExists = exists(auditPath) || exists(path.join(specRoot, 'audits', `${featureName}.md`));

  // 8. Stage 5: Code Review (Read-only)
  if (!reviewReportExists) {
    return {
      stage: '5',
      stageName: 'Đánh giá mã nguồn (code-reviewer chỉ đọc)',
      feature: featureName,
      status: `Mã nguồn đã triển khai, chưa có báo cáo code review độc lập theo PRD.`,
      nextSkill: 'review-report',
      nextAction: 'Spawn code-reviewer (chỉ đọc diff) để phát hiện lỗi logic, bảo mật, đối chiếu PRD và lập bảng Issue.',
      proposeSubagents: [
        {
          subagent: 'code-reviewer',
          role: 'Review diff chỉ đọc (git diff base..head), truy nguyên cơ chế, đối chiếu PRD và lập bảng Issue',
          glob: '(Read-only diff — không ghi code app)',
          recommendedModel: 'flash',
          modelRationale: 'Tiết kiệm chi phí & quota, hoàn hảo cho tác vụ đọc code tìm diff lỗi theo checklist định sẵn.',
        },
      ],
      readyForDispatch: true,
    };
  }

  // Check Acceptance status
  const acceptancePath = path.join(fDir, 'ACCEPTANCE.md');
  const acceptanceExists = exists(acceptancePath);

  // 9. Stage 6: Acceptance Testing (Browser on cloned DB)
  if (!acceptanceExists) {
    return {
      stage: '6',
      stageName: 'Nghiệm thu trung thực (acceptance-tester)',
      feature: featureName,
      status: `Code review đã đạt. Chưa có báo cáo nghiệm thu ACCEPTANCE.md trên DB bản sao.`,
      nextSkill: 'design-review',
      nextAction: 'Spawn acceptance-tester để chạy test trình duyệt, chụp ảnh bằng chứng và lập báo cáo ACCEPTANCE.md.',
      proposeSubagents: [
        {
          subagent: 'acceptance-tester',
          role: 'Nghiệm thu trình duyệt trên cơ sở dữ liệu bản sao, đo thời gian demo, bắt lỗi B# và lập ACCEPTANCE.md',
          glob: `features/${featureName}/ACCEPTANCE.md, features/${featureName}/acceptance-screens/**`,
          recommendedModel: 'flash',
          modelRationale: 'Tiết kiệm chi phí & quota, tối ưu cho tác vụ kiểm thử checklist E2E theo kịch bản.',
        },
      ],
      readyForDispatch: true,
    };
  }

  // Feature Complete!
  return {
    stage: 'COMPLETE',
    stageName: 'Feature hoàn tất · Chờ Owner duyệt G3 & Merge',
    feature: featureName,
    status: `Feature "${featureName}" đã qua đầy đủ Stage 1–6 (Spec → G1 → Logic/UI → Review → Acceptance).`,
    nextSkill: 'execute-tasks',
    nextAction: 'Chạy verify-kit --pr để xác nhận toàn bộ test suite pass, trình owner duyệt Gate G3 và tiến hành merge.',
    proposeSubagents: [],
    readyForDispatch: false,
  };
}

function runCli() {
  const args = parseArgs(process.argv);
  const result = detectStage(args);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  console.log('\n=== Danh Method · Tự động nhận diện giai đoạn (Stage Detector) ===\n');
  console.log(`Giai đoạn (Stage): [${result.stage}] ${result.stageName}`);
  console.log(`Feature          : ${result.feature || 'Chưa chọn / chưa có'}`);
  console.log(`Hiện trạng       : ${result.status}`);
  console.log(`Skill tiếp theo  : ${result.nextSkill}`);
  console.log(`Hành động        : ${result.nextAction}\n`);

  if (result.proposeSubagents && result.proposeSubagents.length > 0) {
    console.log('--- ĐỀ XUẤT SUBAGENT & MODEL TIẾT KIỆM ---');
    result.proposeSubagents.forEach((s, idx) => {
      console.log(`\n  ${idx + 1}. Subagent : ${s.subagent}`);
      console.log(`     Tác vụ   : ${s.role}`);
      console.log(`     Vùng glob: ${s.glob}`);
      console.log(`     Model    : ${s.recommendedModel.toUpperCase()} (Tiết kiệm chi phí & quota)`);
      console.log(`     Lý do    : ${s.modelRationale}`);
    });
    console.log('\n  👉 CẦN XÁC NHẬN CỦA NGƯỜI DÙNG TRƯỚC KHI SPAWN:');
    console.log('     [1] Đồng ý dùng model tiết kiệm');
    console.log('     [2] Đổi sang model mạnh (Pro / Sonnet / inherit)');
    console.log('     [3] Chạy inline trực tiếp (không mở subagent)\n');
  } else {
    console.log('--- Không cần spawn subagent ở giai đoạn này (Điều phối viên làm trực tiếp) ---\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runCli();
}
