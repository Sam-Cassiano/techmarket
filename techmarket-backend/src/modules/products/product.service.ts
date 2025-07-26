import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    const trimmedName = data.name.trim();
    const payload = { ...data, name: trimmedName };

    if (!payload.name || payload.price <= 0 || payload.stock < 0 || !payload.category) {
      throw new BadRequestException(
        'Nome, preço positivo, estoque não negativo e categoria são obrigatórios',
      );
    }

    try {
      const newProduct = await this.prisma.product.create({ data: payload });
      await this.cacheManager.del('products_all');
      return newProduct;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Nome do produto já existe');
      }

      const err = error as Error;
      this.logger.error(`Erro ao criar produto: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao criar produto');
    }
  }

  async findAll(filters: FilterProductDto): Promise<Product[]> {
    const { search, category, minPrice, maxPrice } = filters;

    try {
      const products = await this.prisma.product.findMany({
        where: {
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
            category ? { category: { equals: category, mode: 'insensitive' } } : {},
            typeof minPrice === 'number' ? { price: { gte: minPrice } } : {},
            typeof maxPrice === 'number' ? { price: { lte: maxPrice } } : {},
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return products;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao buscar produtos: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao buscar produtos');
    }
  }

  async findOne(id: number): Promise<Product> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do produto inválido');
    }

    const cacheKey = `product_${id}`;
    const cached = await this.cacheManager.get<Product>(cacheKey);
    if (cached) return cached;

    try {
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      await this.cacheManager.set(cacheKey, product, 300);
      return product;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao buscar produto ID ${id}: ${err.message}`, err.stack);
      throw err instanceof NotFoundException
        ? err
        : new InternalServerErrorException('Erro ao buscar produto');
    }
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do produto inválido');
    }

    const payload = { ...data, name: data.name?.trim() };

    if (payload.price !== undefined && payload.price <= 0) {
      throw new BadRequestException('Preço deve ser positivo');
    }

    if (payload.stock !== undefined && payload.stock < 0) {
      throw new BadRequestException('Estoque não pode ser negativo');
    }

    try {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (payload.name && payload.name !== existing.name) {
        const nameExists = await this.prisma.product.findUnique({
          where: { name: payload.name },
        });
        if (nameExists) {
          throw new BadRequestException('Nome do produto já existe');
        }
      }

      const updated = await this.prisma.product.update({
        where: { id },
        data: payload,
      });

      await Promise.all([
        this.cacheManager.del('products_all'),
        this.cacheManager.del(`product_${id}`),
      ]);

      return updated;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao atualizar produto ID ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao atualizar produto');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('ID do produto inválido');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.saleItem.deleteMany({ where: { productId: id } }),
        this.prisma.product.delete({ where: { id } }),
      ]);

      await Promise.all([
        this.cacheManager.del('products_all'),
        this.cacheManager.del(`product_${id}`),
      ]);

      return { message: 'Produto removido com sucesso' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Produto não encontrado');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Produto possui itens de venda associados',
          );
        }
      }

      const err = error as Error;
      this.logger.error(`Erro ao remover produto ID ${id}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao remover produto');
    }
  }
}
