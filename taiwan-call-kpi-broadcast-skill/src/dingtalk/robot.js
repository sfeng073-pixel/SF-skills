import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function readUserMapping(filePath) {
  const mapping = new Map();
  if (!filePath || !fs.existsSync(filePath)) {
    return mapping;
  }

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return mapping;
  }

  const headers = parseCsvLine(lines[0]);
  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, columns[index] || '']));
    if (String(row.enabled || '').trim().toLowerCase() !== 'true') {
      continue;
    }
    const group = String(row.bi_group || '').trim();
    const sales = String(row.bi_sales_name || '').trim();
    if (!group || !sales) {
      continue;
    }
    mapping.set(`${group}::${sales}`, {
      dingtalkUserId: String(row.dingtalk_user_id || '').trim(),
      dingtalkName: String(row.dingtalk_name || sales).trim()
    });
  }

  return mapping;
}

export function resolveSecretsFromEnv(env = process.env) {
  const webhookUrl = String(env.DINGTALK_WEBHOOK_URL || '').trim();
  const webhookSecret = String(env.DINGTALK_WEBHOOK_SECRET || '').trim();
  const driveSpaceId = String(env.DINGTALK_DRIVE_SPACE_ID || '').trim();
  const userMappingPath = env.DINGTALK_USER_MAPPING_PATH ? path.resolve(env.DINGTALK_USER_MAPPING_PATH) : '';

  return {
    webhookUrl,
    webhookSecret,
    driveSpaceId,
    userMapping: readUserMapping(userMappingPath)
  };
}

function signWebhook(webhookUrl, secret) {
  const timestamp = Date.now();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = encodeURIComponent(crypto.createHmac('sha256', secret).update(stringToSign).digest('base64'));
  const separator = webhookUrl.includes('?') ? '&' : '?';
  return `${webhookUrl}${separator}timestamp=${timestamp}&sign=${sign}`;
}

export async function sendRobotMessage({ webhookUrl, webhookSecret, payload }) {
  if (!webhookUrl) {
    throw new Error('DINGTALK_WEBHOOK_URL is required');
  }

  if (!webhookSecret) {
    throw new Error('DINGTALK_WEBHOOK_SECRET is required');
  }

  const response = await fetch(signWebhook(webhookUrl, webhookSecret), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`DingTalk request failed: ${response.status} ${responseText}`);
  }

  const result = JSON.parse(responseText);
  if (result.errcode !== 0) {
    throw new Error(`DingTalk returned error: ${responseText}`);
  }

  return result;
}

function runDwsJson(args) {
  const result = spawnSync('dws', [...args, '--timeout', '60', '--format', 'json'], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `dws command failed: ${args.join(' ')}`);
  }

  const stdout = result.stdout || '';
  const start = stdout.indexOf('{');
  if (start < 0) {
    throw new Error(`dws did not return json: ${stdout.slice(0, 200)}`);
  }

  return JSON.parse(stdout.slice(start));
}

export async function uploadImageViaDrive({ posterPath, driveSpaceId }) {
  if (!driveSpaceId) {
    throw new Error('DINGTALK_DRIVE_SPACE_ID is required');
  }

  const fileName = path.basename(posterPath);
  const uploadResult = runDwsJson(['drive', 'upload', '--file', posterPath, '--file-name', fileName, '--space-id', driveSpaceId]);
  const upload = uploadResult.result || {};
  const fileId = String(upload.fileId || '').trim();
  const actualSpaceId = String(upload.spaceId || driveSpaceId).trim();

  if (!fileId) {
    throw new Error(`DingDrive upload did not return fileId for ${posterPath}`);
  }

  const downloadResult = runDwsJson(['drive', 'download', '--file-id', fileId, '--space-id', actualSpaceId]);
  const download = downloadResult.result || {};
  const imageUrl = String(download.downloadUrl || '').trim();

  if (!imageUrl) {
    throw new Error(`DingDrive download did not return downloadUrl for ${fileId}`);
  }

  return {
    mode: 'drive_markdown',
    imageUrl,
    fileId,
    spaceId: actualSpaceId,
    pageUrl: String(upload.docUrl || '').trim()
  };
}
