import {
  BORDER_COLOR,
  HOVER_COLOR,
  TEXT_COLOR,
  MUTED_TEXT_COLOR,
} from '../colours.js';
import type { Soc } from '@core/soc';
import { useState } from 'react';

interface SocRowProps {
  data: Soc;
  maxSoc: number;
  colorScale: d3.ScaleLinear<string, string>;
}

export function SocRow({ data, maxSoc, colorScale }: SocRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    console.log(`Clicked on file: ${data.file} with SOC: ${data.soc}`);
  };

  const widthPercentage = (data.soc / maxSoc) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${BORDER_COLOR}`,
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
        backgroundColor: isHovered ? HOVER_COLOR : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* File name */}
      <div
        style={{
          flex: '0 0 300px',
          paddingRight: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: MUTED_TEXT_COLOR,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={data.file}
      >
        {data.file.length > 40 ? '...' + data.file.slice(-37) : data.file}
      </div>

      {/* Bar container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Bar */}
        <div
          style={{
            height: '24px',
            backgroundColor: colorScale(data.soc),
            borderRadius: '4px',
            width: `${widthPercentage}%`,
            minWidth: '2px',
            transition: 'opacity 0.2s ease',
          }}
        />

        {/* SOC value label */}
        <span
          style={{
            marginLeft: '10px',
            fontWeight: 'bold',
            color: TEXT_COLOR,
            fontSize: '12px',
          }}
        >
          {data.soc}
        </span>
      </div>
    </div>
  );
}
