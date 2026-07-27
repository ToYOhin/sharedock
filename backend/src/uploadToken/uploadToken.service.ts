import { Injectable, NotFoundException } from "@nestjs/common";
import { UploadToken } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUploadTokenDTO } from "./dto/createUploadToken.dto";
import {
  createUploadTokenSecret,
  getUploadTokenPrefix,
  hashUploadTokenSecret,
  UPLOAD_TOKEN_SCOPE,
} from "./uploadToken.util";

@Injectable()
export class UploadTokenService {
  constructor(private prisma: PrismaService) {}

  async getAllByUser(userId: string) {
    const tokens = await this.prisma.uploadToken.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
    });

    return tokens.map((token) => this.toResponse(token));
  }

  async create(data: CreateUploadTokenDTO, creatorId: string) {
    const token = createUploadTokenSecret();
    const createdToken = await this.prisma.uploadToken.create({
      data: {
        name: this.normalizeName(data.name),
        tokenHash: hashUploadTokenSecret(token),
        tokenPrefix: getUploadTokenPrefix(token),
        scope: UPLOAD_TOKEN_SCOPE,
        creatorId,
      },
    });

    return {
      ...this.toResponse(createdToken),
      token,
    };
  }

  async revoke(id: string, creatorId: string) {
    const token = await this.prisma.uploadToken.findFirst({
      where: { id, creatorId },
    });

    if (!token) throw new NotFoundException("Upload token not found");

    if (token.revokedAt) return this.toResponse(token);

    const revokedToken = await this.prisma.uploadToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return this.toResponse(revokedToken);
  }

  async authenticateUploadToken(token: string) {
    const uploadToken = await this.prisma.uploadToken.findUnique({
      where: { tokenHash: hashUploadTokenSecret(token) },
      include: { creator: true },
    });

    if (
      !uploadToken ||
      uploadToken.revokedAt ||
      uploadToken.scope !== UPLOAD_TOKEN_SCOPE
    ) {
      return null;
    }

    return uploadToken;
  }

  async markUploadTokenUsed(id: string) {
    return this.prisma.uploadToken.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  private normalizeName(name?: string) {
    const normalizedName = name?.trim();
    return normalizedName ? normalizedName : null;
  }

  private toResponse(token: UploadToken) {
    const {
      tokenHash: _tokenHash,
      creatorId: _creatorId,
      updatedAt: _updatedAt,
      ...safeToken
    } = token;

    return safeToken;
  }
}
