import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

// Mock do bcrypt antes da importação real
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
}));

import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const dto = {
        username: 'test',
        password: 'test123',
        role: Role.client,
      };
      const expectedUser = {
        id: 1,
        username: 'test',
        password: 'hashed-password',
        role: Role.client,
        createdAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(expectedUser);

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('test123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'test',
          password: 'hashed-password',
          role: Role.client,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw if username already exists', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '0.0.0',
        }),
      );

      await expect(service.create({
        username: 'test',
        password: '123456',
        role: Role.client,
      })).rejects.toThrow(new BadRequestException('Nome de usuário já existe'));
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{
        id: 1,
        username: 'test',
        password: 'hashed-password',
        role: Role.client,
        createdAt: new Date(),
      }];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const user = {
        id: 1,
        username: 'test',
        password: 'hashed-password',
        role: Role.client,
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user without password', async () => {
      const dto = { username: 'updated' };
      const updatedUser = {
        id: 1,
        username: 'updated',
        password: 'hashed-password',
        role: Role.client,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update user with password hash', async () => {
      const dto = { username: 'updated', password: 'newpassword' };
      const updatedUser = {
        id: 1,
        username: 'updated',
        password: 'hashed-password',
        role: Role.client,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: 'updated',
          password: 'hashed-password',
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw if user not found', async () => {
      prisma.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '0.0.0',
        }),
      );

      await expect(service.update(999, { username: 'x' })).rejects.toThrow(
        new BadRequestException('Usuário não encontrado'),
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const user = { id: 1 };
      prisma.user.delete.mockResolvedValue(user);

      const result = await service.remove(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should throw if user not found', async () => {
      prisma.user.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '0.0.0',
        }),
      );

      await expect(service.remove(999)).rejects.toThrow(
        new BadRequestException('Usuário não encontrado'),
      );
    });
  });
});
