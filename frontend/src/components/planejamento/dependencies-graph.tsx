'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import type { PlanejamentoDependencia } from '@/lib/planejamento-api'

interface DependenciesGraphProps {
  dependencias: PlanejamentoDependencia[]
  featuresMap: Record<string, { titulo: string; status?: string }>
}

export function DependenciesGraph({ dependencias, featuresMap }: DependenciesGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []

    dependencias.forEach((dep) => {
      const featureBloqueada = featuresMap[dep.featureBloqueadaId]
      const featureBloqueadora = featuresMap[dep.featureBloqueadoraId]

      if (!featureBloqueada || !featureBloqueadora) return

      // Criar nós se não existirem
      if (!nodeMap.has(dep.featureBloqueadaId)) {
        nodeMap.set(dep.featureBloqueadaId, {
          id: dep.featureBloqueadaId,
          type: 'default',
          data: {
            label: featureBloqueada.titulo,
            status: featureBloqueada.status,
          },
          position: { x: 0, y: 0 },
        })
      }

      if (!nodeMap.has(dep.featureBloqueadoraId)) {
        nodeMap.set(dep.featureBloqueadoraId, {
          id: dep.featureBloqueadoraId,
          type: 'default',
          data: {
            label: featureBloqueadora.titulo,
            status: featureBloqueadora.status,
          },
          position: { x: 0, y: 0 },
        })
      }

      // Criar aresta
      const edgeColor =
        dep.risco === 'CRITICO'
          ? '#ef4444'
          : dep.risco === 'ALTO'
            ? '#f59e0b'
            : dep.risco === 'MEDIO'
              ? '#3b82f6'
              : '#6b7280'

      edgeList.push({
        id: dep.id,
        source: dep.featureBloqueadoraId,
        target: dep.featureBloqueadaId,
        type: 'smoothstep',
        animated: dep.risco === 'CRITICO',
        style: { stroke: edgeColor, strokeWidth: dep.risco === 'CRITICO' ? 3 : 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
        label: dep.tipo,
        labelStyle: { fill: edgeColor, fontWeight: 600 },
      })
    })

    // Layout simples: organizar nós em camadas
    const nodesArray = Array.from(nodeMap.values())
    const layerMap = new Map<string, number>()

    // Calcular camadas (níveis de dependência)
    const calculateLayers = () => {
      const visited = new Set<string>()
      const queue: Array<{ id: string; layer: number }> = []

      // Encontrar nós sem dependências (raízes)
      const rootNodes = nodesArray.filter(
        (node) => !edgeList.some((edge) => edge.target === node.id),
      )

      rootNodes.forEach((node) => {
        queue.push({ id: node.id, layer: 0 })
        layerMap.set(node.id, 0)
        visited.add(node.id)
      })

      // BFS para calcular camadas
      while (queue.length > 0) {
        const { id, layer } = queue.shift()!

        edgeList
          .filter((edge) => edge.source === id)
          .forEach((edge) => {
            const newLayer = layer + 1
            if (!visited.has(edge.target)) {
              layerMap.set(edge.target, newLayer)
              visited.add(edge.target)
              queue.push({ id: edge.target, layer: newLayer })
            } else {
              // Atualizar camada se necessário
              const currentLayer = layerMap.get(edge.target) || 0
              if (newLayer > currentLayer) {
                layerMap.set(edge.target, newLayer)
              }
            }
          })
      }

      // Garantir que todos os nós tenham uma camada
      nodesArray.forEach((node) => {
        if (!layerMap.has(node.id)) {
          layerMap.set(node.id, 0)
        }
      })
    }

    calculateLayers()

    // Organizar posições
    const layers: Record<number, Node[]> = {}
    nodesArray.forEach((node) => {
      const layer = layerMap.get(node.id) || 0
      if (!layers[layer]) layers[layer] = []
      layers[layer].push(node)
    })

    // Posicionar nós
    Object.entries(layers).forEach(([layerStr, layerNodes]) => {
      const layer = parseInt(layerStr)
      const spacing = 250
      const startX = layer * 400
      const totalHeight = layerNodes.length * spacing
      const startY = -totalHeight / 2

      layerNodes.forEach((node, index) => {
        node.position = {
          x: startX,
          y: startY + index * spacing,
        }
      })
    })

    return { nodes: nodesArray, edges: edgeList }
  }, [dependencias, featuresMap])

  const nodeTypes = useMemo(
    () => ({
      default: ({ data }: { data: { label: string; status?: string } }) => {
        const statusColor =
          data.status === 'BLOCKED'
            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
            : data.status === 'IN_PROGRESS'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : data.status === 'DONE'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-white dark:bg-slate-900'

        return (
          <div className={`min-w-[200px] rounded-lg border-2 p-3 shadow-md ${statusColor}`}>
            <div className="text-sm font-semibold text-text-primary">{data.label}</div>
            {data.status && <div className="mt-1 text-xs text-text-muted">{data.status}</div>}
          </div>
        )
      },
    }),
    [],
  )

  return (
    <Card variant="outline" className="h-[600px] w-full p-4">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status
            if (status === 'BLOCKED') return '#ef4444'
            if (status === 'IN_PROGRESS') return '#3b82f6'
            if (status === 'DONE') return '#10b981'
            return '#6b7280'
          }}
          className="bg-background"
        />
      </ReactFlow>
    </Card>
  )
}
