import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('slot runner can build result from local workbook override and render broadcast artifacts', async () => {
  const { default: runTaiwanCallKpiSlot } = await import('../scripts/run-taiwan-call-kpi-slot.js');
  const sourceWorkbook = path.resolve('examples/sample-call-duration-report.md');
  const runtimeRoot = path.resolve('runtime-test/slot-suite');

  const output = await runTaiwanCallKpiSlot({
    slot: '1500',
    date: '2026-06-12',
    runtimeRoot,
    useLiveExport: false,
    sourceCandidates: [sourceWorkbook],
    sendMode: 'dry_run'
  });

  assert.equal(output.foundation.broadcast_ready, true);
  assert.equal(fs.existsSync(output.foundation.result_path), true);
  assert.equal(fs.existsSync(output.broadcast.posterPath), true);
  assert.equal(fs.existsSync(output.broadcast.textPath), true);
});
