export const CLEANUP_LOG_LIMIT = 50;

export const CLEANUP_LOG_STATUS_SUCCESS = "success";
export const CLEANUP_LOG_STATUS_FAILURE = "failure";

export type CleanupLogStatus =
  | typeof CLEANUP_LOG_STATUS_SUCCESS
  | typeof CLEANUP_LOG_STATUS_FAILURE;

export type CleanupLogDetails = Record<
  string,
  string | number | boolean | null
>;

export function shouldRecordCleanupLog(
  deletedCount: number,
  status: CleanupLogStatus,
) {
  return status === CLEANUP_LOG_STATUS_FAILURE || deletedCount > 0;
}

export function serializeCleanupLogDetails(details?: CleanupLogDetails | null) {
  return details ? JSON.stringify(details) : null;
}

export function parseCleanupLogDetails(details?: string | null) {
  if (!details) return null;

  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

export function getCleanupLogErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
