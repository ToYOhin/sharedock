import { createHmac } from "crypto";

export type UploadWebhookPayload = {
  event: "share.uploaded";
  shareId: string;
  fileName: string;
  url: string;
  deletionUrl: string;
  expiresAt: string;
};

export const buildUploadWebhookSignature = (body: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

export const getUploadWebhookUrl = (environment = process.env) => {
  const value = environment.SHAREDOCK_UPLOAD_WEBHOOK_URL?.trim();
  if (!value) return null;

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SHAREDOCK_UPLOAD_WEBHOOK_URL must use http or https");
  }

  return url.toString();
};
