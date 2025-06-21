import type { TreeData } from '@core/tree-data';
import { createRoot } from 'react-dom/client';
import { Hotspots } from './hotspots';

export function visualizeHotspots(container: HTMLElement, dataElt: string) {
  const data = getData(dataElt);
  createRoot(container).render(<Hotspots data={data} />);
}

function getData(dataElt: string): TreeData {
  const dataElement = document.getElementById(dataElt);
  if (!dataElement) {
    throw new Error('Data element not found');
  }
  return JSON.parse(dataElement.textContent || '{}');
}
