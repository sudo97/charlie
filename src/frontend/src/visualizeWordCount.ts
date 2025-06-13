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

export function visualizeWordCount(element: HTMLElement) {
  const data = getData();

  const maxCount = Math.max(...Object.values(data));
  // Convert the word count data to the format expected by d3-cloud
  const words: WordData[] = Object.entries(data).map(([text, count]) => ({
    text,
    size: (count / maxCount) * 80, // Normalize count between 10-80
  }));

  // Set up the word cloud layout
  const width = 800;
  const height = 600;

  const layout = cloud<CloudWord>()
    .size([width, height])
    .words(words)
    .padding(5)
    .rotate(() => 0)
    .font(
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
    )
    .fontSize((d: CloudWord) => d.size)
    .on('end', (words: CloudWord[]) => draw(words, element, width, height));

  layout.start();
}

function draw(
  words: CloudWord[],
  element: HTMLElement,
  width: number,
  height: number
) {
  // Clear any existing content
  d3.select(element).selectAll('*').remove();

  // Create SVG
  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Create group element centered in the SVG
  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

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

  // Add words to the visualization
  g.selectAll('text')
    .data(words)
    .enter()
    .append('text')
    .style('font-size', d => `${d.size}px`)
    .style('font-family', 'Impact')
    .style('fill', (_d, i) => colorScheme[i % colorScheme.length] || '#1f77b4')
    .attr('text-anchor', 'middle')
    .attr(
      'transform',
      d => `translate(${d.x || 0}, ${d.y || 0})rotate(${d.rotate || 0})`
    )
    .text(d => d.text)
    .style('cursor', 'pointer')
    .on('mouseover', function () {
      d3.select(this).style('opacity', 0.7);
    })
    .on('mouseout', function () {
      d3.select(this).style('opacity', 1);
    });
}

function getData(): Record<string, number> {
  const data = document.getElementById('word-count-data')!;
  return JSON.parse(data.textContent!);
}
