const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

type FirebaseAuthResponse = {
  idToken: string;
  email: string;
  localId: string;
};

function getApiKey(): string {
  if (!firebaseApiKey) throw new Error("Firebase is not configured.");
  return firebaseApiKey;
}

async function firebaseRequest<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${method}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    };
    throw new Error(messages[code] ?? "تعذر إكمال التحقق عبر Firebase.");
  }
  return result as T;
}

export async function sendFirebaseVerification(email: string, password: string): Promise<void> {
  let account: FirebaseAuthResponse;
  try {
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signUp", {
      email,
      password,
      returnSecureToken: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("مسجل بالفعل")) throw error;
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  }

  await firebaseRequest("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken: account.idToken,
    continueUrl: `${window.location.origin}/login?verified=1`,
  });
}

export async function getFirebaseVerifiedToken(email: string, password: string): Promise<string | null> {
  let account: FirebaseAuthResponse;
  try {
    account = await firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("لا يوجد حساب تحقق")) throw error;
    await sendFirebaseVerification(email, password);
    return null;
  }
  const lookup = await firebaseRequest<{ users?: Array<{ emailVerified?: boolean; email?: string }> }>("accounts:lookup", {
    idToken: account.idToken,
  });
  const user = lookup.users?.[0];
  if (!user?.emailVerified || user.email?.toLowerCase() !== email.toLowerCase()) return null;
  return account.idToken;
}
