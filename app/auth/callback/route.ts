import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { setEmailVerified } from "@/lib/supabase/admin";
import { getAppOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const origin = getAppOrigin(request);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/\\")
    ? requestedNext
    : "/overview";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        const isGoogleIdentity = user?.app_metadata?.provider === "google"
          || user?.identities?.some((identity) => identity.provider === "google");
        if (user && isGoogleIdentity) {
          await setEmailVerified(user.id, user.app_metadata ?? {});
          await supabase.auth.refreshSession();
        }
        return NextResponse.redirect(new URL(next, origin));
      }
    } catch {
      // Redirect to the login screen instead of exposing provider configuration errors.
    }
  }

  // Auth error — redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
