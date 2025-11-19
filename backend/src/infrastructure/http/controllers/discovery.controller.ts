import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import {
  DiscoveryHttpService,
  ListarDiscoveriesQueryParams,
  CriarDiscoveryPayload,
  CriarHipotesePayload,
  RegistrarPesquisaPayload,
  AdicionarEntrevistaPayload,
  CriarEvidenciaPayload,
  GerarInsightPayload,
  IniciarExperimentoPayload,
  FinalizarDiscoveryPayload,
} from '../services/discovery.service';

// DTOs
class CriarDiscoveryDTO {
  demandaId!: string;
  titulo!: string;
  descricao!: string;
  contexto?: string;
  publicoAfetado?: string[];
  volumeImpactado?: string;
  severidade?: string;
  comoIdentificado?: string[];
  responsavelId!: string;
  produtoId!: string;
}

class CriarHipoteseDTO {
  titulo!: string;
  descricao!: string;
  comoValidar!: string;
  metricaAlvo?: string;
  impactoEsperado?: string;
  prioridade?: string;
}

class AtualizarDiscoveryDTO {
  titulo?: string;
  descricao?: string;
  contexto?: string;
  publicoAfetado?: string[];
  volumeImpactado?: string;
  severidade?: string;
  comoIdentificado?: string[];
}

class RegistrarPesquisaDTO {
  titulo!: string;
  metodo!: string;
  objetivo!: string;
  roteiroUrl?: string;
  totalParticipantes?: number;
}

class AdicionarEntrevistaDTO {
  participanteNome!: string;
  participantePerfil?: string;
  participanteEmail?: string;
  dataHora!: Date;
  transcricao?: string;
  notas?: string;
  gravacaoUrl?: string;
  tags?: string[];
  duracaoMinutos?: number;
}

class CriarEvidenciaDTO {
  hipoteseId?: string;
  tipo!: string;
  titulo!: string;
  descricao!: string;
  arquivoUrl?: string;
  tags?: string[];
}

class GerarInsightDTO {
  entrevistaId?: string;
  descricao!: string;
  impacto?: string;
  confianca?: string;
  tags?: string[];
  evidenciasIds?: string[];
}

class IniciarExperimentoDTO {
  hipoteseId?: string;
  titulo!: string;
  descricao!: string;
  tipo!: string;
  metricaSucesso!: string;
  grupoControle?: any;
  grupoVariante?: any;
}

class FinalizarDiscoveryDTO {
  statusFinal!: string;
  resumo!: string;
  aprendizados?: string[];
  recomendacoes?: string[];
  proximosPassos?: string[];
  materiaisAnexos?: any;
}

class CorrelacionarInsightsDTO {
  insightId!: string;
}

class SintetizarEntrevistasDTO {
  entrevistaIds?: string[];
}

