import { describe, it, expect } from 'vitest';
import {
  calculateReminderTime,
  formatReminderMessage,
  getDueReminders,
} from './notifications';
import { CalendarEvent } from '../types';

describe('Notifications Core Module', () => {
  const baseEvent: CalendarEvent = {
    id: 'evt-test-1',
    title: '주간 전략 회의',
    startDate: '2026-10-26T14:00:00',
    endDate: '2026-10-26T15:00:00',
    isAllDay: false,
    categoryId: 'default-work',
    reminderMinutes: 15,
    location: '대회의실',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('15분 전 알림 시각을 정확히 계산해야 한다', () => {
    const reminderTime = calculateReminderTime(baseEvent);
    expect(reminderTime).not.toBeNull();

    const expectedTime = new Date('2026-10-26T13:45:00').getTime();
    expect(reminderTime).toBe(expectedTime);
  });

  it('알림 없음(-1)일 경우 null을 반환해야 한다', () => {
    const noReminderEvent: CalendarEvent = {
      ...baseEvent,
      reminderMinutes: -1,
    };
    expect(calculateReminderTime(noReminderEvent)).toBeNull();
  });

  it('정각(0분) 알림일 경우 시작 시각과 동일해야 한다', () => {
    const zeroReminderEvent: CalendarEvent = {
      ...baseEvent,
      reminderMinutes: 0,
    };
    const startMs = new Date('2026-10-26T14:00:00').getTime();
    expect(calculateReminderTime(zeroReminderEvent)).toBe(startMs);
  });

  it('Windows 10 스타일 알림 메시지를 올바르게 포맷해야 한다', () => {
    const formatted = formatReminderMessage(baseEvent, 'ko');
    expect(formatted.title).toBe('[일정 알림] 주간 전략 회의');
    expect(formatted.body).toContain('15분 후 시작');
    expect(formatted.body).toContain('14:00 ~ 15:00');
    expect(formatted.body).toContain('장소: 대회의실');

    const formattedEn = formatReminderMessage(baseEvent, 'en');
    expect(formattedEn.title).toBe('[Reminder] 주간 전략 회의');
    expect(formattedEn.body).toContain('Starts in 15m');
    expect(formattedEn.body).toContain('Location: 대회의실');
  });

  it('현재 시각에 알림 예정 시각이 도달한 이벤트를 추출해야 한다', () => {
    const events: CalendarEvent[] = [
      baseEvent, // 알림 예정: 13:45:00
      {
        ...baseEvent,
        id: 'evt-test-future',
        title: '내일 회의',
        startDate: '2026-10-27T10:00:00',
        endDate: '2026-10-27T11:00:00',
        reminderMinutes: 15,
      },
    ];

    // 13:40분 기준 (아직 알림 시간 전) -> 결과 0개
    const beforeTime = new Date('2026-10-26T13:40:00');
    const resultBefore = getDueReminders(events, beforeTime, {});
    expect(resultBefore.length).toBe(0);

    // 13:45분 기준 (정확히 알림 시간 도래) -> baseEvent 1개 추출
    const onTime = new Date('2026-10-26T13:45:00');
    const resultOnTime = getDueReminders(events, onTime, {});
    expect(resultOnTime.length).toBe(1);
    expect(resultOnTime[0].event.id).toBe('evt-test-1');

    // 이미 발송된 기록이 있는 경우 중복 발송 방지
    const notifiedMap = {
      'evt-test-1': new Date('2026-10-26T13:45:00').getTime(),
    };
    const resultDuplicate = getDueReminders(events, onTime, notifiedMap);
    expect(resultDuplicate.length).toBe(0);
  });
});
