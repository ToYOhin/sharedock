export type CleanupPreviewShareCandidate = {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string | null;
  expiration: string;
  uploadLocked: boolean;
  storageProvider: string;
  removedReason: string | null;
  fileCount: number;
  size: number;
  reason: string;
};

export type CleanupPreviewReverseShareCandidate = {
  id: string;
  createdAt: string;
  shareExpiration: string;
  remainingUses: number;
  shareCount: number;
  reason: string;
};

export type CleanupPreviewUserCandidate = {
  id: string;
  createdAt: string;
  username: string;
  email: string;
  shareCount: number;
  reason: string;
};

export type CleanupPreviewTemporaryFileCandidate = {
  shareId: string;
  fileName: string;
  relativePath: string;
  modifiedAt: string;
  size: number;
  reason: string;
};

export type CleanupPreviewCandidate =
  | CleanupPreviewShareCandidate
  | CleanupPreviewReverseShareCandidate
  | CleanupPreviewUserCandidate
  | CleanupPreviewTemporaryFileCandidate;

export type CleanupPreviewCandidateGroup<TCandidate> = {
  reason: string;
  total: number;
  candidates: TCandidate[];
};

export type CleanupPreview = {
  generatedAt: string;
  limit: number;
  expiredShares: CleanupPreviewCandidateGroup<CleanupPreviewShareCandidate> & {
    retentionDisabled: boolean;
    thresholdAt: string | null;
  };
  unfinishedShares: CleanupPreviewCandidateGroup<CleanupPreviewShareCandidate> & {
    cutoffAt: string;
  };
  expiredReverseShares: CleanupPreviewCandidateGroup<CleanupPreviewReverseShareCandidate>;
  expiredAuthTokens: {
    reason: string;
    refreshTokens: number;
    loginTokens: number;
    resetPasswordTokens: number;
    total: number;
  };
  unactivatedUsers: CleanupPreviewCandidateGroup<CleanupPreviewUserCandidate> & {
    cutoffAt: string;
  };
  temporaryFiles: CleanupPreviewCandidateGroup<CleanupPreviewTemporaryFileCandidate>;
};
