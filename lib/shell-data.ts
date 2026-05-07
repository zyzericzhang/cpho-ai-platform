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

export const modules: ModuleConfig[] = [
  {
    id: "solver",
    label: "AI Solver",
    title: "Magnetic Rod Problem",
    description: "Upload, confirm, and analyze a physics olympiad problem.",
    eyebrow: "AI Solver / Session / 2026-05-07 20:41",
    primaryAction: "Run structured analysis",
    secondaryAction: "Edit extracted text",
    sidebar: [
      { label: "New Analysis" },
      { label: "Sessions", badge: "12" },
      { label: "Uploaded Materials" },
      { label: "Feedback" },
    ],
  },
  {
    id: "bank",
    label: "Problem Bank",
    title: "Problem Bank",
    description: "Search public problems managed by admins.",
    eyebrow: "Problem Bank / Browse Problems",
    primaryAction: "Start AI analysis",
    secondaryAction: "Open full detail",
    sidebar: [
      { label: "Browse Problems" },
      { label: "By Topic" },
      { label: "By Competition" },
      { label: "My Collections" },
      { label: "Upload paper", adminOnly: true },
      { label: "Create problem", adminOnly: true },
    ],
  },
  {
    id: "articles",
    label: "Article Plaza",
    title: "Article Plaza",
    description: "Read public documents published from personal writing.",
    eyebrow: "Article Plaza / Latest Articles",
    primaryAction: "Read full article",
    secondaryAction: "Open in editor",
    sidebar: [
      { label: "Latest Articles" },
      { label: "By Topic" },
      { label: "By Competition" },
      { label: "Top Viewed" },
    ],
  },
  {
    id: "library",
    label: "Personal Library",
    title: "Personal Library",
    description: "Organize saved problems, documents, problem sets, and folders.",
    eyebrow: "Personal Library / My Problems",
    primaryAction: "Open selected item",
    secondaryAction: "New document",
    sidebar: [
      { label: "My Problems" },
      { label: "My Articles" },
      { label: "Bookmarks" },
      { label: "Notes" },
    ],
  },
];

export const analysisSections = [
  "Step-by-step derivation",
  "Physical reasoning reconstruction",
  "Related models / similar problems",
  "Related articles",
  "Key handling",
  "Write article",
  "Add to personal library",
];

export const problems = [
  {
    title: "Magnetic Rod Problem",
    source: "IPhO Q2",
    year: "2016",
    topics: ["Magnetism", "Dynamics"],
    difficulty: "Hard",
  },
  {
    title: "Induced EMF in a Moving Loop",
    source: "IPhO Q1",
    year: "2015",
    topics: ["Electromagnetism", "Induction"],
    difficulty: "Hard",
  },
  {
    title: "Wheatstone Bridge",
    source: "IPhO Q2",
    year: "2013",
    topics: ["Electricity", "Circuits"],
    difficulty: "Medium",
  },
  {
    title: "Satellite in Elliptical Orbit",
    source: "IPhO Q1",
    year: "2009",
    topics: ["Mechanics", "Gravitation"],
    difficulty: "Hard",
  },
];

export const libraryItems = [
  {
    name: "Lorentz Force Derivation Notes",
    type: "Document",
    updated: "2026-05-07 20:18",
    tag: "Lorentz Force",
    folder: "Electromagnetism",
  },
  {
    name: "Magnetic Force - Rod on Rails",
    type: "Problem Set",
    updated: "2026-05-06 18:30",
    tag: "Magnetic Force",
    folder: "Electromagnetism",
  },
  {
    name: "Olympiad Prep",
    type: "Folder",
    updated: "2026-05-04 09:41",
    tag: "-",
    folder: "-",
  },
];
