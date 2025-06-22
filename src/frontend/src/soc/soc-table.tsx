import * as d3 from 'd3';
import type { Soc } from '../../../core/soc.js';
import {
  LOW_IMPORTANCE_COLOR,
  MID_IMPORTANCE_COLOR,
  HIGH_IMPORTANCE_COLOR,
  BACKGROUND_COLOR,
  BORDER_COLOR,
  TEXT_COLOR,
} from '../colours.js';
import { SocRow } from './soc-row.js';

interface VisualizationContainerProps {
  data: Soc[];
}

export function VisualizationContainer({ data }: VisualizationContainerProps) {
  const maxSoc = Math.max(...data.map(d => d.soc));
  const colorScale = createColorScale(maxSoc);

  return (
    <div
      style={{
        background: BACKGROUND_COLOR,
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: `2px solid ${BORDER_COLOR}`,
          marginBottom: '10px',
          fontWeight: 'bold',
          color: TEXT_COLOR,
        }}
      >
        <div style={{ flex: '0 0 300px', paddingRight: '20px' }}>File</div>
        <div style={{ flex: 1 }}>SOC Score</div>
      </div>

      {data.map(d => (
        <SocRow key={d.file} data={d} maxSoc={maxSoc} colorScale={colorScale} />
      ))}
    </div>
  );
}

function createColorScale(maxSoc: number) {
  return d3
    .scaleLinear<string>()
    .domain([0, maxSoc / 2, maxSoc])
    .range([LOW_IMPORTANCE_COLOR, MID_IMPORTANCE_COLOR, HIGH_IMPORTANCE_COLOR])
    .interpolate(d3.interpolateHcl);
}
