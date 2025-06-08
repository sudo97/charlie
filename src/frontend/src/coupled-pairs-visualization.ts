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

interface VisualizationState {
  data: CoupledPair[] | null;
  container: HTMLElement;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  containerGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  config: Required<HierarchicalEdgeBundlingConfig>;
  nodes: Node[];
  links: Link[];
  nodeById: Map<string, Node>;
}

// TODO: show not only file names, but directory names too.
// TODO: Possibly group by directory with different colors.

const DEFAULT_CONFIG: Required<HierarchicalEdgeBundlingConfig> = {
  width: 800,
  height: 800,
  innerRadius: 200,
  outerRadius: 350,
  tension: 0.85,
  showLabels: true,
  colorScale: d3.scaleOrdinal(d3.schemeCategory10),
  minPercentageThreshold: 0.1,
};

function createVisualizationState(
  config: HierarchicalEdgeBundlingConfig = {}
): VisualizationState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const container = document.getElementById("coupled-pairs") as HTMLElement;

  if (!container) {
    throw new Error("Container element with ID 'coupled-pairs' not found");
  }

  // Clear any existing content
  container.innerHTML = "";

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", mergedConfig.width)
    .attr("height", mergedConfig.height);

  const containerGroup = svg
    .append("g")
    .attr(
      "transform",
      `translate(${mergedConfig.width / 2}, ${mergedConfig.height / 2})`
    );

  return {
    data: null,
    container,
    svg,
    containerGroup,
    config: mergedConfig,
    nodes: [],
    links: [],
    nodeById: new Map(),
  };
}

function loadData(): CoupledPair[] | null {
  // Try to get data from script tag
  const dataElement = document.getElementById("coupling-pairs");
  if (dataElement) {
    try {
      return JSON.parse(dataElement.textContent || "[]");
    } catch (error) {
      console.error("Failed to parse data from script tag:", error);
    }
  }
  return null;
}

function showError(container: HTMLElement, message: string): void {
  container.innerHTML = `<div class="error">${message}</div>`;
}

function generateUniqueDisplayNames(files: string[]): Map<string, string> {
  const displayNames = new Map<string, string>();

  // Group files by their filename
  const filesByName = new Map<string, string[]>();
  files.forEach((file) => {
    const filename = file.split("/").pop();
    if (!filename) return; // Skip files without valid names

    if (!filesByName.has(filename)) {
      filesByName.set(filename, []);
    }
    filesByName.get(filename)!.push(file);
  });

  // For each group, determine the minimum path needed to make them unique
  for (const [filename, filePaths] of filesByName) {
    if (filePaths.length === 1) {
      // Unique filename, just use the filename
      displayNames.set(filePaths[0]!, filename);
    } else {
      // Multiple files with same name, need to show more path
      const pathSegments = filePaths.map((path) => path.split("/"));

      // Find minimum number of segments needed to distinguish all files
      let segmentsNeeded = 1;
      while (segmentsNeeded <= Math.max(...pathSegments.map((p) => p.length))) {
        const suffixes = new Set();
        let allUnique = true;

        for (const segments of pathSegments) {
          const suffix = segments.slice(-segmentsNeeded).join("/");
          if (suffixes.has(suffix)) {
            allUnique = false;
            break;
          }
          suffixes.add(suffix);
        }

        if (allUnique) {
          // Found the minimum segments needed
          for (const path of filePaths) {
            const segments = path.split("/");
            const displayName = segments.slice(-segmentsNeeded).join("/");
            displayNames.set(path, displayName);
          }
          break;
        }

        segmentsNeeded++;
      }

      // Fallback: if we still can't distinguish them, use full paths
      if (segmentsNeeded > Math.max(...pathSegments.map((p) => p.length))) {
        for (const path of filePaths) {
          displayNames.set(path, path);
        }
      }
    }
  }

  return displayNames;
}

