import { Injectable, Logger } from "@nestjs/common";
import checkDiskSpace from "check-disk-space";
import { DATA_DIRECTORY } from "src/constants";
import { PrismaService } from "src/prisma/prisma.service";
import { SystemInfoDTO, SystemOverviewDTO } from "./dto/systemInfo.dto";
import { ConfigService } from "src/config/config.service";
import * as path from "path";

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getSystemOverview(): Promise<SystemOverviewDTO> {
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const recentThreshold = new Date(now.getTime() - sevenDaysInMs);
    const expiringThreshold = new Date(now.getTime() + sevenDaysInMs);

    const [
      diskUsage,
      shareCount,
      fileCount,
      recentShareCount,
      expiringShares,
    ] =
      await Promise.all([
        this.getSystemInfo(),
        this.prisma.share.count(),
        this.prisma.file.count(),
        this.prisma.share.count({
          where: {
            createdAt: {
              gte: recentThreshold,
            },
          },
        }),
        this.prisma.share.findMany({
          where: {
            uploadLocked: true,
            removedReason: null,
            expiration: {
              gt: now,
              lte: expiringThreshold,
            },
          },
          orderBy: {
            expiration: "asc",
          },
          take: 5,
          select: {
            id: true,
            name: true,
            expiration: true,
            _count: {
              select: {
                files: true,
              },
            },
          },
        }),
      ]);

    return {
      diskUsage,
      shareCount,
      fileCount,
      recentShareCount,
      expiringShares: expiringShares.map((share) => ({
        id: share.id,
        name: share.name,
        expiration: share.expiration,
        fileCount: share._count.files,
      })),
    };
  }

  async getSystemInfo(): Promise<SystemInfoDTO | null> {
    if (this.configService.get("s3.enabled")) {
      return null;
    }

    const resolvedPath = path.resolve(DATA_DIRECTORY);

    try {
      const diskSpace = await checkDiskSpace(resolvedPath);
      return {
        used: diskSpace.size - diskSpace.free,
        total: diskSpace.size,
      };
    } catch (e) {
      this.logger.warn(
        `Failed to check disk space for ${resolvedPath}, falling back to root: ${e.message}`,
      );
      try {
        const diskSpace = await checkDiskSpace("/");
        return {
          used: diskSpace.size - diskSpace.free,
          total: diskSpace.size,
        };
      } catch (err) {
        this.logger.error(
          `Failed to check disk space even for root: ${err.message}`,
        );
        return null;
      }
    }
  }
}
