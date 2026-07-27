export type UploadToken = {
  id: string;
  createdAt: string;
  name?: string | null;
  tokenPrefix: string;
  scope: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
};

export type CreatedUploadToken = UploadToken & {
  token: string;
};

export type CreateUploadToken = {
  name?: string;
};
