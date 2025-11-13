import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CriarDemandaRapidaCommand } from './criar-demanda-rapida.command';
import { 
  Demanda,
  DemandaCriadaEvent,
  TituloVO,
  TipoDemandaVO,
  OrigemDemandaVO,
  OrigemDemanda,
  PrioridadeVO,
} from '@domain/demandas';
import { IDemandaRepository, DEMANDA_REPOSITORY_TOKEN } from '@infra/repositories/demandas/demanda.repository.interface';

@CommandHandler(CriarDemandaRapidaCommand)
export class CriarDemandaRapidaHandler implements ICommandHandler<CriarDemandaRapidaCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CriarDemandaRapidaCommand): Promise<string> {
    const {
      tenantId,
      titulo,
      tipo,
      produtoId,
      criadoPorId,
      descricao,
      origem,
      origemDetalhe,
    } = command;

    // Criar value objects
    const tituloVO = TituloVO.create(titulo);
    const tipoVO = TipoDemandaVO.create(tipo);
    const origemVO = origem 
      ? OrigemDemandaVO.create(origem) 
      : OrigemDemandaVO.fromEnum(OrigemDemanda.INTERNO);
    const prioridadeVO = PrioridadeVO.default();

    // Criar entidade
    const demanda = Demanda.create({
      tenantId,
      titulo: tituloVO,
      descricao,
      tipo: tipoVO,
      produtoId,
      origem: origemVO,
      origemDetalhe,
      prioridade: prioridadeVO,
      criadoPorId,
    });

    // Persistir
    const demandaId = await this.demandaRepository.save(demanda);

    // Emitir evento
    this.eventBus.publish(
      new DemandaCriadaEvent(
        demandaId,
        tenantId,
        titulo,
        tipo,
        produtoId,
        origemVO.getValue(),
        criadoPorId,
        prioridadeVO.getValue(),
      ),
    );

    return demandaId;
  }
}
