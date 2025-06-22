import type { Soc } from '@core/soc';
import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';

export function HotspotTooltip({
  node,
  zoomScale,
  viewX,
  viewY,
  soc,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  zoomScale: number;
  viewX: number;
  viewY: number;
  soc: Soc[];
}) {
  const x = (node.x - viewX) * zoomScale;
  const y = (node.y - viewY) * zoomScale;
  const padding = 4;
  const fontSize = 7;

  const socInfo = soc.find(s => `/${s.file}` === node.data.path);

  const lines = [node.data.path];
  if (socInfo) {
    lines.push(`SOC: ${socInfo.soc}`);
  }

  const maxLineWidth = Math.max(
    ...lines.map(line => line.length * fontSize * 0.6)
  );
  const textHeight = fontSize;
  const totalHeight = lines.length * (textHeight + 2) - 2;

  return (
    <g pointerEvents="none">
      <rect
        x={x - maxLineWidth / 2 - padding}
        y={y - totalHeight / 2 - padding}
        width={maxLineWidth + padding * 2}
        height={totalHeight + padding * 2}
        fill="black"
        fillOpacity="0.7"
        rx="3"
      />
      {lines.map((line, index) => (
        <text
          key={index}
          x={x}
          y={y - totalHeight / 2 + (index + 1) * (textHeight + 2) - 2}
          fill="white"
          textAnchor="middle"
          fontSize={`${fontSize}px`}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
