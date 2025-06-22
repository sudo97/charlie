import type { TooltipData } from './coupled-pairs';

export function CoupledPairsTooltip({
  tooltip,
  svgWidth,
  svgHeight,
}: {
  tooltip: TooltipData;
  svgWidth: number;
  svgHeight: number;
}) {
  // Convert screen coordinates to SVG coordinates
  const x = tooltip.x - svgWidth / 2;
  const y = tooltip.y - svgHeight / 2;

  let content: string[] = [];

  if (tooltip.link) {
    content = [
      'Coupling',
      `${tooltip.link.source.data.path}`,
      `${tooltip.link.target.data.path}`,
      `Strength: ${(tooltip.link.value * 100).toFixed(1)}%`,
      `Revisions: ${tooltip.link.revisions}`,
    ];
  } else if (tooltip.node) {
    content = [
      tooltip.node.data.name,
      `Path: ${tooltip.node.filePath}`,
      `Connections: ${tooltip.connections || 0}`,
    ];
  }

  if (content.length === 0) return null;

  const padding = 8;
  const lineHeight = 16;
  const fontSize = 12;
  const maxWidth = 300;

  // Estimate text width (rough approximation)
  const textWidth = Math.min(
    maxWidth,
    Math.max(...content.map(line => line.length * fontSize))
  );
  const rectWidth = textWidth + padding * 2;
  const rectHeight = content.length * lineHeight + padding * 2;

  // Adjust position to keep tooltip in view
  let adjustedX = x + 10;
  let adjustedY = y - 10;

  // Keep tooltip within SVG bounds
  if (adjustedX + rectWidth > svgWidth / 2) {
    adjustedX = x - rectWidth - 10;
  }
  if (adjustedY - rectHeight < -svgHeight / 2) {
    adjustedY = y + 20;
  }

  return (
    <g>
      {/* Background rectangle */}
      <rect
        x={adjustedX}
        y={adjustedY - rectHeight}
        width={rectWidth}
        height={rectHeight}
        fill="rgba(0, 0, 0, 0.8)"
        rx={4}
        ry={4}
        style={{ pointerEvents: 'none' }}
      />

      {/* Text content */}
      {content.map((line, index) => (
        <text
          key={index}
          x={adjustedX + padding}
          y={adjustedY - rectHeight + padding + fontSize + index * lineHeight}
          fill="white"
          fontSize={fontSize}
          fontFamily="sans-serif"
          fontWeight={index === 0 ? 'bold' : 'normal'}
          style={{ pointerEvents: 'none' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
