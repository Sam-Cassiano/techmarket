import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.admin)
  async create(@Body() dto: CreateProductDto) {
    try {
      const product = await this.productService.create(dto);
      this.logger.log(`✅ Produto criado: ${product.name} (ID: ${product.id})`);
      return product;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar produto: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error instanceof Error
        ? error
        : new InternalServerErrorException('Erro ao criar produto');
    }
  }

  @Get()
  async findAll(@Query() filter: FilterProductDto) {
    try {
      const products = await this.productService.findAll(filter);
      this.logger.log(`📦 ${products.length} produto(s) retornado(s)`);
      return products;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar produtos: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Erro ao buscar produtos');
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const product = await this.productService.findOne(id);
      this.logger.log(`🔍 Produto encontrado: ID ${id}`);
      return product;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar produto ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    try {
      const product = await this.productService.update(id, dto);
      this.logger.log(`✏️ Produto atualizado: ID ${id}`);
      return product;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao atualizar produto ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.admin)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.productService.remove(id);
      this.logger.log(`🗑️ Produto removido: ID ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao remover produto ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
