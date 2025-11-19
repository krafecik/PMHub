import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { DuplicatasRepository } from './duplicatas.repository.interface';
import { DuplicatasDemanda } from '@domain/triagem';

@Injectable()
export class PrismaDuplicatasRepository implements DuplicatasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DuplicatasDemanda | null> {
    const data = await this.prisma.duplicatasDemanda.findUnique({
      where: { id: BigInt(id) },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByDemandaAndOriginal(
    demandaId: string,
    demandaOriginalId: string,
  ): Promise<DuplicatasDemanda | null> {
    const data = await this.prisma.duplicatasDemanda.findUnique({
      where: {
        demanda_id_demanda_original_id: {
          demanda_id: BigInt(demandaId),
          demanda_original_id: BigInt(demandaOriginalId),
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByDemanda(demandaId: string): Promise<DuplicatasDemanda[]> {
    const data = await this.prisma.duplicatasDemanda.findMany({
      where: { demanda_id: BigInt(demandaId) },
      orderBy: { created_at: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByDemandaOriginal(demandaOriginalId: string): Promise<DuplicatasDemanda[]> {
    const data = await this.prisma.duplicatasDemanda.findMany({
      where: { demanda_original_id: BigInt(demandaOriginalId) },
      orderBy: { created_at: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async create(duplicata: DuplicatasDemanda): Promise<DuplicatasDemanda> {
    // Buscar tenant_id da triagem (demanda_id referencia TriagemDemanda.id)
    const triagem = await this.prisma.triagemDemanda.findUnique({
      where: { id: BigInt(duplicata.demandaId) },
      select: { tenant_id: true },
    });

    if (!triagem) {
      throw new Error(`TriagemDemanda ${duplicata.demandaId} não encontrada`);
    }

    const data = await this.prisma.duplicatasDemanda.create({
      data: {
        demanda_id: BigInt(duplicata.demandaId),
        demanda_original_id: BigInt(duplicata.demandaOriginalId),
        tenant_id: triagem.tenant_id,
        similaridade: duplicata.similaridade,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.duplicatasDemanda.delete({
      where: { id: BigInt(id) },
    });
  }

  private toDomain(data: any): DuplicatasDemanda {
    return new DuplicatasDemanda({
      id: data.id.toString(),
      demandaId: data.demanda_id.toString(),
      demandaOriginalId: data.demanda_original_id.toString(),
      similaridade: data.similaridade,
      createdAt: data.created_at,
    });
  }
}
