import { normalizeCallDurationSource } from '../normalizers/call-duration.js';
import { markReadyWhenNoBlockingWarnings } from '../verification/status.js';
import { createResultEnvelope } from './result-envelope.js';

function takeTail(rows, key) {
  return [...rows]
    .filter((row) => typeof row[key] === 'number')
    .sort((a, b) => a[key] - b[key])
    .slice(0, 3);
}

export function buildRankingResult({ slot, runAt, callDurationPath, upstreamWarnings = [], pythonBin } = {}) {
  const warnings = [...upstreamWarnings];
  const rows = callDurationPath ? normalizeCallDurationSource(callDurationPath, { pythonBin }) : [];
  const durationTail = takeTail(rows, 'duration');
  const callCountTail = takeTail(rows, 'callCount');

  const result = createResultEnvelope({
    slot,
    module: 'call_duration',
    runAt,
    sourceFiles: callDurationPath ? [callDurationPath] : [],
    normalizedRows: rows,
    summaryMetrics: {
      salesCount: rows.length,
      durationTailSales: durationTail.map((row) => row.sales),
      callCountTailSales: callCountTail.map((row) => row.sales)
    },
    exceptionCandidates: {
      durationTail,
      callCountTail
    },
    warnings
  });

  const status = markReadyWhenNoBlockingWarnings(warnings);
  result.broadcast_ready = rows.length > 0 && status.broadcastReady;
  return result;
}
