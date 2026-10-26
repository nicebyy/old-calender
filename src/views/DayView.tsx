import React, { useRef, useEffect } from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { formatDateKey, isSameDay } from '../core/calendar';
import { WEEKDAYS_FULL_KO } from '../constants/calendar';
import { CalendarEvent } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DayView: React.FC = () => {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const allEvents = useCalendarStore((s) => s.events);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 56; // 오전 8시 기본 스크롤
    }
  }, [selectedDate]);

  const visibleCategoryIds = new Set(
    categories.filter((c) => c.isVisible).map((c) => c.id)
  );
  const visibleEvents = allEvents.filter((e) => visibleCategoryIds.has(e.categoryId));

  const dateStr = formatDateKey(selectedDate);
  const dayEvents = visibleEvents.filter((e) => {
    const start = e.startDate.slice(0, 10);
    const end = e.endDate.slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const handleSlotClick = (_hour: number) => {
    openEventModal(undefined, selectedDate);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    openEventModal(event);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--win10-bg)] select-none overflow-hidden transition-colors">
      {/* 헤더 날짜 요약 */}
      <div className="h-14 border-b border-[var(--win10-border)] bg-[var(--win10-surface)] flex items-center px-6 space-x-3 shrink-0">
        <div
          className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full ${
            isToday
              ? 'bg-[var(--win10-accent)] text-white shadow'
              : 'text-[var(--win10-text-primary)] border border-[var(--win10-border-strong)]'
          }`}
        >
          {selectedDate.getDate()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--win10-text-primary)]">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </span>
          <span className="text-xs text-[var(--win10-text-secondary)]">
            {WEEKDAYS_FULL_KO[selectedDate.getDay()]}
          </span>
        </div>
      </div>

      {/* 24시간 타임라인 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex relative bg-[var(--win10-bg)]">
        {/* 시간 라벨 열 */}
        <div className="w-16 border-r border-[var(--win10-border)] bg-[var(--win10-surface)] shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[56px] border-b border-[var(--win10-border)] pr-3 text-right text-xs text-[var(--win10-text-secondary)] flex items-start justify-end pt-1"
            >
              {hour === 0 ? '자정' : hour === 12 ? '정오' : `${hour}:00`}
            </div>
          ))}
        </div>

        {/* 이벤트 및 슬롯 영역 */}
        <div className="flex-1 relative bg-[var(--win10-bg)]">
          {HOURS.map((hour) => (
            <div
              key={hour}
              onClick={() => handleSlotClick(hour)}
              className="h-[56px] border-b border-[var(--win10-border)] hover:bg-[var(--win10-cell-hover)] cursor-pointer transition-colors"
            />
          ))}

          {/* 일정 카드들 */}
          {dayEvents.map((evt) => {
            const cat = categories.find((c) => c.id === evt.categoryId);
            const color = cat?.color || '#0078D7';

            const startHour = parseInt(evt.startDate.slice(11, 13) || '0', 10);
            const startMin = parseInt(evt.startDate.slice(14, 16) || '0', 10);
            const endHour = parseInt(evt.endDate.slice(11, 13) || '1', 10);
            const endMin = parseInt(evt.endDate.slice(14, 16) || '0', 10);

            const top = (startHour + startMin / 60) * 56;
            const duration = Math.max(
              (endHour - startHour) * 60 + (endMin - startMin),
              30
            );
            const height = (duration / 60) * 56;

            return (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(e, evt)}
                className="absolute left-3 right-6 rounded px-3 py-2 text-xs border-l-4 shadow-lg hover:brightness-110 cursor-pointer z-10 transition-all bg-[var(--win10-card-bg)] text-[var(--win10-text-primary)]"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height - 4, 28)}px`,
                  borderLeftColor: color,
                }}
              >
                <div className="font-semibold text-sm truncate">{evt.title}</div>
                {evt.description && (
                  <div className="text-[11px] text-[var(--win10-text-secondary)] truncate mt-0.5">
                    {evt.description}
                  </div>
                )}
                {!evt.isAllDay && (
                  <div className="text-[10px] text-[var(--win10-text-muted)] mt-0.5">
                    {evt.startDate.slice(11, 16)} ~ {evt.endDate.slice(11, 16)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
