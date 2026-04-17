/**
 * Postgres implementation — only imported by the Node sidecar (`scripts/pg-snapshot-server.ts`).
 * Wix web methods / webhooks run in a Worker and cannot use `pg`.
 */

import { createHash } from "node:crypto";
import type { LabelsConfig } from "@/extensions/dashboard/pages/types";
import type { Json } from "@/lib/kysely";
import { db } from "@/lib/db";
import { serializeLabels } from "@/lib/labelsStorage";

export type SaveLabelsConfigAppendOnlyInput = {
  instanceId: string;
  siteId: string;
  config: LabelsConfig;
  siteUrl: string;
  merchantEmail: string;
};

export type SaveLabelsConfigAppendOnlyResult = {
  appended: boolean;
  id: string | null;
};

function hashLabelsConfig(config: LabelsConfig): string {
  return createHash("sha256")
    .update(serializeLabels(config), "utf8")
    .digest("hex");
}

export async function recordLabelsConfigSnapshotPg(
  input: SaveLabelsConfigAppendOnlyInput
): Promise<SaveLabelsConfigAppendOnlyResult> {
  const { instanceId, siteId, config, siteUrl, merchantEmail } = input;
  const configHash = hashLabelsConfig(config);

  const inserted = await db
    .insertInto("configs")
    .values({
      instance_id: instanceId,
      site_id: siteId,
      config: config as unknown as Json,
      config_hash: configHash,
      config_version: config.version,
      site_url: siteUrl,
      merchant_email: merchantEmail,
    })
    .onConflict((oc) => oc.columns(["instance_id", "config_hash"]).doNothing())
    .returning("id")
    .executeTakeFirst();

  if (inserted) {
    return { appended: true, id: inserted.id };
  }

  return { appended: false, id: null };
}
