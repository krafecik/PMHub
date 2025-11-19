import { useQuery } from '@tanstack/react-query'
import { listarSquads, PlanejamentoSquad } from '@/lib/planejamento-api'

export function useListarSquads() {
  return useQuery<PlanejamentoSquad[]>({
    queryKey: ['squads'],
    queryFn: listarSquads,
  })
}
