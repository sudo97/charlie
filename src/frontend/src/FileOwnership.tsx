import type { LogItem } from '@core/git-log';
import type { Hotspot } from '@core/hotspots';
import {
  fileOwnership,
  ownershipDistribution,
  truckFactor,
} from '@core/file-ownership';
import { useMemo, useState } from 'react';
import {
  BACKGROUND_COLOR,
  BORDER_COLOR,
  HOVER_COLOR,
  TEXT_COLOR,
  MUTED_TEXT_COLOR,
} from './colours';

export function FileOwnershipComponent({
  hotspots,
  logItems,
}: {
  hotspots: Hotspot[];
  logItems: LogItem[];
}) {
  const fileOwnershipData = useMemo(() => fileOwnership(logItems), [logItems]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Filter hotspots to only include files that exist in file ownership data
  const hotspotsWithOwnership = hotspots.filter(
    hotspot => fileOwnershipData[hotspot.file]
  );

  const headers = [
    { text: 'File', width: '30%' },
    { text: 'Owners', width: '70%' },
  ];

  const truckFactorData = truckFactor(ownershipDistribution(fileOwnershipData));

  return (
    <>
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
          borderLeft: '4px solid #28a745',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
          Truck Factor Analysis
        </h3>
        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
          The truck factor is a measure of how many developers are required to
          be hit by a truck before half of the codebase is unsupported.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '15px',
          }}
        >
          <div>
            <strong>Truck Factor:</strong>
            <br />
            <span
              style={{
                fontSize: '1.5em',
                color: '#28a745',
                fontWeight: 'bold',
              }}
            >
              {truckFactorData.length}
            </span>
          </div>
          <div>
            <strong>Total Contributors:</strong>
            <br />
            <span style={{ fontSize: '1.2em', color: '#007bff' }}>
              {truckFactorData.length}
            </span>
          </div>
        </div>
        <div>
          <strong style={{ color: '#333' }}>Ownership Distribution:</strong>
          <div style={{ marginTop: '8px' }}>
            {truckFactorData.map(owner => (
              <div
                key={owner.name}
                style={{
                  padding: '4px 0',
                  fontSize: '13px',
                  color: '#555',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span style={{ fontWeight: '500' }}>{owner.name}</span>
                <span style={{ color: '#28a745', marginLeft: '8px' }}>
                  ({Math.round(owner.percentage * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          background: BACKGROUND_COLOR,
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <table
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: `2px solid ${BORDER_COLOR}`,
              }}
            >
              {headers.map((header, index) => (
                <th
                  key={index}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: TEXT_COLOR,
                    fontSize: '14px',
                    background: 'transparent',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: header.width,
                  }}
                >
                  {header.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotspotsWithOwnership.map((hotspot, index) => {
              const owners = fileOwnershipData[hotspot.file] || [];
              const ownersText = owners
                .map(
                  owner =>
                    `${owner.name} (${(owner.percentage * 100).toFixed(1)}%)`
                )
                .join(', ');

              return (
                <tr
                  key={hotspot.file}
                  style={{
                    borderBottom: `1px solid ${BORDER_COLOR}`,
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer',
                    backgroundColor:
                      hoveredRow === index ? HOVER_COLOR : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: MUTED_TEXT_COLOR,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={hotspot.file}
                  >
                    {hotspot.file}
                  </td>
                  <td
                    style={{
                      padding: '10px 8px',
                      fontSize: '12px',
                      color: TEXT_COLOR,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={ownersText}
                  >
                    {ownersText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
