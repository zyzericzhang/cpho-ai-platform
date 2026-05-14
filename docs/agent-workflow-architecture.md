# Agent Workflow Architecture

本文件解释为什么本仓库采用当前的 agent 工作流架构。

## Architecture Choice

本仓库采用 ECC 启发的轻量级架构：

```text
AGENTS.md          ← 唯一硬规则（所有 agent 必读）
SOUL.md            ← 核心红线（极少改动）
WORKING_CONTEXT.md ← 短时记忆 + 实时交互日志
PROJECT_STATUS.md  ← 长期资产记忆

.cursorrules / .clinerules  ← 注入层，强制生命周期
app/GEMINI.md               ← 前端子目录精准路由指令
lib/GEMINI.md               ← 后端子目录精准路由指令

.agents/skills/*/SKILL.md   ← 可复用操作手册
docs/                       ← 产品规格 + 安全清单
design/                     ← UI 参考截图
```

## Design Rationale

1. **单一规则源**：`AGENTS.md` 是所有 agent 的唯一硬规则。不分散到多个重复的规则文件。
2. **三层记忆**：`SOUL.md`（灵魂）、`PROJECT_STATUS.md`（长期资产）、`WORKING_CONTEXT.md`（短时工作台）。借鉴 ECC 的 CLAUDE.md / WORKING-CONTEXT.md / SOUL.md 分层。
3. **子目录精准路由**：`app/GEMINI.md` 和 `lib/GEMINI.md` 让 agent 进入特定目录时加载精准指令，减少 token 浪费。
4. **PDCA 连续日志**：Phase 2 强制 agent 在操作前记录计划、操作后记录结果，实现可断点续传。
5. **Skills 而非 Commands**：用 `.agents/skills/` 承载可复用流程，而非依赖特定 agent 工具的 commands 系统。

## Why Not Full ECC

- ECC 的 Hooks 系统（`session-start.sh` 等）依赖 Claude Code 的 shell hook 支持，Codex/Antigravity 不支持。用 prompt 规则替代。
- ECC 的 200+ skills 库是通用的；本项目只保留 CPHO 专用 skill。
- ECC 的 Rust control plane（ecc2/）对本项目过重。

## References

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)：架构思想来源。
- [OpenAI skills](https://github.com/openai/skills)：Skills 文件夹结构参考。
- [AGENTS.md standard](https://github.com/agentsmd/agents.md)：AGENTS.md 格式标准。

## Security Boundary

安全规则分三层：

1. `AGENTS.md`：所有 agent 每次都能看到的硬规则。
2. `docs/backend-risk-checklist.md`：后端和 PR 审查清单。
3. `backend-permission-review` skill：重复执行的安全审查流程。

## Files Kept

核心文档：

- `docs/product-spec.md`：产品事实来源。
- `docs/ai-solver-spec.md`：AI Solver 和 provider 边界。
- `docs/permission-matrix.md`：student/admin 权限。
- `docs/backend-risk-checklist.md`：后端安全审查清单。
- `docs/frontend-style-guide.md`：UI 风格规范。
- `docs/AGENT_WORKFLOW_GUIDE.md`：人类操作者 SOP。

`docs/archive/` 内保留已归档的历史模块规格文档，仅用于追溯。
