import { describe, it, expect } from 'vitest';
import { getHolidayName, getApproxLunarDateString } from './holidays';
import { getWeatherForDate } from './weather';
import { exportEventsToICS, parseICSToEvents } from './ical';
import { CalendarEvent } from '../types';

describe('Advanced Win10 Features (Holidays, Weather, ICS)', () => {
  it('대한민국 고정 공휴일(3·1절, 광복절, 성탄절)을 정확히 인식해야 한다', () => {
    const march1 = new Date(2026, 2, 1); // 3월 1일
    const aug15 = new Date(2026, 7, 15); // 8월 15일
    const dec25 = new Date(2026, 11, 25); // 12월 25일
    const normalDay = new Date(2026, 6, 7); // 7월 7일

    expect(getHolidayName(march1)).toBe('3·1절');
    expect(getHolidayName(aug15)).toBe('광복절');
    expect(getHolidayName(dec25)).toBe('성탄절');
    expect(getHolidayName(normalDay)).toBeNull();
  });

  it('2026년 설날 및 추석 명절을 룩업해야 한다', () => {
    const seollal = new Date(2026, 1, 17); // 2026-02-17
    const chuseok = new Date(2026, 8, 25); // 2026-09-25

    expect(getHolidayName(seollal)).toBe('설날');
    expect(getHolidayName(chuseok)).toBe('추석');
  });

  it('음력 일자(초하루, 보름 등)를 문자열로 생성해야 한다', () => {
    const d = new Date(2026, 9, 26);
    const lunarStr = getApproxLunarDateString(d);
    expect(typeof lunarStr).toBe('string');
  });

  it('날씨 정보를 결정론적으로 생성하고 섭씨/화씨를 올바르게 계산해야 한다', () => {
    const date = new Date(2026, 9, 26);
    const weatherC = getWeatherForDate(date, 'C');
    const weatherF = getWeatherForDate(date, 'F');

    expect(weatherC.condition).toBeDefined();
    expect(weatherC.tempMax).toBeGreaterThan(weatherC.tempMin);
    // 화씨는 섭씨보다 수치가 큼
    expect(weatherF.tempMax).toBeGreaterThan(weatherC.tempMax);
  });

  it('일정 목록을 iCal(.ics) 포맷으로 내보내고 다시 파싱할 수 있어야 한다', () => {
    const mockEvents: CalendarEvent[] = [
      {
        id: 'evt-test-1',
        title: '글로벌 전략 컨퍼런스',
        description: '2026 신제품 발표',
        location: '서울 코엑스',
        startDate: '2026-10-26T09:00:00',
        endDate: '2026-10-26T18:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const icsString = exportEventsToICS(mockEvents);
    expect(icsString).toContain('BEGIN:VCALENDAR');
    expect(icsString).toContain('SUMMARY:글로벌 전략 컨퍼런스');
    expect(icsString).toContain('LOCATION:서울 코엑스');

    const parsed = parseICSToEvents(icsString);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('글로벌 전략 컨퍼런스');
    expect(parsed[0].location).toBe('서울 코엑스');
  });
});
