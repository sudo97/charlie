import {
  coupledPairs,
  significantCoupledPairs,
  type CoupledPair,
} from '@core/coupled-pairs';
import { useMemo, useState } from 'react';
import { CoupledPairsNode } from './coupled-pairs-node';
import { CoupledPairsLink } from './coupled-pairs-link';
import { CoupledPairsTooltip } from './coupled-pairs-tooltip';
import type { LogItem } from '@core/git-log';
import { groupGitLog } from '@core/group-git-log';

export interface Node {
  id: string;
  filePath: string;
  x: number;
  y: number;
  data: {
    name: string;
    path: string;
  };
}

export interface Link {
  source: Node;
  target: Node;
  value: number;
  revisions: number;
}

export interface TooltipData {
  x: number;
  y: number;
  link?: Link;
  node?: Node;
  connections?: number;
}

const DEFAULT_CONFIG = {
  width: 800,
  height: 800,
  innerRadius: 200,
  tension: 0.85,
};

export function CoupledPairsVisualization({
  data,
  architecturalGroups,
}: {
  data: LogItem[];
  architecturalGroups: Record<string, string>;
}) {
  const [couplingThreshold, setCouplingThreshold] = useState(0.5);
  const [revisionsThreshold, setRevisionsThreshold] = useState(0.5);
  const [grouped, setGrouped] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { nodes, links } = useMemo(() => {
    return processData(
      significantCoupledPairs(
        coupledPairs(grouped ? groupGitLog(data, architecturalGroups) : data),
        couplingThreshold,
        revisionsThreshold
      )
    );
  }, [data, couplingThreshold, revisionsThreshold, grouped]);

  const handleLinkHover = (link: Link, event: React.MouseEvent) => {
    const svgElement = event.currentTarget.closest('svg');
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        link,
      });
    }
  };

  const handleNodeHover = (node: Node, event: React.MouseEvent) => {
    const connections = links.filter(
      link => link.source === node || link.target === node
    ).length;

    const svgElement = event.currentTarget.closest('svg');
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        node,
        connections,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>
            Coupling Strength Threshold:
          </label>
          <input
            type="range"
            min="1"
            max="100"
            defaultValue="50"
            style={{ width: '200px' }}
            onChange={e => {
              setCouplingThreshold(Number(e.target.value) / 100);
            }}
          />
          <span style={{ marginLeft: '0.5rem' }}>
            {Math.round(couplingThreshold * 100)}%
          </span>
        </div>

        <div>
          <label style={{ marginRight: '0.5rem' }}>Revisions Threshold:</label>
          <input
            type="range"
            min="1"
            max="100"
            defaultValue="50"
            style={{ width: '200px' }}
            onChange={e => {
              setRevisionsThreshold(Number(e.target.value) / 100);
            }}
          />
          <span style={{ marginLeft: '0.5rem' }}>
            {Math.round(revisionsThreshold * 100)}%
          </span>
        </div>
        {Object.keys(architecturalGroups).length > 0 && (
          <div>
            <label style={{ marginRight: '0.5rem' }}>Grouped:</label>
            <input
              type="checkbox"
              checked={grouped}
              onChange={() => setGrouped(!grouped)}
            />
          </div>
        )}
      </div>
      <svg
        width={DEFAULT_CONFIG.width}
        height={DEFAULT_CONFIG.height}
        viewBox={`-${DEFAULT_CONFIG.width / 2} -${DEFAULT_CONFIG.height / 2} ${DEFAULT_CONFIG.width} ${DEFAULT_CONFIG.height}`}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          background: '#fafafa',
        }}
      >
        <g>
          {links.map((link, index) => (
            <CoupledPairsLink
              key={`${link.source.id}-${link.target.id}-${index}`}
              link={link}
              tension={DEFAULT_CONFIG.tension}
              onHover={handleLinkHover}
              onMouseLeave={handleMouseLeave}
              isHighlighted={tooltip?.link === link}
              isDimmed={tooltip?.link ? tooltip.link !== link : false}
            />
          ))}
        </g>
        <g>
          {nodes.map(node => (
            <CoupledPairsNode
              key={node.id}
              node={node}
              onHover={handleNodeHover}
              onMouseLeave={handleMouseLeave}
              isHighlighted={tooltip?.node === node}
              isDimmed={tooltip?.node ? tooltip.node !== node : false}
              connectedToHighlighted={
                tooltip?.link
                  ? tooltip.link.source === node || tooltip.link.target === node
                  : false
              }
            />
          ))}
        </g>
        {tooltip && (
          <CoupledPairsTooltip
            tooltip={tooltip}
            svgWidth={DEFAULT_CONFIG.width}
            svgHeight={DEFAULT_CONFIG.height}
          />
        )}
      </svg>
    </div>
  );
}

function generateUniqueDisplayNames(files: string[]): Map<string, string> {
  const displayNames = new Map<string, string>();

  // Group files by their filename
  const filesByName = new Map<string, string[]>();
  files.forEach(file => {
    const filename = file.split('/').pop();
    if (!filename) return;

    if (!filesByName.has(filename)) {
      filesByName.set(filename, []);
    }
    filesByName.get(filename)!.push(file);
  });

  // For each group, determine the minimum path needed to make them unique
  for (const [filename, filePaths] of filesByName) {
    if (filePaths.length === 1) {
      displayNames.set(filePaths[0]!, filename);
    } else {
      const pathSegments = filePaths.map(path => path.split('/'));
      let segmentsNeeded = 1;

      while (segmentsNeeded <= Math.max(...pathSegments.map(p => p.length))) {
        const suffixes = new Set();
        let allUnique = true;

        for (const segments of pathSegments) {
          const suffix = segments.slice(-segmentsNeeded).join('/');
          if (suffixes.has(suffix)) {
            allUnique = false;
            break;
          }
          suffixes.add(suffix);
        }

        if (allUnique) {
          for (const path of filePaths) {
            const segments = path.split('/');
            const displayName = segments.slice(-segmentsNeeded).join('/');
            displayNames.set(path, displayName);
          }
          break;
        }

        segmentsNeeded++;
      }

      if (segmentsNeeded > Math.max(...pathSegments.map(p => p.length))) {
        for (const path of filePaths) {
          displayNames.set(path, path);
        }
      }
    }
  }

  return displayNames;
}

function processData(coupledPairs: CoupledPair[]): {
  nodes: Node[];
  links: Link[];
} {
  // Extract unique files
  const fileSet = new Set<string>();
  coupledPairs.forEach(pair => {
    fileSet.add(pair.file1);
    fileSet.add(pair.file2);
  });

  const files = Array.from(fileSet);
  const displayNames = generateUniqueDisplayNames(files);

  // Create nodes in circular layout
  const totalFiles = files.length;
  const angleStep = (2 * Math.PI) / totalFiles;

  const nodes: Node[] = files.map((file, index) => {
    const angle = index * angleStep;
    const fileName = file.split('/').pop();
    const displayName = displayNames.get(file) || fileName || file;

    return {
      id: file,
      filePath: file,
      x: angle,
      y: DEFAULT_CONFIG.innerRadius,
      data: {
        name: displayName,
        path: file,
      },
    };
  });

  const nodeById = new Map(nodes.map(node => [node.id, node]));

  // Create links from coupled pairs
  const links: Link[] = coupledPairs
    .map(pair => {
      const source = nodeById.get(pair.file1);
      const target = nodeById.get(pair.file2);
      if (source && target) {
        return {
          source,
          target,
          value: pair.percentage,
          revisions: pair.revisions,
        };
      }
      return null;
    })
    .filter((link): link is Link => link !== null);

  return { nodes, links };
}
