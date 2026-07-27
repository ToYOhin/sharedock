import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import * as fs from "fs";
import * as moment from "moment";
import * as path from "path";
import { FileService } from "src/file/file.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ReverseShareService } from "src/reverseShare/reverseShare.service";
import { ConfigService } from "src/config/config.service";
import { SHARE_DIRECTORY } from "../constants";
import {
  CLEANUP_LOG_LIMIT,
  CLEANUP_LOG_STATUS_FAILURE,
  CLEANUP_LOG_STATUS_SUCCESS,
  CleanupLogDetails,
  CleanupLogStatus,
  getCleanupLogErrorMessage,
  parseCleanupLogDetails,
  serializeCleanupLogDetails,
  shouldRecordCleanupLog,
} from "./cleanup-log.util";
import {
  buildCleanupThresholdDate,
  CLEANUP_PREVIEW_LIMIT,
  isExpiredTemporaryFile,
  summarizeExpiredTokenCounts,
  sumFileSizes,
} from "./cleanup-preview.util";

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private reverseShareService: ReverseShareService,
    private fileService: FileService,
    private configServer: ConfigService,
  ) {}

  async getCleanupLogs() {
    const logs = await this.prisma.cleanupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: CLEANUP_LOG_LIMIT,
    });

    return logs.map((log) => ({
      ...log,
      details: parseCleanupLogDetails(log.details),
    }));
  }

  async recordCleanupLog(data: {
    jobName: string;
    status: CleanupLogStatus;
    deletedCount: number;
    error?: unknown;
    details?: CleanupLogDetails | null;
  }) {
    if (!shouldRecordCleanupLog(data.deletedCount, data.status)) return;

    try {
      await this.prisma.cleanupLog.create({
        data: {
          jobName: data.jobName,
          status: data.status,
          deletedCount: data.deletedCount,
          errorMessage:
            data.status === CLEANUP_LOG_STATUS_FAILURE
              ? getCleanupLogErrorMessage(data.error)
              : null,
          details: serializeCleanupLogDetails(data.details),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record cleanup log for ${data.jobName}: ${getCleanupLogErrorMessage(
          error,
        )}`,
      );
    }
  }

  async getCleanupPreview() {
    const now = new Date();
    const fileRetentionPeriod = this.configServer.get(
      "share.fileRetentionPeriod",
    );
    const expiredShareThreshold = buildCleanupThresholdDate(
      fileRetentionPeriod,
      now,
    );
    const unfinishedShareCutoff = moment(now).subtract(1, "day").toDate();
    const unactivatedUserCutoff = moment(now).subtract(24, "hours").toDate();

    let expiredShareTotal = 0;
    let expiredShares = [];

    if (expiredShareThreshold) {
      const expiredShareWhere = {
        AND: [
          { expiration: { lt: expiredShareThreshold } },
          { expiration: { not: moment(0).toDate() } },
        ],
      };

      [expiredShareTotal, expiredShares] = await Promise.all([
        this.prisma.share.count({ where: expiredShareWhere }),
        this.prisma.share.findMany({
          where: expiredShareWhere,
          include: this.shareCleanupInclude(),
          orderBy: { expiration: "asc" },
          take: CLEANUP_PREVIEW_LIMIT,
        }),
      ]);
    }

    const unfinishedShareWhere = {
      uploadLocked: false,
      OR: [
        { updatedAt: { lt: unfinishedShareCutoff } },
        {
          updatedAt: { equals: null },
          createdAt: { lt: unfinishedShareCutoff },
        },
      ],
    };
    const expiredReverseShareWhere = {
      shareExpiration: { lt: now },
    };
    const unactivatedUserWhere = {
      isActivated: false,
      createdAt: { lt: unactivatedUserCutoff },
    };
    const expiredTokenWhere = {
      expiresAt: { lt: now },
    };

    const [
      unfinishedShareTotal,
      unfinishedShares,
      expiredReverseShareTotal,
      expiredReverseShares,
      unactivatedUserTotal,
      unactivatedUsers,
      refreshTokenCount,
      loginTokenCount,
      resetPasswordTokenCount,
    ] = await Promise.all([
      this.prisma.share.count({ where: unfinishedShareWhere }),
      this.prisma.share.findMany({
        where: unfinishedShareWhere,
        include: this.shareCleanupInclude(),
        orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
        take: CLEANUP_PREVIEW_LIMIT,
      }),
      this.prisma.reverseShare.count({ where: expiredReverseShareWhere }),
      this.prisma.reverseShare.findMany({
        where: expiredReverseShareWhere,
        include: { _count: { select: { shares: true } } },
        orderBy: { shareExpiration: "asc" },
        take: CLEANUP_PREVIEW_LIMIT,
      }),
      this.prisma.user.count({ where: unactivatedUserWhere }),
      this.prisma.user.findMany({
        where: unactivatedUserWhere,
        include: { _count: { select: { shares: true } } },
        orderBy: { createdAt: "asc" },
        take: CLEANUP_PREVIEW_LIMIT,
      }),
      this.prisma.refreshToken.count({ where: expiredTokenWhere }),
      this.prisma.loginToken.count({ where: expiredTokenWhere }),
      this.prisma.resetPasswordToken.count({ where: expiredTokenWhere }),
    ]);

    return {
      generatedAt: now.toISOString(),
      limit: CLEANUP_PREVIEW_LIMIT,
      expiredShares: {
        reason: "expired_retention_elapsed",
        retentionDisabled: expiredShareThreshold === null,
        thresholdAt: expiredShareThreshold?.toISOString() ?? null,
        total: expiredShareTotal,
        candidates: expiredShares.map((share) =>
          this.toShareCleanupCandidate(share, "expired_retention_elapsed"),
        ),
      },
      unfinishedShares: {
        reason: "unfinished_upload_stale",
        cutoffAt: unfinishedShareCutoff.toISOString(),
        total: unfinishedShareTotal,
        candidates: unfinishedShares.map((share) =>
          this.toShareCleanupCandidate(share, "unfinished_upload_stale"),
        ),
      },
      expiredReverseShares: {
        reason: "reverse_share_expired",
        total: expiredReverseShareTotal,
        candidates: expiredReverseShares.map((reverseShare) => ({
          id: reverseShare.id,
          createdAt: reverseShare.createdAt.toISOString(),
          shareExpiration: reverseShare.shareExpiration.toISOString(),
          remainingUses: reverseShare.remainingUses,
          shareCount: reverseShare._count?.shares ?? 0,
          reason: "reverse_share_expired",
        })),
      },
      expiredAuthTokens: {
        reason: "expired_auth_token",
        ...summarizeExpiredTokenCounts({
          refreshTokens: refreshTokenCount,
          loginTokens: loginTokenCount,
          resetPasswordTokens: resetPasswordTokenCount,
        }),
      },
      unactivatedUsers: {
        reason: "unactivated_user_expired",
        cutoffAt: unactivatedUserCutoff.toISOString(),
        total: unactivatedUserTotal,
        candidates: unactivatedUsers.map((user) => ({
          id: user.id,
          createdAt: user.createdAt.toISOString(),
          username: user.username,
          email: user.email,
          shareCount: user._count?.shares ?? 0,
          reason: "unactivated_user_expired",
        })),
      },
      temporaryFiles: this.getTemporaryFileCleanupPreview(now),
    };
  }

  @Cron("* * * * *")
  async deleteExpiredShares() {
    try {
      const fileRetentionPeriod = this.configServer.get(
        "share.fileRetentionPeriod",
      );

      const thresholdDate = buildCleanupThresholdDate(fileRetentionPeriod);

      if (!thresholdDate) {
        return;
      }

      const expiredShares = await this.prisma.share.findMany({
        where: {
          // We want to remove only shares that have an expiration date + retention period less than the current date, but not 0
          AND: [
            { expiration: { lt: thresholdDate } },
            { expiration: { not: moment(0).toDate() } },
          ],
        },
      });

      for (const expiredShare of expiredShares) {
        await this.fileService.deleteAllFiles(expiredShare.id);
        await this.prisma.share.delete({
          where: { id: expiredShare.id },
        });
      }

      if (expiredShares.length > 0) {
        this.logger.log(`Deleted ${expiredShares.length} expired shares`);
      }

      await this.recordCleanupLog({
        jobName: "expired_shares",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: expiredShares.length,
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "expired_shares",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  @Cron("0 * * * *")
  async deleteExpiredReverseShares() {
    try {
      const expiredReverseShares = await this.prisma.reverseShare.findMany({
        where: {
          shareExpiration: { lt: new Date() },
        },
      });

      for (const expiredReverseShare of expiredReverseShares) {
        await this.reverseShareService.remove(expiredReverseShare.id);
      }

      if (expiredReverseShares.length > 0) {
        this.logger.log(
          `Deleted ${expiredReverseShares.length} expired reverse shares`,
        );
      }

      await this.recordCleanupLog({
        jobName: "expired_reverse_shares",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: expiredReverseShares.length,
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "expired_reverse_shares",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  @Cron("0 */6 * * *")
  async deleteUnfinishedShares() {
    try {
      const cutoff = moment().subtract(1, "day").toDate();
      const unfinishedShares = await this.prisma.share.findMany({
        where: {
          uploadLocked: false,
          OR: [
            { updatedAt: { lt: cutoff } },
            { updatedAt: { equals: null }, createdAt: { lt: cutoff } },
          ],
        },
      });

      for (const unfinishedShare of unfinishedShares) {
        await this.fileService.deleteAllFiles(unfinishedShare.id);
        await this.prisma.share.delete({
          where: { id: unfinishedShare.id },
        });
      }

      if (unfinishedShares.length > 0) {
        this.logger.log(`Deleted ${unfinishedShares.length} unfinished shares`);
      }

      await this.recordCleanupLog({
        jobName: "unfinished_shares",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: unfinishedShares.length,
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "unfinished_shares",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  @Cron("0 0 * * *")
  async deleteTemporaryFiles() {
    try {
      let filesDeleted = 0;

      const shareDirectories = fs
        .readdirSync(SHARE_DIRECTORY, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const shareDirectory of shareDirectories) {
        const temporaryFiles = fs
          .readdirSync(`${SHARE_DIRECTORY}/${shareDirectory}`)
          .filter((file) => file.endsWith(".tmp-chunk"));

        for (const file of temporaryFiles) {
          const stats = fs.statSync(
            `${SHARE_DIRECTORY}/${shareDirectory}/${file}`,
          );

          if (isExpiredTemporaryFile(stats.mtime)) {
            fs.rmSync(`${SHARE_DIRECTORY}/${shareDirectory}/${file}`);
            filesDeleted++;
          }
        }
      }

      this.logger.log(`Deleted ${filesDeleted} temporary files`);

      await this.recordCleanupLog({
        jobName: "temporary_files",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: filesDeleted,
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "temporary_files",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  @Cron("1 * * * *")
  async deleteExpiredTokens() {
    try {
      const { count: refreshTokenCount } =
        await this.prisma.refreshToken.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        });

      const { count: loginTokenCount } =
        await this.prisma.loginToken.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        });

      const { count: resetPasswordTokenCount } =
        await this.prisma.resetPasswordToken.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        });

      const deletedTokensCount =
        refreshTokenCount + loginTokenCount + resetPasswordTokenCount;

      if (deletedTokensCount > 0) {
        this.logger.log(`Deleted ${deletedTokensCount} expired refresh tokens`);
      }

      await this.recordCleanupLog({
        jobName: "expired_tokens",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: deletedTokensCount,
        details: {
          refreshTokens: refreshTokenCount,
          loginTokens: loginTokenCount,
          resetPasswordTokens: resetPasswordTokenCount,
        },
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "expired_tokens",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  @Cron("0 * * * *")
  async deleteUnactivatedUsers() {
    try {
      const cutoff = moment().subtract(24, "hours").toDate();
      const unactivatedUsers = await this.prisma.user.findMany({
        where: {
          isActivated: false,
          createdAt: { lt: cutoff },
        },
        include: { shares: true },
      });

      for (const user of unactivatedUsers) {
        await Promise.all(
          user.shares.map((share) => this.fileService.deleteAllFiles(share.id)),
        );
        await this.prisma.user.delete({ where: { id: user.id } });
      }

      if (unactivatedUsers.length > 0) {
        this.logger.log(`Deleted ${unactivatedUsers.length} unactivated users`);
      }

      await this.recordCleanupLog({
        jobName: "unactivated_users",
        status: CLEANUP_LOG_STATUS_SUCCESS,
        deletedCount: unactivatedUsers.length,
      });
    } catch (error) {
      await this.recordCleanupLog({
        jobName: "unactivated_users",
        status: CLEANUP_LOG_STATUS_FAILURE,
        deletedCount: 0,
        error,
      });
      throw error;
    }
  }

  private shareCleanupInclude() {
    return {
      files: { select: { size: true } },
      _count: { select: { files: true } },
    };
  }

  private toShareCleanupCandidate(share, reason: string) {
    return {
      id: share.id,
      name: share.name,
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt?.toISOString() ?? null,
      expiration: share.expiration.toISOString(),
      uploadLocked: share.uploadLocked,
      storageProvider: share.storageProvider,
      removedReason: share.removedReason,
      fileCount: share._count?.files ?? share.files?.length ?? 0,
      size: sumFileSizes(share.files ?? []),
      reason,
    };
  }

  private getTemporaryFileCleanupPreview(now: Date) {
    const candidates = [];

    if (!fs.existsSync(SHARE_DIRECTORY)) {
      return {
        reason: "temporary_chunk_expired",
        total: 0,
        candidates,
      };
    }

    let shareDirectories: string[];

    try {
      shareDirectories = fs
        .readdirSync(SHARE_DIRECTORY, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch {
      return {
        reason: "temporary_chunk_expired",
        total: 0,
        candidates,
      };
    }

    for (const shareDirectory of shareDirectories) {
      const sharePath = path.join(SHARE_DIRECTORY, shareDirectory);
      let temporaryFiles: string[];

      try {
        temporaryFiles = fs
          .readdirSync(sharePath)
          .filter((file) => file.endsWith(".tmp-chunk"));
      } catch {
        continue;
      }

      for (const file of temporaryFiles) {
        const filePath = path.join(sharePath, file);
        let stats: fs.Stats;

        try {
          stats = fs.statSync(filePath);
        } catch {
          continue;
        }

        if (isExpiredTemporaryFile(stats.mtime, now)) {
          candidates.push({
            shareId: shareDirectory,
            fileName: file,
            relativePath: `${shareDirectory}/${file}`,
            modifiedAt: stats.mtime.toISOString(),
            size: stats.size,
            reason: "temporary_chunk_expired",
          });
        }
      }
    }

    return {
      reason: "temporary_chunk_expired",
      total: candidates.length,
      candidates: candidates.slice(0, CLEANUP_PREVIEW_LIMIT),
    };
  }
}
