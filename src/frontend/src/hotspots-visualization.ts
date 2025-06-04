import * as d3 from "d3";
import type { TreeData, Folder, File } from "@core/tree-data";
import type { HierarchyNode as D3HierarchyNode } from "d3";

interface HierarchyNode<Datum> extends D3HierarchyNode<Datum> {
  r?: number;
}

export class HotspotsVisualization {
  private data: TreeData | null = null;
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private circle: d3.Selection<
    SVGCircleElement,
    HierarchyNode<TreeData>,
    SVGGElement,
    unknown
  > | null = null;
  private text: d3.Selection<
    SVGTextElement,
    HierarchyNode<TreeData>,
    SVGGElement,
    unknown
  > | null = null;
  private node: d3.Selection<
    SVGCircleElement | SVGTextElement,
    HierarchyNode<TreeData>,
    SVGGElement,
    unknown
  > | null = null;
  private root: HierarchyNode<TreeData> | null = null;
  private focus: HierarchyNode<TreeData> | null = null;
  private view: [number, number, number] | null = null;
  private width = 800;
  private height = 600;
  private margin = 20;

  constructor() {
    this.container = document.getElementById("visualization") as HTMLElement;
    if (!this.container) {
      console.error(
        "Hotspots visualization container 'visualization' not found"
      );
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    // Fallback: try to get data from script tag (for backward compatibility)
    const dataElement = document.getElementById("data");
    if (dataElement) {
      try {
        const parsedData = JSON.parse(dataElement.textContent || "{}");
        if (parsedData && typeof parsedData === "object") {
          this.data = parsedData;
          this.render();
          return;
        }
      } catch (error) {
        console.error("Failed to parse data from script tag:", error);
      }
    }

    this.showError("No data found");
  }

  private render(): void {
    if (!this.data || !this.container) {
      this.showError("Invalid data or container");
      return;
    }

    try {
      this.container.innerHTML = ""; // Clear any existing content
      this.createVisualization();
    } catch (error) {
      console.error("Failed to render visualization:", error);
      this.showError("Failed to render visualization");
    }
  }

  private createVisualization(): void {
    if (!this.data || !this.container) return;

    // Create SVG
    this.svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "#f9f9f9")
      .style("cursor", "pointer") as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;

    // Create main group centered in the SVG
    if (this.svg) {
      this.g = this.svg
        .append("g")
        .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);
    }

    // Create hierarchy
    this.root = d3
      .hierarchy(this.data)
      .sum((d) =>
        "revisions" in d ? d.revisions : 0
      ) as HierarchyNode<TreeData>;

    if (!this.root) {
      this.showError("Failed to create data hierarchy");
      return;
    }

    // Create pack layout with margin
    const pack = d3
      .pack<TreeData>()
      .size([this.width - this.margin, this.height - this.margin])
      .padding(3);

    // Apply pack layout
    pack(this.root);

    // Set initial focus
    this.focus = this.root;

    // Find min and max complexity for color scale
    const allNodes = this.root.descendants();
    const complexityValues = allNodes
      .filter((d) => "complexity" in d.data && d.data.complexity !== undefined)
      .map((d) => (d.data as File).complexity);

    if (complexityValues.length === 0) {
      this.showError("No complexity data found");
      return;
    }

    const minComplexity = Math.min(...complexityValues);
    const maxComplexity = Math.max(...complexityValues);

    // Create color scale based on complexity (green to red)
    const color = d3
      .scaleSequential(d3.interpolateRdYlGn)
      .domain([maxComplexity, minComplexity]); // Reversed domain: high complexity = red, low = green

