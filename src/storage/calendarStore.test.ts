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

  it('화면 배율 확대/축소(zoomIn, zoomOut, resetZoom) 및 한계값 클램핑이 정상 작동해야 한다', () => {
    // 기본값은 1.0 (100%)
    useCalendarStore.getState().resetZoom();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);

    // zoomIn (1.0 -> 1.05)
    useCalendarStore.getState().zoomIn();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.05);

    // zoomOut 2회 (1.05 -> 1.0 -> 0.95)
    useCalendarStore.getState().zoomOut();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);
    useCalendarStore.getState().zoomOut();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(0.95);

    // 최대 한계값(1.60) 클램핑 테스트
    useCalendarStore.getState().setZoomLevel(3.0);
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.6);

    // 최소 한계값(0.70) 클램핑 테스트
    useCalendarStore.getState().setZoomLevel(0.2);
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(0.7);

    // 리셋 시 1.0 복귀
    useCalendarStore.getState().resetZoom();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);
  });

  it('사이드바 너비 조절(setSidebarWidth, resetSidebarWidth) 및 범위 제한이 정상 작동해야 한다', () => {
    // 기본값은 260px
    useCalendarStore.getState().resetSidebarWidth();
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(260);

    // 정상 너비 변경 (320px)
    useCalendarStore.getState().setSidebarWidth(320);
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(320);

    // 최소 한계값(200px) 클램핑 테스트
    useCalendarStore.getState().setSidebarWidth(120);
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(200);

    // 최대 한계값(480px) 클램핑 테스트
    useCalendarStore.getState().setSidebarWidth(800);
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(480);

    // 더블클릭/리셋 시 기본값(260px) 복귀
    useCalendarStore.getState().resetSidebarWidth();
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(260);
  });

  describe('Sticky Notes (스티커 메모) 기능', () => {
    it('초기 메모 목록이 존재하고 배열 형태여야 한다', () => {
      const memos = useCalendarStore.getState().memos;
      expect(Array.isArray(memos)).toBe(true);
      expect(memos.length).toBeGreaterThanOrEqual(1);
    });

    it('addMemo를 통해 새 메모를 생성하고 저장할 수 있어야 한다', () => {
      const initialCount = useCalendarStore.getState().memos.length;

      const newMemo = useCalendarStore.getState().addMemo({
        title: '신규 프로젝트 기획',
        content: '플루언트 디자인 적용 메모',
        color: 'pink',
        isPinned: false,
        date: '2026-10-26',
      });

      const updatedMemos = useCalendarStore.getState().memos;
      expect(updatedMemos.length).toBe(initialCount + 1);
      expect(newMemo.id).toBeDefined();
      expect(newMemo.title).toBe('신규 프로젝트 기획');
      expect(newMemo.color).toBe('pink');
      expect(newMemo.date).toBe('2026-10-26');
      expect(updatedMemos[0].id).toBe(newMemo.id);
    });

    it('updateMemo를 통해 메모의 내용, 제목, 색상, 날짜를 수정할 수 있어야 한다', () => {
      const target = useCalendarStore.getState().memos[0];

      useCalendarStore.getState().updateMemo({
        id: target.id,
        title: '수정된 메모 제목',
        content: '수정된 메모 내용입니다.',
        color: 'green',
      });

      const updated = useCalendarStore.getState().memos.find((m) => m.id === target.id);
      expect(updated?.title).toBe('수정된 메모 제목');
      expect(updated?.content).toBe('수정된 메모 내용입니다.');
      expect(updated?.color).toBe('green');
    });

    it('togglePinMemo를 통해 메모의 상단 고정 상태를 토글할 수 있어야 한다', () => {
      const target = useCalendarStore.getState().memos[0];
      const initialPinned = !!target.isPinned;

      useCalendarStore.getState().togglePinMemo(target.id);
      const afterFirstToggle = useCalendarStore.getState().memos.find((m) => m.id === target.id);
      expect(afterFirstToggle?.isPinned).toBe(!initialPinned);

      useCalendarStore.getState().togglePinMemo(target.id);
      const afterSecondToggle = useCalendarStore.getState().memos.find((m) => m.id === target.id);
      expect(afterSecondToggle?.isPinned).toBe(initialPinned);
    });

    it('deleteMemo를 통해 메모를 삭제할 수 있어야 한다', () => {
      const target = useCalendarStore.getState().memos[0];
      const prevCount = useCalendarStore.getState().memos.length;

      useCalendarStore.getState().deleteMemo(target.id);
      const updated = useCalendarStore.getState().memos;
      expect(updated.length).toBe(prevCount - 1);
      expect(updated.some((m) => m.id === target.id)).toBe(false);
    });

    it('메모 패널 토글 및 열기/닫기 액션이 정확해야 한다', () => {
      useCalendarStore.getState().closeMemoPanel();
      expect(useCalendarStore.getState().isMemoPanelOpen).toBe(false);

      useCalendarStore.getState().openMemoPanel('2026-11-01');
      expect(useCalendarStore.getState().isMemoPanelOpen).toBe(true);
      expect(useCalendarStore.getState().memoFilterDate).toBe('2026-11-01');

      useCalendarStore.getState().toggleMemoPanel();
      expect(useCalendarStore.getState().isMemoPanelOpen).toBe(false);
    });

    it('JSON 백업 및 복원에 메모(memos)가 포함되어야 한다', () => {
      useCalendarStore.getState().addMemo({
        title: '백업 테스트 메모',
        content: '백업 및 복원 확인용',
        color: 'purple',
        isPinned: true,
      });

      const exportedJson = useCalendarStore.getState().exportDataJSON();
      const parsed = JSON.parse(exportedJson);
      expect(Array.isArray(parsed.memos)).toBe(true);
      expect(parsed.memos.some((m: any) => m.title === '백업 테스트 메모')).toBe(true);

      // 새 메모 추가 후 복원 시 이전 데이터로 원복 검증
      const restoreSuccess = useCalendarStore.getState().importDataJSON(exportedJson);
      expect(restoreSuccess).toBe(true);
      const restoredMemos = useCalendarStore.getState().memos;
      expect(restoredMemos.some((m) => m.title === '백업 테스트 메모')).toBe(true);
    });
  });
});

