"use client";

import { useMemo, useState } from "react";
import {
  analysisSections,
  libraryItems,
  modules,
  problems,
  type ModuleConfig,
  type ModuleId,
  type Role,
  type ShellState,
} from "@/lib/shell-data";

const shellStates: ShellState[] = ["ready", "loading", "empty", "error", "permission"];

export function AppShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("solver");
  const [shellState, setShellState] = useState<ShellState>("ready");
  const [role, setRole] = useState<Role>("student");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const active = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === activeModule) ?? modules[0],
    [activeModule],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b0d] text-zinc-100">
      <TopBar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="grid min-h-[calc(100vh-54px)] grid-cols-[246px_minmax(0,1fr)_280px] max-[1080px]:grid-cols-[220px_minmax(0,1fr)] max-[760px]:grid-cols-1">
        <Sidebar active={active} role={role} />
        <section className="min-w-0 border-r border-zinc-800/90 bg-[#080b0d] px-7 py-6 max-[760px]:px-4">
          <ModuleHeader
            active={active}
            role={role}
            onRoleChange={setRole}
            shellState={shellState}
            onStateChange={setShellState}
          />
          <StateSurface
            active={active}
            shellState={shellState}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            role={role}
          />
        </section>
        <RightPanel active={active} role={role} shellState={shellState} />
      </div>
    </main>
  );
}

