import { type Soc } from '@core/soc';
import { StatisticsPanel } from './statistics-panel.js';
import { VisualizationContainer } from './soc-table.js';
import { ErrorDisplay } from './soc-error.js';

interface SocVisualizationProps {
  data: Soc[];
}

export function SocVisualization({ data }: SocVisualizationProps) {
  if (!data.length) {
    return <ErrorDisplay message="No SOC data available" />;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5em' }}>
        Sum of Coupling (SOC)
      </h2>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9em' }}>
        SOC measures how many times a file is included in commits with any other
        file. Higher scores indicate files that are sources of coupling. Connect
        this data to the hotspots visualization to see which files are the
        priority for refactoring.
      </p>
      <VisualizationContainer data={data} />
      <StatisticsPanel data={data} />
    </div>
  );
}
