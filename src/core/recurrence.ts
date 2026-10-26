import { CalendarEvent } from '../types';

/**
 * 주어진 기간(rangeStart ~ rangeEnd) 내에서 반복(recurrence) 일정을 인스턴스로 전개
 */
export function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  const rangeStartStr = rangeStart.toISOString().slice(0, 10);
  const rangeEndStr = rangeEnd.toISOString().slice(0, 10);

  for (const evt of events) {
    if (!evt.recurrence || evt.recurrence === 'none') {
      const evtStart = evt.startDate.slice(0, 10);
      const evtEnd = evt.endDate.slice(0, 10);
      // 단순 기간 겹침 확인
      if (evtEnd >= rangeStartStr && evtStart <= rangeEndStr) {
        result.push(evt);
      }
      continue;
    }

    // 반복 일정 전개
    const baseStart = new Date(evt.startDate);
    const baseEnd = new Date(evt.endDate);
    const durationMs = baseEnd.getTime() - baseStart.getTime();

    // 시작 시점부터 rangeEnd까지 반복 생성
    const cursor = new Date(baseStart);

    // 너무 오래 전부터 반복된 일정일 경우 범위를 점프하여 최적화
    while (cursor <= rangeEnd) {
      const currentStartStr = cursor.toISOString().slice(0, 10);
      const currentEnd = new Date(cursor.getTime() + durationMs);
      const currentEndStr = currentEnd.toISOString().slice(0, 10);

      if (currentEndStr >= rangeStartStr && currentStartStr <= rangeEndStr) {
        // 인스턴스 생성
        const timePartStart = evt.startDate.slice(10);
        const timePartEnd = evt.endDate.slice(10);

        result.push({
          ...evt,
          id: `${evt.id}_instance_${currentStartStr}`,
          startDate: `${currentStartStr}${timePartStart}`,
          endDate: `${currentEndStr}${timePartEnd}`,
        });
      }

      // 다음 주기로 이동
      switch (evt.recurrence) {
        case 'daily':
          cursor.setDate(cursor.getDate() + 1);
          break;
        case 'weekly':
          cursor.setDate(cursor.getDate() + 7);
          break;
        case 'monthly':
          cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 'yearly':
          cursor.setFullYear(cursor.getFullYear() + 1);
          break;
        default:
          cursor.setDate(cursor.getDate() + 1);
      }
    }
  }

  return result;
}

/**
 * 특정 시간(HH:mm)을 하루 24시간 중의 분(0 ~ 1440)으로 환산
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * 타임슬롯 배치 정보 (주간/일간 뷰용)
 */
export interface TimedEventLayout {
  event: CalendarEvent;
  topPercent: number; // 0 ~ 100%
  heightPercent: number; // 0 ~ 100%
  column: number;
  totalColumns: number;
}

/**
 * 하루 안에서 겹치는 일정들의 레이아웃(top, height, column, totalColumns) 계산
 */
export function layoutEventsForDay(events: CalendarEvent[]): TimedEventLayout[] {
  // 종일 일정이 아닌 시간 지정 일정만 필터링
  const timed = events.filter((e) => !e.isAllDay);
  if (timed.length === 0) return [];

  // 시작 시간 오름차순 정렬
  const sorted = [...timed].sort((a, b) => {
    const aTime = a.startDate.slice(11, 16);
    const bTime = b.startDate.slice(11, 16);
    return aTime.localeCompare(bTime);
  });

  const parsedEvents = sorted.map((evt) => {
    const startMins = timeStringToMinutes(evt.startDate.slice(11, 16));
    let endMins = timeStringToMinutes(evt.endDate.slice(11, 16));
    if (endMins <= startMins) {
      endMins = startMins + 30; // 최소 30분 보장
    }

    const topPercent = (startMins / 1440) * 100;
    const heightPercent = Math.max(((endMins - startMins) / 1440) * 100, 2.0); // 최소 높이 보장

    return {
      event: evt,
      startMins,
      endMins,
      topPercent,
      heightPercent,
      column: 0,
      totalColumns: 1,
    };
  });

  // 겹치는 일정 그룹별 컬럼 배치 알고리즘
  for (let i = 0; i < parsedEvents.length; i++) {
    const current = parsedEvents[i];
    const overlaps = parsedEvents.filter(
      (other, j) =>
        i !== j &&
        current.startMins < other.endMins &&
        current.endMins > other.startMins
    );

    if (overlaps.length > 0) {
      const usedColumns = new Set<number>();
      for (const ov of overlaps) {
        if (parsedEvents.indexOf(ov) < i) {
          usedColumns.add(ov.column);
        }
      }

      let col = 0;
      while (usedColumns.has(col)) {
        col++;
      }
      current.column = col;

      const groupMaxCols = Math.max(
        current.column + 1,
        ...overlaps.map((o) => o.column + 1)
      );

      current.totalColumns = groupMaxCols;
      for (const ov of overlaps) {
        ov.totalColumns = Math.max(ov.totalColumns, groupMaxCols);
      }
    }
  }

  return parsedEvents.map(({ event, topPercent, heightPercent, column, totalColumns }) => ({
    event,
    topPercent,
    heightPercent,
    column,
    totalColumns,
  }));
}

/**
 * 일정 검색 필터링 (제목, 설명, 위치 대소문자 무시)
 */
export function searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return events.filter((e) => {
    const titleMatch = e.title.toLowerCase().includes(trimmed);
    const descMatch = e.description?.toLowerCase().includes(trimmed);
    const locMatch = e.location?.toLowerCase().includes(trimmed);
    return titleMatch || descMatch || locMatch;
  });
}
