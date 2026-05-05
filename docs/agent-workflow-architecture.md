# Agent Workflow Architecture

本文件解释为什么本仓库采用 `AGENTS.md + docs + .github templates + .agents/skills` 的 Codex-native 架构，而不是复制 Claude Code 社区的 `.claude/` 全家桶。

## References Checked

本次架构调整参考了这些公开资料的结构思想：

- OpenAI `openai/skills`：https://github.com/openai/skills。Agent Skills 是可复用的 instructions、scripts、resources 文件夹；system skills 自动内置，curated/experimental skills 可通过 `$skill-installer` 安装。
- AGENTS.md official format：https://github.com/agentsmd/agents.md。`AGENTS.md` 是 coding agents 的专用项目说明，补充 README，不替代人类文档。
- ShakaCode `claude-code-commands-skills-agents`：https://github.com/shakacode/claude-code-commands-skills-agents。该 repo 把 commands、agents、skills、docs、templates 分层，尤其强调 self-review、security-review、file-by-file-review。
- ykdojo `claude-code-tips`：https://github.com/ykdojo/claude-code-tips。该 repo 强调小任务拆分、测试循环、Git/GitHub CLI、worktrees 并行隔离。

结论：本项目应该吸收“可复用流程”和“审查清单”的思想，但不要搬运大量通用 agent 配置。

## Architecture Choice

本仓库采用：

```text
AGENTS.md
docs/
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE.md
.agents/skills/*/SKILL.md
```

原因：

- `AGENTS.md` 放全仓硬规则，短、硬、可执行。
- `docs/` 放产品、安全、UI、AI Solver 契约。
- `.github/` 把任务和 PR 变成可验收流程。
- `.agents/skills/` 放重复任务的操作手册，避免每次重新 prompt。
- 不使用 `.claude/commands`，因为当前主 agent 是 Codex，命令流程用 issue/PR template 和 skills 承载。

## Files Kept

核心文档只保留这些：

- `docs/product-spec.md`：产品事实来源。
- `docs/ai-solver-spec.md`：AI Solver、OpenRouter/Gemini provider、retrieval 边界。
- `docs/permission-matrix.md`：student/admin 权限和 RLS 计划。
- `docs/backend-risk-checklist.md`：后端、上传、AI key、RLS、费用风险审查。
- `docs/frontend-style-guide.md`：UI 截图/Figma 驱动流程。
- `docs/agent-workflow-architecture.md`：本文件，解释架构。

原始模块规格仍保留在 `docs/Overview.md`、`docs/v1-overview (1).md`、`docs/ai-solver.md`、`docs/problem-bank.md`、`docs/article-square.md`、`docs/editor.md`、`docs/personal-library.md`，用于追溯产品来源。

## Files Removed

已删除这些重复规划文档：

- `docs/architecture.md`
- `docs/design-workflow.md`
- `docs/git-workflow.md`
- `docs/ai-provider-architecture.md`

删除原因：这些文件把规则分散得太细，容易让 agent 不知道哪个文件是事实来源。必要内容已经合并进 `AGENTS.md`、`docs/ai-solver-spec.md`、`docs/frontend-style-guide.md` 和本文件。

也删除了：

- `.agents/skills/figma-design-review/SKILL.md`

删除原因：当前保持 5 个高信号项目 skill。Figma review 被并入 `frontend-tab-builder` 和 `playwright-ui-verifier`，避免 skill 过多导致上下文噪音。

## Five Repo-local Skills

### `frontend-tab-builder`

用于构建 AI Solver、Problem Bank、Article Plaza、Personal Library、Editor、Admin 页面。它强制前端任务先说明目标用户、页面目标、主要动作、状态和验收标准，并要求截图/预览证据。

### `backend-permission-review`

用于所有 backend、Supabase、RLS、storage、auth、AI provider 改动。它检查 student/admin 边界、owner scope、secret exposure、上传安全和 AI 费用滥用风险。

### `ai-solver-flow-builder`

用于核心 AI Solver flow。它强制执行：

- No standard answer, no AI solution。
- fixed collapsible sections。
- server-side AI provider。
- retrieval only for related problems/articles。

### `pr-risk-auditor`

用于合并前审查 PR。它要求 changed files、验收覆盖、测试、build/lint、preview、安全风险、权限风险、AI provider/费用风险和手动验证。

### `playwright-ui-verifier`

用于“不读代码，用行为验收”的浏览器验证。重点检查登录、权限、上传、标准答案 gate、折叠 sections、题库搜索、文章引用和个人库保存。

## Git and Agent Rules

- `main` stable only。
- `dev` integration branch。
- feature branches merge into `dev`。
- no direct commits to `main`。
- one primary implementation agent per feature branch。
- parallel work only on separate branches or worktrees。
- review agents inspect/comment by default, not push。
- Gemini CLI may be an independent architecture critic or long-context reviewer。

## Security Boundary

本架构把安全规则放到三层：

1. `AGENTS.md`：所有 agent 每次都能看到的硬规则。
2. `docs/backend-risk-checklist.md`：后端和 PR 审查清单。
3. `backend-permission-review` skill：重复执行的安全审查流程。

重点风险：

- student 写 public Problem Bank。
- 用户读取他人 private data。
- AI key 进入 client。
- 上传文件绕过类型/大小限制。
- 没有标准答案仍能运行 AI。
- 模型编造类似题和相关文章。

## Why Not Install Many External Skills Now

当前不大量安装外部 skills。理由：

- 项目还没有应用代码，通用 skills 会增加噪音。
- CPHO 平台有强产品规则，项目专用 skill 比通用 skill 更可靠。
- 外部 skills 应先 review，再决定是否安装。

后续可以按需使用 `$skill-installer` 安装 curated 或实验 skill，但必须先确认不会覆盖本项目权限和安全流程。

## First Implementation Order

1. `feature/project-foundation-app-shell`：Next.js shell、dark layout、simple auth placeholder。
2. `feature/auth-supabase-roles`：Supabase Auth、profiles、student/admin。
3. `feature/ai-solver-data-and-upload`：AI Solver tables、upload、extraction placeholder、confirmation gate。
4. `feature/openrouter-gemini-analysis`：server-side OpenRouter provider and structured output。
5. `feature/problem-bank-admin-mvp`：admin-managed papers/problems/standard answers。
