const KOREA_TIME_ZONE = "Asia/Seoul";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
});

function partsFor(date: Date) {
  const parts = dateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return {
    day: day ?? 1,
    month: month ?? 1,
    year: year ?? 1970,
  };
}

function makeDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKeyAsUtcDate(key: string) {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKeyFromUtcDate(date: Date) {
  return makeDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function getKoreaDateKey(date = new Date()) {
  const { year, month, day } = partsFor(date);
  return `${year}-${month}-${day}`;
}

export function getKoreaYearMonth(date = new Date()) {
  const { year, month } = partsFor(date);
  return {
    month: Number(month),
    year: Number(year),
  };
}

export function dateKeyToKoreaStartUtc(key: string) {
  return new Date(`${key}T00:00:00.000+09:00`);
}

export function dateKeyToKoreaEndUtc(key: string) {
  return new Date(`${key}T23:59:59.999+09:00`);
}

export function addDateKeyDays(key: string, days: number) {
  const date = dateKeyAsUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyFromUtcDate(date);
}

export function getKoreaTodayRange(date = new Date()) {
  const key = getKoreaDateKey(date);
  return {
    dateKey: key,
    from: dateKeyToKoreaStartUtc(key),
    to: dateKeyToKoreaEndUtc(key),
  };
}

export function getKoreaWeekRange(date = new Date()) {
  const todayKey = getKoreaDateKey(date);
  const today = dateKeyAsUtcDate(todayKey);
  const day = today.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startKey = addDateKeyDays(todayKey, mondayOffset);
  const endKey = addDateKeyDays(startKey, 6);

  return {
    endKey,
    from: dateKeyToKoreaStartUtc(startKey),
    startKey,
    to: dateKeyToKoreaEndUtc(endKey),
  };
}
