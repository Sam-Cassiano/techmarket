import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@prisma/client';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';

type UserResponse = {
  id: number;
  username: string;
  role: Role;
  createdAt: Date;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(data: CreateUserDto): Promise<UserResponse> {
    if (!data.username || !data.password) {
      throw new BadRequestException('Username e senha são obrigatórios');
    }

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: data.role !== undefined ? data.role : Role.user,
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      await this.cacheManager.del('users_all');
      this.logger.log(`✅ Usuário criado: ${user.username} (ID ${user.id})`);
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Username já existe');
      }
      const err = error as Error;
      this.logger.error(`❌ Erro ao criar usuário: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  async findAll(): Promise<UserResponse[]> {
    const cacheKey = 'users_all';
    const cached = await this.cacheManager.get<UserResponse[]>(cacheKey);
    if (cached) return cached;

    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });
      await this.cacheManager.set(cacheKey, users, 300);
      return users;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`❌ Erro ao buscar usuários: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao buscar usuários');
    }
  }

  async findOne(id: number): Promise<UserResponse> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do usuário inválido');
    }

    const cacheKey = `user_${id}`;
    const cached = await this.cacheManager.get<UserResponse>(cacheKey);
    if (cached) return cached;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) throw new NotFoundException('Usuário não encontrado');

      await this.cacheManager.set(cacheKey, user, 300);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      this.logger.error(`❌ Erro ao buscar usuário: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao buscar usuário');
    }
  }

  async update(id: number, data: UpdateUserDto): Promise<UserResponse> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do usuário inválido');
    }

    try {
      const updateData: Prisma.UserUpdateInput = {
        username: data.username,
        role: data.role,
      };

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      await Promise.all([
        this.cacheManager.del('users_all'),
        this.cacheManager.del(`user_${id}`),
      ]);

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Username já existe');
      }
      const err = error as Error;
      this.logger.error(`❌ Erro ao atualizar usuário: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao atualizar usuário');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do usuário inválido');
    }

    try {
      await this.prisma.user.delete({ where: { id } });

      await Promise.all([
        this.cacheManager.del('users_all'),
        this.cacheManager.del(`user_${id}`),
      ]);

      return { message: 'Usuário removido com sucesso' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Usuário possui dependências e não pode ser removido');
      }
      const err = error as Error;
      this.logger.error(`❌ Erro ao remover usuário: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao remover usuário');
    }
  }
}
