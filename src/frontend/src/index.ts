import "../styles/main.css";
import { HierarchicalEdgeBundlingVisualization } from "./coupled-pairs-visualization";
import { visualizeHotspots } from "./hotspots-visualization.js";
import { visualizeSoc } from "./soc-visualization.js";

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  visualizeHotspots(document.getElementById("visualization")!);
  new HierarchicalEdgeBundlingVisualization();
  visualizeSoc(document.getElementById("soc")!);
});
