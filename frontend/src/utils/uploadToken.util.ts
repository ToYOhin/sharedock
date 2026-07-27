import { UploadToken } from "../types/uploadToken.type";

export type UploadTokenStatus = "active" | "revoked";

export const getUploadTokenStatus = (
  token: Pick<UploadToken, "revokedAt">,
): UploadTokenStatus => {
  return token.revokedAt ? "revoked" : "active";
};

export const isUploadTokenRevoked = (
  token: Pick<UploadToken, "revokedAt">,
) => {
  return getUploadTokenStatus(token) === "revoked";
};

export const sortUploadTokensByCreatedAt = <T extends Pick<UploadToken, "createdAt">>(
  tokens: T[],
) => {
  return [...tokens].sort(
    (firstToken, secondToken) =>
      new Date(secondToken.createdAt).getTime() -
      new Date(firstToken.createdAt).getTime(),
  );
};
