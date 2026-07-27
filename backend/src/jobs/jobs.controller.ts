import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdministratorGuard } from "src/auth/guard/isAdmin.guard";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get("cleanup-preview")
  @UseGuards(JwtGuard, AdministratorGuard)
  async getCleanupPreview() {
    return this.jobsService.getCleanupPreview();
  }

  @Get("cleanup-logs")
  @UseGuards(JwtGuard, AdministratorGuard)
  async getCleanupLogs() {
    return this.jobsService.getCleanupLogs();
  }
}
