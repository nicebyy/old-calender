import React, { useState, useRef, useEffect } from 'react';
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, StickyNote } from 'lucide-react';
import { useCalendarStore } from '../storage/calendarStore';
import { getMonthGrid, getEventDisplayTitle } from '../core/calendar';
import { useTranslation } from '../locales';
import { CalendarEvent, DayCellData, WeatherInfo } from '../types';

export const MonthView: React.FC = () => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const navigateViewDate = useCalendarStore((s) => s.navigateViewDate);
  const categories = useCalendarStore((s) => s.categories);
  const settings = useCalendarStore((s) => s.settings);
  const weatherDailyCache = useCalendarStore((s) => s.weatherDailyCache);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const getExpandedEvents = useCalendarStore((s) => s.getExpandedEvents);
  const rescheduleEvent = useCalendarStore((s) => s.rescheduleEvent);
  const memos = useCalendarStore((s) => s.memos);
  const openMemoPanel = useCalendarStore((s) => s.openMemoPanel);

  const { t, weekdays, language, months } = useTranslation();

  // 드래그 앤 드롭 상태
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);

  // 마우스 휠 세로 스크롤 월 단위 이동 상태
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const isScrollingRef = useRef(false);
  const accumulatedDeltaRef = useRef(0);
  const scrollResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scrollResetTimerRef.current) clearTimeout(scrollResetTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    // Ctrl 키를 누른 상태에서는 전역 UI 확대/축소로 통과
    if (e.ctrlKey) return;

    // 수평 스크롤이 지배적인 경우 무시
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    // 화면 확대(Zoom)로 인해 세로 스크롤이 발생한 경우, 뷰포트 내부 스크롤을 먼저 수행
    const container = scrollContainerRef.current;
    if (container) {
      const isScrollable = container.scrollHeight > container.clientHeight + 4;
      if (isScrollable) {
        const isAtTop = container.scrollTop <= 2;
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 4;

        // 스크롤 상/하단 끝에 도달하기 전까지는 네이티브 스크롤 허용 (월 전환 차단)
        if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
          return;
        }
      }
    }

    accumulatedDeltaRef.current += e.deltaY;

    if (scrollResetTimerRef.current) {
      clearTimeout(scrollResetTimerRef.current);
    }
    scrollResetTimerRef.current = setTimeout(() => {
      accumulatedDeltaRef.current = 0;
    }, 150);

    if (isScrollingRef.current) return;

    const threshold = 40; // 휠 회전 감지 임계값
    if (Math.abs(accumulatedDeltaRef.current) >= threshold) {
      const isNext = accumulatedDeltaRef.current > 0;
      const direction = isNext ? 'next' : 'prev';
      const anim = isNext ? 'up' : 'down';

      isScrollingRef.current = true;
      accumulatedDeltaRef.current = 0;
      setSlideDirection(anim);

      navigateViewDate(direction);

      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        setSlideDirection(null);
        isScrollingRef.current = false;
      }, 200);
    }
  };

  // 해당 월의 앞뒤 여유를 두고 반복 일정 전개
  const startOfGrid = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 15);
  const endOfGrid = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 15);
  const visibleEvents = getExpandedEvents(startOfGrid, endOfGrid);

  // 월간 그리드 42개 셀 계산 (공휴일, 음력, 위치 기반 날씨 옵션 반영)
  const grid = getMonthGrid(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    selectedDate,
    visibleEvents,
    {
      showWeather: settings.showWeather,
      tempUnit: settings.temperatureUnit,
      showLunar: settings.showLunarCalendar,
      location: settings.weatherLocation,
      weatherCache: weatherDailyCache,
      lang: settings.language,
    }
  );

  const handleCellClick = (cell: DayCellData) => {
    setSelectedDate(cell.date);
  };

  const handleCellDoubleClick = (cell: DayCellData) => {
    openEventModal(undefined, cell.date);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    openEventModal(event);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setDraggedEventId(event.id);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDateStr !== dateString) {
      setDragOverDateStr(dateString);
    }
  };

  const handleDragLeave = () => {
    setDragOverDateStr(null);
  };

  const handleDrop = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    setDragOverDateStr(null);
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId) {
      rescheduleEvent(eventId, dateString);
      setDraggedEventId(null);
    }
  };

  const renderWeatherIcon = (weather?: WeatherInfo) => {
    if (!weather) return null;
    switch (weather.condition) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-[#ffb900] shrink-0" />;
      case 'partlyCloudy':
        return <CloudSun className="w-4 h-4 text-[#fce100] shrink-0" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-[#aaaaaa] shrink-0" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-[#4ba0e3] shrink-0" />;
      case 'snowy':
        return <CloudSnow className="w-4 h-4 text-[#b4e1fa] shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div
      onWheel={handleWheel}
      className="flex-1 flex flex-col h-full min-h-0 bg-[var(--win10-bg)] select-none overflow-hidden transition-colors"
    >
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-[var(--win10-border)] bg-[var(--win10-surface)] text-xs md:text-sm font-semibold text-[var(--win10-text-secondary)] shrink-0">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`py-2 px-3 text-left ${
              idx === 0 ? 'text-[#ff5555]' : idx === 6 ? 'text-[#0078d7]' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 6주 x 7일 캘린더 그리드 스크롤 래퍼 (확대 시 깨짐 방지 및 최소 높이 보장) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative"
      >
        <div
          key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
          style={{
            gridTemplateRows: 'repeat(6, minmax(84px, 1fr))',
          }}
          className={`min-h-full grid grid-cols-7 border-l border-t border-[var(--win10-border)] ${
            slideDirection === 'up'
              ? 'win10-month-slide-up'
              : slideDirection === 'down'
              ? 'win10-month-slide-down'
              : ''
          }`}
        >
          {grid.map((cell, idx) => {
            const isSelected = cell.isSelected;
            const isToday = cell.isToday;
            const isCurrent = cell.isCurrentMonth;
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
            const isDragOver = dragOverDateStr === cell.dateString;
            const isHoliday = !!cell.holidayName;
            const isFirstDay = cell.dayNumber === 1;
            const monthIndex = cell.date.getMonth();
            const monthLabel =
              language === 'ko'
                ? `${monthIndex + 1}월`
                : (months[monthIndex]?.slice(0, 3) || `${monthIndex + 1}`);

            const cellMemos = memos.filter((m) => m.date === cell.dateString);

            return (
              <div
                key={`${cell.dateString}-${idx}`}
                onClick={() => handleCellClick(cell)}
                onDoubleClick={() => handleCellDoubleClick(cell)}
                onDragOver={(e) => handleDragOver(e, cell.dateString)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cell.dateString)}
                className={`border-r border-b border-[var(--win10-border)] p-1.5 flex flex-col justify-start transition-colors relative cursor-pointer group min-h-0 overflow-hidden
                  ${isCurrent ? 'bg-[var(--win10-cell-bg)]' : 'bg-[var(--win10-cell-other)] opacity-75 hover:opacity-100'}
                  ${isSelected ? 'ring-2 ring-[var(--win10-accent)] ring-inset z-10' : ''}
                  ${isDragOver ? 'bg-[var(--win10-cell-hover)] ring-2 ring-[var(--win10-accent)] ring-inset' : ''}
                  hover:bg-[var(--win10-cell-hover)]
                `}
              >
                {/* 상단 날짜 및 날씨, 공휴일 헤더 */}
                <div className="flex items-center justify-between mb-1 px-0.5 min-h-[28px] gap-1 shrink-0">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {/* 1일인 경우 월 라벨 표시 (Windows 10 UWP 시그니처 월 구분선) */}
                    {isFirstDay && (
                      <span
                        className={`text-xs md:text-sm tracking-tight shrink-0 transition-colors ${
                          isCurrent
                            ? 'text-[var(--win10-accent)] font-bold'
                            : 'text-[var(--win10-text-muted)] opacity-60 font-semibold'
                        }`}
                      >
                        {monthLabel}
                      </span>
                    )}

                    <div
                      className={`w-7 h-7 shrink-0 flex items-center justify-center text-sm md:text-base rounded-full transition-colors
                        ${isToday ? 'bg-[var(--win10-accent)] text-white font-bold shadow-sm' : ''}
                        ${!isToday && isHoliday && isCurrent ? 'text-[#ff5555] font-bold' : ''}
                        ${!isToday && isHoliday && !isCurrent ? 'text-[#ff5555]/40 font-normal' : ''}
                        ${!isToday && !isHoliday && isCurrent && isWeekend ? 'text-[var(--win10-text-primary)] font-semibold' : ''}
                        ${!isToday && !isHoliday && isCurrent && !isWeekend ? 'text-[var(--win10-text-primary)] font-semibold' : ''}
                        ${!isToday && !isHoliday && !isCurrent ? 'text-[var(--win10-text-other-month)] font-normal text-xs md:text-sm' : ''}
                      `}
                    >
                      {cell.dayNumber}
                    </div>

                    {/* 공휴일 이름 표시 */}
                    {cell.holidayName && (
                      <span
                        className={`text-[11px] font-semibold truncate transition-colors ${
                          isCurrent ? 'text-[#ff6b6b]' : 'text-[#ff6b6b]/40 font-normal'
                        }`}
                        title={cell.holidayName}
                      >
                        {cell.holidayName}
                      </span>
                    )}

                    {/* 음력 일자 표시 */}
                    {cell.lunarDateString && (
                      <span
                        className={`text-[10px] hidden xl:inline transition-colors shrink-0 ${
                          isCurrent ? 'text-[var(--win10-text-secondary)] opacity-80' : 'text-[var(--win10-text-muted)] opacity-40'
                        }`}
                      >
                        {cell.lunarDateString}
                      </span>
                    )}
                  </div>

                  {/* 우상단 위젯 영역: 메모 배지 및 날씨 위젯 */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* 날짜 연결 메모 인디케이터 배지 */}
                    {cellMemos.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.date);
                          openMemoPanel(cell.dateString);
                        }}
                        className="flex items-center space-x-0.5 px-1 py-0.5 rounded hover:bg-[var(--win10-button-hover)] text-[#ffb900] transition-colors cursor-pointer"
                        title={t('memo.badgeTooltip', { count: cellMemos.length })}
                      >
                        <StickyNote className="w-3.5 h-3.5 fill-amber-400/30" />
                        <span className="text-[10px] font-bold leading-none">{cellMemos.length}</span>
                      </button>
                    )}

                    {/* 우상단 날씨 위젯 (Windows 10 UWP 시그니처) */}
                    {cell.weather && (
                      <div
                        className={`flex items-center space-x-1 text-xs shrink-0 pl-0.5 transition-opacity ${
                          isCurrent
                            ? 'text-[var(--win10-text-secondary)] opacity-95'
                            : 'text-[var(--win10-text-muted)] opacity-40 group-hover:opacity-90'
                        }`}
                        title={`${cell.weather.locationName ? `[${cell.weather.locationName}] ` : ''}${cell.weather.label} (${cell.weather.tempMax}° / ${cell.weather.tempMin}°)`}
                      >
                        {renderWeatherIcon(cell.weather)}
                        <span className="font-semibold text-xs md:text-[13px]">{cell.weather.tempMax}°</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 일정 목록 (최대 3개 표시, 드래그 가능) */}
                <div className="flex-1 overflow-hidden space-y-0.5 min-h-0 w-full">
                  {cell.events.slice(0, 3).map((evt) => {
                    const cat = categories.find((c) => c.id === evt.categoryId);
                    const color = cat?.color || '#0078D7';
                    const displayTitle = getEventDisplayTitle(evt, language);

                    return (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, evt)}
                        onClick={(e) => handleEventClick(e, evt)}
                        className={`px-1.5 py-0.5 rounded text-[11px] leading-tight truncate flex items-center space-x-1 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-card-hover)] border-l-2 transition-all shadow-xs cursor-grab active:cursor-grabbing text-[var(--win10-text-primary)] ${
                          isCurrent ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                        }`}
                        style={{ borderLeftColor: color }}
                        title={`${displayTitle} (${evt.startDate.slice(11, 16)}~${evt.endDate.slice(11, 16)}) ${t('calendar.dragToReschedule')}`}
                      >
                        <span className="font-medium text-[var(--win10-text-primary)] truncate flex-1">
                          {displayTitle}
                        </span>
                        {!evt.isAllDay && (
                          <span className="text-[9.5px] text-[var(--win10-text-secondary)] shrink-0 font-normal">
                            {evt.startDate.slice(11, 16)}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {cell.events.length > 3 && (
                    <div
                      className={`text-[10.5px] text-[var(--win10-accent)] font-semibold pl-1 hover:underline truncate ${
                        isCurrent ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                      }`}
                    >
                      {t('calendar.moreEvents', { count: cell.events.length - 3 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
