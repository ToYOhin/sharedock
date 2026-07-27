import {
  CleanupPreview,
  CleanupPreviewCandidate,
} from "../types/cleanupPreview.type";

export type CleanupPreviewGroupKey =
  | "expiredShares"
  | "unfinishedShares"
  | "expiredReverseShares"
  | "expiredAuthTokens"
  | "unactivatedUsers"
  | "temporaryFiles";

export type CleanupPreviewDisplayGroup = {
  key: CleanupPreviewGroupKey;
  reason: string;
  total: number;
  candidates: CleanupPreviewCandidate[];
};

export const getCleanupPreviewGroups = (
  preview: CleanupPreview,
): CleanupPreviewDisplayGroup[] => [
  {
    key: "expiredShares",
    reason: preview.expiredShares.reason,
    total: preview.expiredShares.total,
    candidates: preview.expiredShares.candidates,
  },
  {
    key: "unfinishedShares",
    reason: preview.unfinishedShares.reason,
    total: preview.unfinishedShares.total,
    candidates: preview.unfinishedShares.candidates,
  },
  {
    key: "expiredReverseShares",
    reason: preview.expiredReverseShares.reason,
    total: preview.expiredReverseShares.total,
    candidates: preview.expiredReverseShares.candidates,
  },
  {
    key: "expiredAuthTokens",
    reason: preview.expiredAuthTokens.reason,
    total: preview.expiredAuthTokens.total,
    candidates: [],
  },
  {
    key: "unactivatedUsers",
    reason: preview.unactivatedUsers.reason,
    total: preview.unactivatedUsers.total,
    candidates: preview.unactivatedUsers.candidates,
  },
  {
    key: "temporaryFiles",
    reason: preview.temporaryFiles.reason,
    total: preview.temporaryFiles.total,
    candidates: preview.temporaryFiles.candidates,
  },
];

export const getCleanupPreviewTotal = (preview: CleanupPreview) =>
  getCleanupPreviewGroups(preview).reduce(
    (total, group) => total + group.total,
    0,
  );

export const hasCleanupPreviewWork = (preview: CleanupPreview) =>
  getCleanupPreviewTotal(preview) > 0;
