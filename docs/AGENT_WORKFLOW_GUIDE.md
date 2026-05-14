# Agent 架构操作指南 (Human Operator Guide)

本指南帮助您（作为架构师和主要操作者）高效且正确地使用 CPHO AI Platform 的 agent 工作流。
您的主要 agent 工具是 **Codex** 和 **Antigravity (Gemini CLI)**。

---

## 1. 架构概览

```
项目根目录
├── AGENTS.md              ← 唯一硬规则文件（所有 agent 必读）
├── SOUL.md                ← 核心红线与价值观（极少改动）
├── PROJECT_STATUS.md      ← 长期资产记忆（Epic 结束后更新）
├── WORKING_CONTEXT.md     ← 短时记忆 + 实时交互日志（每步更新）
├── .cursorrules           ← Cursor/Codex 注入层（强制生命周期）
├── .clinerules            ← Cline 注入层（与 .cursorrules 同步）
├── app/GEMINI.md          ← 前端子目录精准路由指令
├── lib/GEMINI.md          ← 后端子目录精准路由指令
├── .agents/skills/        ← 可复用操作手册
└── docs/                  ← 产品规格 + 安全清单
    └── archive/           ← 归档的历史文档（agent 不主动读取）
```

**记忆模型**（借鉴 ECC 三层记忆）：

| 文件 | 类比 | 更新频率 |
|------|------|---------|
| `SOUL.md` | 长期灵魂/红线 | 几乎不变 |
| `AGENTS.md` | 工作手册/项目规则 | 架构变更时 |
| `PROJECT_STATUS.md` | 长期记忆/资产 | Epic 结束后 |
| `WORKING_CONTEXT.md` | 短时记忆/工作台 | 每步都更新 |

---

## 2. 一次完整任务的标准操作流程 (SOP)

### 步骤 A：启动任务

打开一个新的 Codex/Antigravity 会话，输入任务指令。

**提示词模板**：
```
请新建分支 feature/[功能名称] 并开始做 [任务描述]。
```

**示例**：
```
请新建分支 feature/library-persistence 并开始做：
将 AI Solver 的 local-store 持久化到 Supabase 表。
```

Agent 收到指令后会自动：
1. 执行 `git status` 检查当前分支。
2. 创建新分支。
3. 读取 `SOUL.md`、`WORKING_CONTEXT.md`、`PROJECT_STATUS.md`。
4. 在 `WORKING_CONTEXT.md` 中更新焦点信息。

### 步骤 B：监督执行（PDCA 循环）

Agent 会在执行每一步操作前，先在 `WORKING_CONTEXT.md` 的 `Implementation Log` 中写入计划。

**您的操作**：
- 观察 `WORKING_CONTEXT.md` 的文件变化（或 agent 的输出）。
- 如果计划正确 → 不理它，让它继续。
- 如果需要干预 → 直接输入修正：

**干预提示词模板**：
```
暂停。你计划里的 [具体问题] 不对，请改成 [正确做法]。
```

**示例**：
```
暂停。不需要改 RLS 策略，直接在 server action 里加 user_id 过滤就行。
```

### 步骤 C：要求预览

当 agent 完成前端修改后，它应该自动启动 dev server。如果没有，您可以要求：

**提示词模板**：
```
启动 dev server，我要检查页面。
```

看完页面后反馈修正：
```
[页面名称] 的 [具体问题]，请修复。
```

### 步骤 D：结束会话

当一轮工作结束时，让 agent 保存进度：

**提示词模板**：
```
今天到此为止，请更新 WORKING_CONTEXT.md 并执行 Phase 3。
```

**验收**：检查 agent 的最后回复是否包含 **"【记忆更新检查】：已确认 WORKING_CONTEXT.md 已更新"**。如果没有：
```
你忘记执行 Phase 3 了！立刻更新 WORKING_CONTEXT.md！
```

### 步骤 E：Memory Flush（大 Epic 结束后）

当一个大功能彻底完成并合并后，执行记忆压缩：

**提示词模板**：
```
这个 Epic 完成了。请把核心结论写入 PROJECT_STATUS.md，
然后清空 WORKING_CONTEXT.md 的短时记忆和交互区，重置为空模板。
```

---

## 3. 何时清除上一次的 Context

| 场景 | 清除策略 |
|------|---------|
| **小 bug 修复结束** | 不清除。下一个 agent 继续看到上下文 |
| **一个 Feature 完成并合并到 dev** | 清空 `WORKING_CONTEXT.md` 的短时记忆和交互区，结论转入 `PROJECT_STATUS.md` |
| **一个大 Epic 完成并合并到 main** | 完全重置 `WORKING_CONTEXT.md` 为空模板 |
| **切换到完全不同的任务** | 清空短时记忆，保留交互区最后一条（标记前一任务结束状态） |

---

## 4. 异常处理

| 问题 | 解决方法 |
|------|---------|
| Agent 忘了更新 WORKING_CONTEXT.md | 输入：`你忘记执行 Phase 3 了！立刻更新 WORKING_CONTEXT.md！` |
| Agent 在错误的分支工作 | 输入：`你在错误的分支上。请切换到 [正确分支名]。` |
| WORKING_CONTEXT.md 内容过长 | 手动清空旧内容，保留当前焦点部分 |
| Agent 没有启动 dev server | 输入：`启动 dev server，我要检查页面。` |
| Agent 写了屎山代码 | 输入：`这段代码太复杂了，请重构：[具体文件/函数]。要求每个函数有中文注释。` |

---

## 5. 常用提示词速查表

```
# 新任务
请新建分支 feature/xxx 并开始做 [任务]。

# 干预
暂停。[问题描述]，请改成 [正确做法]。

# 预览
启动 dev server，我要检查页面。

# 修正 UI
[页面] 的 [问题]，请修复。

# 结束会话
今天到此为止，请更新 WORKING_CONTEXT.md 并执行 Phase 3。

# Memory Flush
这个 Epic 完成了。请把核心结论写入 PROJECT_STATUS.md，
然后清空 WORKING_CONTEXT.md 的短时记忆和交互区。

# 代码质量
这段代码太复杂了，请重构 [文件路径]。

# 强制记忆更新
你忘记执行 Phase 3 了！立刻更新 WORKING_CONTEXT.md！
```

---

## 6. 关于不同 Agent 环境

| 环境 | 规则文件 | 说明 |
|------|---------|------|
| Codex (OpenAI) | `.cursorrules` | 自动加载，强制三阶段生命周期 |
| Cursor | `.cursorrules` | 同上 |
| Cline (VSCode) | `.clinerules` | 与 `.cursorrules` 同步 |
| Antigravity (Gemini CLI) | `AGENTS.md` 直接读取 | 可主动执行文件操作 |

所有环境共享同一套 `AGENTS.md` + `SOUL.md` + `WORKING_CONTEXT.md` + `PROJECT_STATUS.md` 状态系统。
