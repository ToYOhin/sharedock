import { Injectable, Logger } from "@nestjs/common";
import {
  buildUploadWebhookSignature,
  getUploadWebhookUrl,
  UploadWebhookPayload,
} from "./uploadWebhook.util";

@Injectable()
export class UploadWebhookService {
  private readonly logger = new Logger(UploadWebhookService.name);

  async notifyUploaded(payload: UploadWebhookPayload) {
    let webhookUrl: string | null;
    try {
      webhookUrl = getUploadWebhookUrl();
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : "Invalid upload webhook URL",
      );
      return;
    }

    if (!webhookUrl) return;

    const body = JSON.stringify(payload);
    const secret = process.env.SHAREDOCK_UPLOAD_WEBHOOK_SECRET?.trim();
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "ShareDock upload webhook",
    };
    if (secret) {
      headers["x-sharedock-signature"] = buildUploadWebhookSignature(
        body,
        secret,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Upload webhook returned HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `Upload webhook delivery failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
