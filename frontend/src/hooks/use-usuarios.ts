import { useQuery } from '@tanstack/react-query'
import { listUsers } from '@/lib/auth-api'

export interface Usuario {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

async function listarUsuarios(): Promise<Usuario[]> {
  const usuarios = await listUsers()
  return usuarios.map((usuario) => ({
    id: usuario.id,
    name: usuario.nome,
    email: usuario.email,
    role: usuario.tenants[0]?.role ?? 'PM',
    active: usuario.status === 'ACTIVE',
  }))
}

export function useListarUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: listarUsuarios,
  })
}
