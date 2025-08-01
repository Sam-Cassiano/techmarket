import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [SaleController],
  providers: [SaleService, PrismaService],
})
export class SaleModule {}
