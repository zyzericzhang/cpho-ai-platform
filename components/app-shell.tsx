"use client";

import { type User } from "@supabase/supabase-js";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  articles,
  libraryGroups,
  moduleEmptyStates,
  modules,
  problems,
  shellStateLabels,
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
  { key: "step_by_step_derivation", label: "逐步推导" },
  { key: "physical_reasoning_reconstruction", label: "物理图景重建" },
  { key: "related_models_similar_problems", label: "相关模型与相似题" },
  { key: "related_articles", label: "相关文章" },
  { key: "key_handling", label: "关键处理" },
  { key: "write_article", label: "写作文章" },
  { key: "add_to_personal_library", label: "加入个人资料库" },
];

const materialRoleLabels: Record<string, string> = {
  combined: "题目与标准答案",
  problem: "题目",
  answer: "标准答案",
};

export function AppShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("solver");
  const [shellState, setShellState] = useState<ShellState>("ready");
  const [role, setRole] = useState<Role>("student");
  const [selectedIndex, setSelectedIndex] = useState(-1);
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

  const handleModuleChange = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setSelectedIndex(-1);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b0d] text-zinc-100">
      <TopBar 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
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
        <RightPanel active={active} role={role} shellState={shellState} selectedIndex={selectedIndex} />
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
            {getModuleLabel(moduleItem.id)}
            {activeModule === moduleItem.id ? (
              <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-100" />
            ) : null}
          </button>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-3 px-5 text-xs text-zinc-400 max-[760px]:hidden">
        <button className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-zinc-800 hover:text-zinc-100" title="搜索">
          /
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-md border border-transparent hover:border-zinc-800 hover:text-zinc-100" title="通知">
          !
        </button>
        {user ? (
          <>
            <button onClick={onLogout} className="hover:text-zinc-100">退出</button>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-zinc-100" title={user.email}>
              {user.email?.[0].toUpperCase()}
            </span>
          </>
        ) : (
          <button onClick={onLogin} className="hover:text-zinc-100">登录</button>
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
                  {getModuleLabel(moduleItem.id).slice(0, 1)}
                </span>
                {getModuleLabel(moduleItem.id)}
              </span>
              <span className="text-xs text-zinc-500">收起</span>
            </div>
            <div className="space-y-1">
              {moduleItem.sidebar.map((item) => {
                const disabled = item.adminOnly && role !== "admin";
                const selected = active.id === moduleItem.id && item.label === moduleItem.sidebar[0].label;
                const displayLabel = getSidebarLabel(moduleItem.id, item.label);
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
                    title={disabled ? "仅管理员可用。前端禁用只是提示，服务端权限仍需校验。" : displayLabel}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full border border-zinc-600" />
                      <span className="truncate">{displayLabel}</span>
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
        <span>设置</span>
        <span>收起</span>
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
  const moduleCopy = getModuleCopy(active);

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-3 text-sm text-zinc-500">{moduleCopy.eyebrow}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-normal text-zinc-50">{moduleCopy.title}</h1>
          <span className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {active.id === "solver" ? "等待上传材料" : "已就绪"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {moduleCopy.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-3 max-[760px]:items-start">
        <div className="flex flex-col items-end gap-1">
          {isAuthMode && <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">账号角色</span>}
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
                {option === "student" ? "学生" : "管理员"}
              </button>
            ))}
          </div>
          {!isAuthMode && <span className="text-[10px] text-zinc-500 italic">预览模式：可切换角色</span>}
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
              {getShellStateLabel(state)}
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
  const stateCopy = getStateCopy(active.id, shellState);

  if (shellState === "loading") {
    return <Notice title={stateCopy.title} body={stateCopy.body} />;
  }

  if (shellState === "empty") {
    return <Notice title={stateCopy.title} body={stateCopy.body} />;
  }

  if (shellState === "error") {
    return <Notice tone="danger" title={stateCopy.title} body={stateCopy.body} />;
  }

  if (shellState === "permission") {
    return (
      <Notice
        tone="warning"
        title={stateCopy.title}
        body={stateCopy.body}
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
  const moduleCopy = getModuleCopy(active);

  return (
    <section className={compact ? "" : "rounded-lg border border-zinc-800 bg-zinc-950/55 p-4"}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">{active.id === "solver" ? "会话操作" : "模块操作"}</h2>
        <span className="text-xs text-zinc-500">
          {active.id === "solver" ? "AI 解题器会话边界" : "真实数据接入前仅显示状态与权限边界"}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 max-[900px]:grid-cols-1">
        <button className="h-10 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950">
          {moduleCopy.primaryAction}
        </button>
        <button className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200">
          {moduleCopy.secondaryAction}
        </button>
        <button
          disabled={restricted}
          className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          title={restricted ? "仅管理员可创建、编辑或归档公共题库内容；服务端权限和 RLS 仍必须校验。" : "管理员操作"}
        >
          {active.id === "bank" ? "管理员题库操作" : "管理操作"}
        </button>
      </div>
      {restricted ? (
        <p className="mt-3 text-xs text-zinc-500">
          学生账号不可创建、编辑或删除公共 Problem Bank 内容。这里的禁用只是界面提示，不能替代服务端权限检查。
        </p>
      ) : null}
    </section>
  );
}

function SolverPanel({ active, role }: { active: ModuleConfig; role: Role }) {
  const [sessionId, setSessionId] = useState("");
  const [materialRole, setMaterialRole] = useState("combined");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileName: string; kind: string; sizeBytes: number }>>([]);
  const [problemText, setProblemText] = useState("");
  const [diagramNotes, setDiagramNotes] = useState("");
  const [standardAnswer, setStandardAnswer] = useState("");
  const [confirmStandardAnswer, setConfirmStandardAnswer] = useState(false);
  const [statusMessage, setStatusMessage] = useState("请先上传题目材料，再确认或编辑抽取字段。");
  const [analysisMessage, setAnalysisMessage] = useState("没有已确认的标准答案，不能生成 AI 解析。");
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [selectedContext, setSelectedContext] = useState<FollowUpContext>({ type: "whole_analysis" });
  const [selectionDraft, setSelectionDraft] = useState<Extract<FollowUpContext, { type: "selected_text" }> | null>(null);
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isFollowUpBusy, setIsFollowUpBusy] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("追问会附着在本次解析会话中，不会覆盖原解析。");
  const [isBusy, setIsBusy] = useState(false);

  const hasConfirmedAnswer = confirmStandardAnswer && standardAnswer.trim().length > 0;

  const createSessionIfNeeded = async () => {
    if (sessionId) {
      return sessionId;
    }

    const response = await fetch("/api/ai-solver/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "AI 解题本地上传验证" }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(toChineseSolverError(payload.error, "无法创建解题会话。"));
    }

    setSessionId(payload.session.id);
    return payload.session.id as string;
  };

  const loadFollowUps = async (nextSessionId: string) => {
    try {
      const response = await fetch(`/api/ai-solver/follow-ups?sessionId=${encodeURIComponent(nextSessionId)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFollowUpMessage(toChineseSolverError(payload.error, "追问历史暂未接入。"));
        return;
      }

      setMessages(normalizeFollowUpMessages(payload.messages));
      setFollowUpMessage("已加载追问历史。");
    } catch {
      setFollowUpMessage("追问历史暂未接入。");
    }
  };

  const handleUpload = async () => {
    setIsBusy(true);
    setStatusMessage("正在由服务器校验上传材料...");

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
        throw new Error(toChineseSolverError(payload.error, "上传校验失败。"));
      }

      setUploadedFiles(payload.uploads);
      setStatusMessage(`已接收 ${payload.uploads.length} 个文件。文本抽取暂未接入，请手动填写并确认下方字段。`);
      setProblemText("");
      setDiagramNotes("");
      setStandardAnswer("");
      setConfirmStandardAnswer(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "上传失败。");
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
        throw new Error(toChineseSolverError(payload.error, "确认失败。"));
      }

      setStatusMessage(
        payload.extraction.isStandardAnswerConfirmed
          ? "标准答案已确认；服务器校验通过后才能进入结构化解析。"
          : "字段已保存，但标准答案尚未确认。",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "确认失败。");
    } finally {
      setIsBusy(false);
    }
  };

  const handleAnalyze = async () => {
    setIsBusy(true);
    setAnalysisMessage("正在保存确认字段，然后启动解析...");

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
        throw new Error(toChineseSolverError(confirmPayload.error, "确认失败。"));
      }

      if (!confirmPayload.extraction?.isStandardAnswerConfirmed) {
        throw new Error("请先确认非空标准答案，再运行 AI 解析。");
      }

      setStatusMessage("标准答案已确认，正在运行结构化解析...");
      const response = await fetch("/api/ai-solver/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: nextSessionId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(toChineseSolverError(payload.error, "解析请求被拒绝。"));
      }

      if (!payload.analysis?.sections) {
        setAnalysis(null);
        setAnalysisMessage("解析接口已有响应，但尚未返回结构化解析内容。");
        return;
      }

      setAnalysis(payload.analysis);
      setAnalysisMessage(buildAnalysisStatus(payload.analysis));
      void loadFollowUps(nextSessionId);
    } catch (error) {
      setAnalysisMessage(error instanceof Error ? error.message : "解析失败。");
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
      setFollowUpMessage("请先输入追问内容。");
      return;
    }

    setIsFollowUpBusy(true);
    setFollowUpMessage("正在发送追问...");

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
        throw new Error(toChineseSolverError(payload.error, "追问失败。"));
      }

      const nextMessages = normalizeFollowUpMessages(
        payload.messages ?? [payload.userMessage, payload.assistantMessage].filter(Boolean),
      );
      setMessages((current) => mergeFollowUpMessages(current, nextMessages));
      setQuestion("");
      setSelectionDraft(null);
      setSelectedContext({ type: "whole_analysis" });
      setFollowUpMessage("追问已加入本次解析。");
    } catch (error) {
      setFollowUpMessage(error instanceof Error ? error.message : "追问失败。");
    } finally {
      setIsFollowUpBusy(false);
    }
  };

  return (
    <>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">1. 上传材料</h2>
          <span className="text-xs text-zinc-500">服务器校验</span>
        </div>
        <div className="grid grid-cols-[180px_minmax(0,1fr)_auto] gap-3 max-[900px]:grid-cols-1">
          <select
            value={materialRole}
            onChange={(event) => setMaterialRole(event.target.value)}
            className="h-10 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none"
          >
            <option value="combined">题目与标准答案</option>
            <option value="problem">题目</option>
            <option value="answer">标准答案</option>
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
            上传
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file) => (
              <FileCard
                key={file.fileName}
                title={`${materialRoleLabels[materialRole] ?? "材料"}材料`}
                fileName={file.fileName}
                status={`${file.kind.toUpperCase()} / ${formatBytes(file.sizeBytes)}`}
              />
            ))
          ) : (
            <Notice
              title="本会话尚未上传材料"
              body="请上传真实题目材料；服务器会校验文件数量、MIME、扩展名和大小。"
            />
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-400">{statusMessage}</p>
        <p className="mt-3 text-xs text-zinc-500">支持格式：图片、PDF、DOCX。不支持旧版 .doc。</p>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">2. 确认与编辑抽取文本</h2>
          <span className="text-xs text-amber-300">真实文本抽取未接入</span>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1120px]:grid-cols-1">
          <ExtractedTextCard
            title="题目文本"
            body={problemText}
            onChange={setProblemText}
            placeholder="真实文本抽取未接入。请在上传后手动填写题目文本。"
          />
          <ExtractedTextCard
            title="图像/图示说明"
            body={diagramNotes}
            onChange={setDiagramNotes}
            placeholder="如题目含图，请手动填写关键图示、坐标、方向和约束信息。"
          />
          <ExtractedTextCard
            title="标准答案"
            body={standardAnswer}
            onChange={setStandardAnswer}
            placeholder="必须填写并确认标准答案；没有标准答案不能运行 AI 解析。"
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
            确认标准答案
          </label>
          <button
            onClick={handleConfirm}
            disabled={isBusy}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存确认
          </button>
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">3. AI 解析</h2>
            <p className="mt-1 text-xs text-zinc-500">固定七个解析区块，追问附着在当前会话</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isBusy || !hasConfirmedAnswer}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            title={!hasConfirmedAnswer ? "请先确认非空标准答案" : "运行结构化解析"}
          >
            {isBusy ? "解析中..." : "运行结构化解析"}
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
                  setQuestion(`请更详细地解释“${section.label}”这一部分。`);
                }}
                onSelectText={(sectionText) => handleSectionSelection(section.key, sectionText)}
              />
            ))}
          </div>
          <section className="min-w-0 rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-100">追问线程</h3>
              <span className="rounded border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                {messages.length} 条消息
              </span>
            </div>
            {selectionDraft ? (
              <div className="mb-3 rounded-md border border-zinc-700 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-200">已选文本</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContext(selectionDraft);
                      setQuestion("请解释这段选中的内容。");
                    }}
                    className="h-7 rounded-md border border-zinc-700 px-2 text-xs text-zinc-200 hover:bg-zinc-900"
                  >
                    追问选中内容
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
          追问本段
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
        <p>{typeof related.model_explanation === "string" && related.model_explanation ? related.model_explanation : "解析运行后会在这里显示模型归纳说明。"}</p>
        {problems.length > 0 ? (
          <div className="space-y-2">
            {problems.map((problem, index) => (
              <RetrievedRecord key={String(isRecord(problem) ? problem.id ?? index : index)} record={problem} fallbackLabel="题库真实记录" />
            ))}
          </div>
        ) : (
          <EmptyRetrievalNotice label="相似题库检索" status={retrievalStatus?.similar_problems} />
        )}
      </>
    );
  }

  if (sectionKey === "related_articles") {
    const related = isRecord(value) ? value : {};
    const records = Array.isArray(related.articles) ? related.articles : [];

    return (
      <>
        <p>{typeof related.summary === "string" && related.summary ? related.summary : "解析运行后会在这里显示相关文章摘要。"}</p>
        {records.length > 0 ? (
          <div className="space-y-2">
            {records.map((article, index) => (
              <RetrievedRecord key={String(isRecord(article) ? article.id ?? index : index)} record={article} fallbackLabel="文章广场真实记录" />
            ))}
          </div>
        ) : (
          <EmptyRetrievalNotice label="相关文章检索" status={retrievalStatus?.related_articles} />
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
          整体解析
        </button>
        {fixedAnalysisSections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => onContextChange({ type: "section", sectionKey: section.key })}
            className={contextButtonClass(context.type === "section" && context.sectionKey === section.key)}
          >
            {getShortSectionLabel(section.key)}
          </button>
        ))}
      </div>
      <textarea
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        disabled={disabled}
        className="h-[86px] w-full resize-none rounded-md border border-zinc-800 bg-[#0b0f12] p-3 text-sm leading-5 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={disabled ? "请先运行解析，再继续追问。" : "可针对整体解析、某个区块、选中文本或上一条回答追问..."}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-zinc-500">{contextLabel(context)}</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-xs font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
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
          暂无追问。可以针对整体解析提问，也可以选中某个区块中的文本后追问。
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
          <span className="text-xs font-medium text-zinc-300">{message.role === "assistant" ? "AI 助手" : "学生"}</span>
          <button type="button" onClick={() => onReply(message.id)} className="text-xs text-zinc-500 hover:text-zinc-100">
            回复
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
  const subtitle = String(safeRecord.source ?? safeRecord.author ?? safeRecord.status ?? "真实数据库记录");

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
          ? "真实检索未接入，因此不显示任何题目或文章记录。"
          : "本次真实检索没有返回记录。"}
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
    return "已返回结构化解析。";
  }

  if (analysis.provider?.configured === false) {
    return "已返回结构化解析；后续运行所需的服务器端 AI 配置尚未完成。";
  }

  return "已返回结构化解析。";
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
    return "上下文：整体解析";
  }

  if (context.type === "section") {
    return `上下文：${fixedAnalysisSections.find((section) => section.key === context.sectionKey)?.label ?? context.sectionKey}`;
  }

  if (context.type === "selected_text") {
    return `上下文：选中文本，${context.selection.text.length} 个字符`;
  }

  return `正在回复消息 ${context.parentMessageId}`;
}

function getRetrievalLabel(sectionKey: AnalysisSectionKey, retrievalStatus?: AnalysisPayload["retrieval_status"]) {
  if (sectionKey === "related_models_similar_problems") {
    return getChineseRetrievalStatus(retrievalStatus?.similar_problems);
  }

  if (sectionKey === "related_articles") {
    return getChineseRetrievalStatus(retrievalStatus?.related_articles);
  }

  return "";
}

function getEmptySectionText(sectionKey: AnalysisSectionKey) {
  if (sectionKey === "related_models_similar_problems") {
    return "相似题必须来自真实 Problem Bank 检索；真实检索未接入时不会显示编造记录。";
  }

  if (sectionKey === "related_articles") {
    return "相关文章必须来自真实 Article Plaza 检索；真实检索未接入时不会显示编造记录。";
  }

  return "运行结构化解析后，本区块会显示结果。";
}

function getShortSectionLabel(sectionKey: AnalysisSectionKey) {
  const labels: Record<AnalysisSectionKey, string> = {
    step_by_step_derivation: "推导",
    physical_reasoning_reconstruction: "图景",
    related_models_similar_problems: "相似题",
    related_articles: "文章",
    key_handling: "关键",
    write_article: "写作",
    add_to_personal_library: "资料库",
  };

  return labels[sectionKey];
}

function getChineseRetrievalStatus(status?: string) {
  if (!status || status === "not_connected") {
    return "真实检索未接入";
  }

  if (status === "connected") {
    return "真实检索已接入";
  }

  if (status === "empty") {
    return "无返回记录";
  }

  return "检索状态待确认";
}

function getChineseShellState(state: ShellState) {
  const labels: Record<ShellState, string> = {
    ready: "就绪",
    loading: "加载中",
    empty: "空状态",
    error: "错误",
    permission: "权限受限",
  };

  return labels[state];
}

function getChineseRole(role: Role) {
  return role === "admin" ? "管理员" : "学生";
}

function toChineseSolverError(error: unknown, fallback: string) {
  const message = typeof error === "string" ? error : "";

  if (!message) {
    return fallback;
  }

  if (message.includes("Upload at least one material file")) {
    return "请至少上传一个材料文件。";
  }

  if (message.includes("Image uploads support 1 to 10 files")) {
    return "图片上传支持 1 到 10 张。";
  }

  if (message.includes("PDF uploads support exactly one file")) {
    return "PDF 上传一次只能包含 1 个文件。";
  }

  if (message.includes("DOCX uploads support exactly one file")) {
    return "DOCX 上传一次只能包含 1 个文件。";
  }

  if (message.includes("Old .doc files are not supported")) {
    return "不支持旧版 .doc 文件，请上传 .docx。";
  }

  if (message.includes("PDF files must be 25 MB or smaller")) {
    return "PDF 文件大小不能超过 25 MB。";
  }

  if (message.includes("DOCX files must be 15 MB or smaller")) {
    return "DOCX 文件大小不能超过 15 MB。";
  }

  if (message.includes("Unsupported file type")) {
    return "文件类型不支持，请使用图片、PDF 或 DOCX。";
  }

  if (message.includes("No standard answer, no AI solution") || message.includes("Confirm a non-empty standard answer")) {
    return "没有已确认的非空标准答案，不能生成 AI 解析。";
  }

  if (message.includes("Run structured analysis before follow-up")) {
    return "请先运行结构化解析，再继续追问。";
  }

  if (message.includes("follow-up message content is required")) {
    return "请先输入追问内容。";
  }

  if (message.includes("provider") || message.includes("AI provider")) {
    return "服务器端 AI 解析暂时不可用，请稍后重试。";
  }

  return fallback;
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

function getModuleLabel(moduleId: ModuleId) {
  const labels: Record<ModuleId, string> = {
    solver: "AI 解题器",
    bank: "题库",
    articles: "文章广场",
    library: "个人资料库",
  };

  return labels[moduleId];
}

function getModuleCopy(active: ModuleConfig) {
  if (active.id === "solver") {
    return {
      title: active.title,
      description: "新建会话后上传材料并确认标准答案；没有标准答案不会生成解析。",
      eyebrow: active.eyebrow,
      primaryAction: active.primaryAction,
      secondaryAction: active.secondaryAction,
    };
  }

  const copy: Record<Exclude<ModuleId, "solver">, {
    title: string;
    description: string;
    eyebrow: string;
    primaryAction: string;
    secondaryAction: string;
  }> = {
    bank: {
      title: "题库",
      description: "浏览管理员维护的公开物理竞赛题目；未接入查询时不展示示例题。",
      eyebrow: "题库 / 浏览公开题目",
      primaryAction: "开始 AI 解析",
      secondaryAction: "打开题目详情",
    },
    articles: {
      title: "文章广场",
      description: "阅读由个人文档发布而来的公开文章；未接入查询时不展示示例作者或正文。",
      eyebrow: "文章广场 / 公开文章",
      primaryAction: "阅读全文",
      secondaryAction: "在编辑器打开",
    },
    library: {
      title: "个人资料库",
      description: "管理自己的题目、文档、题单和文件夹；AI Solver sessions 不会自动进入这里。",
      eyebrow: "个人资料库 / 我的资料",
      primaryAction: "打开选中项",
      secondaryAction: "新建文档",
    },
  };

  return copy[active.id];
}

function getSidebarLabel(moduleId: ModuleId, label: string) {
  const labels: Partial<Record<ModuleId, Record<string, string>>> = {
    solver: {
      "New Analysis": "新建解析",
      Sessions: "解析会话",
      "Uploaded Materials": "上传材料",
      Feedback: "解析反馈",
    },
    bank: {
      "Browse Problems": "浏览题目",
      "By Topic": "按主题",
      "By Competition": "按竞赛",
      "My Collections": "我的收藏",
      "Upload paper": "上传试卷",
      "Create problem": "创建题目",
    },
    articles: {
      "Latest Articles": "最新文章",
      "By Topic": "按主题",
      "By Competition": "按竞赛",
      "Top Viewed": "阅读最多",
    },
    library: {
      "My Problems": "我的题目",
      "My Articles": "我的文章",
      Bookmarks: "书签",
      Notes: "笔记",
    },
  };

  return labels[moduleId]?.[label] ?? label;
}

function getShellStateLabel(state: ShellState) {
  return shellStateLabels[state];
}

function getStateCopy(moduleId: ModuleId, state: ShellState) {
  if (moduleId === "solver") {
    const solverCopy: Record<ShellState, { title: string; body: string }> = {
      ready: { title: "AI 解题器已就绪", body: "请上传真实题目材料，确认题目文本、图示说明和标准答案后再运行解析。" },
      loading: { title: "正在加载解题工作区", body: "正在准备 AI 解题器会话状态。" },
      empty: { title: "暂无解题材料", body: "请上传真实题目材料；不会预置或展示假题目内容。" },
      error: { title: "解题会话出错", body: "请检查上传材料、确认字段和标准答案状态后重试。" },
      permission: {
        title: "权限不足",
        body: "当前角色不能执行该操作；最终权限仍由服务器端校验决定。",
      },
    };
    return solverCopy[state];
  }

  const moduleName = getModuleLabel(moduleId);
  const disconnected = moduleEmptyStates[moduleId].title;

  const empty =
    moduleId === "bank"
      ? "暂无公开题目"
      : moduleId === "articles"
        ? "暂无公开文章"
        : "暂无个人资料";

  const copy: Record<ShellState, { title: string; body: string }> = {
    ready: { title: moduleName, body: disconnected },
    loading: { title: "正在加载", body: `正在读取${moduleName}的真实记录。` },
    empty: { title: empty, body: `${disconnected}；不会展示本地示例数据。` },
    error: { title: "加载失败", body: `${moduleName}暂时无法加载，请稍后重试。` },
    permission: {
      title: "权限不足",
      body: "当前角色不能执行该操作。前端禁用只是提示，服务端权限检查和 RLS 仍然必须执行。",
    },
  };

  return copy[state];
}

function ExtractedTextCard({
  title,
  body,
  onChange,
  placeholder,
}: {
  title: string;
  body: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <article className="min-h-[210px] rounded-md border border-zinc-800 bg-[#0b0f12] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-500">可编辑</span>
      </div>
      <textarea
        value={body}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[158px] w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-300 outline-none placeholder:text-zinc-600"
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
        <span className="text-emerald-400">已就绪</span>
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

function hasDatabaseIdentity(record: unknown) {
  return isRecord(record) && (typeof record.id === "string" || typeof record.id === "number");
}

function getRealProblemRecords() {
  return problems.filter(hasDatabaseIdentity);
}

function getRealArticleRecords() {
  return articles.filter(hasDatabaseIdentity);
}

function getRealLibraryGroups() {
  return libraryGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(hasDatabaseIdentity),
    }))
    .filter((group) => group.items.length > 0);
}

function ProblemTable({
  selectedIndex,
  onSelectedIndexChange,
}: {
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}) {
  const realProblems = getRealProblemRecords();
  const selected = selectedIndex >= 0 && selectedIndex < realProblems.length ? realProblems[selectedIndex] : undefined;

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-3">
        <input
          className="h-10 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="按题目、主题、关键词或来源搜索题库..."
        />
        <div className="mt-3 grid grid-cols-5 gap-2 text-xs max-[980px]:grid-cols-2">
          {["全部年份", "全部机构", "全部主题", "全部类型", "全部标签"].map((filter) => (
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
          <span>{realProblems.length > 0 ? `显示 ${realProblems.length} 道公开题目` : "未接入真实题库数据"}</span>
          <span>每页 10 行</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="w-10 px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">题目</th>
                <th className="px-4 py-3 font-medium">来源</th>
                <th className="px-4 py-3 font-medium">年份</th>
                <th className="px-4 py-3 font-medium">主题</th>
                <th className="px-4 py-3 font-medium">难度</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {realProblems.length > 0 ? (
                realProblems.map((problem, index) => (
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
                        <button>打开</button>
                        <button>解析</button>
                        <button>保存</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-zinc-800">
                  <td className="px-4 py-10 text-center text-sm text-zinc-500" colSpan={7}>
                    未接入真实题库数据。接入公开题目查询后，这里只显示数据库返回的真实记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-3 max-[980px]:grid-cols-1">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">题目预览</h2>
            <span className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
              {selected ? "已选择" : "等待选择"}
            </span>
          </div>
          {selected ? (
            <p className="max-w-3xl text-sm leading-6 text-zinc-300">{selected.description}</p>
          ) : (
            <p className="max-w-3xl text-sm leading-6 text-zinc-500">
              暂无公开题目可预览。列表接入真实数据并选择题目后，右侧会显示题面、标准答案状态和关联资料。
            </p>
          )}
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">已选题目</h2>
          {selected ? (
            <div className="space-y-3 text-sm">
              <Detail label="标题" value={selected.title} />
              <Detail label="机构" value={selected.institution} />
              <Detail label="类型" value={selected.type} />
              <Detail label="模型标签" value={selected.modelTags.join(", ")} />
            </div>
          ) : (
            <p className="text-sm leading-6 text-zinc-500">没有选中题目。</p>
          )}
        </section>
      </div>
    </section>
  );
}

function ArticleReader() {
  const realArticles = getRealArticleRecords();
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(-1);
  const selectedArticle =
    selectedArticleIndex >= 0 && selectedArticleIndex < realArticles.length
      ? realArticles[selectedArticleIndex]
      : undefined;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="h-10 min-w-[280px] flex-1 rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="按标题、作者、主题或模型搜索文章..."
        />
        <button className="h-10 rounded-md border border-zinc-700 bg-zinc-100 px-3 text-sm font-medium text-zinc-950">
          写文章
        </button>
      </div>
      <div className="grid grid-cols-[280px_minmax(0,1fr)] rounded-lg border border-zinc-800 bg-zinc-950/55 max-[900px]:grid-cols-1">
        <div className="border-r border-zinc-800 max-[900px]:border-r-0 max-[900px]:border-b">
          <p className="border-b border-zinc-800 p-4 text-xs text-zinc-500">
            {realArticles.length > 0 ? `${realArticles.length} 篇公开文章` : "未接入公开文章数据"}
          </p>
          {realArticles.length > 0 ? (
            realArticles.map((article, index) => (
              <button
                key={article.title}
                onClick={() => setSelectedArticleIndex(index)}
                className={`block w-full border-b border-zinc-800 p-4 text-left ${
                  selectedArticleIndex === index ? "bg-zinc-800/55" : "hover:bg-zinc-900"
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
            ))
          ) : (
            <div className="p-4 text-sm leading-6 text-zinc-500">
              暂无公开文章。公开文章列表接入数据库后才会显示作者、正文和关联题目。
            </div>
          )}
        </div>
        <article className="space-y-5 p-6">
          {selectedArticle ? (
            <>
              <p className="text-xs text-zinc-500">公开文章 / {selectedArticle.updated} / {selectedArticle.readTime}</p>
              <h2 className="max-w-2xl text-2xl font-semibold text-zinc-50">{selectedArticle.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-200">文</span>
                <span>{selectedArticle.author}</span>
              </div>
              <TagList tags={selectedArticle.tags} />
              <p className="max-w-3xl border-t border-zinc-800 pt-5 leading-7 text-zinc-300">{selectedArticle.excerpt}</p>
              <div className="rounded-lg border border-zinc-800 bg-[#0b0f12] p-4">
                <div className="mb-3 text-xs text-zinc-500">关联题目</div>
                {selectedArticle.relatedProblems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedArticle.relatedProblems.map((title) => (
                      <div key={title} className="flex items-center justify-between rounded-md border border-zinc-800 p-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{title}</p>
                          <p className="text-xs text-zinc-500">真实题库关联记录</p>
                        </div>
                        <button className="text-xs text-zinc-300">打开题目</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">暂无真实关联题目。</p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-500">Article Plaza / 阅读区</p>
              <h2 className="max-w-2xl text-2xl font-semibold text-zinc-50">未选择文章</h2>
              <p className="max-w-3xl border-t border-zinc-800 pt-5 leading-7 text-zinc-500">
                {realArticles.length > 0
                  ? "请从左侧选择一篇真实公开文章。"
                  : "未接入公开文章数据。这里不会展示示例作者、示例正文或编造的关联题目；接入真实 public document 查询后再渲染文章内容。"}
              </p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

function LibraryTable() {
  const realLibraryGroups = getRealLibraryGroups();
  const totalItems = realLibraryGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["新建文件夹", "新建题单", "新建文档"].map((action) => (
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
          placeholder="搜索个人资料库..."
        />
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/55">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 p-3">
        {["已保存题目", "我的文档", "题单", "文件夹"].map((tab, index) => (
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
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 font-medium">标签</th>
                <th className="px-4 py-3 font-medium">所在文件夹 / 题单</th>
                <th className="px-4 py-3 font-medium">可见性</th>
              </tr>
            </thead>
            <tbody>
              {realLibraryGroups.length > 0 ? (
                realLibraryGroups.map((group) => (
                  <Fragment key={group.label}>
                    <tr className="border-t border-zinc-800 bg-[#0b0f12] text-xs text-zinc-400">
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3 font-medium" colSpan={6}>
                        {group.label}
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.name} className="border-t border-zinc-800">
                        <td className="px-4 py-3 text-zinc-500" />
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
                ))
              ) : (
                <tr className="border-t border-zinc-800">
                  <td className="px-4 py-10 text-center text-sm text-zinc-500" colSpan={7}>
                    暂无个人资料。未接入个人资料库数据前，不展示示例文件夹、题单或文档。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          <span>{totalItems > 0 ? `显示 ${totalItems} 项` : "未接入个人资料库数据"}</span>
          <span>未选择</span>
        </div>
      </div>
    </section>
  );
}

function RightPanel({
  active,
  role,
  shellState,
  selectedIndex,
}: {
  active: ModuleConfig;
  role: Role;
  shellState: ShellState;
  selectedIndex: number;
}) {
  const selectedProblem = selectedIndex >= 0 ? getRealProblemRecords()[selectedIndex] : undefined;

  const title =
    active.id === "articles" ? "文章信息" : active.id === "library" ? "资料详情" : active.id === "bank" ? "已选题目" : "会话信息";
  const primaryDetails =
    active.id === "articles"
      ? [
          ["状态", "未选择文章"],
          ["数据", getRealArticleRecords().length > 0 ? "等待选择真实文章" : "未接入公开文章数据"],
        ]
      : active.id === "library"
        ? [
            ["状态", "未选择资料"],
            ["数据", getRealLibraryGroups().length > 0 ? "等待选择个人资料" : "未接入个人资料库数据"],
          ]
        : active.id === "bank"
          ? selectedProblem
            ? [
                ["来源", `${selectedProblem.source}, ${selectedProblem.type}`],
                ["机构", selectedProblem.institution],
                ["主题", selectedProblem.topics.join(", ")],
                ["模型标签", selectedProblem.modelTags.join(", ")],
              ]
            : [
                ["状态", "未选择题目"],
                ["数据", getRealProblemRecords().length > 0 ? "等待选择真实题目" : "未接入真实题库数据"],
              ]
          : [
              ["材料状态", "等待真实上传"],
              ["文本抽取", "真实抽取未接入"],
              ["标准答案", "未确认"],
              ["会话状态", getChineseShellState(shellState)],
            ];

  const actions =
    active.id === "articles"
      ? ["阅读全文", "保存到资料库", "在编辑器打开", "导出 PDF"]
      : active.id === "library"
        ? ["打开", "编辑", "发布", "移动到文件夹"]
        : active.id === "bank"
          ? ["打开详情", "开始 AI 解析", "加入个人资料库", "报告问题"]
          : ["保存会话", "创建文章草稿", "加入个人资料库", "导出解析（PDF）", "分享会话"];
  const isNonSolverEmpty =
    (active.id === "bank" && !selectedProblem) || active.id === "articles" || active.id === "library";

  return (
    <aside className="space-y-4 bg-[#090d10] p-4 max-[1180px]:hidden">
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">{title}</h2>
        <div className="space-y-4 text-sm">
          {primaryDetails.map(([label, value]) => (
            <Detail key={label} label={label} value={value} />
          ))}
          <Detail label="角色预览" value={getChineseRole(role)} />
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">{active.id === "solver" ? "会话笔记" : "备注"}</h2>
          <button className="text-xs text-zinc-400 hover:text-zinc-100">编辑</button>
        </div>
        <textarea
          className="h-[106px] w-full resize-none rounded-md border border-zinc-800 bg-[#0b0f12] p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder={active.id === "solver" ? "记录本次解题笔记..." : "为选中的真实记录添加备注..."}
        />
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/55 p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">操作</h2>
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action}
              disabled={isNonSolverEmpty}
              className="h-9 w-full rounded-md border border-zinc-800 bg-[#0b0f12] px-3 text-left text-sm text-zinc-300 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              title={isNonSolverEmpty ? "请先选择真实记录。" : action}
            >
              {action}
            </button>
          ))}
          <button
            disabled={active.id !== "solver"}
            className="h-9 w-full rounded-md border border-red-950/80 bg-[#0b0f12] px-3 text-left text-sm text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            title={active.id === "bank" && role !== "admin" ? "学生不能编辑或删除公共题库内容；服务端仍需校验权限。" : undefined}
          >
            {active.id === "library" ? "删除" : active.id === "articles" ? "取消发布文章" : active.id === "bank" ? "管理员编辑已禁用" : "删除草稿"}
          </button>
        </div>
      </section>
      <p className="px-1 text-xs leading-5 text-zinc-500">
        {active.id === "solver"
          ? "AI Solver 的标准答案门禁和上传校验由服务器执行；文本抽取、持久化接线和后续能力按阶段接入。"
          : "前端禁用只是可用性提示。公共题库写操作、个人资料归属和公开文章权限必须由服务端检查并配合 RLS 执行。"}
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
