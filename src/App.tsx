import React, { useEffect } from 'react';
import { HeaderControls } from './components/layout/HeaderControls';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { YearView } from './views/YearView';
import { EventModal } from './components/events/EventModal';
import { useCalendarStore } from './storage/calendarStore';

export const App: React.FC = () => {
  const viewType = useCalendarStore((s) => s.viewType);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const setViewType = useCalendarStore((s) => s.setViewType);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);

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
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          goToToday();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          openEventModal();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleSearch();
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
  }, [goToToday, navigateViewDate, openEventModal, setViewType, toggleSearch, toggleSettings]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1f1f1f] text-white">
      {/* 1. Windows 10 Fluent 통합 타이틀바 & 헤더 컨트롤 */}
      <HeaderControls />

      {/* 2. 본문 영역: 사이드바 + 캘린더 뷰 */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {viewType === 'month' && <MonthView />}
          {viewType === 'week' && <WeekView isWorkWeek={false} />}
          {viewType === 'workWeek' && <WeekView isWorkWeek={true} />}
          {viewType === 'day' && <DayView />}
          {viewType === 'year' && <YearView />}
        </main>

        {/* 3. 우측 설정 플라이아웃 패널 */}
        <SettingsPanel />
      </div>

      {/* 4. 전역 모달 (이벤트 추가/수정) */}
      <EventModal />
    </div>
  );
};
