import * as d3 from "d3";
import type { Soc } from "../../core/soc.js";

// Color constants for easy designer customization
const LOW_SOC_COLOR = "#28a745"; // Green for low coupling
const HIGH_SOC_COLOR = "#dc3545"; // Red for high coupling
const BACKGROUND_COLOR = "#fafafa";
const BORDER_COLOR = "#e9ecef";
const HOVER_COLOR = "#f8f9fa";
const TEXT_COLOR = "#333";
const MUTED_TEXT_COLOR = "#495057";

function getData(): Soc[] {
  const dataElement = document.getElementById("soc-data");
  if (!dataElement) {
    throw new Error("SOC data element not found");
  }
  return JSON.parse(dataElement.textContent || "[]");
}

function createColorScale(maxSoc: number) {
  return d3
    .scaleLinear<string>()
    .domain([0, maxSoc])
    .range([LOW_SOC_COLOR, HIGH_SOC_COLOR])
    .interpolate(d3.interpolateHcl);
}

function createTitle(): HTMLElement {
  const title = document.createElement("h2");
  title.textContent =
    "Sum of Coupling (SOC) - Files Changed Together Most Often";
  title.style.cssText = "margin: 0 0 20px 0; color: #333; font-size: 1.5em;";
  return title;
}

function createDescription(): HTMLElement {
  const description = document.createElement("p");
  description.textContent =
    "SOC measures how often files are modified together in the same commit. Higher values indicate tight coupling.";
  description.style.cssText =
    "margin: 0 0 20px 0; color: #666; font-size: 0.9em;";
  return description;
}

function createStatisticsPanel(data: Soc[]): HTMLElement {
  const statsPanel = document.createElement("div");
  statsPanel.style.cssText = `
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  `;

  const totalFiles = data.length;
  const avgSoc = Math.round(
    data.reduce((sum, d) => sum + d.soc, 0) / data.length
  );
  const maxSoc = Math.max(...data.map((d) => d.soc));
  const minSoc = Math.min(...data.map((d) => d.soc));

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

  return statsPanel;
}

function createVisualizationContainer(data: Soc[]): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = `
    background: ${BACKGROUND_COLOR};
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  `;

  const maxSoc = Math.max(...data.map((d) => d.soc));
  const colorScale = createColorScale(maxSoc);

  // Create header row
  const headerRow = document.createElement("div");
  headerRow.style.cssText = `
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 2px solid ${BORDER_COLOR};
    margin-bottom: 10px;
    font-weight: bold;
    color: ${TEXT_COLOR};
  `;

  const fileHeader = document.createElement("div");
  fileHeader.textContent = "File";
  fileHeader.style.cssText = "flex: 0 0 300px; padding-right: 20px;";

  const socHeader = document.createElement("div");
  socHeader.textContent = "SOC Score";
  socHeader.style.cssText = "flex: 1;";

  headerRow.appendChild(fileHeader);
  headerRow.appendChild(socHeader);
  container.appendChild(headerRow);

  // Create bars for each file
  data.forEach((d) => {
    const row = document.createElement("div");
    row.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${BORDER_COLOR};
      transition: background-color 0.2s ease;
      cursor: pointer;
    `;

    // Add hover effect
    row.addEventListener("mouseenter", () => {
      row.style.backgroundColor = HOVER_COLOR;
    });

    row.addEventListener("mouseleave", () => {
      row.style.backgroundColor = "transparent";
    });

    // File name
    const fileName = document.createElement("div");
    fileName.textContent =
      d.file.length > 40 ? "..." + d.file.slice(-37) : d.file;
    fileName.title = d.file; // Full path on hover
    fileName.style.cssText = `
      flex: 0 0 300px;
      padding-right: 20px;
      font-family: monospace;
      font-size: 12px;
      color: ${MUTED_TEXT_COLOR};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    // Bar container
    const barContainer = document.createElement("div");
    barContainer.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      position: relative;
    `;

    // Bar
    const bar = document.createElement("div");
    const widthPercentage = (d.soc / maxSoc) * 100;

    bar.style.cssText = `
      height: 24px;
      background-color: ${colorScale(d.soc)};
      border-radius: 4px;
      width: ${widthPercentage}%;
      min-width: 2px;
      transition: opacity 0.2s ease;
    `;

    // SOC value label
    const valueLabel = document.createElement("span");
    valueLabel.textContent = d.soc.toString();
    valueLabel.style.cssText = `
      margin-left: 10px;
      font-weight: bold;
      color: ${TEXT_COLOR};
      font-size: 12px;
    `;

    barContainer.appendChild(bar);
    barContainer.appendChild(valueLabel);

    row.appendChild(fileName);
    row.appendChild(barContainer);

    // Click handler
    row.addEventListener("click", () => {
      console.log(`Clicked on file: ${d.file} with SOC: ${d.soc}`);
    });

    container.appendChild(row);
  });

  return container;
}

function showError(message: string): HTMLElement {
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    padding: 20px;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
    text-align: center;
  `;
  errorDiv.textContent = message;
  return errorDiv;
}

export function visualizeSoc(container: HTMLElement) {
  try {
    const data = getData();

    if (!data.length) {
      container.appendChild(showError("No SOC data available"));
      return;
    }

    // Clear previous content
    container.innerHTML = "";

    // Sort data by SOC in descending order
    const sortedData = [...data].sort((a, b) => b.soc - a.soc);

    // Add components
    container.appendChild(createTitle());
    container.appendChild(createDescription());
    container.appendChild(createVisualizationContainer(sortedData));
    container.appendChild(createStatisticsPanel(sortedData));
  } catch (error) {
    container.appendChild(
      showError("Error loading SOC data: " + (error as Error).message)
    );
  }
}
