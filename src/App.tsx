import React, { useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { HeaderControls } from './components/layout/HeaderControls';
import { Sidebar } from './components/layout/Sidebar';
import { MonthView } from './views/MonthView';
import { EventModal } from './components/events/EventModal';
import { useCalendarStore } from './storage/calendarStore';

export const App: React.FC = () => {
  const viewType = useCalendarStore((s) => s.viewType);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const setViewType = useCalendarStore((s) => s.setViewType);

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
  }, [goToToday, navigateViewDate, openEventModal, setViewType]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1f1f1f] text-white">
      {/* 1. 최상단 Windows 10 타이틀바 */}
      <TitleBar />

      {/* 2. 상단 캘린더 컨트롤 (햄버거, 년/월, 네비게이션, 뷰 선택) */}
      <HeaderControls />

      {/* 3. 본문 영역: 사이드바 + 캘린더 뷰 */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {viewType === 'month' && <MonthView />}
          {viewType !== 'month' && (
            <div className="flex-1 flex flex-col items-center justify-center text-[#888888]">
              <div className="text-base font-light mb-1">
                {viewType === 'day' && '일간 뷰'}
                {viewType === 'workWeek' && '작업 주 뷰'}
                {viewType === 'week' && '주간 뷰'}
                {viewType === 'year' && '연간 뷰'}
              </div>
              <p className="text-xs text-[#666666]">
                현재 월간 뷰가 기본 활성화되어 있으며, 다른 뷰는 다음 업데이트에 연결됩니다.
              </p>
              <button
                onClick={() => setViewType('month')}
                className="mt-3 px-3 py-1 text-xs bg-[#0078d7] hover:bg-[#1a86d9] text-white rounded transition-colors"
              >
                월간 뷰로 돌아가기
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 4. 전역 모달 (이벤트 추가/수정) */}
      <EventModal />
    </div>
  );
};
