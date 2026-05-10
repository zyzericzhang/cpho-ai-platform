# Agent 架构操作指南 (Human Operator Guide)

本指南旨在帮助您（作为架构师和主要操作者）了解如何高效且正确地使用 CPHO AI Platform 的智能体记忆与工作流架构。
该架构深度借鉴了 `everything-claude-code` (ECC) 的理念，通过结合 `.cursorrules` / `.clinerules` 与强制的记忆生命周期钩子，确保了 Agent 的高连贯性、不遗忘，以及代码库的纯洁性。

---

## 1. 架构概览

我们的 Agent 工作流由两部分组成：
1. **强制入口层 (Injection Layer)**: 
   - 依赖文件：`.cursorrules` (用于 Cursor/Codex), `.clinerules` (用于 VSCode 里的 Cline 等扩展)。
   - 作用：接管 Agent 对话的开始和结束，强制定义 Agent 的生命周期。
2. **状态记录层 (State Machine Layer)**:
   - 依赖文件：`WORKING_CONTEXT.md`, `PROJECT_STATUS.md`, `SOUL.md`, `AGENTS.md`/`GEMINI.md`。
   - 作用：记录短时记忆、全局任务进度、核心底线、以及长效规则。

---

## 2. 标准操作流程 (对于人类操作者)

每次您想通过 Agent 开展一个新功能或修复问题时，请遵循以下流程与 Agent 交互：

### 步骤 A: 下达带有明确意图的指令
Agent 现在被强制要求在新分支上工作，避免污染原始分支。您在下达新任务时，可以直接这样说：
> "我们现在要开始做一个新的任务：重构 AI Solver 的 UI 页面。请**新建分支**并按照系统设定的生命周期开始工作。"

Agent 收到指令后，由于受到 `.cursorrules` 的限制，会：
1. 首先执行 `git status`。
2. 创建类似 `feature/refactor-ai-solver-ui` 的新分支。
3. 读取 `WORKING_CONTEXT.md` 和 `SOUL.md`。

### 步骤 B: 在执行中保持交互
在任务推进期间（Execution Phase），您正常与 Agent 结对编程。
如果遇到了新的技术决策（比如更换某个第三方库），您可以口头提醒：
> "这个问题我们决定用 Zustand 替代 Context，请记得等下把这个决定更新到短时记忆里。"

### 步骤 C: 任务收尾与确认 (最关键的一步)
当一轮任务接近尾声，Agent 准备提供最终代码或总结时，它**必须**主动更新 `WORKING_CONTEXT.md`。
**如何验收？**
- 检查 Agent 的最后一条回复是否包含口令：**"【记忆更新检查】：已确认 WORKING_CONTEXT.md 已更新"**。
- 如果它没有包含，或者您发现文件没被修改（git 树中没有 WORKING_CONTEXT.md 的 diff），说明大模型产生了“幻觉”或漏掉了步骤。此时请直接对它吼：
> "你忘记执行 Phase 3 (Memory Persistence) 了！立刻更新 `WORKING_CONTEXT.md` 的内容和顶部的 yaml frontmatter！"

---

## 3. 手动维护与异常处理

尽管我们设置了生命周期钩子，但在极端情况（比如上下文窗口耗尽）下，Agent 可能还是会“掉链子”。
此时需要您的人工介入：

1. **手动更新 YAML Frontmatter**:
   打开 `WORKING_CONTEXT.md`，检查第一行的信息：
   ```yaml
   ---
   last_updated: "2026-05-10T17:35:00+08:00"
   current_phase: "Execution"
   active_branch: "feature/collaborative-architecture-refinement"
   ---
   ```
   您可以手动修正 `active_branch` 为当前实际分支，以防止下一次 Agent 误判。

2. **清空陈旧的短时记忆**:
   随着项目推进，`WORKING_CONTEXT.md` 里的内容会越来越长。当一个大型 Epic 结束后，您可以：
   - 将重点结论提炼并移入 `PROJECT_STATUS.md` 或独立的 ADR (`docs/decisions/`)。
   - 手动清空 `WORKING_CONTEXT.md` 中的 `短时记忆 (Session Memory)` 节点，为下一个大任务腾出空间。

3. **应对不同环境**:
   - 如果您在 Cursor 中使用，它会自动加载 `.cursorrules`。
   - 如果您在 VSCode 使用 Cline，它会自动加载 `.clinerules`。
   - 如果您使用 Gemini CLI (Antigravity)，由于我在本环境中可以主动执行文件操作，我已熟悉 `AGENTS.md` / `GEMINI.md` 中写明的 Lifecycle Hooks。您可以直接说“按照 Agent Lifecycle 开始工作”。

---

## 4. 总结

这套轻量级架构的核心是：**把 Agent 当做一个有严格上下班打卡制度的打工人**。
- **上班（Bootstrapping）**：必须看工作进度表（`WORKING_CONTEXT.md`），并且一定要在自己的新工位（新分支）工作。
- **下班（Persistence）**：必须写日报（更新 `WORKING_CONTEXT.md`），否则不准下班。

祝您协作愉快！
