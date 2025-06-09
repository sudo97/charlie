import '../styles/main.css';
import { createHierarchicalEdgeBundlingVisualization } from './coupled-pairs-visualization';
import { visualizeHotspots } from './hotspots-visualization.js';
import { visualizeSoc } from './soc-visualization.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  visualizeHotspots(document.getElementById('visualization')!);
  createHierarchicalEdgeBundlingVisualization();
  visualizeSoc(document.getElementById('soc')!);
});
