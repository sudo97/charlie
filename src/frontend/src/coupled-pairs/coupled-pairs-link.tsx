import * as d3 from 'd3';
import type { Link } from './coupled-pairs';

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

  const getStrokeOpacity = () => {
    if (isHighlighted) return 0.8;
    if (isDimmed) return 0.1;
    return Math.max(0.2, link.value);
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    onHover(link, event);
  };

  return (
    <path
      d={pathString || ''}
      stroke="#4f81bd"
      strokeWidth={Math.max(1, link.value * 4)}
      strokeOpacity={getStrokeOpacity()}
      fill="none"
      style={{ cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