    // Add circles
    this.circle = this.g!.selectAll<SVGCircleElement, HierarchyNode<TreeData>>(
      "circle"
    )
      .data(
        this.root.descendants().filter((d) => d !== null && d !== undefined)
      )
      .join("circle")
      .attr("class", (d: HierarchyNode<TreeData>) =>
        d?.parent
          ? d.children
            ? "node"
            : "node node--leaf"
          : "node node--root"
      )
      .style("fill", (d: HierarchyNode<TreeData>) => {
        if (d?.children) {
          // Container nodes get a light color based on depth
          return d3.interpolateBlues(0.3 + d.depth * 0.1);
        } else {
          // Use complexity for color, fallback to light gray for nodes without complexity
          const data = d?.data as File | Folder;
          if (data && "complexity" in data && data.complexity !== undefined) {
            return color(data.complexity);
          }
          return "#e8e8e8"; // Light gray for leaf nodes without complexity
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .style("cursor", "pointer")
      .on("click", (event: MouseEvent, d: HierarchyNode<TreeData>) => {
        if (d && this.focus !== d) {
          this.zoom(d);
          event.stopPropagation();
        }
      })
      .on("mouseover", function (this: SVGCircleElement) {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 3);
      })
      .on("mouseout", function (this: SVGCircleElement) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
      });

    // Add text labels
    this.text = this.g!.selectAll<SVGTextElement, HierarchyNode<TreeData>>(
      "text"
    )
      .data(
        this.root.descendants().filter((d) => d !== null && d !== undefined)
      )
      .join("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-family", "Arial, sans-serif")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("pointer-events", "none")
      .style(
        "text-shadow",
        "0 1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 -1px 0 #fff"
      )
      .style("fill-opacity", (d: HierarchyNode<TreeData>) =>
        d?.parent === this.root ? 1 : 0
      )
      .style("display", (d: HierarchyNode<TreeData>) =>
        d?.parent === this.root ? "inline" : "none"
      )
      .text((d: HierarchyNode<TreeData>) => d?.data?.name || "");

    // Combine circles and text for easier manipulation
    this.node = this.g!.selectAll<
      SVGCircleElement | SVGTextElement,
      HierarchyNode<TreeData>
    >("circle, text");

    // Add click handler to SVG background to zoom out to root
    if (this.svg) {
      this.svg.on("click", () => {
        if (this.root) {
          this.zoom(this.root);
        }
      });
    }

    // Initialize zoom to show root
    if (this.root) {
      this.zoomTo([this.root.x!, this.root.y!, this.root.r! * 2 + this.margin]);
    }

    // Add the SVG to the container
    if (this.svg) {
      this.container.appendChild(this.svg.node()!);
    }
  }

  private zoom(d: HierarchyNode<TreeData>): void {
    if (!d) return;

    this.focus = d;

    const transition = d3
      .transition()
      .duration(750)
      .tween("zoom", () => {
        if (!this.view || !this.focus) return () => {};
        const i = d3.interpolateZoom(this.view, [
          this.focus.x!,
          this.focus.y!,
          this.focus.r! * 2 + this.margin,
        ]);
        return (t: number) => this.zoomTo(i(t));
      });

    // Update text visibility during transition
    const focusContext = this.focus;
    transition
      .selectAll("text")
      .filter(function (this: d3.BaseType, datum: unknown) {
        const d = datum as HierarchyNode<TreeData>;
        return (
          d?.parent === focusContext ||
          d3.select(this).style("display") === "inline"
        );
      })
      .style("fill-opacity", (datum: unknown) => {
        const d = datum as HierarchyNode<TreeData>;
        return d?.parent === focusContext ? 1 : 0;
      })
      .on("start", function (this: d3.BaseType, datum: unknown) {
        const d = datum as HierarchyNode<TreeData>;
        if (d?.parent === focusContext) {
          d3.select(this).style("display", "inline");
        }
      })
      .on("end", function (this: d3.BaseType, datum: unknown) {
        const d = datum as HierarchyNode<TreeData>;
        if (d?.parent !== focusContext) {
          d3.select(this).style("display", "none");
        }
      });
  }

  private zoomTo(v: [number, number, number]): void {
    const k = Math.min(this.width, this.height) / v[2];
    this.view = v;

    if (this.node) {
      this.node.attr(
        "transform",
        (d: HierarchyNode<TreeData>) =>
          `translate(${((d?.x || 0) - v[0]) * k}, ${((d?.y || 0) - v[1]) * k})`
      );
    }

    if (this.circle) {
      this.circle.attr("r", (d: HierarchyNode<TreeData>) => (d?.r || 0) * k);
    }

    // Update font size based on zoom level
    if (this.text) {
      this.text.style(
        "font-size",
        (d: HierarchyNode<TreeData>) =>
          Math.min(((d?.r || 0) * k) / 3, 14) + "px"
      );
    }
  }

  private showError(message: string): void {
    this.container.innerHTML = `<div class="error">${message}</div>`;
  }
}
