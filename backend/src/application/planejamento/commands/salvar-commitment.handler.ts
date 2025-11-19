import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Commitment, CommitmentItem, CommitmentTierVO, QuarterVO } from '@domain/planejamento';
import {
  IPlanejamentoCommitmentRepository,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { SalvarCommitmentCommand } from './salvar-commitment.command';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

type CommitmentTierKeys = 'committed' | 'targeted' | 'aspirational';

interface CommitmentTierSet {
  committed: CommitmentTierVO;
  targeted: CommitmentTierVO;
  aspirational: CommitmentTierVO;
}

@CommandHandler(SalvarCommitmentCommand)
@Injectable()
export class SalvarCommitmentHandler implements ICommandHandler<SalvarCommitmentCommand> {
  constructor(
    @Inject(PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN)
    private readonly commitmentRepository: IPlanejamentoCommitmentRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: SalvarCommitmentCommand): Promise<void> {
    const { tenantId, produtoId, planningCycleId, quarter, documentoUrl, itens, assinaturas } =
      command;

    const tiers = await this.resolveTiers(tenantId);

    const commitment =
      (await this.commitmentRepository.findByQuarter(tenantId, produtoId, quarter)) ??
      Commitment.create({
        tenantId,
        produtoId,
        planningCycleId,
        quarter: QuarterVO.create(quarter),
        tiers,
      });

    this.sincronizarTiers(commitment, tiers, itens);

    if (documentoUrl !== undefined) {
      commitment.definirDocumento(documentoUrl);
    }

    if (assinaturas) {
      assinaturas.forEach((assinatura) =>
        commitment.registrarAssinatura(assinatura.papel, assinatura.usuarioId),
      );
    }

    await this.commitmentRepository.save(commitment);
  }

  private async resolveTiers(tenantId: string): Promise<CommitmentTierSet> {
    const committed = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER,
      slug: CatalogDefaultSlugs.PLANEJAMENTO_COMMITMENT_COMMITTED,
      legacyValue: 'COMMITTED',
    });

    const targeted = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER,
      slug: CatalogDefaultSlugs.PLANEJAMENTO_COMMITMENT_TARGETED,
      legacyValue: 'TARGETED',
    });

    const aspirational = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER,
      slug: CatalogDefaultSlugs.PLANEJAMENTO_COMMITMENT_ASPIRATIONAL,
      legacyValue: 'ASPIRATIONAL',
    });

    return {
      committed: CommitmentTierVO.fromCatalogItem(committed),
      targeted: CommitmentTierVO.fromCatalogItem(targeted),
      aspirational: CommitmentTierVO.fromCatalogItem(aspirational),
    };
  }

  private sincronizarTiers(
    commitment: Commitment,
    tiers: CommitmentTierSet,
    itens?: {
      committed?: CommitmentItem[];
      targeted?: CommitmentItem[];
      aspirational?: CommitmentItem[];
    },
  ): void {
    const currentItems = commitment.getItens();

    (['committed', 'targeted', 'aspirational'] as CommitmentTierKeys[]).forEach((key) => {
      const tier = tiers[key];
      const items = itens?.[key] ?? currentItems[key];
      commitment.definirItens(tier, items ?? []);
    });
  }
}
