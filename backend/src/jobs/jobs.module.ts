import { Module } from "@nestjs/common";
import { FileModule } from "src/file/file.module";
import { ReverseShareModule } from "src/reverseShare/reverseShare.module";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [FileModule, ReverseShareModule, ConfigModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
