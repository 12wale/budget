"use client";

async function firebaseRequest<T>(action: string, email: string, password: string): Promise<T> {
  const response = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, email, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "تعذر إكمال التحقق عبر Firebase.");
  return result as T;
}

export async function sendFirebaseVerification(email: string, password: string): Promise<void> {
  await firebaseRequest("send-verification", email, password);
}

export async function getFirebaseVerifiedToken(email: string, password: string): Promise<string | null> {
  const result = await firebaseRequest<{ idToken: string | null }>("get-verified-token", email, password);
  return result.idToken;
}
