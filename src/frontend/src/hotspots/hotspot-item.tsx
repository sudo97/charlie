import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import {
  BG_COLOR,
  HOVER_STROKE_COLOR,
  LOW_IMPORTANCE_COLOR,
  STROKE_COLOR,
} from '../colours';
import { useMemo, useState } from 'react';
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
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);

  const targetFillColor = useMemo(() => {
    if (node.children) return BG_COLOR;

    if (focus !== focus.ancestors()[focus.ancestors().length - 1]) {
      const focusDescendants = new Set(focus.descendants());
      if (!focusDescendants.has(node)) {
        return LOW_IMPORTANCE_COLOR;
      }
    }

    const revisions = 'revisions' in node.data ? node.data.revisions : 0;

    return `${color(revisions)}`;
  }, [node, color, focus]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const targetX = (node.x - viewX) * zoomScale;
  const targetY = (node.y - viewY) * zoomScale;
  const targetR = node.r * zoomScale;

  const springProps = useSpring({
    x: targetX,
    y: targetY,
    r: targetR,
    fillColor: targetFillColor,
    config: springConfig,
  });

  return (
    <animated.circle
      key={node.data.name}
      cx={springProps.x}
      cy={springProps.y}
      r={springProps.r}
      stroke={strokeColor}
      fill={springProps.fillColor}
      style={{
        cursor: node.children ? 'pointer' : 'default',
        pointerEvents: node.children ? 'auto' : 'none',
      }}
      onMouseOver={() => setStrokeColor(HOVER_STROKE_COLOR)}
      onMouseOut={() => setStrokeColor(STROKE_COLOR)}
      onClick={handleClick}
    />
  );
}
