# Account Management Guide

本文档定义 CPHO AI Training System v1 内测账号的创建、角色管理、测试账号清理和权限注意事项。v1 不开放公共注册，账号应由项目维护者在 Supabase 中受控创建。

## 账号原则

- 仅允许两种角色：`student`、`admin`。
- 默认账号角色必须是 `student`。
- `admin` 只用于内部管理和 Problem Bank 内容维护，不代表大型后台入口。
- 不允许用户通过前端或客户端 API 自行提升为 `admin`。
- 前端隐藏按钮不是安全边界；所有 owner/admin 判断必须在服务端和 RLS 中执行。

## 测试账号命名约定

测试账号使用可识别、可批量清理的邮箱前缀：

```text
cpho-test-student-YYYYMMDD-N@example.test
cpho-test-admin-YYYYMMDD-N@example.test
```

示例：

```text
cpho-test-student-20260513-1@example.test
cpho-test-admin-20260513-1@example.test
```

约定：

- `YYYYMMDD` 使用创建当天日期。
- `N` 为同日递增序号。
- `example.test` 用于本地和测试记录；如 Supabase Auth 邮件策略不接受该域，可改用项目专用测试邮箱域，但仍保留 `cpho-test-` 前缀。
- 测试账号的 `username` 建议与邮箱 local part 一致，便于排查。

## 在 Supabase 创建 Student

推荐通过 Supabase Dashboard 创建：

1. 打开 Supabase Dashboard。
2. 进入 Authentication -> Users。
3. 点击 Add user / Create user。
4. 填写测试邮箱，例如 `cpho-test-student-20260513-1@example.test`。
5. 设置临时密码，并按测试需要确认邮箱。
6. 保存后确认 `auth.users` 中已出现该用户。
7. 确认 `public.profiles` 已由 signup trigger 自动创建对应记录，且 `role = 'student'`。

如 profile 未自动生成，应先检查 `handle_new_user` trigger 是否存在且已启用，不要直接绕过问题批量补数据。必要时可用 Supabase SQL Editor 补一条 profile，但必须保持 `id = auth.users.id`：

```sql
insert into public.profiles (id, username, role)
values (
  '<auth_user_id>',
  'cpho-test-student-20260513-1',
  'student'
)
on conflict (id) do update
set username = excluded.username,
    role = 'student';
```

## 在 Supabase 创建 Admin

Admin 创建分两步：先创建普通用户，再由受控维护者提升角色。

1. 按 Student 流程创建用户，例如 `cpho-test-admin-20260513-1@example.test`。
2. 确认 `public.profiles.role` 初始值为 `student`。
3. 在 Supabase SQL Editor 中执行受控角色提升：

```sql
update public.profiles
set role = 'admin'
where id = '<auth_user_id>';
```

执行后应验证：

```sql
select id, username, role
from public.profiles
where id = '<auth_user_id>';
```

注意：不要通过客户端、浏览器控制台或普通 authenticated API 改写 `role`。角色写入应限定为 Supabase Dashboard、受控 server-side admin path 或具备 service role 的维护流程。

## 提升或降级角色

提升为 admin：

```sql
update public.profiles
set role = 'admin'
where id = '<auth_user_id>';
```

降级为 student：

```sql
update public.profiles
set role = 'student'
where id = '<auth_user_id>';
```

变更前后必须记录：

- 操作人。
- 操作时间。
- 目标邮箱和 `auth.users.id`。
- 变更前角色。
- 变更后角色。
- 变更原因，例如 Problem Bank 管理测试、权限回归测试。

## 删除测试账号

删除测试账号前先确认是否需要保留测试证据。若需要保留截图或录屏，先完成证据归档，再清理账号。

推荐顺序：

1. 查询目标用户：

```sql
select id, email
from auth.users
where email like 'cpho-test-%';
```

2. 检查该用户拥有的私有数据，例如 AI Solver sessions、uploads、Personal Library items。具体表名以当前迁移为准。
3. 对只用于本轮测试的数据，按 owner scope 清理 user-owned records。
4. 在 Authentication -> Users 中删除测试用户，或使用受控 admin API 删除。
5. 确认 `public.profiles` 不再残留孤儿记录；如果没有级联删除，应手动删除对应 profile：

```sql
delete from public.profiles
where id = '<auth_user_id>';
```

6. 不要删除真实用户、共享 Problem Bank 内容或无法确认归属的数据。

## RLS 和权限注意事项

- `profiles.role` 是权限边界字段，普通用户不能更新自己的 `role`。
- `profiles` 读取应遵循：用户可读自己，admin 可按需要读 profiles。
- Problem Bank 公共内容由 admin 管理；student 不能创建、编辑、删除公共 Problem Bank 内容。
- Problem Bank 公开读取必须受 `status = 'published'` 或等价策略约束；草稿/归档内容不应对 student 可见。
- AI Solver sessions 属于 AI Solver，必须 owner-only；用户不能读取他人的 sessions、messages、uploads 或解析结果。
- 上传文件必须校验类型、大小、数量和归属；私有上传对象应通过 storage policy 限制 owner 访问。
- Similar problems 和 related articles 必须来自真实数据库检索；未接检索时 UI 必须明确显示未接入，禁止模型编造。
- `OPENROUTER_API_KEY` 只能存在服务端环境，禁止 `NEXT_PUBLIC_`，禁止写入日志、截图或 PR 文档。
- RLS 是第二道防线；所有 admin mutation route 仍必须做 server-side `role = 'admin'` 检查。

## 最小权限验证建议

每轮涉及账号和权限的验证至少覆盖：

- student 登录后不能访问 admin Problem Bank mutation 页面或 mutation API。
- student 不能把自己的 profile 更新为 `admin`。
- admin 可以进入 Problem Bank admin flow。
- admin 可以创建或更新允许范围内的 Problem Bank 内容。
- student 只能读取已发布 Problem Bank 内容。
- 用户 A 不能读取用户 B 的 AI Solver session 和上传材料。

## 本轮已创建测试账号

2026-05-13 本轮端到端验证创建了两个测试账号：

| Role | Email | Purpose |
| --- | --- | --- |
| admin | `codex-admin-e2e-20260513@example.com` | Problem Bank admin 双 PDF 创建 |
| student | `codex-student-e2e-20260513@example.com` | Student 权限与 published problem 读取 |

这两个账号用于本轮截图和数据库证据复核。若不再需要保留测试证据，可按“删除测试账号”章节清理。
