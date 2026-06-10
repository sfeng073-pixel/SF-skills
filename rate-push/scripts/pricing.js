export const DEFAULT_COURSE_PRICES = [3850, 5280, 8880, 14550];

export function roundToNearest(value, step = 10) {
  return Math.round(value / step) * step;
}

export function calculateCourseRates({ coursePrices = DEFAULT_COURSE_PRICES, usdCny, usdTwd }) {
  if (!Number.isFinite(usdCny) || usdCny <= 0) {
    throw new Error("usdCny must be a positive number");
  }

  if (!Number.isFinite(usdTwd) || usdTwd <= 0) {
    throw new Error("usdTwd must be a positive number");
  }

  const usdPerCny = 1 / usdCny;
  const cnyToTwd = usdPerCny * usdTwd;

  return {
    usdPerCny,
    usdTwd,
    cnyToTwd,
    rows: coursePrices.map((cny, index) => {
      const usd = cny * usdPerCny;
      const twd = usd * usdTwd;

      return {
        label: `方案 ${String.fromCharCode(65 + index)}`,
        cny,
        usd,
        twd,
        twdRound: roundToNearest(twd, 10)
      };
    })
  };
}
