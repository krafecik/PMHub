import { ICommand } from '@nestjs/cqrs';

export class AdicionarEntrevistaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly pesquisaId: string,
    public readonly participanteNome: string,
    public readonly dataHora: Date,
    public readonly participantePerfil?: string,
    public readonly participanteEmail?: string,
    public readonly transcricao?: string,
    public readonly notas?: string,
    public readonly gravacaoUrl?: string,
    public readonly tags: string[] = [],
    public readonly duracaoMinutos?: number,
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Entrevista } from '../../../domain/discovery/entities';
import { IEntrevistaRepository, IPesquisaRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  PesquisaId,
  StatusPesquisaVO,
  StatusPesquisaEnum,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(AdicionarEntrevistaCommand)
export class AdicionarEntrevistaHandler implements ICommandHandler<AdicionarEntrevistaCommand> {
  private readonly logger = new Logger(AdicionarEntrevistaHandler.name);

  constructor(
    @Inject('IEntrevistaRepository')
    private readonly entrevistaRepository: IEntrevistaRepository,
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AdicionarEntrevistaCommand): Promise<string> {
    const {
      tenantId,
      pesquisaId,
      participanteNome,
      participantePerfil,
      participanteEmail,
      dataHora,
      transcricao,
      notas,
      gravacaoUrl,
      tags,
      duracaoMinutos,
    } = command;

    // Validate that pesquisa exists
    const pesquisa = await this.pesquisaRepository.findById(
      new TenantId(tenantId),
      new PesquisaId(pesquisaId),
    );

    if (!pesquisa) {
      throw new NotFoundException('Pesquisa não encontrada');
    }

    // Check if pesquisa can add entrevistas
    if (!pesquisa.canAddEntrevista()) {
      throw new Error('Pesquisa precisa estar em andamento para adicionar entrevistas');
    }

    // Create entrevista
    const entrevista = Entrevista.create({
      tenantId: new TenantId(tenantId),
      pesquisaId: new PesquisaId(pesquisaId),
      participanteNome,
      participantePerfil,
      participanteEmail,
      dataHora,
      transcricao,
      notas,
      gravacaoUrl,
      tags,
      duracaoMinutos,
    });

    // Save entrevista
    const savedEntrevista = await this.entrevistaRepository.save(entrevista);
    const entrevistaId = savedEntrevista.id?.getValue() ?? '';

    const entrevistaRealizada = savedEntrevista.isRealizada() && !!transcricao;
    if (entrevistaRealizada) {
      const atingiuMeta = pesquisa.incrementarParticipanteConcluido();

      if (atingiuMeta) {
        const statusConcluidaItem = await this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.STATUS_PESQUISA,
          slug: StatusPesquisaVO.enumToSlug(StatusPesquisaEnum.CONCLUIDA),
        });

        pesquisa.concluir(StatusPesquisaVO.fromCatalogItem(statusConcluidaItem));
      }

      await this.pesquisaRepository.update(pesquisa);
    }

    this.logger.log(`Entrevista criada com ID: ${entrevistaId} para Pesquisa: ${pesquisaId}`);

    return entrevistaId;
  }
}
