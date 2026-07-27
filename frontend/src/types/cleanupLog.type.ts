export type CleanupLogDetails = Record<
  string,
  string | number | boolean | null
>;

export type CleanupLog = {
  id: string;
  createdAt: string;
  jobName: string;
  status: string;
  deletedCount: number;
  errorMessage: string | null;
  details: CleanupLogDetails | null;
};
