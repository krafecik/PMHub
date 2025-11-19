import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoverTagCommand } from './remover-tag.command';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';

@CommandHandler(RemoverTagCommand)
export class RemoverTagHandler implements ICommandHandler<RemoverTagCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: RemoverTagCommand): Promise<void> {
    const { tenantId, demandaId, tagId } = command;

    // Verificar se a demanda existe
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Remover a tag da demanda
    await this.prisma.demandaTag.deleteMany({
      where: {
        demanda_id: BigInt(demandaId),
        tag_id: BigInt(tagId),
      },
    });
  }
}
