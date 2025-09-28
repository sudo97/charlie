import { type CouplingItem } from '@core/coupling';
import { StatisticsPanel } from './statistics-panel.js';
import { VisualizationContainer } from './coupling-table.js';
import { ErrorDisplay } from './coupling-error.js';

interface CouplingVisualizationProps {
  data: CouplingItem[];
}

export function CouplingVisualization({ data }: CouplingVisualizationProps) {
  if (!data.length) {
    return <ErrorDisplay message="No coupling data available" />;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5em' }}>
        Coupling Analysis
      </h2>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9em' }}>
        This view combines Sum of Coupling (SOC) scores with coupled pairs data.
        Higher SOC scores indicate files that are sources of coupling. Expand
        items to see which specific files they are coupled with and the coupling
        strength.
      </p>
      <VisualizationContainer data={data} />
      <StatisticsPanel data={data} />
    </div>
  );
}
