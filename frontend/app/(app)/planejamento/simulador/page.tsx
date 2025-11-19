'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, Plus, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { HelpButton } from '@/components/ui/help-button'
import {
  fetchCenarios,
  recalcularCenario,
  salvarCenario,
  fetchCapacidade,
  listarSquads,
} from '@/lib/planejamento-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScenarioList } from '@/components/planejamento/scenario-list'
import { cn } from '@/lib/utils'

const simuladorHelpContent = (
  <div className="space-y-4">
    <p>
      Teste diferentes cenários de capacidade e veja o impacto nos épicos planejados. Ajuste
      capacidade por squad, inclua contractors, considere férias e buffers de risco.
    </p>
    <div>
      <h3 className="mb-2 font-semibold">Opções:</h3>
      <ul className="list-inside list-disc space-y-1 text-sm">
        <li>Ajustar capacidade por squad com sliders</li>
        <li>Incluir contractors (+15% capacidade)</li>
        <li>Considerar férias automaticamente</li>
        <li>Incluir buffer de risco (10%)</li>
      </ul>
    </div>
  </div>
)

export default function SimuladorPage() {
  const [quarter, setQuarter] = useState('Q1 2026')
  const [nomeCenario, setNomeCenario] = useState('')
  const [descricaoCenario, setDescricaoCenario] = useState('')
  const [ajustesCapacidade, setAjustesCapacidade] = useState<Record<string, number>>({})
  const [incluirContractors, setIncluirContractors] = useState(false)
  const [considerarFerias, setConsiderarFerias] = useState(false)
  const [bufferRisco, setBufferRisco] = useState(10)
  const queryClient = useQueryClient()

  const { data: cenarios } = useQuery({
    queryKey: ['cenarios', quarter],
    queryFn: () => fetchCenarios(quarter),
  })

  const { data: capacidade } = useQuery({
    queryKey: ['capacidade', quarter],
    queryFn: () => fetchCapacidade(quarter),
  })

  const { data: squads } = useQuery({
    queryKey: ['squads'],
    queryFn: listarSquads,
  })

  const recalcMutation = useMutation({
    mutationFn: (cenarioId: string) => recalcularCenario(cenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cenarios', quarter] })
      toast.success('Cenário recalculado com sucesso')
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload: any) => salvarCenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cenarios', quarter] })
      toast.success('Cenário salvo com sucesso')
      setNomeCenario('')
      setDescricaoCenario('')
      setAjustesCapacidade({})
    },
  })

  function handleAjustarCapacidade(squadId: string, delta: number) {
    setAjustesCapacidade((prev) => ({
      ...prev,
      [squadId]: (prev[squadId] || 0) + delta,
    }))
  }

  function handleSalvarCenario() {
    if (!nomeCenario.trim()) {
      toast.error('Informe um nome para o cenário')
      return
    }

    const ajustesSelecionados =
      squads?.map((squad) => ({
        squadId: squad.id,
        deltaPercentual: ajustesCapacidade[squad.id] || 0,
      })) || []

    saveMutation.mutate({
      nome: nomeCenario,
      descricao: descricaoCenario,
      quarter,
      incluirContractors,
      considerarFerias,
      bufferRiscoPercentual: bufferRisco,
      ajustesCapacidade: ajustesSelecionados,
    })
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Planejamento & Roadmap</p>
          <h1 className="text-3xl font-bold text-text-primary">Simulador de Cenários</h1>
          <p className="text-text-secondary">
            Teste variações de capacidade e confirme o impacto nos épicos.
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
          <HelpButton title="Ajuda - Simulador" content={simuladorHelpContent} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuração do Cenário */}
        <div className="space-y-6 lg:col-span-2">
          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Configurar Cenário</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Cenário</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Growth Focus"
                  value={nomeCenario}
                  onChange={(e) => setNomeCenario(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descreva o cenário..."
                  value={descricaoCenario}
                  onChange={(e) => setDescricaoCenario(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Capacidade por Squad */}
          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Ajustar Capacidade</h2>
            <div className="space-y-4">
              {capacidade?.map((squadCap) => {
                const squad = squads?.find((s) => s.id === squadCap.squadId)
                const ajuste = ajustesCapacidade[squadCap.squadId] || 0
                const novaCapacidade =
                  squadCap.capacidadeTotal + (squadCap.capacidadeTotal * ajuste) / 100

                return (
                  <div key={squadCap.squadId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">
                          {squad?.nome || `Squad ${squadCap.squadId}`}
                        </p>
                        <p className="text-sm text-text-muted">
                          Capacidade atual: {squadCap.capacidadeTotal} pts
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAjustarCapacidade(squadCap.squadId, -10)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span
                          className={cn(
                            'w-20 text-center font-medium',
                            ajuste !== 0 && 'text-primary-600',
                          )}
                        >
                          {ajuste > 0 ? '+' : ''}
                          {ajuste}%
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAjustarCapacidade(squadCap.squadId, 10)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{
                            width: `${Math.min((novaCapacidade / squadCap.capacidadeTotal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-text-muted">{Math.round(novaCapacidade)} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Opções Avançadas */}
          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Opções Avançadas</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contractors"
                  checked={incluirContractors}
                  onCheckedChange={(checked) => setIncluirContractors(checked === true)}
                />
                <Label htmlFor="contractors" className="cursor-pointer">
                  Incluir contractors (+15% capacidade)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ferias"
                  checked={considerarFerias}
                  onCheckedChange={(checked) => setConsiderarFerias(checked === true)}
                />
                <Label htmlFor="ferias" className="cursor-pointer">
                  Considerar férias automaticamente
                </Label>
              </div>
              <div>
                <Label htmlFor="buffer">Buffer de risco (%)</Label>
                <Input
                  id="buffer"
                  type="number"
                  min="0"
                  max="50"
                  value={bufferRisco}
                  onChange={(e) => setBufferRisco(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNomeCenario('')
                setDescricaoCenario('')
                setAjustesCapacidade({})
                setIncluirContractors(false)
                setConsiderarFerias(false)
                setBufferRisco(10)
              }}
            >
              Limpar
            </Button>
            <Button
              onClick={handleSalvarCenario}
              disabled={saveMutation.isPending || !nomeCenario.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Cenário
            </Button>
          </div>
        </div>

        {/* Cenários Salvos */}
        <div className="space-y-6">
          <Card variant="outline" className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Cenários Salvos</h2>
            {cenarios && cenarios.length > 0 ? (
              <ScenarioList
                scenarios={cenarios}
                onRecalculate={(id) => recalcMutation.mutate(id)}
              />
            ) : (
              <p className="py-4 text-center text-sm text-text-secondary">
                Nenhum cenário salvo ainda.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
