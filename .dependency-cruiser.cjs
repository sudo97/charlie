/**
 * Coupling rules from DISCIPLINE.md, enforced on every PR.
 * Instability I = Ce / (Ca + Ce), measured per file.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'No dependency cycles, anywhere, at any level.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-purity',
      severity: 'error',
      comment:
        'The Core imports nothing from the Shell. Effects arrive as arguments.',
      from: { path: '^src/core' },
      to: { path: '^src/(cli|frontend)' },
    },
    {
      name: 'core-no-io',
      severity: 'error',
      comment:
        'The Core is pure: no I/O, no framework types, no clock, no network.',
      from: { path: '^src/core' },
      to: {
        path: [
          '^(fs|fs/promises|path|child_process|http|https|net|os|crypto|worker_threads|stream)$',
          '^node:',
          '^node_modules/(react|react-dom|d3|d3-cloud|isomorphic-git|mustache|commander|@react-spring)',
        ],
      },
    },
    {
      name: 'not-to-unstable',
      severity: 'error',
      comment:
        'Stable Dependency Principle: a module may only depend on modules at least as stable as itself.',
      from: { path: '^src', pathNot: '^src/tests' },
      to: { path: '^src', pathNot: '^src/tests', moreUnstable: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'Modules nothing depends on and that depend on nothing are usually dead.',
      from: {
        orphan: true,
        pathNot: ['\\.d\\.ts$', '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$'],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)dist/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    metrics: true,
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
