"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseVerifiedToken, sendFirebaseVerification } from "@/lib/firebase/rest";
import { getAppOrigin } from "@/lib/url";

type AuthMode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next");
  const safeNext = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/overview";

  // Clean sensitive tokens from URL hash (e.g. #access_token=...&refresh_token=...)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes("access_token") || hash.includes("refresh_token") || hash.includes("id_token")) {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", cleanUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setMode("signin");
      setAwaitingVerification(false);
      setMessage("تم تأكيد البريد. سجّل الدخول الآن بالبريد وكلمة المرور.");
    }
    if (searchParams.get("error") === "unverified") {
      setMode("signin");
      setMessage("أكد بريدك الإلكتروني أولًا، ثم سجّل الدخول مرة أخرى.");
    }
  }, [searchParams]);

  function readableError(message: string) {
    const lower = message.toLowerCase();
    // Prevent leaking tokens, bearer, jwt or raw credentials
    if (
      lower.includes("bearer") ||
      lower.includes("jwt") ||
      lower.includes("eyjh") ||
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("api_key") ||
      lower.includes("sb_")
    ) {
      return "تعذر إكمال عملية المصادقة. يرجى إعادة المحاولة.";
    }

    if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (lower.includes("already registered") || lower.includes("already been registered")) return "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.";
    if (lower.includes("إعدادات firebase غير مكتملة")) return "إعدادات المصادقة غير مكتملة على الخادم.";
    if (lower.includes("error sending confirmation email") || lower.includes("sending confirmation email")) return "تعذر إرسال رسالة التأكيد. راجع إعدادات البريد في Supabase.";
    if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("fetch failed")) return "تعذر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مرة أخرى.";
    if (lower.includes("signup is disabled") || lower.includes("signups not allowed") || lower.includes("email_provider_disabled")) return "إنشاء الحسابات غير متاح حالياً. تواصل مع الدعم.";
    if (lower.includes("password")) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
    if (lower.includes("supabase is not configured") || searchParams.get("error") === "config") return "تعذر الاتصال بخدمة الحسابات. حاول مرة أخرى بعد قليل.";
    if (searchParams.get("error") === "auth") return "تعذر إكمال تسجيل الدخول. حاول مرة أخرى.";
    if (searchParams.get("error") === "unverified") return "أكد بريدك الإلكتروني أولًا، ثم سجّل الدخول مرة أخرى.";
    
    return "تعذر إتمام العملية. يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
  }

  function getErrorMessage(caught: unknown) {
    if (caught instanceof Error) return caught.message;
    if (typeof caught === "object" && caught !== null && "message" in caught && typeof caught.message === "string") {
      return caught.message;
    }
    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      if (awaitingVerification) {
        await sendFirebaseVerification(email.trim(), password);
        setResendCooldown(60);
        setMessage(`أرسلنا رابط تأكيد جديد إلى ${email.trim()}. افتحه ثم سجّل الدخول بالبريد وكلمة المرور.`);
        return;
      }
      if (mode === "signin") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        if (data.user?.app_metadata?.email_verified !== true) {
          const firebaseIdToken = await getFirebaseVerifiedToken(email.trim(), password);
          if (!firebaseIdToken) {
            await supabase.auth.signOut();
            setAwaitingVerification(true);
            setResendCooldown(60);
            setMessage(`أرسلنا رابط تأكيد إلى ${email.trim()}. افتحه ثم ارجع وسجّل الدخول مرة أخرى.`);
            return;
          }
          const response = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session?.access_token ?? ""}`,
            },
            body: JSON.stringify({ firebaseIdToken }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "تعذر حفظ تأكيد البريد.");
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
        }
        router.replace(safeNext);
        router.refresh();
      } else {
        if (password.length < 8) {
          setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("كلمتا المرور غير متطابقتين.");
          setLoading(false);
          return;
        }
        const appOrigin = getAppOrigin();
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${appOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          },
        });
        if (authError) throw authError;
        if (data.user?.identities?.length === 0) {
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
          setMessage("هذا البريد لديه حساب بالفعل. سجّل الدخول بالبريد وكلمة المرور.");
          return;
        }
        try {
          await sendFirebaseVerification(email.trim(), password);
        } catch (error) {
          if (data.session) await supabase.auth.signOut();
          throw error;
        }
        await supabase.auth.signOut();
        setAwaitingVerification(true);
        setResendCooldown(60);
        setMessage(`أرسلنا رابط تأكيد إلى ${email.trim()}. افتحه، وبعدها ارجع وسجّل الدخول بالبريد وكلمة المرور.`);
      }
    } catch (caught) {
      const authMessage = getErrorMessage(caught);
      if (authMessage.toLowerCase().includes("already registered")) {
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setAwaitingVerification(false);
        setMessage("هذا البريد لديه حساب بالفعل. سجّل الدخول بالبريد وكلمة المرور.");
      } else {
        setError(readableError(authMessage));
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (loading || resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendFirebaseVerification(email.trim(), password);
      setResendCooldown(60);
      setMessage(`أرسلنا رابط تأكيد جديد إلى ${email.trim()}. افتحه ثم سجّل الدخول.`);
    } catch (caught) {
      setError(readableError(getErrorMessage(caught)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const appOrigin = getAppOrigin();
      const callback = new URL("/auth/callback", appOrigin);
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
      setError(readableError(getErrorMessage(caught)));
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
          <button type="button" onClick={() => { setMode("signin"); setAwaitingVerification(false); setError(null); setMessage(null); }} className={`rounded-lg py-2 ${mode === "signin" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>تسجيل الدخول</button>
          <button type="button" onClick={() => { setMode("signup"); setAwaitingVerification(false); setError(null); setMessage(null); }} className={`rounded-lg py-2 ${mode === "signup" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>إنشاء حساب</button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">{message}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "signup" && !awaitingVerification && <label className="block text-sm font-semibold text-slate-700">
            الاسم بالكامل
            <input type="text" autoComplete="name" required maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>}
          <label className="block text-sm font-semibold text-slate-700">
            البريد الإلكتروني
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          {awaitingVerification ? (
            <p className="rounded-xl bg-indigo-50 px-3 py-3 text-xs leading-5 text-indigo-800">افتح رابط التأكيد الذي وصلك بالبريد. بعد التأكيد، ارجع وسجّل الدخول. لو لم يصلك الرابط، أعد إرساله من الزر أدناه.</p>
          ) : (
            <>
              <label className="block text-sm font-semibold text-slate-700">
                كلمة المرور
                <span className="relative mt-1.5 block">
                  <input type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 pe-11 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  <button type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-700"><span aria-hidden="true">{showPassword ? <FiEyeOff /> : <FiEye />}</span></button>
                </span>
                {mode === "signup" && <span className="mt-1 block text-[11px] font-normal text-slate-400">8 أحرف على الأقل</span>}
              </label>
              {mode === "signup" && <label className="block text-sm font-semibold text-slate-700">
                تأكيد كلمة المرور
                <span className="relative mt-1.5 block">
                  <input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 pe-11 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  <button type="button" aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"} onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-700"><span aria-hidden="true">{showConfirmPassword ? <FiEyeOff /> : <FiEye />}</span></button>
                </span>
              </label>}
            </>
          )}
          {!awaitingVerification && <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
            {loading ? "جاري التنفيذ…" : mode === "signin" ? "دخول بالبريد الإلكتروني" : "إنشاء الحساب"}
          </button>}
          {awaitingVerification && <button type="button" onClick={resendVerification} disabled={loading || resendCooldown > 0 || !password} className="w-full text-sm font-semibold text-indigo-700 disabled:opacity-60">{loading ? "جاري الإرسال…" : resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : "إعادة إرسال رابط التأكيد"}</button>}
        </form>

        {!awaitingVerification && <>
          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />أو<span className="h-px flex-1 bg-slate-200" /></div>
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
            المتابعة باستخدام Google
          </button>
        </>}
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">تُحفظ ميزانيتك ومصروفاتك بأمان في حسابك.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-dvh" />}><LoginForm /></Suspense>;
}
