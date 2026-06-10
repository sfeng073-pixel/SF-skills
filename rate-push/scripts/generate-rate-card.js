import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { isDirectRun } from "./module-entry.js";
import { calculateCourseRates } from "./pricing.js";
import { renderRateCardHtml } from "./render-template.js";

const OUTPUT_DIR = process.env.OUTPUT_DIR || fileURLToPath(new URL("../dist", import.meta.url));
const API_URL = "https://open.er-api.com/v6/latest/USD";

function formatTaipeiTimestamp(date) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}.${parts.month}.${parts.day} · ${parts.hour}:${parts.minute} TPE`;
}

async function fetchExchangeRates() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Exchange rate request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const usdCny = payload?.rates?.CNY;
  const usdTwd = payload?.rates?.TWD;

  if (!Number.isFinite(usdCny) || !Number.isFinite(usdTwd)) {
    throw new Error("Exchange rate response did not include CNY and TWD rates");
  }

  return {
    usdCny,
    usdTwd,
    updatedAt: payload.time_last_update_utc
  };
}

async function renderPng(htmlPath, pngPath) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      deviceScaleFactor: 2
    });
    await page.goto(`file://${path.resolve(htmlPath)}`);
    await page.screenshot({ path: pngPath, fullPage: false });
  } finally {
    await browser.close();
  }
}

export async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const exchange = await fetchExchangeRates();
  const rates = calculateCourseRates(exchange);
  const generatedAt = new Date();
  const updatedLabel = formatTaipeiTimestamp(generatedAt);
  const html = renderRateCardHtml({ updatedLabel, rates });

  const htmlPath = path.join(OUTPUT_DIR, "index.html");
  const pngPath = path.join(OUTPUT_DIR, "taiwan-course-rate.png");
  const dataPath = path.join(OUTPUT_DIR, "rate-data.json");

  await fs.writeFile(htmlPath, html);
  await fs.writeFile(dataPath, JSON.stringify({
    generatedAt: generatedAt.toISOString(),
    exchangeUpdatedAt: exchange.updatedAt,
    exchange,
    rates
  }, null, 2));

  await renderPng(htmlPath, pngPath);

  console.log(`Generated ${pngPath}`);
}

if (isDirectRun(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
