import type { TooltipData } from './coupled-pairs';

export function CoupledPairsTooltip({ tooltip }: { tooltip: TooltipData }) {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: tooltip.x + 10,
    top: tooltip.y - 10,
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    zIndex: 1000,
    maxWidth: '300px',
  };

  if (tooltip.link) {
    return (
      <div style={style}>
        <strong>Coupling</strong>
        <br />
        {tooltip.link.source.data.name} ↔ {tooltip.link.target.data.name}
        <br />
        Strength: {(tooltip.link.value * 100).toFixed(1)}%<br />
        Revisions: {tooltip.link.revisions}
      </div>
    );
  }

  if (tooltip.node) {
    return (
      <div style={style}>
        <strong>{tooltip.node.data.name}</strong>
        <br />
        Path: {tooltip.node.data.path}
        <br />
        Connections: {tooltip.connections || 0}
      </div>
    );
  }

  return null;
}
