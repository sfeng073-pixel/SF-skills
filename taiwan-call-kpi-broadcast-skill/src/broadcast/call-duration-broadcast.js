function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--';
  }
  return String(Math.round(Number(value) * 10) / 10);
}

function sortRows(rows = []) {
  return [...rows].sort(
    (a, b) => (b.duration ?? -Infinity) - (a.duration ?? -Infinity) || (b.callCount ?? -Infinity) - (a.callCount ?? -Infinity) || a.sales.localeCompare(b.sales, 'zh-Hans-CN')
  );
}

export function buildTailAlerts(result, userMapping = new Map()) {
  const durationTail = result.exception_candidates?.durationTail || [];
  const callCountTail = result.exception_candidates?.callCountTail || [];
  const alerts = new Map();

  for (const row of durationTail) {
    alerts.set(row.sales, {
      sales: row.sales,
      group: row.group,
      duration: row.duration,
      callCount: row.callCount,
      reasons: ['通时尾部']
    });
  }

  for (const row of callCountTail) {
    const current = alerts.get(row.sales) || {
      sales: row.sales,
      group: row.group,
      duration: row.duration,
      callCount: row.callCount,
      reasons: []
    };
    current.reasons.push('通次尾部');
    alerts.set(row.sales, current);
  }

  return [...alerts.values()].map((row) => {
    const mapping = userMapping.get(`${row.group}::${row.sales}`);
    return {
      ...row,
      mentionText: mapping?.dingtalkName ? `@${mapping.dingtalkName}` : `@${row.sales}`,
      dingtalkUserId: mapping?.dingtalkUserId || ''
    };
  });
}

export function buildCallDurationPosterModel(result, { slotLabel = '15:00' } = {}) {
  const rows = sortRows(result.normalized_rows || []).map((row, index) => ({
    rank: index + 1,
    sales: row.sales,
    group: row.group,
    duration: row.duration,
    durationRate: row.durationRate,
    callCount: row.callCount,
    callCountRate: row.callCountRate
  }));

  return {
    slotLabel,
    teamName: result.team_scope?.team || '台湾',
    groupName: result.team_scope?.group || '台湾CC02组',
    runAt: result.run_at,
    rows,
    durationTail: result.exception_candidates?.durationTail || [],
    callCountTail: result.exception_candidates?.callCountTail || [],
    totals: {
      salesCount: result.summary_metrics?.salesCount || rows.length
    }
  };
}

export function buildCallDurationBroadcastText(result, { slotLabel = '15:00', alerts } = {}) {
  const finalAlerts = alerts || buildTailAlerts(result);
  const lines = [
    `【销售播报｜通时通次过程提醒｜${slotLabel}】`,
    '',
    `当前覆盖 ${result.summary_metrics?.salesCount || 0} 人，图片展示完整排名。`,
    finalAlerts.length > 0 ? '以下文字提醒尾部人员：' : '以下文字提醒尾部人员：当前无异常。',
    ''
  ];

  for (const row of finalAlerts) {
    lines.push(`${row.sales} ${row.reasons.join('、')}，当前通时 ${formatNumber(row.duration)}，当前通次 ${formatNumber(row.callCount)}`);
  }

  if (finalAlerts.length > 0) {
    lines.push('');
    lines.push('请以上同学尽快拉起通时和通次动作。');
  }

  return lines.join('\n');
}

export function replaceSalesLinesWithMentions(text, alerts) {
  const alertMap = new Map(alerts.map((alert) => [alert.sales, alert]));
  return text
    .split('\n')
    .map((line) => {
      for (const [sales, alert] of alertMap.entries()) {
        if (line.startsWith(`${sales} `)) {
          return line.replace(`${sales} `, `${alert.mentionText} `);
        }
      }
      return line;
    })
    .join('\n');
}

export function buildImageMarkdownPayload({ result, slotLabel, imageUrl, pageUrl }) {
  const title = `${result.team_scope?.team || '台湾'}${slotLabel}通时通次｜${result.team_scope?.group || '台湾CC02组'}`;
  return {
    msgtype: 'markdown',
    markdown: {
      title,
      text: [`### ${title}`, '', `![台湾${slotLabel}通时通次](${imageUrl})`, pageUrl ? `[查看原图](${pageUrl})` : null]
        .filter(Boolean)
        .join('\n')
    },
    at: { isAtAll: false }
  };
}

export function buildTextMarkdownPayload({ result, slotLabel, text, alerts }) {
  return {
    msgtype: 'markdown',
    markdown: {
      title: `${slotLabel}通时通次提醒｜${result.team_scope?.team || '台湾'}`,
      text: alerts.length > 0 ? replaceSalesLinesWithMentions(text, alerts) : text
    },
    at: {
      atUserIds: alerts.map((alert) => alert.dingtalkUserId).filter(Boolean),
      isAtAll: false
    }
  };
}
