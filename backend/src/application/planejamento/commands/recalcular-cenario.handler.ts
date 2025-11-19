import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoCenarioRepository,
  PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
  IPlanejamentoCapacityRepository,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  IPlanejamentoFeatureRepository,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { RecalcularCenarioCommand } from './recalcular-cenario.command';
import { PlanejamentoInsightService } from '@application/planejamento/services/planejamento-insight.service';

@CommandHandler(RecalcularCenarioCommand)
@Injectable()
export class RecalcularCenarioHandler implements ICommandHandler<RecalcularCenarioCommand> {
  constructor(
    @Inject(PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN)
    private readonly cenarioRepository: IPlanejamentoCenarioRepository,
    @Inject(PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN)
    private readonly capacityRepository: IPlanejamentoCapacityRepository,
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
    private readonly insightService: PlanejamentoInsightService,
  ) {}

  async execute(command: RecalcularCenarioCommand): Promise<void> {
    const { cenarioId, tenantId } = command;
    const cenario = await this.cenarioRepository.findById(cenarioId, tenantId);

    if (!cenario) {
      throw new Error('Cenário não encontrado');
    }

    const quarter = cenario.toObject().quarter.getValue();
    const [capacity, epicosResult] = await Promise.all([
      this.capacityRepository.listByQuarter(tenantId, quarter),
      this.epicoRepository.list({ tenantId, quarter, pageSize: 500, page: 1 }),
    ]);

    const ajustesMap = new Map<string, number>();
    cenario.toObject().ajustesCapacidade.forEach((ajuste) => {
      ajustesMap.set(ajuste.squadId, ajuste.deltaPercentual);
    });

    const capacityBySquad = new Map<string, number>();
    capacity.forEach((snapshot) => {
      const ajustePercent = ajustesMap.get(snapshot.toObject().squadId) ?? 0;
      const base = snapshot.toObject().capacidadeTotal;
      const ajuste = base * (ajustePercent / 100);
      const contractorsBoost = cenario.toObject().incluirContractors ? base * 0.15 : 0;
      const bufferPenalty =
        cenario.toObject().bufferRiscoPercentual > 0
          ? base * (cenario.toObject().bufferRiscoPercentual / 100)
          : 0;
      capacityBySquad.set(
        snapshot.toObject().squadId,
        base + ajuste + contractorsBoost - bufferPenalty,
      );
    });

    const cabem: string[] = [];
    const atrasados: string[] = [];

    for (const epico of epicosResult.data) {
      const epicoObj = epico.toObject();
      if (!epicoObj.squadId) {
        atrasados.push(epicoObj.id!);
        continue;
      }
      const squadCapacity = capacityBySquad.get(epicoObj.squadId);
      if (!squadCapacity) {
        atrasados.push(epicoObj.id!);
        continue;
      }
      const features = await this.featureRepository.listByEpico(epicoObj.id!, tenantId);
      const carga = features.reduce((acc, feature) => acc + (feature.toObject().pontos ?? 0), 0);
      if (carga <= squadCapacity) {
        cabem.push(epicoObj.id!);
      } else {
        atrasados.push(epicoObj.id!);
      }
    }

    const comentarios = this.insightService.buildScenarioComments(
      cabem,
      atrasados,
      capacityBySquad,
    );

    cenario.registrarResultado({
      cabemEpicos: cabem,
      atrasadosEpicos: atrasados,
      comentarios,
    });

    await this.cenarioRepository.save(cenario);
  }
}
