import * as d3 from "d3";
import type { TreeData } from "../../core/types.js";
import "../styles/main.css";

interface Window {
  __REPORT_DATA__?: TreeData;
}

declare const window: Window;

class CharlieVisualization {
  private data: TreeData | null = null;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById("visualization") as HTMLElement;
    this.loadData();
  }

  private loadData(): void {
    // Try to get data from window (injected by template)
    if (window.__REPORT_DATA__) {
      this.data = window.__REPORT_DATA__;
      this.render();
      return;
    }

    // Fallback: try to get data from script tag (for backward compatibility)
    const dataElement = document.getElementById("data");
    if (dataElement) {
      try {
        this.data = JSON.parse(dataElement.textContent || "{}");
        this.render();
        return;
      } catch (error) {
        console.error("Failed to parse data from script tag:", error);
      }
    }

    this.showError("No data found");
  }

  private render(): void {
    if (!this.data) {
      this.showError("Invalid data");
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
    if (!this.data) return;

    // Set up dimensions
    const width = 800;
    const height = 600;

    // Create SVG
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Create hierarchy - using any for now to avoid complex D3 typing
    const root = d3.hierarchy(this.data).sum((d: any) => d.revisions || 0);

    // Create pack layout
    const pack = d3.pack().size([width, height]).padding(3);

    // Apply pack layout
    pack(root);

    // Find min and max complexity for color scale
    const allNodes = root.descendants();
    const complexityValues = allNodes
      .filter((d: any) => d.data.complexity !== undefined)
      .map((d: any) => d.data.complexity);

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
    svg
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => {
        // Use complexity for color, fallback to light gray for nodes without complexity
        if (d.data.complexity !== undefined) {
          return color(d.data.complexity);
        }
        return "#e8e8e8"; // Light gray for containers
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("opacity", 0.8);

    // Add text labels
    svg
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y - d.r + 15)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .style("font-size", (d: any) => Math.min(d.r / 3, 14) + "px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("pointer-events", "none")
      .text((d: any) => d.data.name);

    // Add the SVG to the container
    this.container.appendChild(svg.node()!);
  }

  private showError(message: string): void {
    this.container.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CharlieVisualization();
});
