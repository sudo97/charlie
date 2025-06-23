import { CoupledPairsVisualization } from './coupled-pairs';
import { CoupledPairsTable } from '../coupled-pairs-table';
import type { AppData } from '../data-loader';

export const CoupledPairsTab = ({ data }: { data: AppData }) => {
  return (
    <>
      <div id="coupled-pairs" className="visualization">
        <CoupledPairsVisualization
          data={data.logItems}
          architecturalGroups={data.architecturalGroups}
        />
      </div>
      <div id="coupled-pairs-table" className="visualization">
        <CoupledPairsTable data={data.coupledPairs} />
      </div>
    </>
  );
};
