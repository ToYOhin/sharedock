import * as path from "path";

export function extractBearerToken(authorization?: string) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function normalizeUploadFileName(fileName?: string) {
  const normalizedName = path
    .win32.basename(path.posix.basename(fileName || ""))
    .split("")
    .filter((character) => character.charCodeAt(0) >= 0x20)
    .join("")
    .trim();

  return normalizedName || "upload.bin";
}

export function buildShareXUploadResponse({
  appUrl,
  shareId,
  fileName,
  expiresAt,
}: {
  appUrl: string;
  shareId: string;
  fileName: string;
  expiresAt: Date;
}) {
  const rootUrl = appUrl.replace(/\/+$/, "");

  return {
    shareId,
    url: `${rootUrl}/s/${shareId}`,
    deletionUrl: `${rootUrl}/share/${shareId}/edit`,
    fileName,
    expiresAt: expiresAt.toISOString(),
  };
}
