export function cleanText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value);
  }
  return String(value).trim();
}

export function parseNumber(value) {
  const text = cleanText(value).replaceAll(',', '');
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parsePercent(value) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  if (text.endsWith('%')) {
    const parsed = Number(text.slice(0, -1));
    return Number.isNaN(parsed) ? null : parsed / 100;
  }

  const parsed = Number(text);
  return Number.isNaN(parsed) ? null : parsed;
}
