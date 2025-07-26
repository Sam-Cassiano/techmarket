import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Exemplo de teste real para findAll
  it('should return a list of products', async () => {
    const mockProducts = [{ id: 1, name: 'Produto A' }, { id: 2, name: 'Produto B' }];
    (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

    const result = await service.findAll();
    expect(result).toEqual(mockProducts);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});
