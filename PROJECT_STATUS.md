# PROJECT_STATUS.md | 项目资产与状态记录

这个文件记录了 CPHO AI 平台当前已实现的资产、核心结论和系统现状，作为 Agent 的"长期资产记忆"。

## 🏗️ 核心模块现状

### 1. AI Solver
- **状态**: ✅ 真实 PDF 上传/解析/follow-up 已验证。
- **已实现资产**:
  - OpenRouter/Gemini 多模态编排核心逻辑：服务端固定七任务规划、七个逐任务调用、服务端确定性聚合 (`lib/ai-solver/provider-orchestration.ts`)。
  - 会话与图片上下文本地存储 (`lib/ai-solver/local-store.ts`)。
  - 分析与追问 API 路由 (`app/api/ai-solver/...`)。
  - 分块式结果展示 UI 及其追踪追问面板。
- **待办项**: 将 AI Solver local-store 持久化到 Supabase 表/Storage；接入真实题目检索，移除"未连接"占位。

### 2. Problem Bank
- **状态**: ✅ admin 真实双 PDF 创建与 student published read 已验证。
- **已实现资产**:
  - Admin 创建题目时可上传题目 PDF 与答案 PDF。
  - PDF 存储在 private `problem-bank-papers` bucket，并通过 RLS + signed URL 读取。
  - `papers.source_pdf_storage_path` 和 `papers.answer_pdf_storage_path` 已落库。
  - `profiles.role` 自提权已由数据库 trigger 阻止。
- **待办项**: 编辑页尚不能替换 PDF；后续可补 answer/problem PDF replacement flow。

### 3. App Shell & 导航
- **状态**: ✅ 中文化已完成。
- **核心结论**: 移除所有假数据种子，采用 `lib/shell-data.ts` 作为单一状态源。

## 🔐 安全与权限资产
- **RLS 策略**: Profile role 自提权已阻止；Problem Bank published read 已收紧为 authenticated/admin；draft problem 与跨用户 AI Solver session/upload 读取均已验证为不可见。
- **Auth**: 集成 Supabase Auth。
- **Secrets**: 已验证 `OPENROUTER_API_KEY` 实际值未进入本地构建产物。
- **结论**: 所有敏感操作必须经过服务端身份校验，前端隐藏控件不作为安全边界。

## 📋 已完成 Epic 记录

### Epic: Issue #11 中文化真实页面内容与导览逻辑
- **分支**: `codex/issue-11-integration-verify`
- **结果**: App shell 和核心模块已从英文 mock/demo UI 转换为中文真实状态页面，移除所有假数据种子。
- **完成时间**: 2026-05-12

### Epic: Issue #10 AI Solver OpenRouter Gemini multimodal orchestration
- **分支**: `feature/openrouter-gemini-multimodal`
- **结果**: 服务端固定七任务规划、逐任务调用、确定性聚合、threaded follow-up Q&A、selected-text Q&A。
- **完成时间**: 2026-05-11

### Epic: Problem Bank Full Implementation
- **分支**: `dev`
- **结果**: Admin auth/management、edit/delete、student search、solver handoff、related content placeholders。
- **完成时间**: 2026-05-12

### Epic: QA12 Supabase 配置与端到端验证
- **分支**: `dev`
- **结果**: 构建阻塞修复、Supabase 权限 hardening、Playwright 真实上传验证。测试账号: `codex-admin-e2e-20260513@example.com`、`codex-student-e2e-20260513@example.com`。
- **完成时间**: 2026-05-13

## 🛠️ 技术债与风险
- **风险**: 缺乏 API 调用频率限制 (Rate Limiting)，可能导致 OpenRouter 费用失控。
- **风险**: Supabase Auth leaked-password protection 仍需在 Dashboard 开启。
- **风险**: AI Solver 仍使用进程内 local-store，非生产持久化方案。

## 📜 决策索引 (ADR Index)
- [ADR-001]：协作架构从"黑盒"转向"透明黑板"模式 (2026-05-10)。
