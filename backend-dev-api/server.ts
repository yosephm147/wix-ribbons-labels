import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { config as loadEnv } from "dotenv";
import express from "express";
import pkg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
// Root .env first; each next file may override (same as typical Next/Vite precedence).
loadEnv({ path: path.join(repoRoot, ".env") });
loadEnv({ path: path.join(repoRoot, ".env.local"), override: true });
loadEnv({ path: path.join(__dirname, ".env"), override: true });
loadEnv({ path: path.join(__dirname, ".env.local"), override: true });

const { Pool } = pkg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
const nodeEnv = process.env.NODE_ENV || "development";
const pgSslMode = process.env.PGSSLMODE;

const pool = new Pool({
  application_name: "ribbons-dev-api",
  connectionString: databaseUrl,
  ssl:
    pgSslMode === "disable"
      ? false
      : nodeEnv === "production"
      ? { rejectUnauthorized: pgSslMode === "require" }
      : false,
});

/** Same canonical string as `serializeLabels` in the app (JSON.stringify). */
function hashLabelsConfig(config: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(config), "utf8")
    .digest("hex");
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/app-versions/latest", async (req, res) => {
  const q = req.query.app_name;
  const appName =
    typeof q === "string" && q.trim() !== "" ? q.trim() : "ribbons-labels";
  try {
    const r = await pool.query(
      `SELECT version FROM app_versions WHERE app_name = $1 LIMIT 1`,
      [appName]
    );
    const row = r.rows[0] as { version?: string } | undefined;
    const version = row?.version;
    if (typeof version !== "string") {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ version });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "query failed" });
  }
});

app.post("/log", async (req, res) => {
  const { instanceId, siteId, config, siteUrl, merchantEmail } = req.body ?? {};
  if (
    typeof instanceId !== "string" ||
    typeof siteId !== "string" ||
    config == null ||
    typeof config !== "object" ||
    typeof siteUrl !== "string" ||
    typeof merchantEmail !== "string"
  ) {
    res.status(400).json({
      error:
        "Expected body: { instanceId, siteId, config, siteUrl, merchantEmail }",
    });
    return;
  }

  const version =
    typeof (config as { version?: unknown }).version === "number"
      ? (config as { version: number }).version
      : 0;

  const configHash = hashLabelsConfig(config);

  try {
    const r = await pool.query(
      `INSERT INTO ribbons_configs (instance_id, site_id, config, config_hash, config_version, site_url, merchant_email)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
       ON CONFLICT (instance_id, config_hash) DO NOTHING
       RETURNING id`,
      [instanceId, siteId, config, configHash, version, siteUrl, merchantEmail]
    );

    const row = r.rows[0] as { id?: string } | undefined;
    res.json({
      ok: true,
      appended: Boolean(row),
      id: row?.id ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "insert failed" });
  }
});

app.get("/update-settings", async (req, res) => {
  const instanceId =
    typeof req.query.instanceId === "string" ? req.query.instanceId : "";
  const siteId = typeof req.query.siteId === "string" ? req.query.siteId : "";
  const siteUrl =
    typeof req.query.siteUrl === "string" ? req.query.siteUrl : "";
  if (!instanceId || !siteId || !siteUrl) {
    res.status(400).json({
      error: "Expected query: ?instanceId=...&siteId=...&siteUrl=...",
    });
    return;
  }

  try {
    const r = await pool.query(
      `SELECT seen_first_success_modal, has_given_feedback, unlocked_labels, rating, feedback_text
       FROM ribbons_store_settings
       WHERE instance_id = $1
       LIMIT 1`,
      [instanceId]
    );
    const row = r.rows[0] as
      | {
          seen_first_success_modal?: boolean;
          has_given_feedback?: boolean;
          unlocked_labels?: boolean;
          rating?: number | null;
          feedback_text?: string | null;
        }
      | undefined;
    if (!row) {
      res.json(null);
      return;
    }
    res.json({
      seenFirstSuccessModal: Boolean(row.seen_first_success_modal),
      hasGivenFeedback: Boolean(row.has_given_feedback),
      unlockedLabels: Boolean(row.unlocked_labels),
      rating:
        typeof row.rating === "number" && Number.isFinite(row.rating)
          ? row.rating
          : null,
      feedbackText:
        typeof row.feedback_text === "string" ? row.feedback_text : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "query failed" });
  }
});

