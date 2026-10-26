import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn } from 'lucide-react';
import { HeaderControls } from './components/layout/HeaderControls';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { SearchOverlay } from './components/layout/SearchOverlay';
import { MemoPanel } from './components/memo/MemoPanel';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { YearView } from './views/YearView';
import { EventModal } from './components/events/EventModal';
import { AccountModal } from './components/sync/AccountModal';
import { ToastContainer } from './components/notifications/ToastContainer';
import { useCalendarStore, applyThemeToDOM } from './storage/calendarStore';
import { WALLPAPER_THEMES } from './constants/theme';

export const App: React.FC = () => {
  const viewType = useCalendarStore((s) => s.viewType);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const setViewType = useCalendarStore((s) => s.setViewType);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const toggleMemoPanel = useCalendarStore((s) => s.toggleMemoPanel);
  const settings = useCalendarStore((s) => s.settings);
  const zoomIn = useCalendarStore((s) => s.zoomIn);
  const zoomOut = useCalendarStore((s) => s.zoomOut);
  const resetZoom = useCalendarStore((s) => s.resetZoom);
  const checkDueReminders = useCalendarStore((s) => s.checkDueReminders);
  const autoDetectLocation = useCalendarStore((s) => s.autoDetectLocation);
  const refreshWeather = useCalendarStore((s) => s.refreshWeather);

  const [showZoomToast, setShowZoomToast] = useState(false);
  const zoomToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef(true);

  // 배율 변경 시 Windows 10 UWP 스타일 플로팅 인디케이터 표시
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    setShowZoomToast(true);
    if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
    zoomToastTimerRef.current = setTimeout(() => {
      setShowZoomToast(false);
    }, 1300);

    return () => {
      if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
    };
  }, [settings.zoomLevel]);

  // Ctrl + Mouse Wheel 전역 배율 확대/축소 리스너 등록
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [zoomIn, zoomOut]);

  // 날씨 초기화 및 위치 자동 감지 (최초 로드 시 실제 사용자 위치로 자동 동기화)
  useEffect(() => {
    if (settings.showWeather) {
      if (settings.weatherLocation.autoDetect) {
        autoDetectLocation();
      } else {
        refreshWeather();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 실시간 알림 스케줄러 (매 10초마다 도래한 일정 검사 및 브라우저 Notification 권한 요청)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    checkDueReminders();
    const timer = setInterval(() => {
      checkDueReminders();
    }, 10000);

    return () => clearInterval(timer);
  }, [checkDueReminders]);

  // 시스템 테마 및 전역 DOM 테마 속성 연동
  useEffect(() => {
    applyThemeToDOM(settings);

    if (settings.themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => applyThemeToDOM(settings);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings]);

  // Electron 자동 업데이트 상태 리스너 등록
  const setUpdateStatus = useCalendarStore((s) => s.setUpdateStatus);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onUpdateStatus) {
      const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
        setUpdateStatus(status);
      });
      return () => unsubscribe();
    }
  }, [setUpdateStatus]);

  // Windows 10 캘린더 전역 단축키 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창 내부에서는 단축키 방지
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd' || (e.key === '=' && e.shiftKey)) {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0' || e.code === 'Numpad0') {
          e.preventDefault();
          resetZoom();
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          goToToday();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          openEventModal();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleSearch();
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          toggleMemoPanel();
        } else if (e.key === ',') {
          e.preventDefault();
          toggleSettings();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateViewDate('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateViewDate('next');
        } else if (e.key === '1') {
          e.preventDefault();
          setViewType('day');
        } else if (e.key === '2') {
          e.preventDefault();
          setViewType('workWeek');
        } else if (e.key === '3') {
          e.preventDefault();
          setViewType('week');
        } else if (e.key === '4') {
          e.preventDefault();
          setViewType('month');
        } else if (e.key === '5') {
          e.preventDefault();
          setViewType('year');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToToday, navigateViewDate, openEventModal, setViewType, toggleSearch, toggleMemoPanel, toggleSettings, zoomIn, zoomOut, resetZoom]);

  // 배경 테마 스타일 계산
  const activeWallpaper = WALLPAPER_THEMES.find((w) => w.id === settings.backgroundTheme);
  const isCustomImage = settings.backgroundTheme && settings.backgroundTheme !== 'none' && !activeWallpaper;
  const wallpaperStyle = activeWallpaper
    ? activeWallpaper.cssBackground
    : isCustomImage
    ? `url(${settings.backgroundTheme}) center / cover no-repeat`
    : 'none';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--win10-bg)] text-[var(--win10-text-primary)] transition-colors duration-150 relative">
      {/* 창 전체 채우기 배경 레이어 (Fluent 아크릴 블렌딩) */}
      {settings.backgroundFill === 'window' && wallpaperStyle !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
          style={{
            background: wallpaperStyle,
            opacity: settings.backgroundOpacity ?? 0.35,
          }}
        />
      )}

      {/* 1. Windows 10 Fluent 통합 타이틀바 & 헤더 컨트롤 */}
      <HeaderControls />

      {/* 2. 본문 영역: 사이드바 + 캘린더 뷰 */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {viewType === 'month' && <MonthView />}
          {viewType === 'week' && <WeekView isWorkWeek={false} />}
          {viewType === 'workWeek' && <WeekView isWorkWeek={true} />}
          {viewType === 'day' && <DayView />}
          {viewType === 'year' && <YearView />}
        </main>

        {/* 3. 우측 설정 플라이아웃 패널 */}
        <SettingsPanel />

        {/* 3-1. 우측 스티커 메모 플라이아웃 패널 */}
        <MemoPanel />
      </div>

      {/* 4. 전역 모달 (이벤트 추가/수정) */}
      <EventModal />

      {/* 4-1. 전역 일정 및 메모 실시간 검색 오버레이 */}
      <SearchOverlay />

      {/* 5. 계정 선택 및 OAuth2 동기화 모달 */}
      <AccountModal />

      {/* 6. Windows 10 액션 센터 스타일 실시간 알림 배너 */}
      <ToastContainer />

      {/* 7. Windows 10 UWP 스타일 플로팅 줌 배율 인디케이터 */}
      {showZoomToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[var(--win10-card-bg)] border border-[var(--win10-border)] shadow-xl text-xs font-semibold text-[var(--win10-text-primary)] pointer-events-none transition-all duration-200"
          style={{ backdropFilter: 'blur(16px)' }}
        >
          <ZoomIn className="w-3.5 h-3.5 text-[var(--win10-accent)] stroke-[2.5]" />
          <span>{Math.round((settings.zoomLevel ?? 1.0) * 100)}%</span>
        </div>
      )}
    </div>
  );
};
