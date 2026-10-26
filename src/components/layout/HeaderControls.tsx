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
  RotateCw,
  StickyNote,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { CALENDAR_VIEWS } from '../../constants/calendar';
import { useTranslation } from '../../locales';

export const HeaderControls: React.FC = () => {
  const isSidebarOpen = useCalendarStore((s) => s.isSidebarOpen);
  const toggleSidebar = useCalendarStore((s) => s.toggleSidebar);
  const viewDate = useCalendarStore((s) => s.viewDate);
  const viewType = useCalendarStore((s) => s.viewType);
  const setViewType = useCalendarStore((s) => s.setViewType);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);
  const isSyncing = useCalendarStore((s) => s.isSyncing);
  const syncAllAccounts = useCalendarStore((s) => s.syncAllAccounts);
  const isMemoPanelOpen = useCalendarStore((s) => s.isMemoPanelOpen);
  const toggleMemoPanel = useCalendarStore((s) => s.toggleMemoPanel);
  const memos = useCalendarStore((s) => s.memos);

  const { t, language, formatYearMonth } = useTranslation();

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

  const zoomHint =
    viewType === 'year'
      ? language === 'ko'
        ? '▲ 줌인'
        : '▲ Zoom in'
      : language === 'ko'
      ? '▼ 줌아웃'
      : '▼ Zoom out';

  return (
    <div className="h-12 bg-[var(--win10-header)] border-b border-[var(--win10-border)] text-[var(--win10-text-primary)] flex items-center justify-between select-none app-drag-region print:hidden transition-colors">
      {/* 좌측: 햄버거 메뉴 및 년/월 타이틀, 네비게이션 */}
      <div className="flex items-center space-x-3 px-3 h-full app-no-drag">
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded hover:bg-[var(--win10-button-hover)] transition-colors ${
            !isSidebarOpen ? 'text-[var(--win10-accent)]' : 'text-[var(--win10-text-primary)]'
          }`}
          title={t('header.toggleSidebar')}
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* 현재 보고 있는 년/월 타이틀 (클릭 시 UWP 시맨틱 줌아웃) */}
        <div
          onClick={handleTitleClick}
          className="text-lg font-light text-[var(--win10-text-primary)] tracking-tight flex items-baseline space-x-1.5 cursor-pointer hover:text-[var(--win10-accent)] transition-colors group"
          title={t('calendar.yearMonthFormat', { year, month: month + 1 })}
        >
          <span className="font-semibold">{formatYearMonth(year, month)}</span>
          <span className="text-[10.5px] text-[var(--win10-text-muted)] group-hover:text-[var(--win10-accent)] font-normal pl-1">
            {zoomHint}
          </span>
        </div>

        {/* 이전 / 다음 달 이동 화살표 */}
        <div className="flex items-center space-x-0.5 pl-2">
          <button
            onClick={() => navigateViewDate('prev')}
            className="p-1 rounded hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors"
            title={`${t('header.prev')} (Ctrl+Left)`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateViewDate('next')}
            className="p-1 rounded hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors"
            title={`${t('header.next')} (Ctrl+Right)`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 오늘 버튼 */}
        <button
          onClick={goToToday}
          className="ml-1 px-2.5 py-0.5 text-xs font-medium border border-[var(--win10-border-strong)] hover:border-[var(--win10-accent)] hover:bg-[var(--win10-button-hover)] rounded transition-all text-[var(--win10-text-primary)]"
          title={`${t('header.today')} (Ctrl+T)`}
        >
          {t('header.today')}
        </button>
      </div>

      {/* 우측: 뷰 선택 탭, 인쇄/검색 버튼 및 윈도우 창 제어 컨트롤 */}
      <div className="flex items-center h-full app-no-drag">
        {/* 뷰 탭 (일, 작업 주, 주, 월, 연) */}
        <div className="flex items-center bg-[var(--win10-input-bg)] rounded p-0.5 border border-[var(--win10-border-subtle)] mr-2">
          {CALENDAR_VIEWS.map((tab) => {
            const isActive = viewType === tab.type;
            const tabLabel = t(`views.${tab.type}`);
            return (
              <button
                key={tab.type}
                onClick={() => setViewType(tab.type)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded transition-all relative ${
                  isActive
                    ? 'bg-[var(--win10-accent)] text-white shadow-sm font-semibold'
                    : 'text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)]'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* 동기화 버튼 */}
        <button
          onClick={() => syncAllAccounts()}
          disabled={isSyncing}
          className="p-1.5 rounded hover:bg-[var(--win10-button-hover)] active:bg-[var(--win10-button-active)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors mr-0.5"
          title={isSyncing ? t('header.syncing') : t('header.sync')}
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[var(--win10-accent)]' : ''}`} />
        </button>

        {/* 인쇄 버튼 */}
        <button
          onClick={handlePrint}
          className="p-1.5 rounded hover:bg-[var(--win10-button-hover)] active:bg-[var(--win10-button-active)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors mr-0.5"
          title={t('header.print')}
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* 검색 버튼 */}
        <button
          onClick={toggleSearch}
          className="p-1.5 rounded hover:bg-[var(--win10-button-hover)] active:bg-[var(--win10-button-active)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors mr-0.5"
          title={t('header.search')}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 스티커 메모 버튼 */}
        <button
          onClick={() => toggleMemoPanel()}
          className={`p-1.5 rounded hover:bg-[var(--win10-button-hover)] active:bg-[var(--win10-button-active)] transition-colors mr-2 relative ${
            isMemoPanelOpen
              ? 'text-[var(--win10-accent)] bg-[var(--win10-button-hover)]'
              : 'text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)]'
          }`}
          title={t('header.memo')}
        >
          <StickyNote className="w-4 h-4" />
          {memos.length > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--win10-accent)]" />
          )}
        </button>

        {/* Windows 10 UWP 통합 창 제어 버튼들 (표준 46px 규격) */}
        <div className="flex items-center h-full border-l border-[var(--win10-border)]">
          <button
            onClick={handleMinimize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-primary)] transition-colors"
            title={t('header.minimize')}
            aria-label={t('header.minimize')}
          >
            <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-primary)] transition-colors"
            title={isMaximized ? t('header.restore') : t('header.maximize')}
            aria-label={isMaximized ? t('header.restore') : t('header.maximize')}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 stroke-[1.5]" />
            ) : (
              <Square className="w-3 h-3 stroke-[1.5]" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white text-[var(--win10-text-primary)] transition-colors"
            title={t('header.close')}
            aria-label={t('header.close')}
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
