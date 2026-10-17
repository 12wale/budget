import { NextResponse } from "next/server";
import { getFirebaseVerifiedToken, sendFirebaseVerification } from "@/lib/firebase/server";
import { getAppOrigin } from "@/lib/url";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    action?: string;
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim();
  const password = body?.password;
  if (!email || !password || password.length > 256 || email.length > 320) {
    return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا وكلمة مرور صالحين." }, { status: 400 });
  }

  const origin = getAppOrigin(request);

  try {
    if (body?.action === "send-verification") {
      const continueUrl = new URL("/login?verified=1", origin).toString();
      await sendFirebaseVerification(email, password, continueUrl);
      return NextResponse.json({ sent: true });
    }
    if (body?.action === "get-verified-token") {
      const continueUrl = new URL("/login?verified=1", origin).toString();
      const idToken = await getFirebaseVerifiedToken(email, password, continueUrl);
      return NextResponse.json({ idToken });
    }
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إكمال التحقق عبر Firebase.";
    const status = message.includes("غير مكتملة على الخادم") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
