'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Edit } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HelpButton } from '@/components/ui/help-button'
import { CommitmentSummary } from '@/components/planejamento/commitment-summary'
import {
  listarCommitments,
  salvarCommitment,
  listarEpicos,
  type CommitmentTierItem,
} from '@/lib/planejamento-api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const compromissosHelpContent = (
  <div className="space-y-4">
    <p>
      Defina e gerencie os compromissos trimestrais, organizando épicos em tiers: Committed,
      Targeted e Aspirational.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Tiers de Commitment:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>
          <strong>Committed:</strong> Compromisso firme - será entregue
        </li>
        <li>
          <strong>Targeted:</strong> Meta - tentaremos entregar
        </li>
        <li>
          <strong>Aspirational:</strong> Aspiração - se houver capacidade
        </li>
      </ul>
    </div>
    <div>
      <h3 className="mb-2 font-semibold">Assinaturas:</h3>
      <p className="text-sm">
        PMs, Tech Leads e CPO devem assinar o commitment para validar o compromisso do quarter.
      </p>
    </div>
  </div>
)

export default function CompromissosPage() {
  const [quarter, setQuarter] = useState('Q1 2026')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['commitments', quarter],
    queryFn: () => listarCommitments({ quarter }),
  })

  const { data: epicosData } = useQuery({
    queryKey: ['epicos', quarter],
    queryFn: () => listarEpicos({ quarter }),
  })

  const commitment = commitments[0] // Pegar o primeiro commitment do quarter

  const [selectedEpicos, setSelectedEpicos] = useState<{
    committed: CommitmentTierItem[]
    targeted: CommitmentTierItem[]
    aspirational: CommitmentTierItem[]
  }>({
    committed: [],
    targeted: [],
    aspirational: [],
  })

  // Sincronizar estado quando commitment mudar
  useEffect(() => {
    if (commitment) {
      setSelectedEpicos({
        committed: commitment.itens?.committed || [],
        targeted: commitment.itens?.targeted || [],
        aspirational: commitment.itens?.aspirational || [],
      })
    } else {
      setSelectedEpicos({
        committed: [],
        targeted: [],
        aspirational: [],
      })
    }
  }, [commitment])

  const salvarMutation = useMutation({
    mutationFn: salvarCommitment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments', quarter] })
      toast({
        title: 'Commitment salvo',
        description: 'O commitment foi salvo com sucesso.',
      })
      setIsModalOpen(false)
    },
    onError: () => {
      toast({
        title: 'Erro ao salvar commitment',
        description: 'Não foi possível salvar o commitment. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const handleOpenModal = () => {
    if (commitment) {
      setSelectedEpicos({
        committed: commitment.itens?.committed || [],
        targeted: commitment.itens?.targeted || [],
        aspirational: commitment.itens?.aspirational || [],
      })
    } else {
      setSelectedEpicos({
        committed: [],
        targeted: [],
        aspirational: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    salvarMutation.mutate({
      quarter,
      committed: selectedEpicos.committed,
      targeted: selectedEpicos.targeted,
      aspirational: selectedEpicos.aspirational,
    })
  }

  const toggleEpicoInTier = (
    epicoId: string,
    epicoTitulo: string,
    tier: 'committed' | 'targeted' | 'aspirational',
  ) => {
    setSelectedEpicos((prev) => {
      const newState = { ...prev }
      const allEpicos = [...newState.committed, ...newState.targeted, ...newState.aspirational]
      const epicoExists = allEpicos.find((e) => e.epicoId === epicoId)

      // Remove de todos os tiers primeiro
      newState.committed = newState.committed.filter((e) => e.epicoId !== epicoId)
      newState.targeted = newState.targeted.filter((e) => e.epicoId !== epicoId)
      newState.aspirational = newState.aspirational.filter((e) => e.epicoId !== epicoId)

      // Se não estava no tier selecionado, adiciona
      if (
        !epicoExists ||
        epicoExists.epicoId !== epicoId ||
        !newState[tier].find((e) => e.epicoId === epicoId)
      ) {
        newState[tier].push({
          epicoId,
          titulo: epicoTitulo,
        })
      }

      return newState
    })
  }

  const getEpicoTier = (epicoId: string): 'committed' | 'targeted' | 'aspirational' | null => {
    if (selectedEpicos.committed.find((e) => e.epicoId === epicoId)) return 'committed'
    if (selectedEpicos.targeted.find((e) => e.epicoId === epicoId)) return 'targeted'
    if (selectedEpicos.aspirational.find((e) => e.epicoId === epicoId)) return 'aspirational'
    return null
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Compromissos Trimestrais</h1>
          <p className="text-text-secondary">
            Consolide o que será Committed, Targeted e Aspirational para o quarter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1 2026">Q1 2026</SelectItem>
              <SelectItem value="Q2 2026">Q2 2026</SelectItem>
              <SelectItem value="Q3 2026">Q3 2026</SelectItem>
              <SelectItem value="Q4 2026">Q4 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenModal} variant={commitment ? 'outline' : 'default'}>
            {commitment ? (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Editar Commitment
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Criar Commitment
              </>
            )}
          </Button>
          <HelpButton title="Ajuda - Compromissos" content={compromissosHelpContent} />
        </div>
      </header>

      {isLoading ? (
        <Card variant="outline" className="p-6">
          <p className="text-text-secondary">Carregando compromissos...</p>
        </Card>
      ) : !commitment ? (
        <Card variant="outline" className="p-6">
          <p className="mb-4 text-text-secondary">
            Nenhum commitment definido para este quarter. Clique no botão acima para criar.
          </p>
        </Card>
      ) : (
        <>
          <CommitmentSummary commitment={commitment} />

          {commitment.assinaturas && commitment.assinaturas.length > 0 && (
            <Card variant="outline" className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-text-primary">Assinaturas</h2>
              </div>
              <div className="space-y-2">
                {commitment.assinaturas.map((assinatura, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{assinatura.papel}</span>
                    <Badge variant="success">
                      {new Date(assinatura.assinadoEm).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal de Criar/Editar Commitment */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {commitment ? 'Editar Commitment' : 'Criar Commitment'} - {quarter}
            </DialogTitle>
            <DialogDescription>
              Organize os épicos em tiers: Committed (compromisso firme), Targeted (meta) e
              Aspirational (aspiração).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tiers */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Committed */}
              <Card variant="outline" className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Committed</h3>
                  <Badge variant="success">{selectedEpicos.committed.length}</Badge>
                </div>
                <p className="mb-3 text-xs text-text-muted">Compromisso firme - será entregue</p>
                <div className="max-h-[300px] min-h-[200px] space-y-2 overflow-y-auto">
                  {selectedEpicos.committed.map((item) => (
                    <div
                      key={item.epicoId}
                      className="rounded border border-border bg-emerald-50 p-2 text-sm dark:bg-emerald-950/20"
                    >
                      {item.titulo}
                    </div>
                  ))}
                  {selectedEpicos.committed.length === 0 && (
                    <p className="py-4 text-center text-xs text-text-muted">Nenhum épico</p>
                  )}
                </div>
              </Card>

              {/* Targeted */}
              <Card variant="outline" className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Targeted</h3>
                  <Badge variant="warning">{selectedEpicos.targeted.length}</Badge>
                </div>
                <p className="mb-3 text-xs text-text-muted">Meta - tentaremos entregar</p>
                <div className="max-h-[300px] min-h-[200px] space-y-2 overflow-y-auto">
                  {selectedEpicos.targeted.map((item) => (
                    <div
                      key={item.epicoId}
                      className="rounded border border-border bg-amber-50 p-2 text-sm dark:bg-amber-950/20"
                    >
                      {item.titulo}
                    </div>
                  ))}
                  {selectedEpicos.targeted.length === 0 && (
                    <p className="py-4 text-center text-xs text-text-muted">Nenhum épico</p>
                  )}
                </div>
              </Card>

              {/* Aspirational */}
              <Card variant="outline" className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Aspirational</h3>
                  <Badge variant="secondary">{selectedEpicos.aspirational.length}</Badge>
                </div>
                <p className="mb-3 text-xs text-text-muted">Aspiração - se houver capacidade</p>
                <div className="max-h-[300px] min-h-[200px] space-y-2 overflow-y-auto">
                  {selectedEpicos.aspirational.map((item) => (
                    <div
                      key={item.epicoId}
                      className="rounded border border-border bg-slate-50 p-2 text-sm dark:bg-slate-950/20"
                    >
                      {item.titulo}
                    </div>
                  ))}
                  {selectedEpicos.aspirational.length === 0 && (
                    <p className="py-4 text-center text-xs text-text-muted">Nenhum épico</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Lista de Épicos Disponíveis */}
            <div>
              <h3 className="mb-3 font-semibold text-text-primary">Épicos Disponíveis</h3>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {epicosData?.data && epicosData.data.length > 0 ? (
                  epicosData.data.map((epico) => {
                    const currentTier = getEpicoTier(epico.id)
                    return (
                      <div
                        key={epico.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary-50 dark:hover:bg-secondary-900/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{epico.titulo}</p>
                          {currentTier && (
                            <Badge
                              variant={
                                currentTier === 'committed'
                                  ? 'success'
                                  : currentTier === 'targeted'
                                    ? 'warning'
                                    : 'secondary'
                              }
                              className="mt-1 text-xs"
                            >
                              {currentTier === 'committed'
                                ? 'Committed'
                                : currentTier === 'targeted'
                                  ? 'Targeted'
                                  : 'Aspirational'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={currentTier === 'committed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleEpicoInTier(epico.id, epico.titulo, 'committed')}
                          >
                            Committed
                          </Button>
                          <Button
                            type="button"
                            variant={currentTier === 'targeted' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleEpicoInTier(epico.id, epico.titulo, 'targeted')}
                          >
                            Targeted
                          </Button>
                          <Button
                            type="button"
                            variant={currentTier === 'aspirational' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              toggleEpicoInTier(epico.id, epico.titulo, 'aspirational')
                            }
                          >
                            Aspirational
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-text-muted">
                    Nenhum épico disponível para este quarter.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false)
                if (commitment) {
                  setSelectedEpicos({
                    committed: commitment.itens?.committed || [],
                    targeted: commitment.itens?.targeted || [],
                    aspirational: commitment.itens?.aspirational || [],
                  })
                }
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={salvarMutation.isPending}>
              {salvarMutation.isPending ? 'Salvando...' : 'Salvar Commitment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
