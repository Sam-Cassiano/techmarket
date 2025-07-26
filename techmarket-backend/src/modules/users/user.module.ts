import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    RoleGuard,
  ],
  exports: [UserService],
})
export class UserModule {}
