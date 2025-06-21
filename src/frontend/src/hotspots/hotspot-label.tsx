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
  const { x, y } = useSpring({
    x: (node.x - viewX) * zoomScale,
    y: (node.y - viewY) * zoomScale,
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
      x={x}
      y={y}
      display={node.parent === focus ? 'inline' : 'none'}
    >
      {node.data.name}
    </animated.text>
  );
}
