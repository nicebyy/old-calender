import React, { useEffect, useState } from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { formatDateKey, isSameDay } from '../core/calendar';
import { layoutEventsForDay } from '../core/recurrence';
import { WEEKDAYS_FULL_KO, TOTAL_HOURS_PER_DAY } from '../constants/calendar';
import { CalendarEvent } from '../types';

export const DayView: React.FC = () => {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const getExpandedEvents = useCalendarStore((s) => s.getExpandedEvents);

  const [currentMinutes, setCurrentMinutes] = useState(
    new Date().getHours() * 60 + new Date().getMinutes()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = formatDateKey(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const isToday = isSameDay(selectedDate, new Date());

  // 해당 일자의 이벤트 전개
  const dayEvents = getExpandedEvents(selectedDate, selectedDate).filter((e) => {
    const s = e.startDate.slice(0, 10);
    const end = e.endDate.slice(0, 10);
    return dateStr >= s && dateStr <= end;
  });

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);
  const layout = layoutEventsForDay(timedEvents);

  const handleSlotClick = (hour: number) => {
    const startHourStr = String(hour).padStart(2, '0');
    const endHourStr = String(Math.min(hour + 1, 23)).padStart(2, '0');
    openEventModal(undefined, selectedDate);
    useCalendarStore.setState({
      quickPopover: {
        isOpen: false,
        x: 0,
        y: 0,
        event: {
          id: '',
          title: '',
          startDate: `${dateStr}T${startHourStr}:00:00`,
          endDate: `${dateStr}T${endHourStr}:00:00`,
          isAllDay: false,
          categoryId: categories[0]?.id || 'default-personal',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    openEventModal(event);
  };

  const timeIndicatorTopPercent = (currentMinutes / 1440) * 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1f1f1f] select-none overflow-hidden">
      {/* 1. 상단 일간 헤더 */}
      <div className="p-3 border-b border-[#333333] bg-[#222222] flex items-center justify-between">
        <div className="flex items-baseline space-x-3">
          <span className="text-2xl font-light text-white">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </span>
          <span
            className={`text-sm font-medium ${
              dayOfWeek === 0 ? 'text-[#ff7878]' : dayOfWeek === 6 ? 'text-[#70b0ff]' : 'text-[#aaaaaa]'
            }`}
          >
            {WEEKDAYS_FULL_KO[dayOfWeek]}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 text-[11px] bg-[#0078d7] text-white rounded font-medium">
              오늘
            </span>
          )}
        </div>
      </div>

      {/* 2. 종일 일정 섹션 */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-[#333333] bg-[#202020] p-2 space-x-2 overflow-x-auto">
          <div className="text-xs text-[#888888] font-medium py-1 px-2 shrink-0">종일:</div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {allDayEvents.map((evt) => {
              const cat = categories.find((c) => c.id === evt.categoryId);
              return (
                <div
                  key={evt.id}
                  onClick={(e) => handleEventClick(e, evt)}
                  className="px-2.5 py-1 rounded text-xs text-white font-medium cursor-pointer shadow hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: cat?.color || '#0078D7' }}
                >
                  {evt.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 24시간 타임테이블 */}
      <div className="flex-1 overflow-y-auto flex relative">
        {/* 시간 라벨 */}
        <div className="w-16 shrink-0 border-r border-[#333333] bg-[#1a1a1a] text-xs text-[#777777] select-none">
          {Array.from({ length: TOTAL_HOURS_PER_DAY }).map((_, hour) => (
            <div
              key={hour}
              className="h-14 border-b border-[#292929] pr-2 pt-1 text-right font-mono"
            >
              {hour === 0 ? '오전 12' : hour < 12 ? `오전 ${hour}` : hour === 12 ? '오후 12' : `오후 ${hour - 12}`}
            </div>
          ))}
        </div>

        {/* 메인 슬롯 컬럼 */}
        <div className="flex-1 relative bg-[#1f1f1f]">
          {/* 시간 슬롯 */}
          {Array.from({ length: TOTAL_HOURS_PER_DAY }).map((_, hour) => (
            <div
              key={hour}
              onClick={() => handleSlotClick(hour)}
              className="h-14 border-b border-[#292929] hover:bg-[#252525] cursor-pointer transition-colors"
            />
          ))}

          {/* 일정 블록들 */}
          {layout.map(({ event, topPercent, heightPercent, column, totalColumns }) => {
            const cat = categories.find((c) => c.id === event.categoryId);
            const color = cat?.color || '#0078D7';
            const widthPercent = 100 / totalColumns;
            const leftPercent = column * widthPercent;

            return (
              <div
                key={event.id}
                onClick={(e) => handleEventClick(e, event)}
                className="absolute p-2.5 rounded text-xs text-white overflow-hidden cursor-pointer shadow-lg hover:brightness-110 transition-all border-l-4 z-10"
                style={{
                  top: `${topPercent}%`,
                  height: `${heightPercent}%`,
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: '#2b2b2b',
                  borderLeftColor: color,
                }}
              >
                <div className="font-semibold text-sm truncate">{event.title}</div>
                <div className="text-[11px] text-[#aaaaaa] mt-0.5">
                  {event.startDate.slice(11, 16)} - {event.endDate.slice(11, 16)}
                </div>
                {event.location && (
                  <div className="text-[11px] text-[#888888] mt-0.5 truncate">{event.location}</div>
                )}
                {event.description && (
                  <div className="text-[10.5px] text-[#777777] mt-1 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </div>
            );
          })}

          {/* 현재 시각선 */}
          {isToday && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${timeIndicatorTopPercent}%` }}
            >
              <div className="w-3 h-3 -ml-1.5 bg-[#e81123] rounded-full shadow" />
              <div className="flex-1 h-[2px] bg-[#e81123] shadow-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
