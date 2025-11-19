import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { TenantId } from '@core/auth/tenant-id.decorator';
import {
  CriarOuAtualizarEpicoCommand,
  AtualizarStatusEpicoCommand,
  CriarOuAtualizarFeatureCommand,
  AtualizarStatusFeatureCommand,
  RegistrarDependenciaCommand,
  RemoverDependenciaCommand,
  AtualizarCapacidadeSquadCommand,
  SalvarCommitmentCommand,
  SalvarCenarioCommand,
  RecalcularCenarioCommand,
  AtualizarPlanningCycleCommand,
  SalvarSquadCommand,
  RemoverSquadCommand,
  CriarPlanningCycleCommand,
  RemoverPlanningCycleCommand,
} from '@application/planejamento';
import {
  ListarEpicosQuery,
  ObterEpicoDetalheQuery,
  ListarFeaturesQuery,
  ObterFeatureDetalheQuery,
  ListarCapacidadeQuery,
  ListarCenariosQuery,
  ObterPlanningDashboardQuery,
  ObterTimelineQuery,
  ListarDependenciasQuery,
  ListarTodasDependenciasQuery,
  ListarCommitmentsQuery,
  ObterCommitmentDetalheQuery,
  ListarSquadsQuery,
  ListarPlanningCyclesQuery,
  ObterPlanningCycleQuery,
} from '@application/planejamento/queries';
import { UpsertEpicoDto } from './dto/upsert-epico.dto';
import { UpdateEpicoStatusDto } from './dto/update-epico-status.dto';
import { UpsertFeatureDto } from './dto/upsert-feature.dto';
import { UpdateFeatureStatusDto } from './dto/update-feature-status.dto';
import { ListFeaturesDto } from './dto/list-features.dto';
import { ListDependenciasDto } from './dto/list-dependencias.dto';
import { ListCommitmentsDto } from './dto/list-commitments.dto';
import { RegistrarDependenciaDto } from './dto/registrar-dependencia.dto';
import { UpdateCapacidadeDto } from './dto/update-capacidade.dto';
import { SaveCommitmentDto } from './dto/save-commitment.dto';
import { SaveCenarioDto } from './dto/save-cenario.dto';
import { ListEpicosDto } from './dto/list-epicos.dto';
import { QuarterQueryDto } from './dto/quarter-query.dto';
import { UpdatePlanningCycleDto } from './dto/update-planning-cycle.dto';
import { UpsertSquadDto } from './dto/upsert-squad.dto';
import { CreatePlanningCycleDto } from './dto/create-planning-cycle.dto';
import { ListPlanningCycleDto } from './dto/list-planning-cycle.dto';
import { PlanejamentoAiService } from '@application/planejamento/services/planejamento-ai.service';

class GerarRoadmapDraftDto {
  quarter!: string;
}

