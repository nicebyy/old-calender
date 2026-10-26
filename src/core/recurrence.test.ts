import { describe, it, expect } from 'vitest';
import {
  expandEventsForRange,
  timeStringToMinutes,
  layoutEventsForDay,
  searchEvents,
} from './recurrence';
import { CalendarEvent } from '../types';

describe('Recurrence and Layout Core Logic', () => {
  it('시간 문자열(HH:mm)을 분 단위로 정확히 환산해야 한다', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('01:30')).toBe(90);
    expect(timeStringToMinutes('12:00')).toBe(720);
    expect(timeStringToMinutes('23:59')).toBe(1439);
  });

  it('매주(weekly) 반복 일정이 지정된 기간 내에 인스턴스로 전개되어야 한다', () => {
    const events: CalendarEvent[] = [
      {
        id: 'weekly-sync',
        title: '팀 주간 회의',
        startDate: '2026-10-05T10:00:00', // 10월 첫째주 월요일
        endDate: '2026-10-05T11:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        recurrence: 'weekly',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const rangeStart = new Date(2026, 9, 1); // 2026-10-01
    const rangeEnd = new Date(2026, 9, 31); // 2026-10-31

    const expanded = expandEventsForRange(events, rangeStart, rangeEnd);
    // 2026년 10월에는 월요일이 5일, 12일, 19일, 26일 총 4번 있음
    expect(expanded.length).toBe(4);
    expect(expanded[0].startDate).toBe('2026-10-05T10:00:00');
    expect(expanded[1].startDate).toBe('2026-10-12T10:00:00');
    expect(expanded[2].startDate).toBe('2026-10-19T10:00:00');
    expect(expanded[3].startDate).toBe('2026-10-26T10:00:00');
  });

  it('동시간대에 겹치는 일정들의 컬럼 분할(totalColumns)을 올바르게 계산해야 한다', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: '회의 1',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'evt-2',
        title: '회의 2',
        startDate: '2026-10-26T10:30:00',
        endDate: '2026-10-26T11:30:00',
        isAllDay: false,
        categoryId: 'default-personal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const layout = layoutEventsForDay(events);
    expect(layout.length).toBe(2);
    // 두 일정이 겹치므로 totalColumns는 2여야 하고 각각 컬럼 0, 1을 가져야 함
    expect(layout[0].totalColumns).toBe(2);
    expect(layout[1].totalColumns).toBe(2);
    expect(layout[0].column).not.toBe(layout[1].column);
  });

  it('검색어로 일정 제목 및 위치가 필터링되어야 한다', () => {
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: '치과 진료 예약',
        location: '강남구 치과',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-personal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        title: '스프린트 기획 회의',
        location: '온라인 Zoom',
        startDate: '2026-10-26T14:00:00',
        endDate: '2026-10-26T15:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const searchResult1 = searchEvents(events, '치과');
    expect(searchResult1.length).toBe(1);
    expect(searchResult1[0].title).toBe('치과 진료 예약');

    const searchResult2 = searchEvents(events, 'Zoom');
    expect(searchResult2.length).toBe(1);
    expect(searchResult2[0].title).toBe('스프린트 기획 회의');

    const emptyResult = searchEvents(events, '없는 검색어');
    expect(emptyResult.length).toBe(0);
  });

  it('로컬 특정 날짜(26일)에 생성된 일정은 다음 날(27일) 범위 조회 시 포함되지 않아야 한다 (타임존 오프셋 분리 검증)', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-26',
        title: '26일 일정',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // 27일 하루 범위 조회
    const startOf27 = new Date(2026, 9, 27, 0, 0, 0);
    const endOf27 = new Date(2026, 9, 27, 23, 59, 59);
    const result27 = expandEventsForRange(events, startOf27, endOf27);
    expect(result27.length).toBe(0);

    // 26일 하루 범위 조회
    const startOf26 = new Date(2026, 9, 26, 0, 0, 0);
    const endOf26 = new Date(2026, 9, 26, 23, 59, 59);
    const result26 = expandEventsForRange(events, startOf26, endOf26);
    expect(result26.length).toBe(1);
    expect(result26[0].title).toBe('26일 일정');
  });
});

