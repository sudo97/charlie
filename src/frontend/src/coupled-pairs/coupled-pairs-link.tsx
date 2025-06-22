import * as d3 from 'd3';
import type { Link } from './coupled-pairs';
import { useSpring, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

export function CoupledPairsLink({
  link,
  tension,
  onHover,
  onMouseLeave,
  isHighlighted,
  isDimmed,
}: {
  link: Link;
  tension: number;
  onHover: (link: Link, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);

  // Create radial line generator for edges
  const line = d3
    .lineRadial<[number, number]>()
    .curve(d3.curveBundle.beta(tension))
    .radius(d => d[1])
    .angle(d => d[0]);

  const path: [number, number][] = [
    [link.source.x, link.source.y],
    [link.source.x, link.source.y],
    [0, 0],
    [link.target.x, link.target.y],
    [link.target.x, link.target.y],
  ];

  const pathString = line(path);

  // Calculate path length for animation
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [pathString]);

  // Animation for path drawing
  const pathAnimation = useSpring({
    from: { dashOffset: pathLength },
    to: { dashOffset: 0 },
    config: { duration: 800, tension: 120, friction: 20 },
  });

  // Animation for highlighting states
  const styleAnimation = useSpring({
    strokeOpacity: isHighlighted
      ? 0.8
      : isDimmed
        ? 0.1
        : Math.max(0.2, link.value),
    strokeWidth: Math.max(1, link.value * 4),
    config: { duration: 200 },
  });

  const handleMouseEnter = (event: React.MouseEvent) => {
    onHover(link, event);
  };

  return (
    <animated.path
      ref={pathRef}
      d={pathString || ''}
      stroke="#4f81bd"
      strokeWidth={styleAnimation.strokeWidth}
      strokeOpacity={styleAnimation.strokeOpacity}
      strokeDasharray={pathLength}
      strokeDashoffset={pathAnimation.dashOffset}
      fill="none"
      style={{ cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
