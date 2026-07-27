import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateUploadTokenDTO {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
