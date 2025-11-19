import { CommitmentTierVO, QuarterVO } from '../value-objects';

export interface CommitmentItem {
  epicoId: string;
  titulo: string;
  squadId?: string;
  confianca?: string;
}

export interface CommitmentTierBuckets {
  committed: CommitmentTierVO;
  targeted: CommitmentTierVO;
  aspirational: CommitmentTierVO;
}

export interface CommitmentItemsBuckets {
  committed: CommitmentItem[];
  targeted: CommitmentItem[];
  aspirational: CommitmentItem[];
}

export interface CommitmentProps {
  id?: string;
  tenantId: string;
  produtoId: string;
  planningCycleId?: string | null;
  quarter: QuarterVO;
  tiers: CommitmentTierBuckets;
  itens: CommitmentItemsBuckets;
  assinaturas: { papel: string; usuarioId: string; assinadoEm: Date }[];
  documentoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CommitmentTierKey = keyof CommitmentTierBuckets;

function cloneItems(items: CommitmentItemsBuckets): CommitmentItemsBuckets {
  return {
    committed: [...items.committed],
    targeted: [...items.targeted],
    aspirational: [...items.aspirational],
  };
}

function emptyItems(): CommitmentItemsBuckets {
  return {
    committed: [],
    targeted: [],
    aspirational: [],
  };
}

export class Commitment {
  private props: CommitmentProps;

  private constructor(props: CommitmentProps) {
    this.props = props;
  }

  static create(
    props: Omit<CommitmentProps, 'id' | 'itens' | 'assinaturas' | 'createdAt' | 'updatedAt'>,
  ): Commitment {
    return new Commitment({
      ...props,
      itens: emptyItems(),
      assinaturas: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: CommitmentProps): Commitment {
    return new Commitment({
      ...props,
      tiers: {
        committed: props.tiers.committed,
        targeted: props.tiers.targeted,
        aspirational: props.tiers.aspirational,
      },
      itens: cloneItems(props.itens),
      assinaturas: [...props.assinaturas],
    });
  }

  definirItens(tier: CommitmentTierVO, itens: CommitmentItem[]): void {
    const key = this.getBucketKey(tier);
    this.props.tiers[key] = tier;
    this.props.itens[key] = [...itens];
    this.touch();
  }

  removerItem(tier: CommitmentTierVO, epicoId: string): void {
    const key = this.getBucketKey(tier);
    this.props.itens[key] = this.props.itens[key].filter((item) => item.epicoId !== epicoId);
    this.touch();
  }

  registrarAssinatura(papel: string, usuarioId: string): void {
    this.props.assinaturas = [
      ...this.props.assinaturas.filter((assinatura) => assinatura.usuarioId !== usuarioId),
      { papel, usuarioId, assinadoEm: new Date() },
    ];
    this.touch();
  }

  definirDocumento(url?: string): void {
    this.props.documentoUrl = url;
    this.touch();
  }

  getQuarter(): QuarterVO {
    return this.props.quarter;
  }

  getItens(): CommitmentItemsBuckets {
    return cloneItems(this.props.itens);
  }

  getTiers(): CommitmentTierBuckets {
    return {
      committed: this.props.tiers.committed,
      targeted: this.props.tiers.targeted,
      aspirational: this.props.tiers.aspirational,
    };
  }

  toPersistence(): CommitmentProps {
    return {
      ...this.props,
      itens: cloneItems(this.props.itens),
      assinaturas: [...this.props.assinaturas],
    };
  }

  toResponse(): Record<string, unknown> {
    const tiers = [
      this.serializeTier('committed', this.props.tiers.committed, this.props.itens.committed),
      this.serializeTier('targeted', this.props.tiers.targeted, this.props.itens.targeted),
      this.serializeTier(
        'aspirational',
        this.props.tiers.aspirational,
        this.props.itens.aspirational,
      ),
    ];

    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      produtoId: this.props.produtoId,
      planningCycleId: this.props.planningCycleId,
      quarter: this.props.quarter.getValue(),
      documentoUrl: this.props.documentoUrl,
      assinaturas: this.props.assinaturas.map((assinatura) => ({
        ...assinatura,
        assinadoEm: assinatura.assinadoEm.toISOString(),
      })),
      tiers,
      itens: cloneItems(this.props.itens),
      committed: [...this.props.itens.committed],
      targeted: [...this.props.itens.targeted],
      aspirational: [...this.props.itens.aspirational],
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private serializeTier(
    key: CommitmentTierKey,
    tier: CommitmentTierVO,
    itens: CommitmentItem[],
  ): Record<string, unknown> {
    return {
      key,
      id: tier.id,
      slug: tier.slug,
      label: tier.label,
      metadata: tier.metadata ?? null,
      itens: [...itens],
    };
  }

  private getBucketKey(tier: CommitmentTierVO): CommitmentTierKey {
    if (tier.equals(this.props.tiers.committed)) return 'committed';
    if (tier.equals(this.props.tiers.targeted)) return 'targeted';
    if (tier.equals(this.props.tiers.aspirational)) return 'aspirational';
    throw new Error(`Tier de commitment desconhecido: ${tier.slug}`);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
