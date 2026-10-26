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

  it('새 캘린더 카테고리를 정상적으로 추가할 수 있어야 한다', () => {
    const prevCount = useCalendarStore.getState().categories.length;
    useCalendarStore.getState().addCategory('피트니스', '#CA5010');

    const newCategories = useCalendarStore.getState().categories;
    expect(newCategories.length).toBe(prevCount + 1);
    expect(newCategories.some((c) => c.name === '피트니스')).toBe(true);
  });

  it('일정 드래그 앤 드롭 이동(rescheduleEvent)이 시작/종료 일자를 정확히 변경해야 한다', () => {
    const sampleEvent = useCalendarStore.getState().events[0];
    const newTargetDate = '2026-11-15';

    useCalendarStore.getState().rescheduleEvent(sampleEvent.id, newTargetDate);

    const updated = useCalendarStore
      .getState()
      .events.find((e) => e.id === sampleEvent.id);
    expect(updated?.startDate.startsWith('2026-11-15')).toBe(true);
  });

  it('iCalendar(.ics) 내보내기 및 가져오기가 정상 작동해야 한다', () => {
    const icsContent = useCalendarStore.getState().exportEventsToICSFile();
    expect(icsContent).toContain('BEGIN:VCALENDAR');

    const count = useCalendarStore.getState().importEventsFromICS(icsContent);
    expect(count).toBeGreaterThan(0);
  });

  it('OAuth2 동기화 계정 추가 및 동기화, 제거가 정상 작동해야 한다', async () => {
    const prevAccCount = useCalendarStore.getState().syncedAccounts.length;

    // 계정 추가
    useCalendarStore
      .getState()
      .addSyncedAccount('google', 'work@company.com', '회사 구글 계정');

    const accounts = useCalendarStore.getState().syncedAccounts;
    expect(accounts.length).toBe(prevAccCount + 1);

    const added = accounts.find((a) => a.email === 'work@company.com');
    expect(added).toBeDefined();

    // 동기화 실행
    if (added) {
      await useCalendarStore.getState().syncAccount(added.id);
      const syncedAcc = useCalendarStore
        .getState()
        .syncedAccounts.find((a) => a.id === added.id);
      expect(syncedAcc?.syncStatus).toBe('success');
      expect(syncedAcc?.lastSyncTime).toBeDefined();

      // 계정 삭제
      useCalendarStore.getState().removeSyncedAccount(added.id);
      const remainingAccounts = useCalendarStore.getState().syncedAccounts;
      expect(remainingAccounts.some((a) => a.id === added.id)).toBe(false);
    }
  });
});
