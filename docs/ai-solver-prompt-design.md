# AI Solver Prompt Design

本文定义 AI Solver 在“题目材料 + 标准答案材料”均已存在后的工程级提示词编排方案。目标不是把模型当通用聊天机器人，而是让 provider 层稳定地产出固定 7 板块、可校验、可分段生成、可被前端直接渲染的结构化结果。

本文默认输入为：

- 题目 PDF 或题目图片。
- 标准答案 PDF 或标准答案图片。
- 由服务端注入的 session、retrieval、长度预算和输出 schema。

产品当前可继续支持其他已批准的上传类型，但本文 prompt contract 聚焦用户明确要求的 PDF / 图片材料。任何模型调用前，服务端都必须先通过材料与权限 gate。

## 1. 设计目标与硬约束

### 1.1 Prompt 编排目标

AI Solver 的运行时当前采用“服务端固定规划 + 七个逐任务生成调用 + 服务端确定性聚合”。本文仍保留 provider planning / aggregation prompt 草案作为后续实验材料，但当前生产路径不依赖模型生成 task plan 或最终聚合 JSON。

当前运行时分三段执行：

1. 服务端任务拆分阶段：服务端按固定七板块实例化任务计划，每个子任务目标输出预计不超过 5000 个中文字符。
2. 逐任务内容生成阶段：依据拆分结果逐个生成详细内容，每个子任务目标输出预计不超过 5000 个中文字符。
3. 服务端最终聚合阶段：服务端将已校验的任务结果确定性装配为固定 7 板块输出。

这三段的职责必须严格分离：

- 拆分阶段只做计划，不写长篇解析；当前由服务端模板完成。
- 逐任务阶段只完成单一任务，不自行补全其他板块。
- 聚合阶段只整合已有子任务输出和服务端 retrieval 结果，不创造新的事实记录；当前由服务端代码完成。

### 1.2 产品与安全硬约束

- No standard answer, no AI solution。
- 题目材料和标准答案材料都必须存在，且属于当前 session / 当前用户，服务端才可发起分析。
- Prompt 不承担权限校验。权限、owner、上传数量、MIME、文件大小和材料角色必须由服务端先验证。
- 模型不得伪造 similar problems、related articles、problem id、article id、题目标题、文章来源、作者或出处。
- similar problems 必须来自真实 Problem Bank retrieval。
- related articles 必须来自真实 Article Plaza retrieval。
- 若检索尚未接入，或本次无可用检索结果，输出必须显式携带检索状态；前端只能基于该状态展示“未接入”或“暂无结果”，不能让模型编造补位内容。
- 模型可生成“相关模型解释”“为何这些检索结果相关”的文本，但不得篡改 retrieval record 的 id、title、metadata 或排序事实。
- 输入材料存在模糊、缺页、答案不完整或无法确认符号时，模型必须显式输出 warning，不得臆造缺失信息。

## 2. 输入合同

### 2.1 服务端调用前置条件

建议 provider orchestration 在调用 prompt 前构造以下布尔条件：

```json
{
  "has_problem_material": true,
  "has_standard_answer_material": true,
  "material_roles_validated": true,
  "session_owner_verified": true,
  "retrieval_payload_server_generated": true
}
```

任一前置条件为 `false` 时，不应发送 prompt，而应由 server route 返回业务错误。尤其是：

```text
No standard answer, no AI solution.
```

### 2.2 Multimodal 输入建议

每轮模型调用均应附带：

- `problem_materials[]`
  - 题目 PDF 页面或题目图片。
  - 保留原始页序、文件顺序和服务端 material id。
- `standard_answer_materials[]`
  - 标准答案 PDF 页面或标准答案图片。
  - 保留原始页序、文件顺序和服务端 material id。
- `retrieval_context`
  - Problem Bank 检索结果。
  - Article Plaza 检索结果。
  - 每类结果的 `status`。
- `analysis_context`
  - 语言：中文为主。
  - 学科：物理竞赛。
  - 输出模式：严格 JSON。

不建议把 OCR 文本当作唯一事实来源。若系统有 OCR / extraction，可作为辅助上下文传入，但 prompt 应明确“以 multimodal 原件为主，辅助文本只用于定位”。

