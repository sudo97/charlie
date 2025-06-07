import { type CoupledPair } from "@core/coupled-pairs";
import * as d3 from "d3";

export interface HierarchicalEdgeBundlingConfig {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  tension?: number; // For curve tension (0-1)
  showLabels?: boolean;
  colorScale?: d3.ScaleOrdinal<string, string>;
  minPercentageThreshold?: number; // Only show edges above this threshold
}

interface Node {
  id: string;
  group: string;
  filePath: string;
  x: number;
  y: number;
  data: {
    name: string;
    group: string;
    path: string;
  };
}

interface Link {
  source: Node;
  target: Node;
  value: number;
  revisions: number;
}

// TODO: Simplify, do not use class, follow simpler functional approach.
// TODO: show not only file names, but directory names too.
// TODO: Possibly group by directory with different colors.
export class HierarchicalEdgeBundlingVisualization {
  private data: CoupledPair[] | null = null;
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private containerGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private config: Required<HierarchicalEdgeBundlingConfig>;
  private nodes: Node[] = [];
  private links: Link[] = [];
  private nodeById: Map<string, Node> = new Map();

  constructor(config: HierarchicalEdgeBundlingConfig = {}) {
    const defaultConfig: Required<HierarchicalEdgeBundlingConfig> = {
      width: 800,
      height: 800,
      innerRadius: 200,
      outerRadius: 350,
      tension: 0.85,
      showLabels: true,
      colorScale: d3.scaleOrdinal(d3.schemeCategory10),
      minPercentageThreshold: 0.1,
    };

    this.config = { ...defaultConfig, ...config };
    this.container = document.getElementById("coupled-pairs") as HTMLElement;

    if (!this.container) {
      throw new Error("Container element with ID 'visualization' not found");
    }

    // Clear any existing content
    this.container.innerHTML = "";

    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.config.width)
      .attr("height", this.config.height);

