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

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  @MaxLength(50)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;
}
