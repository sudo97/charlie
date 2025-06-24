import { CoupledPairsVisualization } from './coupled-pairs';
import { CoupledPairsTable } from './coupled-pairs-table';
import type { AppData } from '../data-loader';
import { useMemo, useState } from 'react';
import { coupledPairs, sortCoupledPairs } from '@core/coupled-pairs';
import { groupGitLog } from '@core/group-git-log';

export const CoupledPairsTab = ({ data }: { data: AppData }) => {
  const [grouped, setGrouped] = useState(false);
  const [significanceThreshold, setSignigicanceThreshold] = useState(0.7);
  const coupledPairsData = useMemo(() => {
    const allItems = sortCoupledPairs(
      coupledPairs(
        grouped
          ? groupGitLog(data.logItems, data.architecturalGroups)
          : data.logItems
      )
    );
    const idx = Math.floor(allItems.length * (1 - significanceThreshold));
    return allItems.slice(0, idx);
  }, [data.logItems, data.architecturalGroups, grouped, significanceThreshold]);
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <div>
          <label style={{ marginRight: '0.5rem' }}>
            Significance Threshold:
          </label>
          <input
            type="range"
            min="1"
            max="100"
            defaultValue="70"
            style={{ width: '200px' }}
            onChange={e => {
              setSignigicanceThreshold(Number(e.target.value) / 100);
            }}
          />
          <span style={{ marginLeft: '0.5rem' }}>
            {Math.round(significanceThreshold * 100)}%
          </span>
        </div>
        {Object.keys(data.architecturalGroups).length > 0 && (
          <div>
            <label style={{ marginRight: '0.5rem' }}>Grouped:</label>
            <input
              type="checkbox"
              checked={grouped}
              onChange={() => setGrouped(!grouped)}
            />
          </div>
        )}
      </div>
      <div id="coupled-pairs" className="visualization">
        <CoupledPairsVisualization data={coupledPairsData} />
      </div>
      <div id="coupled-pairs-table" className="visualization">
        <CoupledPairsTable data={coupledPairsData} />
      </div>
    </>
  );
};
