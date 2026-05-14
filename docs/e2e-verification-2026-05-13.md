# E2E Verification Evidence - 2026-05-13

本文档记录 2026-05-13 本轮真实端到端验证证据。它是证据索引；未执行的项目不得写成通过。

## 当前已知事实

- 远端迁移已执行。
- Supabase Security Advisor 当前仅剩 Auth leaked-password protection disabled 警告；这是 Dashboard Auth 设置，需上线前由项目管理员开启。
- AI Solver 真实 PDF 上传、解析、follow-up 已通过。
- Problem Bank admin 双 PDF 创建已通过：通过网站 admin 表单上传题目 PDF 和答案 PDF，创建 published 题目记录。
- Student 不能访问 admin 页面：student session 访问 `/admin/problem-bank` 被服务端重定向到 `/`。
- Student role self-promotion 已被数据库 trigger 拒绝。

## 证据记录规则

- 每条证据必须对应真实操作、截图、录屏、日志或 SQL 查询结果。
- 不允许补写未执行步骤的“通过”结论。
- 截图文件名应包含日期、模块、角色和步骤。
- 涉及账号、邮箱、session id、problem id、storage path 时，应记录可复核的标识；涉及 secret 时必须打码。
- AI provider key、Supabase service role key、OpenRouter request headers 不得进入截图或文档。

## 测试账号

本轮已创建并验证以下测试账号：

| Role | Email pattern | Purpose | Status |
| --- | --- | --- | --- |
| student | `codex-student-e2e-20260513@example.com` | Student permission and Problem Bank published read | created and verified |
| admin | `codex-admin-e2e-20260513@example.com` | Problem Bank admin creation flow | created and verified |

账号创建、提升、降级和删除流程见 `docs/account-management-guide.md`。

## Playwright 截图清单

以下为当前已收集的截图和终端验证清单。

| ID | Module | Role | Scenario | Expected evidence | Screenshot / recording | Status |
| --- | --- | --- | --- | --- | --- | --- |
| PW-001 | Auth | student | Student session | Student session token valid; browser DNS/login UI had intermittent client fetch issue, session injected for SSR verification | `output/playwright/21-student-problem-detail-pdf-links.png` | passed with note |
| PW-002 | Auth | admin | Admin session | Admin session token valid; session cookie used for SSR admin route verification | `output/playwright/20-admin-real-problem-answer-pdf-upload.png` | passed with note |
| PW-003 | Permission | student | Student cannot mutate Problem Bank | Student访问 `/admin/problem-bank` 被服务端重定向到 `/` | `output/playwright/21-student-problem-detail-pdf-links.png` | passed |
| PW-004 | Permission | student | Student cannot self-promote | `PATCH profiles.role='admin'` 返回 `400 P0001 Changing profile role is not allowed.` | terminal output | passed |
| PW-005 | AI Solver | student/local preview | Real PDF upload | 真实题目 PDF + 答案 PDF 上传成功 | `output/playwright/13-ai-solver-analysis-success.png` | passed |
| PW-006 | AI Solver | student/local preview | PDF direct analysis | OpenRouter/Gemini 直接读取 PDF，返回固定 7 区块 | `output/playwright/13-ai-solver-analysis-success.png` | passed |
| PW-007 | AI Solver | student/local preview | Follow-up | Follow-up 在同一 AI Solver session 内返回并显示 | `output/playwright/14-ai-solver-followup-success.png` | passed |
| PW-008 | AI Solver | student/local preview | Retrieval not connected state | Similar problems / related articles 保持 `not_connected`，未编造记录 | `output/playwright/13-ai-solver-analysis-success.png` | passed |
| PW-009 | Problem Bank Admin | admin | Create problem with problem PDF + answer PDF | Admin 双 PDF 创建流程完成，并生成可复核 problem record | `output/playwright/20-admin-real-problem-answer-pdf-upload.png` | passed |
| PW-010 | Problem Bank | student | Published problem read | Student 可读取 published problem，详情页显示题目 PDF 和答案 PDF 签名链接 | `output/playwright/21-student-problem-detail-pdf-links.png` | passed |
| PW-011 | Problem Bank | student | Draft problem blocked | Student REST select draft probe 返回空数组 | terminal output | passed |
| PW-012 | Storage/RLS | student | Cross-user AI Solver isolation | Student REST select admin session/uploaded_materials probe 返回空数组 | terminal output | passed |

