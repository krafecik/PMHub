'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link2, Plus } from 'lucide-react'
import type { DocumentoVinculo } from '@/types/documentacao'

interface VinculosDocumentoProps {
  vinculos: DocumentoVinculo[]
  onAdicionar?: () => void
  onAbrirVinculo?: (vinculo: DocumentoVinculo) => void
  titulo?: string
}

const LABELS: Record<string, string> = {
  DISCOVERY: 'Discovery',
  EPICO: 'Épico',
  FEATURE: 'Feature',
  DEMANDA: 'Demanda',
  RELEASE: 'Release',
}

export function VinculosDocumento({
  vinculos,
  onAdicionar,
  onAbrirVinculo,
  titulo,
}: VinculosDocumentoProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{titulo ?? 'Vínculos'}</h3>
          <p className="text-sm text-muted-foreground">
            Conecte o documento a descobertas, épicos, features ou demandas.
          </p>
        </div>
        {onAdicionar && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onAdicionar}>
            <Plus className="h-4 w-4" />
            Novo vínculo
          </Button>
        )}
      </div>

      {vinculos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhum vínculo registrado.
        </div>
      ) : (
        <div className="space-y-2">
          {vinculos.map((vinculo) => (
            <button
              key={vinculo.id}
              onClick={() => onAbrirVinculo?.(vinculo)}
              className="hover:border-primary/30 flex w-full items-center justify-between rounded-lg border border-transparent bg-muted/60 p-3 text-left transition hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="uppercase">
                  {LABELS[vinculo.tipoAlvo] ?? vinculo.tipoAlvo}
                </Badge>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary">ID {vinculo.idAlvo}</span>
                  {vinculo.descricao && (
                    <span className="text-xs text-muted-foreground">{vinculo.descricao}</span>
                  )}
                </div>
              </div>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
