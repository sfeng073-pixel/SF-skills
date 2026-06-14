import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function resolvePythonBin(pythonBin) {
  return pythonBin || process.env.TAIWAN_CALL_KPI_PYTHON_BIN || process.env.PYTHON_BIN || 'python3';
}

const EXTRACT_SCRIPT = fileURLToPath(new URL('./call-duration-extract-python.py', import.meta.url));

export function extractCallDurationRows({ callDurationPath, pythonBin }) {
  const run = spawnSync(resolvePythonBin(pythonBin), [EXTRACT_SCRIPT, callDurationPath], {
    encoding: 'utf8'
  });

  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || 'call duration extract failed');
  }

  const payload = JSON.parse(run.stdout.trim());
  return payload.rows || [];
}
