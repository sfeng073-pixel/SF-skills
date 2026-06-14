import runFoundation from './run-taiwan-call-kpi-foundation.js';
import runCallDurationBroadcast from './run-taiwan-call-kpi-broadcast.js';
import { loadDotEnv } from '../src/io/load-env.js';
import { getTaiwanTlDateText } from '../src/time.js';
import { parseArgs } from './parse-args.js';
import { isDirectRun } from './module-entry.js';

export default async function runTaiwanCallKpiSlot({
  slot = '1500',
  date = getTaiwanTlDateText(),
  runtimeRoot,
  sendMode,
  dryRun = true,
  useLiveExport = true,
  sourceCandidates,
  liveRunOverride,
  resolveSecrets,
  uploadImage,
  sendRobot,
  pythonBin
} = {}) {
  const foundation = await runFoundation({
    slot,
    date,
    runtimeRoot,
    useLiveExport,
    sourceCandidates,
    liveRunOverride,
    pythonBin
  });

  const broadcast = await runCallDurationBroadcast({
    slot,
    date,
    runtimeRoot,
    dryRun,
    sendMode,
    resolveSecrets,
    uploadImage,
    sendRobot,
    pythonBin
  });

  return {
    slot,
    date,
    foundation,
    broadcast
  };
}

const directRun = isDirectRun(import.meta.url);

if (directRun) {
  loadDotEnv();
  const args = parseArgs();
  const sendMode = args['send-mode']
    ? String(args['send-mode'])
    : args['dry-run-send']
      ? 'dry_run_send'
      : args['dry-run']
        ? 'dry_run'
        : undefined;

  runTaiwanCallKpiSlot({
    slot: String(args.slot || '1500'),
    date: String(args.date || getTaiwanTlDateText()),
    runtimeRoot: args['runtime-root'] ? String(args['runtime-root']) : undefined,
    sendMode,
    dryRun: sendMode ? sendMode.startsWith('dry_run') : true,
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
