import {
  Controller,
  Headers,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ShareXIntegrationService } from "./sharexIntegration.service";

@Controller("integrations/sharex")
export class ShareXIntegrationController {
  constructor(private shareXIntegrationService: ShareXIntegrationService) {}

  @Post("upload")
  @HttpCode(201)
  @Throttle({
    default: {
      limit: 30,
      ttl: 60,
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { files: 1, fileSize: 1024 * 1024 * 1024 },
    }),
  )
  async upload(
    @Headers("authorization") authorization: string | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.shareXIntegrationService.upload(authorization, file);
  }
}
