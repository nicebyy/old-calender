import React, { useState, useRef, useEffect } from 'react';
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import { useCalendarStore } from '../storage/calendarStore';
import { getMonthGrid } from '../core/calendar';
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

  const { weekdays, language, months } = useTranslation();

  // 드래그 앤 드롭 상태
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);

  // 마우스 휠 세로 스크롤 월 단위 이동 상태
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const isScrollingRef = useRef(false);
  const accumulatedDeltaRef = useRef(0);
  const scrollResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollResetTimerRef.current) clearTimeout(scrollResetTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    // 수평 스크롤이 지배적인 경우 무시
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

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
        return <Sun className="w-3 h-3 text-[#ffb900]" />;
      case 'partlyCloudy':
        return <CloudSun className="w-3 h-3 text-[#fce100]" />;
      case 'cloudy':
        return <Cloud className="w-3 h-3 text-[#aaaaaa]" />;
      case 'rainy':
        return <CloudRain className="w-3 h-3 text-[#4ba0e3]" />;
      case 'snowy':
        return <CloudSnow className="w-3 h-3 text-[#b4e1fa]" />;
      default:
        return null;
    }
  };

  return (
    <div
      onWheel={handleWheel}
      className="flex-1 flex flex-col h-full bg-[var(--win10-bg)] select-none overflow-hidden transition-colors"
    >
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-[var(--win10-border)] bg-[var(--win10-surface)] text-xs font-semibold text-[var(--win10-text-secondary)]">
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

      {/* 6주 x 7일 캘린더 그리드 (Windows 10 UWP 세로 슬라이드 모션) */}
      <div
        key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
        className={`flex-1 grid grid-cols-7 grid-rows-6 border-l border-t border-[var(--win10-border)] ${
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

          return (
            <div
              key={`${cell.dateString}-${idx}`}
              onClick={() => handleCellClick(cell)}
              onDragOver={(e) => handleDragOver(e, cell.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cell.dateString)}
              className={`border-r border-b border-[var(--win10-border)] p-1 flex flex-col justify-between transition-colors relative cursor-pointer group
                ${isCurrent ? 'bg-[var(--win10-cell-bg)]' : 'bg-[var(--win10-cell-other)] opacity-75 hover:opacity-100'}
                ${isSelected ? 'ring-2 ring-[var(--win10-accent)] z-10' : ''}
                ${isDragOver ? 'bg-[var(--win10-cell-hover)] ring-2 ring-[var(--win10-accent)]' : ''}
                hover:bg-[var(--win10-cell-hover)]
              `}
            >
              {/* 상단 날짜 및 날씨, 공휴일 헤더 */}
              <div className="flex items-start justify-between mb-0.5">
                <div className="flex items-center space-x-1">
                  {/* 1일인 경우 월 라벨 표시 (Windows 10 UWP 시그니처 월 구분선) */}
                  {isFirstDay && (
                    <span
                      className={`text-[11px] tracking-tight transition-colors ${
                        isCurrent
                          ? 'text-[var(--win10-accent)] font-bold'
                          : 'text-[var(--win10-text-muted)] opacity-60 font-medium'
                      }`}
                    >
                      {monthLabel}
                    </span>
                  )}

                  <div
                    className={`w-6 h-6 flex items-center justify-center text-xs rounded-full transition-colors
                      ${isToday ? 'bg-[var(--win10-accent)] text-white font-bold shadow' : ''}
                      ${!isToday && isHoliday && isCurrent ? 'text-[#ff5555] font-semibold' : ''}
                      ${!isToday && isHoliday && !isCurrent ? 'text-[#ff5555]/40 font-normal' : ''}
                      ${!isToday && !isHoliday && isCurrent && isWeekend ? 'text-[var(--win10-text-primary)] font-medium' : ''}
                      ${!isToday && !isHoliday && isCurrent && !isWeekend ? 'text-[var(--win10-text-primary)] font-medium' : ''}
                      ${!isToday && !isHoliday && !isCurrent ? 'text-[var(--win10-text-other-month)] font-normal text-[11.5px]' : ''}
                    `}
                  >
                    {cell.dayNumber}
                  </div>

                  {/* 공휴일 이름 표시 */}
                  {cell.holidayName && (
                    <span
                      className={`text-[10px] truncate max-w-[65px] transition-colors ${
                        isCurrent ? 'text-[#ff6b6b] font-medium' : 'text-[#ff6b6b]/40 font-normal'
                      }`}
                    >
                      {cell.holidayName}
                    </span>
                  )}

                  {/* 음력 일자 표시 */}
                  {cell.lunarDateString && (
                    <span
                      className={`text-[9px] hidden md:inline transition-colors ${
                        isCurrent ? 'text-[var(--win10-text-secondary)] opacity-70' : 'text-[var(--win10-text-muted)] opacity-35'
                      }`}
                    >
                      {cell.lunarDateString}
                    </span>
                  )}
                </div>

                {/* 우상단 날씨 위젯 (Windows 10 UWP 시그니처) */}
                {cell.weather && (
                  <div
                    className={`flex items-center space-x-1 text-[9.5px] pr-1 transition-opacity ${
                      isCurrent
                        ? 'text-[var(--win10-text-secondary)] opacity-90'
                        : 'text-[var(--win10-text-muted)] opacity-35 group-hover:opacity-90'
                    }`}
                    title={`${cell.weather.locationName ? `[${cell.weather.locationName}] ` : ''}${cell.weather.label} (${cell.weather.tempMax}° / ${cell.weather.tempMin}°)`}
                  >
                    {renderWeatherIcon(cell.weather)}
                    <span className="hidden xl:inline">{cell.weather.tempMax}°</span>
                  </div>
                )}
              </div>

              {/* 일정 목록 (최대 3개 표시, 드래그 가능) */}
              <div className="flex-1 overflow-hidden space-y-1">
                {cell.events.slice(0, 3).map((evt) => {
                  const cat = categories.find((c) => c.id === evt.categoryId);
                  const color = cat?.color || '#0078D7';

                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, evt)}
                      onClick={(e) => handleEventClick(e, evt)}
                      className={`px-1.5 py-0.5 rounded text-[11px] truncate flex items-center space-x-1.5 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-card-hover)] border-l-2 transition-all shadow-xs cursor-grab active:cursor-grabbing text-[var(--win10-text-primary)] ${
                        isCurrent ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                      }`}
                      style={{ borderLeftColor: color }}
                      title={`${evt.title} (${evt.startDate.slice(11, 16)}~${evt.endDate.slice(11, 16)}) - 드래그하여 날짜 이동 가능`}
                    >
                      <span className="font-normal text-[var(--win10-text-primary)] truncate flex-1">
                        {evt.title}
                      </span>
                      {!evt.isAllDay && (
                        <span className="text-[9.5px] text-[var(--win10-text-secondary)] shrink-0">
                          {evt.startDate.slice(11, 16)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {cell.events.length > 3 && (
                  <div
                    className={`text-[10px] text-[var(--win10-accent)] font-medium pl-1 hover:underline ${
                      isCurrent ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                    }`}
                  >
                    +{cell.events.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
