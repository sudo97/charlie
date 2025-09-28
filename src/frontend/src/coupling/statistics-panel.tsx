import type { CouplingItem } from '@core/coupling';

interface StatisticsPanelProps {
  data: CouplingItem[];
}
export function StatisticsPanel({ data }: StatisticsPanelProps) {
  const totalFiles = data.length;
  const avgSoc = Math.round(
    data.reduce((sum, d) => sum + d.soc, 0) / data.length
  );
  const maxSoc = Math.max(...data.map(d => d.soc));
  const minSoc = Math.min(...data.map(d => d.soc));

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        borderLeft: '4px solid #007bff',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
        Coupling Statistics
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
        }}
      >
        <div>
          <strong>Files Analyzed:</strong>
          <br />
          <span style={{ fontSize: '1.2em', color: '#007bff' }}>
            {totalFiles}
          </span>
        </div>
        <div>
          <strong>Average Coupling:</strong>
          <br />
          <span style={{ fontSize: '1.2em', color: '#28a745' }}>{avgSoc}</span>
        </div>
        <div>
          <strong>Highest Coupling:</strong>
          <br />
          <span style={{ fontSize: '1.2em', color: '#dc3545' }}>{maxSoc}</span>
        </div>
        <div>
          <strong>Lowest Coupling:</strong>
          <br />
          <span style={{ fontSize: '1.2em', color: '#6c757d' }}>{minSoc}</span>
        </div>
      </div>
    </div>
  );
}
