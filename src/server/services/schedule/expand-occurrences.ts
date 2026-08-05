import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export type ScheduleFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export type RecurrenceRule = {
  frequency: ScheduleFrequency;
  /** ISO weekdays (0 = Sunday … 6 = Saturday). Required by weekly/biweekly. */
  weekdays: number[] | null;
  /** Day of month (1–31), clamped to the last valid day. Used by monthly. */
  monthDay: number | null;
  /** Inclusive calendar bounds as `YYYY-MM-DD` in the rule's timezone. */
  startDate: string;
  endDate: string | null;
  /** Wall-clock `HH:mm` in the rule's timezone. Ignored when `allDay`. */
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  timezone: string;
};

export type Occurrence = {
  startsAt: Date;
  endsAt: Date;
};

/** Stops a malformed rule from looping forever; ~5 years of daily occurrences. */
const MAX_SCANNED_DAYS = 2000;

/**
 * Expands a recurrence rule into concrete occurrences overlapping a window.
 *
 * Calendar days are iterated as UTC midnights so that day arithmetic never
 * drifts across DST boundaries; only the final wall-clock time is converted
 * to an instant using the rule's timezone, which is where DST actually matters.
 */
export function expandOccurrences(
  rule: RecurrenceRule,
  windowStart: Date,
  windowEnd: Date,
  limit?: number,
): Occurrence[] {
  if (windowEnd <= windowStart) return [];

  const seriesStart = rule.startDate;
  const seriesEnd = rule.endDate;

  // Work in the rule's timezone: the window edges become calendar days there.
  const windowStartDay = formatInTimeZone(
    windowStart,
    rule.timezone,
    "yyyy-MM-dd",
  );
  const windowEndDay = formatInTimeZone(windowEnd, rule.timezone, "yyyy-MM-dd");

  const firstDay = maxDayString(seriesStart, windowStartDay);
  const lastDay = seriesEnd
    ? minDayString(seriesEnd, windowEndDay)
    : windowEndDay;

  if (firstDay > lastDay) return [];

  const occurrences: Occurrence[] = [];
  let cursor = dayStringToUtcDate(firstDay);
  const end = dayStringToUtcDate(lastDay);
  const anchor = dayStringToUtcDate(seriesStart);

  let scanned = 0;
  while (cursor <= end && scanned < MAX_SCANNED_DAYS) {
    scanned += 1;

    if (matchesRule(rule, cursor, anchor)) {
      const day = utcDateToDayString(cursor);
      const occurrence = buildOccurrence(rule, day);

      // The window is half-open on the right so adjacent months never double up.
      if (occurrence.endsAt > windowStart && occurrence.startsAt < windowEnd) {
        occurrences.push(occurrence);
        if (limit !== undefined && occurrences.length >= limit) break;
      }
    }

    cursor = addUtcDays(cursor, 1);
  }

  return occurrences;
}

function matchesRule(
  rule: RecurrenceRule,
  candidate: Date,
  anchor: Date,
): boolean {
  switch (rule.frequency) {
    case "daily":
      return true;

    case "weekly":
      return weekdayMatches(rule, candidate);

    case "biweekly": {
      if (!weekdayMatches(rule, candidate)) return false;
      // Count whole weeks from the series anchor so alternating weeks stay stable.
      const weeksApart = Math.floor(daysBetween(anchor, candidate) / 7);
      return weeksApart % 2 === 0;
    }

    case "monthly": {
      const target = rule.monthDay ?? anchor.getUTCDate();
      const daysInMonth = daysInUtcMonth(candidate);
      // A rule on the 31st still fires in February, on the last day.
      return candidate.getUTCDate() === Math.min(target, daysInMonth);
    }
  }
}

function weekdayMatches(rule: RecurrenceRule, candidate: Date): boolean {
  const weekdays = rule.weekdays;
  // With no explicit weekdays, fall back to the series start weekday.
  if (!weekdays || weekdays.length === 0) return true;
  return weekdays.includes(candidate.getUTCDay());
}

function buildOccurrence(rule: RecurrenceRule, day: string): Occurrence {
  if (rule.allDay) {
    const startsAt = fromZonedTime(`${day}T00:00:00`, rule.timezone);
    const nextDay = utcDateToDayString(addUtcDays(dayStringToUtcDate(day), 1));
    const endsAt = fromZonedTime(`${nextDay}T00:00:00`, rule.timezone);
    return { startsAt, endsAt };
  }

  const startTime = rule.startTime ?? "09:00";
  const endTime = rule.endTime ?? addMinutesToTime(startTime, 60);

  const startsAt = fromZonedTime(`${day}T${startTime}:00`, rule.timezone);
  let endsAt = fromZonedTime(`${day}T${endTime}:00`, rule.timezone);

  // An end time before the start time means the appointment runs past midnight.
  if (endsAt <= startsAt) {
    const nextDay = utcDateToDayString(addUtcDays(dayStringToUtcDate(day), 1));
    endsAt = fromZonedTime(`${nextDay}T${endTime}:00`, rule.timezone);
  }

  return { startsAt, endsAt };
}

// ---------------------------------------------------------------------------
// Calendar-day helpers (UTC midnights used purely as day identifiers)
// ---------------------------------------------------------------------------

function dayStringToUtcDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
}

function utcDateToDayString(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Day count for the candidate's month. Computed in UTC on purpose: date-fns
 * helpers resolve in local time and would report the wrong month for the
 * UTC-midnight dates used as day identifiers here.
 */
function daysInUtcMonth(value: Date): number {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0),
  ).getUTCDate();
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function maxDayString(a: string, b: string): string {
  return a > b ? a : b;
}

function minDayString(a: string, b: string): string {
  return a < b ? a : b;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const m = String(wrapped % 60).padStart(2, "0");
  return `${h}:${m}`;
}
