import fs from 'node:fs';
import path from 'node:path';

export function loadDotEnv({ cwd = process.cwd(), fileName = '.env' } = {}) {
  const envPath = path.resolve(cwd, fileName);
  if (!fs.existsSync(envPath)) {
    return { loaded: false, envPath };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return { loaded: true, envPath };
}
