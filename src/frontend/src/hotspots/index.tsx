import type { Hotspot } from '@core/hotspots.js';
import { createRoot } from 'react-dom/client';
import { Hotspots } from './hotspots';
import type { Soc } from '@core/soc';

export function visualizeHotspots(
  container: HTMLElement,
  dataElt: string,
  groupsElt: string,
  socElt: string
) {
  const data = getData(dataElt);
  const groups = getGroups(groupsElt);
  const soc = getSoc(socElt);
  createRoot(container).render(
    <Hotspots hotspots={data} architecturalGroups={groups} soc={soc} />
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

function getSoc(socElt: string): Soc[] {
  const dataElement = document.getElementById(socElt);
  if (!dataElement) {
    throw new Error('SOC data element not found');
  }
  return JSON.parse(dataElement.textContent || '[]');
}
