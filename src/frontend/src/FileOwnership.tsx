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

  return (
    <>
      <div>
        <h2>Truck Factor</h2>
        <p>
          The truck factor is a measure of how much of the codebase is owned by
          each developer.
        </p>
        <div>
          {truckFactor(ownershipDistribution(fileOwnershipData)).map(owner => (
            <div key={owner.name}>
              {owner.name} ({Math.round(owner.percentage * 100)}%)
            </div>
          ))}
          Truck factor ={' '}
          {truckFactor(ownershipDistribution(fileOwnershipData)).length}
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
