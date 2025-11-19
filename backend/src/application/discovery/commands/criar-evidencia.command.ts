import { ICommand } from '@nestjs/cqrs';

export class CriarEvidenciaCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly hipoteseId: string | undefined,
    public readonly tipo: string,
    public readonly titulo: string,
    public readonly descricao: string,
    public readonly arquivoUrl?: string,
    public readonly tags: string[] = [],
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Evidencia } from '../../../domain/discovery/entities';
import { IEvidenciaRepository, IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  DiscoveryId,
  HipoteseId,
  TipoEvidenciaVO,
  TipoEvidenciaEnum,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';

@CommandHandler(CriarEvidenciaCommand)
export class CriarEvidenciaHandler implements ICommandHandler<CriarEvidenciaCommand> {
  private readonly logger = new Logger(CriarEvidenciaHandler.name);

  constructor(
    @Inject('IEvidenciaRepository')
    private readonly evidenciaRepository: IEvidenciaRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CriarEvidenciaCommand): Promise<string> {
    const { tenantId, discoveryId, hipoteseId, tipo, titulo, descricao, arquivoUrl, tags } =
      command;

    // Validate that discovery exists and is active
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    if (!discovery.isActive()) {
      throw new Error('Discovery não está ativo');
    }

    // Create evidencia
    const evidencia = Evidencia.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      hipoteseId: hipoteseId ? new HipoteseId(hipoteseId) : undefined,
      tipo: new TipoEvidenciaVO(tipo as TipoEvidenciaEnum),
      titulo,
      descricao,
      arquivoUrl,
      tags,
    });

    // Save evidencia
    const savedEvidencia = await this.evidenciaRepository.save(evidencia);
    const evidenciaId = savedEvidencia.id?.getValue() ?? '';

    this.logger.log(`Evidência criada com ID: ${evidenciaId} para Discovery: ${discoveryId}`);

    return evidenciaId;
  }
}
