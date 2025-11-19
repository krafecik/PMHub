import '../src/styles/globals.css'
import type { Metadata } from 'next'
import { AppProvider } from '@/providers/app-provider'

export const metadata: Metadata = {
  title: 'PM Hub',
  description: 'ProductOps Hub para CPOs e PMs',
}

export const dynamic = 'force-dynamic'

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
