import React from 'react';
import { Menu, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  return (
    <div className="h-14 bg-[#1f1f1f] border-b border-[#333333] flex items-center justify-between px-3 select-none">
      {/* 좌측: 햄버거 메뉴 및 년/월 타이틀, 네비게이션 */}
      <div className="flex items-center space-x-3">
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded hover:bg-[#333333] active:bg-[#444444] transition-colors ${
            !isSidebarOpen ? 'text-[#0078d7]' : 'text-white'
          }`}
          title="사이드바 열기/닫기"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* 현재 보고 있는 년/월 타이틀 (대형 볼드 텍스트) */}
        <div className="text-xl font-light text-white tracking-tight flex items-baseline space-x-1.5 cursor-pointer hover:text-[#0078d7] transition-colors">
          <span>{year}년</span>
          <span className="font-semibold">{MONTH_NAMES_KO[month]}</span>
        </div>

        {/* 이전 / 다음 달 이동 화살표 */}
        <div className="flex items-center space-x-1 pl-2">
          <button
            onClick={() => navigateViewDate('prev')}
            className="p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="이전 (Ctrl+Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateViewDate('next')}
            className="p-1.5 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
            title="다음 (Ctrl+Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 오늘 버튼 (Windows 10 특유의 텍스트 테두리 버튼) */}
        <button
          onClick={goToToday}
          className="ml-2 px-3 py-1 text-xs font-medium border border-[#555555] hover:border-white hover:bg-[#333333] active:bg-[#444444] rounded transition-all text-white"
          title="오늘로 이동 (Ctrl+T)"
        >
          오늘
        </button>
      </div>

      {/* 우측: 뷰 선택 탭 및 검색 */}
      <div className="flex items-center space-x-1">
        {/* 뷰 탭 (일, 작업 주, 주, 월, 연) */}
        <div className="flex items-center bg-[#292929] rounded p-0.5 border border-[#383838]">
          {CALENDAR_VIEWS.map((tab) => {
            const isActive = viewType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setViewType(tab.type)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all relative ${
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

        {/* 검색 버튼 */}
        <button
          className="p-2 ml-2 rounded hover:bg-[#333333] active:bg-[#444444] text-[#cccccc] hover:text-white transition-colors"
          title="일정 검색"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
