import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  IsUrl,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;
}
