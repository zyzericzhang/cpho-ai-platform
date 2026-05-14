# AGENTS.md

CPHO AI Training System 是物理竞赛 AI 学习平台，不是通用聊天机器人。
本文件是所有 coding agents（Codex、Antigravity、Cursor 等）在本仓库工作时的**唯一硬规则来源**。
其次读取 `docs/` 中的产品和安全契约。

---

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
- **本项目不使用 Vercel、不使用 Figma**。前端验收以本地 `npm run dev` 运行 + 截图/录屏为准。
- 当前 AI provider：Gemini 3 through OpenRouter。
- OpenRouter 使用 OpenAI-compatible chat completion interface。
- `OPENROUTER_API_KEY` server-side only，禁止 `NEXT_PUBLIC_`。
- `OPENROUTER_MODEL` 控制具体 model id，禁止写死在 UI。

## Required Docs

Agent 开始任务前应了解以下文档的存在，按需读取：

- `docs/product-spec.md`：产品事实来源。
- `docs/ai-solver-spec.md`：AI Solver 和 provider 边界。
- `docs/permission-matrix.md`：student/admin 权限。
- `docs/backend-risk-checklist.md`：后端、安全、RLS、AI key 检查。
- `docs/frontend-style-guide.md`：UI 风格和组件规则。
- `docs/agent-workflow-architecture.md`：为什么采用当前 agent workflow 架构。
- `docs/AGENT_WORKFLOW_GUIDE.md`：人类操作者 SOP 和提示词模板。

`docs/archive/` 内的文件是已归档的历史文档，仅用于追溯，agent 不应主动读取。

## Repo-local Skills

只保留高信号项目 skill：

- `frontend-tab-builder`：创建或修改前端 tab/page 时使用。
- `backend-permission-review`：涉及 Supabase、API route、Auth、Storage、RLS、AI provider、上传或权限边界时使用。
- `ai-solver-flow-builder`：实现或审查 AI Solver 完整流程时使用。
- `pr-risk-auditor`：PR 合并前审查时使用。
- `playwright-ui-verifier`：需要用浏览器验证 UI 行为时使用。
- `project-workflow-runner`：需要按项目工作流拆 issue、规划 branch 时使用。
- `agentic-harness-orchestrator`：Coordinator agent 管理任务分解和 worker 委派时使用。

不要把外部 agent 配置整包复制进仓库。需要外部灵感时，先压缩成项目规则，再写入上述 skill 或 docs。

## Git Workflow

- `main` stable only。
- `dev` integration branch。
- feature branches merge into `dev`。
- `dev` verified 后 merge into `main`。
- 禁止直接提交到 `main`。
- **每次新任务必须拉取新分支** (`git checkout -b new-branch-name`)，绝对禁止直接修改原来的分支内容以避免历史污染。
- 一个 feature branch 只有一个 primary implementation agent。
- 并行 coding 必须使用不同 branch 或 worktree。
- review agents 默认只 inspect/comment，不 push，除非用户明确要求。
- 开始任务前检查 `git status --short --branch`；结束前再次检查。

## Agent Lifecycle Hooks (CRITICAL)

Agent 必须严格遵守以下三阶段生命周期：

### Phase 1: Bootstrapping
任务开始时强制执行：
1. 运行 `git status --short --branch` 确认当前分支。
2. 读取 `SOUL.md`（核心红线）。
3. 读取 `WORKING_CONTEXT.md`（当前短时记忆和交互日志）。
4. 读取 `PROJECT_STATUS.md`（项目全局状态）。
5. 确认处于正确的工作分支（新分支或用户指定分支）。

### Phase 2: Execution & Continuous Logging (PDCA Loop)
Agent 必须保持连续的进度记录，确保用户随时可打断、下一个 agent 可无缝接力：
1. **Plan**：执行任何重大操作前，先在 `WORKING_CONTEXT.md` 的 `## 📝 Implementation Log (交互区)` 写明计划。
2. **Do**：执行操作。
3. **Check**：记录结果到 Implementation Log。
4. **Act**：根据结果调整计划，继续循环。

遵循 `AGENTS.md` 和相关 docs 中的标准工作流。

### Phase 3: Persistence (Termination)
任务结束前必须执行：
1. 更新 `WORKING_CONTEXT.md`（包括 YAML frontmatter 的 `last_updated`、`current_phase`、`active_branch`）。
2. 如有宏观任务完成，更新 `PROJECT_STATUS.md`。
3. 在最后回复中明文声明：**"【记忆更新检查】：已确认 WORKING_CONTEXT.md 已更新"**。

## When to Spawn Subagents

以下场景必须拆分为多个 worker 或 spawn subagent：
- 涉及 **3 个以上不相关文件** 的并行修改。
- **前端 + 后端** 同时修改时，分拆为前端 worker 和后端 worker。
- **代码审查和实现** 不应由同一个 agent 完成。
- PR 提交前必须 spawn `pr-risk-auditor` 进行审查。
- 复杂任务应先由 coordinator 规划，再分派给专业 worker。

## Code Quality Rules

- **注释要求**：每个函数、组件必须有中文注释说明"做什么"和"为什么"。每个新增文件顶部必须有文件级注释说明文件用途。
- **文件长度**：单文件禁止超过 300 行。超过时必须拆分为更小的模块。
- **禁止复制粘贴**：重复逻辑必须提取为共享工具函数或组件。
- **定期重构**：每完成一个 Epic 后，agent 应审查并简化相关模块代码，降低维护成本。
- **命名规范**：变量、函数、组件命名必须清晰表达意图，禁止单字母变量（循环变量除外）。
- **类型安全**：禁止使用 `any` 类型，除非有明确注释说明原因。

## Dev Server Rules

- 完成**前端代码修改**后，agent 必须执行 `npm run dev` 启动 dev server。
- 启动成功后告知用户：`"Dev server 已启动：http://localhost:3000，请检查页面。"`
- 如果 dev server 启动报错，优先修复报错再继续后续任务。
- 用户说"启动 dev server"或"我要看页面"时，立即执行 `npm run dev`。

## PR Requirements

每个 PR 必须包含：

- changed files
- build/lint/test result，或说明为什么未运行
- manual verification steps
- risks
- frontend 实现截图/录屏/本地预览说明，若有 UI
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

- UI 以 `design/` 目录下的参考截图和当前实现代码为准。
- 风格：dark mode first、Apple/Linear/ChatGPT-like、黑白灰、文本优先、紧凑专业。
- 禁止大型彩色 dashboard cards 和游戏化视觉。
- 数据密集页用 table；AI 输出用 collapsible sections；详情/设置/动作优先放右侧 panel。
- 每个前端页面必须处理：loading、empty、error、permission denied、selected item、disabled unauthorized action。

## Do Not

- 不实现未要求的应用代码。
- 不安装外部 skills 或 packages，除非用户明确要求。
- 不创建数据库迁移，除非任务明确进入实现阶段。
- 不把 community agent 配置整包复制进仓库。
- 不读取 `docs/archive/` 中的文件（除非用户明确要求追溯历史）。
