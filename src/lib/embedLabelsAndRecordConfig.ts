import { serializeLabels } from "./labelsStorage";
import type { LabelsConfig } from "../extensions/dashboard/pages/types";

type EmbedFn = (props: {
  parameters: Record<string, string>;
}) => Promise<unknown>;

type AppInstanceResponse = {
  instance?: { instanceId?: string };
  site?: {
    siteId?: string;
    url?: string | null;
    ownerInfo?: { email?: string };
    ownerEmail?: string | null;
  };
};

type GetAppInstanceFn = () => Promise<AppInstanceResponse>;

type SnapshotInput = {
  instanceId: string;
  siteId: string;
  config: LabelsConfig;
  siteUrl: string;
  merchantEmail: string;
};

/**
 * Updates embedded script `labels`, then runs `record` (e.g. DB snapshot or web method).
 * Snapshot failure is logged only — embed already succeeded.
 */
export async function embedLabelsConfigThenRecord(
  embed: EmbedFn,
  getAppInstance: GetAppInstanceFn,
  config: LabelsConfig,
  record: (input: SnapshotInput) => Promise<unknown>
): Promise<void> {
  await embed({ parameters: { labels: serializeLabels(config) } });

  try {
    const app = await getAppInstance();
    const instanceId = app.instance?.instanceId;
    const siteId = app.site?.siteId;
    if (!instanceId || !siteId) return;

    await record({
      instanceId,
      siteId,
      config,
      siteUrl: app.site?.url ?? "",
      merchantEmail: app.site?.ownerEmail ?? app.site?.ownerInfo?.email ?? "",
    });
  } catch (err) {
    console.error("[ribbons] config snapshot after embed failed:", err);
  }
}
