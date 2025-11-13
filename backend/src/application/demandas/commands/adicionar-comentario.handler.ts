import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AdicionarComentarioCommand } from './adicionar-comentario.command';
import { Comentario } from '@domain/demandas';
import { IDemandaRepository, DEMANDA_REPOSITORY_TOKEN } from '@infra/repositories/demandas/demanda.repository.interface';
import { IComentarioRepository, COMENTARIO_REPOSITORY_TOKEN } from '@infra/repositories/demandas/comentario.repository.interface';
import { NotFoundException } from '@nestjs/common';

@CommandHandler(AdicionarComentarioCommand)
export class AdicionarComentarioHandler implements ICommandHandler<AdicionarComentarioCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(COMENTARIO_REPOSITORY_TOKEN)
    private readonly comentarioRepository: IComentarioRepository,
  ) {}

  async execute(command: AdicionarComentarioCommand): Promise<string> {
    const { tenantId, demandaId, usuarioId, texto } = command;

    // Verificar se a demanda existe
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Criar comentário
    const comentario = Comentario.create({
      demandaId,
      usuarioId,
      texto,
    });

    // Persistir
    const comentarioId = await this.comentarioRepository.save(comentario);

    return comentarioId;
  }
}
