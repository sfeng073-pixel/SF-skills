import path from 'node:path';

import { TAIWAN_GROUP, TAIWAN_TEAM } from '../config.js';

function normalizeSourceFileReference(filePath) {
  if (!filePath) {
    return filePath;
  }

  const relativePath = path.relative(process.cwd(), filePath);
  if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return filePath;
}

export function createResultEnvelope({
  slot,
  module,
  runAt,
  sourceFiles = [],
  normalizedRows = [],
  summaryMetrics = {},
  exceptionCandidates = {},
  warnings = []
}) {
  return {
    run_at: runAt,
    module,
    time_slot: slot,
    team_scope: {
      team: TAIWAN_TEAM,
      group: TAIWAN_GROUP
    },
    source_files: sourceFiles.map((filePath) => normalizeSourceFileReference(filePath)),
    normalized_rows: normalizedRows,
    summary_metrics: summaryMetrics,
    exception_candidates: exceptionCandidates,
    broadcast_ready: false,
    warnings
  };
}
