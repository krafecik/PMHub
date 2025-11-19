import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoSquadRepository,
  PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { Squad, SquadStatusVO } from '@domain/planejamento';
import { SalvarSquadCommand } from './salvar-squad.command';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@CommandHandler(SalvarSquadCommand)
@Injectable()
export class SalvarSquadHandler implements ICommandHandler<SalvarSquadCommand> {
  constructor(
    @Inject(PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN)
    private readonly squadRepository: IPlanejamentoSquadRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: SalvarSquadCommand): Promise<{ squadId: string }> {
    const { tenantId, payload } = command;

    if (payload.squadId) {
      const existing = await this.squadRepository.findById(payload.squadId, tenantId);
      if (!existing) {
        throw new NotFoundException('Squad não encontrado');
      }
      existing.atualizarDados({
        nome: payload.nome,
        descricao: payload.descricao,
        corToken: payload.corToken,
        timezone: payload.timezone,
        capacidadePadrao: payload.capacidadePadrao,
      });
      if (payload.status) {
        const status = await this.resolveStatus(tenantId, payload.status);
        existing.alterarStatus(status);
      }
      const squadId = await this.squadRepository.save(existing);
      return { squadId };
    }

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.nome);
    if (!slug) {
      throw new Error('Slug inválido');
    }

    const status = await this.resolveStatus(tenantId, payload.status);

    const squad = Squad.create({
      tenantId,
      nome: payload.nome,
      slug,
      produtoId: payload.produtoId,
      descricao: payload.descricao,
      corToken: payload.corToken,
      timezone: payload.timezone,
      capacidadePadrao: payload.capacidadePadrao,
      status,
    });

    const squadId = await this.squadRepository.save(squad);
    return { squadId };
  }

  private async resolveStatus(tenantId: string, status?: string): Promise<SquadStatusVO> {
    const normalizedSlug = status && /^[a-z0-9-]+$/.test(status) ? status : undefined;

    const item = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANEJAMENTO_SQUAD_STATUS,
      slug: normalizedSlug ?? (status ? undefined : CatalogDefaultSlugs.PLANEJAMENTO_SQUAD_ATIVO),
      legacyValue: status,
    });

    return SquadStatusVO.fromCatalogItem(item);
  }
}
