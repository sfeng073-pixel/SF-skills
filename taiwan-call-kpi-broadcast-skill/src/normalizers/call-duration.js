import fs from 'node:fs';
import path from 'node:path';

import { extractCallDurationRows } from '../live/call-duration-extract.js';
import { cleanText, parseNumber, parsePercent } from './common.js';

export function normalizeCallDurationMarkdown(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    if (!line.startsWith(`| ${'台湾CC02组'} |`)) {
      continue;
    }

    const parts = line.split('|').map((part) => cleanText(part));
    rows.push({
      group: parts[1],
      sales: parts[2],
      duration: parseNumber(parts[3]),
      durationRate: parsePercent(parts[4]),
      callCount: parseNumber(parts[5]),
      callCountRate: parsePercent(parts[6])
    });
  }

  return rows.filter((row) => row.group && row.sales);
}

export function normalizeCallDurationSource(filePath, { pythonBin } = {}) {
  if (!filePath) {
    return [];
  }

  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.xlsx' || extension === '.xls') {
    return extractCallDurationRows({ callDurationPath: filePath, pythonBin });
  }

  return normalizeCallDurationMarkdown(filePath);
}
