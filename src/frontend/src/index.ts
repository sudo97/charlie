import '../styles/main.css';
import { createHierarchicalEdgeBundlingVisualization } from './coupled-pairs-visualization';
import { visualizeHotspots } from './hotspots-visualization.js';
import { visualizeSoc } from './soc-visualization.js';
import { visualizeWordCount } from './visualizeWordCount';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  visualizeHotspots(document.getElementById('visualization')!, 'data');
  visualizeHotspots(
    document.getElementById('grouped-hotspots')!,
    'grouped-hotspots-data'
  );
  createHierarchicalEdgeBundlingVisualization();
  visualizeSoc(document.getElementById('soc')!);
  visualizeWordCount(document.getElementById('word-count')!);
});
