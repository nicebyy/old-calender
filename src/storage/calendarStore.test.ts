import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('다크/라이트 모드 및 액센트 컬러 변경 시 DOM과 CSS 변수에 즉시 반영되어야 한다', () => {
    // 라이트 모드 및 크림슨 액센트 적용
    useCalendarStore.getState().updateSettings({
      themeMode: 'light',
      accentColor: '#E81123',
      backgroundOpacity: 0.5,
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--win10-accent')).toBe('#E81123');
    expect(document.documentElement.style.getPropertyValue('--win10-bg-opacity')).toBe('0.5');

    // 다크 모드로 변경
    useCalendarStore.getState().updateSettings({
      themeMode: 'dark',
      accentColor: '#107C41',
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--win10-accent')).toBe('#107C41');
  });

  it('1-클릭 테마 프리셋(applyThemePreset) 적용 시 모든 테마 요소가 일괄 갱신되어야 한다', () => {
    const cyberPreset = {
      id: 'cyber-neon',
      name: '사이버 네온 시안',
      themeMode: 'dark' as const,
      accentColor: '#00B7C3',
      backgroundTheme: 'city',
      backgroundFill: 'window' as const,
      description: '사이버 테마',
    };

    useCalendarStore.getState().applyThemePreset(cyberPreset);

    const settings = useCalendarStore.getState().settings;
    expect(settings.themeMode).toBe('dark');
    expect(settings.accentColor).toBe('#00B7C3');
    expect(settings.backgroundTheme).toBe('city');
    expect(settings.backgroundFill).toBe('window');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--win10-accent')).toBe('#00B7C3');
  });

  it('배경 테마와 채우기 모드 변경이 스토어와 로컬스토리지에 저장되어야 한다', () => {
    useCalendarStore.getState().updateSettings({
      backgroundTheme: 'lake',
      backgroundFill: 'sidebar',
      backgroundOpacity: 0.7,
    });

    const settings = useCalendarStore.getState().settings;
    expect(settings.backgroundTheme).toBe('lake');
    expect(settings.backgroundFill).toBe('sidebar');
    expect(settings.backgroundOpacity).toBe(0.7);

    // localStorage에 저장되었는지 확인
    const saved = localStorage.getItem('win10_calendar_settings');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.backgroundTheme).toBe('lake');
    expect(parsed.backgroundFill).toBe('sidebar');
  });

  it('일정 알림(triggerReminderNotification) 발생 시 activeToasts에 등록되고 해제(dismissToast)되어야 한다', () => {
    const testEvt = {
      id: 'test-reminder-evt',
      title: '알림 테스트 회의',
      startDate: '2026-10-26T16:00:00',
      endDate: '2026-10-26T17:00:00',
      isAllDay: false,
      categoryId: 'default-work',
      reminderMinutes: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    useCalendarStore.getState().triggerReminderNotification(testEvt);

    const toasts = useCalendarStore.getState().activeToasts;
    expect(toasts.length).toBeGreaterThan(0);
    const toast = toasts.find((t) => t.event.id === testEvt.id);
    expect(toast).toBeDefined();
    expect(toast?.title).toContain('알림 테스트 회의');

    // 토스트 해제
    if (toast) {
      useCalendarStore.getState().dismissToast(toast.id);
      const remaining = useCalendarStore.getState().activeToasts;
      expect(remaining.some((t) => t.id === toast.id)).toBe(false);
    }
  });

  it('소프트웨어 자동 업데이트 상태 설정 및 업데이트 확인 액션이 정상 작동해야 한다', async () => {
    expect(useCalendarStore.getState().updateStatus).toBeNull();

    useCalendarStore.getState().setUpdateStatus({
      status: 'downloading',
      percent: 50,
      version: '1.0.1',
    });
    expect(useCalendarStore.getState().updateStatus?.status).toBe('downloading');
    expect(useCalendarStore.getState().updateStatus?.percent).toBe(50);

    await useCalendarStore.getState().checkForUpdates();
    expect(useCalendarStore.getState().updateStatus?.status).toBe('checking');
  });

  it('window.electronAPI가 존재할 때 checkForUpdates 및 quitAndInstallUpdate를 호출해야 한다', async () => {
    const mockCheck = vi.fn().mockResolvedValue({ updateInfo: { version: '1.0.1' } });
    const mockQuit = vi.fn();

    (window as any).electronAPI = {
      ...(window as any).electronAPI,
      checkForUpdates: mockCheck,
      quitAndInstallUpdate: mockQuit,
    };

    await useCalendarStore.getState().checkForUpdates();
    expect(mockCheck).toHaveBeenCalled();

    useCalendarStore.getState().quitAndInstallUpdate();
    expect(mockQuit).toHaveBeenCalled();
  });
});

