import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import {
  TriarDemandaCommand,
  TriarDemandasEmLoteCommand,
  SolicitarInformacaoCommand,
  MarcarDuplicataCommand,
  EvoluirParaEpicoCommand,
  EvoluirParaDiscoveryCommand,
  ReatribuirPmCommand,
} from '@application/triagem/commands';
import {
  ListarDemandasPendentesQuery,
  BuscarDuplicatasQuery,
  ObterEstatisticasTriagemQuery,
  ObterSinaisTriagemQuery,
  ObterSugestoesTriagemQuery,
  ObterHistoricoSolucoesQuery,
} from '@application/triagem/queries';
import {
  TriagemAiDuplicacaoService,
  TriagemAiEncaminhamentoService,
} from '@application/triagem/services';

// DTOs
class TriarDemandaDto {
  novoStatus?: string;
  impacto?: string;
  urgencia?: string;
  complexidade?: string;
  observacoes?: string;
  checklistAtualizacoes?: Array<{
    itemId: string;
    completed: boolean;
  }>;
}

class SolicitarInformacaoDto {
  solicitanteId!: string;
  texto!: string;
  prazo?: Date;
}

class MarcarDuplicataDto {
  demandaOriginalId!: string;
  similaridade?: number;
}

class ReatribuirPmDto {
  novoPmId!: string;
}

class EvoluirEpicoDto {
  nomeEpico!: string;
  objetivoEpico!: string;
  produtoId!: string;
}

