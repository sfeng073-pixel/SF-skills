import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildCallDurationBroadcastText,
  buildCallDurationPosterModel,
  buildImageMarkdownPayload,
  buildTailAlerts,
  buildTextMarkdownPayload
} from '../src/broadcast/call-duration-broadcast.js';
import { resolveSecretsFromEnv, sendRobotMessage, uploadImageViaDrive } from '../src/dingtalk/robot.js';
import { loadDotEnv } from '../src/io/load-env.js';
import { readJsonFile } from '../src/io/read-json.js';
import { broadcastArtifactPaths, resultFileForSlot } from '../src/io/runtime-paths.js';
import { SUPPORTED_SLOTS, SLOT_LABELS } from '../src/config.js';
import { getTaiwanTlDateText } from '../src/time.js';
import { parseArgs } from './parse-args.js';
import { isDirectRun } from './module-entry.js';

const POSTER_SCRIPT = fileURLToPath(new URL('../src/live/call-duration-poster-python.py', import.meta.url));

function resolvePythonBin(pythonBin) {
  return pythonBin || process.env.TAIWAN_CALL_KPI_PYTHON_BIN || process.env.PYTHON_BIN || 'python3';
}

function renderPoster(modelPath, posterPath, pythonBin) {
  const render = spawnSync(resolvePythonBin(pythonBin), [POSTER_SCRIPT, modelPath, posterPath], {
    encoding: 'utf8'
  });

  if (render.status !== 0) {
    throw new Error(render.stderr || render.stdout || 'call duration poster render failed');
  }
}

function buildArtifacts({ date, slot, result, runtimeRoot, pythonBin }) {
  const slotLabel = SLOT_LABELS[slot];
  const model = buildCallDurationPosterModel(result, { slotLabel });
  const text = buildCallDurationBroadcastText(result, {
    slotLabel
  });
  const paths = broadcastArtifactPaths(date, slot, { runtimeRoot });

  fs.writeFileSync(paths.modelPath, JSON.stringify(model, null, 2));
  fs.writeFileSync(paths.textPath, text, 'utf8');
  renderPoster(paths.modelPath, paths.posterPath, pythonBin);

  return {
    ...paths,
    text,
    slotLabel
  };
}

function normalizeSendMode({ dryRun = true, sendMode }) {
  if (sendMode) {
    return sendMode;
  }
  return dryRun ? 'dry_run' : process.env.DINGTALK_IMAGE_DELIVERY || 'drive_markdown';
}

export default async function runCallDurationBroadcast({
  slot = '1500',
  date = getTaiwanTlDateText(),
  runtimeRoot,
  resultPath,
  dryRun = true,
  sendMode,
  resolveSecrets = resolveSecretsFromEnv,
  uploadImage = uploadImageViaDrive,
  sendRobot = sendRobotMessage,
  pythonBin
} = {}) {
  if (!SUPPORTED_SLOTS.includes(slot)) {
    throw new Error(`Unsupported slot: ${slot}`);
  }

  const resolvedResultPath = resultPath || resultFileForSlot(slot, date, { runtimeRoot });
  const result = readJsonFile(resolvedResultPath);
  const artifacts = buildArtifacts({ date, slot, result, runtimeRoot, pythonBin });
  const normalizedSendMode = normalizeSendMode({ dryRun, sendMode });

  if (normalizedSendMode === 'dry_run') {
    return {
      date,
      slot,
      dryRun: true,
      sendMode: 'dry_run',
      sent: false,
      resultPath: resolvedResultPath,
      ...artifacts
    };
  }

  const secrets = resolveSecrets();
  const alerts = buildTailAlerts(result, secrets.userMapping || new Map());
  const text = buildCallDurationBroadcastText(result, {
    slotLabel: artifacts.slotLabel,
    alerts
  });
  fs.writeFileSync(artifacts.textPath, text, 'utf8');

  const imageAsset =
    normalizedSendMode === 'webhook_markdown'
      ? { mode: 'webhook_markdown', imageUrl: `file://${artifacts.posterPath}`, pageUrl: '' }
      : await uploadImage({ posterPath: artifacts.posterPath, driveSpaceId: secrets.driveSpaceId });

  const payloads = [
    {
      kind: 'image',
      payload: buildImageMarkdownPayload({
        result,
        slotLabel: artifacts.slotLabel,
        imageUrl: imageAsset.imageUrl,
        pageUrl: imageAsset.pageUrl
      })
    },
    {
      kind: 'text',
      payload: buildTextMarkdownPayload({
        result,
        slotLabel: artifacts.slotLabel,
        text,
        alerts
      })
    }
  ];

  if (normalizedSendMode === 'dry_run_send') {
    return {
      date,
      slot,
      dryRun: true,
      sendMode: 'dry_run_send',
      sent: false,
      resultPath: resolvedResultPath,
      payloads,
      imageAsset,
      alerts,
      ...artifacts
    };
  }

  const responses = [];
  for (const item of payloads) {
    responses.push(
      await sendRobot({
        webhookUrl: secrets.webhookUrl,
        webhookSecret: secrets.webhookSecret,
        payload: item.payload
      })
    );
  }

  return {
    date,
    slot,
    dryRun: false,
    sendMode: normalizedSendMode,
    sent: true,
    resultPath: resolvedResultPath,
    payloads,
    responses,
    imageAsset,
    alerts,
    ...artifacts
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

  runCallDurationBroadcast({
    slot: String(args.slot || '1500'),
    date: String(args.date || getTaiwanTlDateText()),
    runtimeRoot: args['runtime-root'] ? String(args['runtime-root']) : undefined,
    resultPath: args.result ? String(args.result) : undefined,
    dryRun: sendMode ? sendMode.startsWith('dry_run') : true,
    sendMode,
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
