import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from './calendarStore';

describe('CalendarStore Extended', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 스토어 상태가 정상적으로 설정되어야 한다', () => {
    const state = useCalendarStore.getState();
    expect(state.viewType).toBe('month');
    expect(state.isSidebarOpen).toBe(true);
    expect(state.categories.length).toBeGreaterThan(0);
    expect(state.settings.accentColor).toBe('#0078D7');
  });

  it('일정 추가(addEvent) 시 즉시 events 목록에 반영되어야 한다', () => {
    const initialCount = useCalendarStore.getState().events.length;

    useCalendarStore.getState().addEvent({
      title: '테스트 새 일정',
      startDate: '2026-10-26T14:00:00',
      endDate: '2026-10-26T15:00:00',
      isAllDay: false,
      categoryId: 'default-personal',
    });

    const updated = useCalendarStore.getState().events;
    expect(updated.length).toBe(initialCount + 1);
    expect(updated[updated.length - 1].title).toBe('테스트 새 일정');
  });

  it('설정 변경(updateSettings) 시 액센트 컬러 및 테마가 갱신되어야 한다', () => {
    useCalendarStore.getState().updateSettings({
      accentColor: '#E81123',
      themeMode: 'light',
    });

    const settings = useCalendarStore.getState().settings;
    expect(settings.accentColor).toBe('#E81123');
    expect(settings.themeMode).toBe('light');
  });

  it('데이터 JSON 내보내기 및 복원이 정확해야 한다', () => {
    const exportedJSON = useCalendarStore.getState().exportDataJSON();
    expect(typeof exportedJSON).toBe('string');

    const result = useCalendarStore.getState().importDataJSON(exportedJSON);
    expect(result).toBe(true);
  });
});
