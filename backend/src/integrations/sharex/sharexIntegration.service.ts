import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { randomInt } from "crypto";
import { ConfigService } from "src/config/config.service";
import { FileService } from "src/file/file.service";
import { ShareService } from "src/share/share.service";
import { UploadTokenService } from "src/uploadToken/uploadToken.service";
import { UploadWebhookService } from "../webhook/uploadWebhook.service";
import {
  buildShareXUploadResponse,
  extractBearerToken,
  normalizeUploadFileName,
} from "./sharex.util";

@Injectable()
export class ShareXIntegrationService {
  private readonly shareIdCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  constructor(
    private configService: ConfigService,
    private fileService: FileService,
    private shareService: ShareService,
    private uploadTokenService: UploadTokenService,
    private uploadWebhookService: UploadWebhookService,
  ) {}

  async upload(authorization: string | undefined, file?: Express.Multer.File) {
    const tokenSecret = extractBearerToken(authorization);
    if (!tokenSecret) throw new UnauthorizedException("Upload token required");

    const uploadToken =
      await this.uploadTokenService.authenticateUploadToken(tokenSecret);
    if (!uploadToken) throw new UnauthorizedException("Invalid upload token");

    if (!file?.buffer) {
      throw new BadRequestException(
        'A single multipart file field named "file" is required',
      );
    }

    const fileName = normalizeUploadFileName(file.originalname);
    const shareId = await this.generateAvailableShareId();
    const defaultExpiration = this.configService.get(
      "share.defaultExpiration",
    );

    const share = await this.shareService.create(
      {
        id: shareId,
        name: this.buildShareName(fileName),
        expiration: `${defaultExpiration.value}-${defaultExpiration.unit}`,
        description: undefined,
        tags: undefined,
        recipients: [] as string[],
        security: {
          password: undefined,
          maxViews: undefined,
        },
        size: file.size,
      },
      uploadToken.creator,
    );

    try {
      await this.fileService.create(
        file.buffer.toString("base64"),
        { index: 0, total: 1 },
        { name: fileName },
        share.id,
      );

      const completedShare = await this.shareService.complete(share.id);
      await this.uploadTokenService.markUploadTokenUsed(uploadToken.id);

      const response = buildShareXUploadResponse({
        appUrl: this.configService.get("general.appUrl"),
        shareId: completedShare.id,
        fileName,
        expiresAt: completedShare.expiration,
      });
      await this.uploadWebhookService.notifyUploaded({
        event: "share.uploaded",
        shareId: response.shareId,
        fileName: response.fileName,
        url: response.url,
        deletionUrl: response.deletionUrl,
        expiresAt: response.expiresAt,
      });
      return response;
    } catch (error) {
      await this.shareService.remove(share.id).catch(() => undefined);
      throw error;
    }
  }

  private async generateAvailableShareId() {
    for (let attempts = 0; attempts < 10; attempts++) {
      const id = this.createRandomShareId(
        this.configService.get("share.shareIdLength"),
      );

      if ((await this.shareService.isShareIdAvailable(id)).isAvailable) {
        return id;
      }
    }

    throw new BadRequestException("Could not generate an available share ID");
  }

  private createRandomShareId(length: number) {
    let id = "";

    for (let index = 0; index < Math.max(length, 3); index++) {
      id += this.shareIdCharacters[randomInt(this.shareIdCharacters.length)];
    }

    return id;
  }

  private buildShareName(fileName: string) {
    return fileName.slice(0, 30) || undefined;
  }
}
