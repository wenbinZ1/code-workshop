export function dateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

export function shortDate(key: string): string {
  const [, m, d] = key.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export function minutesOn(days: Record<string, number>, key: string): number {
  return days[key] ?? 0;
}

export function todayMinutes(days: Record<string, number>): number {
  return days[dateKey()] ?? 0;
}

export function streakOf(days: Record<string, number>): number {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 366; i += 1) {
    const key = dateKey(cursor);
    if ((days[key] ?? 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** 历史最长连续学习天数，用于成长档案和首页 KPI。 */
export function longestStreakOf(days: Record<string, number>): number {
  const keys = Object.keys(days)
    .filter((key) => (days[key] ?? 0) > 0)
    .sort();
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const key of keys) {
    const time = new Date(`${key}T00:00:00`).getTime();
    run = previous !== null && Math.round((time - previous) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = time;
  }
  return best;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} 分钟`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function daysBetween(from: string, to = new Date()): number {
  return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
}
