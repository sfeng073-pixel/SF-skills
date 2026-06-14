import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_RUNTIME_ROOT } from '../config.js';

export function getRuntimeRoot(runtimeRoot) {
  return path.resolve(runtimeRoot || process.env.TAIWAN_CALL_KPI_RUNTIME_ROOT || DEFAULT_RUNTIME_ROOT);
}

export function ensureRuntimeDirectories({ runtimeRoot } = {}) {
  const rootDir = getRuntimeRoot(runtimeRoot);
  const resultsDir = path.join(rootDir, 'results');
  const broadcastDir = path.join(rootDir, 'broadcast');
  const privateDir = path.join(rootDir, 'private');
  const logsDir = path.join(rootDir, 'logs');

  for (const dir of [rootDir, resultsDir, broadcastDir, privateDir, logsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return { rootDir, resultsDir, broadcastDir, privateDir, logsDir };
}

export function resultFileForSlot(slot, date, { runtimeRoot } = {}) {
  const { resultsDir } = ensureRuntimeDirectories({ runtimeRoot });
  return path.join(resultsDir, `${date}-slot-${slot}.json`);
}

export function broadcastArtifactPaths(date, slot, { runtimeRoot } = {}) {
  const { broadcastDir } = ensureRuntimeDirectories({ runtimeRoot });
  return {
    modelPath: path.join(broadcastDir, `${date}-${slot}-poster-model.json`),
    posterPath: path.join(broadcastDir, `${date}-${slot}-call-duration.png`),
    textPath: path.join(broadcastDir, `${date}-${slot}-call-duration-message.txt`)
  };
}

export function liveWorkbookPath(date, slot, { runtimeRoot } = {}) {
  const { privateDir } = ensureRuntimeDirectories({ runtimeRoot });
  return path.join(privateDir, `live-call-duration-${date}-${slot}.xlsx`);
}

export function liveTaskConfigPath(date, slot, { runtimeRoot } = {}) {
  const { privateDir } = ensureRuntimeDirectories({ runtimeRoot });
  return path.join(privateDir, `smartbi-call-duration-live-${date}-${slot}.json`);
}