function TopBar({
  activeModule,
  onModuleChange,
}: {
  activeModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
}) {
  return (
    <header className="grid h-[54px] grid-cols-[246px_minmax(0,1fr)_180px] items-center border-b border-zinc-800/90 bg-[#0b0f12]/95 max-[1080px]:grid-cols-[220px_minmax(0,1fr)_128px] max-[760px]:h-auto max-[760px]:grid-cols-1 max-[760px]:gap-3 max-[760px]:px-4 max-[760px]:py-3">
      <div className="flex items-center gap-3 px-5">
        <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-zinc-500 text-[10px] font-semibold">
          C
        </span>
        <span className="text-sm font-semibold tracking-normal">CPHO AI Training System</span>
      </div>
      <nav className="flex h-full items-center justify-center gap-8 text-sm text-zinc-400 max-[760px]:h-auto max-[760px]:flex-wrap max-[760px]:justify-start max-[760px]:gap-x-5 max-[760px]:gap-y-2">
        {modules.map((moduleItem) => (
          <button
            key={moduleItem.id}
            type="button"
            onClick={() => onModuleChange(moduleItem.id)}
            className={`relative h-full min-w-max px-1 transition-colors max-[760px]:h-8 ${
              activeModule === moduleItem.id ? "text-zinc-50" : "hover:text-zinc-200"
            }`}
          >
            {moduleItem.label}
            {activeModule === moduleItem.id ? (
              <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-100" />
            ) : null}
          </button>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-3 px-5 text-xs text-zinc-400 max-[760px]:hidden">
        <span>Search</span>
        <span>Alerts</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-zinc-100">
          YS
        </span>
      </div>
    </header>
  );
}

function Sidebar({ active, role }: { active: ModuleConfig; role: Role }) {
  return (
    <aside className="flex min-h-full flex-col justify-between border-r border-zinc-800/90 bg-[#090d10] max-[760px]:hidden">
      <div className="space-y-6 p-5">
        {modules.map((moduleItem) => (
          <section key={moduleItem.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-zinc-100">
              <span>{moduleItem.label}</span>
            <span className="text-zinc-500">Collapse</span>
            </div>
            <div className="space-y-1">
              {moduleItem.sidebar.map((item) => {
                const disabled = item.adminOnly && role !== "admin";
                const selected = active.id === moduleItem.id && item.label === moduleItem.sidebar[0].label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors ${
                      selected
                        ? "bg-zinc-800/70 text-zinc-50"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                    title={disabled ? "Admin role required" : item.label}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="flex h-14 items-center justify-between border-t border-zinc-800 px-5 text-sm text-zinc-400">
        <span>Settings</span>
        <span>Collapse</span>
      </div>
    </aside>
  );
}

function ModuleHeader({
  active,
  role,
  onRoleChange,
  shellState,
  onStateChange,
}: {
  active: ModuleConfig;
  role: Role;
  onRoleChange: (role: Role) => void;
  shellState: ShellState;
  onStateChange: (state: ShellState) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-3 text-sm text-zinc-500">{active.eyebrow}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-50">{active.title}</h1>
          <span className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ready for analysis
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Created 2 minutes ago <span className="mx-2 text-zinc-700">.</span> Updated just now
        </p>
      </div>
      <div className="flex flex-col items-end gap-3 max-[760px]:items-start">
        <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-1 text-xs">
          {(["student", "admin"] as Role[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onRoleChange(option)}
              className={`rounded px-3 py-1.5 capitalize ${
                role === option ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-1 text-xs max-[760px]:justify-start">
          {shellStates.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => onStateChange(state)}
              className={`rounded border px-2.5 py-1 capitalize ${
                shellState === state
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateSurface({
  active,
  shellState,
  selectedIndex,
  onSelectedIndexChange,
  role,
}: {
  active: ModuleConfig;
  shellState: ShellState;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  role: Role;
}) {
  if (shellState === "loading") {
    return <Notice title="Loading workspace" body="Preparing the selected module shell and local placeholder state." />;
  }

  if (shellState === "empty") {
    return <Notice title="No records yet" body="This module has no connected records in the local foundation build." />;
  }

  if (shellState === "error") {
    return <Notice tone="danger" title="Preview error" body="The shell can display recoverable module errors without leaving the app frame." />;
  }

  if (shellState === "permission") {
    return (
      <Notice
        tone="warning"
        title="Permission denied"
        body="Admin-only actions are disabled in the student role. Server-side checks and RLS will enforce this in later backend work."
      />
    );
  }

  return (
    <div className="space-y-3">
      {active.id === "solver" ? <SolverPanel active={active} role={role} /> : <WorkflowPanel active={active} role={role} />}
      {active.id === "bank" ? (
        <ProblemTable selectedIndex={selectedIndex} onSelectedIndexChange={onSelectedIndexChange} />
      ) : null}
      {active.id === "articles" ? <ArticleReader /> : null}
      {active.id === "library" ? <LibraryTable /> : null}
    </div>
  );
}

function WorkflowPanel({ active, role, compact = false }: { active: ModuleConfig; role: Role; compact?: boolean }) {
  const restricted = active.id === "bank" && role !== "admin";

  return (
    <section className={compact ? "" : "rounded-lg border border-zinc-800 bg-zinc-950/55 p-4"}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">{compact ? "Foundation Controls" : "Module controls"}</h2>
        <span className="text-xs text-zinc-500">Issue #1 foundation state</span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 max-[900px]:grid-cols-1">
        <button className="h-10 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950">
          {active.primaryAction}
        </button>
        <button className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200">
          {active.secondaryAction}
        </button>
        <button
          disabled={restricted}
          className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          title={restricted ? "Admin role required" : "Admin action available"}
        >
          Admin-only action
        </button>
      </div>
    </section>
  );
}

function SolverPanel({ active, role }: { active: ModuleConfig; role: Role }) {
  return (
    <>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">1. Uploaded Materials</h2>
          <button className="text-sm text-zinc-300 hover:text-zinc-50">Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          <FileCard title="Problem Material" fileName="problem_001.jpg" status="Image . 842 KB" />
          <FileCard title="Standard Answer Material" fileName="answer_001.pdf" status="PDF . 512 KB" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">Accepted formats: image, PDF, DOCX. Old .doc is not supported.</p>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">2. Confirm & Edit Extracted Text</h2>
          <button className="text-sm text-zinc-300 hover:text-zinc-50">Edit all</button>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1120px]:grid-cols-1">
          <ExtractedTextCard
            title="Problem Text"
            body="A uniform conducting rod of length L and mass m can slide without friction on two parallel rails separated by distance d. The system is in a uniform magnetic field B pointing vertically upward. A constant force F is applied to the rod along the rails."
          />
          <ExtractedTextCard
            title="Diagram Notes"
            body="Two long parallel rails are separated by d. A conducting rod of length L connects the rails and moves to the right. Current induced in the rod creates a magnetic force opposing the motion."
          />
          <ExtractedTextCard
            title="Standard Answer"
            body="Equation of motion: m dv/dt = F - (B^2 L^2 / R)v. Terminal speed: vt = FR / B^2 L^2. The confirmed standard answer unlocks structured analysis."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button className="h-9 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950">
            {active.primaryAction}
          </button>
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">3. AI Analysis</h2>
          <span className="text-xs text-emerald-400">Standard answer confirmed</span>
        </div>
        <div className="space-y-1">
          {analysisSections.map((section) => (
            <details key={section} className="rounded border border-zinc-800 bg-[#0b0f12] px-3 py-2">
              <summary className="cursor-pointer text-sm text-zinc-200">{section}</summary>
              <p className="mt-2 text-sm text-zinc-400">
                {section.includes("similar") || section.includes("articles")
                  ? "Retrieval is not connected in this foundation build, so no model-invented records are shown."
                  : "Structured output placeholder reserved for later AI Solver implementation."}
              </p>
            </details>
          ))}
        </div>
      </section>
      <WorkflowPanel active={active} role={role} compact />
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">Follow-up Q&A</h2>
        <input
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Ask a follow-up question about this problem or analysis..."
        />
      </section>
    </>
  );
}

function ExtractedTextCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="min-h-[210px] rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <button className="text-xs text-zinc-400 hover:text-zinc-100">Edit</button>
      </div>
      <p className="text-sm leading-6 text-zinc-300">{body}</p>
    </article>
  );
}

function FileCard({ title, fileName, status }: { title: string; fileName: string; status: string }) {
  return (
    <article className="rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
      <p className="mb-3 text-sm font-semibold text-zinc-100">{title}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-100">{fileName}</p>
          <p className="text-xs text-zinc-500">{status}</p>
        </div>
        <span className="text-emerald-400">Ready</span>
      </div>
    </article>
  );
}

function ProblemTable({
  selectedIndex,
  onSelectedIndexChange,
}: {
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/55">
      <div className="border-b border-zinc-800 p-3">
        <input
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Search problems by title, topic, keyword, or source..."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Problem</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Topics</th>
              <th className="px-4 py-3 font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr
                key={problem.title}
                onClick={() => onSelectedIndexChange(index)}
                className={`cursor-pointer border-t border-zinc-800 ${
                  selectedIndex === index ? "bg-zinc-800/55" : "hover:bg-zinc-900"
                }`}
              >
                <td className="px-4 py-3 text-zinc-100">{problem.title}</td>
                <td className="px-4 py-3 text-zinc-400">{problem.source}</td>
                <td className="px-4 py-3 text-zinc-400">{problem.year}</td>
                <td className="px-4 py-3">
                  <TagList tags={problem.topics} />
                </td>
                <td className="px-4 py-3">
                  <span className="rounded border border-red-500/50 px-2 py-0.5 text-xs text-red-300">
                    {problem.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ArticleReader() {
  return (
    <section className="grid grid-cols-[280px_minmax(0,1fr)] rounded-lg border border-zinc-800 bg-zinc-950/55 max-[900px]:grid-cols-1">
      <div className="border-r border-zinc-800 max-[900px]:border-r-0 max-[900px]:border-b">
        {["Uniform Magnetic Field Between Parallel Conducting Rails", "Lenz's Law and Induced Current Direction", "Energy Stored in an Inductor"].map(
          (title, index) => (
            <button
              key={title}
              className={`block w-full border-b border-zinc-800 p-4 text-left ${
                index === 0 ? "bg-zinc-800/55" : "hover:bg-zinc-900"
              }`}
            >
              <span className="block text-sm font-semibold text-zinc-100">{title}</span>
              <span className="mt-1 block text-xs text-zinc-500">Published document</span>
            </button>
          ),
        )}
      </div>
      <article className="space-y-4 p-6">
        <p className="text-xs text-zinc-500">Public Article / 8 min read</p>
        <h2 className="max-w-2xl text-2xl font-semibold text-zinc-50">
          Uniform Magnetic Field Between Parallel Conducting Rails
        </h2>
        <p className="max-w-3xl leading-7 text-zinc-300">
          Public article placeholder for the shared document object model. Related problems must come from
          real retrieval in later work; retrieval is not connected in this foundation build.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-[#0b0f12] p-4 text-sm text-zinc-400">
          Related problem retrieval is not connected.
        </div>
      </article>
    </section>
  );
}

function LibraryTable() {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/55">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 p-3">
        {["Saved Problems", "My Documents", "Problem Sets", "Folders"].map((tab, index) => (
          <button
            key={tab}
            className={`rounded-md px-3 py-2 text-sm ${
              index === 0 ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">In Folder / Set</th>
            </tr>
          </thead>
          <tbody>
            {libraryItems.map((item, index) => (
              <tr key={item.name} className={`border-t border-zinc-800 ${index === 0 ? "bg-zinc-800/55" : ""}`}>
                <td className="px-4 py-3 text-zinc-100">{item.name}</td>
                <td className="px-4 py-3 text-zinc-400">{item.type}</td>
                <td className="px-4 py-3 text-zinc-400">{item.updated}</td>
                <td className="px-4 py-3">
                  <TagList tags={[item.tag]} />
                </td>
                <td className="px-4 py-3 text-zinc-400">{item.folder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RightPanel({
  active,
  role,
  shellState,
}: {
  active: ModuleConfig;
  role: Role;
  shellState: ShellState;
}) {
  return (
    <aside className="space-y-4 bg-[#090d10] p-4 max-[1080px]:hidden">
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Problem Info</h2>
        <div className="space-y-4 text-sm">
          <Detail label="Topic" value={active.id === "solver" ? "Electromagnetism" : active.label} />
          <Detail label="Source" value={active.id === "solver" ? "IPhO 2016, Q2" : "Foundation placeholder"} />
          <Detail label="Difficulty" value={active.id === "solver" ? "Hard" : "Not connected"} />
          <Detail label="Role preview" value={role} />
          <Detail label="State" value={shellState} />
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Session Notes</h2>
          <button className="text-xs text-zinc-400 hover:text-zinc-100">Edit</button>
        </div>
        <textarea
          className="h-[106px] w-full resize-none rounded-md border border-zinc-800 bg-[#0b0f12] p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Add your notes for this session..."
        />
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Actions</h2>
        <div className="space-y-2">
          {["Save session", "Create article draft", "Add problem to library", "Export analysis (PDF)", "Share session"].map((action) => (
            <button
              key={action}
              className="h-9 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-left text-sm text-zinc-300 hover:text-zinc-100"
            >
              {action}
            </button>
          ))}
          <button className="h-9 w-full rounded-md border border-red-950/80 bg-[#0b0f12] px-3 text-left text-sm text-red-400">
            Delete draft
          </button>
        </div>
      </section>
      <p className="px-1 text-xs leading-5 text-zinc-500">
        Frontend-only foundation. Backend permissions, RLS, storage, and AI provider wiring are not implemented.
      </p>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 capitalize text-zinc-200">{value}</p>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300">
          {tag}
        </span>
      ))}
    </div>
  );
}

function Notice({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-900/70 text-red-200"
      : tone === "warning"
        ? "border-amber-800/70 text-amber-100"
        : "border-zinc-800 text-zinc-100";

  return (
    <section className={`rounded-lg border bg-zinc-950/55 p-8 ${toneClass}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">{body}</p>
    </section>
  );
}
