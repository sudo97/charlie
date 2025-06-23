import type { Node } from './coupled-pairs';
import { useSpring, animated } from '@react-spring/web';

export function CoupledPairsNode({
  node,
  // showLabels,
  onHover,
  onMouseLeave,
  isHighlighted,
  isDimmed,
  connectedToHighlighted,
}: {
  node: Node;
  // showLabels: boolean;
  onHover: (node: Node, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  connectedToHighlighted?: boolean;
}) {
  const angle = (node.x * 180) / Math.PI - 90;
  const transform = `rotate(${angle}) translate(${node.y}, 0)`;

  const getOpacity = () => {
    if (isHighlighted || connectedToHighlighted) return 1;
    if (isDimmed) return 0.3;
    return 0.8;
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    onHover(node, event);
  };

  const animatedProps = useSpring({
    opacity: getOpacity(),
    transform: transform,
    textX: angle > 90 ? -8 : 8,
    config: {
      tension: 170,
      friction: 26,
    },
  });

  return (
    <g>
      <animated.circle
        transform={animatedProps.transform}
        r={4}
        fill="#4f81bd"
        fillOpacity={animatedProps.opacity}
        stroke="#fff"
        strokeWidth={1.5}
        style={{ cursor: 'pointer' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      <animated.text
        transform={`${transform} ${angle > 90 ? 'rotate(180)' : ''}`}
        textAnchor={node.x > Math.PI ? 'end' : 'start'}
        x={animatedProps.textX}
        y={0}
        dy="0.35em"
        fontSize="10px"
        fontFamily="sans-serif"
        fill="#333"
        fillOpacity={animatedProps.opacity}
        style={{ pointerEvents: 'none' }}
      >
        {node.data.name}
      </animated.text>
      )
    </g>
  );
}
