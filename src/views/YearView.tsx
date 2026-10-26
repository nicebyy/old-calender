import React from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { getMonthGrid, isSameDay } from '../core/calendar';
import { MONTH_NAMES_KO, WEEKDAYS_KO } from '../constants/calendar';

export const YearView: React.FC = () => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setViewDate = useCalendarStore((s) => s.setViewDate);
  const setViewType = useCalendarStore((s) => s.setViewType);

  const year = viewDate.getFullYear();
  const today = new Date();

  const handleMonthClick = (monthIdx: number) => {
    const newDate = new Date(year, monthIdx, 1);
    setViewDate(newDate);
    setSelectedDate(newDate);
    setViewType('month');
  };

  const handleDayClick = (e: React.MouseEvent, dayDate: Date) => {
    e.stopPropagation();
    setSelectedDate(dayDate);
    setViewDate(dayDate);
    setViewType('month');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--win10-bg)] select-none transition-colors">
      <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto">
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const grid = getMonthGrid(year, monthIdx, selectedDate);

          return (
            <div
              key={monthIdx}
              onClick={() => handleMonthClick(monthIdx)}
              className="bg-[var(--win10-card-bg)] hover:bg-[var(--win10-card-hover)] border border-[var(--win10-border)] hover:border-[var(--win10-accent)] rounded p-2.5 transition-all cursor-pointer shadow-sm group"
            >
              {/* 월 타이틀 */}
              <div className="font-semibold text-xs text-[var(--win10-text-primary)] group-hover:text-[var(--win10-accent)] transition-colors mb-2 px-1">
                {MONTH_NAMES_KO[monthIdx]}
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[9px] text-[var(--win10-text-secondary)] mb-1">
                {WEEKDAYS_KO.map((day, idx) => (
                  <div
                    key={day}
                    className={
                      idx === 0 ? 'text-[#ff5555]' : idx === 6 ? 'text-[#0078d7]' : ''
                    }
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 42칸 미니 그리드 */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px]">
                {grid.map((cell, idx) => {
                  const isCurrent = cell.isCurrentMonth;
                  const isToday = isSameDay(cell.date, today);

                  if (!isCurrent) {
                    return <div key={idx} className="h-4" />;
                  }

                  return (
                    <div
                      key={idx}
                      onClick={(e) => handleDayClick(e, cell.date)}
                      className={`h-4.5 w-4.5 mx-auto flex items-center justify-center rounded-full text-[10px] transition-colors ${
                        isToday
                          ? 'bg-[var(--win10-accent)] text-white font-bold'
                          : 'text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)]'
                      }`}
                    >
                      {cell.dayNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
