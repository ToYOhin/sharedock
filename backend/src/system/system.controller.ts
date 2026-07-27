import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdministratorGuard } from "src/auth/guard/isAdmin.guard";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { SystemService } from "./system.service";
import { SystemInfoDTO, SystemOverviewDTO } from "./dto/systemInfo.dto";

@Controller("system")
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get("info")
  @UseGuards(JwtGuard, AdministratorGuard)
  async getSystemInfo(): Promise<SystemInfoDTO | null> {
    return await this.systemService.getSystemInfo();
  }

  @Get("overview")
  @UseGuards(JwtGuard, AdministratorGuard)
  async getSystemOverview(): Promise<SystemOverviewDTO> {
    return await this.systemService.getSystemOverview();
  }
}
