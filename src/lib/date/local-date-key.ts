/** Calendar date in the business/user local timezone — YYYY-MM-DD */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(daysAgo = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function nextDateKey(stockDate: string): string {
  const date = new Date(`${stockDate}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return localDateKey(date);
}

export function previousDateKey(stockDate: string): string {
  const date = new Date(`${stockDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

export function buildLocalDateRange(dayCount: number, endDaysAgo = 0): string[] {
  const end = startOfLocalDay(endDaysAgo);
  const start = new Date(end);
  start.setDate(end.getDate() - (dayCount - 1));

  const keys: string[] = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    keys.push(localDateKey(day));
  }
  return keys;
}
