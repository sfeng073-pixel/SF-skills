import { buildSlotRunAt, getTaiwanTlDateText } from '../src/time.js';
import { resultFileForSlot } from '../src/io/runtime-paths.js';
import { writeJsonFileAtomic } from '../src/io/write-json.js';
import { loadDotEnv } from '../src/io/load-env.js';
import { buildRankingResult } from '../src/results/build-ranking-result.js';
import { resolveCallDurationSource } from '../src/live/call-duration-live.js';
import { SUPPORTED_SLOTS } from '../src/config.js';
import { parseArgs } from './parse-args.js';
import { isDirectRun } from './module-entry.js';

export default async function runFoundation({
  slot = '1500',
  date = getTaiwanTlDateText(),
  runtimeRoot,
  useLiveExport = true,
  sourceCandidates,
  liveRunOverride,
  pythonBin
} = {}) {
  if (!SUPPORTED_SLOTS.includes(slot)) {
    throw new Error(`Unsupported slot: ${slot}`);
  }

  const runAt = buildSlotRunAt(date, slot);
  const callDurationSource = await resolveCallDurationSource({
    date,
    slot,
    runtimeRoot,
    useLiveExport,
    sourceCandidates,
    liveRunOverride,
    pythonBin
  });

  const result = buildRankingResult({
    slot,
    runAt,
    callDurationPath: callDurationSource.callDurationPath,
    upstreamWarnings: callDurationSource.warnings || [],
    pythonBin
  });

  const resultPath = resultFileForSlot(slot, date, { runtimeRoot });
  writeJsonFileAtomic(resultPath, result);

  return {
    ...result,
    result_path: resultPath
  };
}

const directRun = isDirectRun(import.meta.url);

if (directRun) {
  loadDotEnv();
  const args = parseArgs();
  runFoundation({
    slot: String(args.slot || '1500'),
    date: String(args.date || getTaiwanTlDateText()),
    runtimeRoot: args['runtime-root'] ? String(args['runtime-root']) : undefined,
    useLiveExport: !args['no-live-export'],
    sourceCandidates: args.source ? [String(args.source)] : undefined,
    pythonBin: args['python-bin'] ? String(args['python-bin']) : undefined
  })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
