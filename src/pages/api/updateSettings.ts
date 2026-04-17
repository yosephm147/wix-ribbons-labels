import type { APIRoute } from "astro";
import {
  getOrCreateStoreSettings,
  updateStoreSettings,
} from "@/lib/updateSettingsPersistence";

function parseNonEmpty(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const instanceId = parseNonEmpty(url.searchParams.get("instanceId"));
    const siteId = parseNonEmpty(url.searchParams.get("siteId"));
    const siteUrl = parseNonEmpty(url.searchParams.get("siteUrl"));

    if (!instanceId || !siteId || !siteUrl) {
      return new Response(
        JSON.stringify({ error: "instanceId, siteId and siteUrl are required" }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const settings = await getOrCreateStoreSettings({
      instanceId,
      siteId,
      siteUrl,
    });
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read settings";
    console.error("[ribbons] updateSettings GET:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      instanceId?: unknown;
      siteId?: unknown;
      siteUrl?: unknown;
      seenFirstSuccessModal?: unknown;
      hasGivenFeedback?: unknown;
      unlockedLabels?: unknown;
      rating?: unknown;
      feedbackText?: unknown;
    };

    const instanceId =
      typeof body.instanceId === "string" ? body.instanceId.trim() : "";
    const siteId = typeof body.siteId === "string" ? body.siteId.trim() : "";
    const siteUrl =
      typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";
    if (!instanceId || !siteId || !siteUrl) {
      return new Response(
        JSON.stringify({ error: "instanceId, siteId and siteUrl are required" }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const settings = await updateStoreSettings({
      instanceId,
      siteId,
      siteUrl,
      seenFirstSuccessModal:
        typeof body.seenFirstSuccessModal === "boolean"
          ? body.seenFirstSuccessModal
          : undefined,
      hasGivenFeedback:
        typeof body.hasGivenFeedback === "boolean"
          ? body.hasGivenFeedback
          : undefined,
      unlockedLabels:
        typeof body.unlockedLabels === "boolean"
          ? body.unlockedLabels
          : undefined,
      rating:
        typeof body.rating === "number" && Number.isFinite(body.rating)
          ? body.rating
          : undefined,
      feedbackText:
        typeof body.feedbackText === "string"
          ? body.feedbackText.trim()
          : undefined,
    });

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings";
    console.error("[ribbons] updateSettings POST:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "application/json" },
    });
  }
};
