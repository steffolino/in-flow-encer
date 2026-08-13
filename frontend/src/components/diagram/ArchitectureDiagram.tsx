import { useMemo, useState } from 'react'
import {
  ARCHITECTURE_EDGES,
  ARCHITECTURE_NODES,
  type ArchitectureNodeData,
  type ArchitectureNodeId,
} from './architectureDiagram.data'
import { DetailPanel } from './DetailPanel'

const NODE_POSITIONS: Record<ArchitectureNodeId, { x: number; y: number }> = {
  api: { x: 50, y: 10 },
  ingestion: { x: 27, y: 28 },
  analytics: { x: 50, y: 28 },
  overlays: { x: 73, y: 28 },
  repositories: { x: 50, y: 47 },
  domain: { x: 50, y: 62 },
  postgis: { x: 50, y: 77 },
  connector: { x: 76, y: 8 },
}

function nodeById(id: ArchitectureNodeId): ArchitectureNodeData {
  const node = ARCHITECTURE_NODES.find((item) => item.id === id)
  if (!node) throw new Error(`Missing architecture node "${id}"`)
  return node
}

function edgePath(sourceId: ArchitectureNodeId, targetId: ArchitectureNodeId): string {
  const source = NODE_POSITIONS[sourceId]
  const target = NODE_POSITIONS[targetId]
  const midY = (source.y + target.y) / 2
  return `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`
}

function ArchitectureChip({
  node,
  selected,
  onSelect,
}: {
  node: ArchitectureNodeData
  selected: boolean
  onSelect: (id: ArchitectureNodeId) => void
}): React.JSX.Element {
  const Icon = node.icon
  const position = NODE_POSITIONS[node.id]

  return (
    <button
      type="button"
      className={`architecture-chip architecture-chip--${node.accent}${selected ? ' architecture-chip--selected' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      aria-pressed={selected}
      onClick={() => {
        onSelect(node.id)
      }}
    >
      <span className="architecture-chip-icon" aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="architecture-chip-label">{node.label}</span>
      {node.badgeLabel && <span className="architecture-chip-badge">{node.badgeLabel}</span>}
    </button>
  )
}

export function ArchitectureDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<ArchitectureNodeId | null>(null)
  const selectedNode = selectedId ? nodeById(selectedId) : null

  const ariaDescription = useMemo(
    () =>
      ARCHITECTURE_EDGES.map((edge) => `${nodeById(edge.source).label} to ${nodeById(edge.target).label}`).join(', '),
    [],
  )

  const toggleSelected = (id: ArchitectureNodeId): void => {
    setSelectedId((current) => (current === id ? null : id))
  }

  return (
    <div className="architecture-diagram">
      <div
        className={`architecture-stage${selectedNode ? ' architecture-stage--drawer-open' : ''}`}
        role="group"
        aria-label={`Backend architecture diagram. Dependency paths: ${ariaDescription}. Select a chip for details.`}
      >
        <div className="architecture-map">
          <svg className="architecture-edges" viewBox="0 0 100 86" aria-hidden="true" focusable="false">
            {ARCHITECTURE_EDGES.map((edge) => (
              <path
                key={edge.id}
                className={`architecture-edge${edge.future ? ' architecture-edge--future' : ''}`}
                d={edgePath(edge.source, edge.target)}
              />
            ))}
          </svg>
          {ARCHITECTURE_NODES.map((node) => (
            <ArchitectureChip
              key={node.id}
              node={node}
              selected={node.id === selectedId}
              onSelect={toggleSelected}
            />
          ))}
        </div>

        {selectedNode && (
          <aside className="architecture-detail-drawer" aria-label="Selected architecture detail">
            <button
              type="button"
              className="architecture-detail-close"
              aria-label="Close architecture detail"
              onClick={() => {
                setSelectedId(null)
              }}
            >
              x
            </button>
            <DetailPanel
              eyebrow={selectedNode.badgeLabel ? 'Selected future piece' : 'Selected layer'}
              label={selectedNode.label}
              detail={selectedNode.detail}
              icon={selectedNode.icon}
              accent={selectedNode.accent}
              badgeLabel={selectedNode.badgeLabel}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
