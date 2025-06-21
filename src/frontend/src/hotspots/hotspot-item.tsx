import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import {
  BG_COLOR,
  HOVER_STROKE_COLOR,
  LOW_IMPORTANCE_COLOR,
  STROKE_COLOR,
} from '../colours';
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { springConfig } from './spring-config';

export function HotspotItem({
  node,
  color,
  focus,
  onNodeClick,
  zoomScale,
  viewX,
  viewY,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  color: d3.ScaleLinear<number, number, never>;
  focus: d3.HierarchyCircularNode<TreeData>;
  onNodeClick: (node: d3.HierarchyCircularNode<TreeData>) => void;
  zoomScale: number;
  viewX: number;
  viewY: number;
}) {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const { x, y, r, fillColor } = useSpring({
    x: (node.x - viewX) * zoomScale,
    y: (node.y - viewY) * zoomScale,
    r: node.r * zoomScale,
    fillColor: getTargetFillColor(node, focus, color),
    config: springConfig,
  });

  return (
    <animated.circle
      key={node.data.name}
      cx={x}
      cy={y}
      r={r}
      stroke={isHovering ? HOVER_STROKE_COLOR : STROKE_COLOR}
      fill={fillColor}
      style={{
        cursor: node.children ? 'pointer' : 'default',
        pointerEvents: node.children ? 'auto' : 'none',
      }}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      onClick={handleClick}
    />
  );
}

function getTargetFillColor(
  node: d3.HierarchyCircularNode<TreeData>,
  focus: d3.HierarchyCircularNode<TreeData>,
  color: d3.ScaleLinear<number, number, never>
) {
  if (node.children) return BG_COLOR;

  if (focus !== focus.ancestors()[focus.ancestors().length - 1]) {
    const focusDescendants = new Set(focus.descendants());
    if (!focusDescendants.has(node)) {
      return LOW_IMPORTANCE_COLOR;
    }
  }

  const revisions = 'revisions' in node.data ? node.data.revisions : 0;

  return `${color(revisions)}`;
}
