import { useCallback, useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { appInstances, embeddedScripts } from "@wix/app-management";
import type { Label, LabelsConfig } from "./types";
import { parseLabels } from "@/lib/labelsStorage";
import { embedLabelsConfigThenRecord } from "@/lib/embedLabelsAndRecordConfig";
import type { LabelsConfigSnapshotInput } from "@/lib/labelsConfigSnapshot";
import { sanitizeLabelForSave } from "@/store/conditionRulesShared";
import { addLabel, updateLabel, deleteLabel } from "@/utils/labelOperations";
import {
  mergeLabelIntoIndex,
  removeLabelFromIndex,
} from "@/utils/evaluateLabels";
import { httpClient } from "@wix/essentials";
import type {
  StoreSettings,
  StoreSettingsInput,
} from "@/lib/storeSettingsTypes";
import { messageUsesAnyLabelVariable } from "@/utils/labelVariables";

async function recordLabelsConfigViaApi(input: LabelsConfigSnapshotInput) {
  try {
    const baseApiUrl = new URL(import.meta.url).origin;
    const res = await httpClient.fetchWithAuth(
      `${baseApiUrl}/api/save-config`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `save-config failed: ${res.status}`);
    }
  } catch (error) {
    console.error("POST request failed:", error);
  }
}

async function getStoreSettingsViaApi(
  input: Pick<StoreSettingsInput, "instanceId" | "siteId" | "siteUrl">
): Promise<StoreSettings | null> {
  const baseApiUrl = new URL(import.meta.url).origin;
  const url =
    `${baseApiUrl}/api/updateSettings` +
    `?instanceId=${encodeURIComponent(input.instanceId)}` +
    `&siteId=${encodeURIComponent(input.siteId)}` +
    `&siteUrl=${encodeURIComponent(input.siteUrl)}`;
  const res = await httpClient.fetchWithAuth(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `updateSettings failed: ${res.status}`);
  }
  const json = (await res.json()) as StoreSettings | null;
  if (json == null) {
    return null;
  }
  return json;
}

