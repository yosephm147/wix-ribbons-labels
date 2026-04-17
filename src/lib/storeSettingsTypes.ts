export type StoreSettings = {
  seenFirstSuccessModal: boolean;
  hasGivenFeedback: boolean;
  unlockedLabels: boolean;
  rating: number | null;
  feedbackText: string | null;
};

/**
 * Shared payload across persistence/API/hook.
 */
export type StoreSettingsInput = {
  instanceId: string;
  siteId: string;
  siteUrl: string;
  seenFirstSuccessModal?: boolean;
  hasGivenFeedback?: boolean;
  unlockedLabels?: boolean;
  rating?: number | null;
  feedbackText?: string | null;
};
