import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AdicionarAnexoCommand } from './adicionar-anexo.command';
import { StorageService } from '@infra/storage/storage.service';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  IAnexoRepository,
  ANEXO_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/anexo.repository.interface';

export interface AnexoCriado {
  id: string;
  arquivoUrl: string;
  nome: string;
  tamanho: number;
  tipoMime: string;
}

@CommandHandler(AdicionarAnexoCommand)
export class AdicionarAnexoHandler implements ICommandHandler<AdicionarAnexoCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(ANEXO_REPOSITORY_TOKEN)
    private readonly anexoRepository: IAnexoRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: AdicionarAnexoCommand): Promise<AnexoCriado> {
    const { tenantId, demandaId, arquivo, usuarioId } = command;

    // Verificar se a demanda existe
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Fazer upload do arquivo
    const uploadResult = await this.storageService.uploadFile(arquivo, tenantId, usuarioId);

    // Salvar referência no banco
    const anexoId = await this.anexoRepository.save({
      demandaId,
      arquivoUrl: uploadResult.url,
      nome: uploadResult.filename,
      tipoMime: uploadResult.mimeType,
      tamanho: uploadResult.size,
      criadoPorId: usuarioId,
    });

    return {
      id: anexoId,
      arquivoUrl: uploadResult.url,
      nome: uploadResult.filename,
      tamanho: uploadResult.size,
      tipoMime: uploadResult.mimeType,
    };
  }
}
