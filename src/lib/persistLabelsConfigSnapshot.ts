import type { LabelsConfig } from "../extensions/dashboard/pages/types";
import { serializeLabels } from "./labelsStorage";

/** Read from `process.env` so this module can run in Wix backend bundles (no `astro:env/server`). Astro + Cloudflare also sync schema vars onto `process.env` per request in dev/prod. */
function envString(key: string): string | undefined {
  const v = process.env[key];
  return v === "" ? undefined : v;
}

const LABELS_DEV_API_BASE = envString("LABELS_DEV_API_BASE");
const SUPABASE_URL = envString("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = envString("SUPABASE_SERVICE_ROLE_KEY");

export type LabelsConfigSnapshotInput = {
  instanceId: string;
  siteId: string;
  config: LabelsConfig;
  siteUrl: string;
  merchantEmail: string;
};

export type PersistLabelsResult =
  | { ok: true; channel: "dev-api"; appended: boolean }
  | { ok: true; channel: "supabase"; appended: boolean }
  | { ok: true; channel: "none" };

async function hashLabelsConfigHex(config: LabelsConfig): Promise<string> {
  const s = serializeLabels(config);
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function persistViaDevApi(
  base: string,
  input: LabelsConfigSnapshotInput
): Promise<PersistLabelsResult> {
  const url = `${base}/log`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `dev-api ${res.status}`);
  }
  let parsed: { appended?: boolean } = {};
  try {
    parsed = JSON.parse(text) as { appended?: boolean };
  } catch {
    /* ignore */
  }
  return { ok: true, channel: "dev-api", appended: Boolean(parsed.appended) };
}

async function persistViaSupabase(
  supabaseUrl: string,
  serviceRoleKey: string,
  input: LabelsConfigSnapshotInput
): Promise<PersistLabelsResult> {
  const base = supabaseUrl.replace(/\/$/, "");
  const configHash = await hashLabelsConfigHex(input.config);
  const configVersion =
    typeof input.config.version === "number" ? input.config.version : 0;

  const row = {
    instance_id: input.instanceId,
    site_id: input.siteId,
    config: input.config,
    config_hash: configHash,
    config_version: configVersion,
    site_url: input.siteUrl,
    merchant_email: input.merchantEmail,
  };

  const url = `${base}/rest/v1/ribbons_configs?on_conflict=instance_id,config_hash`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=ignore-duplicates",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase ${res.status}`);
  }

  const raw = await res.text();
  if (!raw || raw === "[]") {
    return { ok: true, channel: "supabase", appended: false };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const appended = Array.isArray(parsed)
      ? parsed.length > 0
      : Boolean(parsed);
    return { ok: true, channel: "supabase", appended };
  } catch {
    return { ok: true, channel: "supabase", appended: true };
  }
}

/**
 * Dev: `LABELS_DEV_API_BASE` → POST `{base}/log` (see `backend-dev-api/server.ts`).
 * Prod: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → PostgREST `configs` insert.
 * If neither is set, returns `{ channel: "none" }` (no throw).
 */
export async function persistLabelsConfigSnapshot(
  input: LabelsConfigSnapshotInput
): Promise<PersistLabelsResult> {
  const devBase = LABELS_DEV_API_BASE;
  if (devBase) {
    return persistViaDevApi(devBase, input);
  }

  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    return persistViaSupabase(supabaseUrl, supabaseKey, input);
  }

  return { ok: true, channel: "none" };
}
