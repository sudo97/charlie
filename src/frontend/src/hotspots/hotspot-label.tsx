import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import { useSpring, animated } from '@react-spring/web';
import { springConfig } from './spring-config';

export function Label({
  node,
  focus,
  zoomScale,
  viewX,
  viewY,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  focus: d3.HierarchyCircularNode<TreeData>;
  zoomScale: number;
  viewX: number;
  viewY: number;
}) {
  // Apply zoom transformation to label position
  const targetX = (node.x - viewX) * zoomScale;
  const targetY = (node.y - viewY) * zoomScale;

  const springProps = useSpring({
    x: targetX,
    y: targetY,
    config: springConfig,
  });

  return (
    <animated.text
      style={{
        font: '10px sans-serif',
        fill: 'black',
      }}
      pointerEvents="none"
      textAnchor="middle"
      x={springProps.x}
      y={springProps.y}
      display={node.parent === focus ? 'inline' : 'none'}
    >
      {node.data.name}
    </animated.text>
  );
}
