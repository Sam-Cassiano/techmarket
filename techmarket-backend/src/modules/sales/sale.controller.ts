import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RoleGuard, Roles } from '../../common/guards/role.guard';
import { Role } from '@prisma/client';

interface AuthenticatedUser {
  id: number;
  username: string;
  role: Role;
}

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SaleController {
  private readonly logger = new Logger(SaleController.name);

  constructor(private readonly saleService: SaleService) {}

  @Post()
  async create(@Req() req: Request, @Body() data: CreateSaleDto) {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      throw new BadRequestException('Usuário não autenticado');
    }

    try {
      const result = await this.saleService.create({ ...data, userId: user.id });
      this.logger.log(`✅ Venda criada com sucesso (userId: ${user.id})`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar venda (userId: ${user.id}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Erro ao criar venda');
    }
  }

  @Get()
  @Roles(Role.admin, Role.user) // <- Corrigido: permite admin e user
  @UseGuards(RoleGuard)
  async findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;

    try {
      const result =
        user.role === Role.admin
          ? await this.saleService.findAll()
          : await this.saleService.findByUser(user.id);

      this.logger.log(
        `📦 Buscando vendas (${user.role}): ${result.length} encontrada(s)`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar vendas: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Erro ao buscar vendas');
    }
  }

  @Get('my')
  @Roles(Role.user) // permanece como rota explícita se desejar
  @UseGuards(RoleGuard)
  async getMySales(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    try {
      const result = await this.saleService.findByUser(user.id);
      this.logger.log(`🧾 Buscando vendas do usuário ID ${user.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar vendas do cliente: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Erro ao buscar suas vendas');
    }
  }

  @Get(':id')
  @Roles(Role.admin)
  @UseGuards(RoleGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.saleService.findOne(id);
      this.logger.log(`🔍 Venda encontrada (ID: ${id})`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar venda ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Put(':id')
  @Roles(Role.admin)
  @UseGuards(RoleGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSaleDto) {
    try {
      const result = await this.saleService.update(id, data);
      this.logger.log(`🔄 Venda com ID ${id} atualizada com sucesso`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao atualizar venda ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles(Role.admin)
  @UseGuards(RoleGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.saleService.remove(id);
      this.logger.log(`🗑️ Venda com ID ${id} removida com sucesso`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao remover venda ID ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
