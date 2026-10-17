/**
 * Returns the canonical origin URL of the application.
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL / APP_URL (explicitly configured production domain)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (Vercel automatic production URL)
 * 3. VERCEL_URL (preview/deployment URL)
 * 4. Fallback: window.location.origin (client-side) or request.url (if provided) or localhost
 */
export function getAppOrigin(requestOrUrl?: Request | string): string {
  // 1. Explicit domain configuration
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  // 2. Vercel environment variables
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) {
    return `https://${vercelProd.replace(/\/+$/, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  // 3. From incoming Request or URL string (server-side)
  if (requestOrUrl) {
    try {
      const urlString = typeof requestOrUrl === "string" ? requestOrUrl : requestOrUrl.url;
      const parsed = new URL(urlString);
      return parsed.origin;
    } catch {
      // ignore parsing error
    }
  }

  // 4. Browser environment
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // 5. Default local development fallback
  return "http://localhost:3000";
}
