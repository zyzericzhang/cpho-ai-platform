# app/GEMINI.md | 路由与 UI 层指令

本项目 `app/` 目录下的工作应遵循以下特定规则：

## 🚀 核心指令
1. **视觉一致性**：坚持 Dark Mode, Apple/Linear 风格，UI 必须 compact 且 professional。
2. **状态完整性**：所有新页面必须包含 Loading, Empty, Error, Permission Denied 状态的成效表现。
3. **无假数据**：严禁在 `app/` 页面中硬编码用于演示的假题目、假文章或假用户数据。
4. **客户端安全**：严禁在 `app/` 组件中使用 `process.env` 获取非 `NEXT_PUBLIC_` 密钥。

## 🛠️ 资产参考
- App Shell 布局：`components/app-shell.tsx`
- 共享标签/状态：`lib/shell-data.ts`
