import { Entry } from '../models/entry.model';

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'same';
}

export interface TopTag {
  tag: string;
  amount: number;
  percentage: number;
}

export interface Anomaly {
  tag: string;
  pctOver: number;
  message: string;
}

export function comparePeriods(
  entries: Entry[], 
  aStart: number, 
  aEnd: number, 
  bStart: number, 
  bEnd: number
): PeriodComparison {
  const periodA = entries.filter(entry => 
    entry.ts >= aStart && entry.ts <= aEnd && !entry.deleted
  );
  const periodB = entries.filter(entry => 
    entry.ts >= bStart && entry.ts <= bEnd && !entry.deleted
  );

  const totalA = periodA.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const totalB = periodB.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  const change = totalA - totalB;
  const changePercent = totalB > 0 ? (change / totalB) * 100 : 0;
  
  let trend: 'up' | 'down' | 'same' = 'same';
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    current: totalA,
    previous: totalB,
    change,
    changePercent,
    trend
  };
}

export function topTags(
  entries: Entry[], 
  start: number, 
  end: number, 
  k: number = 3
): TopTag[] {
  const periodEntries = entries.filter(entry => 
    entry.ts >= start && entry.ts <= end && !entry.deleted && entry.amount < 0
  );

  const tagTotals = new Map<string, number>();
  
  periodEntries.forEach(entry => {
    entry.tags.forEach(tag => {
      const current = tagTotals.get(tag) || 0;
      tagTotals.set(tag, current + Math.abs(entry.amount));
    });
  });

  const totalSpent = Array.from(tagTotals.values()).reduce((sum, amount) => sum + amount, 0);
  
  return Array.from(tagTotals.entries())
    .map(([tag, amount]) => ({
      tag,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, k);
}

export function streakDays(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  // Sort entries by date (newest first)
  const sortedEntries = entries
    .filter(entry => !entry.deleted)
    .sort((a, b) => b.ts - a.ts);

  if (sortedEntries.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if today has entries
  const today = currentDate.getTime();
  const hasToday = sortedEntries.some(entry => {
    const entryDate = new Date(entry.ts);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today;
  });

  if (!hasToday) return 0;

  streak = 1;
  currentDate.setDate(currentDate.getDate() - 1);

  // Count consecutive days with entries
  while (true) {
    const dayStart = currentDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    const hasEntries = sortedEntries.some(entry => 
      entry.ts >= dayStart && entry.ts <= dayEnd
    );

    if (!hasEntries) break;

    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export function detectAnomalies(
  entries: Entry[], 
  tag: string, 
  windowWeeks: number = 4
): Anomaly | null {
  const now = Date.now();
  const windowMs = windowWeeks * 7 * 24 * 60 * 60 * 1000;
  const windowStart = now - windowMs;

  // Get entries for the tag in the current week
  const currentWeekStart = now - (7 * 24 * 60 * 60 * 1000);
  const currentWeekEntries = entries.filter(entry => 
    entry.ts >= currentWeekStart && 
    entry.ts <= now && 
    !entry.deleted && 
    entry.amount < 0 && 
    entry.tags.includes(tag)
  );

  // Get entries for the tag in the previous weeks
  const previousEntries = entries.filter(entry => 
    entry.ts >= windowStart && 
    entry.ts < currentWeekStart && 
    !entry.deleted && 
    entry.amount < 0 && 
    entry.tags.includes(tag)
  );

  const currentWeekSpent = currentWeekEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const previousWeeksSpent = previousEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  
  // Calculate average weekly spending
  const avgWeeklySpent = previousWeeksSpent / windowWeeks;
  
  if (avgWeeklySpent === 0) return null;

  const pctOver = ((currentWeekSpent - avgWeeklySpent) / avgWeeklySpent) * 100;

  if (pctOver > 30) {
    return {
      tag,
      pctOver,
      message: `You spent ${Math.round(pctOver)}% above your ${windowWeeks}-week average on ${tag}.`
    };
  }

  return null;
}

export function getWeekBoundaries(weekStartsOn: 0 | 1): { start: number; end: number } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Calculate days to subtract to get to the start of the week
  const daysToSubtract = (dayOfWeek - weekStartsOn + 7) % 7;
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart.getTime(),
    end: weekEnd.getTime()
  };
}

export function getMonthBoundaries(): { start: number; end: number } {
  const now = new Date();
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  return {
    start: monthStart.getTime(),
    end: monthEnd.getTime()
  };
}
