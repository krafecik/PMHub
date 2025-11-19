export const planejamentoHelpContent = (
  <div>
    <h3>Objetivo do módulo</h3>
    <p>
      Transforme descobertas validadas em um plano trimestral sólido, conectando épicos, capacidade
      e compromissos em uma única linha do tempo.
    </p>

    <h4>Como usar esta tela</h4>
    <ol>
      <li>Selecione o quarter desejado para sincronizar todos os painéis.</li>
      <li>Revise o pipeline de épicos e atualize status/health diretamente.</li>
      <li>Cheque o quadro de capacidade para garantir utilização abaixo de 110%.</li>
      <li>Simule cenários ajustando capacidade dos squads antes de negociar escopo.</li>
      <li>Finalize o commitment com épicos Committed, Targeted e Aspirational.</li>
    </ol>

    <h4>Métricas principais</h4>
    <ul>
      <li>
        <strong>Capacidade</strong>: pontos planejados vs. disponíveis por squad.
      </li>
      <li>
        <strong>Health</strong>: monitora riscos críticos de cada épico.
      </li>
      <li>
        <strong>Commitment</strong>: garante alinhamento com CPO e Tech Leads para o quarter.
      </li>
    </ul>

    <h4>Dúvidas frequentes</h4>
    <p>
      <strong>Quando mover um épico para Committed?</strong> Quando requisitos estão aprovados,
      capacidade reservada e riscos mitigados. <br />
      <strong>Como interpretar o health?</strong> Verde = ritmo saudável, Amarelo = atenção
      necessária, Vermelho = risco iminente (dispare ações corretivas).
    </p>
  </div>
)

export const planejamentoConfigHelpContent = (
  <div>
    <h3>Configurar Planejamento</h3>
    <p>
      Cadastre squads e ciclos trimestrais direto na plataforma para evitar dependência de scripts
      ou seeds manuais.
    </p>

    <h4>Squads</h4>
    <ul>
      <li>
        Defina nome, slug (aparece nos relatórios) e, se quiser, cor/tema para identificar nos
        cards.
      </li>
      <li>
        Capacidade padrão serve como base para o cálculo rápido; você pode sobrescrever no módulo de
        capacidade quando necessário.
      </li>
      <li>
        Desativar um squad via status impede seleção em novos épicos, mas mantém histórico para
        quarters passados.
      </li>
    </ul>

    <h4>Planning cycles</h4>
    <ol>
      <li>Escolha o quarter e, opcionalmente, o produto ou frente responsável.</li>
      <li>
        Monte o checklist de prontidão (DoR/DoD) com responsáveis para acompanhar durante o
        planning.
      </li>
      <li>Use a aba de participantes para registrar quorum e anexos de agenda.</li>
      <li>Após criar, acompanhe o status do ciclo em Planejamento → Dashboard.</li>
    </ol>

    <h4>Boas práticas</h4>
    <p>
      Revise os cadastros a cada quarter, mantendo squads e checklists alinhados aos rituais
      vigentes. Todas as alterações ficam auditadas por tenant e podem ser consultadas em relatórios
      futuros.
    </p>
  </div>
)
