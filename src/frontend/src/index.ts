import "../styles/main.css";
import { HierarchicalEdgeBundlingVisualization } from "./coupled-pairs-visualization";
import { HotspotsVisualization } from "./hotspots-visualization.js";
import { SocVisualization } from "./soc-visualization.js";

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new HotspotsVisualization();
  new HierarchicalEdgeBundlingVisualization();
  new SocVisualization("soc");
});
