import { NextResponse } from "next/server";
import { getFirebaseVerifiedToken, sendFirebaseVerification } from "@/lib/firebase/server";

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

  try {
    if (body?.action === "send-verification") {
      const continueUrl = new URL("/login?verified=1", request.url).toString();
      await sendFirebaseVerification(email, password, continueUrl);
      return NextResponse.json({ sent: true });
    }
    if (body?.action === "get-verified-token") {
      const idToken = await getFirebaseVerifiedToken(email, password);
      return NextResponse.json({ idToken });
    }
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إكمال التحقق عبر Firebase.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
