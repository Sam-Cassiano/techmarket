import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Module({
  controllers: [ProtectedController],
  providers: [PrismaService, RoleGuard, JwtAuthGuard],
})
export class ProtectedModule {}
