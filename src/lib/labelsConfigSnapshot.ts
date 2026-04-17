export type { LabelsConfigSnapshotInput } from "./persistLabelsConfigSnapshot";
import {
  persistLabelsConfigSnapshot,
  type LabelsConfigSnapshotInput,
} from "./persistLabelsConfigSnapshot";

/**
 * Event / webhook path — same persistence as `POST /api/save-config` when env is set.
 * If no dev API / Supabase env, no-ops.
 */
export async function recordLabelsConfigSnapshot(
  input: LabelsConfigSnapshotInput
): Promise<void> {
  await persistLabelsConfigSnapshot(input);
}
