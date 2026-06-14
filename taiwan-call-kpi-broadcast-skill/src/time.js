import { TAIWAN_TL_TIMEZONE } from './config.js';

function formatDateParts(dateInput, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(dateInput);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getDateTextInTimeZone(dateInput = new Date(), timeZone = TAIWAN_TL_TIMEZONE) {
  return formatDateParts(dateInput, timeZone);
}

export function getTaiwanTlDateText(dateInput = new Date()) {
  return getDateTextInTimeZone(dateInput, TAIWAN_TL_TIMEZONE);
}

export function buildSlotRunAt(dateText, slot) {
  return `${dateText}T${slot.slice(0, 2)}:${slot.slice(2)}:00+08:00`;
}