async function setStoreSettingsViaApi(
  input: Pick<StoreSettingsInput, "instanceId" | "siteId" | "siteUrl"> & {
    seenFirstSuccessModal?: boolean;
    hasGivenFeedback?: boolean;
    unlockedLabels?: boolean;
    rating?: number | null;
    feedbackText?: string | null;
  }
): Promise<StoreSettings | null> {
  const baseApiUrl = new URL(import.meta.url).origin;
  const res = await httpClient.fetchWithAuth(
    `${baseApiUrl}/api/updateSettings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceId: input.instanceId,
        siteId: input.siteId,
        siteUrl: input.siteUrl,
        seenFirstSuccessModal: input.seenFirstSuccessModal,
        hasGivenFeedback: input.hasGivenFeedback,
        unlockedLabels: input.unlockedLabels,
        rating: input.rating,
        feedbackText: input.feedbackText,
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `updateSettings failed: ${res.status}`);
  }
  const json = (await res.json()) as StoreSettings | null;
  return json;
}

export function useRibbonLabels() {
  const [storeIdentity, setStoreSettingsContext] =
    useState<Pick<StoreSettingsInput, "instanceId" | "siteId" | "siteUrl">>();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null
  );
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelIndex, setLabelIndex] = useState<LabelsConfig["labelIndex"]>({});
  const [defaultLabelIds, setDefaultLabelIds] = useState<
    LabelsConfig["defaultLabelIds"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLabelsUnlocked, setIsLabelsUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        let embeddedScript = null;
        try {
          embeddedScript = await embeddedScripts.getEmbeddedScript({});
        } catch {
          // no embedded script. continue with empty config.
        }
        const params = (embeddedScript?.parameters || {}) as Record<
          string,
          string
        >;
        const labelsParam = params?.labels;
        const app = await appInstances.getAppInstance();
        const instanceId = app.instance?.instanceId;
        const siteId = app.site?.siteId;
        const siteUrl = app.site?.url;

        if (labelsParam != null && labelsParam !== "") {
          const config = parseLabels(labelsParam);
          if (!cancelled) {
            setLabels(config.labels);
            setLabelIndex(config.labelIndex);
            setDefaultLabelIds(config.defaultLabelIds);
          }
        }

        if (instanceId && siteId && siteUrl) {
          const settings = await getStoreSettingsViaApi({
            instanceId,
            siteId,
            siteUrl,
          });
          if (!cancelled) {
            setStoreSettingsContext({
              instanceId,
              siteId,
              siteUrl: app.site?.url ?? "",
            });
            setStoreSettings(settings);
            setIsLabelsUnlocked(Boolean(settings?.unlockedLabels));
          }
        }
      } catch (error) {
        if (
          (error as { details?: { applicationError?: { code?: string } } })
            ?.details?.applicationError?.code === "NO_HTML_EMBEDS_ON_SITE"
        ) {
          return;
        }
        console.error("Failed to load ribbon settings:", error);
        dashboard.showToast({
          message: (error as Error).message || "Failed to load settings",
          type: "error",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveConfig = useCallback(
    async (
      nextLabels: Label[],
      nextLabelIndex: LabelsConfig["labelIndex"],
      nextDefaultLabelIds: string[]
    ) => {
      const config = {
        version: 1,
        labels: nextLabels,
        labelIndex: nextLabelIndex,
        defaultLabelIds: nextDefaultLabelIds,
      };
      console.log("saving config", config);

      await embedLabelsConfigThenRecord(
        (props) => embeddedScripts.embedScript(props),
        () => appInstances.getAppInstance(),
        config,
        recordLabelsConfigViaApi
      );

      setLabels(nextLabels);
      setLabelIndex(nextLabelIndex);
      setDefaultLabelIds(nextDefaultLabelIds);
    },
    []
  );

  const saveLabel = useCallback(
    async (updated: Label) => {
      setIsSaving(true);
      try {
        if (
          updated.applyMode === "all" &&
          messageUsesAnyLabelVariable(updated.text.message || "")
        ) {
          throw new Error(
            'Labels with variables cannot use "All products".'
          );
        }
        const toSave = sanitizeLabelForSave(updated);
        const nextLabels = !labels.some((l: Label) => l.id === toSave.id)
          ? addLabel(labels, toSave)
          : updateLabel(labels, toSave.id, toSave);

        const {
          labelIndex: nextLabelIndex,
          defaultLabelIds: nextDefaultLabelIds,
        } = await mergeLabelIntoIndex(labelIndex, defaultLabelIds, toSave);

        await saveConfig(nextLabels, nextLabelIndex, nextDefaultLabelIds);
      } catch (error) {
        console.error("Failed to save label:", error);
        const err = error as { message?: string; description?: string };
        dashboard.showToast({
          message: err.message || err.description || "Failed to save",
          type: "error",
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [labels, labelIndex, defaultLabelIds, saveConfig]
  );

  const deleteLabelById = useCallback(
    async (label: Label) => {
      setIsSaving(true);
      try {
        const nextLabels = deleteLabel(labels, label.id);
        const {
          labelIndex: nextLabelIndex,
          defaultLabelIds: nextDefaultLabelIds,
        } = removeLabelFromIndex(labelIndex, defaultLabelIds, label.id);
        await saveConfig(nextLabels, nextLabelIndex, nextDefaultLabelIds);
        dashboard.showToast({ message: "Label deleted", type: "success" });
      } catch (error) {
        console.error("Failed to delete label:", error);
        const err = error as { message?: string; description?: string };
        dashboard.showToast({
          message: err.message || err.description || "Failed to delete",
          type: "error",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [labels, labelIndex, defaultLabelIds, saveConfig]
  );

  /** Copy label definition only; does not merge into labelIndex or defaultLabelIds. */
  const duplicateLabel = useCallback(
    async (source: Label) => {
      setIsSaving(true);
      try {
        const cloned = structuredClone(source) as Label;
        cloned.id = crypto.randomUUID();
        cloned.enabled = false;
        const toSave = sanitizeLabelForSave(cloned);
        const nextLabels = addLabel(labels, toSave);
        await saveConfig(nextLabels, labelIndex, defaultLabelIds);
        dashboard.showToast({
          message: "Label duplicated",
          type: "success",
        });
      } catch (error) {
        console.error("Failed to duplicate label:", error);
        const err = error as { message?: string; description?: string };
        dashboard.showToast({
          message: err.message || err.description || "Failed to duplicate",
          type: "error",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [labels, labelIndex, defaultLabelIds, saveConfig]
  );

  const applyStoreSettingsUpdate = useCallback(
    async (input: {
      seenFirstSuccessModal?: boolean;
      hasGivenFeedback?: boolean;
      unlockedLabels?: boolean;
      rating?: number | null;
      feedbackText?: string | null;
    }) => {
      if (!storeIdentity) return;
      const { instanceId, siteId, siteUrl } = storeIdentity;
      const updated = await setStoreSettingsViaApi({
        instanceId,
        siteId,
        siteUrl,
        seenFirstSuccessModal: input.seenFirstSuccessModal,
        hasGivenFeedback: input.hasGivenFeedback,
        unlockedLabels: input.unlockedLabels,
        rating: input.rating,
        feedbackText: input.feedbackText,
      });
      setStoreSettings(updated);
    },
    [storeIdentity]
  );

  const unlockLabels = useCallback(async () => {
    if (isLabelsUnlocked) return true;

    const app = await appInstances.getAppInstance();
    const instanceId = app.instance?.instanceId;
    const siteId = app.site?.siteId;
    const siteUrl = app.site?.url ?? "";
    if (!instanceId || !siteId || !siteUrl) {
      throw new Error("Missing app instance data");
    }

    const updated = await setStoreSettingsViaApi({
      instanceId,
      siteId,
      siteUrl,
      unlockedLabels: true,
    });
    const unlocked = Boolean(updated?.unlockedLabels);
    setIsLabelsUnlocked(unlocked);
    return unlocked;
  }, [isLabelsUnlocked]);

  return {
    labels,
    storeIdentity,
    storeSettings,
    isLoading,
    isSaving,
    isLabelsUnlocked,
    saveLabel,
    unlockLabels,
    deleteLabelById,
    duplicateLabel,
    applyStoreSettingsUpdate,
  };
}