@Controller('triagem')
@UseGuards(JwtAuthGuard)
export class TriagemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly triagemAiDuplicacaoService: TriagemAiDuplicacaoService,
    private readonly triagemAiEncaminhamentoService: TriagemAiEncaminhamentoService,
  ) {}

  @Get('demandas-pendentes')
  async listarDemandasPendentes(@Request() req: any, @Query() queryParams: Record<string, any>) {
    const { page = '1', page_size = '20', sort, ...rawFilters } = queryParams;

    const filtrosExtraidos = this.parseFilters(rawFilters);

    const filtros = {
      produtoId: this.ensureSingle(filtrosExtraidos.produtoId),
      tipo: this.ensureArray(filtrosExtraidos.tipo),
      origem: this.ensureArray(filtrosExtraidos.origem),
      responsavelId: this.ensureSingle(filtrosExtraidos.responsavelId),
      status: this.ensureArray(filtrosExtraidos.status),
    };

    const paginacao = {
      page: Number(page) || 1,
      pageSize: Number(page_size) || 20,
      orderBy: sort ? sort.replace('-', '') : 'created_at',
      orderDirection: sort?.startsWith('-') ? ('desc' as const) : ('asc' as const),
    };

    const query = new ListarDemandasPendentesQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      filtros,
      paginacao,
    );
    return await this.queryBus.execute(query);
  }

  @Get('estatisticas')
  async obterEstatisticas(@Request() req: any) {
    const query = new ObterEstatisticasTriagemQuery(
      req.tenantId || req.user?.defaultTenantId || '',
    );
    return await this.queryBus.execute(query);
  }

  @Get('demandas/:id/duplicatas')
  async buscarDuplicatas(@Param('id') demandaId: string, @Request() req: any) {
    const query = new BuscarDuplicatasQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
    );
    return await this.queryBus.execute(query);
  }

  @Get('demandas/:id/sinais')
  async obterSinais(@Param('id') demandaId: string, @Request() req: any) {
    const query = new ObterSinaisTriagemQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
    );
    return await this.queryBus.execute(query);
  }

  @Get('demandas/:id/sugestoes')
  async obterSugestoes(@Param('id') demandaId: string, @Request() req: any) {
    const query = new ObterSugestoesTriagemQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
    );
    return await this.queryBus.execute(query);
  }

  @Get('demandas/:id/historico')
  async obterHistorico(@Param('id') demandaId: string, @Request() req: any) {
    const query = new ObterHistoricoSolucoesQuery(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
    );
    return await this.queryBus.execute(query);
  }

  @Patch('demandas/:id/triar')
  async triarDemanda(
    @Param('id') demandaId: string,
    @Body() dto: TriarDemandaDto,
    @Request() req: any,
  ) {
    const command = new TriarDemandaCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      req.user?.sub || '',
      dto.novoStatus,
      dto.impacto,
      dto.urgencia,
      dto.complexidade,
      dto.observacoes,
      dto.checklistAtualizacoes,
    );

    await this.commandBus.execute(command);
    return {
      success: true,
      message: dto.novoStatus ? 'Demanda triada com sucesso' : 'Triagem salva com sucesso',
    };
  }

  @Post('demandas/triar-em-lote')
  async triarDemandasEmLote(@Body() dto: { demandaIds: string[] }, @Request() req: any) {
    const command = new TriarDemandasEmLoteCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      dto.demandaIds,
      req.user?.sub || '',
    );

    const resultado = await this.commandBus.execute(command);
    return resultado;
  }

  @Post('demandas/:id/solicitar-informacao')
  async solicitarInformacao(
    @Param('id') demandaId: string,
    @Body() dto: SolicitarInformacaoDto,
    @Request() req: any,
  ) {
    const command = new SolicitarInformacaoCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      req.user?.sub || '',
      dto.solicitanteId,
      dto.texto,
      dto.prazo,
    );

    await this.commandBus.execute(command);
    return { success: true, message: 'Solicitação de informação enviada' };
  }

  @Post('demandas/:id/sugestoes-duplicacao')
  async gerarSugestoesDuplicacao(@Param('id') demandaId: string, @Request() req: any) {
    const tenantId = req.tenantId || req.user?.defaultTenantId || '';
    const resultado = await this.triagemAiDuplicacaoService.sugerirDuplicatas(tenantId, demandaId);
    return { sugestoes: resultado };
  }

  @Post('demandas/:id/sugestao-encaminhamento')
  async gerarSugestaoEncaminhamento(@Param('id') demandaId: string, @Request() req: any) {
    const tenantId = req.tenantId || req.user?.defaultTenantId || '';
    const resultado = await this.triagemAiEncaminhamentoService.sugerirEncaminhamento(
      tenantId,
      demandaId,
    );
    return { sugestao: resultado };
  }

  @Post('demandas/:id/marcar-duplicata')
  async marcarDuplicata(
    @Param('id') demandaId: string,
    @Body() dto: MarcarDuplicataDto,
    @Request() req: any,
  ) {
    const command = new MarcarDuplicataCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      dto.demandaOriginalId,
      req.user?.sub || '',
      dto.similaridade,
    );

    await this.commandBus.execute(command);
    return { success: true, message: 'Demanda marcada como duplicata' };
  }

  @Post('demandas/:id/evoluir-epico')
  async evoluirParaEpico(
    @Param('id') demandaId: string,
    @Body() dto: EvoluirEpicoDto,
    @Request() req: any,
  ) {
    const command = new EvoluirParaEpicoCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      dto.nomeEpico,
      dto.objetivoEpico,
      dto.produtoId,
      req.user?.sub || '',
    );

    const result = await this.commandBus.execute(command);
    return { success: true, data: result };
  }

  @Post('demandas/:id/evoluir-discovery')
  async evoluirParaDiscovery(@Param('id') demandaId: string, @Request() req: any) {
    const command = new EvoluirParaDiscoveryCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      req.user?.sub || '',
    );

    const result = await this.commandBus.execute(command);
    return {
      success: true,
      data: result,
      message: 'Demanda enviada para Discovery com sucesso',
    };
  }

  @Post('demandas/:id/reatribuir-pm')
  async reatribuirPm(
    @Param('id') demandaId: string,
    @Body() dto: ReatribuirPmDto,
    @Request() req: any,
  ) {
    const command = new ReatribuirPmCommand(
      req.tenantId || req.user?.defaultTenantId || '',
      demandaId,
      dto.novoPmId,
      req.user?.sub || '',
    );

    await this.commandBus.execute(command);
    return { success: true, message: 'Responsável reatribuído com sucesso.' };
  }

  private parseFilters(query: Record<string, any>): Record<string, string | string[] | undefined> {
    const filters: Record<string, string | string[] | undefined> = {};

    Object.entries(query).forEach(([key, value]) => {
      const match = key.match(/^filter\[(.+)]$/);
      if (!match) {
        return;
      }

      const filterKey = match[1];
      const normalized = Array.isArray(value) ? value : [value];
      const cleaned = normalized.filter(
        (item) => item !== undefined && item !== null && String(item).trim() !== '',
      );

      if (cleaned.length === 0) {
        return;
      }

      filters[filterKey] = cleaned.length === 1 ? String(cleaned[0]) : cleaned.map(String);
    });

    return filters;
  }

  private ensureArray(value: unknown): string[] | undefined {
    if (Array.isArray(value)) {
      const cleaned = value.map(String).filter((item) => item.trim() !== '');
      return cleaned.length > 0 ? cleaned : undefined;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return [value];
    }

    return undefined;
  }

  private ensureSingle(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      const first = value.find((item) => String(item).trim() !== '');
      return first !== undefined ? String(first) : undefined;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return undefined;
  }
}
