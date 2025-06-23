import React from 'react';
import { Hotspots } from './hotspots/hotspots';
import { CoupledPairsVisualization } from './coupled-pairs/coupled-pairs';
import { CoupledPairsTable } from './coupled-pairs-table';
import { SocVisualization } from './soc/soc-visualization';
import { WordCloudComponent } from './visualizeWordCount';
import type { AppData } from './data-loader';

interface AppProps {
  data: AppData;
}

export function App({ data }: AppProps) {
  return (
    <div className="container">
      <h1>
        {(window as unknown as { reportTitle?: string }).reportTitle ||
          'Code Analysis Report'}
      </h1>

      <section>
        <h2>File-level Hotspots</h2>
        <div id="visualization" className="visualization">
          <Hotspots
            hotspots={data.hotspots}
            architecturalGroups={data.architecturalGroups}
            soc={data.soc}
          />
        </div>
      </section>

      <section>
        <h2>Coupled Pairs</h2>
        <div id="coupled-pairs" className="visualization">
          <CoupledPairsVisualization
            data={data.logItems}
            config={{
              container: document.createElement('div'), // Placeholder, won't be used
              data: '',
              groups: '',
            }}
            architecturalGroups={data.architecturalGroups}
          />
        </div>

        <div id="coupled-pairs-table" className="visualization">
          <CoupledPairsTable data={data.coupledPairs} />
        </div>
      </section>

      <section>
        <div id="soc">
          <SocVisualization data={data.soc} />
        </div>
      </section>

      <section>
        <h2>Word Count</h2>
        <p style={{ color: '#666', fontSize: '0.9em', margin: '20px 0' }}>
          Your team's modus operandi. Not really a metric, but if you see that
          FIX is the most common word by far, it should make you think.
        </p>
        <div id="word-count">
          <WordCloudComponent data={data.wordCount} />
        </div>
      </section>
    </div>
  );
}