## 3. 固定 7 板块映射

最终输出必须落入以下固定 7 板块，不新增第 8 个产品板块：

| 序号 | 最终 section key | 业务含义 | 主要来源 | 推荐子任务 |
| --- | --- | --- | --- | --- |
| 1 | `step_by_step_derivation` | 按标准答案重建逐步推导 | 题目 + 标准答案 | `derive_solution_steps` |
| 2 | `physical_reasoning_reconstruction` | 重建物理图景、关键假设、量纲和边界 | 题目 + 标准答案 | `reconstruct_physical_reasoning` |
| 3 | `related_models_similar_problems` | 模型归类说明 + 真实相似题记录 | 模型说明来自 AI；题目记录来自 retrieval | `explain_related_models` |
| 4 | `related_articles` | 相关文章导读 + 真实文章记录 | 导读来自 AI；文章记录来自 retrieval | `summarize_related_articles` |
| 5 | `key_handling` | 难点、易错点、标准答案中最关键的处理 | 题目 + 标准答案 | `extract_key_handling` |
| 6 | `write_article` | 将本题整理成学习文章的写作骨架 | 已生成解析内容 | `draft_article_plan` |
| 7 | `add_to_personal_library` | 标签、笔记与归档建议，不直接创建 library item | 已生成解析内容 | `suggest_library_metadata` |

映射规则：

- 一项子任务可以服务一个 section，但不能直接写入另一个 section。
- 聚合阶段允许把多个子任务内容摘要后映射到单一 section，但不得改变 section key。
- `write_article` 和 `add_to_personal_library` 只给建议，不执行发布、保存或数据 mutation。

## 4. 阶段一：任务拆分 Prompt

### 4.1 阶段目标

拆分阶段需要回答：

- 本题是否具备生成结构化解析的足够材料。
- 为 7 板块准备哪些子任务。
- 每个子任务要使用哪些输入、服务哪个 section、输出预算是多少。
- 哪些 retrieval 字段仅能透传，不能由模型生成。

拆分阶段不得输出完整解题正文。建议只输出任务计划 JSON，单次结果控制在 3000 个中文字符以内。

### 4.2 建议 system prompt

```text
You are the planning stage of a physics-competition AI Solver.

Your job is to inspect the provided problem materials and standard-answer materials,
then create a bounded execution plan for later generation stages.

Hard rules:
1. Do not write the final solution or long teaching content.
2. Do not proceed if either problem materials or standard-answer materials are missing.
3. Never fabricate similar problems, related articles, database ids, titles, authors, or sources.
4. Similar-problem records and related-article records are server-provided retrieval payloads only.
5. Every planned task must map to one of the fixed seven product sections.
6. Every task must define an expected target output within 5000 Chinese characters.
7. Return strict JSON that matches the required planning schema. Do not wrap JSON in Markdown.
```

### 4.3 建议 user prompt 模板

```text
Create the execution plan for this AI Solver session.

Fixed output sections:
1. step_by_step_derivation
2. physical_reasoning_reconstruction
3. related_models_similar_problems
4. related_articles
5. key_handling
6. write_article
7. add_to_personal_library

Input contract:
- Problem materials: attached PDF pages or images.
- Standard-answer materials: attached PDF pages or images.
- Retrieval payload is server-generated and must never be invented or expanded by the model.

Retrieval status:
{{retrieval_status_json}}

Retrieved similar problems:
{{similar_problem_records_json}}

Retrieved related articles:
{{related_article_records_json}}

Planning requirements:
- Produce only the task plan.
- Prefer one focused task for each final section.
- If one section depends on another task output, declare task dependencies.
- If the materials are unreadable or incomplete, include warnings and mark confidence accordingly.
- Every task budget must be <= 5000 Chinese characters.
- The fixed seven sections must all have a planning path, even when retrieval is not_connected.

Return JSON only.
```

### 4.4 任务拆分输出建议

任务拆分建议至少包含：

- `plan_version`
- `can_generate`
- `material_assessment`
- `tasks[]`
- `section_mapping`
- `retrieval_policy`
- `warnings[]`

推荐拆分任务：

