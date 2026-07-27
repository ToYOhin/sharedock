import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class UpdateShareSecurityDTO {
  @IsString()
  @IsOptional()
  @Length(3, 30)
  password?: string;

  @IsBoolean()
  @IsOptional()
  removePassword?: boolean;

  @IsNumber()
  @IsOptional()
  maxViews?: number | null;
}

export class UpdateShareDTO {
  @Length(3, 30)
  @IsOptional()
  name?: string | null;

  @IsString()
  @IsOptional()
  expiration?: string;

  @MaxLength(512)
  @IsOptional()
  description?: string | null;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @IsOptional()
  tags?: string[];

  @ValidateNested()
  @Type(() => UpdateShareSecurityDTO)
  @IsOptional()
  security?: UpdateShareSecurityDTO;
}
