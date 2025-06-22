import { createRoot } from 'react-dom/client';
import { CoupledPairsVisualization } from './coupled-pairs/coupled-pairs';
import type { LogItem } from '@core/git-log';

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
  groups: string;
}

export function createHierarchicalEdgeBundlingVisualization(
  config: HierarchicalEdgeBundlingConfig
) {
  const data = loadData(config.data);

  const root = createRoot(config.container);

  const groupsData = getGroups(config.groups);

  if (!data) {
    root.render(<div className="error">No coupling pairs data found</div>);
  } else {
    root.render(
      <CoupledPairsVisualization
        data={data}
        config={config}
        architecturalGroups={groupsData}
      />
    );
  }
}

function loadData(dataEltId: string): LogItem[] | null {
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

function getGroups(groupsElt: string): Record<string, string> {
  const groupsElement = document.getElementById(groupsElt);
  if (!groupsElement) {
    throw new Error('Groups element not found');
  }
  return JSON.parse(groupsElement.textContent || '{}');
}
