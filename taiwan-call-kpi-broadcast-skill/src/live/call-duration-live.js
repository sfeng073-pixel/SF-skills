import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { normalizeCallDurationSource } from '../normalizers/call-duration.js';
import { liveTaskConfigPath, liveWorkbookPath } from '../io/runtime-paths.js';

function resolvePythonBin(pythonBin) {
  return pythonBin || process.env.TAIWAN_CALL_KPI_PYTHON_BIN || process.env.PYTHON_BIN || 'python3';
}

const LIVE_SCRIPT = fileURLToPath(new URL('./call-duration-live-python.py', import.meta.url));

function buildDefaultSourceCandidates(date, slot, runtimeRoot) {
  return [liveWorkbookPath(date, slot, { runtimeRoot })];
}

function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractDateFromPath(filePath) {
  const text = String(filePath || '');
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] || null;
}

function validateCallDurationSource({ candidatePath, date, pythonBin }) {
  const pathDate = extractDateFromPath(candidatePath);
  if (pathDate && pathDate !== date) {
    return {
      ok: false,
      mode: 'local_stale',
      warnings: [
        {
          code: 'call_duration_local_source_stale',
          blocking: true,
          detail: `local workbook date ${pathDate} does not match ${date}: ${candidatePath}`
        }
      ]
    };
  }

  try {
    const rows = normalizeCallDurationSource(candidatePath, { pythonBin });
    if (rows.length > 0) {
      return { ok: true, warnings: [] };
    }

    return {
      ok: false,
      mode: 'local_invalid',
      warnings: [
        {
          code: 'call_duration_local_source_empty',
          blocking: true,
          detail: `local source does not contain Taiwan sales rows: ${candidatePath}`
        }
      ]
    };
  } catch (error) {
    return {
      ok: false,
      mode: 'local_invalid',
      warnings: [
        {
          code: 'call_duration_local_source_unreadable',
          blocking: true,
          detail: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}

function resolveLocalCallDurationSource(date, slot, { runtimeRoot, sourceCandidates, pythonBin } = {}) {
  const candidates = sourceCandidates?.length ? sourceCandidates : buildDefaultSourceCandidates(date, slot, runtimeRoot);
  const candidatePath = firstExistingPath(candidates);

  if (!candidatePath) {
    return null;
  }

  const validation = validateCallDurationSource({ candidatePath, date, pythonBin });
  if (!validation.ok) {
    return {
      mode: validation.mode,
      date,
      slot,
      callDurationPath: null,
      warnings: validation.warnings
    };
  }

  return {
    mode: 'local_verified',
    date,
    slot,
    callDurationPath: candidatePath,
    warnings: []
  };
}

function liveRunErrorText(liveRun) {
  return [
    liveRun?.stderr?.trim?.(),
    liveRun?.stdout?.trim?.(),
    liveRun?.error?.message?.trim?.(),
    liveRun?.error?.code?.trim?.()
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeLiveExportError(detail) {
  const text = String(detail || '').trim();
  return {
    code: 'call_duration_live_export_failed',
    blocking: true,
    detail: text || 'unknown_call_duration_live_export_error'
  };
}

function runLiveExport({ date, slot, runtimeRoot, liveRunOverride, pythonBin }) {
  if (typeof liveRunOverride === 'function') {
    return liveRunOverride({ date, slot, runtimeRoot });
  }

  if (liveRunOverride) {
    return liveRunOverride;
  }

  const outputPath = liveWorkbookPath(date, slot, { runtimeRoot });
  const configPath = liveTaskConfigPath(date, slot, { runtimeRoot });
  return spawnSync(resolvePythonBin(pythonBin), [LIVE_SCRIPT, date, slot, outputPath, configPath], {
    encoding: 'utf8',
    env: { ...process.env },
    timeout: 240000,
    maxBuffer: 10 * 1024 * 1024
  });
}

export async function resolveCallDurationSource({
  date,
  slot,
  runtimeRoot,
  useLiveExport = false,
  sourceCandidates,
  liveRunOverride,
  pythonBin
} = {}) {
  const local = resolveLocalCallDurationSource(date, slot, {
    runtimeRoot,
    sourceCandidates,
    pythonBin
  });

  if (local?.mode === 'local_verified') {
    return local;
  }

  if (!useLiveExport) {
    return (
      local || {
        mode: 'local_missing',
        date,
        slot,
        callDurationPath: null,
        warnings: [{ code: 'call_duration_local_source_missing', blocking: true }]
      }
    );
  }

  const liveRun = runLiveExport({ date, slot, runtimeRoot, liveRunOverride, pythonBin });
  if (liveRun.status === 0) {
    const payload = JSON.parse(liveRun.stdout.trim());
    const validation = validateCallDurationSource({
      candidatePath: payload.call_duration_path,
      date,
      pythonBin
    });

    if (validation.ok) {
      return {
        mode: payload.mode,
        date,
        slot,
        callDurationPath: payload.call_duration_path,
        warnings: payload.warnings || []
      };
    }

    return {
      mode: 'live_export_invalid',
      date,
      slot,
      callDurationPath: null,
      warnings: [...(payload.warnings || []), ...validation.warnings]
    };
  }

  const liveError = normalizeLiveExportError(liveRunErrorText(liveRun));
  if (local) {
    return {
      ...local,
      warnings: [...local.warnings, liveError]
    };
  }

  return {
    mode: 'local_missing',
    date,
    slot,
    callDurationPath: null,
    warnings: [{ code: 'call_duration_local_source_missing', blocking: true }, liveError]
  };
}