| task id | section | 目标 |
| --- | --- | --- |
| `derive_solution_steps` | `step_by_step_derivation` | 按标准答案拆解推导链 |
| `reconstruct_physical_reasoning` | `physical_reasoning_reconstruction` | 解释物理图景和方法选择 |
| `explain_related_models` | `related_models_similar_problems` | 生成模型归类说明，不生成相似题记录 |
| `summarize_related_articles` | `related_articles` | 生成文章导读，不生成文章记录 |
| `extract_key_handling` | `key_handling` | 提炼难点、误区和关键转折 |
| `draft_article_plan` | `write_article` | 生成学习文章提纲和可插入模块 |
| `suggest_library_metadata` | `add_to_personal_library` | 生成标签、收藏笔记与归档建议 |

## 5. 阶段二：逐任务详细内容 Prompt

### 5.1 阶段目标

逐任务生成阶段读取单个 `task_plan.tasks[i]`，一次只生成一个子任务结果。这样做有四个直接收益：

- 将长解析拆小，降低 section 之间串写。
- 让每项输出都能单独做长度与 schema 校验。
- 可对失败 task 进行定向 retry。
- 可对 retrieval 依赖任务施加更严格的数据透传规则。

### 5.2 每个子任务的 5000 字约束

每个子任务都必须携带长度预算：

```json
{
  "target_char_limit": 5000,
  "budget_policy": "The generated content for this task must stay within 5000 Chinese characters, excluding JSON keys."
}
```

建议工程策略：

- Prompt 层声明 `< 5000 Chinese characters`。
- Provider 响应返回后，服务端按 Unicode 字符数或产品统一口径再次校验。
- 若超限，优先触发压缩重写，不在客户端静默截断。
- `write_article` 只产出文章提纲与 insertable blocks，不生成一整篇超长成文。
- `step_by_step_derivation` 若步骤多，应以“每步短段 + 公式说明”压缩，而不是扩写背景。

### 5.3 通用 system prompt

```text
You are generating exactly one planned task for a physics-competition AI Solver.

Use the task object provided by the server. Complete only that task.

Hard rules:
1. Problem materials and standard-answer materials are the authority for solution reasoning.
2. Do not invent unreadable symbols, missing intermediate facts, or absent numerical values.
3. Do not generate database records for similar problems or related articles.
4. Retrieved records, when present, are immutable server-provided facts. You may explain relevance, but you must not alter ids, titles, authors, or source fields.
5. Keep the generated task content within the declared target_char_limit, which is never above 5000 Chinese characters.
6. If confidence is reduced by unreadable input or answer ambiguity, return warnings instead of hallucinating.
7. Return strict JSON matching the task output schema. Do not wrap JSON in Markdown.
```

### 5.4 通用 user prompt 模板

```text
Generate one AI Solver task result.

Task:
{{task_json}}

Problem materials:
- Attached PDF pages or images represent the problem statement.

Standard-answer materials:
- Attached PDF pages or images represent the official or confirmed standard answer.

Dependencies already completed:
{{dependency_outputs_json}}

Retrieval status:
{{retrieval_status_json}}

Retrieved similar problems:
{{similar_problem_records_json}}

Retrieved related articles:
{{related_article_records_json}}

Output requirements:
- Complete only task.section_key.
- Respect task.target_char_limit.
- Preserve the fixed section semantics.
- If retrieval status is not_connected, return no fabricated records and mention the status only in the structured retrieval fields where the schema allows it.
- If retrieval status is connected but the server supplied an empty result list, return an empty list and do not invent fillers.
- Return JSON only.
```

### 5.5 各任务的专用提示点

#### `derive_solution_steps`

- 目标：从标准答案回推一条学生可跟随的推导链。
- 需要保留题设、未知量、约束、关键公式、代数变形和答案闭合关系。
- 不得为了“更好讲”而替换标准答案主路径，除非以 warning 指出答案存在明显缺口。

#### `reconstruct_physical_reasoning`

- 目标：解释为何选择某物理模型、近似和守恒关系。
- 优先说明图景、变量依赖、极限情况、符号物理意义。
- 不重复完整代数推导。

#### `explain_related_models`

