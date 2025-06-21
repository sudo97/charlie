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

const svgWidth = 800;
const svgHeight = 800;

function Hotspots({ data }: { data: TreeData }) {
  const [root] = useState(() =>
    packData(data, { width: svgWidth, height: svgHeight })
  );

  const color = useMemo(() => mkColor(root), [root]);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 -14px',
        background: ROOT_COLOR,
        cursor: 'pointer',
      }}
    >
      <g>
        {root
          .descendants()
          .slice(1)
          .map(node => (
            <HotspotItem key={node.data.path} node={node} color={color} />
          ))}
      </g>
      <g>
        {root.descendants().map(node => (
          <Labels key={node.data.path} node={node} root={root} />
        ))}
      </g>
    </svg>
  );
}

function Labels({
  node,
  root,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  root: d3.HierarchyCircularNode<TreeData>;
}) {
  return (
    <text
      style={{
        font: '10px sans-serif',
        fill: 'black',
      }}
      pointerEvents="none"
      textAnchor="middle"
      x={node.x}
      y={node.y}
      display={node.parent === root ? 'inline' : 'none'}
    >
      {node.data.name}
    </text>
  );
}

function HotspotItem({
  node,
  color,
}: {
  node: d3.HierarchyCircularNode<TreeData>;
  color: d3.ScaleLinear<number, number, never>;
}) {
  const fillColor =
    'revisions' in node.data ? `${color(node.data.revisions)}` : BG_COLOR;
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);

  return (
    <circle
      key={node.data.name}
      cx={node.x}
      cy={node.y}
      r={node.r}
      stroke={strokeColor}
      fill={fillColor}
      onMouseOver={() => setStrokeColor(HOVER_STROKE_COLOR)}
      onMouseOut={() => setStrokeColor(STROKE_COLOR)}
    />
  );
}

export function visualizeHotspots(container: HTMLElement, dataElt: string) {
  const data = getData(dataElt);
  createRoot(container).render(<Hotspots data={data} />);
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
