import React, { useEffect, useState } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Minus,
  Square,
  Copy,
  X,
  Calendar as CalendarIcon,
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
  const isSearchOpen = useCalendarStore((s) => s.isSearchOpen);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);
  const searchQuery = useCalendarStore((s) => s.searchQuery);
  const setSearchQuery = useCalendarStore((s) => s.setSearchQuery);

  const [isMaximized, setIsMaximized] = useState(false);

  // 창 최대화 상태 리스너 연동
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.electronAPI.onWindowStateChange((state) => {
        setIsMaximized(state.isMaximized);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.closeWindow();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  return (
    <header
      className="h-11 bg-[#1f1f1f] border-b border-[#2d2d2d] flex items-center justify-between select-none app-drag-region z-30 relative shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={handleMaximize}
    >
      {/* 1. 좌측: 햄버거 메뉴, 앱 타이틀, 년/월, 네비게이션 */}
      <div
        className="flex items-center space-x-2 pl-2 h-full app-no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] transition-colors ${
            !isSidebarOpen ? 'text-[#0078d7]' : 'text-[#dddddd] hover:text-white'
          }`}
          title="사이드바 열기/닫기"
          aria-label="사이드바 열기/닫기"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Menu className="w-4 h-4 stroke-[2]" />
        </button>

        {/* 앱 브랜드 아이콘 및 타이틀 */}
        <div className="flex items-center space-x-1.5 pr-1 cursor-default">
          <CalendarIcon className="w-3.5 h-3.5 text-[#0078d7]" />
          <span className="font-semibold text-xs tracking-tight text-[#cccccc]">일정</span>
        </div>

        {/* 얇은 구분선 */}
        <div className="h-4 w-px bg-[#383838] mx-0.5" />

        {/* 현재 보고 있는 년/월 타이틀 (클릭 시 연간 뷰 토글) */}
        <button
          onClick={() => setViewType(viewType === 'year' ? 'month' : 'year')}
          className="text-base font-light text-white tracking-tight flex items-center space-x-1 hover:text-[#0078d7] transition-colors px-1.5 py-0.5 rounded hover:bg-[#2b2b2b]"
          title="연간 뷰 전환"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <span>{year}년</span>
          <span className="font-semibold">{MONTH_NAMES_KO[month]}</span>
          <ChevronDown className="w-3 h-3 text-[#888888] ml-0.5" />
        </button>

        {/* 이전 / 다음 달 이동 화살표 */}
        <div className="flex items-center space-x-0.5">
          <button
            onClick={() => navigateViewDate('prev')}
            className="p-1 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="이전 (Ctrl+Left)"
            aria-label="이전"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateViewDate('next')}
            className="p-1 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="다음 (Ctrl+Right)"
            aria-label="다음"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 오늘 버튼 (Windows 10 Fluent 텍스트 테두리 버튼) */}
        <button
          onClick={goToToday}
          className="px-2.5 py-0.5 text-xs font-normal border border-[#555555] hover:border-white hover:bg-[#333333] active:bg-[#444444] rounded transition-all text-white ml-1"
          title="오늘로 이동 (Ctrl+T)"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          오늘
        </button>
      </div>

      {/* 2. 중앙 드래그 가능 영역 */}
      <div
        className="flex-1 h-full app-drag-region cursor-default"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onDoubleClick={handleMaximize}
      />

      {/* 3. 우측: 검색창, 뷰 선택 탭, 윈도우 창 제어 버튼들 */}
      <div
        className="flex items-center h-full app-no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 검색 입력창 또는 검색 버튼 */}
        {isSearchOpen ? (
          <div
            className="flex items-center bg-[#292929] border border-[#444444] rounded px-2 py-1 mr-2 transition-all"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Search className="w-3.5 h-3.5 text-[#888888] mr-1.5 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일정 검색..."
              className="bg-transparent text-xs text-white outline-none w-32 placeholder-[#777777]"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            />
            <button
              onClick={toggleSearch}
              className="text-[#888888] hover:text-white text-xs ml-1 px-0.5"
              title="검색 닫기"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={toggleSearch}
            className="p-1.5 mr-2 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="일정 검색"
            aria-label="일정 검색"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* 뷰 선택 탭 (일, 작업 주, 주, 월, 연) */}
        <div
          className="flex items-center bg-[#292929] rounded p-0.5 border border-[#383838] mr-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {CALENDAR_VIEWS.map((tab) => {
            const isActive = viewType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setViewType(tab.type)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded transition-all relative ${
                  isActive
                    ? 'bg-[#0078d7] text-white shadow-xs font-semibold'
                    : 'text-[#aaaaaa] hover:text-white hover:bg-[#383838]'
                }`}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 윈도우 창 제어 버튼군 (Windows 10 순수 규격: 46px 너비, 높이 100%) */}
        <div
          className="flex items-center h-full border-l border-[#2e2e2e]"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="최소화"
            aria-label="최소화"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          <button
            onClick={handleMaximize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title={isMaximized ? '이전 크기로 복원' : '최대화'}
            aria-label={isMaximized ? '이전 크기로 복원' : '최대화'}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 stroke-[1.5] -rotate-90" />
            ) : (
              <Square className="w-3 h-3 stroke-[1.5]" />
            )}
          </button>

          <button
            onClick={handleClose}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] active:bg-[#c4101e] text-[#cccccc] hover:text-white transition-colors group"
            title="닫기"
            aria-label="닫기"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <X className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
