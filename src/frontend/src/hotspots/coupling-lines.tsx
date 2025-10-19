import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import type { CouplingItem } from '@core/coupling';

interface CouplingLinesProps {
  hoveredNode: d3.HierarchyCircularNode<TreeData> | null;
  allNodes: d3.HierarchyCircularNode<TreeData>[];
  couplingData: CouplingItem[];
  zoomScale: number;
  viewX: number;
  viewY: number;
}

export function CouplingLines({
  hoveredNode,
  allNodes,
  couplingData,
  zoomScale,
  viewX,
  viewY,
}: CouplingLinesProps) {
  // Only show lines for file nodes (not folders)
  if (!hoveredNode || hoveredNode.children) {
    return null;
  }

  // Find coupling data for the hovered file
  const couplingItem = couplingData.find(
    item => item.file === hoveredNode.data.path.replace(/^\//, '')
  );
  if (!couplingItem) return null;

  // Get top 10 most coupled files to avoid visual clutter
  const topCoupledFiles = couplingItem.coupledFiles
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 20);

  return (
    <g>
      {topCoupledFiles.map(coupled => {
        // Find the target node in the tree
        const targetNode = allNodes.find(
          node => node.data.path.replace(/^\//, '') === coupled.file
        );
        if (!targetNode) return null;

        // Calculate line coordinates
        const x1 = (hoveredNode.x - viewX) * zoomScale;
        const y1 = (hoveredNode.y - viewY) * zoomScale;
        const x2 = (targetNode.x - viewX) * zoomScale;
        const y2 = (targetNode.y - viewY) * zoomScale;

        // Line thickness based on coupling strength (1-5px)
        const strokeWidth = Math.max(1, Math.min(5, coupled.percentage * 10));

        return (
          <line
            key={coupled.file}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#ff6b6b"
            strokeWidth={strokeWidth}
            strokeOpacity={0.7}
            strokeDasharray="5,5"
            style={{
              pointerEvents: 'none', // Don't interfere with hover events
            }}
          />
        );
      })}
    </g>
  );
}
