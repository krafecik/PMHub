import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/roles.decorator';
import { TenantRole } from '@prisma/client';
import { TenantId } from '@core/auth/tenant-id.decorator';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import { ListCategoriasDto } from './dto/list-categorias.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ListItensDto } from './dto/list-itens.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { GetCategoriaDto } from './dto/get-categoria.dto';

@Controller('catalogos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('categorias')
  async listarCategorias(@TenantId() tenantId: string, @Query() query: ListCategoriasDto) {
    return this.catalogosService.listCategories(tenantId, query);
  }

  @Get('categorias/:id')
  async obterCategoria(
    @TenantId() tenantId: string,
    @Param('id') categoriaId: string,
    @Query() query: GetCategoriaDto,
  ) {
    return this.catalogosService.getCategoryById(tenantId, categoriaId, query);
  }

  @Post('categorias')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async criarCategoria(
    @TenantId() tenantId: string,
    @Body() dto: CreateCategoriaDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.catalogosService.createCategory(tenantId, dto, user);
  }

  @Patch('categorias/:id')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async atualizarCategoria(
    @TenantId() tenantId: string,
    @Param('id') categoriaId: string,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.catalogosService.updateCategory(tenantId, categoriaId, dto, user);
  }

  @Delete('categorias/:id')
  @Roles(TenantRole.CPO)
  async removerCategoria(
    @TenantId() tenantId: string,
    @Param('id') categoriaId: string,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.catalogosService.deleteCategory(tenantId, categoriaId, user);
    return { message: 'Categoria removida com sucesso.' };
  }

  @Get('categorias/:id/itens')
  async listarItens(
    @TenantId() tenantId: string,
    @Param('id') categoriaId: string,
    @Query() query: ListItensDto,
  ) {
    return this.catalogosService.listItems(tenantId, categoriaId, query);
  }

  @Post('categorias/:id/itens')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async criarItem(
    @TenantId() tenantId: string,
    @Param('id') categoriaId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.catalogosService.createItem(tenantId, categoriaId, dto, user);
  }

  @Patch('itens/:id')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async atualizarItem(
    @TenantId() tenantId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.catalogosService.updateItem(tenantId, itemId, dto, user);
  }

  @Delete('itens/:id')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async removerItem(
    @TenantId() tenantId: string,
    @Param('id') itemId: string,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.catalogosService.deleteItem(tenantId, itemId, user);
    return { message: 'Item removido com sucesso.' };
  }
}
