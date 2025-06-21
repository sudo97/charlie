import '../styles/main.css';
import { createHierarchicalEdgeBundlingVisualization } from './coupled-pairs-visualization';
import { visualizeHotspots } from './hotspots/index.js';
import { visualizeSoc } from './soc-visualization.js';
import { visualizeWordCount } from './visualizeWordCount';
import { createCoupledPairsTable } from './coupled-pairs-table.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  visualizeHotspots(document.getElementById('visualization')!, 'data');
  visualizeHotspots(
    document.getElementById('grouped-hotspots')!,
    'grouped-hotspots-data'
  );

  createHierarchicalEdgeBundlingVisualization({
    container: document.getElementById('coupled-pairs')!,
    data: 'coupled-pairs-data',
  });

  createCoupledPairsTable(
    document.getElementById('coupled-pairs-table')!,
    'coupled-pairs-data'
  );

  createHierarchicalEdgeBundlingVisualization({
    container: document.getElementById('coupled-pairs-grouped')!,
    data: 'coupled-pairs-grouped-data',
  });

  visualizeSoc(document.getElementById('soc')!);
  visualizeWordCount(document.getElementById('word-count')!);
});
