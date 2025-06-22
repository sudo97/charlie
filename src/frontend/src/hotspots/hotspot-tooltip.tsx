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
  return (
    <text
      x={(node.x - viewX) * zoomScale}
      y={(node.y - viewY) * zoomScale}
      fill="black"
      display="inline"
      pointerEvents="none"
      textAnchor="middle"
      fontSize="10px"
    >
      {node.data.path}
    </text>
  );
}
