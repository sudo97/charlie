/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import type { TreeData } from "@core/tree-data";

function getData(): TreeData {
  const dataElement = document.getElementById("data");
  if (!dataElement) {
    throw new Error("Data element not found");
  }
  return JSON.parse(dataElement.textContent || "{}");
}

const bgColor = "hsla(186, 53.40%, 49.60%, 0.62)";

const getColor = (min: number, max: number) =>
  d3
    .scaleLinear()
    .domain([min, max])
    .range(["hsl(152,80%,80%)", "hsl(24, 88.90%, 57.60%)"] as any)
    .interpolate(d3.interpolateHcl as any);

const getSvgRoot = ({ width, height }: { width: number; height: number }) => {
  return (
    d3
      .create("svg")
      // .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr(
        "style",
        `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${bgColor}; cursor: pointer;`
      )
  );
};

const packData = (
  data: TreeData,
  { width, height }: { width: number; height: number }
) => {
  function getRevisions(node: d3.HierarchyNode<TreeData>): number {
    if ("revisions" in node.data) {
      return node.data.revisions;
    }
    // return 0;
    if ("children" in node.data) {
      return node.data.children.reduce(
        (acc, child) => acc + getRevisions({ data: child } as any),
        0
      );
    }
    throw new Error("Invalid node");
  }

  return d3.pack<TreeData>().size([width, height]).padding(3)(
    d3
      .hierarchy<TreeData>(data)
      .sum((d) => ("revisions" in d ? d.revisions : 0))
      .sort((a, b) => getRevisions(b) - getRevisions(a))
  );
};

const getColorDomain = (
  root: d3.HierarchyCircularNode<TreeData>
): [number, number] => {
  const minComplexity = root
    .descendants()
    .reduce(
      (min, d) => Math.min(min, "complexity" in d.data ? d.data.complexity : 0),
      Infinity
    );
  const maxComplexity = root
    .descendants()
    .reduce(
      (max, d) => Math.max(max, "complexity" in d.data ? d.data.complexity : 0),
      -Infinity
    );
  return [minComplexity, maxComplexity];
};

function getSvg(data: TreeData) {
  const width = 928;
  const height = 928;

  const svg = getSvgRoot({ width, height });

  const root = packData(data, { width, height });

  const [minComplexity, maxComplexity] = getColorDomain(root);

  const color = getColor(minComplexity, maxComplexity);

  const strokeColor = "#aaa";
  const hoverColor = "#000";

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", (d) => {
      if (d.children) return "hsla(186, 80.40%, 80.00%, 0.30)";
      const complexity = "complexity" in d.data ? d.data.complexity : 0;
      return color(complexity);
    })
    .attr("pointer-events", (d) => (!d.children ? "none" : null))
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r)
    .attr("stroke", strokeColor)
    .on("mouseover", function () {
      d3.select(this).attr("stroke", hoverColor);
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", strokeColor);
    })
    .on("click", (event, d) => {
      return focus !== d && (zoom(event, d), event.stopPropagation());
    });

  let focus: d3.HierarchyCircularNode<TreeData> = root;
  let view: [number, number, number] = [+focus.x, +focus.y, focus.r * 2];

  const label = svg
    .append("g")
    .style("font", "10px sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
    .style("display", (d) => (d.parent === root ? "inline" : "none"))
    .text((d: d3.HierarchyCircularNode<TreeData>) => d.data.name);

  svg.on("click", (event) => zoom(event, root));

  function zoomTo(v: [number, number, number]) {
    const k = width / v[2];

    view = v;

    label.attr("x", (d) => (d.x - v[0]) * k).attr("y", (d) => (d.y - v[1]) * k);

    node
      .attr("cx", (d) => (d.x - v[0]) * k)
      .attr("cy", (d) => (d.y - v[1]) * k)
      .attr("r", (d) => d.r * k);
  }

  function zoom(event: any, d: d3.HierarchyCircularNode<TreeData>) {
    focus = d;

    const transition = svg
      .transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return (t) => zoomTo(i(t));
      });

    label
      .filter(function (d) {
        return (
          d.parent === focus ||
          (this as SVGTextElement).style.display === "inline"
        );
      })
      .transition(transition as any)
      .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
      .on("start", function (d) {
        if (d.parent === focus)
          (this as SVGTextElement).style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus) (this as SVGTextElement).style.display = "none";
      });
  }

  return svg.node();
}

export function visualizeHotspots(container: HTMLElement) {
  const data = getData();
  const svg = getSvg(data);
  if (svg === null) throw new Error("Failed to create SVG");
  container.appendChild(svg);
}
