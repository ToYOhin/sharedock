import * as assert from "node:assert/strict";
import { UploadTokenService } from "../src/uploadToken/uploadToken.service";
import {
  hashUploadTokenSecret,
  UPLOAD_TOKEN_SCOPE,
} from "../src/uploadToken/uploadToken.util";

const tokenSecret = "sdock_service_test";
const activeToken = {
  id: "token-active",
  createdAt: new Date("2026-07-02T00:00:00.000Z"),
  updatedAt: new Date("2026-07-02T00:00:00.000Z"),
  name: "ShareX",
  tokenHash: hashUploadTokenSecret(tokenSecret),
  tokenPrefix: "sdock_servic",
  scope: UPLOAD_TOKEN_SCOPE,
  revokedAt: null,
  lastUsedAt: null,
  creatorId: "user-1",
  creator: {
    id: "user-1",
    username: "qa",
    email: "qa@example.test",
  },
};

const calls: string[] = [];
let tokenRow: typeof activeToken | null = activeToken;
const service = new UploadTokenService({
  uploadToken: {
    findUnique: async ({ where, include }: any) => {
      calls.push(`find:${where.tokenHash}:${Boolean(include?.creator)}`);
      return tokenRow && where.tokenHash === tokenRow.tokenHash
        ? tokenRow
        : null;
    },
    update: async ({ where, data }: any) => {
      calls.push(`update:${where.id}:${data.lastUsedAt instanceof Date}`);
      return {
        ...activeToken,
        id: where.id,
        lastUsedAt: data.lastUsedAt,
      };
    },
  },
} as any);

async function main() {
  const authenticatedToken =
    await service.authenticateUploadToken(tokenSecret);

  assert.equal(authenticatedToken?.id, "token-active");
  assert.equal(authenticatedToken?.creator.id, "user-1");
  assert.deepEqual(calls, [
    `find:${hashUploadTokenSecret(tokenSecret)}:true`,
  ]);

  tokenRow = { ...activeToken, revokedAt: new Date() };
  assert.equal(await service.authenticateUploadToken(tokenSecret), null);

  tokenRow = { ...activeToken, scope: "other" };
  assert.equal(await service.authenticateUploadToken(tokenSecret), null);

  tokenRow = null;
  assert.equal(await service.authenticateUploadToken("sdock_missing"), null);

  await service.markUploadTokenUsed("token-active");
  assert.equal(calls.at(-1), "update:token-active:true");

  console.log("UPLOAD_TOKEN_SERVICE_TEST_OK");
}

void main();
