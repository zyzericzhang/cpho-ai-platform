# Product Spec

本文件是 CPHO AI Training System 的产品事实来源。原始材料保留在同目录模块规格中：`Overview.md`、`v1-overview (1).md`、`ai-solver.md`、`problem-bank.md`、`article-square.md`、`editor.md`、`personal-library.md`。

## Product Positioning

CPHO AI Training System 是内部测试版物理竞赛 AI 学习平台，面向 selected students、coaches、admins。它不是公开社区，也不是 generic chatbot。

核心价值：

```text
学生上传或选择一道物理竞赛题，基于题目和标准答案获得高质量、结构化、适合竞赛学习的 AI 解析。
```

## Roles and Accounts

- v1 requires simple login。
- no public registration。
- first users are manually created or distributed。
- roles：`student`、`admin`。
- student 使用学习功能。
- admin 使用学习功能，并管理公共 Problem Bank 内容。

## Official Modules

1. AI Solver
2. Problem Bank
3. Article Plaza
4. Personal Library
5. Admin capabilities inside relevant modules

## AI Solver

AI Solver 是 v1 核心模块。当前 validation flow：

1. User uploads material first；pure text-first input is not supported。
2. Supported uploads：1-10 images、1 PDF、1 DOCX。
3. Old `.doc` is not supported。
4. User can upload problem and standard answer separately。
5. User can upload one combined file containing both。
6. Gemini/OpenRouter directly receives supported multimodal problem and answer materials for analysis。
7. AI analysis can only run after problem material and standard-answer material both exist。
8. AI returns fixed structured sections。

Fixed sections：

- Step-by-step derivation
- Physical reasoning reconstruction
- Related models / similar problems
- Related articles
- Key handling
- Write article
- Add to personal library

Hard rules：

- No standard answer, no AI solution。
- Similar problems must come from real Problem Bank retrieval。
- Related articles must come from real Article Plaza retrieval。
- If retrieval is not implemented, UI must say retrieval is not connected。
- The model must not invent fake problem/article records。

## Problem Bank

Problem Bank 是 admin-managed public resource library。

student can：

- browse/search/view problems
- view papers
- start AI analysis from a problem
- save problem to Personal Library
- jump from article references to problem detail

admin can：

- upload full paper PDF
- create single problem objects
- fill problem statement and standard answer
- assign source paper
- fill year、institution、type、difficulty
- fill topic tags and model tags
- publish to public Problem Bank

v1 does not do AI automatic problem splitting。Admins manually create problem objects and standard answers。

## Article Plaza and Editor

Article Plaza 是 public reading area for published documents，不是社区。

v1 supports：

- article list/search/reading
- writing and publishing articles
- public/private visibility
- topic/model tags
- articles linked to one or more problems
- embedded problem references in article body

v1 does not support comments、likes、recommendations、article review、complex social features。

Object rule：

- Personal document and public article are the same object。
- A private document can become a public article。
- Editing the document changes the public article。

Editor should be rich text first, not Markdown + preview first。

## Personal Library

Personal Library organizes a user's own learning materials：

- saved problems
- personal documents/articles
- problem sets
- folders

Rules：

- problem set and folder are different object types。
- problem set contains problems。
- folder contains problem sets and documents。
- AI Solver sessions do not directly appear inside Personal Library。

## Out of Scope for v1

- public registration
- comments / likes / recommendations
- article review
- complex social graph
- student upload to public Problem Bank
- AI automatic problem splitting
- fake AI-generated similar problem/article records
- exposing AI keys to client code
