import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { IAnexoRepository, AnexoData, Anexo } from './anexo.repository.interface';

@Injectable()
export class AnexoRepository implements IAnexoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: AnexoData): Promise<string> {
    // Buscar tenant_id da demanda
    const demanda = await this.prisma.demanda.findUnique({
      where: { id: BigInt(data.demandaId) },
      select: { tenant_id: true },
    });

    if (!demanda) {
      throw new Error(`Demanda ${data.demandaId} não encontrada`);
    }

    const created = await this.prisma.anexo.create({
      data: {
        demanda_id: BigInt(data.demandaId),
        tenant_id: demanda.tenant_id,
        arquivo_url: data.arquivoUrl,
        nome: data.nome,
        tipo_mime: data.tipoMime,
        tamanho: BigInt(data.tamanho),
        criado_por_id: BigInt(data.criadoPorId),
      },
    });

    return created.id.toString();
  }

  async findByDemandaId(demandaId: string): Promise<Anexo[]> {
    const anexos = await this.prisma.anexo.findMany({
      where: {
        demanda_id: BigInt(demandaId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return anexos.map((a: any) => ({
      id: a.id.toString(),
      demandaId: a.demanda_id.toString(),
      arquivoUrl: a.arquivo_url,
      nome: a.nome,
      tipoMime: a.tipo_mime,
      tamanho: Number(a.tamanho),
      criadoPorId: a.criado_por_id.toString(),
      createdAt: a.created_at,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.anexo.delete({
      where: { id: BigInt(id) },
    });
  }
}
