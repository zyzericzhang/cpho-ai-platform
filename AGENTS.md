# AGENTS.md

CPHO AI Training System 是物理竞赛 AI 学习平台，不是通用聊天机器人。coding agents 在本仓库工作时，优先遵守本文件，其次读取 `docs/` 中的产品和安全契约。

## Project Rules

- v1 是内部测试版，不开放公共注册。
- 唯一角色：`student`、`admin`。
- 核心模块：AI Solver、Problem Bank、Article Plaza、Personal Library。
- admin 能力嵌入相关模块，v1 不做大型后台。
- 核心产品规则：No standard answer, no AI solution.
- student 不能创建、编辑、删除公共 Problem Bank 内容。
- AI Solver sessions 属于 AI Solver，不直接进入 Personal Library。
- personal document 和 public article 是同一个 document；public 后显示在 Article Plaza。
- similar problems 和 related articles 必须来自真实数据库检索；未接检索时 UI 必须明确显示未接入，禁止模型编造。

## Stack Direction

- Next.js、React、TypeScript、Tailwind CSS。
- shadcn/ui 或类似组件原语可用，但不能引入重型 UI 框架。
- Supabase Auth、Postgres、Storage、RLS。
- Vercel deployment。
- 当前 AI provider：Gemini 3 through OpenRouter。
- OpenRouter 使用 OpenAI-compatible chat completion interface。
- `OPENROUTER_API_KEY` server-side only，禁止 `NEXT_PUBLIC_`。
- `OPENROUTER_MODEL` 控制具体 model id，禁止写死在 UI。

## Required Docs

- `docs/product-spec.md`：产品事实来源。
- `docs/ai-solver-spec.md`：AI Solver 和 provider 边界。
- `docs/permission-matrix.md`：student/admin 权限。
- `docs/backend-risk-checklist.md`：后端、安全、RLS、AI key 检查。
- `docs/frontend-style-guide.md`：UI 和 Figma/screenshot 工作流。
- `docs/agent-workflow-architecture.md`：为什么采用当前 agent workflow 架构。

## Repo-local Skills

只保留高信号项目 skill：

- `frontend-tab-builder`：创建或修改 AI Solver、Problem Bank、Article Plaza、Personal Library、Editor、admin 等前端 tab/page 时使用。
- `backend-permission-review`：涉及 Supabase、API route、Auth、Storage、RLS、AI provider、上传或权限边界时使用。
- `ai-solver-flow-builder`：实现或审查 AI Solver 上传、标准答案 gate、文本抽取、OpenRouter/Gemini 调用、结构化输出和 session 边界时使用。
- `pr-risk-auditor`：PR 合并前审查 changed files、验收标准、测试、构建、预览、权限、安全和 AI cost 风险时使用。
- `playwright-ui-verifier`：需要用浏览器/Playwright 验证登录、上传、AI Solver、Problem Bank、Article Plaza、Library 或 admin UI 行为时使用。
- `figma-design-review`：前端实现需要对照 Figma frame、design screenshot 或 `design/` 参考图做视觉验收时使用。
- `project-workflow-runner`：需要按项目工作流拆 issue、规划 branch、协调实现/审查、汇总验证和 PR evidence 时使用。

不要把 Claude `.claude/` 全家桶搬进来。需要外部灵感时，先压缩成项目规则，再写入上述 skill 或 docs。

## Git Workflow

- `main` stable only。
- `dev` integration branch。
- feature branches merge into `dev`。
- `dev` verified 后 merge into `main`。
- 禁止直接提交到 `main`。
- 一个 feature branch 只有一个 primary implementation agent。
- 并行 coding 必须使用不同 branch 或 worktree。
- review agents 默认只 inspect/comment，不 push，除非用户明确要求。
- 开始任务前检查 `git status --short --branch`；结束前再次检查。

## PR Requirements

每个 PR 必须包含：

- changed files
- build/lint/test result，或说明为什么未运行
- manual verification steps
- risks
- frontend reference design and implementation screenshot/preview URL，若有 UI
- backend permission/RLS/secret review，若有后端或数据改动

## Security Rules

- 前端隐藏不是安全。
- 所有私有 user-owned 记录必须有 `user_id` 或 `owner_id`。
- 所有 owner/admin 权限必须 server-side 检查，并尽量由 RLS 双重执行。
- 用户不能读取他人 AI sessions、private documents、library items、uploaded files。
- 上传文件必须校验类型、大小、数量和归属。
- 不提交 `.env`、API keys、tokens、private credentials。
- AI provider keys 不进入 client bundle、日志、错误响应、截图或 PR 文档。

## Frontend Rules

- UI 以 canonical Figma file 为准：`https://www.figma.com/design/CjqygT7bVO6wEZOKjLOyyJ/cpho-ai-platform?node-id=0-1&t=x0oQGJwauCyLvW9W-1`。
- `design/` 参考图是 Figma 不可用时的本地 fallback，不应覆盖 Figma 中较新的 frame。
- 每个 frontend issue 必须引用 Figma frame link 或 `docs/design/screenshots/` / `design/` 截图。
- 前端实现前应使用 Figma plugin/skill 读取目标 frame；实现后用 `figma-design-review` 或截图对照做视觉验收。
- 风格：dark mode first、Apple/Linear/ChatGPT-like、黑白灰、文本优先、紧凑专业。
- 禁止大型彩色 dashboard cards 和游戏化视觉。
- 数据密集页用 table；AI 输出用 collapsible sections；详情/设置/动作优先放右侧 panel。

## Do Not

- 不实现未要求的应用代码。
- 不安装外部 skills 或 packages，除非用户明确要求。
- 不创建数据库迁移，除非任务明确进入实现阶段。
- 不把 community agent 配置整包复制进仓库。
