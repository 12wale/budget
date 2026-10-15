"use client";

import { Suspense, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next");
  const safeNext = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/overview";

  function readableError(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (lower.includes("already registered") || lower.includes("already been registered")) return "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.";
    if (lower.includes("password")) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
    if (lower.includes("supabase is not configured")) return "تعذر الاتصال بخدمة الحسابات. حاول مرة أخرى بعد قليل.";
    if (searchParams.get("error") === "config") return "تعذر الاتصال بخدمة الحسابات. حاول مرة أخرى بعد قليل.";
    if (searchParams.get("error") === "auth") return "تعذر إكمال تسجيل الدخول. حاول مرة أخرى.";
    return "تعذر إتمام العملية. تحقق من اتصالك ثم حاول مرة أخرى.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace(safeNext);
        router.refresh();
      } else {
        if (password.length < 8) {
          setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
          setLoading(false);
          return;
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace(safeNext);
          router.refresh();
        } else {
          setMessage("تم إنشاء الحساب. افتح رسالة التأكيد التي أرسلناها إلى بريدك، ثم سجّل الدخول.");
        }
      }
    } catch (caught) {
      setError(readableError(caught instanceof Error ? caught.message : ""));
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNext);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(readableError(caught instanceof Error ? caught.message : ""));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--color-background)]">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-7 py-9 shadow-elevated">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/brand-logo.jpg"
            alt="جيبك"
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
            priority
          />
          <h1 className="text-2xl font-extrabold text-slate-900">جيبك</h1>
          <p className="text-sm text-slate-500">سجّل دخولك واحفظ ميزانيتك ومصاريفك بأمان.</p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" onClick={() => { setMode("signin"); setError(null); setMessage(null); }} className={`rounded-lg py-2 ${mode === "signin" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>تسجيل الدخول</button>
          <button type="button" onClick={() => { setMode("signup"); setError(null); setMessage(null); }} className={`rounded-lg py-2 ${mode === "signup" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>إنشاء حساب</button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            البريد الإلكتروني
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            كلمة المرور
            <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            {mode === "signup" && <span className="mt-1 block text-[11px] font-normal text-slate-400">8 أحرف على الأقل</span>}
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
            {loading ? "جاري التنفيذ…" : mode === "signin" ? "دخول بالبريد الإلكتروني" : "إنشاء الحساب"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />أو<span className="h-px flex-1 bg-slate-200" /></div>
        <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
          المتابعة باستخدام Google
        </button>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">تُحفظ ميزانيتك ومصروفاتك بأمان في حسابك.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-dvh" />}><LoginForm /></Suspense>;
}
