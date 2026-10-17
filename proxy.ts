import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const protectedPaths = ["/overview", "/expenses", "/simulator", "/settings"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isSupabaseConfigured()) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "config");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const emailVerified = user?.app_metadata?.email_verified === true;
  if (isProtected && user && !emailVerified) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "unverified");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user && emailVerified) {
    const destination = request.nextUrl.searchParams.get("next");
    const safeDestination = destination?.startsWith("/") && !destination.startsWith("//") && !destination.startsWith("/\\")
      ? destination
      : "/overview";
    return NextResponse.redirect(new URL(safeDestination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo\\.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
