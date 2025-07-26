import { Test, TestingModule } from '@nestjs/testing'
import { SaleService } from './sale.service'
import { PrismaService } from '../../../prisma/prisma.service'
import { BadRequestException } from '@nestjs/common'
import { PaymentMethod, Prisma } from '@prisma/client'

describe('SaleService', () => {
  let service: SaleService
  let mockPrisma: any

  beforeEach(async () => {
    mockPrisma = {
      sale: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<SaleService>(SaleService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('create', () => {
    const createSaleDto = {
      userId: 1,
      client: 'Test Client',
      total: 350,
      paymentMethod: PaymentMethod.credit_card,
      items: [
        { productId: 1, name: 'Test Product', price: 100, quantity: 2 },
        { productId: 2, name: 'Another Product', price: 150, quantity: 1 },
      ],
    }

    it('should create a sale successfully', async () => {
      const product1 = { id: 1, name: 'Test Product', price: 100, stock: 10 }
      const product2 = { id: 2, name: 'Another Product', price: 150, stock: 5 }
      const sale = { ...createSaleDto, id: 1 }

      mockPrisma.product.findUnique
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2)

      mockPrisma.product.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 })

      mockPrisma.sale.create.mockResolvedValue(sale)

      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

      const result = await service.create(createSaleDto)
      expect(result).toEqual(sale)
    })

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce(null)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

      await expect(service.create(createSaleDto)).rejects.toThrow(
        'Produto com ID 1 não encontrado.',
      )
    })

    it('should throw if stock is insufficient', async () => {
      const product = { id: 1, name: 'Test Product', price: 100, stock: 1 }
      mockPrisma.product.findUnique.mockResolvedValueOnce(product)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

      await expect(service.create(createSaleDto)).rejects.toThrow(
        'Estoque insuficiente para o produto Test Product (ID: 1).',
      )
    })

    it('should throw if price does not match', async () => {
      const product = { id: 1, name: 'Test Product', price: 150, stock: 10 }
      mockPrisma.product.findUnique.mockResolvedValueOnce(product)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

      await expect(service.create(createSaleDto)).rejects.toThrow(
        'Preço do produto Test Product (ID: 1) divergente: enviado 100, atual 150.',
      )
    })

    it('should throw if total does not match', async () => {
      const product1 = { id: 1, name: 'Test Product', price: 100, stock: 10 }
      const product2 = { id: 2, name: 'Another Product', price: 150, stock: 5 }

      mockPrisma.product.findUnique
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2)

      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

      const invalidDto = { ...createSaleDto, total: 300 }

      await expect(service.create(invalidDto)).rejects.toThrow(
        'Total informado (300) não confere com o total calculado (350).',
      )
    })
  })

  describe('findOne', () => {
    it('should return sale by id', async () => {
      const sale = { id: 1, client: 'Client' }
      mockPrisma.sale.findUnique.mockResolvedValue(sale)

      const result = await service.findOne(1)
      expect(result).toEqual(sale)
    })

    it('should throw if not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(
        'Venda não encontrada.',
      )
    })
  })

  describe('update', () => {
    it('should update sale', async () => {
      const updatedSale = { id: 1, client: 'Updated' }
      mockPrisma.sale.update.mockResolvedValue(updatedSale)

      const result = await service.update(1, { client: 'Updated' })
      expect(result).toEqual(updatedSale)
    })

    it('should throw if not found', async () => {
      mockPrisma.sale.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '0.0.0',
        }),
      )

      await expect(service.update(999, { client: 'X' })).rejects.toThrow(
        'Venda não encontrada.',
      )
    })
  })

  describe('remove', () => {
    it('should delete sale', async () => {
      const deletedSale = { id: 1 }
      mockPrisma.sale.delete.mockResolvedValue(deletedSale)

      const result = await service.remove(1)
      expect(result).toEqual(deletedSale)
    })

    it('should throw if not found', async () => {
      mockPrisma.sale.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '0.0.0',
        }),
      )

      await expect(service.remove(999)).rejects.toThrow(
        'Venda não encontrada.',
      )
    })
  })
})
