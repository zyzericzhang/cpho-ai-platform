---
last_updated: "2026-05-13T18:45:26+08:00"
current_phase: "E2E verified with documented residual risk"
active_branch: "dev"
---
# WORKING_CONTEXT.md | 当前会话上下文

这个文件记录了当前正在进行的任务、短时记忆和会话特定状态，帮助 Agent 在多回合对话中保持连贯。

## 🎯 当前焦点 (Current Focus)
- **任务**: 完成 Supabase 迁移落库、AI Solver 真实 PDF 解析、Problem Bank admin 真实题目 PDF + 答案 PDF 上传、账号/权限验证与文档证据整理。
- **分支**: `dev`（用户明确要求直接在 dev 内修改）
- **阶段**: 端到端验证通过，保留 Dashboard Auth leaked-password protection 安全设置待用户开启。

## 🧠 短时记忆 (Session Memory)
- 本轮按用户要求直接在 `dev` 工作树完成实现、迁移、测试和文档更新；尚未提交 commit。
- 已清理所有过期的 feature/codex 分支（本地 16 个 + 远程 2 个）、5 个 worktree、3 个 stash。
- 当前工作树保留本轮未提交变更与截图证据；分支为 `dev`。
- 远端 Supabase 项目 `kabopirqdcrtlxzocebv` 已执行业务迁移，`profiles`、AI Solver 表、Problem Bank 表、Personal Library 表均存在。
- Problem Bank 新增 `papers.answer_pdf_storage_path`，admin 创建页支持题目 PDF 与答案 PDF 双上传；Next server action body limit 调整到 60MB。
- AI Solver 已改为题目材料 + 标准答案材料双上传，移除了“确认与编辑抽取文本”，OpenRouter/Gemini 直接读取 PDF/图片。
- AI Solver 当前运行时为服务端固定七任务规划 + 七个 per-task provider calls + 服务端确定性聚合；真实 PDF 解析和 follow-up 已通过。
- 创建测试账号：`codex-admin-e2e-20260513@example.com`、`codex-student-e2e-20260513@example.com`。
- 真实 Problem Bank 测试记录：`c40e9860-edb5-4a0c-8af2-585b4d7c506d`，已上传用户提供的题目 PDF 与答案 PDF。
- Student role 自提权测试返回 `400 P0001 Changing profile role is not allowed.`，student 访问 admin route 被重定向。
- Draft Problem Bank 题目对 student REST select 返回空数组；AI Solver admin session/uploaded_materials 对 student REST select 返回空数组。
- `OPENROUTER_API_KEY` 实际值未出现在 `.next/static`、`.next/server/app`、`.next/server/chunks` 构建产物中。
- Supabase Security Advisor 当前仅剩 Auth leaked-password protection disabled 警告，需要在 Dashboard Auth 设置中开启。

## 🛠️ 下一步操作 (Next Steps)
1. [x] 修复编译级错误，使 `npx tsc --noEmit` 通过。
2. [x] 修复 profiles RLS / trigger，禁止普通用户更新 `role`。
3. [x] 执行 Supabase 迁移并验证远端表、bucket、storage path。
4. [x] 用真实题目 PDF + 答案 PDF 完成 AI Solver 上传、解析、follow-up。
5. [x] 用真实题目 PDF + 答案 PDF 完成 Problem Bank admin 创建，并验证 student 可读 published 详情。
6. [x] 写入账号管理和 E2E 验证文档。
7. [x] 补测 draft Problem Bank 不可读、AI Solver owner-only、OpenRouter key 不进入构建产物。
8. [ ] 在 Supabase Dashboard 开启 leaked-password protection。
9. [ ] 后续阶段将 AI Solver local-store 持久化到 Supabase 表/Storage，并接入真实 similar problems / related articles 检索。

## 🛑 阻塞项 (Blockers)
- Supabase Auth leaked-password protection disabled 是 Dashboard 安全设置，需要用户在 Supabase Auth 设置中开启。
- AI Solver 仍使用进程内 local-store；本轮验证通过但非生产持久化方案。