- 目标：生成 `model_explanation`。
- `similar_problems[]` 只能透传服务端给出的 retrieval record。
- 未接 retrieval 时，输出空数组，不用自然语言伪造“可能相似题”。

#### `summarize_related_articles`

- 目标：生成相关文章导读 `summary`。
- `articles[]` 只能透传服务端给出的 retrieval record。
- 未接 retrieval 时，输出空数组，不虚构“推荐阅读”。

#### `extract_key_handling`

- 目标：提炼本题最容易错的 3 到 7 个处理点。
- 每个处理点应含“误区 -> 正确处理 -> 与标准答案的关系”。

#### `draft_article_plan`

- 目标：给出学习文章结构，不直接发布文章。
- 输出 `suggested_outline` 和 `insertable_blocks[]`。
- insertable blocks 应是可编辑的短内容模块，例如定义框、常见误区框、关键推导框。

#### `suggest_library_metadata`

- 目标：辅助用户保存理解，不直接写库。
- 输出建议 tags、1 段 suggested note、可选 folder hint。
- 不声称“已加入 Personal Library”。

## 6. 阶段三：最终聚合 Prompt

### 6.1 阶段目标

最终聚合阶段接收：

- 阶段一 `task_plan`。
- 阶段二全部 `task_outputs[]`。
- 服务端原始 retrieval records。
- `retrieval_status`。

它只负责：

- 把各 task 映射回固定 7 section。
- 去重。
- 统一中文语气与术语。
- 将 warning 汇总。
- 保障最终 JSON 可供 UI 渲染。

它不负责：

- 重新解题。
- 新增未在 task outputs 中出现的主要结论。
- 创建、改写或补全 retrieval records。

### 6.2 建议 system prompt

```text
You are the aggregation stage of a physics-competition AI Solver.

Merge validated task outputs into the final fixed seven-section response.

Hard rules:
1. Do not introduce new solution claims beyond the supplied task outputs, except light connective wording needed for coherence.
2. Do not fabricate or mutate similar-problem records or related-article records.
3. Use the server-provided retrieval records exactly as supplied.
4. Preserve the seven fixed section keys and their intended meanings.
5. Merge warnings without hiding material ambiguity.
6. Return strict JSON matching the final AI Solver output schema. Do not wrap JSON in Markdown.
```

### 6.3 建议 user prompt 模板

```text
Aggregate the AI Solver analysis into the final product response.

Task plan:
{{task_plan_json}}

Validated task outputs:
{{task_outputs_json}}

Retrieval status:
{{retrieval_status_json}}

Retrieved similar problems:
{{similar_problem_records_json}}

Retrieved related articles:
{{related_article_records_json}}

Final requirements:
- Output exactly the fixed seven sections.
- Reuse retrieval records exactly; do not create any record not present in the server payload.
- Preserve empty retrieval lists when status is not_connected or when no record was found.
- Consolidate warnings.
- Return JSON only.
```

## 7. Retrieval 真实性设计

### 7.1 推荐 retrieval 状态

建议区分以下状态：

```json
{
  "similar_problems": "not_connected",
  "related_articles": "not_connected"
}
```

可选枚举：

- `not_connected`：产品或环境尚未接真实检索。
- `connected_no_results`：已检索但没有结果。
- `connected_with_results`：已检索且有结果。
- `failed`：检索服务出错，服务端应决定是否允许主分析继续。

### 7.2 模型被允许与禁止的行为

允许：

- 根据题目内容生成“本题属于何种模型”的文字说明。
- 根据服务端检索记录，说明某条真实记录为何相关。
- 在 retrieval 未接入时，保留空数组并回传结构化状态。

禁止：

- 自行创造 Problem Bank id。
- 自行创造 Article Plaza id。
- 自行编文章标题、作者、年份、来源。
- 因为空数组而补写“示例相似题”。
- 用模型记忆替代数据库检索。

### 7.3 聚合层防漂移策略

建议服务端在聚合后做以下一致性校验：

- 最终输出中的 `similar_problems[].id` 必须来自 retrieval payload。
- 最终输出中的 `articles[].id` 必须来自 retrieval payload。
- 未接检索时，两个列表必须为空。
- record 数量不得超过服务端传入数量。
- record 的 `title`、`source`、`author` 等关键字段不得被模型改写。

