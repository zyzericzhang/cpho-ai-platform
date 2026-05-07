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
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Magnetism", "Dynamics"],
    modelTags: ["Magnetic Force", "Induction", "EM"],
    difficulty: "Hard",
    description:
      "A conducting rod moves on rails in a uniform magnetic field. The solution depends on induced emf, magnetic drag, and terminal speed.",
  },
  {
    title: "Induced EMF in a Moving Loop",
    source: "IPhO Q1",
    year: "2015",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Electromagnetism", "Induction"],
    modelTags: ["Motional EMF", "Lenz Law"],
    difficulty: "Hard",
    description: "A moving loop changes magnetic flux and produces an induced current direction set by Lenz's law.",
  },
  {
    title: "Railway and Uniform Field",
    source: "IPhO Q3",
    year: "2014",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Mechanics", "Dynamics"],
    modelTags: ["Uniform Field", "Constraint"],
    difficulty: "Medium",
    description: "A constrained dynamics problem with uniform field assumptions and force balance.",
  },
  {
    title: "Wheatstone Bridge",
    source: "IPhO Q2",
    year: "2013",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Electricity", "Circuits"],
    modelTags: ["Circuit Model"],
    difficulty: "Medium",
    description: "A bridge circuit problem testing equivalent resistance and null-current reasoning.",
  },
  {
    title: "Spinning Disk and Charge",
    source: "IPhO Q1",
    year: "2012",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Electromagnetism", "Charge"],
    modelTags: ["Rotational EM"],
    difficulty: "Hard",
    description: "A rotating charged disk model requiring field and energy reconstruction.",
  },
  {
    title: "Young's Double Slit Variation",
    source: "IPhO Q3",
    year: "2011",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Optics", "Interference"],
    modelTags: ["Wave Optics"],
    difficulty: "Medium",
    description: "An interference setup with path difference and visibility constraints.",
  },
  {
    title: "Capacitor with Dielectric Slab",
    source: "IPhO Q2",
    year: "2010",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Electricity", "Capacitance"],
    modelTags: ["Energy Method"],
    difficulty: "Medium",
    description: "A capacitor model involving dielectric insertion and energy accounting.",
  },
  {
    title: "Satellite in Elliptical Orbit",
    source: "IPhO Q1",
    year: "2009",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Mechanics", "Gravitation"],
    modelTags: ["Kepler Orbit"],
    difficulty: "Hard",
    description: "An orbital mechanics problem using energy, angular momentum, and ellipse geometry.",
  },
  {
    title: "Newton's Rings",
    source: "IPhO Q3",
    year: "2008",
    institution: "International Physics Olympiad",
    type: "Experimental",
    topics: ["Optics", "Interference"],
    modelTags: ["Thin Film"],
    difficulty: "Medium",
    description: "A thin-film interference measurement problem with ring radius interpretation.",
  },
  {
    title: "RC Circuit Step Response",
    source: "IPhO Q2",
    year: "2007",
    institution: "International Physics Olympiad",
    type: "Theoretical",
    topics: ["Electricity", "Circuits"],
    modelTags: ["Differential Equation"],
    difficulty: "Easy",
    description: "A transient circuit problem using first-order exponential response.",
  },
];

