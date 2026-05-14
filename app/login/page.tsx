"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#080b0d] px-4 py-10 text-zinc-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CPHO Internal Access</p>
            <h1 className="text-2xl font-semibold text-zinc-100">登录</h1>
            <p className="text-sm leading-6 text-zinc-400">使用已配置的 Supabase 测试账号进入平台。</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">邮箱</span>
              <span className="flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-3 py-2">
                <Mail className="h-4 w-4 text-zinc-500" />
                <input
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">密码</span>
              <span className="flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-3 py-2">
                <LockKeyhole className="h-4 w-4 text-zinc-500" />
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="输入密码"
                  type="password"
                  value={password}
                />
              </span>
            </label>

            {status === "error" && (
              <p className="border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {errorMessage}
              </p>
            )}

            <button
              className="w-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
              disabled={status === "loading" || !email.trim() || !password}
              type="submit"
            >
              {status === "loading" ? "登录中..." : "进入平台"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
