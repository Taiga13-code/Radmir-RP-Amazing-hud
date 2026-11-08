export function formatMoney(value: number): string {
  const negative = value < 0;
  const body = Math.abs(Math.trunc(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return negative ? `$ -${body}` : `$ ${body}`;
}

export function formatNumber(value: number): string {
  const negative = value < 0;
  const body = Math.abs(Math.trunc(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return negative ? `-${body}` : body;
}

export function formatClock(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':');
}

export function formatDate(date: Date): string {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => part.toString().padStart(2, '0'))
    .join('.');
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const minuteText = minutes.toString().padStart(2, '0');
  const secondText = seconds.toString().padStart(2, '0');

  return `${minuteText}:${secondText}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
