import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { isDirectRun } from "../scripts/module-entry.js";

test("detects direct execution when the path contains non-ascii characters", () => {
  const scriptPath = "/tmp/自动化项目/scripts/generate-rate-card.js";
  assert.equal(isDirectRun(pathToFileURL(scriptPath).href, scriptPath), true);
});
