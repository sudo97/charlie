import type { Hotspot } from '@core/hotspots.js';
import { createRoot } from 'react-dom/client';
import { Hotspots } from './hotspots';
import { type Soc, soc } from '@core/soc';

export function visualizeHotspots(
  container: HTMLElement,
  {
    dataElt,
    groupsElt,
    socElt,
  }: { dataElt: string; groupsElt: string; socElt: string }
) {
  const data = getData(dataElt);
  const groups = getGroups(groupsElt);
  const soc = getLogItemsData(socElt);
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

function getLogItemsData(logItemsElt: string): Soc[] {
  const dataElement = document.getElementById(logItemsElt);

  if (!dataElement) {
    throw new Error('Log items data element not found');
  }
  return soc(JSON.parse(dataElement.textContent || '[]'));
}
