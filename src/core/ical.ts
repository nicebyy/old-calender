import { CalendarEvent } from '../types';

/**
 * ISO 날짜(YYYY-MM-DDTHH:mm:ss)를 iCal 날짜 형식(YYYYMMDDTHHmmssZ 또는 YYYYMMDD)으로 변환
 */
function toICalDate(isoStr: string, isAllDay: boolean): string {
  const clean = isoStr.replace(/[-:]/g, '');
  if (isAllDay) {
    return clean.slice(0, 8); // YYYYMMDD
  }
  return clean.slice(0, 15) + 'Z';
}

/**
 * iCal 날짜 문자열(YYYYMMDDTHHmmssZ 등)을 ISO 문자열로 변환
 */
function fromICalDate(icalStr: string): { iso: string; isAllDay: boolean } {
  const clean = icalStr.trim();
  if (clean.length === 8) {
    // YYYYMMDD
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return { iso: `${y}-${m}-${d}T00:00:00`, isAllDay: true };
  }

  // YYYYMMDDTHHmmss...
  const y = clean.slice(0, 4);
  const m = clean.slice(4, 6);
  const d = clean.slice(6, 8);
  const h = clean.slice(9, 11) || '00';
  const min = clean.slice(11, 13) || '00';
  const s = clean.slice(13, 15) || '00';
  return { iso: `${y}-${m}-${d}T${h}:${min}:${s}`, isAllDay: false };
}

/**
 * 일정 목록을 RFC 5545 표준 iCalendar(.ics) 포맷 문자열로 변환
 */
export function exportEventsToICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Windows 10 Classic Calendar Replica//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const evt of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}@win10calendar.local`);
    lines.push(`SUMMARY:${evt.title.replace(/\n/g, ' ')}`);

    if (evt.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${toICalDate(evt.startDate, true)}`);
      lines.push(`DTEND;VALUE=DATE:${toICalDate(evt.endDate, true)}`);
    } else {
      lines.push(`DTSTART:${toICalDate(evt.startDate, false)}`);
      lines.push(`DTEND:${toICalDate(evt.endDate, false)}`);
    }

    if (evt.description) {
      lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}`);
    }

    if (evt.location) {
      lines.push(`LOCATION:${evt.location}`);
    }

    if (evt.recurrence && evt.recurrence !== 'none') {
      const freq = evt.recurrence.toUpperCase();
      lines.push(`RRULE:FREQ=${freq}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * iCalendar(.ics) 파일 문자열을 파싱하여 일정 데이터 배열로 추출
 */
export function parseICSToEvents(
  icsContent: string,
  defaultCategoryId = 'default-personal'
): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
  const result: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const lines = icsContent.split(/\r?\n/);

  let inEvent = false;
  let currentTitle = '';
  let currentStart = '';
  let currentEnd = '';
  let currentIsAllDay = false;
  let currentDesc = '';
  let currentLoc = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentTitle = '제목 없는 일정';
      currentStart = '';
      currentEnd = '';
      currentIsAllDay = false;
      currentDesc = '';
      currentLoc = '';
    } else if (trimmed === 'END:VEVENT') {
      if (inEvent && currentStart) {
        result.push({
          title: currentTitle,
          startDate: currentStart,
          endDate: currentEnd || currentStart,
          isAllDay: currentIsAllDay,
          categoryId: defaultCategoryId,
          description: currentDesc || undefined,
          location: currentLoc || undefined,
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmed.startsWith('SUMMARY:')) {
        currentTitle = trimmed.slice(8);
      } else if (trimmed.startsWith('DTSTART')) {
        const value = trimmed.includes(':') ? trimmed.split(':')[1] : '';
        const parsed = fromICalDate(value);
        currentStart = parsed.iso;
        currentIsAllDay = parsed.isAllDay;
      } else if (trimmed.startsWith('DTEND')) {
        const value = trimmed.includes(':') ? trimmed.split(':')[1] : '';
        const parsed = fromICalDate(value);
        currentEnd = parsed.iso;
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        currentDesc = trimmed.slice(12).replace(/\\n/g, '\n');
      } else if (trimmed.startsWith('LOCATION:')) {
        currentLoc = trimmed.slice(9);
      }
    }
  }

  return result;
}
