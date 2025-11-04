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
  const topCoupledFiles = couplingItem.coupledFiles.sort(
    (a, b) => b.percentage - a.percentage
  );

  return (
    <g>
      {topCoupledFiles.map(coupled => {
        // Find the target node in the tree
        const targetNode = allNodes.find(
          node => node.data.path.replace(/^\//, '') === coupled.file
        );
        if (!targetNode) return null;

        // Calculate line coordinates
        // First, get the center coordinates in screen space
        const center1X = (hoveredNode.x - viewX) * zoomScale;
        const center1Y = (hoveredNode.y - viewY) * zoomScale;
        const center2X = (targetNode.x - viewX) * zoomScale;
        const center2Y = (targetNode.y - viewY) * zoomScale;

        // Calculate the direction vector between centers
        const dx = center2X - center1X;
        const dy = center2Y - center1Y;

        // Calculate the distance between centers
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the unit vector
        const unitX = dx / distance;
        const unitY = dy / distance;

        // Scale the radii by zoom (if radius is in world coordinates)
        const radius1 = hoveredNode.r * zoomScale;

        // Calculate edge points
        const startX = center1X + unitX * radius1;
        const startY = center1Y + unitY * radius1;
        const endX = center2X;
        const endY = center2Y;

        const strokeWidth = 3;

        return (
          <line
            key={coupled.file}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
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
