export const hipotesesTemplates = [
  {
    label: 'Visibilidade de call-to-action',
    values: {
      titulo: 'Usuários não percebem o call-to-action principal',
      descricao:
        'Observamos queda na conversão em telas críticas. Hipótese de que o botão principal não está ganhando destaque suficiente para o usuário avançar.',
      comoValidar:
        'Executar teste A/B com variação de cor e hierarquia visual para o botão principal.',
      metricaAlvo: '+12% de cliques no CTA principal',
      impactoEsperado: 'alta',
      prioridade: 'alta',
    },
  },
  {
    label: 'Falta de orientação inicial',
    values: {
      titulo: 'Usuários abandonam devido à ausência de onboarding guiado',
      descricao:
        'Usuários relatam desconhecimento do next-step. Hipótese de que um walkthrough guiado reduzirá dúvidas iniciais.',
      comoValidar: 'Prototipar walkthrough e testar com 5 usuários-alvo em sessão moderada.',
      metricaAlvo: '-20% em tickets de dúvida nos primeiros 7 dias',
      impactoEsperado: 'media',
      prioridade: 'media',
    },
  },
]

export const pesquisaTemplates = [
  {
    label: 'Entrevista de descoberta',
    values: {
      titulo: 'Entrevistas com novos clientes',
      metodo: 'entrevista_guiada',
      objetivo:
        'Entender percepções sobre onboarding inicial e principais dúvidas no primeiro acesso.',
      totalParticipantes: 8,
      roteiroUrl: '',
    },
  },
  {
    label: 'Pesquisa quantitativa',
    values: {
      titulo: 'Survey de satisfação pós-onboarding',
      metodo: 'survey',
      objetivo: 'Mensurar NPS e identificar pontos de atrito após 14 dias de uso da plataforma.',
      totalParticipantes: 30,
      roteiroUrl: '',
    },
  },
]

export const experimentoTemplates = [
  {
    label: 'Teste A/B interface',
    values: {
      titulo: 'Teste A/B discurso do CTA',
      descricao:
        'Comparar versão atual do CTA com uma variação que reforça valor e reduz fricção na etapa 3.',
      tipo: 'teste_ab',
      metricaSucesso: 'Conversão na etapa 3',
      grupoControle: '{"variante": "original"}',
      grupoVariante: '{"variante": "CTA reforçado"}',
    },
  },
  {
    label: 'MVP concierge',
    values: {
      titulo: 'MVP com suporte humano dedicado',
      descricao:
        'Durante duas semanas, oferecer acompanhamento manual para onboarding e medir impacto em dúvidas e cancelamentos.',
      tipo: 'concierge',
      metricaSucesso: 'Redução de tickets abertos na primeira semana',
      grupoControle: '',
      grupoVariante: '',
    },
  },
]