    this.containerGroup = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.config.width / 2}, ${this.config.height / 2})`
      );

    this.loadData();
  }

  private loadData(): void {
    // Try to get data from script tag
    const dataElement = document.getElementById("coupling-pairs");
    if (dataElement) {
      try {
        this.data = JSON.parse(dataElement.textContent || "[]");

        if (!this.data) {
          this.showError("No coupling pairs data found");
          return;
        }

        // TODO: Move this logic to the backend.
        // Probably allow fine-tuning the thresholds with .charlie.config.json file.
        // this.data = this.
        // Calculate 80th percentile threshold for revisions
        const revisions = this.data
          .map((pair) => pair.revisions)
          .sort((a, b) => a - b);
        const percentile80Index = Math.floor(revisions.length * 0.6);
        const revisionThreshold = revisions[percentile80Index] || 0;

        // Filter data to only show pairs with:
        // 1. More than 50% coupling
        // 2. Number of revisions above 80th percentile
        this.data = this.data.filter(
          (pair) =>
            pair.percentage >= 0.5 && pair.revisions >= revisionThreshold
        );

        this.render();
        return;
      } catch (error) {
        console.error("Failed to parse data from script tag:", error);
      }
    }

    this.showError("No coupling pairs data found");
  }

  private render(): void {
    if (!this.data) {
      this.showError("Invalid data");
      return;
    }

    try {
      this.processData(this.data);
      this.renderVisualization();
    } catch (error) {
      console.error("Failed to render visualization:", error);
      this.showError("Failed to render visualization");
    }
  }

  private processData(coupledPairs: CoupledPair[]): void {
    // Filter pairs by threshold
    const filteredPairs = coupledPairs.filter(
      (pair) => pair.percentage >= this.config.minPercentageThreshold
    );

    // Extract unique files and group them by directory
    const fileSet = new Set<string>();
    filteredPairs.forEach((pair) => {
      fileSet.add(pair.file1);
      fileSet.add(pair.file2);
    });

    const files = Array.from(fileSet);

    // Create nodes in circular layout
    this.createCircularLayout(files);

    // Create links from coupled pairs
    this.links = filteredPairs
      .map((pair) => {
        const source = this.nodeById.get(pair.file1);
        const target = this.nodeById.get(pair.file2);
        if (source && target) {
          return {
            source,
            target,
            value: pair.percentage,
            revisions: pair.revisions,
          };
        }
        return null;
      })
      .filter((link): link is Link => link !== null);
  }

  private createCircularLayout(files: string[]): void {
    // Group files by directory
    const groups = new Map<string, string[]>();
    files.forEach((file) => {
      const parts = file.split("/");
      const group = parts.length > 1 && parts[0] ? parts[0] : "root";

      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(file);
    });

    // Calculate positions
    const totalFiles = files.length;
    const angleStep = (2 * Math.PI) / totalFiles;
    let currentIndex = 0;

    this.nodes = [];
    this.nodeById.clear();

    for (const [group, groupFiles] of groups) {
      for (const file of groupFiles) {
        const angle = currentIndex * angleStep;
        const node: Node = {
          id: file,
          group,
          filePath: file,
          x: angle,
          y: this.config.innerRadius,
          data: {
            name: file.split("/").pop() || file,
            group,
            path: file,
          },
        };

        this.nodes.push(node);
        this.nodeById.set(file, node);
        currentIndex++;
      }
    }
  }

  private renderVisualization(): void {
    this.containerGroup.selectAll("*").remove();

    // Create radial line generator for edges
    const line = d3
      .lineRadial<[number, number]>()
      .curve(d3.curveBundle.beta(this.config.tension))
      .radius((d) => d[1])
      .angle((d) => d[0]);

    // Create links
    const linkGroup = this.containerGroup
      .append("g")
      .attr("class", "links")
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none");

    const linkSelection = linkGroup
      .selectAll("path")
      .data(this.links)
      .join("path")
      .attr("stroke", (d) => this.config.colorScale(d.source.group))
      .attr("stroke-width", (d) => Math.max(1, d.value * 4))
      .attr("stroke-opacity", (d) => Math.max(0.2, d.value))
      .attr("d", (d) => {
        const path: [number, number][] = [
          [d.source.x, d.source.y],
          [d.source.x, d.source.y],
          [0, 0],
          [d.target.x, d.target.y],
          [d.target.x, d.target.y],
        ];
        return line(path);
      });

    // Create nodes
    const nodeGroup = this.containerGroup.append("g").attr("class", "nodes");

    const nodeSelection = nodeGroup
      .selectAll("circle")
      .data(this.nodes)
      .join("circle")
      .attr(
        "transform",
        (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y}, 0)`
      )
      .attr("r", 4)
      .attr("fill", (d) => this.config.colorScale(d.group))
      .attr("fill-opacity", 0.8)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add interaction handlers
    linkSelection
      .on("mouseover", (event, d) => {
        linkSelection.attr("stroke-opacity", (link: Link) =>
          link === d ? 0.8 : 0.1
        );
        nodeSelection.attr("fill-opacity", (node: Node) =>
          node === d.source || node === d.target ? 1 : 0.3
        );
        this.showTooltip(event, d);
      })
      .on("mouseout", () => {
        linkSelection.attr("stroke-opacity", (d: Link) =>
          Math.max(0.2, d.value)
        );
        nodeSelection.attr("fill-opacity", 0.8);
        this.hideTooltip();
      });

    nodeSelection
      .on("mouseover", (event, d) => {
        linkSelection.attr("stroke-opacity", (link: Link) =>
          link.source === d || link.target === d ? 0.8 : 0.1
        );
        this.showNodeTooltip(event, d);
      })
      .on("mouseout", () => {
        linkSelection.attr("stroke-opacity", (d: Link) =>
          Math.max(0.2, d.value)
        );
        this.hideTooltip();
      });

    // Add labels if enabled
    if (this.config.showLabels) {
      nodeGroup
        .selectAll("text")
        .data(this.nodes)
        .join("text")
        .attr("transform", (d) => {
          const angle = (d.x * 180) / Math.PI - 90;
          return `rotate(${angle}) translate(${d.y + 8}, 0) ${
            angle > 90 ? "rotate(180)" : ""
          }`;
        })
        .attr("text-anchor", (d) => (d.x > Math.PI ? "end" : "start"))
        .attr("font-size", "10px")
        .attr("font-family", "sans-serif")
        .attr("fill", "#333")
        .text((d) => d.data.name);
    }

    // Add legend
    this.renderLegend();
  }

  private renderLegend(): void {
    const legend = this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, 20)`);

    const groups = Array.from(new Set(this.nodes.map((d) => d.group)));

    const legendItems = legend
      .selectAll(".legend-item")
      .data(groups)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems
      .append("circle")
      .attr("r", 6)
      .attr("fill", (d) => this.config.colorScale(d));

    legendItems
      .append("text")
      .attr("x", 15)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("font-family", "sans-serif")
      .attr("fill", "#333")
      .text((d) => d);
  }

  private showTooltip(event: MouseEvent, d: Link): void {
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "coupled-pairs-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    tooltip
      .html(
        `
      <strong>Coupling</strong><br/>
      ${d.source.data.name} ↔ ${d.target.data.name}<br/>
      Strength: ${(d.value * 100).toFixed(1)}%<br/>
      Revisions: ${d.revisions}
    `
      )
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px");
  }

  private showNodeTooltip(event: MouseEvent, d: Node): void {
    const connectedLinks = this.links.filter(
      (link) => link.source === d || link.target === d
    );

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "coupled-pairs-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    tooltip
      .html(
        `
      <strong>${d.data.name}</strong><br/>
      Group: ${d.group}<br/>
      Connections: ${connectedLinks.length}
    `
      )
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px");
  }

  private hideTooltip(): void {
    d3.selectAll(".coupled-pairs-tooltip").remove();
  }

  private showError(message: string): void {
    this.container.innerHTML = `<div class="error">${message}</div>`;
  }

  public updateConfig(
    newConfig: Partial<HierarchicalEdgeBundlingConfig>
  ): void {
    this.config = { ...this.config, ...newConfig };
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    this.svg.attr("width", width).attr("height", height);

    this.containerGroup.attr(
      "transform",
      `translate(${width / 2}, ${height / 2})`
    );
  }

  public destroy(): void {
    this.svg.remove();
  }
}
