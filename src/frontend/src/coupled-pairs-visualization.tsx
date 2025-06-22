import { type CoupledPair } from '@core/coupled-pairs';
import { createRoot } from 'react-dom/client';
import { CoupledPairsVisualization } from './coupled-pairs/coupled-pairs';

export interface HierarchicalEdgeBundlingConfig {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  tension?: number; // For curve tension (0-1)
  showLabels?: boolean;
  minPercentageThreshold?: number; // Only show edges above this threshold
  container: HTMLElement;
  data: string;
}

export function createHierarchicalEdgeBundlingVisualization(
  config: HierarchicalEdgeBundlingConfig
) {
  const data = loadData(config.data);

  const root = createRoot(config.container);

  if (!data) {
    root.render(<div className="error">No coupling pairs data found</div>);
  } else {
    root.render(<CoupledPairsVisualization data={data} config={config} />);
  }
}

function loadData(dataEltId: string): CoupledPair[] | null {
  const dataElement = document.getElementById(dataEltId);
  if (dataElement) {
    try {
      return JSON.parse(dataElement.textContent || '[]');
    } catch (error) {
      console.error('Failed to parse data from script tag:', error);
    }
  }
  return null;
}
