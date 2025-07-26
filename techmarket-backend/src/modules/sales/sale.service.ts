import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Prisma, Sale } from '@prisma/client';
import { Cache } from 'cache-manager';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(data: CreateSaleDto & { userId: number }): Promise<Sale> {
    if (!data.userId || data.userId <= 0 || !Number.isInteger(data.userId)) {
      this.logger.warn(`⚠️ ID de usuário inválido: ${data.userId}`);
      throw new BadRequestException('ID do usuário deve ser um número inteiro positivo');
    }

    if (!data.items || data.items.length === 0) {
      this.logger.warn('⚠️ Venda sem itens');
      throw new BadRequestException('A venda deve conter pelo menos um item');
    }

    const totalCalculado = Number(
      data.items
        .reduce((acc: number, item: CreateSaleDto['items'][number]) => {
          return acc + item.price * item.quantity;
        }, 0)
        .toFixed(2),
    );

    if (Math.abs(data.total - totalCalculado) > 0.01) {
      this.logger.warn(`⚠️ Total inválido: informado ${data.total}, calculado ${totalCalculado}`);
      throw new BadRequestException(
        `Total informado (${data.total}) não confere com o total calculado (${totalCalculado})`,
      );

    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Verify user exists
        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (!user) {
          this.logger.warn(`⚠️ Usuário com ID ${data.userId} não encontrado`);
          throw new BadRequestException(`Usuário com ID ${data.userId} não encontrado`);
        }

        for (const item of data.items) {
          if (!Number.isInteger(item.productId) || item.productId <= 0) {
            this.logger.warn(`⚠️ ID de produto inválido: ${item.productId}`);
            throw new BadRequestException('ID do produto deve ser um número inteiro positivo');
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            this.logger.warn(`⚠️ Produto com ID ${item.productId} não encontrado`);
            throw new BadRequestException(`Produto com ID ${item.productId} não encontrado`);
          }

          if (product.stock < item.quantity) {
            this.logger.warn(`⚠️ Estoque insuficiente para produto ${product.name} (ID: ${item.productId})`);
            throw new BadRequestException(
              `Estoque insuficiente para o produto ${product.name} (ID: ${item.productId})`,
            );
          }

          if (Math.abs(product.price - item.price) > 0.01) {
            this.logger.warn(
              `⚠️ Preço divergente para produto ${product.name} (ID: ${item.productId}): enviado ${item.price}, atual ${product.price}`,
            );
            throw new BadRequestException(
              `Preço do produto ${product.name} (ID: ${item.productId}) divergente: enviado ${item.price}, atual ${product.price}`,
            );
          }

          if (product.name !== item.name) {
            this.logger.warn(
              `⚠️ Nome divergente para produto (ID: ${item.productId}): enviado ${item.name}, atual ${product.name}`,
            );
            throw new BadRequestException(
              `Nome do produto (ID: ${item.productId}) divergente: enviado ${item.name}, atual ${product.name}`,
            );
          }

          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            this.logger.warn(`⚠️ Falha ao atualizar estoque do produto ${product.name} (ID: ${item.productId})`);
            throw new BadRequestException(
              `Falha ao atualizar o estoque do produto ${product.name} (ID: ${item.productId})`,
            );
          }
        }

        const sale = await tx.sale.create({
          data: {
            userId: data.userId,
            client: data.client,
            total: data.total,
            paymentMethod: data.paymentMethod,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
            },
          },
          select: {
            id: true,
            client: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: { select: { id: true, username: true } },
            items: {
              select: {
                productId: true,
                name: true,
                price: true,
                quantity: true,
                product: {
                  select: { id: true, name: true, price: true, stock: true, description: true, imageUrl: true },
                },
              },
            },
          },
        });

        // Invalidate cache
        await this.cacheManager.del('sales_all');
        this.logger.log(`✅ Venda criada com sucesso (ID: ${sale.id})`);
        return sale;
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao criar venda: ${(error as Error).message}`, (error as Error).stack);
      throw error instanceof BadRequestException ? error : new InternalServerErrorException('Erro ao criar venda');
    }
  }

  async findAll(): Promise<Sale[]> {
    const cacheKey = 'sales_all';
    const cachedSales = await this.cacheManager.get<Sale[]>(cacheKey);

    if (cachedSales) {
      this.logger.log('📦 Vendas retornadas do cache');
      return cachedSales;
    }


    try {
      const sales = await this.prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          client: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: { select: { id: true, username: true } },
          items: {
            select: {
              productId: true,
              name: true,
              price: true,
              quantity: true,
              product: {
                select: { id: true, name: true, price: true, stock: true, description: true, imageUrl: true },
              },
            },
          },
        },
      });
      await this.cacheManager.set(cacheKey, sales, 300);
      this.logger.log(`📦 Buscando todas as vendas: ${sales.length} encontrado(s)`);
      return sales;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar vendas: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Erro ao buscar vendas');
    }
  }

  async findOne(id: number): Promise<Sale> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      this.logger.warn(`⚠️ ID inválido fornecido: ${id}`);
      throw new BadRequestException('ID da venda deve ser um número inteiro positivo');
    }

    const cacheKey = `sale_${id}`;
    const cachedSale = await this.cacheManager.get<Sale>(cacheKey);

    if (cachedSale) {
      this.logger.log(`📦 Venda ID ${id} retornada do cache`);
      return cachedSale;
    }

    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id },
        select: {
          id: true,
          client: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: { select: { id: true, username: true } },
          items: {
            select: {
              id: true,
              productId: true,
              name: true,
              price: true,
              quantity: true,
              product: {
                select: { id: true, name: true, price: true, stock: true, description: true, imageUrl: true },
              },
            },
          },
        },
      });

      if (!sale) {
        this.logger.warn(`⚠️ Venda com ID ${id} não encontrada`);
        throw new BadRequestException('Venda não encontrada');
      }

      await this.cacheManager.set(cacheKey, sale, 300);
      this.logger.log(`🔍 Buscando venda com ID: ${id}`);
      return sale;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar venda com ID ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error instanceof BadRequestException ? error : new InternalServerErrorException('Erro ao buscar venda');
    }
  }

  async update(id: number, data: UpdateSaleDto): Promise<Sale> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      this.logger.warn(`⚠️ ID inválido fornecido: ${id}`);
      throw new BadRequestException('ID da venda deve ser um número inteiro positivo');
    }

    try {
      const sale = await this.prisma.sale.update({
        where: { id },
        data,
        select: {
          id: true,
          client: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });
      // Invalidate caches
      await Promise.all([
        this.cacheManager.del('sales_all'),
        this.cacheManager.del(`sale_${id}`),
      ]);
      this.logger.log(`✅ Venda com ID ${id} atualizada com sucesso`);
      return sale;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`⚠️ Venda com ID ${id} não encontrada para atualização`);
        throw new BadRequestException('Venda não encontrada');
      }
      this.logger.error(`❌ Erro ao atualizar venda com ID ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Erro ao atualizar venda');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      this.logger.warn(`⚠️ ID inválido fornecido: ${id}`);
      throw new BadRequestException('ID da venda deve ser um número inteiro positivo');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.saleItem.deleteMany({ where: { saleId: id } }),
        this.prisma.sale.delete({ where: { id } }),
      ]);
      // Invalidate caches
      await Promise.all([
        this.cacheManager.del('sales_all'),
        this.cacheManager.del(`sale_${id}`),
      ]);
      this.logger.log(`🗑️ Venda com ID ${id} removida com sucesso`);
      return { message: 'Venda removida com sucesso' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`⚠️ Venda com ID ${id} não encontrada para remoção`);
        throw new BadRequestException('Venda não encontrada');
      }
      this.logger.error(`❌ Erro ao remover venda com ID ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Erro ao remover venda');
    }
  }
   async findByUser(userId: number): Promise<Sale[]> {
     if (!userId || userId <= 0 || !Number.isInteger(userId)) {
       this.logger.warn(`⚠️ ID de usuário inválido: ${userId}`);
       throw new BadRequestException('ID do usuário deve ser um número inteiro positivo');
     }

     try {
       const sales = await this.prisma.sale.findMany({
         where: { userId },
         orderBy: { createdAt: 'desc' },
         select: {
           id: true,
           client: true,
           total: true,
           paymentMethod: true,
           createdAt: true,
           updatedAt: true,
           userId: true,
           user: { select: { id: true, username: true } },
           items: {
             select: {
               productId: true,
               name: true,
               price: true,
               quantity: true,
               product: {
                 select: {
                   id: true,
                   name: true,
                   price: true,
                   stock: true,
                   description: true,
                   imageUrl: true,
                 },
               },
             },
           },
         },
       });

       this.logger.log(`📦 Buscando vendas do usuário ID ${userId}: ${sales.length} encontrada(s)`);
       return sales; // ✅ Isso é necessário
     } catch (error) {
       this.logger.error(
         `❌ Erro ao buscar vendas do usuário ID ${userId}: ${(error as Error).message}`,
         (error as Error).stack,
       );
       throw new InternalServerErrorException('Erro ao buscar suas vendas');
     }
   }

}
