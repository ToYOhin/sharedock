import { CleanupLog, CleanupLogDetails } from "../types/cleanupLog.type";

export const getCleanupLogStatusColor = (status: string) => {
  if (status === "success") return "green";
  if (status === "failure") return "red";
  return "gray";
};

export const getCleanupLogTotalDeleted = (logs: CleanupLog[]) =>
  logs.reduce((total, log) => total + log.deletedCount, 0);

export const getCleanupLogDetailsText = (
  details?: CleanupLogDetails | null,
) => {
  if (!details) return "";

  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};