@Controller('discoveries')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryHttpService) {}

  @Get()
  async listarDiscoveries(
    @CurrentUser() user: JwtAccessPayload,
    @Query() queryParams: ListarDiscoveriesQueryParams,
  ) {
    return this.discoveryService.listarDiscoveries(user, queryParams);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async atualizarDiscovery(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: AtualizarDiscoveryDTO,
  ) {
    return this.discoveryService.atualizarDiscovery(user, discoveryId, dto);
  }

  @Get('estatisticas')
  async obterEstatisticas(
    @CurrentUser() user: JwtAccessPayload,
    @Query('produtoId') produtoId?: string,
  ) {
    return this.discoveryService.obterEstatisticas(user, produtoId);
  }

  @Get('insights/relacionados')
  async buscarInsightsRelacionados(
    @CurrentUser() user: JwtAccessPayload,
    @Query('tags') tags: string | string[],
    @Query('excludeDiscoveryId') excludeDiscoveryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.buscarInsightsRelacionados(user, tags, excludeDiscoveryId, limit);
  }

  @Get(':id')
  async obterDiscovery(@CurrentUser() user: JwtAccessPayload, @Param('id') id: string) {
    return this.discoveryService.obterDiscovery(user, id);
  }

  @Get('pesquisas/:pesquisaId/entrevistas/:entrevistaId')
  async obterEntrevistaDetalhe(
    @CurrentUser() user: JwtAccessPayload,
    @Param('pesquisaId') pesquisaId: string,
    @Param('entrevistaId') entrevistaId: string,
  ) {
    return this.discoveryService.obterEntrevistaDetalhe(user, pesquisaId, entrevistaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criarDiscovery(@CurrentUser() user: JwtAccessPayload, @Body() dto: CriarDiscoveryDTO) {
    return this.discoveryService.criarDiscovery(user, dto as CriarDiscoveryPayload);
  }

  @Post(':id/hipoteses')
  @HttpCode(HttpStatus.CREATED)
  async criarHipotese(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: CriarHipoteseDTO,
  ) {
    return this.discoveryService.criarHipotese(user, discoveryId, dto as CriarHipotesePayload);
  }

  @Post(':id/pesquisas')
  @HttpCode(HttpStatus.CREATED)
  async registrarPesquisa(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: RegistrarPesquisaDTO,
  ) {
    return this.discoveryService.registrarPesquisa(
      user,
      discoveryId,
      dto as RegistrarPesquisaPayload,
    );
  }

  @Post('pesquisas/:pesquisaId/entrevistas')
  @HttpCode(HttpStatus.CREATED)
  async adicionarEntrevista(
    @CurrentUser() user: JwtAccessPayload,
    @Param('pesquisaId') pesquisaId: string,
    @Body() dto: AdicionarEntrevistaDTO,
  ) {
    return this.discoveryService.adicionarEntrevista(
      user,
      pesquisaId,
      dto as AdicionarEntrevistaPayload,
    );
  }

  @Post(':id/evidencias')
  @HttpCode(HttpStatus.CREATED)
  async criarEvidencia(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: CriarEvidenciaDTO,
  ) {
    return this.discoveryService.criarEvidencia(user, discoveryId, dto as CriarEvidenciaPayload);
  }

  @Post(':id/insights')
  @HttpCode(HttpStatus.CREATED)
  async gerarInsight(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: GerarInsightDTO,
  ) {
    return this.discoveryService.gerarInsight(user, discoveryId, dto as GerarInsightPayload);
  }

  @Post(':id/experimentos')
  @HttpCode(HttpStatus.CREATED)
  async iniciarExperimento(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: IniciarExperimentoDTO,
  ) {
    return this.discoveryService.iniciarExperimento(
      user,
      discoveryId,
      dto as IniciarExperimentoPayload,
    );
  }

  @Put(':id/decisao')
  @HttpCode(HttpStatus.OK)
  async finalizarDiscovery(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: FinalizarDiscoveryDTO,
  ) {
    return this.discoveryService.finalizarDiscovery(
      user,
      discoveryId,
      dto as FinalizarDiscoveryPayload,
    );
  }

  @Put('hipoteses/:hipoteseId/status')
  @HttpCode(HttpStatus.OK)
  async atualizarStatusHipotese(
    @CurrentUser() user: JwtAccessPayload,
    @Param('hipoteseId') hipoteseId: string,
    @Body('status') status: string,
  ) {
    return this.discoveryService.atualizarStatusHipotese(user, hipoteseId, status);
  }

  @Put('experimentos/:experimentoId/concluir')
  @HttpCode(HttpStatus.OK)
  async concluirExperimento(
    @CurrentUser() user: JwtAccessPayload,
    @Param('experimentoId') experimentoId: string,
    @Body() body: { resultados: any; pValue?: number },
  ) {
    return this.discoveryService.concluirExperimento(
      user,
      experimentoId,
      body.resultados,
      body.pValue,
    );
  }

  @Post(':id/sugerir-hipoteses')
  async sugerirHipoteses(@CurrentUser() user: JwtAccessPayload, @Param('id') discoveryId: string) {
    return this.discoveryService.sugerirHipoteses(user, discoveryId);
  }

  @Post(':id/correlacionar-insights')
  async correlacionarInsights(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: CorrelacionarInsightsDTO,
  ) {
    return this.discoveryService.correlacionarInsights(user, discoveryId, dto.insightId);
  }

  @Post(':id/sugerir-mvp')
  async sugerirMvp(@CurrentUser() user: JwtAccessPayload, @Param('id') discoveryId: string) {
    return this.discoveryService.sugerirMvp(user, discoveryId);
  }

  @Post(':id/gerar-resumo-executivo')
  async gerarResumoExecutivo(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
  ) {
    const summary = await this.discoveryService.gerarResumoExecutivo(user, discoveryId);
    return { resumo: summary };
  }

  @Post(':id/sintetizar-entrevistas')
  async sintetizarEntrevistas(
    @CurrentUser() user: JwtAccessPayload,
    @Param('id') discoveryId: string,
    @Body() dto: SintetizarEntrevistasDTO,
  ) {
    const resumo = await this.discoveryService.sintetizarEntrevistas(
      user,
      discoveryId,
      dto.entrevistaIds,
    );

    return { resumo };
  }
}
