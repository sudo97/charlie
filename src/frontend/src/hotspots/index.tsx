import type { Hotspot } from '@core/hotspots.js';
import { createRoot } from 'react-dom/client';
import { Hotspots } from './hotspots';

export function visualizeHotspots(
  container: HTMLElement,
  dataElt: string,
  groupsElt: string
) {
  const data = getData(dataElt);
  const groups = getGroups(groupsElt);
  createRoot(container).render(
    <Hotspots hotspots={data} architecturalGroups={groups} />
  );
}

function getData(dataElt: string): Hotspot[] {
  const dataElement = document.getElementById(dataElt);
  if (!dataElement) {
    throw new Error('Data element not found');
  }
  return JSON.parse(dataElement.textContent || '{}');
}

function getGroups(groupsElt: string): Record<string, string> {
  const groupsElement = document.getElementById(groupsElt);
  if (!groupsElement) {
    throw new Error('Groups element not found');
  }
  return JSON.parse(groupsElement.textContent || '{}');
}
