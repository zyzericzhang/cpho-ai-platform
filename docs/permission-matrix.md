# Permission Matrix

Roles：`student`、`admin`。v1 no public registration。

| Capability | student | admin | Enforcement |
|---|---:|---:|---|
| Login | yes | yes | Supabase Auth |
| Read own profile | yes | yes | `profiles.id = auth.uid()` |
| Change own role | no | no | controlled server/admin only |
| Read published problems | yes | yes | RLS `status = 'published'` |
| Upload public paper | no | yes | admin route + RLS |
| Create public problem | no | yes | admin route + RLS |
| Edit public problem | no | yes | admin route + RLS |
| Archive public problem | no | yes | admin route + RLS |
| Manage standard answers | no | yes | admin route + RLS |
| Search Problem Bank | yes | yes | authenticated read |
| Start AI Solver from problem | yes | yes | readable problem + own session |
| Upload personal AI Solver materials | yes | yes | owner-only |
| Run AI Solver | yes | yes | owner + confirmed standard answer |
| Read own AI sessions | yes | yes | `user_id = auth.uid()` |
| Read others' AI sessions | no | no by default | deny |
| Create private document | yes | yes | `owner_id = auth.uid()` |
| Edit own document | yes | yes | owner-only |
| Publish own document | yes | yes | owner-only |
| Read public article | yes | yes | `visibility = 'public'` |
| Read others' private document | no | no | deny |
| Edit others' document | no | no | deny |
| Create problem set | yes | yes | owner-only |
| Manage own folders | yes | yes | owner-only |
| Put problem into own problem set | yes | yes | owner set + readable problem |
| Put own document into own folder | yes | yes | owner folder + owner document |
| Put own problem set into own folder | yes | yes | owner folder + owner set |
| Manage tag dictionary | no | yes | admin route + RLS |

## RLS Plan

- `profiles`：owner select/update basic fields；admin select if needed。
- `problems`：published read for authenticated；admin all writes。
- `papers`：authenticated read；admin all writes。
- `problem_standard_answers`：read when linked problem is published；admin writes。
- `uploaded_materials`、`extracted_materials`、`ai_solver_sessions`、`ai_solution_outputs`、`ai_messages`：`user_id = auth.uid()` only。
- `documents`：owner all；public select when `visibility = 'public'`。
- `article_problem_links`、`embedded_problem_references`：read through public/owner document；owner writes。
- `library_items`、`problem_sets`、`problem_set_items`、`folders`、`folder_items`：owner-only。
- `tags`：authenticated read；admin writes。
- `problem_tags`：read through published problem；admin writes。
- `document_tags`：owner writes；read through public/owner document。

Server-side checks remain required. RLS is the second line of defense, not the only defense.