## 8. 建议 JSON Schema 与字段

以下 schema 是工程建议，便于后续转为 Zod、JSON Schema 或 provider response format。字段名可按代码侧类型系统微调，但语义不应弱化。

### 8.1 阶段一：Task Plan Schema

```json
{
  "type": "object",
  "required": [
    "plan_version",
    "can_generate",
    "material_assessment",
    "tasks",
    "section_mapping",
    "retrieval_policy",
    "warnings"
  ],
  "properties": {
    "plan_version": {
      "type": "string"
    },
    "can_generate": {
      "type": "boolean"
    },
    "material_assessment": {
      "type": "object",
      "required": [
        "problem_material_readability",
        "standard_answer_readability",
        "answer_alignment_confidence"
      ],
      "properties": {
        "problem_material_readability": {
          "type": "string",
          "enum": ["clear", "partial", "unreadable"]
        },
        "standard_answer_readability": {
          "type": "string",
          "enum": ["clear", "partial", "unreadable"]
        },
        "answer_alignment_confidence": {
          "type": "string",
          "enum": ["high", "medium", "low"]
        }
      }
    },
    "tasks": {
      "type": "array",
      "minItems": 7,
      "items": {
        "type": "object",
        "required": [
          "task_id",
          "section_key",
          "objective",
          "input_focus",
          "dependencies",
          "target_char_limit",
          "expected_fields"
        ],
        "properties": {
          "task_id": {
            "type": "string"
          },
          "section_key": {
            "type": "string",
            "enum": [
              "step_by_step_derivation",
              "physical_reasoning_reconstruction",
              "related_models_similar_problems",
              "related_articles",
              "key_handling",
              "write_article",
              "add_to_personal_library"
            ]
          },
          "objective": {
            "type": "string"
          },
          "input_focus": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "dependencies": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "target_char_limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5000
          },
          "expected_fields": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "section_mapping": {
      "type": "object"
    },
    "retrieval_policy": {
      "type": "object",
      "required": [
        "similar_problem_records_must_be_server_supplied",
        "related_article_records_must_be_server_supplied"
      ],
      "properties": {
        "similar_problem_records_must_be_server_supplied": {
          "type": "boolean",
          "const": true
        },
        "related_article_records_must_be_server_supplied": {
          "type": "boolean",
          "const": true
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

### 8.2 阶段二：Task Output Schema

```json
{
  "type": "object",
  "required": [
    "task_id",
    "section_key",
    "content",
    "structured_payload",
    "char_count_estimate",
    "warnings"
  ],
  "properties": {
    "task_id": {
      "type": "string"
    },
    "section_key": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "structured_payload": {
      "type": "object"
    },
    "char_count_estimate": {
      "type": "integer",
      "maximum": 5000
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

`structured_payload` 可按 section 细化：

- `related_models_similar_problems`
  - `model_explanation`
  - `similar_problems[]`
- `related_articles`
  - `summary`
  - `articles[]`
- `write_article`
  - `suggested_outline`
  - `insertable_blocks[]`
- `add_to_personal_library`
  - `suggested_tags[]`
  - `suggested_note`
  - `folder_hint`

### 8.3 Retrieval Record 字段建议

```json
{
  "similar_problem_record": {
    "id": "string",
    "title": "string",
    "source_paper": "string",
    "year": "number",
    "institution": "string",
    "difficulty": "string",
    "topic_tags": ["string"],
    "model_tags": ["string"],
    "retrieval_score": "number"
  },
  "related_article_record": {
    "id": "string",
    "title": "string",
    "author_display_name": "string",
    "visibility": "public",
    "topic_tags": ["string"],
    "model_tags": ["string"],
    "retrieval_score": "number"
  }
}
```

字段策略：

- `id`、`title`、`source_paper`、`author_display_name` 均由服务端提供。
- 模型输出可以引用这些字段，但不得新增、删改或覆盖。
- 如果某字段数据库暂无值，服务端应决定传 `null`、空字符串或省略；模型不得“补全合理值”。

### 8.4 阶段三：Final Output Schema

```json
{
  "type": "object",
  "required": [
    "sections",
    "retrieval_status",
    "warnings"
  ],
  "properties": {
    "sections": {
      "type": "object",
      "required": [
        "step_by_step_derivation",
        "physical_reasoning_reconstruction",
        "related_models_similar_problems",
        "related_articles",
        "key_handling",
        "write_article",
        "add_to_personal_library"
      ],
      "properties": {
        "step_by_step_derivation": {
          "type": "string"
        },
        "physical_reasoning_reconstruction": {
          "type": "string"
        },
        "related_models_similar_problems": {
          "type": "object",
          "required": [
            "model_explanation",
            "similar_problems"
          ],
          "properties": {
            "model_explanation": {
              "type": "string"
            },
            "similar_problems": {
              "type": "array"
            }
          }
        },
        "related_articles": {
          "type": "object",
          "required": [
            "summary",
            "articles"
          ],
          "properties": {
            "summary": {
              "type": "string"
            },
            "articles": {
              "type": "array"
            }
          }
        },
        "key_handling": {
          "type": "string"
        },
        "write_article": {
          "type": "object",
          "required": [
            "suggested_outline",
            "insertable_blocks"
          ],
          "properties": {
            "suggested_outline": {
              "type": "string"
            },
            "insertable_blocks": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "add_to_personal_library": {
          "type": "object",
          "required": [
            "suggested_tags",
            "suggested_note"
          ],
          "properties": {
            "suggested_tags": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "suggested_note": {
              "type": "string"
            },
            "folder_hint": {
              "type": "string"
            }
          }
        }
      }
    },
    "retrieval_status": {
      "type": "object",
      "required": [
        "similar_problems",
        "related_articles"
      ],
      "properties": {
        "similar_problems": {
          "type": "string",
          "enum": [
            "not_connected",
            "connected_no_results",
            "connected_with_results",
            "failed"
          ]
        },
        "related_articles": {
          "type": "string",
          "enum": [
            "not_connected",
            "connected_no_results",
            "connected_with_results",
            "failed"
          ]
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

## 9. 建议执行顺序

当前 provider orchestration：

```text
server validates session, ownership, uploads, answer gate
-> retrieval service fetches real Problem Bank / Article Plaza records or returns status
-> server creates fixed seven-section task_plan
-> task runner loops through the seven approved tasks
-> per-task schema validation and <= 5000 character validation
-> server deterministic aggregation returns fixed seven-section final output
-> final server-side schema validation and retrieval record consistency checks
-> persist output for AI Solver session
```

Future experimental path may re-enable provider planning and provider aggregation prompts from this document after they are proven stable against real PDF inputs.

## 10. 失败与重试原则

- 材料缺失：服务端直接拒绝，不调用模型。
- 标准答案缺失：服务端直接拒绝，不调用模型。
- 拆分 JSON 不合法：当前不会发生，因为拆分由服务端固定模板生成；若未来重启 provider planning，则仅重试拆分 prompt。
- 单 task 超过 5000 字：仅重试该 task，追加“compress without losing correctness”约束。
- 单 task schema 不合法：仅重试该 task。
- 聚合 schema 不合法：当前应修服务端 assembler 或 normalization；若未来重启 provider aggregation，则重试聚合，不重跑全部 task。
- retrieval status 为 `not_connected`：主分析可继续，但两个 record list 必须为空。
- retrieval service `failed`：由产品决定是否返回主分析；若返回，UI 必须显示检索不可用，而不是伪造替代结果。

## 11. 最小验收清单

- [ ] Prompt 流程明确分为任务拆分、逐任务生成、最终聚合。
- [ ] 每个子任务都声明不超过 5000 中文字符的目标输出预算。
- [ ] 最终输出严格映射固定 7 板块。
- [ ] 输入合同明确为题目 PDF / 图片 + 标准答案 PDF / 图片。
- [ ] 标准答案 gate 在 prompt 外、服务端先执行。
- [ ] similar problems / related articles 只能来自真实 retrieval。
- [ ] retrieval 未接入时输出空数组和 `not_connected`，不得模型编造。
- [ ] 建议 JSON schema 足以支撑计划、子任务和最终结果三段校验。
