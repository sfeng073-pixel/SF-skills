import { fileURLToPath } from 'node:url';

export function isDirectRun(importMetaUrl, argvPath = process.argv[1]) {
  if (!argvPath) {
    return false;
  }

  return fileURLToPath(importMetaUrl) === argvPath;
}
