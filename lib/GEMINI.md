# lib/GEMINI.md | 后端与逻辑层指令

本项目 `lib/` 目录下的工作应遵循以下特定规则：

## 🚀 核心指令
1. **安全性优先**：任何涉及数据库读写或 API 调用的修改，必须在 Log 中说明 RLS 影响。
2. **所有权校验**：确保所有用户数据访问都带有 `user_id` 或 `owner_id` 过滤。
3. **AI Provider 安全**：严禁在 `lib/` 层的错误捕获中打印原始 Provider Payload。
4. **性能意识**：避免在循环中进行数据库查询，优先使用 Supabase 的批量操作。

## 🛠️ 资产参考
- AI Solver 逻辑：`lib/ai-solver/`
- Supabase 客户端：`lib/supabase/`
