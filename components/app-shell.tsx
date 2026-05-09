"use client";

import { type User } from "@supabase/supabase-js";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  articles,
  libraryGroups,
  modules,
  problems,
  type ModuleConfig,
  type ModuleId,
  type Role,
  type ShellState,
} from "@/lib/shell-data";
import { createClient } from "@/lib/supabase/client";

const shellStates: ShellState[] = ["ready", "loading", "empty", "error", "permission"];

type AnalysisSectionKey =
  | "step_by_step_derivation"
  | "physical_reasoning_reconstruction"
  | "related_models_similar_problems"
  | "related_articles"
  | "key_handling"
  | "write_article"
  | "add_to_personal_library";

type FollowUpContext =
  | { type: "whole_analysis" }
  | { type: "section"; sectionKey: AnalysisSectionKey }
  | { type: "selected_text"; selection: { sectionKey: AnalysisSectionKey; text: string; startOffset: number; endOffset: number } }
  | { type: "follow_up"; parentMessageId: string };

type FollowUpMessage = {
  id: string;
  parentMessageId?: string | null;
  role: "user" | "assistant";
  content: string;
  context?: FollowUpContext;
  createdAt?: string;
};

type AnalysisPayload = {
  sections?: Partial<Record<AnalysisSectionKey, unknown>>;
  retrieval_status?: Partial<Record<"similar_problems" | "related_articles", string>>;
  warnings?: string[];
  provider?: {
    configured?: boolean;
    ran?: boolean;
  };
};

const fixedAnalysisSections: Array<{ key: AnalysisSectionKey; label: string }> = [
  { key: "step_by_step_derivation", label: "Step-by-step derivation" },
  { key: "physical_reasoning_reconstruction", label: "Physical reasoning reconstruction" },
  { key: "related_models_similar_problems", label: "Related models / similar problems" },
  { key: "related_articles", label: "Related articles" },
  { key: "key_handling", label: "Key handling" },
  { key: "write_article", label: "Write article" },
  { key: "add_to_personal_library", label: "Add to personal library" },
];

