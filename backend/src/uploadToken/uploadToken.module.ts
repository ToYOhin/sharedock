import { Module } from "@nestjs/common";
import { UploadTokenController } from "./uploadToken.controller";
import { UploadTokenService } from "./uploadToken.service";

@Module({
  controllers: [UploadTokenController],
  providers: [UploadTokenService],
  exports: [UploadTokenService],
})
export class UploadTokenModule {}