app.post("/update-settings", async (req, res) => {
  const {
    instanceId,
    siteId,
    siteUrl,
    seenFirstSuccessModal,
    hasGivenFeedback,
    unlockedLabels,
    rating,
    feedbackText,
  } = req.body ?? {};
  if (typeof instanceId !== "string") {
    res.status(400).json({ error: "Expected body: { instanceId, ... }" });
    return;
  }

  const isFeedbackUpdate = typeof rating === "number";
  const nextSeenFirstSuccessModal =
    typeof seenFirstSuccessModal === "boolean"
      ? seenFirstSuccessModal
      : isFeedbackUpdate
      ? true
      : null;
  const nextHasGivenFeedback =
    typeof hasGivenFeedback === "boolean"
      ? hasGivenFeedback
      : isFeedbackUpdate
      ? true
      : null;
  const nextUnlockedLabels =
    typeof unlockedLabels === "boolean" ? unlockedLabels : null;
  if (
    isFeedbackUpdate &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    res.status(400).json({ error: "rating must be 1..5" });
    return;
  }

  try {
    if (isFeedbackUpdate) {
      console.log("[first-success-feedback]", {
        instanceId,
        siteId,
        rating,
        feedbackText: typeof feedbackText === "string" ? feedbackText : "",
      });
    }

    const r = await pool.query(
      `INSERT INTO ribbons_store_settings (
        instance_id,
        site_id,
        site_url,
        seen_first_success_modal,
        has_given_feedback,
        unlocked_labels,
        rating,
        feedback_text
      )
      VALUES ($1, $2, $3, COALESCE($4, false), COALESCE($5, false), COALESCE($6, false), $7, $8)
      ON CONFLICT (instance_id)
      DO UPDATE SET
        site_url = COALESCE($3, ribbons_store_settings.site_url),
        seen_first_success_modal = COALESCE($4, ribbons_store_settings.seen_first_success_modal),
        has_given_feedback = COALESCE($5, ribbons_store_settings.has_given_feedback),
        unlocked_labels = COALESCE($6, ribbons_store_settings.unlocked_labels),
        rating = COALESCE($7, ribbons_store_settings.rating),
        feedback_text = COALESCE($8, ribbons_store_settings.feedback_text)
      RETURNING seen_first_success_modal, has_given_feedback, unlocked_labels, rating, feedback_text`,
      [
        instanceId,
        siteId,
        siteUrl,
        nextSeenFirstSuccessModal,
        nextHasGivenFeedback,
        nextUnlockedLabels,
        typeof rating === "number" && Number.isFinite(rating) ? rating : null,
        typeof feedbackText === "string" ? feedbackText : null,
      ]
    );
    const row = r.rows[0] as
      | {
          seen_first_success_modal?: boolean;
          has_given_feedback?: boolean;
          unlocked_labels?: boolean;
          rating?: number | null;
          feedback_text?: string | null;
        }
      | undefined;
    res.json({
      seenFirstSuccessModal: Boolean(row?.seen_first_success_modal),
      hasGivenFeedback: Boolean(row?.has_given_feedback),
      unlockedLabels: Boolean(row?.unlocked_labels),
      rating:
        typeof row?.rating === "number" && Number.isFinite(row.rating)
          ? row.rating
          : null,
      feedbackText:
        typeof row?.feedback_text === "string" ? row.feedback_text : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "insert failed" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`backend-dev-api listening on http://0.0.0.0:${port}`);
});
