import { useState } from 'react';
import * as d3 from 'd3';
import type { CouplingItem } from '../../../core/coupling.js';
import {
  BACKGROUND_COLOR,
  BORDER_COLOR,
  TEXT_COLOR,
  LOW_IMPORTANCE_COLOR,
} from '../colours.js';

interface CouplingRowProps {
  data: CouplingItem;
  maxSoc: number;
  colorScale: d3.ScaleLinear<string, string>;
}

export function CouplingRow({ data, maxSoc, colorScale }: CouplingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const backgroundColor = colorScale(data.soc);
  const hasCoupledFiles = data.coupledFiles.length > 0;

  const toggleExpanded = () => {
    if (hasCoupledFiles) {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <div
        style={{
          padding: '8px 0',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          cursor: hasCoupledFiles ? 'pointer' : 'default',
        }}
        onClick={toggleExpanded}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ flex: '0 0 50px', paddingRight: '10px' }}>
            {hasCoupledFiles && (
              <span
                style={{
                  fontSize: '14px',
                  color: TEXT_COLOR,
                  userSelect: 'none',
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  display: 'inline-block',
                }}
              >
                ▶
              </span>
            )}
          </div>
          <div
            style={{
              flex: 1,
              color: TEXT_COLOR,
              fontFamily: 'monospace',
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={data.file}
          >
            {data.file}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '60px',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <div
              style={{
                height: '24px',
                backgroundColor,
                borderRadius: '12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                width: `${(data.soc / maxSoc) * 100}%`,
                minWidth: '60px',
              }}
            >
              {data.soc}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content showing coupled files */}
      {expanded && hasCoupledFiles && (
        <div
          style={{
            marginLeft: '60px',
            marginBottom: '10px',
            padding: '10px',
            background: BACKGROUND_COLOR,
            borderRadius: '4px',
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: TEXT_COLOR,
              marginBottom: '8px',
            }}
          >
            Coupled Files ({data.coupledFiles.length}):
          </div>
          {data.coupledFiles
            .sort((a, b) => b.percentage - a.percentage)
            .map((coupled, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 0',
                  borderBottom:
                    index < data.coupledFiles.length - 1
                      ? `1px solid ${BORDER_COLOR}20`
                      : 'none',
                }}
              >
                {/* First line: filepath */}
                <div
                  style={{
                    fontSize: '12px',
                    color: TEXT_COLOR,
                    fontFamily: 'monospace',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={coupled.file}
                >
                  {coupled.file}
                </div>

                {/* Second line: percentage, revisions, and bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: TEXT_COLOR,
                  }}
                >
                  <div
                    style={{
                      flex: '0 0 80px',
                      paddingRight: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    {Math.round(coupled.percentage * 100)}%
                  </div>
                  <div
                    style={{
                      flex: '0 0 80px',
                      paddingRight: '10px',
                      color: '#666',
                      fontSize: '11px',
                    }}
                  >
                    ({coupled.revisions} rev{coupled.revisions !== 1 ? 's' : ''}
                    )
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: '8px',
                        backgroundColor: LOW_IMPORTANCE_COLOR,
                        borderRadius: '4px',
                        width: `${coupled.percentage * 100}%`,
                        minWidth: '10px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
