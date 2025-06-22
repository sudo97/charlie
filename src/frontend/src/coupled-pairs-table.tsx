import type { CoupledPair } from '@core/coupled-pairs';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BACKGROUND_COLOR,
  BORDER_COLOR,
  HOVER_COLOR,
  TEXT_COLOR,
  MUTED_TEXT_COLOR,
  HIGH_IMPORTANCE_COLOR,
} from './colours.js';

interface CoupledPairsTableProps {
  data: CoupledPair[];
}

const CoupledPairsTable: React.FC<CoupledPairsTableProps> = ({ data }) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const headers = [
    { text: 'File 1', width: '43%' },
    { text: 'File 2', width: '43%' },
    { text: 'Coupling', width: '7%' },
    { text: 'Revisions', width: '7%' },
  ];

  const sortedData = sortData(data);

  return (
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
          {sortedData.map((row, index) => (
            <tr
              key={index}
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
              <td style={getCellStyle('file')} title={row.file1}>
                {row.file1}
              </td>
              <td style={getCellStyle('file')} title={row.file2}>
                {row.file2}
              </td>
              <td style={getCellStyle('percentage')}>
                {(row.percentage * 100).toFixed(1)}%
              </td>
              <td style={getCellStyle('number')}>{row.revisions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function loadData(dataEltId: string): CoupledPair[] {
  const dataElement = document.getElementById(dataEltId);
  if (dataElement) {
    return JSON.parse(dataElement.textContent || '[]');
  }
  return [];
}

export function createCoupledPairsTable(
  container: HTMLElement,
  dataEltId: string
) {
  const data = loadData(dataEltId);
  const root = createRoot(container);
  root.render(<CoupledPairsTable data={data} />);
}

const getCellStyle = (
  type: 'file' | 'percentage' | 'number'
): React.CSSProperties => ({
  padding: '10px 8px',
  fontSize: '12px',
  color:
    type === 'file'
      ? MUTED_TEXT_COLOR
      : type === 'percentage'
        ? HIGH_IMPORTANCE_COLOR
        : TEXT_COLOR,
  fontFamily: type === 'file' ? 'monospace' : 'inherit',
  fontWeight: type === 'percentage' ? 'bold' : 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

function sortData(data: CoupledPair[]): CoupledPair[] {
  // Calculate min/max for normalization
  const percentageValues = data.map(d => d.percentage);
  const revisionValues = data.map(d => d.revisions);

  const percentageMin = Math.min(...percentageValues);
  const percentageMax = Math.max(...percentageValues);
  const revisionMin = Math.min(...revisionValues);
  const revisionMax = Math.max(...revisionValues);

  const normalize = (value: number, min: number, max: number) => {
    if (max === min) return 0;
    return (value - min) / (max - min);
  };

  return [...data].sort((a, b) => {
    const normalizedPercentageA = normalize(
      a.percentage,
      percentageMin,
      percentageMax
    );
    const normalizedRevisionsA = normalize(
      a.revisions,
      revisionMin,
      revisionMax
    );
    const scoreA = normalizedPercentageA * normalizedRevisionsA;

    const normalizedPercentageB = normalize(
      b.percentage,
      percentageMin,
      percentageMax
    );
    const normalizedRevisionsB = normalize(
      b.revisions,
      revisionMin,
      revisionMax
    );
    const scoreB = normalizedPercentageB * normalizedRevisionsB;

    return scoreB - scoreA;
  });
}
