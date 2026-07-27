import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { GetUser } from "src/auth/decorator/getUser.decorator";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { CreateUploadTokenDTO } from "./dto/createUploadToken.dto";
import { UploadTokenService } from "./uploadToken.service";

@Controller("uploadTokens")
export class UploadTokenController {
  constructor(private uploadTokenService: UploadTokenService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getAllByUser(@GetUser() user: User) {
    return this.uploadTokenService.getAllByUser(user.id);
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(@Body() body: CreateUploadTokenDTO, @GetUser() user: User) {
    return this.uploadTokenService.create(body, user.id);
  }

  @Delete(":uploadTokenId")
  @UseGuards(JwtGuard)
  async revoke(
    @Param("uploadTokenId") uploadTokenId: string,
    @GetUser() user: User,
  ) {
    return this.uploadTokenService.revoke(uploadTokenId, user.id);
  }
}
