import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from './sale.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('SaleService', () => {
  let service: SaleService;
  let prisma: PrismaService;
  let cache: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: PrismaService,
          useValue: {
            sale: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            saleItem: {
              deleteMany: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => await cb(prisma)),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<Cache>(CACHE_MANAGER);
  });

  describe('findByUser', () => {
    it('deve lançar BadRequestException se userId for inválido', async () => {
      await expect(service.findByUser(0)).rejects.toThrow(BadRequestException);
    });

    it('deve retornar vendas do usuário', async () => {
      const mockSales = [{ id: 1, userId: 2 }];
      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue(mockSales as any);

      const result = await service.findByUser(2);
      expect(result).toEqual(mockSales);
    });

    it('deve lançar InternalServerErrorException em erro inesperado', async () => {
      jest.spyOn(prisma.sale, 'findMany').mockRejectedValue(new Error('DB error'));
      await expect(service.findByUser(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // Outros testes como create(), findAll(), findOne(), update(), remove() podem ser adicionados aqui
});
