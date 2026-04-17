import type { StoreSettings, StoreSettingsInput } from "./storeSettingsTypes";

export type { StoreSettings, StoreSettingsInput } from "./storeSettingsTypes";

function envString(key: string): string | undefined {
  const v = process.env[key];
  return v === "" ? undefined : v;
}

const LABELS_DEV_API_BASE = envString("LABELS_DEV_API_BASE");
const SUPABASE_URL = envString("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = envString("SUPABASE_SERVICE_ROLE_KEY");

function normalizeSettings(row: {
  seen_first_success_modal?: unknown;
  has_given_feedback?: unknown;
  unlocked_labels?: unknown;
  rating?: unknown;
  feedback_text?: unknown;
}): StoreSettings {
  return {
    seenFirstSuccessModal: Boolean(row.seen_first_success_modal),
    hasGivenFeedback: Boolean(row.has_given_feedback),
    unlockedLabels: Boolean(row.unlocked_labels),
    rating:
      typeof row.rating === "number" && Number.isFinite(row.rating)
        ? row.rating
        : null,
    feedbackText:
      typeof row.feedback_text === "string" ? row.feedback_text : null,
  };
}

async function getStoreSettingsViaDevApi(
  base: string,
  input: StoreSettingsInput
): Promise<StoreSettings | null> {
  const clean = base.replace(/\/$/, "");
  const url =
    `${clean}/update-settings` +
    `?instanceId=${encodeURIComponent(input.instanceId)}` +
    `&siteId=${encodeURIComponent(input.siteId)}` +
    `&siteUrl=${encodeURIComponent(input.siteUrl)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `dev-api ${res.status}`);
  }
  const payload = (await res.json()) as {
    seenFirstSuccessModal?: boolean;
    hasGivenFeedback?: boolean;
    unlockedLabels?: boolean;
    rating?: number | null;
    feedbackText?: string | null;
  } | null;
  if (payload == null) {
    return null;
  }
  return {
    seenFirstSuccessModal: Boolean(payload.seenFirstSuccessModal),
    hasGivenFeedback: Boolean(payload.hasGivenFeedback),
    unlockedLabels: Boolean(payload.unlockedLabels),
    rating:
      typeof payload.rating === "number" && Number.isFinite(payload.rating)
        ? payload.rating
        : null,
    feedbackText:
      typeof payload.feedbackText === "string" ? payload.feedbackText : null,
  };
}

async function upsertStoreSettingsViaDevApi(
  base: string,
  input: StoreSettingsInput
): Promise<StoreSettings> {
  const clean = base.replace(/\/$/, "");
  const url = `${clean}/update-settings`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instanceId: input.instanceId,
      siteId: input.siteId,
      siteUrl: input.siteUrl,
      ...(input.seenFirstSuccessModal !== undefined && {
        seenFirstSuccessModal: input.seenFirstSuccessModal,
      }),
      ...(input.hasGivenFeedback !== undefined && {
        hasGivenFeedback: input.hasGivenFeedback,
      }),
      ...(input.unlockedLabels !== undefined && {
        unlockedLabels: input.unlockedLabels,
      }),
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.feedbackText !== undefined && {
        feedbackText: input.feedbackText,
      }),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `dev-api ${res.status}`);
  }
  const payload = (await res.json()) as {
    seenFirstSuccessModal?: boolean;
    hasGivenFeedback?: boolean;
    unlockedLabels?: boolean;
    rating?: number | null;
    feedbackText?: string | null;
  };
  return {
    seenFirstSuccessModal: Boolean(payload.seenFirstSuccessModal),
    hasGivenFeedback: Boolean(payload.hasGivenFeedback),
    unlockedLabels: Boolean(payload.unlockedLabels),
    rating:
      typeof payload.rating === "number" && Number.isFinite(payload.rating)
        ? payload.rating
        : null,
    feedbackText:
      typeof payload.feedbackText === "string" ? payload.feedbackText : null,
  };
}

async function getStoreSettingsViaSupabase(
  supabaseUrl: string,
  serviceRoleKey: string,
  input: StoreSettingsInput
): Promise<StoreSettings | null> {
  const clean = supabaseUrl.replace(/\/$/, "");
  const url =
    `${clean}/rest/v1/ribbons_store_settings` +
    `?instance_id=eq.${encodeURIComponent(input.instanceId)}` +
    `&select=seen_first_success_modal,has_given_feedback,unlocked_labels,rating,feedback_text`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase ${res.status}`);
  }
  const rows = (await res.json()) as Array<{
    seen_first_success_modal?: boolean;
    has_given_feedback?: boolean;
    unlocked_labels?: boolean;
    rating?: number | null;
    feedback_text?: string | null;
  }>;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return normalizeSettings(row);
}

async function upsertStoreSettingsViaSupabase(
  supabaseUrl: string,
  serviceRoleKey: string,
  input: StoreSettingsInput
): Promise<StoreSettings> {
  const clean = supabaseUrl.replace(/\/$/, "");
  const row = {
    instance_id: input.instanceId,
    site_id: input.siteId,
    site_url: input.siteUrl,
    ...(input.seenFirstSuccessModal !== undefined && {
      seen_first_success_modal: Boolean(input.seenFirstSuccessModal),
    }),
    ...(input.hasGivenFeedback !== undefined && {
      has_given_feedback: Boolean(input.hasGivenFeedback),
    }),
    ...(input.unlockedLabels !== undefined && {
      unlocked_labels: Boolean(input.unlockedLabels),
    }),
    ...(input.rating !== undefined && {
      rating: typeof input.rating === "number" ? input.rating : null,
    }),
    ...(input.feedbackText !== undefined && {
      feedback_text:
        typeof input.feedbackText === "string" ? input.feedbackText : null,
    }),
  };
  const url = `${clean}/rest/v1/ribbons_store_settings?on_conflict=instance_id`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase ${res.status}`);
  }
  const rows = (await res.json()) as Array<{
    seen_first_success_modal?: boolean;
    has_given_feedback?: boolean;
    unlocked_labels?: boolean;
    rating?: number | null;
    feedback_text?: string | null;
  }>;
  return normalizeSettings(rows[0] ?? row);
}

export async function getOrCreateStoreSettings(
  input: StoreSettingsInput
): Promise<StoreSettings> {
  if (LABELS_DEV_API_BASE) {
    const settings = await getStoreSettingsViaDevApi(
      LABELS_DEV_API_BASE,
      input
    );
    if (settings) return settings;
    return upsertStoreSettingsViaDevApi(LABELS_DEV_API_BASE, input);
  }
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const settings = await getStoreSettingsViaSupabase(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      input
    );
    if (settings) return settings;
    return upsertStoreSettingsViaSupabase(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        instanceId: input.instanceId,
        siteId: input.siteId,
        siteUrl: input.siteUrl,
        seenFirstSuccessModal: false,
        hasGivenFeedback: false,
        unlockedLabels: false,
      }
    );
  }
  return {
    seenFirstSuccessModal: false,
    hasGivenFeedback: false,
    unlockedLabels: false,
    rating: null,
    feedbackText: null,
  };
}

export async function updateStoreSettings(
  input: StoreSettingsInput
): Promise<StoreSettings> {
  if (LABELS_DEV_API_BASE) {
    return upsertStoreSettingsViaDevApi(LABELS_DEV_API_BASE, input);
  }
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    return upsertStoreSettingsViaSupabase(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      input
    );
  }
  throw new Error("No persistence layer configured");
}
