# PROJECT_STATUS.md | 项目资产与状态记录

这个文件记录了 CPHO AI 平台当前已实现的资产、核心结论和系统现状，作为 Agent 的“长期资产记忆”。

## 🏗️ 核心模块现状

### 1. AI Solver
- **状态**: 基础框架已完成。
- **已实现资产**:
  - OpenRouter/Gemini 多模态编排核心逻辑 (`lib/ai-solver/provider-orchestration.ts`)。
  - 会话与图片上下文本地存储 (`lib/ai-solver/local-store.ts`)。
  - 分析与追问 API 路由 (`app/api/ai-solver/...`)。
  - 分块式结果展示 UI 及其追踪追问面板。
- **待办项**: 接入真实题目检索，移除“未连接”占位。

### 2. App Shell & 导航
- **状态**: 中文化重构中。
- **核心结论**: 移除所有假数据种子，采用 `lib/shell-data.ts` 作为单一状态源。

## 🔐 安全与权限资产
- **RLS 策略**: 已初步定义 Profile 读写权限。
- **Auth**: 集成 Supabase Auth。
- **结论**: 所有敏感操作必须经过服务端身份校验，前端隐藏控件不作为安全边界。

## 🛠️ 技术债与风险
- **风险**: 缺乏 API 调用频率限制 (Rate Limiting)，可能导致 OpenRouter 费用失控。
- **风险**: 文件上传尚未实现完整的大小和类型服务端强校验。

## 📜 决策索引 (ADR Index)
- [ADR-001]：协作架构从“黑盒”转向“透明黑板”模式 (2026-05-10)。
