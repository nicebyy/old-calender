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
    <div className="flex-1 overflow-y-auto p-4 bg-[#1f1f1f] select-none">
      <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto">
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const grid = getMonthGrid(year, monthIdx, selectedDate);

          return (
            <div
              key={monthIdx}
              onClick={() => handleMonthClick(monthIdx)}
              className="bg-[#242424] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#0078d7] rounded p-2.5 transition-all cursor-pointer shadow-sm group"
            >
              {/* 월 타이틀 */}
              <div className="font-semibold text-xs text-white group-hover:text-[#0078d7] transition-colors mb-2 px-1">
                {MONTH_NAMES_KO[monthIdx]}
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[9px] text-[#888888] mb-1">
                {WEEKDAYS_KO.map((day, idx) => (
                  <div
                    key={day}
                    className={
                      idx === 0 ? 'text-[#ff7878]' : idx === 6 ? 'text-[#70b0ff]' : ''
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
                          ? 'bg-[#0078d7] text-white font-bold'
                          : 'text-[#cccccc] hover:bg-[#3d3d3d]'
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
