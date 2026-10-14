"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("حدث خطأ أثناء تسجيل الدخول. حاول مرة تانية.");
    }
  }, [searchParams]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("حدث خطأ في الاتصال بـ Google. تأكد من إعدادات Supabase.");
      setLoading(false);
    }
    // On success, browser is redirected — nothing else to do here
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--color-background)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-3xl shadow-elevated px-8 py-10 flex flex-col items-center gap-6">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25">
              💰
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                جيبك
              </h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                احسب ميزانيتك وشوف هتكفيك لحد إمتى
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100" />

          {/* Sign in heading */}
          <div className="text-center">
            <p className="text-base font-bold text-slate-800">
              سجل دخول أو أنشئ حساب
            </p>
            <p className="text-xs text-slate-500 mt-1">
              بياناتك محفوظة بشكل آمن على السحابة
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2 animate-slide-up"
            >
              <span className="text-base" aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="
              w-full flex items-center justify-center gap-3
              px-5 py-3.5 rounded-2xl
              bg-white border border-slate-200 hover:border-slate-300
              shadow-sm hover:shadow-md
              text-sm font-semibold text-slate-700
              transition-all duration-200
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
            "
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-slate-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>جاري الاتصال…</span>
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                  />
                </svg>
                <span>تسجيل الدخول بـ Google</span>
              </>
            )}
          </button>

          {/* Privacy note */}
          <p className="text-[11px] text-center text-slate-400 leading-relaxed px-2">
            🔒 بياناتك خاصة ومشفرة. لا نشارك أي معلومات مع أطراف خارجية.
          </p>
        </div>
      </div>
    </div>
  );
}
