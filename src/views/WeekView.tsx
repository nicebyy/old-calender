import React, { useRef, useEffect } from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { getWeekDays, formatDateKey, isSameDay } from '../core/calendar';
import { WEEKDAYS_KO } from '../constants/calendar';
import { CalendarEvent } from '../types';

interface WeekViewProps {
  isWorkWeek?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeekView: React.FC<WeekViewProps> = ({ isWorkWeek = false }) => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const allEvents = useCalendarStore((s) => s.events);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 현재 주의 날짜 목록 계산
  const fullWeekDays = getWeekDays(viewDate, false);
  const displayDays = isWorkWeek
    ? fullWeekDays.filter((d) => d.getDay() !== 0 && d.getDay() !== 6) // 월~금
    : fullWeekDays; // 일~토

  // 오전 8시 위치로 자동 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 50; // 8시 위치
    }
  }, []);

  const visibleCategoryIds = new Set(
    categories.filter((c) => c.isVisible).map((c) => c.id)
  );
  const visibleEvents = allEvents.filter((e) => visibleCategoryIds.has(e.categoryId));

  const handleSlotClick = (day: Date, _hour: number) => {
    setSelectedDate(day);
    openEventModal(undefined, day);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    openEventModal(event);
  };

  const today = new Date();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1f1f1f] select-none overflow-hidden">
      {/* 1. 상단 요일 및 날짜 헤더 */}
      <div className="flex border-b border-[#2d2d2d] bg-[#222222] shrink-0">
        {/* 시간축 좌측 공백 */}
        <div className="w-14 border-r border-[#2d2d2d] shrink-0" />

        {/* 요일별 헤더 열 */}
        <div className={`flex-1 grid grid-cols-${displayDays.length}`}>
          {displayDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const dayOfWeek = day.getDay();

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`py-2 px-2 border-r border-[#2d2d2d] flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#282828]' : 'hover:bg-[#252525]'
                }`}
              >
                <span
                  className={`text-[11px] font-medium mb-0.5 ${
                    dayOfWeek === 0
                      ? 'text-[#ff7878]'
                      : dayOfWeek === 6
                      ? 'text-[#70b0ff]'
                      : 'text-[#aaaaaa]'
                  }`}
                >
                  {WEEKDAYS_KO[dayOfWeek]}
                </span>
                <div
                  className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-full transition-all ${
                    isToday
                      ? 'bg-[#0078d7] text-white shadow-sm'
                      : isSelected
                      ? 'ring-1 ring-[#0078d7] text-white'
                      : 'text-white'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 스크롤 가능한 24시간 타임라인 그리드 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex relative">
        {/* 좌측 시간 라벨 (00:00 ~ 23:00) */}
        <div className="w-14 border-r border-[#2d2d2d] shrink-0 bg-[#1d1d1d]">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[50px] border-b border-[#292929] pr-2 text-right text-[11px] text-[#777777] flex items-start justify-end pt-1"
            >
              {hour === 0 ? '자정' : hour === 12 ? '정오' : `${hour}:00`}
            </div>
          ))}
        </div>

        {/* 요일별 타임 슬롯 컬럼들 */}
        <div className={`flex-1 grid grid-cols-${displayDays.length}`}>
          {displayDays.map((day) => {
            const dateStr = formatDateKey(day);
            const dayEvents = visibleEvents.filter((e) => {
              const start = e.startDate.slice(0, 10);
              const end = e.endDate.slice(0, 10);
              return dateStr >= start && dateStr <= end;
            });

            return (
              <div
                key={dateStr}
                className="border-r border-[#292929] relative bg-[#1f1f1f]"
              >
                {/* 24시간 슬롯 셀 */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => handleSlotClick(day, hour)}
                    className="h-[50px] border-b border-[#292929] hover:bg-[#262626] cursor-pointer transition-colors"
                  />
                ))}

                {/* 해당 날짜의 이벤트 블록들 */}
                {dayEvents.map((evt) => {
                  const cat = categories.find((c) => c.id === evt.categoryId);
                  const color = cat?.color || '#0078D7';

                  // 시작 시간 기준 Y 오프셋 및 높이 계산
                  const startHour = parseInt(evt.startDate.slice(11, 13) || '0', 10);
                  const startMin = parseInt(evt.startDate.slice(14, 16) || '0', 10);
                  const endHour = parseInt(evt.endDate.slice(11, 13) || '1', 10);
                  const endMin = parseInt(evt.endDate.slice(14, 16) || '0', 10);

                  const top = (startHour + startMin / 60) * 50;
                  const duration = Math.max(
                    (endHour - startHour) * 60 + (endMin - startMin),
                    30
                  );
                  const height = (duration / 60) * 50;

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => handleEventClick(e, evt)}
                      className="absolute left-1 right-1 rounded px-2 py-1 text-xs truncate border-l-3 shadow-md hover:brightness-110 cursor-pointer z-10 transition-all bg-[#2a2a2a] text-white"
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height - 2, 22)}px`,
                        borderLeftColor: color,
                      }}
                      title={`${evt.title} (${evt.startDate.slice(11, 16)}~${evt.endDate.slice(11, 16)})`}
                    >
                      <div className="font-semibold truncate">{evt.title}</div>
                      {!evt.isAllDay && height > 32 && (
                        <div className="text-[10px] text-[#aaaaaa]">
                          {evt.startDate.slice(11, 16)} ~ {evt.endDate.slice(11, 16)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
