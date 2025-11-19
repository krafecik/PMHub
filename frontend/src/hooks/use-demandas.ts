import { useQuery } from '@tanstack/react-query'
import { listarDemandas, ListarDemandasParams } from '@/lib/demandas-api'

export function useListarDemandas(params?: ListarDemandasParams) {
  return useQuery({
    queryKey: ['demandas', params],
    queryFn: () => listarDemandas(params || {}),
  })
}
