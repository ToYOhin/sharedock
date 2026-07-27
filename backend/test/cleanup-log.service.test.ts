import * as assert from "node:assert/strict";
import { JobsService } from "../src/jobs/jobs.service";
import {
  CLEANUP_LOG_LIMIT,
  CLEANUP_LOG_STATUS_FAILURE,
  CLEANUP_LOG_STATUS_SUCCESS,
} from "../src/jobs/cleanup-log.util";

const createdRows: any[] = [];
const findManyCalls: any[] = [];

const service = new JobsService(
  {
    cleanupLog: {
      create: async ({ data }: any) => {
        createdRows.push(data);
        return {
          id: `log-${createdRows.length}`,
          createdAt: new Date(),
          ...data,
        };
      },
      findMany: async (args: any) => {
        findManyCalls.push(args);
        return [
          {
            id: "log-1",
            createdAt: new Date("2026-07-03T00:00:00.000Z"),
            jobName: "expired_tokens",
            status: CLEANUP_LOG_STATUS_SUCCESS,
            deletedCount: 3,
            errorMessage: null,
            details: '{"refreshTokens":2,"loginTokens":1}',
          },
        ];
      },
    },
  } as any,
  {} as any,
  {} as any,
  {} as any,
);

async function main() {
  await service.recordCleanupLog({
    jobName: "expired_shares",
    status: CLEANUP_LOG_STATUS_SUCCESS,
    deletedCount: 0,
  });

  assert.equal(createdRows.length, 0);

  await service.recordCleanupLog({
    jobName: "expired_shares",
    status: CLEANUP_LOG_STATUS_SUCCESS,
    deletedCount: 2,
  });

  assert.equal(createdRows.length, 1);
  assert.deepEqual(createdRows[0], {
    jobName: "expired_shares",
    status: CLEANUP_LOG_STATUS_SUCCESS,
    deletedCount: 2,
    errorMessage: null,
    details: null,
  });

  await service.recordCleanupLog({
    jobName: "temporary_files",
    status: CLEANUP_LOG_STATUS_FAILURE,
    deletedCount: 0,
    error: new Error("share directory missing"),
    details: { shareDirectories: 0 },
  });

  assert.equal(createdRows.length, 2);
  assert.equal(createdRows[1].errorMessage, "share directory missing");
  assert.equal(createdRows[1].details, '{"shareDirectories":0}');

  const logs = await service.getCleanupLogs();

  assert.deepEqual(findManyCalls[0], {
    orderBy: { createdAt: "desc" },
    take: CLEANUP_LOG_LIMIT,
  });
  assert.deepEqual(logs[0].details, {
    refreshTokens: 2,
    loginTokens: 1,
  });

  console.log("CLEANUP_LOG_SERVICE_TEST_OK");
}

void main();
