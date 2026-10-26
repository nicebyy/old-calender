import React, { useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { HeaderControls } from './components/layout/HeaderControls';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { SearchOverlay } from './components/layout/SearchOverlay';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { YearView } from './views/YearView';
import { EventModal } from './components/events/EventModal';
import { useCalendarStore } from './storage/calendarStore';

export const App: React.FC = () => {
  const viewType = useCalendarStore((s) => s.viewType);
  const settings = useCalendarStore((s) => s.settings);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const setViewType = useCalendarStore((s) => s.setViewType);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);

  // 앱 로드 시 및 설정 변경 시 Accent Color 동적 CSS 변수 적용
  useEffect(() => {
    document.documentElement.style.setProperty('--win10-accent', settings.accentColor);
  }, [settings.accentColor]);

  // Windows 10 캘린더 전역 단축키 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창 내부에서는 단축키 방지
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          goToToday();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          openEventModal();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleSearch();
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
  }, [goToToday, navigateViewDate, openEventModal, setViewType, toggleSearch]);

  const isDark = settings.themeMode === 'dark';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors ${
        isDark ? 'bg-[#1f1f1f] text-white' : 'bg-[#f3f3f3] text-[#111111]'
      }`}
    >
      {/* 1. 최상단 Windows 10 타이틀바 */}
      <TitleBar />

      {/* 2. 상단 캘린더 컨트롤 (햄버거, 년/월, 네비게이션, 5개 뷰 탭, 검색) */}
      <HeaderControls />

      {/* 3. 본문 영역: 사이드바 + 캘린더 5개 뷰 (월/주/작업주/일/연) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {viewType === 'month' && <MonthView />}
          {viewType === 'week' && <WeekView isWorkWeek={false} />}
          {viewType === 'workWeek' && <WeekView isWorkWeek={true} />}
          {viewType === 'day' && <DayView />}
          {viewType === 'year' && <YearView />}
        </main>
      </div>

      {/* 4. 전역 모달 및 패널들 */}
      <EventModal />
      <SettingsPanel />
      <SearchOverlay />
    </div>
  );
};
