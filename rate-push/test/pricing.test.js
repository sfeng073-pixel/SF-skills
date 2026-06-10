import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCourseRates } from "../scripts/pricing.js";

test("calculates TWD via CNY to USD to TWD and rounds to nearest NT$10", () => {
  const result = calculateCourseRates({
    coursePrices: [3850, 5280, 8880, 14550],
    usdCny: 6.785295,
    usdTwd: 31.580042
  });

  assert.equal(result.rows[0].twdRound, 17920);
  assert.equal(result.rows[1].twdRound, 24570);
  assert.equal(result.rows[2].twdRound, 41330);
  assert.equal(result.rows[3].twdRound, 67720);
  assert.equal(result.rows[0].usd.toFixed(2), "567.40");
});
