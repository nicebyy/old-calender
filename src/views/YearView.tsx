import React from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { getMonthGrid } from '../core/calendar';
import { MONTH_NAMES_KO, WEEKDAYS_KO } from '../constants/calendar';

export const YearView: React.FC = () => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const setViewDate = useCalendarStore((s) => s.setViewDate);
  const setViewType = useCalendarStore((s) => s.setViewType);

  const year = viewDate.getFullYear();

  const handleMonthClick = (monthIdx: number) => {
    const targetDate = new Date(year, monthIdx, 1);
    setViewDate(targetDate);
    setSelectedDate(targetDate);
    setViewType('month'); // 해당 월의 월간 뷰로 즉시 줌인 전환
  };

  const handleDayClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setViewDate(date);
    setViewType('day'); // 특정 일자 클릭 시 일간 뷰로 직행
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1f1f1f] select-none overflow-y-auto p-4">
      {/* 12개월 4행 3열 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
        {MONTH_NAMES_KO.map((monthName, monthIdx) => {
          const grid = getMonthGrid(year, monthIdx, selectedDate);

          return (
            <div
              key={monthName}
              onClick={() => handleMonthClick(monthIdx)}
              className="bg-[#242424] hover:bg-[#2c2c2c] border border-[#333333] hover:border-[#0078d7] rounded p-3 cursor-pointer transition-all shadow-sm group"
            >
              {/* 월 타이틀 */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-white group-hover:text-[#0078d7] transition-colors">
                  {monthName}
                </span>
                <span className="text-[10px] text-[#777777]">{year}</span>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[9px] text-[#888888] mb-1 font-medium">
                {WEEKDAYS_KO.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* 42칸 날짜 매트릭스 */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px]">
                {grid.map((cell, idx) => {
                  const isCurrent = cell.isCurrentMonth;
                  const isToday = cell.isToday;

                  return (
                    <div
                      key={idx}
                      onClick={(e) => isCurrent && handleDayClick(e, cell.date)}
                      className={`h-5 w-5 mx-auto flex items-center justify-center rounded-full transition-colors
                        ${!isCurrent ? 'text-transparent' : 'text-[#cccccc] hover:bg-[#444444]'}
                        ${isToday ? 'bg-[#0078d7] text-white font-bold' : ''}
                      `}
                    >
                      {isCurrent ? cell.dayNumber : ''}
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
