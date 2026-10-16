type FirebaseAuthResponse = { idToken: string; email: string; localId: string };

function getApiKey(): string {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error("إعدادات Firebase غير مكتملة على الخادم.");
  return apiKey;
}

async function firebaseRequest<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${method}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    const code = result?.error?.message;
    const messages: Record<string, string> = {
      EMAIL_EXISTS: "هذا البريد مسجل بالفعل. سجّل الدخول أولًا.",
      EMAIL_NOT_FOUND: "لا يوجد حساب تحقق لهذا البريد بعد. أنشئ حسابًا أولًا.",
      INVALID_PASSWORD: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      INVALID_LOGIN_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      TOO_MANY_ATTEMPTS_TRY_LATER: "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
      OPERATION_NOT_ALLOWED: "فعّل Email/Password في Firebase Authentication.",
      API_KEY_INVALID: "مفتاح Firebase غير صحيح. راجع قيمة FIREBASE_API_KEY في إعدادات Vercel.",
      CONFIGURATION_NOT_FOUND: "إعداد Email/Password غير مكتمل في Firebase Authentication.",
      PROJECT_NOT_FOUND: "مشروع Firebase غير موجود أو مفتاحه لا يخص المشروع الصحيح.",
      INVALID_CONTINUE_URI: "رابط العودة غير مقبول. أضف نطاق التطبيق إلى Firebase Authorized domains.",
      UNAUTHORIZED_DOMAIN: "نطاق التطبيق غير مسموح. أضفه في Firebase Authentication → Settings → Authorized domains.",
      QUOTA_EXCEEDED: "تم تجاوز حد إرسال رسائل Firebase مؤقتًا. حاول لاحقًا.",
    };
    throw new Error(messages[code] ?? `تعذر إكمال التحقق عبر Firebase (${code ?? "UNKNOWN_ERROR"}).`);
  }
  return result as T;
}

export async function sendFirebaseVerification(email: string, password: string, continueUrl: string) {
  let account: FirebaseAuthResponse;
  try {
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signUp", {
      email, password, returnSecureToken: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("مسجل بالفعل")) throw error;
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
      email, password, returnSecureToken: true,
    });
  }
  await firebaseRequest("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL", idToken: account.idToken, continueUrl,
  });
}

export async function getFirebaseVerifiedToken(
  email: string,
  password: string,
  continueUrl: string,
): Promise<string | null> {
  let account: FirebaseAuthResponse;
  try {
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
      email, password, returnSecureToken: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("لا يوجد حساب تحقق")) throw error;
    // Recover when Supabase signup succeeded but Firebase account creation/email sending failed.
    await sendFirebaseVerification(email, password, continueUrl);
    return null;
  }
  const lookup = await firebaseRequest<{ users?: Array<{ emailVerified?: boolean; email?: string }> }>("accounts:lookup", {
    idToken: account.idToken,
  });
  const user = lookup.users?.[0];
  if (!user?.emailVerified || user.email?.toLowerCase() !== email.toLowerCase()) return null;
  return account.idToken;
}
