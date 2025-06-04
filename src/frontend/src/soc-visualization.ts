import * as d3 from "d3";
import type { Soc } from "../../core/soc.js";

export class SocVisualization {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private data: Soc[] = [];
  private config = {
    width: 800,
    height: 600,
    margin: { top: 20, right: 30, bottom: 40, left: 200 },
    maxItems: 20, // Show top 20 files
  };

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    this.data = JSON.parse(
      document.getElementById("soc-data")?.textContent || "[]"
    );
    this.render();
  }

  render() {
    if (!this.data.length) {
      this.showError("No SOC data available");
      return;
    }

    // Clear previous content
    this.container.innerHTML = "";

    // Create title
    const title = document.createElement("h2");
    title.textContent =
      "Sum of Coupling (SOC) - Files Changed Together Most Often";
    title.style.cssText = "margin: 0 0 20px 0; color: #333; font-size: 1.5em;";
    this.container.appendChild(title);

    // Create description
    const description = document.createElement("p");
    description.textContent =
      "SOC measures how often files are modified together in the same commit. Higher values indicate tight coupling.";
    description.style.cssText =
      "margin: 0 0 20px 0; color: #666; font-size: 0.9em;";
    this.container.appendChild(description);

    // Calculate dimensions
    const { width, height, margin } = this.config;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.bottom - margin.top;

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#fafafa")
      .style("border-radius", "8px");

    const g = this.svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d.soc) || 0])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(this.data.map((d) => d.file))
      .range([0, innerHeight])
      .padding(0.1);

    // Create color scale based on SOC values
    const colorScale = d3
      .scaleSequential(d3.interpolateReds)
      .domain([0, d3.max(this.data, (d) => d.soc) || 0]);

    // Create bars
    g.selectAll(".bar")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.file) || 0)
      .attr("width", (d) => xScale(d.soc))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.soc))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => this.showTooltip(event, d))
      .on("mouseout", () => this.hideTooltip())
      .on("click", (event, d) => this.onBarClick(d));

    // Add value labels on bars
    g.selectAll(".label")
      .data(this.data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => xScale(d.soc) + 5)
      .attr("y", (d) => (yScale(d.file) || 0) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-weight", "bold")
      .text((d) => d.soc);

    // Add y-axis (file names)
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#333")
      .each(function (d) {
        const text = d3.select(this);
        const fileName = d as string;
        // Truncate long file names
        if (fileName.length > 30) {
          text.text("..." + fileName.slice(-27));
        }
      });

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "#333")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Coupled Commits");

    // Add statistics panel
    this.addStatisticsPanel();
  }

  private addStatisticsPanel() {
    const statsPanel = document.createElement("div");
    statsPanel.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    `;

    const totalFiles = this.data.length;
    const avgSoc = Math.round(d3.mean(this.data, (d) => d.soc) || 0);
    const maxSoc = d3.max(this.data, (d) => d.soc) || 0;
    const minSoc = d3.min(this.data, (d) => d.soc) || 0;

    statsPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #333;">SOC Statistics</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <div>
          <strong>Files Analyzed:</strong><br>
          <span style="font-size: 1.2em; color: #007bff;">${totalFiles}</span>
        </div>
        <div>
          <strong>Average SOC:</strong><br>
          <span style="font-size: 1.2em; color: #28a745;">${avgSoc}</span>
        </div>
        <div>
          <strong>Highest SOC:</strong><br>
          <span style="font-size: 1.2em; color: #dc3545;">${maxSoc}</span>
        </div>
        <div>
          <strong>Lowest SOC:</strong><br>
          <span style="font-size: 1.2em; color: #6c757d;">${minSoc}</span>
        </div>
      </div>
    `;

    this.container.appendChild(statsPanel);
  }

  private showTooltip(event: MouseEvent, d: Soc) {
    d3.select("body")
      .append("div")
      .attr("class", "soc-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .html(
        `
        <strong>${d.file}</strong><br/>
        SOC Score: ${d.soc}<br/>
        <em>This file was modified together with other files ${d.soc} times</em>
      `
      )
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px");
  }

  private hideTooltip() {
    d3.selectAll(".soc-tooltip").remove();
  }

  private onBarClick(d: Soc) {
    console.log(`Clicked on file: ${d.file} with SOC: ${d.soc}`);
    // You could implement file detail view or filter functionality here
  }

  private showError(message: string) {
    this.container.innerHTML = `
      <div style="
        padding: 20px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        color: #721c24;
        text-align: center;
      ">
        ${message}
      </div>
    `;
  }

  updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
    this.render();
  }

  resize(width: number, height: number) {
    this.config.width = width;
    this.config.height = height;
    this.render();
  }

  destroy() {
    if (this.svg) {
      this.svg.remove();
    }
  }
}
