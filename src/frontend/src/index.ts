import '../styles/main.css';
import { createHierarchicalEdgeBundlingVisualization } from './coupled-pairs-visualization';
import { visualizeHotspots } from './hotspots/index.js';
import { visualizeSoc } from './soc/soc-visualization.js';
import { visualizeWordCount } from './visualizeWordCount';
import { createCoupledPairsTable } from './coupled-pairs-table.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  visualizeHotspots(document.getElementById('visualization')!, {
    dataElt: 'data',
    groupsElt: 'architectural-groups',
    socElt: 'log-items-data',
  });

  createHierarchicalEdgeBundlingVisualization({
    container: document.getElementById('coupled-pairs')!,
    data: 'log-items-data',
    groups: 'architectural-groups',
  });

  createCoupledPairsTable(
    document.getElementById('coupled-pairs-table')!,
    'log-items-data'
  );

  visualizeSoc(document.getElementById('soc')!, 'log-items-data');
  visualizeWordCount(document.getElementById('word-count')!);
});
