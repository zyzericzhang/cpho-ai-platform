# Frontend Style Guide

前端工作以 `design/` 目录下的参考截图和当前实现代码为准。

## Visual Standard

- dark mode first
- Apple / Linear / ChatGPT-like
- mostly black, white, gray
- professional academic tool feeling
- text-first hierarchy
- minimal icons
- compact controls
- no large colorful dashboard cards
- no playful gamification

## Layout Pattern

Desktop-first application layout：

```text
top module navigation
left sidebar
main content area
right detail/settings/action panel when useful
```

Module expectations：

- AI Solver：workflow page, upload -> confirm -> structured analysis, collapsible result sections。
- Problem Bank：searchable database, filters, table, preview, right selected-problem panel。
- Article Plaza：article list + reading pane + right article info/actions。
- Personal Library：file/document system, tabs, table, folders/problem sets/documents。
- Editor：serious rich text writing tool, toolbar, problem reference blocks, right settings/actions。

## Reference Screenshots

Local screenshots in `design/` 目录：

- AI Solver：`design/ChatGPT Image Apr 27, 2026, 02_57_54 PM (1).png`
- Problem Bank：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (2).png`
- Article Plaza：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (3).png`
- Personal Library：`design/ChatGPT Image Apr 27, 2026, 02_57_55 PM (4).png`
- Editor：`design/ChatGPT Image Apr 27, 2026, 02_57_56 PM (5).png`

## Frontend Workflow

Before implementation：

- 查看 `design/` 目录下的目标截图。
- 理解目标页面的布局和交互。
- 遵循 CPHO 产品规则。

During implementation：

- 使用 Next.js、React、TypeScript、Tailwind CSS 和本地组件原语。
- 不引入公共注册、通用聊天、伪造检索数据、客户端 AI secrets。

After implementation：

- 提供实现截图、录屏或本地浏览器验证说明。
- 检查与参考截图的视觉差异。
- 运行 `npm run dev` 启动本地 server，让用户验收。
- 包含 changed files 和 build/lint result。

## Component Rules

- Use tables for data-heavy views。
- Use collapsible sections for structured AI output。
- Use right-side panels for metadata, settings, and actions when useful。
- Use small, composable components。
- Prefer Tailwind CSS and established project primitives。
- Avoid unnecessary animation。
- Do not introduce new UI libraries without explaining why。

## Required States

Each implemented page must handle：

- loading
- empty
- error
- permission denied
- selected item
- disabled unauthorized action

Disabled UI is only a visual aid; server permissions still decide.
