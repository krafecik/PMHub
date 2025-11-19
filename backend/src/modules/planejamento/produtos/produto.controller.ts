import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProdutoService, ProdutoView } from './produto.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantRole } from '@prisma/client';
import { Roles } from '@core/auth/roles.decorator';
import { TenantId } from '@core/auth/tenant-id.decorator';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';

@Controller('produtos')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProdutoController {
  constructor(private readonly produtoService: ProdutoService) {}

  @Get()
  async list(@TenantId() tenantId: string): Promise<ProdutoView[]> {
    return this.produtoService.list(tenantId.toString());
  }

  @Post()
  @Roles(TenantRole.CPO, TenantRole.PM)
  async create(
    @TenantId() tenantId: string,
    @Body() body: CreateProdutoDto,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<ProdutoView> {
    return this.produtoService.create(tenantId.toString(), body, user);
  }

  @Get(':id')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<ProdutoView> {
    return this.produtoService.findOne(tenantId.toString(), id);
  }

  @Patch(':id')
  @Roles(TenantRole.CPO, TenantRole.PM)
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateProdutoDto,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<ProdutoView> {
    return this.produtoService.update(tenantId.toString(), id, body, user);
  }

  @Delete(':id')
  @Roles(TenantRole.CPO)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ message: string }> {
    await this.produtoService.remove(tenantId.toString(), id, user);
    return { message: 'Produto removido com sucesso.' };
  }
}
