import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Inject,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import {
  CriarRegraCommand,
  AtualizarRegraCommand,
  AlternarStatusRegraCommand,
  DeletarRegraCommand,
} from '@application/automacao/commands';
import { ListarRegrasQuery, ObterRegraQuery } from '@application/automacao/queries';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';

class CriarRegraDto {
  nome!: string;
  descricao?: string;
  condicoes!: Array<{
    campoId: string;
    operadorId: string;
    valor?: any;
    logica?: 'E' | 'OU';
  }>;
  acoes!: Array<{
    tipoId: string;
    campoId?: string;
    valor?: any;
    configuracao?: Record<string, any>;
  }>;
  ativo?: boolean;
  ordem?: number;
}

class AtualizarRegraDto {
  nome?: string;
  descricao?: string;
  condicoes?: Array<{
    campoId: string;
    operadorId: string;
    valor?: any;
    logica?: 'E' | 'OU';
  }>;
  acoes?: Array<{
    tipoId: string;
    campoId?: string;
    valor?: any;
    configuracao?: Record<string, any>;
  }>;
  ordem?: number;
}

class AlternarStatusDto {
  ativo!: boolean;
}

@Controller('automacao/regras')
@UseGuards(JwtAuthGuard)
export class AutomacaoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  @Post()
  async criar(@Body() dto: CriarRegraDto, @Request() req: any) {
    const command = new CriarRegraCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      dto.nome,
      dto.descricao,
      dto.condicoes ?? [],
      dto.acoes ?? [],
      dto.ativo ?? true,
      dto.ordem,
      req.user?.sub || '',
    );

    const result = await this.commandBus.execute(command);
    return { success: true, data: result };
  }

  @Get()
  async listar(@Query('apenas_ativas') apenasAtivas?: boolean, @Request() req?: any) {
    const query = new ListarRegrasQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      apenasAtivas,
    );

    const regras = await this.queryBus.execute(query);
    return { success: true, data: regras };
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Request() req: any) {
    const query = new ObterRegraQuery(req.tenantId || req.user?.defaultTenantId || '', id);
    const regra = await this.queryBus.execute(query);

    if (!regra) {
      throw new Error('Regra não encontrada');
    }

    return { success: true, data: regra };
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: AtualizarRegraDto, @Request() req: any) {
    const command = new AtualizarRegraCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      id,
      dto.nome,
      dto.descricao,
      dto.condicoes,
      dto.acoes,
      dto.ordem,
    );

    await this.commandBus.execute(command);
    return { success: true, message: 'Regra atualizada com sucesso' };
  }

  @Patch(':id/status')
  async alternarStatus(
    @Param('id') id: string,
    @Body() dto: AlternarStatusDto,
    @Request() req: any,
  ) {
    const command = new AlternarStatusRegraCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      id,
      dto.ativo,
    );

    await this.commandBus.execute(command);
    return {
      success: true,
      message: dto.ativo ? 'Regra ativada com sucesso' : 'Regra desativada com sucesso',
    };
  }

  @Delete(':id')
  async deletar(@Param('id') id: string, @Request() req: any) {
    const command = new DeletarRegraCommand(req.tenantId || req.user?.defaultTenantId || '', id);
    await this.commandBus.execute(command);
    return { success: true, message: 'Regra deletada com sucesso' };
  }

  @Get('metadata/operadores')
  async listarOperadores(@Request() req: any) {
    const tenantId = req.tenantId || req.user?.defaultTenantId || '';
    const itens = await this.catalogoRepository.listItemsByCategory(
      tenantId,
      CatalogCategorySlugs.AUTOMACAO_OPERADORES,
    );
    return {
      success: true,
      data: itens.map((item) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
      })),
    };
  }

  @Get('metadata/tipos-acao')
  async listarTiposAcao(@Request() req: any) {
    const tenantId = req.tenantId || req.user?.defaultTenantId || '';
    const itens = await this.catalogoRepository.listItemsByCategory(
      tenantId,
      CatalogCategorySlugs.AUTOMACAO_ACOES,
    );
    return {
      success: true,
      data: itens.map((item) => {
        const metadata = (item.metadata as Record<string, unknown> | null) ?? null;
        return {
          id: item.id,
          slug: item.slug,
          label: item.label,
          metadata,
        };
      }),
    };
  }

  @Get('metadata/campos')
  async listarCampos(@Request() req: any) {
    const tenantId = req.tenantId || req.user?.defaultTenantId || '';
    const itens = await this.catalogoRepository.listItemsByCategory(
      tenantId,
      CatalogCategorySlugs.AUTOMACAO_CAMPOS,
    );
    return {
      success: true,
      data: itens.map((item) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
      })),
    };
  }
}
