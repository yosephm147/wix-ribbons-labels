import type { APIRoute } from "astro";

/** Must match `app_versions.app_name` (migrations/002__power_up_apps.sql). */
const APP_NAME = "ribbons-labels";

function env(key: string): string | undefined {
  const v = process.env[key];
  return v === "" ? undefined : v;
}

async function latestFromDb(): Promise<string | null> {
  const devBase = env("LABELS_DEV_API_BASE")?.replace(/\/$/, "");
  if (devBase) {
    const url = `${devBase}/app-versions/latest?app_name=${encodeURIComponent(
      APP_NAME
    )}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  }

  const supabaseUrl = env("SUPABASE_URL")?.replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !key) return null;

  const url = `${supabaseUrl}/rest/v1/app_versions?app_name=eq.${encodeURIComponent(
    APP_NAME
  )}&select=version`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { version?: string }[];
  const v = rows[0]?.version;
  return typeof v === "string" ? v : null;
}

export const GET: APIRoute = async () => {
  try {
    const latestVersion = await latestFromDb();
    return new Response(JSON.stringify({ latestVersion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ribbons] latest-app-version:", e);
    return new Response(JSON.stringify({ latestVersion: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
