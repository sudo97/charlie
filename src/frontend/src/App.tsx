import { useState } from 'react';
import { Hotspots } from './hotspots/hotspots';
import { SocVisualization } from './soc/soc-visualization';
import { WordCloudComponent } from './visualizeWordCount';
import type { AppData } from './data-loader';
import { CoupledPairsTab } from './coupled-pairs/coupled-pairs-tab';

interface AppProps {
  data: AppData;
}

type TabType = 'hotspots' | 'coupled-pairs' | 'soc' | 'word-count';

export function App({ data }: AppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hotspots');

  const tabs = [
    { id: 'hotspots' as const, label: 'File-level Hotspots' },
    { id: 'coupled-pairs' as const, label: 'Coupled Pairs' },
    { id: 'soc' as const, label: 'Sum of Coupling' },
    { id: 'word-count' as const, label: 'Word Count' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hotspots':
        return (
          <div id="visualization" className="visualization">
            <Hotspots
              hotspots={data.hotspots}
              architecturalGroups={data.architecturalGroups}
              soc={data.soc}
            />
          </div>
        );

      case 'coupled-pairs':
        return <CoupledPairsTab data={data} />;

      case 'soc':
        return (
          <div id="soc">
            <SocVisualization data={data.soc} />
          </div>
        );

      case 'word-count':
        return (
          <>
            <p style={{ color: '#666', fontSize: '0.9em', margin: '20px 0' }}>
              Your team's modus operandi. Not really a metric, but if you see
              that FIX is the most common word by far, it should make you think.
            </p>
            <div id="word-count">
              <WordCloudComponent data={data.wordCount} />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container">
      <h1>
        {(window as unknown as { reportTitle?: string }).reportTitle ||
          'Code Analysis Report'}
      </h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <section className="tab-content">{renderTabContent()}</section>
    </div>
  );
}
