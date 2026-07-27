import * as moment from "moment";

export const CLEANUP_PREVIEW_LIMIT = 100;

export type CleanupRetentionPeriod = {
  value: number;
  unit: moment.unitOfTime.DurationConstructor;
};

export function buildCleanupThresholdDate(
  retentionPeriod: CleanupRetentionPeriod,
  now = new Date(),
) {
  if (retentionPeriod.value === -1) return null;

  return moment(now)
    .subtract(retentionPeriod.value, retentionPeriod.unit)
    .toDate();
}

export function isExpiredTemporaryFile(modifiedAt: Date, now = new Date()) {
  return moment(modifiedAt).add(1, "day").isBefore(moment(now));
}

export function summarizeExpiredTokenCounts(counts: {
  refreshTokens: number;
  loginTokens: number;
  resetPasswordTokens: number;
}) {
  return {
    ...counts,
    total:
      counts.refreshTokens + counts.loginTokens + counts.resetPasswordTokens,
  };
}

export function sumFileSizes(files: { size?: string | number | null }[]) {
  return files.reduce((total, file) => {
    const parsedSize = Number.parseInt(String(file.size ?? "0"), 10);
    return Number.isFinite(parsedSize) ? total + parsedSize : total;
  }, 0);
}
