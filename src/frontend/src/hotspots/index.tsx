/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import { createRoot } from 'react-dom/client';
import {
  BG_COLOR,
  HIGH_IMPORTANCE_COLOR,
  HOVER_STROKE_COLOR,
  LOW_IMPORTANCE_COLOR,
  MID_IMPORTANCE_COLOR,
  ROOT_COLOR,
  STROKE_COLOR,
} from '../colours';
import { useMemo, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

const svgWidth = 800;
const svgHeight = 800;

const springConfig = {
  tension: 150,
  friction: 20,
};

function Hotspot({ data }: { data: TreeData }) {
  const root = useMemo(
    () => packData(data, { width: svgWidth, height: svgHeight }),
    [data]
  );

  const [focus, setFocus] = useState<d3.HierarchyCircularNode<TreeData>>(
    () => root
  );

  const [view, setView] = useState<[number, number, number]>(() => [
    root.x,
    root.y,
    root.r * 2,
  ]);

  const color = useMemo(
    () => (focus === root ? mkColor(root) : mkColorForFocus(focus)),
    [root, focus]
  );

  const handleNodeClick = (node: d3.HierarchyCircularNode<TreeData>) => {
    if (focus !== node && node.children) {
      setFocus(node);
      setView([node.x, node.y, node.r * 2 + 10]);
    } else {
      setFocus(root);
      setView([root.x, root.y, root.r * 2]);
    }
  };

  const handleSvgClick = () => {
    if (focus !== root) {
      setFocus(root);
      setView([root.x, root.y, root.r * 2]);
    }
  };

  // Calculate zoom transformation
  const zoomScale = svgWidth / view[2];
  const viewX = view[0];
  const viewY = view[1];

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`-${svgWidth / 2} -${svgHeight / 2} ${svgWidth} ${svgHeight}`}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 -14px',
        background: ROOT_COLOR,
        cursor: 'pointer',
      }}
      onClick={handleSvgClick}
    >
      <g>
        {root
          .descendants()
          .slice(1)
          .map(node => (
            <HotspotItem
              key={node.data.path}
              node={node}
              color={color}
              focus={focus}
              onNodeClick={handleNodeClick}
              zoomScale={zoomScale}
              viewX={viewX}
              viewY={viewY}
            />
          ))}
      </g>
      <g>
        {root.descendants().map(node => (
          <Label
            key={node.data.path}
            node={node}
            focus={focus}
            zoomScale={zoomScale}
            viewX={viewX}
            viewY={viewY}
          />
        ))}
      </g>
    </svg>
  );
}

function Label({
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

function HotspotItem({
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

export function visualizeHotspots(container: HTMLElement, dataElt: string) {
  const data = getData(dataElt);
  createRoot(container).render(<Hotspot data={data} />);
}

function getData(dataElt: string): TreeData {
  const dataElement = document.getElementById(dataElt);
  if (!dataElement) {
    throw new Error('Data element not found');
  }
  return JSON.parse(dataElement.textContent || '{}');
}

const packData = (
  data: TreeData,
  { width, height }: { width: number; height: number }
) => {
  function getComplexity(node: d3.HierarchyNode<TreeData>): number {
    if ('complexity' in node.data) {
      return node.data.complexity;
    }
    if ('children' in node.data) {
      return node.data.children.reduce(
        (acc, child) => acc + getComplexity({ data: child } as any),
        0
      );
    }
    throw new Error('Invalid node');
  }

  return d3.pack<TreeData>().size([width, height]).padding(3)(
    d3
      .hierarchy<TreeData>(data)
      .sum(d => ('complexity' in d ? d.complexity : 0))
      .sort((a, b) => getComplexity(b) - getComplexity(a))
  );
};

const mkColor = (root: d3.HierarchyCircularNode<TreeData>) => {
  const [min, max] = getColorDomain(root);
  const mid = (min + max) / 2;
  return d3
    .scaleLinear()
    .domain([min, mid, max])
    .range([
      LOW_IMPORTANCE_COLOR,
      MID_IMPORTANCE_COLOR,
      HIGH_IMPORTANCE_COLOR,
    ] as any)
    .interpolate(d3.interpolateHcl as any);
};

const getColorDomain = (
  root: d3.HierarchyCircularNode<TreeData>
): [number, number] => {
  const minRevisions = root
    .descendants()
    .reduce(
      (min, d) => Math.min(min, 'revisions' in d.data ? d.data.revisions : 0),
      Infinity
    );
  const maxRevisions = root
    .descendants()
    .reduce(
      (max, d) => Math.max(max, 'revisions' in d.data ? d.data.revisions : 0),
      -Infinity
    );
  return [minRevisions, maxRevisions];
};

// Add the mkColorForFocus function from the original implementation
const mkColorForFocus = (focusNode: d3.HierarchyCircularNode<TreeData>) => {
  const descendants = focusNode.descendants();
  const revisions = descendants
    .filter(d => 'revisions' in d.data)
    .map(d => (d.data as any).revisions);

  if (revisions.length === 0) {
    // If no revisions data, return a default scale
    return d3
      .scaleLinear()
      .domain([0, 1])
      .range([LOW_IMPORTANCE_COLOR, LOW_IMPORTANCE_COLOR] as any);
  }

  const min = Math.min(...revisions);
  const max = Math.max(...revisions);
  const mid = (min + max) / 2;

  return d3
    .scaleLinear()
    .domain([min, mid, max])
    .range([
      LOW_IMPORTANCE_COLOR,
      MID_IMPORTANCE_COLOR,
      HIGH_IMPORTANCE_COLOR,
    ] as any)
    .interpolate(d3.interpolateHcl as any);
};
