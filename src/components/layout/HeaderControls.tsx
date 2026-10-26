import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Printer,
  Minus,
  Square,
  Copy,
  X,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { CALENDAR_VIEWS, MONTH_NAMES_KO } from '../../constants/calendar';

export const HeaderControls: React.FC = () => {
  const isSidebarOpen = useCalendarStore((s) => s.isSidebarOpen);
  const toggleSidebar = useCalendarStore((s) => s.toggleSidebar);
  const viewDate = useCalendarStore((s) => s.viewDate);
  const viewType = useCalendarStore((s) => s.viewType);
  const setViewType = useCalendarStore((s) => s.setViewType);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.electronAPI.onWindowStateChange((state) => {
        setIsMaximized(state.isMaximized);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // UWP 시맨틱 줌: 타이틀 클릭 시 연간(Year) 뷰 <-> 월간(Month) 뷰 토글
  const handleTitleClick = () => {
    if (viewType === 'year') {
      setViewType('month');
    } else {
      setViewType('year');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-12 bg-[#1f1f1f] border-b border-[#333333] flex items-center justify-between select-none app-drag-region print:hidden">
      {/* 좌측: 햄버거 메뉴 및 년/월 타이틀, 네비게이션 */}
      <div className="flex items-center space-x-3 px-3 h-full app-no-drag">
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] transition-colors ${
            !isSidebarOpen ? 'text-[#0078d7]' : 'text-white'
          }`}
          title="사이드바 열기/닫기"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* 현재 보고 있는 년/월 타이틀 (클릭 시 UWP 시맨틱 줌아웃) */}
        <div
          onClick={handleTitleClick}
          className="text-lg font-light text-white tracking-tight flex items-baseline space-x-1.5 cursor-pointer hover:text-[#0078d7] transition-colors group"
          title="클릭하여 연간 뷰로 전환 (시맨틱 줌)"
        >
          <span>{year}년</span>
          <span className="font-semibold">{MONTH_NAMES_KO[month]}</span>
          <span className="text-[10.5px] text-[#777777] group-hover:text-[#0078d7] font-normal pl-1">
            {viewType === 'year' ? '▲ 줌인' : '▼ 줌아웃'}
          </span>
        </div>

        {/* 이전 / 다음 달 이동 화살표 */}
        <div className="flex items-center space-x-0.5 pl-2">
          <button
            onClick={() => navigateViewDate('prev')}
            className="p-1 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="이전 (Ctrl+Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateViewDate('next')}
            className="p-1 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="다음 (Ctrl+Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 오늘 버튼 */}
        <button
          onClick={goToToday}
          className="ml-1 px-2.5 py-0.5 text-xs font-medium border border-[#555555] hover:border-white hover:bg-[#333333] active:bg-[#444444] rounded transition-all text-white"
          title="오늘로 이동 (Ctrl+T)"
        >
          오늘
        </button>
      </div>

      {/* 우측: 뷰 선택 탭, 인쇄/검색 버튼 및 윈도우 창 제어 컨트롤 */}
      <div className="flex items-center h-full app-no-drag">
        {/* 뷰 탭 (일, 작업 주, 주, 월, 연) */}
        <div className="flex items-center bg-[#292929] rounded p-0.5 border border-[#383838] mr-2">
          {CALENDAR_VIEWS.map((tab) => {
            const isActive = viewType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setViewType(tab.type)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded transition-all relative ${
                  isActive
                    ? 'bg-[#0078d7] text-white shadow-sm font-semibold'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#383838]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 인쇄 버튼 */}
        <button
          onClick={handlePrint}
          className="p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors mr-0.5"
          title="캘린더 인쇄 / PDF 저장 (Ctrl+P)"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* 검색 버튼 */}
        <button
          onClick={toggleSearch}
          className="p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors mr-2"
          title="일정 검색 (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Windows 10 UWP 통합 창 제어 버튼들 (표준 46px 규격) */}
        <div className="flex items-center h-full border-l border-[#333333]">
          <button
            onClick={handleMinimize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
            title="최소화"
            aria-label="최소화"
          >
            <Minus className="w-3.5 h-3.5 text-white stroke-[1.5]" />
          </button>

          <button
            onClick={handleMaximize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
            title={isMaximized ? '이전 크기로 복원' : '최대화'}
            aria-label={isMaximized ? '이전 크기로 복원' : '최대화'}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 text-white stroke-[1.5] -rotate-90" />
            ) : (
              <Square className="w-3 h-3 text-white stroke-[1.5]" />
            )}
          </button>

          <button
            onClick={handleClose}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] active:bg-[#c4101e] transition-colors group"
            title="닫기"
            aria-label="닫기"
          >
            <X className="w-3.5 h-3.5 text-white stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
