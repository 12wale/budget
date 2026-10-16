import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, setEmailVerified } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const supabaseToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const body = await request.json().catch(() => null) as { firebaseIdToken?: string } | null;
  const firebaseIdToken = body?.firebaseIdToken;
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!supabaseToken || !firebaseIdToken || !firebaseApiKey) {
    return NextResponse.json({ error: "بيانات التحقق غير مكتملة." }, { status: 400 });
  }

  try {
    const { url, anonKey } = getSupabaseConfig();
    const supabase = createSupabaseClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser(supabaseToken);
    if (userError || !supabaseUser?.email) {
      return NextResponse.json({ error: "جلسة Supabase غير صالحة." }, { status: 401 });
    }

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: firebaseIdToken }),
        cache: "no-store",
      },
    );
    if (!firebaseResponse.ok) {
      return NextResponse.json({ error: "تعذر التحقق من حساب Firebase." }, { status: 401 });
    }
    const firebaseData = await firebaseResponse.json() as {
      users?: Array<{ email?: string; emailVerified?: boolean }>;
    };
    const firebaseUser = firebaseData.users?.[0];
    if (
      !firebaseUser?.emailVerified ||
      firebaseUser.email?.toLowerCase() !== supabaseUser.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "أكد البريد نفسه المستخدم في حساب التطبيق." }, { status: 403 });
    }

    await setEmailVerified(supabaseUser.id, supabaseUser.app_metadata ?? {});
    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "تعذر حفظ تأكيد البريد. راجع إعدادات الخادم." }, { status: 500 });
  }
}
