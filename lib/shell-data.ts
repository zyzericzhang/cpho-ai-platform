export type ModuleId = "solver" | "bank" | "articles" | "library";
export type ShellState = "ready" | "loading" | "empty" | "error" | "permission";
export type Role = "student" | "admin";

export type ModuleConfig = {
  id: ModuleId;
  label: string;
  title: string;
  description: string;
  eyebrow: string;
  sidebar: Array<{
    label: string;
    badge?: string;
    adminOnly?: boolean;
  }>;
  primaryAction: string;
  secondaryAction: string;
};

export type ProblemRecord = {
  title: string;
  source: string;
  year: string;
  institution: string;
  type: string;
  topics: string[];
  modelTags: string[];
  difficulty: string;
  description: string;
};

export type ArticleRecord = {
  title: string;
  author: string;
  updated: string;
  readTime: string;
  tags: string[];
  relatedProblems: string[];
  excerpt: string;
};

export type LibraryItem = {
  name: string;
  type: string;
  updated: string;
  tag: string;
  folder: string;
  visibility: string;
};

export type LibraryGroup = {
  label: string;
  items: LibraryItem[];
};

export type ShellEmptyState = {
  title: string;
  description: string;
  actionLabel?: string;
};

export const modules: ModuleConfig[] = [
  {
    id: "solver",
    label: "AI 解题器",
    title: "AI 解题器",
    description: "上传题目与标准答案，确认文本后生成结构化竞赛解析。",
    eyebrow: "AI 解题器 / 当前会话",
    primaryAction: "运行结构化解析",
    secondaryAction: "重新选择材料",
    sidebar: [
      { label: "新建解析" },
      { label: "解析会话" },
      { label: "上传材料" },
      { label: "解析反馈" },
    ],
  },
  {
    id: "bank",
    label: "题库",
    title: "题库",
    description: "浏览和检索由管理员维护的公共物理竞赛题目。",
    eyebrow: "题库 / 题目浏览",
    primaryAction: "发起 AI 解析",
    secondaryAction: "打开题目详情",
    sidebar: [
      { label: "题目浏览" },
      { label: "按主题" },
      { label: "按赛事" },
      { label: "我的收藏" },
      { label: "上传试卷", adminOnly: true },
      { label: "创建题目", adminOnly: true },
    ],
  },
  {
    id: "articles",
    label: "文章广场",
    title: "文章广场",
    description: "阅读由个人文档发布而来的公开学习文章。",
    eyebrow: "文章广场 / 公开文章",
    primaryAction: "阅读文章",
    secondaryAction: "在编辑器中打开",
    sidebar: [
      { label: "公开文章" },
      { label: "按主题" },
      { label: "按赛事" },
      { label: "我的文章" },
    ],
  },
  {
    id: "library",
    label: "个人资料库",
    title: "个人资料库",
    description: "整理已保存题目、个人文档、题集和文件夹。",
    eyebrow: "个人资料库 / 我的资料",
    primaryAction: "打开选中项目",
    secondaryAction: "新建文档",
    sidebar: [
      { label: "已保存题目" },
      { label: "我的文档" },
      { label: "题集" },
      { label: "文件夹" },
    ],
  },
];

export const shellStateLabels: Record<ShellState, string> = {
  ready: "就绪",
  loading: "加载中",
  empty: "暂无数据",
  error: "加载失败",
  permission: "无权限",
};

export const moduleEmptyStates: Record<Exclude<ModuleId, "solver">, ShellEmptyState> = {
  bank: {
    title: "未接入真实题库数据",
    description: "题库必须来自数据库中的公共题目记录；当前未提供真实检索结果。",
    actionLabel: "等待题库接入",
  },
  articles: {
    title: "未接入公开文章数据",
    description: "文章广场只展示已发布的真实文档；当前未提供公开文章记录。",
    actionLabel: "等待文章接入",
  },
  library: {
    title: "暂无个人资料/未接入个人资料库数据",
    description: "个人资料库只展示当前用户拥有的题目、文档、题集和文件夹；当前未提供用户资料记录。",
    actionLabel: "等待个人资料库接入",
  },
};

export const analysisSections = [
  "分步推导",
  "物理思路重建",
  "相关模型 / 相似题目",
  "相关文章",
  "关键处理",
  "写成文章",
  "加入个人资料库",
];

export const problems: ProblemRecord[] = [];

export const articles: ArticleRecord[] = [];

export const libraryGroups: LibraryGroup[] = [];

export const libraryItems: LibraryItem[] = libraryGroups.flatMap((group) => group.items);