function processData(
  coupledPairs: CoupledPair[],
  state: VisualizationState
): void {
  // Filter pairs by threshold
  const filteredPairs = coupledPairs.filter(
    (pair) => pair.percentage >= state.config.minPercentageThreshold
  );

  // Extract unique files and group them by directory
  const fileSet = new Set<string>();
  filteredPairs.forEach((pair) => {
    fileSet.add(pair.file1);
    fileSet.add(pair.file2);
  });

  const files = Array.from(fileSet);

  // Create nodes in circular layout
  createCircularLayout(files, state);

  // Create links from coupled pairs
  state.links = filteredPairs
    .map((pair) => {
      const source = state.nodeById.get(pair.file1);
      const target = state.nodeById.get(pair.file2);
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

function createCircularLayout(
  files: string[],
  state: VisualizationState
): void {
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

  // Generate unique display names for all files
  const displayNames = generateUniqueDisplayNames(files);

  // Calculate positions
  const totalFiles = files.length;
  const angleStep = (2 * Math.PI) / totalFiles;
  let currentIndex = 0;

  state.nodes = [];
  state.nodeById.clear();

  for (const [group, groupFiles] of groups) {
    for (const file of groupFiles) {
      const angle = currentIndex * angleStep;
      const fileName = file.split("/").pop();
      const displayName = displayNames.get(file) || fileName || file;

      const node: Node = {
        id: file,
        group,
        filePath: file,
        x: angle,
        y: state.config.innerRadius,
        data: {
          name: displayName,
          group,
          path: file,
        },
      };

      state.nodes.push(node);
      state.nodeById.set(file, node);
      currentIndex++;
    }
  }
}

function showTooltip(event: MouseEvent, d: Link): void {
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

function showNodeTooltip(event: MouseEvent, d: Node, links: Link[]): void {
  const connectedLinks = links.filter(
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

function hideTooltip(): void {
  d3.selectAll(".coupled-pairs-tooltip").remove();
}

function renderLegend(state: VisualizationState): void {
  const legend = state.svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(20, 20)`);

  const groups = Array.from(new Set(state.nodes.map((d) => d.group)));

  const legendItems = legend
    .selectAll(".legend-item")
    .data(groups)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (_d, i) => `translate(0, ${i * 20})`);

  legendItems
    .append("circle")
    .attr("r", 6)
    .attr("fill", (d) => state.config.colorScale(d));

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

function renderVisualization(state: VisualizationState): void {
  state.containerGroup.selectAll("*").remove();

  // Create radial line generator for edges
  const line = d3
    .lineRadial<[number, number]>()
    .curve(d3.curveBundle.beta(state.config.tension))
    .radius((d) => d[1])
    .angle((d) => d[0]);

  // Create links
  const linkGroup = state.containerGroup
    .append("g")
    .attr("class", "links")
    .attr("stroke-opacity", 0.6)
    .attr("fill", "none");

  const linkSelection = linkGroup
    .selectAll("path")
    .data(state.links)
    .join("path")
    .attr("stroke", (d) => state.config.colorScale(d.source.group))
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
  const nodeGroup = state.containerGroup.append("g").attr("class", "nodes");

  const nodeSelection = nodeGroup
    .selectAll("circle")
    .data(state.nodes)
    .join("circle")
    .attr(
      "transform",
      (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y}, 0)`
    )
    .attr("r", 4)
    .attr("fill", (d) => state.config.colorScale(d.group))
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
      showTooltip(event, d);
    })
    .on("mouseout", () => {
      linkSelection.attr("stroke-opacity", (d: Link) => Math.max(0.2, d.value));
      nodeSelection.attr("fill-opacity", 0.8);
      hideTooltip();
    });

  nodeSelection
    .on("mouseover", (event, d) => {
      linkSelection.attr("stroke-opacity", (link: Link) =>
        link.source === d || link.target === d ? 0.8 : 0.1
      );
      showNodeTooltip(event, d, state.links);
    })
    .on("mouseout", () => {
      linkSelection.attr("stroke-opacity", (d: Link) => Math.max(0.2, d.value));
      hideTooltip();
    });

  // Add labels if enabled
  if (state.config.showLabels) {
    nodeGroup
      .selectAll("text")
      .data(state.nodes)
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
  renderLegend(state);
}

function render(state: VisualizationState): void {
  if (!state.data) {
    showError(state.container, "Invalid data");
    return;
  }

  try {
    processData(state.data, state);
    renderVisualization(state);
  } catch (error) {
    console.error("Failed to render visualization:", error);
    showError(state.container, "Failed to render visualization");
  }
}

export function createHierarchicalEdgeBundlingVisualization(
  config: HierarchicalEdgeBundlingConfig = {}
) {
  const state = createVisualizationState(config);

  // Load data
  state.data = loadData();

  if (!state.data) {
    showError(state.container, "No coupling pairs data found");
    return {
      updateConfig: () => {},
      resize: () => {},
      destroy: () => state.svg.remove(),
    };
  }

  // Initial render
  render(state);

  return {
    updateConfig: (newConfig: Partial<HierarchicalEdgeBundlingConfig>) => {
      state.config = { ...state.config, ...newConfig };
      render(state);
    },

    resize: (width: number, height: number) => {
      state.config.width = width;
      state.config.height = height;

      state.svg.attr("width", width).attr("height", height);

      state.containerGroup.attr(
        "transform",
        `translate(${width / 2}, ${height / 2})`
      );

      render(state);
    },

    destroy: () => {
      state.svg.remove();
    },
  };
}