export function AppShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("solver");
  const [shellState, setShellState] = useState<ShellState>("ready");
  const [role, setRole] = useState<Role>("student");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setRole(profile.role as Role);
        }
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (profile) {
            setRole(profile.role as Role);
          }
        } else {
          setRole("student");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    alert("In a real app, this would redirect to /login or open an auth modal.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const active = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === activeModule) ?? modules[0],
    [activeModule],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b0d] text-zinc-100">
      <TopBar 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
        user={user}
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
      <div className="grid min-h-[calc(100vh-54px)] grid-cols-[246px_minmax(0,1fr)_300px] max-[1180px]:grid-cols-[220px_minmax(0,1fr)] max-[760px]:grid-cols-1">
        <Sidebar active={active} role={role} />
        <section className="min-w-0 border-r border-zinc-800/90 bg-[#080b0d] px-7 py-6 max-[760px]:px-4">
          <ModuleHeader
            active={active}
            role={role}
            onRoleChange={setRole}
            shellState={shellState}
            onStateChange={setShellState}
            isAuthMode={!!user}
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
  user,
  onLogout,
  onLogin,
}: {
  activeModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
  user: User | null;
  onLogout: () => void;
  onLogin: () => void;
}) {
  return (
    <header className="grid h-[54px] grid-cols-[246px_minmax(0,1fr)_180px] items-center border-b border-zinc-800/90 bg-[#0b0f12]/95 max-[1080px]:grid-cols-[220px_minmax(0,1fr)_128px] max-[760px]:h-auto max-[760px]:grid-cols-1 max-[760px]:gap-3 max-[760px]:px-4 max-[760px]:py-3">
      <div className="flex items-center gap-3 px-5">
        <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-zinc-500 text-[10px] font-semibold text-zinc-100">
          CP
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
        <button className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-zinc-800 hover:text-zinc-100" title="Search">
          /
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-zinc-800 hover:text-zinc-100" title="Notifications">
          !
        </button>
        {user ? (
          <>
            <button onClick={onLogout} className="hover:text-zinc-100">Logout</button>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-zinc-100" title={user.email}>
              {user.email?.[0].toUpperCase()}
            </span>
          </>
        ) : (
          <button onClick={onLogin} className="hover:text-zinc-100">Login</button>
        )}
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
              <span className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded border border-zinc-700 text-[10px] text-zinc-400">
                  {moduleItem.label.slice(0, 1)}
                </span>
                {moduleItem.label}
              </span>
              <span className="text-xs text-zinc-500">Collapse</span>
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
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full border border-zinc-600" />
                      <span className="truncate">{item.label}</span>
                    </span>
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
  isAuthMode,
}: {
  active: ModuleConfig;
  role: Role;
  onRoleChange: (role: Role) => void;
  shellState: ShellState;
  onStateChange: (state: ShellState) => void;
  isAuthMode: boolean;
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
        <div className="flex flex-col items-end gap-1">
          {isAuthMode && <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Profile Role</span>}
          <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-1 text-xs">
            {(["student", "admin"] as Role[]).map((option) => (
              <button
                key={option}
                type="button"
                disabled={isAuthMode}
                onClick={() => onRoleChange(option)}
                className={`rounded px-3 py-1.5 capitalize ${
                  role === option ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
                } ${isAuthMode ? "cursor-default" : ""}`}
              >
                {option}
              </button>
            ))}
          </div>
          {!isAuthMode && <span className="text-[10px] text-zinc-500 italic">Preview mode: selector enabled</span>}
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
  const [sessionId, setSessionId] = useState("");
  const [materialRole, setMaterialRole] = useState("combined");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; kind: string; sizeBytes: number }>>([]);
  const [problemText, setProblemText] = useState(
    "A uniform conducting rod of length L and mass m slides without friction on two parallel rails in a uniform magnetic field B. A constant force F is applied along the rails.",
  );
  const [diagramNotes, setDiagramNotes] = useState(
    "Extraction is not connected yet. Confirm or edit diagram notes manually.",
  );
  const [standardAnswer, setStandardAnswer] = useState("");
  const [confirmStandardAnswer, setConfirmStandardAnswer] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Create a session, upload material, then confirm the extracted fields.");
  const [analysisMessage, setAnalysisMessage] = useState("No standard answer, no AI solution.");
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [selectedContext, setSelectedContext] = useState<FollowUpContext>({ type: "whole_analysis" });
  const [selectionDraft, setSelectionDraft] = useState<Extract<FollowUpContext, { type: "selected_text" }> | null>(null);
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isFollowUpBusy, setIsFollowUpBusy] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("Follow-ups attach to this analysis and do not overwrite it.");
  const [isBusy, setIsBusy] = useState(false);

  const hasConfirmedAnswer = confirmStandardAnswer && standardAnswer.trim().length > 0;

  const createSessionIfNeeded = async () => {
    if (sessionId) {
      return sessionId;
    }

    const response = await fetch("/api/ai-solver/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Local AI Solver upload validation" }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to create session.");
    }

    setSessionId(payload.session.id);
    return payload.session.id as string;
  };

  const loadFollowUps = async (nextSessionId: string) => {
    try {
      const response = await fetch(`/api/ai-solver/follow-ups?sessionId=${encodeURIComponent(nextSessionId)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFollowUpMessage(payload.error ?? "Follow-up history is not connected yet.");
        return;
      }

      setMessages(normalizeFollowUpMessages(payload.messages));
      setFollowUpMessage("Follow-up history loaded.");
    } catch {
      setFollowUpMessage("Follow-up history is not connected yet.");
    }
  };

  const handleUpload = async () => {
    setIsBusy(true);
    setStatusMessage("Validating upload on the server...");

    try {
      const nextSessionId = await createSessionIfNeeded();
      const formData = new FormData();
      formData.set("sessionId", nextSessionId);
      formData.set("role", materialRole);
      selectedFiles.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/ai-solver/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload validation failed.");
      }

      setUploadedFiles(payload.uploads);
      setStatusMessage(`${payload.uploads.length} file(s) accepted. Extraction placeholder created; real extraction is not connected.`);
      setDiagramNotes("Extraction is not connected yet. Confirm or edit diagram notes manually.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirm = async () => {
    setIsBusy(true);

    try {
      const nextSessionId = await createSessionIfNeeded();
      const response = await fetch("/api/ai-solver/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: nextSessionId,
          problemText,
          diagramNotes,
          standardAnswer,
          confirmStandardAnswer,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Confirmation failed.");
      }

      setStatusMessage(
        payload.extraction.isStandardAnswerConfirmed
          ? "Standard answer confirmed. Server gate can now allow the next analysis step."
          : "Fields saved, but the standard answer is not confirmed.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Confirmation failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleAnalyze = async () => {
    setIsBusy(true);
    setAnalysisMessage("Saving confirmation before analysis...");

    try {
      const nextSessionId = await createSessionIfNeeded();
      const confirmResponse = await fetch("/api/ai-solver/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: nextSessionId,
          problemText,
          diagramNotes,
          standardAnswer,
          confirmStandardAnswer,
        }),
      });
      const confirmPayload = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmPayload.error ?? "Confirmation failed.");
      }

      if (!confirmPayload.extraction?.isStandardAnswerConfirmed) {
        throw new Error("Confirm a non-empty standard answer before running analysis.");
      }

      setStatusMessage("Standard answer confirmed. Running structured analysis...");
      const response = await fetch("/api/ai-solver/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: nextSessionId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis rejected.");
      }

      if (!payload.analysis?.sections) {
        setAnalysis(null);
        setAnalysisMessage("Analysis endpoint responded, but no structured analysis was returned yet.");
        return;
      }

      setAnalysis(payload.analysis);
      setAnalysisMessage(buildAnalysisStatus(payload.analysis));
      void loadFollowUps(nextSessionId);
    } catch (error) {
      setAnalysisMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSectionSelection = (sectionKey: AnalysisSectionKey, sectionText: string) => {
    const selectedText = window.getSelection()?.toString().trim() ?? "";

    if (!selectedText) {
      return;
    }

    const startOffset = Math.max(0, sectionText.indexOf(selectedText));
    const endOffset = startOffset + selectedText.length;
    setSelectionDraft({
      type: "selected_text",
      selection: {
        sectionKey,
        text: selectedText,
        startOffset,
        endOffset,
      },
    });
  };

  const handleAskFollowUp = async (overrideContext?: FollowUpContext, overrideQuestion?: string) => {
    const nextQuestion = (overrideQuestion ?? question).trim();
    const context = overrideContext ?? selectedContext;

    if (!nextQuestion) {
      setFollowUpMessage("Enter a follow-up question first.");
      return;
    }

    setIsFollowUpBusy(true);
    setFollowUpMessage("Sending follow-up...");

    try {
      const nextSessionId = await createSessionIfNeeded();
      const response = await fetch("/api/ai-solver/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: nextSessionId,
          parentMessageId: context.type === "follow_up" ? context.parentMessageId : undefined,
          context,
          prompt: nextQuestion,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Follow-up failed.");
      }

      const nextMessages = normalizeFollowUpMessages(
        payload.messages ?? [payload.userMessage, payload.assistantMessage].filter(Boolean),
      );
      setMessages((current) => mergeFollowUpMessages(current, nextMessages));
      setQuestion("");
      setSelectionDraft(null);
      setSelectedContext({ type: "whole_analysis" });
      setFollowUpMessage("Follow-up added to this analysis.");
    } catch (error) {
      setFollowUpMessage(error instanceof Error ? error.message : "Follow-up failed.");
    } finally {
      setIsFollowUpBusy(false);
    }
  };

  return (
    <>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">1. Uploaded Materials</h2>
          <span className="text-xs text-zinc-500">Server validation foundation</span>
        </div>
        <div className="grid grid-cols-[180px_minmax(0,1fr)_auto] gap-3 max-[900px]:grid-cols-1">
          <select
            value={materialRole}
            onChange={(event) => setMaterialRole(event.target.value)}
            className="h-10 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none"
          >
            <option value="combined">Combined</option>
            <option value="problem">Problem</option>
            <option value="answer">Answer</option>
          </select>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            className="h-10 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-xs file:text-zinc-100"
          />
          <button
            onClick={handleUpload}
            disabled={isBusy}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file) => (
              <FileCard
                key={file.fileName}
                title={`${materialRole} material`}
                fileName={file.fileName}
                status={`${file.kind.toUpperCase()} / ${formatBytes(file.sizeBytes)}`}
              />
            ))
          ) : (
            <Notice
              title="No uploaded material in this local session"
              body="Use the upload control to exercise the server-side file count, MIME, extension, and size checks."
            />
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-400">{statusMessage}</p>
        <p className="mt-3 text-xs text-zinc-500">Accepted formats: image, PDF, DOCX. Old .doc is not supported.</p>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">2. Confirm & Edit Extracted Text</h2>
          <span className="text-xs text-amber-300">Extraction not connected</span>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1120px]:grid-cols-1">
          <ExtractedTextCard
            title="Problem Text"
            body={problemText}
            onChange={setProblemText}
          />
          <ExtractedTextCard
            title="Diagram Notes"
            body={diagramNotes}
            onChange={setDiagramNotes}
          />
          <ExtractedTextCard
            title="Standard Answer"
            body={standardAnswer}
            onChange={setStandardAnswer}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={confirmStandardAnswer}
              onChange={(event) => setConfirmStandardAnswer(event.target.checked)}
              className="h-4 w-4 accent-zinc-100"
            />
            Confirm standard answer
          </label>
          <button
            onClick={handleConfirm}
            disabled={isBusy}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save confirmation
          </button>
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">3. AI Analysis</h2>
            <p className="mt-1 text-xs text-zinc-500">Seven fixed sections with attached follow-up threads</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isBusy || !hasConfirmedAnswer}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            title={!hasConfirmedAnswer ? "Confirm a non-empty standard answer first" : active.primaryAction}
          >
            {isBusy ? "Running..." : "Run structured analysis"}
          </button>
        </div>
        <div className="mb-3 rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
          <p className="text-sm text-zinc-300">{analysisMessage}</p>
          {analysis?.warnings?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-200">
              {analysis.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-3 max-[1100px]:grid-cols-1">
          <div className="space-y-1">
            {fixedAnalysisSections.map((section) => (
              <AnalysisSectionPanel
                key={section.key}
                sectionKey={section.key}
                label={section.label}
                value={analysis?.sections?.[section.key]}
                retrievalStatus={analysis?.retrieval_status}
                onAskSection={() => {
                  setSelectedContext({ type: "section", sectionKey: section.key });
                  setQuestion(`Explain the "${section.label}" section in more detail.`);
                }}
                onSelectText={(sectionText) => handleSectionSelection(section.key, sectionText)}
              />
            ))}
          </div>
          <section className="min-w-0 rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-100">Follow-up thread</h3>
              <span className="rounded border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                {messages.length} messages
              </span>
            </div>
            {selectionDraft ? (
              <div className="mb-3 rounded-md border border-zinc-700 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-200">Selected text</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContext(selectionDraft);
                      setQuestion("Can you explain this selected part?");
                    }}
                    className="h-7 rounded-md border border-zinc-700 px-2 text-xs text-zinc-200 hover:bg-zinc-900"
                  >
                    Ask about selection
                  </button>
                </div>
                <p className="line-clamp-4 text-xs leading-5 text-zinc-400">{selectionDraft.selection.text}</p>
              </div>
            ) : null}
            <FollowUpComposer
              question={question}
              onQuestionChange={setQuestion}
              context={selectedContext}
              onContextChange={setSelectedContext}
              disabled={isFollowUpBusy || !analysis}
              onSubmit={() => handleAskFollowUp()}
            />
            <p className="mt-2 text-xs text-zinc-500">{followUpMessage}</p>
            <ThreadedMessages
              messages={messages}
              onReply={(messageId) => {
                setSelectedContext({ type: "follow_up", parentMessageId: messageId });
                setQuestion("");
              }}
            />
          </section>
        </div>
      </section>
      <WorkflowPanel active={active} role={role} compact />
    </>
  );
}

function AnalysisSectionPanel({
  sectionKey,
  label,
  value,
  retrievalStatus,
  onAskSection,
  onSelectText,
}: {
  sectionKey: AnalysisSectionKey;
  label: string;
  value: unknown;
  retrievalStatus?: AnalysisPayload["retrieval_status"];
  onAskSection: () => void;
  onSelectText: (sectionText: string) => void;
}) {
  const sectionText = sectionToPlainText(value);
  const isRetrievalSection = sectionKey === "related_models_similar_problems" || sectionKey === "related_articles";

  return (
    <details className="rounded border border-zinc-800 bg-[#0b0f12] px-3 py-2" open={sectionKey === "step_by_step_derivation"}>
      <summary className="cursor-pointer select-none text-sm text-zinc-200">
        <span className="inline-flex w-full items-center justify-between gap-3 pr-2">
          <span>{label}</span>
          {isRetrievalSection ? (
            <span className="text-xs text-zinc-500">{getRetrievalLabel(sectionKey, retrievalStatus)}</span>
          ) : null}
        </span>
      </summary>
      <div
        data-section-key={sectionKey}
        onMouseUp={() => onSelectText(sectionText)}
        className="mt-3 select-text space-y-3 text-sm leading-6 text-zinc-300"
      >
        <SectionContent sectionKey={sectionKey} value={value} retrievalStatus={retrievalStatus} />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onAskSection}
          className="h-7 rounded-md border border-zinc-800 px-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
        >
          Ask about section
        </button>
      </div>
    </details>
  );
}

function SectionContent({
  sectionKey,
  value,
  retrievalStatus,
}: {
  sectionKey: AnalysisSectionKey;
  value: unknown;
  retrievalStatus?: AnalysisPayload["retrieval_status"];
}) {
  if (sectionKey === "related_models_similar_problems") {
    const related = isRecord(value) ? value : {};
    const problems = Array.isArray(related.similar_problems) ? related.similar_problems : [];

    return (
      <>
        <p>{typeof related.model_explanation === "string" && related.model_explanation ? related.model_explanation : "Model explanation will appear here after analysis."}</p>
        {problems.length > 0 ? (
          <div className="space-y-2">
            {problems.map((problem, index) => (
              <RetrievedRecord key={String(isRecord(problem) ? problem.id ?? index : index)} record={problem} fallbackLabel="Problem Bank record" />
            ))}
          </div>
        ) : (
          <EmptyRetrievalNotice label="Similar Problem Bank retrieval" status={retrievalStatus?.similar_problems} />
        )}
      </>
    );
  }

  if (sectionKey === "related_articles") {
    const related = isRecord(value) ? value : {};
    const records = Array.isArray(related.articles) ? related.articles : [];

    return (
      <>
        <p>{typeof related.summary === "string" && related.summary ? related.summary : "Related article summary will appear here after analysis."}</p>
        {records.length > 0 ? (
          <div className="space-y-2">
            {records.map((article, index) => (
              <RetrievedRecord key={String(isRecord(article) ? article.id ?? index : index)} record={article} fallbackLabel="Article Plaza record" />
            ))}
          </div>
        ) : (
          <EmptyRetrievalNotice label="Related Article Plaza retrieval" status={retrievalStatus?.related_articles} />
        )}
      </>
    );
  }

  if (sectionKey === "write_article") {
    const article = isRecord(value) ? value : {};
    const blocks = Array.isArray(article.insertable_blocks) ? article.insertable_blocks : [];

    return (
      <>
        <p>{typeof article.suggested_outline === "string" && article.suggested_outline ? article.suggested_outline : getEmptySectionText(sectionKey)}</p>
        {blocks.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-zinc-400">
            {blocks.map((block, index) => (
              <li key={`${String(block).slice(0, 24)}-${index}`}>{String(block)}</li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }

  if (sectionKey === "add_to_personal_library") {
    const library = isRecord(value) ? value : {};
    const tags = Array.isArray(library.suggested_tags) ? library.suggested_tags.map(String) : [];

    return (
      <>
        <p>{typeof library.suggested_note === "string" && library.suggested_note ? library.suggested_note : getEmptySectionText(sectionKey)}</p>
        {tags.length > 0 ? <TagList tags={tags} /> : null}
      </>
    );
  }

  if (typeof value === "string" && value.trim()) {
    return <p className="whitespace-pre-wrap">{value}</p>;
  }

  return <p className="text-zinc-500">{getEmptySectionText(sectionKey)}</p>;
}

function FollowUpComposer({
  question,
  onQuestionChange,
  context,
  onContextChange,
  disabled,
  onSubmit,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  context: FollowUpContext;
  onContextChange: (context: FollowUpContext) => void;
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onContextChange({ type: "whole_analysis" })}
          className={contextButtonClass(context.type === "whole_analysis")}
        >
          Whole analysis
        </button>
        {fixedAnalysisSections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => onContextChange({ type: "section", sectionKey: section.key })}
            className={contextButtonClass(context.type === "section" && context.sectionKey === section.key)}
          >
            {section.label.replace("Physical reasoning reconstruction", "Reasoning").replace("Related models / similar problems", "Similar").replace("Step-by-step derivation", "Derivation")}
          </button>
        ))}
      </div>
      <textarea
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        disabled={disabled}
        className="h-[86px] w-full resize-none rounded-md border border-zinc-800 bg-[#0b0f12] p-3 text-sm leading-5 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={disabled ? "Run analysis before asking follow-ups." : "Ask about the whole analysis, a section, selected text, or a prior answer..."}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-zinc-500">{contextLabel(context)}</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-xs font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  );
}

function ThreadedMessages({
  messages,
  onReply,
}: {
  messages: FollowUpMessage[];
  onReply: (messageId: string) => void;
}) {
  const messageIds = new Set(messages.map((message) => message.id));
  const roots = messages.filter((message) => !message.parentMessageId || !messageIds.has(message.parentMessageId));

  return (
    <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
      {messages.length === 0 ? (
        <div className="rounded-md border border-zinc-800 p-3 text-sm text-zinc-500">
          No follow-ups yet. Ask about the full analysis or select text inside a section.
        </div>
      ) : (
        roots.map((message) => (
          <MessageNode key={message.id} message={message} messages={messages} onReply={onReply} depth={0} />
        ))
      )}
    </div>
  );
}

function MessageNode({
  message,
  messages,
  onReply,
  depth,
}: {
  message: FollowUpMessage;
  messages: FollowUpMessage[];
  onReply: (messageId: string) => void;
  depth: number;
}) {
  const children = messages.filter((candidate) => candidate.parentMessageId === message.id);

  return (
    <div className={depth > 0 ? "ml-3 border-l border-zinc-800 pl-3" : ""}>
      <article className={`rounded-md border p-3 ${message.role === "assistant" ? "border-zinc-800 bg-[#0b0f12]" : "border-zinc-700 bg-zinc-900/60"}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-medium capitalize text-zinc-300">{message.role}</span>
          <button type="button" onClick={() => onReply(message.id)} className="text-xs text-zinc-500 hover:text-zinc-100">
            Reply
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{message.content}</p>
      </article>
      {children.length > 0 ? (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <MessageNode key={child.id} message={child} messages={messages} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RetrievedRecord({ record, fallbackLabel }: { record: unknown; fallbackLabel: string }) {
  const safeRecord = isRecord(record) ? record : {};
  const title = String(safeRecord.title ?? safeRecord.name ?? fallbackLabel);
  const subtitle = String(safeRecord.source ?? safeRecord.author ?? safeRecord.status ?? "Retrieved database record");

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function EmptyRetrievalNotice({ label, status }: { label: string; status?: string }) {
  const isNotConnected = !status || status === "not_connected";

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-sm text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {isNotConnected
          ? "Retrieval is not connected, so no records are shown."
          : "No retrieved records were returned for this analysis."}
      </p>
    </div>
  );
}

function normalizeFollowUpMessages(input: unknown): FollowUpMessage[] {
  if (isRecord(input)) {
    const pair = [input.user, input.assistant, input.userMessage, input.assistantMessage].filter(Boolean);
    if (pair.length > 0) {
      return normalizeFollowUpMessages(pair);
    }
  }

  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(isRecord)
    .map((message, index) => ({
      id: String(message.id ?? message.messageId ?? `local-${index}`),
      parentMessageId:
        typeof message.parentMessageId === "string"
          ? message.parentMessageId
          : typeof message.parent_message_id === "string"
            ? message.parent_message_id
            : null,
      role: (message.role === "assistant" || message.kind === "assistant" ? "assistant" : "user") as FollowUpMessage["role"],
      content: String(message.content ?? message.answer ?? message.question ?? ""),
      context: isFollowUpContext(message.context) ? message.context : undefined,
      createdAt: typeof message.createdAt === "string" ? message.createdAt : undefined,
    }))
    .filter((message) => message.content.trim().length > 0);
}

function mergeFollowUpMessages(current: FollowUpMessage[], next: FollowUpMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of next) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values());
}

function buildAnalysisStatus(analysis: AnalysisPayload) {
  if (analysis.provider?.ran) {
    return "Structured analysis returned.";
  }

  if (analysis.provider?.configured === false) {
    return "Structured analysis returned. Provider is not configured for future runs.";
  }

  return "Structured analysis returned.";
}

function contextButtonClass(active: boolean) {
  return `h-7 rounded-md border px-2 text-xs ${
    active
      ? "border-zinc-100 bg-zinc-100 text-zinc-950"
      : "border-zinc-800 bg-[#0b0f12] text-zinc-400 hover:text-zinc-100"
  }`;
}

function contextLabel(context: FollowUpContext) {
  if (context.type === "whole_analysis") {
    return "Context: whole analysis";
  }

  if (context.type === "section") {
    return `Context: ${fixedAnalysisSections.find((section) => section.key === context.sectionKey)?.label ?? context.sectionKey}`;
  }

  if (context.type === "selected_text") {
    return `Context: selected text, ${context.selection.text.length} characters`;
  }

  return `Replying to message ${context.parentMessageId}`;
}

function getRetrievalLabel(sectionKey: AnalysisSectionKey, retrievalStatus?: AnalysisPayload["retrieval_status"]) {
  if (sectionKey === "related_models_similar_problems") {
    return retrievalStatus?.similar_problems === "not_connected" ? "not connected" : retrievalStatus?.similar_problems ?? "pending";
  }

  if (sectionKey === "related_articles") {
    return retrievalStatus?.related_articles === "not_connected" ? "not connected" : retrievalStatus?.related_articles ?? "pending";
  }

  return "";
}

function getEmptySectionText(sectionKey: AnalysisSectionKey) {
  if (sectionKey === "related_models_similar_problems") {
    return "Similar problems require real Problem Bank retrieval.";
  }

  if (sectionKey === "related_articles") {
    return "Related articles require real Article Plaza retrieval.";
  }

  return "Run structured analysis to populate this section.";
}

function sectionToPlainText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFollowUpContext(value: unknown): value is FollowUpContext {
  return isRecord(value) && typeof value.type === "string";
}

function ExtractedTextCard({
  title,
  body,
  onChange,
}: {
  title: string;
  body: string;
  onChange: (value: string) => void;
}) {
  return (
    <article className="min-h-[210px] rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-500">Editable</span>
      </div>
      <textarea
        value={body}
        onChange={(event) => onChange(event.target.value)}
        className="h-[158px] w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-300 outline-none"
      />
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

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function ProblemTable({
  selectedIndex,
  onSelectedIndexChange,
}: {
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}) {
  const selected = problems[selectedIndex] ?? problems[0];

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-3">
        <input
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Search problems by title, topic, keyword, or source..."
        />
        <div className="mt-3 grid grid-cols-5 gap-2 text-xs max-[980px]:grid-cols-2">
          {["All years", "All institutions", "All topics", "All types", "All tags"].map((filter) => (
            <button
              key={filter}
              className="h-9 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-left text-zinc-300 hover:text-zinc-50"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/55">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          <span>Showing 1-10 of 1,284 problems</span>
          <span>Rows per page: 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="w-10 px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">Problem</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Topics</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium">Actions</th>
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
                  <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                  <td className="px-4 py-3 text-zinc-100">{problem.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{problem.source}</td>
                  <td className="px-4 py-3 text-zinc-400">{problem.year}</td>
                  <td className="px-4 py-3">
                    <TagList tags={problem.topics.slice(0, 2)} />
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-300">
                    <div className="flex gap-3">
                      <button>Open</button>
                      <button>Analyze</button>
                      <button>Save</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-3 max-[980px]:grid-cols-1">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Problem Preview</h2>
            <span className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">Selected</span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-zinc-300">
            A uniform conducting rod of length L and mass m can slide without friction on two parallel horizontal rails
            separated by distance d. The system is in a uniform magnetic field B directed upward. A constant force F is
            applied to the rod along the rails.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 max-[760px]:grid-cols-1">
            <FileCard title="Standard Answer" fileName="answer_001.pdf" status="PDF / 512 KB" />
            <FileCard title="Diagram" fileName="diagram_001.png" status="PNG / 84 KB" />
          </div>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">Selected Problem</h2>
          <div className="space-y-3 text-sm">
            <Detail label="Title" value={selected.title} />
            <Detail label="Institution" value={selected.institution} />
            <Detail label="Type" value={selected.type} />
            <Detail label="Model tags" value={selected.modelTags.join(", ")} />
          </div>
        </section>
      </div>
    </section>
  );
}

function ArticleReader() {
  const selectedArticle = articles[0];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="h-10 min-w-[280px] flex-1 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Search articles by title, author, topic, or model..."
        />
        <button className="h-10 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950">
          Write Article
        </button>
      </div>
      <div className="grid grid-cols-[280px_minmax(0,1fr)] rounded-lg border border-zinc-800 bg-zinc-950/55 max-[900px]:grid-cols-1">
        <div className="border-r border-zinc-800 max-[900px]:border-r-0 max-[900px]:border-b">
          <p className="border-b border-zinc-800 p-4 text-xs text-zinc-500">252 articles</p>
          {articles.map((article, index) => (
            <button
              key={article.title}
              className={`block w-full border-b border-zinc-800 p-4 text-left ${
                index === 0 ? "bg-zinc-800/55" : "hover:bg-zinc-900"
              }`}
            >
              <span className="block text-sm font-semibold text-zinc-100">{article.title}</span>
              <span className="mt-1 block text-xs text-zinc-500">
                {article.author} / {article.updated}
              </span>
              <span className="mt-3 block">
                <TagList tags={article.tags.slice(0, 2)} />
              </span>
            </button>
          ))}
        </div>
        <article className="space-y-5 p-6">
          <p className="text-xs text-zinc-500">Public Article / {selectedArticle.updated} / {selectedArticle.readTime}</p>
          <h2 className="max-w-2xl text-2xl font-semibold text-zinc-50">{selectedArticle.title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-200">AT</span>
            <span>{selectedArticle.author}</span>
          </div>
          <TagList tags={selectedArticle.tags} />
          <p className="max-w-3xl border-t border-zinc-800 pt-5 leading-7 text-zinc-300">{selectedArticle.excerpt}</p>
          <p className="max-w-3xl leading-7 text-zinc-300">
            Consider a conducting rod of length L moving with speed v on two frictionless rails separated by distance d
            in a uniform magnetic field B. The current direction is derived from the change in flux and then checked
            against the magnetic force on the rod.
          </p>
          <div className="rounded-lg border border-zinc-800 bg-[#0b0f12] p-4">
            <div className="mb-3 text-xs text-zinc-500">Related Problems (real linked records)</div>
            <div className="space-y-2">
              {selectedArticle.relatedProblems.map((title) => (
                <div key={title} className="flex items-center justify-between rounded-md border border-zinc-800 p-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{title}</p>
                    <p className="text-xs text-zinc-500">Problem Bank record</p>
                  </div>
                  <button className="text-xs text-zinc-300">Open Problem</button>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function LibraryTable() {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["New Folder", "New Problem Set", "New Document"].map((action) => (
            <button
              key={action}
              className="h-9 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-200 hover:text-zinc-50"
            >
              {action}
            </button>
          ))}
        </div>
        <input
          className="h-9 w-[260px] rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 max-[760px]:w-full"
          placeholder="Search library..."
        />
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/55">
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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="w-10 px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">In Folder / Set</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {libraryGroups.map((group) => (
                <Fragment key={group.label}>
                  <tr className="border-t border-zinc-800 bg-[#0b0f12] text-xs text-zinc-400">
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3 font-medium" colSpan={6}>
                      {group.label}
                    </td>
                  </tr>
                  {group.items.map((item, index) => (
                    <tr
                      key={item.name}
                      className={`border-t border-zinc-800 ${group.label.startsWith("Documents") && index === 0 ? "bg-zinc-800/55" : ""}`}
                    >
                      <td className="px-4 py-3 text-zinc-500">{group.label.startsWith("Documents") && index === 0 ? "x" : ""}</td>
                      <td className="px-4 py-3 text-zinc-100">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{item.type}</td>
                      <td className="px-4 py-3 text-zinc-400">{item.updated}</td>
                      <td className="px-4 py-3">
                        {item.tag === "-" ? <span className="text-zinc-600">-</span> : <TagList tags={[item.tag]} />}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{item.folder}</td>
                      <td className="px-4 py-3 text-zinc-400">{item.visibility}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          <span>Showing 13 items</span>
          <span>1 selected</span>
        </div>
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
  const firstProblem = problems[0];
  const firstArticle = articles[0];

  const title =
    active.id === "articles" ? "Article Info" : active.id === "library" ? "Item Details" : active.id === "bank" ? "Selected Problem" : "Problem Info";
  const primaryDetails =
    active.id === "articles"
      ? [
          ["Author", firstArticle.author],
          ["Status", "Published"],
          ["Related problems", `${firstArticle.relatedProblems.length} linked records`],
          ["Topic tags", firstArticle.tags.join(", ")],
        ]
      : active.id === "library"
        ? [
            ["Type", "Document"],
            ["Visibility", "Private"],
            ["Updated", "2026-05-25 09:28"],
            ["In folder", "Electromagnetism"],
          ]
        : active.id === "bank"
          ? [
              ["Source", `${firstProblem.source}, ${firstProblem.type}`],
              ["Institution", firstProblem.institution],
              ["Topic", firstProblem.topics.join(", ")],
              ["Model tags", firstProblem.modelTags.join(", ")],
            ]
          : [
              ["Topic", "Electromagnetism"],
              ["Source", "IPhO 2016, Q2"],
              ["Difficulty", "Hard"],
              ["State", shellState],
            ];

  const actions =
    active.id === "articles"
      ? ["Read full article", "Save to library", "Open in editor", "Export PDF"]
      : active.id === "library"
        ? ["Open", "Edit", "Publish", "Move to folder"]
        : active.id === "bank"
          ? ["Open full detail", "Start AI analysis", "Add to my library", "Report an issue"]
          : ["Save session", "Create article draft", "Add problem to library", "Export analysis (PDF)", "Share session"];

  return (
    <aside className="space-y-4 bg-[#090d10] p-4 max-[1180px]:hidden">
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">{title}</h2>
        <div className="space-y-4 text-sm">
          {primaryDetails.map(([label, value]) => (
            <Detail key={label} label={label} value={value} />
          ))}
          <Detail label="Role preview" value={role} />
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
          {actions.map((action) => (
            <button
              key={action}
              className="h-9 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-left text-sm text-zinc-300 hover:text-zinc-100"
            >
              {action}
            </button>
          ))}
          <button className="h-9 w-full rounded-md border border-red-950/80 bg-[#0b0f12] px-3 text-left text-sm text-red-400">
            {active.id === "library" ? "Delete" : active.id === "articles" ? "Unpublish article" : active.id === "bank" ? "Admin edit disabled" : "Delete draft"}
          </button>
        </div>
      </section>
      <p className="px-1 text-xs leading-5 text-zinc-500">
        Foundation build. AI Solver gates and upload validation are server-side; extraction, persistence wiring, and provider calls remain staged.
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

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const className =
    difficulty === "Hard"
      ? "border-red-500/50 text-red-300"
      : difficulty === "Medium"
        ? "border-amber-500/50 text-amber-300"
        : "border-emerald-500/50 text-emerald-300";

  return <span className={`rounded border px-2 py-0.5 text-xs ${className}`}>{difficulty}</span>;
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
