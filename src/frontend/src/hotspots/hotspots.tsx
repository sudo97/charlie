/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeData } from '@core/tree-data';
import * as d3 from 'd3';
import {
  HIGH_IMPORTANCE_COLOR,
  LOW_IMPORTANCE_COLOR,
  MID_IMPORTANCE_COLOR,
  ROOT_COLOR,
} from '../colours';
import { useCallback, useMemo, useState } from 'react';
import { HotspotItem } from './hotspot-item';
import { Label } from './hotspot-label';

export function Hotspots({ data }: { data: TreeData }) {
  const svgWidth = 800;
  const svgHeight = 800;
  const root = useMemo(
    () => packData(data, { width: svgWidth, height: svgHeight }),
    [data]
  );
  const items = useMemo(() => root.descendants(), [root]);

  const [focus, setFocus] = useState<d3.HierarchyCircularNode<TreeData>>(root);

  const view = {
    width: focus.x,
    height: focus.y,
    radius: focus.r * 2 + 10,
  };

  const color = focus === root ? mkColor(root) : mkColorForFocus(focus);

  const handleNodeClick = useCallback(
    (node: d3.HierarchyCircularNode<TreeData>) =>
      setFocus(focus !== node && node.children ? node : root),
    [focus, root]
  );

  const handleSvgClick = useCallback(() => setFocus(root), []);

  const zoomScale = svgWidth / view.radius;
  const viewX = view.width;
  const viewY = view.height;

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
        {items.map(node => (
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
        {items.map(node => (
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
        (acc, child) =>
          acc + getComplexity({ data: child } as d3.HierarchyNode<TreeData>),
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
