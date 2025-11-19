import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { AdicionarTagCommand } from './adicionar-tag.command';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';

@CommandHandler(AdicionarTagCommand)
export class AdicionarTagHandler implements ICommandHandler<AdicionarTagCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: AdicionarTagCommand): Promise<void> {
    const { tenantId, demandaId, tagNome } = command;

    // Verificar se a demanda existe
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Buscar ou criar a tag
    let tag = await this.prisma.tag.findFirst({
      where: {
        tenant_id: BigInt(tenantId),
        nome: tagNome.trim(),
      },
    });

    if (!tag) {
      tag = await this.prisma.tag.create({
        data: {
          tenant_id: BigInt(tenantId),
          nome: tagNome.trim(),
        },
      });
    }

    // Verificar se a tag já está associada à demanda
    const demandaTag = await this.prisma.demandaTag.findFirst({
      where: {
        demanda_id: BigInt(demandaId),
        tag_id: tag.id,
      },
    });

    if (demandaTag) {
      throw new ConflictException('Tag já está associada a esta demanda');
    }

    // Adicionar a tag à demanda
    await this.prisma.demandaTag.create({
      data: {
        demanda_id: BigInt(demandaId),
        tag_id: tag.id,
        tenant_id: BigInt(tenantId),
      },
    });
  }
}
