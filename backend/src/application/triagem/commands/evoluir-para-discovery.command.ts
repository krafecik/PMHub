import { ICommand, ICommandHandler, CommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import { StatusTriagemEnum } from '@domain/triagem';
import { DemandaEvoluiuParaDiscoveryEvent } from '../events/demanda-evoluiu-para-discovery.event';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';
import { StatusDemandaVO } from '@domain/demandas';
import {
  ANEXO_REPOSITORY_TOKEN,
  IAnexoRepository,
} from '@infra/repositories/demandas/anexo.repository.interface';
import { CatalogItemVO } from '@domain/shared/value-objects/catalog-item.vo';
import { TriagemAutomacaoService } from '../services/triagem-automacao.service';

export class EvoluirParaDiscoveryCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
    public readonly usuarioId: string,
  ) {}
}

@CommandHandler(EvoluirParaDiscoveryCommand)
export class EvoluirParaDiscoveryHandler implements ICommandHandler<EvoluirParaDiscoveryCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
    @Inject(ANEXO_REPOSITORY_TOKEN)
    private readonly anexoRepository: IAnexoRepository,
    private readonly automacaoService: TriagemAutomacaoService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EvoluirParaDiscoveryCommand): Promise<{ discoveryId: string }> {
    const { tenantId, demandaId, usuarioId } = command;

    // Buscar demanda
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new Error('Demanda não encontrada');
    }

    // Buscar triagem
    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (!triagem) {
      throw new Error('Triagem não encontrada para esta demanda');
    }

    const validationIssues: Array<{
      field: string;
      issue: string;
      meta?: Record<string, unknown>;
    }> = [];

    if (!triagem.impacto) {
      validationIssues.push({
        field: 'impacto',
        issue: 'Impacto é obrigatório antes de enviar ao Discovery.',
      });
    }

    if (!triagem.urgencia) {
      validationIssues.push({
        field: 'urgencia',
        issue: 'Urgência é obrigatória antes de enviar ao Discovery.',
      });
    }

    if (!triagem.complexidadeEstimada) {
      validationIssues.push({
        field: 'complexidade',
        issue: 'Complexidade estimada é obrigatória antes de enviar ao Discovery.',
      });
    }

    const checklistPendentes = triagem.getChecklistPendentes();
    if (checklistPendentes.length > 0) {
      checklistPendentes.forEach((item) => {
        validationIssues.push({
          field: `checklist.${item.id}`,
          issue: `Item obrigatório de checklist pendente: ${item.label}`,
        });
      });
    }

    const [impactoItem, , complexidadeItem] = await Promise.all([
      this.getCatalogItemByValue(
        tenantId,
        CatalogCategorySlugs.IMPACTO_NIVEL,
        triagem.impacto?.value,
      ),
      this.getCatalogItemByValue(
        tenantId,
        CatalogCategorySlugs.URGENCIA_NIVEL,
        triagem.urgencia?.value,
      ),
      this.getCatalogItemByValue(
        tenantId,
        CatalogCategorySlugs.COMPLEXIDADE_NIVEL,
        triagem.complexidadeEstimada?.value,
      ),
    ]);

    const requireEvidence =
      this.getMetadataBoolean(impactoItem?.metadata, 'requireEvidence') ||
      this.getMetadataBoolean(complexidadeItem?.metadata, 'requireEvidence');

    if (requireEvidence) {
      const anexos = await this.anexoRepository.findByDemandaId(demandaId);
      if (anexos.length === 0) {
        validationIssues.push({
          field: 'anexos',
          issue:
            'Demandas com este nível de impacto/complexidade exigem anexar evidências antes do envio ao Discovery.',
        });
      }
    }

    if (validationIssues.length > 0) {
      throw new BadRequestException({
        code: 'triagem_incompleta',
        message: 'Triagem não atende aos requisitos mínimos para evoluir ao Discovery.',
        details: validationIssues,
      });
    }

    // Validar status - aceitar se já estiver PRONTO_DISCOVERY (caso tenha sido atualizado antes)
    const statusAtual = triagem.statusTriagem.value as StatusTriagemEnum;
    const statusPermitidos = [
      StatusTriagemEnum.PENDENTE_TRIAGEM,
      StatusTriagemEnum.RETOMADO_TRIAGEM,
      StatusTriagemEnum.PRONTO_DISCOVERY, // Aceitar se já foi atualizado
    ];

    if (!statusPermitidos.includes(statusAtual)) {
      throw new Error(`Status inválido para evoluir: ${statusAtual}`);
    }

    let triagemAlterada = false;
    let demandaAlterada = false;

    // Atualizar status da triagem apenas se ainda não estiver PRONTO_DISCOVERY
    if (statusAtual !== StatusTriagemEnum.PRONTO_DISCOVERY) {
      triagem.atualizarStatus(StatusTriagemEnum.PRONTO_DISCOVERY, usuarioId);
      triagemAlterada = true;
    }

    const statusTriagemItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_DEMANDA,
      slug: CatalogDefaultSlugs.STATUS_DEMANDA_TRIAGEM,
    });
    demanda.marcarParaTriagem(StatusDemandaVO.fromCatalogItem(statusTriagemItem));
    demandaAlterada = true;

    const automacao = await this.automacaoService.executar(tenantId, demanda, triagem, usuarioId);
    if (automacao.triagemAlterada) {
      triagemAlterada = true;
    }
    if (automacao.demandaAlterada) {
      demandaAlterada = true;
    }

    if (triagemAlterada) {
      await this.triagemRepository.update(triagem);
    }

    if (demandaAlterada) {
      await this.demandaRepository.update(demanda);
    }

    // Gerar ID temporário para o Discovery (será substituído quando o módulo for implementado)
    const discoveryId = `DISC-${demandaId}-${Date.now()}`;

    // Emitir evento
    this.eventBus.publish(
      new DemandaEvoluiuParaDiscoveryEvent(
        demandaId,
        tenantId,
        discoveryId,
        {
          titulo: demanda.titulo.getValue(),
          descricao: demanda.descricao,
          tipo: demanda.tipo.slug,
          origem: demanda.origem.slug,
          produtoId: demanda.produtoId,
          impacto: triagem.impacto!.value,
          urgencia: triagem.urgencia!.value,
          complexidade: triagem.complexidadeEstimada!.value,
        },
        usuarioId,
      ),
    );

    return { discoveryId };
  }

  private async getCatalogItemByValue(
    tenantId: string,
    categorySlug: string,
    value?: string,
  ): Promise<CatalogItemVO | null> {
    if (!value) {
      return null;
    }

    const normalizedValue = value.trim();
    const items = await this.catalogoRepository.listItemsByCategory(tenantId, categorySlug);

    const bySlug = items.find((item) => item.slug === this.toSlug(normalizedValue));
    if (bySlug) {
      return bySlug;
    }

    const normalizedLegacy = normalizedValue.toUpperCase();
    return (
      items.find((item) => {
        const legacy = (item.metadata?.legacyValue as string | undefined)?.toUpperCase();
        return legacy === normalizedLegacy;
      }) ?? null
    );
  }

  private getMetadataBoolean(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
  ): boolean {
    if (!metadata) {
      return false;
    }
    const value = metadata[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['true', '1', 'yes', 'sim'].includes(normalized);
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    return false;
  }

  private toSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