## Backend / Supabase Evidence 占位

| ID | Area | Evidence | Status |
| --- | --- | --- | --- |
| DB-001 | Migrations | 远端迁移已执行 | known completed |
| DB-002 | Security Advisor | 当前仅剩 Auth leaked-password protection disabled 警告，需 Dashboard 开启 | residual risk |
| DB-003 | Profiles RLS | Student 不能更新自己的 `role` | passed |
| DB-004 | Admin role | Admin 角色由受控 SQL 设置；登录 token 可由 Supabase Auth REST 获取 | passed |
| DB-005 | Problem Bank RLS | Student 不能进入 admin Problem Bank route；server action 也有 admin role check | passed |
| DB-006 | AI Solver owner scope | Student 不能读取 admin session/uploaded_materials probe | passed |
| DB-007 | Secrets | `OPENROUTER_API_KEY` 实际值未出现在 `.next/static`、`.next/server/app`、`.next/server/chunks` | passed |

## AI Solver 真实测试记录

当前可记录的事实：

- 真实 PDF 上传已通过。
- PDF 解析已通过。
- Follow-up 已通过。

证据：

- Playwright 截图：`output/playwright/13-ai-solver-analysis-success.png`、`output/playwright/14-ai-solver-followup-success.png`。
- 上传材料：题目 PDF `CamScanner 2026-3-30 22.18.pdf`，答案 PDF `学而思第21届高中物理竞赛联考XPhO答案.pdf`。
- Standard-answer gate：服务端要求题目材料和答案材料同时存在。
- Provider model 来源：由服务端 `OPENROUTER_MODEL` 控制，不在 UI 写死。

## Problem Bank Admin 双 PDF 验证记录

当前状态：已通过。

证据：

- Admin 测试账号：`codex-admin-e2e-20260513@example.com`。
- Problem PDF：`CamScanner 2026-3-30 22.18.pdf`。
- Answer PDF：`学而思第21届高中物理竞赛联考XPhO答案.pdf`。
- 创建后的 problem id：`c40e9860-edb5-4a0c-8af2-585b4d7c506d`。
- `papers.source_pdf_storage_path`：`1258db9a-0670-4302-ac8e-0dd372b93974/c468857c-75ed-4a9e-bba5-85d4f77888a5/problem-CamScanner-2026-3-30-22.18.pdf`。
- `papers.answer_pdf_storage_path`：`1258db9a-0670-4302-ac8e-0dd372b93974/c468857c-75ed-4a9e-bba5-85d4f77888a5/answer-21-XPhO-.pdf`。
- Student 可读取 published 题目详情和两个 PDF 链接。
- Student 访问 admin route 被重定向到 `/`。

## 补充 RLS / Secret 验证记录

- Draft problem probe id：`95c6c745-36ea-4ac0-b719-5804221c98b1`，student REST select 返回空数组，随后已清理。
- AI Solver owner-scope session probe id：`cea19513-37a1-455e-882f-234817803be3`，student REST select session 和 uploaded_materials 均返回空数组，随后已清理。
- 构建产物 secret 扫描：`OPENROUTER_API_KEY` 实际值未出现在 `.next/static`、`.next/server/app`、`.next/server/chunks`。

## 本轮结论状态

本轮已验证 AI Solver 真实 PDF 上传/解析/follow-up、Problem Bank admin 真实题目 PDF + 答案 PDF 创建、student published read、student admin route block、student role self-promotion block、draft problem blocked、AI Solver owner-only read scope、OpenRouter key 不进入构建产物。

剩余风险：Supabase Security Advisor 仍提示 Auth leaked-password protection 未开启，这是 Dashboard Auth 安全设置，不影响本轮功能 E2E，但上线前应开启。
