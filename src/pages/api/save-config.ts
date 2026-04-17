import type { APIRoute } from "astro";
import {
  persistLabelsConfigSnapshot,
  type LabelsConfigSnapshotInput,
} from "@/lib/persistLabelsConfigSnapshot";

function isSnapshotBody(body: unknown): body is LabelsConfigSnapshotInput {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return (
    typeof o.instanceId === "string" &&
    typeof o.siteId === "string" &&
    o.config != null &&
    typeof o.config === "object" &&
    typeof o.siteUrl === "string" &&
    typeof o.merchantEmail === "string"
  );
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  try {
    if (!isSnapshotBody(body)) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await persistLabelsConfigSnapshot(body);
    if (result.channel === "none") {
      return new Response(
        JSON.stringify({
          error:
            "Persistence not configured. Set LABELS_DEV_API_BASE (backend-dev-api) or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        channel: result.channel,
        appended: result.appended,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "PERSIST FAILED";
    console.error("[ribbons] save-config:", e);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
