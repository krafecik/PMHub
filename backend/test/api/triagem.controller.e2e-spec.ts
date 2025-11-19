import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TriagemController } from '../../src/infrastructure/http/controllers/triagem.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import {
  TriagemAiDuplicacaoService,
  TriagemAiEncaminhamentoService,
} from '@application/triagem/services';
import {
  ListarDemandasPendentesQuery,
  ObterEstatisticasTriagemQuery,
} from '@application/triagem/queries';
import { TriarDemandaCommand } from '@application/triagem/commands';

describe('TriagemController (API)', () => {
  let app: INestApplication;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let triagemAiDuplicacaoService: { sugerirDuplicatas: jest.Mock };
  let triagemAiEncaminhamentoService: { sugerirEncaminhamento: jest.Mock };

  beforeAll(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    triagemAiDuplicacaoService = { sugerirDuplicatas: jest.fn() };
    triagemAiEncaminhamentoService = { sugerirEncaminhamento: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [TriagemController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: TriagemAiDuplicacaoService, useValue: triagemAiDuplicacaoService },
        { provide: TriagemAiEncaminhamentoService, useValue: triagemAiEncaminhamentoService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: 'user-1', defaultTenantId: 'tenant-1' };
          req.tenantId = 'tenant-1';
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /triagem/demandas-pendentes envia query estruturada ao QueryBus', async () => {
    queryBus.execute.mockResolvedValue({ data: [], total: 0 });

    const response = await request(app.getHttpServer())
      .get('/triagem/demandas-pendentes')
      .query({ page: '2', page_size: '5', 'filter[tipo]': 'feature', sort: '-created_at' })
      .expect(200);

    expect(response.body).toEqual({ data: [], total: 0 });
    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListarDemandasPendentesQuery));
    const query = queryBus.execute.mock.calls[0][0] as ListarDemandasPendentesQuery;
    expect(query.paginacao?.page).toBe(2);
  });

  it('PATCH /triagem/demandas/:id/triar envia comando ao CommandBus', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch('/triagem/demandas/42/triar')
      .send({ novoStatus: 'PRONTO_DISCOVERY', impacto: 'ALTO' })
      .expect(200)
      .expect({
        success: true,
        message: 'Demanda triada com sucesso',
      });

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(TriarDemandaCommand));
  });

  it('GET /triagem/estatisticas utiliza o tenant do usuário autenticado', async () => {
    queryBus.execute.mockResolvedValue({ totalPendentes: 1 });

    const res = await request(app.getHttpServer()).get('/triagem/estatisticas').expect(200);
    expect(res.body).toEqual({ totalPendentes: 1 });
    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ObterEstatisticasTriagemQuery));
  });
});
