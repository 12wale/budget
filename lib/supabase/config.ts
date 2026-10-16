export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const urlLower = url.toLowerCase();
  const keyLower = anonKey.toLowerCase();
  if (urlLower.includes("your_") || urlLower.includes("your-") || keyLower.includes("your_") || keyLower.includes("your-")) return false;

  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  return {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  };
}