export const articles = [
  {
    title: "Uniform Magnetic Field Between Parallel Conducting Rails",
    author: "Dr. Alan Turing",
    updated: "Updated 2 days ago",
    readTime: "8 min read",
    tags: ["Magnetic Force", "Induction", "EM", "Lorentz Force"],
    relatedProblems: ["Magnetic Rod Problem", "Induced EMF in a Moving Loop"],
    excerpt:
      "This article derives the force expression from first principles, analyzes the direction using the right-hand rule, and examines the role of rail resistance.",
  },
  {
    title: "Lenz's Law and Induced Current Direction",
    author: "Prof. Marie Curie",
    updated: "Updated 5 days ago",
    readTime: "6 min read",
    tags: ["Induction", "Lenz Law"],
    relatedProblems: ["Induced EMF in a Moving Loop"],
    excerpt: "A concise reconstruction of sign conventions and opposing flux changes in olympiad induction problems.",
  },
  {
    title: "Energy Stored in an Inductor",
    author: "Dr. James Clerk Maxwell",
    updated: "Updated 1 week ago",
    readTime: "7 min read",
    tags: ["Inductance", "Energy"],
    relatedProblems: ["RC Circuit Step Response"],
    excerpt: "A model-focused note connecting field energy to circuit equations and limiting behavior.",
  },
  {
    title: "Skin Depth in Good Conductors",
    author: "Dr. Hendrik Lorentz",
    updated: "Updated 1 week ago",
    readTime: "9 min read",
    tags: ["EM Waves", "Conductors"],
    relatedProblems: [],
    excerpt: "Wave attenuation in conductors with assumptions clearly separated from competition problem shortcuts.",
  },
];

export const libraryGroups = [
  {
    label: "Folders (3)",
    items: [
      { name: "Electromagnetism", type: "Folder", updated: "2026-05-22 10:12", tag: "-", folder: "-", visibility: "-" },
      { name: "Mechanics", type: "Folder", updated: "2026-05-18 09:41", tag: "-", folder: "-", visibility: "-" },
      { name: "Olympiad Prep", type: "Folder", updated: "2026-05-10 16:05", tag: "-", folder: "-", visibility: "-" },
    ],
  },
  {
    label: "Problem Sets (4)",
    items: [
      {
        name: "Magnetic Force - Rod on Rails",
        type: "Problem Set",
        updated: "2026-05-24 14:30",
        tag: "Magnetic Force",
        folder: "Electromagnetism",
        visibility: "Private",
      },
      {
        name: "Induction - Fundamentals",
        type: "Problem Set",
        updated: "2026-05-20 11:05",
        tag: "Induction",
        folder: "Electromagnetism",
        visibility: "Private",
      },
      {
        name: "Newtonian Mechanics Basics",
        type: "Problem Set",
        updated: "2026-05-16 21:18",
        tag: "Mechanics",
        folder: "Mechanics",
        visibility: "Private",
      },
      {
        name: "IPhO Past Problems 2016-2020",
        type: "Problem Set",
        updated: "2026-05-12 13:47",
        tag: "IPhO",
        folder: "Olympiad Prep",
        visibility: "Private",
      },
    ],
  },
  {
    label: "Documents (6)",
    items: [
      {
        name: "Lorentz Force Derivation Notes",
        type: "Document",
        updated: "2026-05-25 09:28",
        tag: "Lorentz Force",
        folder: "Electromagnetism",
        visibility: "Private",
      },
      {
        name: "Faraday's Law Summary",
        type: "Document",
        updated: "2026-05-22 17:11",
        tag: "Induction",
        folder: "Electromagnetism",
        visibility: "Public",
      },
      {
        name: "EM Formula Sheet",
        type: "Document",
        updated: "2026-05-19 10:02",
        tag: "Formula Sheet",
        folder: "Electromagnetism",
        visibility: "Private",
      },
      {
        name: "Kinematics Cheat Sheet",
        type: "Document",
        updated: "2026-05-17 08:34",
        tag: "Kinematics",
        folder: "Mechanics",
        visibility: "Public",
      },
      {
        name: "Study Plan - IPhO 2025",
        type: "Document",
        updated: "2026-05-14 19:50",
        tag: "Study Plan",
        folder: "Olympiad Prep",
        visibility: "Private",
      },
      {
        name: "Useful Integrals and Identities",
        type: "Document",
        updated: "2026-05-09 22:13",
        tag: "Math Tools",
        folder: "-",
        visibility: "Public",
      },
    ],
  },
];

export const libraryItems = libraryGroups.flatMap((group) => group.items);
