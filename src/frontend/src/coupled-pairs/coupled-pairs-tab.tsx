import { CoupledPairsVisualization } from './coupled-pairs';
import { CoupledPairsTable } from '../coupled-pairs-table';
import type { AppData } from '../data-loader';
import { useMemo, useState } from 'react';
import { coupledPairs, significantCoupledPairs } from '@core/coupled-pairs';
import { groupGitLog } from '@core/group-git-log';

export const CoupledPairsTab = ({ data }: { data: AppData }) => {
  const [grouped, setGrouped] = useState(false);
  const [couplingThreshold, setCouplingThreshold] = useState(0.5);
  const [revisionsThreshold, setRevisionsThreshold] = useState(0.5);
  const coupledPairsData = useMemo(() => {
    return significantCoupledPairs(
      coupledPairs(
        grouped
          ? groupGitLog(data.logItems, data.architecturalGroups)
          : data.logItems
      ),
      couplingThreshold,
      revisionsThreshold
    );
  }, [
    data.logItems,
    data.architecturalGroups,
    grouped,
    couplingThreshold,
    revisionsThreshold,
  ]);
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>
            Coupling Strength Threshold:
          </label>
          <input
            type="range"
            min="1"
            max="100"
            defaultValue="50"
            style={{ width: '200px' }}
            onChange={e => {
              setCouplingThreshold(Number(e.target.value) / 100);
            }}
          />
          <span style={{ marginLeft: '0.5rem' }}>
            {Math.round(couplingThreshold * 100)}%
          </span>
        </div>

        <div>
          <label style={{ marginRight: '0.5rem' }}>Revisions Threshold:</label>
          <input
            type="range"
            min="1"
            max="100"
            defaultValue="50"
            style={{ width: '200px' }}
            onChange={e => {
              setRevisionsThreshold(Number(e.target.value) / 100);
            }}
          />
          <span style={{ marginLeft: '0.5rem' }}>
            {Math.round(revisionsThreshold * 100)}%
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
