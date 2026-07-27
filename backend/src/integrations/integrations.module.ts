import { Module } from "@nestjs/common";
import { FileModule } from "src/file/file.module";
import { ShareModule } from "src/share/share.module";
import { UploadTokenModule } from "src/uploadToken/uploadToken.module";
import { ShareXIntegrationController } from "./sharex/sharexIntegration.controller";
import { ShareXIntegrationService } from "./sharex/sharexIntegration.service";
import { UploadWebhookService } from "./webhook/uploadWebhook.service";

@Module({
  imports: [FileModule, ShareModule, UploadTokenModule],
  controllers: [ShareXIntegrationController],
  providers: [ShareXIntegrationService, UploadWebhookService],
})
export class IntegrationsModule {}
