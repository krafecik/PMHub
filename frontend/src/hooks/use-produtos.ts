import { useQuery } from '@tanstack/react-query'
import { fetchProdutos } from '@/lib/products-api'

export function useListarProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
  })
}
