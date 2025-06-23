import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordData {
  text: string;
  size: number;
}

interface CloudWord extends WordData {
  x?: number;
  y?: number;
  rotate?: number;
}

export const WordCloudComponent: React.FC<{ data: Record<string, number> }> = ({
  data,
}) => {
  const [words, setWords] = useState<CloudWord[]>([]);

  const width = 800;
  const height = 600;

  useEffect(() => {
    const maxCount = Math.max(...Object.values(data));

    // Convert the word count data to the format expected by d3-cloud
    const wordData: WordData[] = Object.entries(data).map(([text, count]) => ({
      text,
      size: (count / maxCount) * 80, // Normalize count between 10-80
    }));

    const layout = cloud<CloudWord>()
      .size([width, height])
      .words(wordData)
      .padding(5)
      .rotate(() => 0)
      .font(
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
      )
      .fontSize((d: CloudWord) => d.size)
      .on('end', (calculatedWords: CloudWord[]) => {
        setWords(calculatedWords);
      });

    layout.start();
  }, []);

  // Define color palette
  const colorScheme = d3.schemeCategory10 || [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
  ];

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width / 2}, ${height / 2})`}>
        {words.map((word, index) => (
          <text
            key={`${word.text}-${index}`}
            x={word.x || 0}
            y={word.y || 0}
            fontSize={`${word.size}px`}
            fontFamily="Impact"
            fill={colorScheme[index % colorScheme.length] || '#1f77b4'}
            textAnchor="middle"
            transform={`rotate(${word.rotate || 0})`}
            style={{
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseOut={e => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {word.text}
          </text>
        ))}
      </g>
    </svg>
  );
};

export function visualizeWordCount(element: HTMLElement) {
  const root = createRoot(element);
  const data = getData();
  root.render(<WordCloudComponent data={data} />);
}

function getData(): Record<string, number> {
  const data = document.getElementById('word-count-data')!;
  return JSON.parse(data.textContent!);
}
