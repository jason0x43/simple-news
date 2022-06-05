export function diffDates(date1: Date, date2: Date) {
  const start = date1 <= date2 ? date1 : date2;
  const end = date1 > date2 ? date1 : date2;
  const milliseconds = end.getTime() - start.getTime();
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = 12 * yearDiff + end.getMonth();
  const months = endMonth - startMonth;

  const years = Math.floor(months / 12);

  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    weeks,
    months,
    years,
  };
}