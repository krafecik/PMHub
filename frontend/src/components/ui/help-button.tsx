'use client'

import * as React from 'react'
import { HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'

interface HelpButtonProps {
  title: string
  content: React.ReactNode
  className?: string
}

export function HelpButton({ title, content, className }: HelpButtonProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
        aria-label="Ajuda"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay forceMount asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content forceMount asChild>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
                  animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                  exit={{ scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
                  transition={{ type: 'spring', duration: 0.3 }}
                  className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col rounded-lg border border-border bg-background shadow-xl"
                >
                  <div className="flex-shrink-0 border-b p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Dialog.Title className="flex items-center gap-2 text-xl font-semibold text-text-primary">
                          <HelpCircle className="h-5 w-5 text-primary-500" />
                          {title}
                        </Dialog.Title>
                        <Dialog.Description className="sr-only">
                          Modal de ajuda com informações sobre como usar esta funcionalidade
                        </Dialog.Description>
                      </div>
                      <Dialog.Close asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </Dialog.Close>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                      {content}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 justify-end border-t p-6">
                    <Button variant="gradient" onClick={() => setOpen(false)}>
                      Entendi
                    </Button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  )
}

// Conteúdo de ajuda para a página de Demandas
export const demandasHelpContent = (
  <div>
    <h3>Como usar a tela de Demandas</h3>

    <h4>O que são Demandas?</h4>
    <p>
      Demandas são ideias, problemas ou oportunidades identificadas que precisam ser analisadas e
      potencialmente transformadas em iniciativas de produto. Elas representam o ponto de entrada
      para o processo de gestão de produto.
    </p>

    <h4>Tipos de Demanda</h4>
    <ul>
      <li>
        <strong>Ideia (💡)</strong>: Sugestões de novas funcionalidades ou melhorias
      </li>
      <li>
        <strong>Problema (🐛)</strong>: Questões reportadas por usuários ou identificadas
        internamente
      </li>
      <li>
        <strong>Oportunidade (🚀)</strong>: Possibilidades de mercado ou negócio identificadas
      </li>
    </ul>

    <h4>Como criar uma Demanda?</h4>
    <ol>
      <li>Clique no botão "Nova Demanda" ou no botão flutuante (+)</li>
      <li>Preencha os campos obrigatórios: tipo, título e produto</li>
      <li>Adicione uma descrição detalhada (opcional mas recomendado)</li>
      <li>Escolha a origem e prioridade adequadas</li>
      <li>Salve como rascunho ou crie diretamente</li>
    </ol>

    <h4>Filtros e Busca</h4>
    <p>
      Use os filtros rápidos para visualizar demandas por tipo, status ou prioridade. A busca
      permite encontrar demandas por título, descrição, tipo ou produto.
    </p>

    <h4>Status das Demandas</h4>
    <ul>
      <li>
        <strong>Novo</strong>: Demanda recém-criada aguardando triagem
      </li>
      <li>
        <strong>Rascunho</strong>: Demanda salva mas não finalizada
      </li>
      <li>
        <strong>Triagem</strong>: Em processo de análise e qualificação
      </li>
      <li>
        <strong>Arquivado</strong>: Demanda descartada ou não priorizada
      </li>
    </ul>

    <h4>Metodologia de Gestão de Produtos</h4>
    <p>
      Este módulo segue as melhores práticas de Product Management, permitindo a captura
      centralizada de inputs de diferentes fontes (clientes, vendas, suporte, equipe interna) para
      posterior análise e priorização baseada em impacto e esforço.
    </p>
  </div>
)

// Conteúdo de ajuda para a página de Produtos
export const produtosHelpContent = (
  <div>
    <h3>Como usar a tela de Produtos</h3>

    <h4>O que são Produtos?</h4>
    <p>
      Produtos representam as diferentes linhas ou módulos do seu software/serviço. Eles servem para
      organizar e categorizar demandas, métricas e iniciativas.
    </p>

    <h4>Gerenciando Produtos</h4>
    <ul>
      <li>
        <strong>Criar</strong>: Clique em "Novo Produto" para adicionar um produto ao sistema
      </li>
      <li>
        <strong>Editar</strong>: Use o menu de ações (⋯) no card do produto
      </li>
      <li>
        <strong>Status</strong>: Produtos podem estar Ativos ou Inativos
      </li>
    </ul>

    <h4>Métricas do Produto</h4>
    <p>Cada card de produto exibe:</p>
    <ul>
      <li>
        <strong>Total de Demandas</strong>: Quantidade de demandas vinculadas
      </li>
      <li>
        <strong>Demandas Ativas</strong>: Demandas em andamento
      </li>
      <li>
        <strong>Score de Saúde</strong>: Indicador geral de performance do produto
      </li>
    </ul>

    <h4>Boas Práticas</h4>
    <ul>
      <li>Mantenha nomes de produtos claros e consistentes</li>
      <li>Use descrições para detalhar o escopo de cada produto</li>
      <li>Desative produtos descontinuados ao invés de removê-los</li>
      <li>Revise periodicamente o score de saúde dos produtos</li>
    </ul>

    <h4>Metodologia de Gestão de Produtos</h4>
    <p>
      A organização por produtos permite uma visão estratégica do portfólio, facilitando a alocação
      de recursos e a priorização de iniciativas baseada no valor de negócio de cada linha de
      produto.
    </p>
  </div>
)

export const usuariosHelpContent = (
  <div>
    <h3>Gestão de usuários e convites</h3>
    <p>
      Utilize esta tela para controlar quem tem acesso ao tenant atual. Você pode convidar novos
      membros da equipe, acompanhar convites pendentes e ajustar o perfil de acesso dos usuários
      ativos.
    </p>

    <h4>Perfis disponíveis</h4>
    <ul>
      <li>
        <strong>CPO / Owner</strong>: acesso total ao tenant, incluindo configurações críticas e
        gestão de convites.
      </li>
      <li>
        <strong>Product Manager</strong>: pode criar e priorizar demandas, discovery e planejamento.
      </li>
      <li>
        <strong>Visualizador</strong>: acesso somente leitura às informações estratégicas.
      </li>
    </ul>

    <h4>Convidando um usuário</h4>
    <ol>
      <li>
        Clique em <em>“Convidar usuário”</em> e informe e-mail, nome, tenant e o perfil desejado.
      </li>
      <li>
        Opcionalmente inclua uma mensagem personalizada. O convidado receberá um e-mail com
        instruções para definir a senha e ativar a conta.
      </li>
      <li>
        Acompanhe os convites na aba <em>Convites</em>. É possível reenviar ou revogar convites
        pendentes.
      </li>
    </ol>

    <h4>Boas práticas</h4>
    <ul>
      <li>
        Revise periodicamente a lista de usuários ativos e revogue acessos que não são mais
        necessários.
      </li>
      <li>Mantenha ao menos um Owner por tenant para evitar bloqueios administrativos.</li>
      <li>
        Utilize o bloqueio automático em caso de tentativas de senha inválidas e desbloqueie apenas
        após validação.
      </li>
    </ul>

    <h4>Política de segurança</h4>
    <p>
      Todos os acessos ficam registrados com data e hora. Quando um usuário estiver bloqueado por
      segurança, utilize a ação <em>Desbloquear</em> apenas após confirmar a identidade do
      colaborador.
    </p>
  </div>
)
