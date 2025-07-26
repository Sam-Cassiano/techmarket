import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod?: PaymentMethod;
}
