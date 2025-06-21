import type { CoupledPair } from '@core/coupled-pairs';
import * as d3 from 'd3';
import {
  BACKGROUND_COLOR,
  BORDER_COLOR,
  HOVER_COLOR,
  TEXT_COLOR,
  MUTED_TEXT_COLOR,
  HIGH_IMPORTANCE_COLOR,
} from './colours.js';

export function createCoupledPairsTable(
  container: HTMLElement,
  dataEltId: string
) {
  const data = loadData(dataEltId);

  // Create table container with styling
  const tableContainer = d3
    .select(container)
    .append('div')
    .style('background', BACKGROUND_COLOR)
    .style('border-radius', '8px')
    .style('padding', '20px')
    .style('margin', '20px 0')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)');

  const table = tableContainer
    .append('table')
    .style('width', '100%')
    .style('border-collapse', 'collapse')
    .style('font-family', 'system-ui, -apple-system, sans-serif');

  // Style the header
  const thead = table.append('thead');
  const headerRow = thead
    .append('tr')
    .style('border-bottom', `2px solid ${BORDER_COLOR}`);

  headerRow
    .selectAll('th')
    .data(['File 1', 'File 2', 'Coupling %', 'Revisions', 'Proximity'])
    .enter()
    .append('th')
    .text(d => d)
    .style('padding', '12px 8px')
    .style('text-align', 'left')
    .style('font-weight', 'bold')
    .style('color', TEXT_COLOR)
    .style('font-size', '14px')
    .style('background', 'transparent');

  // Sort data by combined score of proximity * coupling * revisions
  const sortedData = data.sort((a, b) => {
    const scoreA = a.proximity * a.percentage * a.revisions;
    const scoreB = b.proximity * b.percentage * b.revisions;
    return scoreB - scoreA; // Sort descending
  });

  const tbody = table.append('tbody');

  const rows = tbody
    .selectAll('tr')
    .data(sortedData)
    .enter()
    .append('tr')
    .style('border-bottom', `1px solid ${BORDER_COLOR}`)
    .style('transition', 'background-color 0.2s ease')
    .style('cursor', 'pointer')
    .on('mouseenter', function () {
      d3.select(this).style('background-color', HOVER_COLOR);
    })
    .on('mouseleave', function () {
      d3.select(this).style('background-color', 'transparent');
    });

  rows
    .selectAll('td')
    .data(d => [
      { value: d.file1, type: 'file' },
      { value: d.file2, type: 'file' },
      { value: `${(d.percentage * 100).toFixed(1)}%`, type: 'percentage' },
      { value: d.revisions, type: 'number' },
      { value: d.proximity.toFixed(2), type: 'number' },
    ])
    .enter()
    .append('td')
    .text(d => d.value)
    .style('padding', '10px 8px')
    .style('font-size', '12px')
    .style('color', d => {
      if (d.type === 'file') return MUTED_TEXT_COLOR;
      if (d.type === 'percentage') return HIGH_IMPORTANCE_COLOR;
      return TEXT_COLOR;
    })
    .style('font-family', d => {
      return d.type === 'file' ? 'monospace' : 'inherit';
    })
    .style('font-weight', d => {
      return d.type === 'percentage' ? 'bold' : 'normal';
    })
    .attr('title', d => {
      return d.type === 'file' ? d.value : null;
    });
}

function loadData(
  dataEltId: string
): Array<CoupledPair & { proximity: number }> {
  const dataElement = document.getElementById(dataEltId);
  if (dataElement) {
    return JSON.parse(dataElement.textContent || '[]');
  }
  return [];
}
