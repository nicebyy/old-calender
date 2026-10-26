import { describe, it, expect } from 'vitest';
import {
  isSameDay,
  formatDateKey,
  getMonthGrid,
  getWeekDays,
  getNavigatedDate,
  getEventDisplayTitle,
  getEventDisplayDescription,
} from './calendar';
import { CalendarEvent } from '../types';

describe('Calendar Core Logic', () => {
  it('두 날짜의 동일 여부를 정확하게 비교해야 한다', () => {
    const d1 = new Date(2026, 9, 26, 10, 0, 0); // 2026-10-26 10:00
    const d2 = new Date(2026, 9, 26, 18, 30, 0); // 2026-10-26 18:30
    const d3 = new Date(2026, 9, 27, 10, 0, 0); // 2026-10-27

    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });

  it('Date 객체를 YYYY-MM-DD 문자열로 정확히 변환해야 한다', () => {
    const d = new Date(2026, 0, 5); // 2026-01-05
    expect(formatDateKey(d)).toBe('2026-01-05');
  });

  it('월간 그리드는 항상 42칸(6주)을 반환해야 한다', () => {
    const selectedDate = new Date(2026, 9, 26); // 2026년 10월
    const grid = getMonthGrid(2026, 9, selectedDate);

    expect(grid.length).toBe(42);

    // 2026년 10월 1일은 목요일이므로, 첫 칸(일요일)은 2026-09-27이어야 함
    expect(grid[0].dateString).toBe('2026-09-27');
    expect(grid[0].isCurrentMonth).toBe(false);

    // 10월 26일은 선택된 날짜여야 함
    const oct26Cell = grid.find((cell) => cell.dateString === '2026-10-26');
    expect(oct26Cell).toBeDefined();
    expect(oct26Cell?.isSelected).toBe(true);
    expect(oct26Cell?.isCurrentMonth).toBe(true);
  });

  it('해당 날짜에 일정이 있는 경우 DayCellData.events에 포함되어야 한다', () => {
    const selectedDate = new Date(2026, 9, 26);
    const mockEvents: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: '윈도우 10 프로젝트 킥오프',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const grid = getMonthGrid(2026, 9, selectedDate, mockEvents);
    const oct26Cell = grid.find((cell) => cell.dateString === '2026-10-26');

    expect(oct26Cell?.events.length).toBe(1);
    expect(oct26Cell?.events[0].title).toBe('윈도우 10 프로젝트 킥오프');
  });

  it('주간 날짜 7개를 일요일부터 정상적으로 계산해야 한다', () => {
    const baseDate = new Date(2026, 9, 28); // 수요일
    const weekDays = getWeekDays(baseDate, false);

    expect(weekDays.length).toBe(7);
    expect(weekDays[0].getDay()).toBe(0); // 일요일
    expect(weekDays[6].getDay()).toBe(6); // 토요일
  });

  it('날짜 네비게이션이 정확한 이전/다음 날짜를 계산해야 한다', () => {
    const baseDate = new Date(2026, 9, 26); // 2026년 10월 26일

    // 1달 후 -> 11월 26일
    const nextMonth = getNavigatedDate(baseDate, 'month', 'next');
    expect(nextMonth.getMonth()).toBe(10); // 11월 (0-indexed 10)

    // 1달 전 -> 9월 26일
    const prevMonth = getNavigatedDate(baseDate, 'month', 'prev');
    expect(prevMonth.getMonth()).toBe(8); // 9월 (0-indexed 8)

    // 1년 후 -> 2027년 10월 26일
    const nextYear = getNavigatedDate(baseDate, 'year', 'next');
    expect(nextYear.getFullYear()).toBe(2027);
  });

  it('getMonthGrid 옵션의 lang 파라미터에 따라 공휴일 명칭이 다국어로 제공되어야 한다', () => {
    const selectedDate = new Date(2026, 9, 3);
    const gridKo = getMonthGrid(2026, 9, selectedDate, [], { lang: 'ko' });
    const oct3Ko = gridKo.find((c) => c.dateString === '2026-10-03');
    expect(oct3Ko?.holidayName).toBe('개천절');

    const gridEn = getMonthGrid(2026, 9, selectedDate, [], { lang: 'en' });
    const oct3En = gridEn.find((c) => c.dateString === '2026-10-03');
    expect(oct3En?.holidayName).toBe('National Foundation Day');
  });

  it('기본 샘플 일정 및 메모의 언어별 표시 변환이 정상 동작해야 한다', () => {
    const sampleEvt: CalendarEvent = {
      id: 'sample-1',
      title: 'Windows 10 캘린더 프로젝트 킥오프',
      description: '반응성 1위 초고속 네이티브 캘린더 앱 개발',
      startDate: '2026-10-26T10:00:00',
      endDate: '2026-10-26T11:30:00',
      isAllDay: false,
      categoryId: 'default-work',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(getEventDisplayTitle(sampleEvt, 'ko')).toBe('Windows 10 캘린더 프로젝트 킥오프');
    expect(getEventDisplayTitle(sampleEvt, 'en')).toBe('Windows 10 Calendar Project Kickoff');
    expect(getEventDisplayDescription(sampleEvt, 'en')).toBe('Top-responsiveness native calendar app development');

    // 사용자가 직접 수정한 일정의 경우 사용자 입력값 유지
    const customEvt: CalendarEvent = {
      ...sampleEvt,
      title: '내 커스텀 프로젝트 회의',
    };
    expect(getEventDisplayTitle(customEvt, 'en')).toBe('내 커스텀 프로젝트 회의');
  });
});
