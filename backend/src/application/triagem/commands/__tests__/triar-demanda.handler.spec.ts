import { EventBus } from '@nestjs/cqrs';
import { TriarDemandaHandler } from '../triar-demanda.handler';
import { TriarDemandaCommand } from '../triar-demanda.command';
import { TriagemRepository } from '@infra/repositories/triagem/triagem.repository.interface';
import { IDemandaRepository } from '@infra/repositories/demandas/demanda.repository.interface';
import { ICatalogoRepository } from '@domain/catalog/catalog.repository.interface';
import { TriagemAutomacaoService } from '../../services/triagem-automacao.service';
import { buildDemanda, createStatusDemanda } from '../../../../../test/fixtures';
import { TriagemDemanda, StatusTriagemEnum } from '@domain/triagem';
import { StatusDemandaVO } from '@domain/demandas';

const createHandler = () => {
  const triagemRepository: jest.Mocked<TriagemRepository> = {
    findByDemandaId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  } as any;

  const demandaRepository: jest.Mocked<IDemandaRepository> = {
    findById: jest.fn(),
    update: jest.fn(),
  } as any;

  const catalogoRepository: jest.Mocked<ICatalogoRepository> = {
    getRequiredItem: jest.fn(),
  } as any;

  const automacaoService: jest.Mocked<TriagemAutomacaoService> = {
    executar: jest.fn(),
  } as any;

  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
  } as any;

  const handler = new TriarDemandaHandler(
    triagemRepository,
    demandaRepository,
    catalogoRepository,
    automacaoService,
    eventBus,
  );

  return { handler, triagemRepository, demandaRepository, catalogoRepository, automacaoService, eventBus };
};

describe('TriarDemandaHandler', () => {
  const tenantId = 'tenant-1';
  const demandaId = 'demanda-1';

  it('cria triagem inexistente, atualiza status e sincroniza demanda', async () => {
    const {
      handler,
      triagemRepository,
      demandaRepository,
      catalogoRepository,
      automacaoService,
      eventBus,
    } = createHandler();

    const demanda = buildDemanda();
    demandaRepository.findById.mockResolvedValue(demanda);
    triagemRepository.findByDemandaId.mockResolvedValue(undefined);

    const triagemNova = TriagemDemanda.criarNova(demandaId);
    triagemRepository.create.mockResolvedValue(triagemNova);
    automacaoService.executar.mockResolvedValue({ triagemAlterada: false, demandaAlterada: false });

    catalogoRepository.getRequiredItem.mockResolvedValue(createStatusDemanda('triagem'));

    await handler.execute(
      new TriarDemandaCommand(
        tenantId,
        demandaId,
        'triador-1',
        'PRONTO_DISCOVERY',
        'ALTO',
        'ALTA',
        'MEDIA',
      ),
    );

    expect(triagemRepository.create).toHaveBeenCalled();
    expect(triagemRepository.update).toHaveBeenCalledTimes(1);
    expect(demandaRepository.update).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        demandaId,
        statusNovo: StatusTriagemEnum.PRONTO_DISCOVERY,
      }),
    );
  });

  it('incrementa revisões ao retornar de aguardo e trata automação', async () => {
    const {
      handler,
      triagemRepository,
      demandaRepository,
      catalogoRepository,
      automacaoService,
    } = createHandler();

    const demanda = buildDemanda();
    demandaRepository.findById.mockResolvedValue(demanda);

    const triagem = TriagemDemanda.criarNova(demandaId);
    triagem.atualizarStatus(StatusTriagemEnum.AGUARDANDO_INFO, 'pm-1');
    triagemRepository.findByDemandaId.mockResolvedValue(triagem);
    automacaoService.executar.mockResolvedValue({ triagemAlterada: true, demandaAlterada: true });

    catalogoRepository.getRequiredItem.mockResolvedValue(createStatusDemanda('triagem'));

    await handler.execute(
      new TriarDemandaCommand(
        tenantId,
        demandaId,
        'pm-2',
        'RETOMADO_TRIAGEM',
        undefined,
        undefined,
        undefined,
        undefined,
        [{ itemId: triagem.checklist[0].id, completed: true }],
      ),
    );

    expect(triagem.revisoesTriagem).toBe(1);
    expect(triagem.checklist[0].completed).toBe(true);
    expect(triagemRepository.update).toHaveBeenCalled();
    expect(demandaRepository.update).toHaveBeenCalled();
  });

  it('lança erro quando status informado é inválido', async () => {
    const { handler, demandaRepository, triagemRepository, automacaoService } = createHandler();
    demandaRepository.findById.mockResolvedValue(buildDemanda());
    triagemRepository.findByDemandaId.mockResolvedValue(TriagemDemanda.criarNova(demandaId));
    automacaoService.executar.mockResolvedValue({ triagemAlterada: false, demandaAlterada: false });

    await expect(
      handler.execute(new TriarDemandaCommand(tenantId, demandaId, 'pm-1', 'STATUS_INVALIDO')),
    ).rejects.toThrow('Status de triagem inválido: STATUS_INVALIDO');
  });
});

