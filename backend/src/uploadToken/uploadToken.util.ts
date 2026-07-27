import { createHash, randomBytes } from "crypto";

export const UPLOAD_TOKEN_PREFIX = "sdock_";
export const UPLOAD_TOKEN_SCOPE = "upload";
export const UPLOAD_TOKEN_PREFIX_LENGTH = 12;

export function createUploadTokenSecret() {
  return `${UPLOAD_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashUploadTokenSecret(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getUploadTokenPrefix(token: string) {
  return token.slice(0, UPLOAD_TOKEN_PREFIX_LENGTH);
}
