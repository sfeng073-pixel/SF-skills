import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { buildCallDurationBroadcastText, buildTailAlerts } from '../src/broadcast/call-duration-broadcast.js';
import { readJsonFile } from '../src/io/read-json.js';

const SAMPLE_RESULT_PATH = path.resolve('examples/sample-slot-1500-result.json');

test('call duration broadcast text keeps one sales alert per line', () => {
  const result = {
    summary_metrics: { salesCount: 18 },
    exception_candidates: {
      durationTail: [
        { group: '台湾CC02组', sales: '林鸿池', duration: 3.2, callCount: 3 },
        { group: '台湾CC02组', sales: '吴世昌', duration: 8.2, callCount: 37 }
      ],
      callCountTail: [
        { group: '台湾CC02组', sales: '林鸿池', duration: 3.2, callCount: 3 },
        { group: '台湾CC02组', sales: '蔡郭钰', duration: 26.9, callCount: 50 }
      ]
    }
  };

  const text = buildCallDurationBroadcastText(result, { slotLabel: '17:00' });
  const lines = text.split('\n').filter(Boolean);
  const salesLines = lines.filter((line) => /林鸿池|吴世昌|蔡郭钰/.test(line));

  assert.equal(salesLines.length, 3);
  assert.equal(salesLines[0], '林鸿池 通时尾部、通次尾部，当前通时 3.2，当前通次 3');
  assert.equal(salesLines[1], '吴世昌 通时尾部，当前通时 8.2，当前通次 37');
  assert.equal(salesLines[2], '蔡郭钰 通次尾部，当前通时 26.9，当前通次 50');
});

test('tail alerts support mention mapping', () => {
  const result = readJsonFile(SAMPLE_RESULT_PATH);
  const alerts = buildTailAlerts(
    result,
    new Map([
      ['台湾CC02组::谢启仰', { dingtalkUserId: 'user-xie', dingtalkName: '谢启仰' }],
      ['台湾CC02组::张莉红', { dingtalkUserId: 'user-zhang', dingtalkName: '张莉红' }]
    ])
  );

  assert.equal(alerts.length, 5);
  assert.equal(alerts[0].mentionText, '@谢启仰');
  assert.equal(alerts[0].dingtalkUserId, 'user-xie');
});

test('dry_run_send returns image and text payloads with mentions', async () => {
  const { default: runCallDurationBroadcast } = await import('../scripts/run-taiwan-call-kpi-broadcast.js');
  const runtimeRoot = path.resolve('runtime-test/broadcast-suite');
  const resultDir = path.join(runtimeRoot, 'results');
  fs.mkdirSync(resultDir, { recursive: true });
  fs.copyFileSync(SAMPLE_RESULT_PATH, path.join(resultDir, '2026-06-12-slot-1500.json'));

  const output = await runCallDurationBroadcast({
    date: '2026-06-12',
    slot: '1500',
    runtimeRoot,
    sendMode: 'dry_run_send',
    resolveSecrets: () => ({
      webhookUrl: 'https://example.com/robot/send?access_token=test',
      webhookSecret: 'SECtest',
      driveSpaceId: 'drive-space-test',
      userMapping: new Map([
        ['台湾CC02组::谢启仰', { dingtalkUserId: 'user-xie', dingtalkName: '谢启仰' }],
        ['台湾CC02组::张莉红', { dingtalkUserId: 'user-zhang', dingtalkName: '张莉红' }],
        ['台湾CC02组::林鸿池', { dingtalkUserId: 'user-lin', dingtalkName: '林鸿池' }],
        ['台湾CC02组::温伟杰', { dingtalkUserId: 'user-wen', dingtalkName: '温伟杰' }],
        ['台湾CC02组::刘琦', { dingtalkUserId: 'user-liu', dingtalkName: '刘琦' }]
      ])
    }),
    uploadImage: async ({ posterPath }) => ({
      imageUrl: `https://example.com/${path.basename(posterPath)}`,
      pageUrl: 'https://example.com/detail',
      mode: 'drive_markdown'
    })
  });

  assert.equal(output.sendMode, 'dry_run_send');
  assert.equal(output.sent, false);
  assert.equal(fs.existsSync(output.posterPath), true);
  assert.equal(fs.existsSync(output.textPath), true);
  assert.equal(output.payloads.length, 2);
  assert.equal(output.payloads[0].kind, 'image');
  assert.equal(output.payloads[1].kind, 'text');
  assert.match(output.payloads[1].payload.markdown.text, /@谢启仰/);
  assert.match(output.payloads[1].payload.markdown.text, /@张莉红/);
  assert.match(output.payloads[1].payload.markdown.text, /请以上同学尽快拉起通时和通次动作/);
});
