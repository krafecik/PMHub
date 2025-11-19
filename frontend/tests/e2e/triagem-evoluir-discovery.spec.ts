import { test, expect } from '@playwright/test'
import { fulfillJson, fulfillOptions, mockAuthenticatedSession } from './utils'

const demandaTriagem = {
  id: '3',
  titulo: 'Certificado digital no CEM',
  descricao: 'Descrição completa da demanda para teste',
  tipo: 'OPORTUNIDADE',
  tipoLabel: 'Oportunidade',
  produto: {
    id: 'PROD-01',
    nome: 'CEM Mobi',
  },
  origem: 'CLIENTE',
  origemLabel: 'Cliente',
  triagem: {
    id: 'TRI-001',
    status: 'PENDENTE_TRIAGEM',
    impacto: null,
    urgencia: null,
    complexidade: null,
    possivelDuplicata: false,
  },
  responsavel: {
    id: 'pm-01',
    nome: 'PM Teste',
  },
}

const demandasPendentesResponse = {
  data: [demandaTriagem],
  total: 1,
  page: 1,
  pageSize: 50,
  totalPages: 1,
}

test.describe('Fluxo: Enviar Demanda para Discovery', () => {
  test('deve validar triagem completa antes de evoluir para Discovery', async ({ page }) => {
    await mockAuthenticatedSession(page)

    // Mock da lista de demandas pendentes
    await page.route('**/v1/triagem/demandas-pendentes**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        await fulfillJson(route, demandasPendentesResponse)
        return
      }
      await route.continue()
    })

    // Mock de triar demanda (sucesso)
    await page.route('**/v1/triagem/demandas/3/triar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'PATCH') {
        await fulfillJson(route, {
          success: true,
          message: 'Demanda triada com sucesso',
        })
        return
      }
      await route.continue()
    })

    // Mock de evoluir para Discovery - retorna erro 400 se triagem incompleta
    await page.route('**/v1/triagem/demandas/3/evoluir-discovery', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        // Simular erro de validação
        await route.fulfill({
          status: 400,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({
            code: 'triagem_incompleta',
            message: 'Triagem não atende aos requisitos mínimos para evoluir ao Discovery.',
            details: [
              {
                field: 'impacto',
                issue: 'Impacto é obrigatório antes de enviar ao Discovery.',
              },
              {
                field: 'checklist.descricao_clara',
                issue: 'Item obrigatório de checklist pendente: Descrição clara e objetiva',
              },
            ],
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')

    // Aguardar lista carregar
    await expect(page.getByText('Certificado digital no CEM')).toBeVisible()

    // Clicar na demanda para abrir modal
    await page.getByText('Certificado digital no CEM').click()

    // Aguardar modal abrir
    await expect(page.getByRole('heading', { name: /#3 - Triagem/ })).toBeVisible()

    // Tentar enviar para Discovery sem preencher tudo (deve falhar)
    const enviarButton = page.getByRole('button', { name: /Enviar para Discovery/i })
    await expect(enviarButton).toBeVisible()

    // O botão deve estar desabilitado se não estiver completo
    // Se estiver habilitado e clicarmos, deve mostrar erro
    if (await enviarButton.isEnabled()) {
      await enviarButton.click()

      // Deve mostrar toast de erro com detalhes
      await expect(page.getByText(/Triagem incompleta/i)).toBeVisible()
      await expect(page.getByText(/Impacto é obrigatório/i)).toBeVisible()
    } else {
      // Se estiver desabilitado, verificar que está correto
      await expect(enviarButton).toBeDisabled()
    }
  })

  test('deve evoluir para Discovery quando triagem estiver completa', async ({ page }) => {
    await mockAuthenticatedSession(page)

    const demandaCompleta = {
      ...demandaTriagem,
      triagem: {
        ...demandaTriagem.triagem,
        status: 'PRONTO_DISCOVERY',
        impacto: 'ALTO',
        urgencia: 'MEDIA',
        complexidade: 'MEDIA',
      },
    }

    await page.route('**/v1/triagem/demandas-pendentes**', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'GET') {
        await fulfillJson(route, {
          ...demandasPendentesResponse,
          data: [demandaCompleta],
        })
        return
      }
      await route.continue()
    })

    // Mock de triar demanda (sucesso)
    await page.route('**/v1/triagem/demandas/3/triar', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'PATCH') {
        await fulfillJson(route, {
          success: true,
          message: 'Demanda triada com sucesso',
        })
        return
      }
      await route.continue()
    })

    // Mock de evoluir para Discovery - sucesso
    await page.route('**/v1/triagem/demandas/3/evoluir-discovery', async (route) => {
      const method = route.request().method()
      if (method === 'OPTIONS') {
        await fulfillOptions(route)
        return
      }
      if (method === 'POST') {
        await fulfillJson(route, {
          success: true,
          data: {
            discoveryId: 'DISC-3-1234567890',
          },
          message: 'Demanda enviada para Discovery com sucesso',
        })
        return
      }
      await route.continue()
    })

    await page.goto('/triagem')

    // Aguardar lista carregar
    await expect(page.getByText('Certificado digital no CEM')).toBeVisible()

    // Clicar na demanda para abrir modal
    await page.getByText('Certificado digital no CEM').click()

    // Aguardar modal abrir
    await expect(page.getByRole('heading', { name: /#3 - Triagem/ })).toBeVisible()

    // Clicar em "Enviar para Discovery"
    const enviarButton = page.getByRole('button', { name: /Enviar para Discovery/i })
    await expect(enviarButton).toBeVisible()
    await enviarButton.click()

    // Deve mostrar toast de sucesso
    await expect(page.getByText(/Demanda enviada para Discovery/i)).toBeVisible()
    await expect(page.getByText(/DISC-3-/i)).toBeVisible()

    // Modal deve fechar
    await expect(page.getByRole('heading', { name: /#3 - Triagem/ })).not.toBeVisible()
  })
})

