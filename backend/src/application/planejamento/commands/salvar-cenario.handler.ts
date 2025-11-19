import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CenarioSimulado, CenarioStatusVO, QuarterVO } from '@domain/planejamento';
import {
  IPlanejamentoCenarioRepository,
  PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { SalvarCenarioCommand } from './salvar-cenario.command';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(SalvarCenarioCommand)
@Injectable()
export class SalvarCenarioHandler implements ICommandHandler<SalvarCenarioCommand> {
  constructor(
    @Inject(PLANEJAMENTO_CENARIO_REPOSITORY_TOKEN)
    private readonly cenarioRepository: IPlanejamentoCenarioRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: SalvarCenarioCommand): Promise<{ cenarioId: string }> {
    const { tenantId, payload } = command;

    let cenario: CenarioSimulado | null = null;

    if (payload.cenarioId) {
      cenario = await this.cenarioRepository.findById(payload.cenarioId, tenantId);
    }

    if (!cenario) {
      const statusInicial = await this.resolveStatus(tenantId, payload.statusSlug);
      cenario = CenarioSimulado.create({
        tenantId,
        planningCycleId: payload.planningCycleId,
        quarter: QuarterVO.create(payload.quarter),
        nome: payload.nome,
        descricao: payload.descricao,
        ajustesCapacidade: payload.ajustesCapacidade,
        incluirContractors: payload.incluirContractors ?? false,
        considerarFerias: payload.considerarFerias ?? false,
        bufferRiscoPercentual: payload.bufferRiscoPercentual ?? 0,
        status: statusInicial,
      });
    } else {
      cenario.atualizarAjustes(payload.ajustesCapacidade ?? cenario.toObject().ajustesCapacidade);
      cenario.atualizarParametros({
        incluirContractors: payload.incluirContractors,
        considerarFerias: payload.considerarFerias,
        bufferRiscoPercentual: payload.bufferRiscoPercentual,
      });
      if (payload.statusSlug) {
        const novoStatus = await this.resolveStatus(tenantId, payload.statusSlug);
        cenario.definirStatus(novoStatus);
      }
    }

    const cenarioId = await this.cenarioRepository.save(cenario);

    return { cenarioId };
  }

  private async resolveStatus(tenantId: string, statusSlug?: string): Promise<CenarioStatusVO> {
    const normalizedSlug = statusSlug ? statusSlug.toLowerCase() : undefined;

    const item = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANEJAMENTO_CENARIO_STATUS,
      slug: normalizedSlug ?? CatalogDefaultSlugs.PLANEJAMENTO_CENARIO_DRAFT,
      legacyValue: statusSlug ? statusSlug.toUpperCase() : undefined,
    });

    return CenarioStatusVO.fromCatalogItem(item);
  }
}
