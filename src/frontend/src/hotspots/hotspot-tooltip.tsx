import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';

export function HotspotTooltip({
  node,
  zoomScale,
  viewX,
  viewY,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  zoomScale: number;
  viewX: number;
  viewY: number;
}) {
  const x = (node.x - viewX) * zoomScale;
  const y = (node.y - viewY) * zoomScale;
  const padding = 4;
  const fontSize = 7;

  // Estimate text width (rough approximation)
  const textWidth = node.data.path.length * fontSize * 0.6;
  const textHeight = fontSize;

  return (
    <g pointerEvents="none">
      <rect
        x={x - textWidth / 2 - padding}
        y={y - textHeight / 2 - padding}
        width={textWidth + padding * 2}
        height={textHeight + padding * 2}
        fill="black"
        fillOpacity="0.7"
        rx="3"
      />
      <text
        x={x}
        y={y + fontSize / 3}
        fill="white"
        textAnchor="middle"
        fontSize={`${fontSize}px`}
      >
        {node.data.path}
      </text>
    </g>
  );
}