@Controller('planejamento')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PlanejamentoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly planejamentoAiService: PlanejamentoAiService,
  ) {}

  @Get('squads')
  async listarSquads(@TenantId() tenantId: string) {
    return this.queryBus.execute(new ListarSquadsQuery(tenantId));
  }

  @Post('squads')
  async criarSquad(@TenantId() tenantId: string, @Body() dto: UpsertSquadDto) {
    const result = await this.commandBus.execute(new SalvarSquadCommand(tenantId, dto));
    return { message: 'Squad criado com sucesso', ...result };
  }

  @Patch('squads/:id')
  async atualizarSquad(
    @TenantId() tenantId: string,
    @Param('id') squadId: string,
    @Body() dto: UpsertSquadDto,
  ) {
    const result = await this.commandBus.execute(
      new SalvarSquadCommand(tenantId, { ...dto, squadId }),
    );
    return { message: 'Squad atualizado com sucesso', ...result };
  }

  @Delete('squads/:id')
  async removerSquad(@TenantId() tenantId: string, @Param('id') squadId: string) {
    await this.commandBus.execute(new RemoverSquadCommand(tenantId, squadId));
    return { message: 'Squad removido com sucesso' };
  }

  @Get('epicos')
  async listarEpicos(@TenantId() tenantId: string, @Query() dto: ListEpicosDto) {
    return this.queryBus.execute(
      new ListarEpicosQuery(tenantId, {
        ...dto,
      }),
    );
  }

  @Post('epicos')
  async upsertEpico(@TenantId() tenantId: string, @Body() dto: UpsertEpicoDto) {
    const result = await this.commandBus.execute(
      new CriarOuAtualizarEpicoCommand(tenantId, {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      }),
    );
    return {
      message: 'Épico salvo com sucesso',
      ...result,
    };
  }

  @Patch('epicos/:id/status')
  async atualizarStatusEpico(
    @TenantId() tenantId: string,
    @Param('id') epicoId: string,
    @Body() dto: UpdateEpicoStatusDto,
  ) {
    await this.commandBus.execute(
      new AtualizarStatusEpicoCommand(
        tenantId,
        epicoId,
        dto.status,
        dto.health,
        dto.progressPercent,
      ),
    );
    return { message: 'Status atualizado com sucesso' };
  }

  @Get('epicos/:id')
  async obterEpicoDetalhe(@TenantId() tenantId: string, @Param('id') epicoId: string) {
    return this.queryBus.execute(new ObterEpicoDetalheQuery(tenantId, epicoId));
  }

  @Post('epicos/:id/sugerir-prioridade')
  async sugerirPrioridadeEpico(@TenantId() tenantId: string, @Param('id') epicoId: string) {
    return this.planejamentoAiService.sugerirPrioridade(tenantId, epicoId);
  }

  @Post('epicos/:id/calcular-health-score')
  async calcularHealthScore(@TenantId() tenantId: string, @Param('id') epicoId: string) {
    return this.planejamentoAiService.calcularHealthScore(tenantId, epicoId);
  }

  @Get('features')
  async listarFeatures(@TenantId() tenantId: string, @Query() dto: ListFeaturesDto) {
    return this.queryBus.execute(
      new ListarFeaturesQuery(tenantId, {
        ...dto,
      }),
    );
  }

  @Get('features/:id')
  async obterFeatureDetalhe(@TenantId() tenantId: string, @Param('id') featureId: string) {
    return this.queryBus.execute(new ObterFeatureDetalheQuery(tenantId, featureId));
  }

  @Post('features/:id/sugerir-dependencias')
  async sugerirDependenciasFeature(@TenantId() tenantId: string, @Param('id') featureId: string) {
    return this.planejamentoAiService.sugerirDependencias(tenantId, featureId);
  }

  @Post('features')
  async upsertFeature(@TenantId() tenantId: string, @Body() dto: UpsertFeatureDto) {
    const result = await this.commandBus.execute(new CriarOuAtualizarFeatureCommand(tenantId, dto));
    return {
      message: 'Feature salva com sucesso',
      ...result,
    };
  }

  @Patch('features/:id/status')
  async atualizarStatusFeature(
    @TenantId() tenantId: string,
    @Param('id') featureId: string,
    @Body() dto: UpdateFeatureStatusDto,
  ) {
    await this.commandBus.execute(
      new AtualizarStatusFeatureCommand(tenantId, featureId, dto.status),
    );
    return { message: 'Status atualizado com sucesso' };
  }

  @Get('dependencias')
  async listarTodasDependencias(@TenantId() tenantId: string, @Query() dto: ListDependenciasDto) {
    return this.queryBus.execute(
      new ListarTodasDependenciasQuery(tenantId, {
        ...dto,
      }),
    );
  }

  @Get('features/:featureId/dependencias')
  async listarDependencias(@TenantId() tenantId: string, @Param('featureId') featureId: string) {
    return this.queryBus.execute(new ListarDependenciasQuery(tenantId, featureId));
  }

  @Post('dependencias')
  async registrarDependencia(@TenantId() tenantId: string, @Body() dto: RegistrarDependenciaDto) {
    await this.commandBus.execute(
      new RegistrarDependenciaCommand(
        tenantId,
        dto.featureBloqueadaId,
        dto.featureBloqueadoraId,
        dto.tipo,
        dto.risco,
        dto.nota,
        dto.dependenciaId,
      ),
    );
    return { message: 'Dependência registrada' };
  }

  @Delete('dependencias/:id')
  async removerDependencia(@TenantId() tenantId: string, @Param('id') dependenciaId: string) {
    await this.commandBus.execute(new RemoverDependenciaCommand(tenantId, dependenciaId));
    return { message: 'Dependência removida com sucesso' };
  }

  @Put('capacidade/:squadId')
  async atualizarCapacidade(
    @TenantId() tenantId: string,
    @Param('squadId') squadId: string,
    @Body() dto: UpdateCapacidadeDto,
  ) {
    await this.commandBus.execute(
      new AtualizarCapacidadeSquadCommand(
        tenantId,
        squadId,
        dto.quarter,
        dto.capacidadeTotal,
        dto.capacidadeUsada,
        dto.bufferPercentual,
        dto.ajustes,
      ),
    );
    return { message: 'Capacidade atualizada' };
  }

  @Get('capacidade')
  async listarCapacidade(@TenantId() tenantId: string, @Query() dto: QuarterQueryDto) {
    return this.queryBus.execute(new ListarCapacidadeQuery(tenantId, dto.quarter));
  }

  @Post('cenarios')
  async salvarCenario(@TenantId() tenantId: string, @Body() dto: SaveCenarioDto) {
    const result = await this.commandBus.execute(new SalvarCenarioCommand(tenantId, dto));
    return {
      message: 'Cenário salvo com sucesso',
      ...result,
    };
  }

  @Post('cenarios/:id/recalcular')
  async recalcularCenario(@TenantId() tenantId: string, @Param('id') cenarioId: string) {
    await this.commandBus.execute(new RecalcularCenarioCommand(tenantId, cenarioId));
    return { message: 'Cenário recalculado' };
  }

  @Get('cenarios')
  async listarCenarios(@TenantId() tenantId: string, @Query() dto: QuarterQueryDto) {
    return this.queryBus.execute(new ListarCenariosQuery(tenantId, dto.quarter));
  }

  @Get('commitments')
  async listarCommitments(@TenantId() tenantId: string, @Query() dto: ListCommitmentsDto) {
    return this.queryBus.execute(
      new ListarCommitmentsQuery(tenantId, {
        ...dto,
      }),
    );
  }

  @Get('commitments/:id')
  async obterCommitmentDetalhe(@TenantId() tenantId: string, @Param('id') commitmentId: string) {
    return this.queryBus.execute(new ObterCommitmentDetalheQuery(tenantId, commitmentId));
  }

  @Post('commitments')
  async salvarCommitment(@TenantId() tenantId: string, @Body() dto: SaveCommitmentDto) {
    await this.commandBus.execute(
      new SalvarCommitmentCommand(
        tenantId,
        dto.produtoId,
        dto.quarter,
        dto.planningCycleId,
        dto.documentoUrl,
        {
          committed: dto.committed,
          targeted: dto.targeted,
          aspirational: dto.aspirational,
        },
        dto.assinaturas,
      ),
    );
    return { message: 'Commitment registrado' };
  }

  @Get('dashboard')
  async obterDashboard(
    @TenantId() tenantId: string,
    @Query() dto: { quarter: string; produtoId?: string },
  ) {
    return this.queryBus.execute(
      new ObterPlanningDashboardQuery(tenantId, dto.quarter, dto.produtoId),
    );
  }

  @Get('timeline')
  async obterTimeline(@TenantId() tenantId: string, @Query() dto: QuarterQueryDto) {
    return this.queryBus.execute(new ObterTimelineQuery(tenantId, dto.quarter));
  }

  @Post('roadmap/gerar-draft')
  async gerarRoadmapDraft(@TenantId() tenantId: string, @Body() dto: GerarRoadmapDraftDto) {
    return this.planejamentoAiService.gerarRoadmapDraft(tenantId, dto.quarter);
  }

  @Get('cycles')
  async listarPlanningCycles(@TenantId() tenantId: string, @Query() dto: ListPlanningCycleDto) {
    return this.queryBus.execute(new ListarPlanningCyclesQuery(tenantId, dto));
  }

  @Post('cycles')
  async criarPlanningCycle(@TenantId() tenantId: string, @Body() dto: CreatePlanningCycleDto) {
    const result = await this.commandBus.execute(new CriarPlanningCycleCommand(tenantId, dto));
    return { message: 'Planning cycle criado', ...result };
  }

  @Get('cycles/:id')
  async obterPlanningCycle(@TenantId() tenantId: string, @Param('id') cycleId: string) {
    return this.queryBus.execute(new ObterPlanningCycleQuery(tenantId, cycleId));
  }

  @Patch('cycles/:id')
  async atualizarPlanningCycle(
    @TenantId() tenantId: string,
    @Param('id') cycleId: string,
    @Body() dto: UpdatePlanningCycleDto,
  ) {
    await this.commandBus.execute(new AtualizarPlanningCycleCommand(tenantId, cycleId, dto));
    return { message: 'Planning cycle atualizado' };
  }

  @Delete('cycles/:id')
  async removerPlanningCycle(@TenantId() tenantId: string, @Param('id') cycleId: string) {
    await this.commandBus.execute(new RemoverPlanningCycleCommand(tenantId, cycleId));
    return { message: 'Planning cycle removido' };
  }
}
