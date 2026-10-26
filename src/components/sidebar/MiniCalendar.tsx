import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { getMonthGrid } from '../../core/calendar';
import { WEEKDAYS_KO } from '../../constants/calendar';

export const MiniCalendar: React.FC = () => {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const viewDate = useCalendarStore((s) => s.viewDate);

  const [miniYear, setMiniYear] = useState(viewDate.getFullYear());
  const [miniMonth, setMiniMonth] = useState(viewDate.getMonth());

  // 주 캘린더 viewDate 변경 시 미니 캘린더 동기화
  useEffect(() => {
    setMiniYear(viewDate.getFullYear());
    setMiniMonth(viewDate.getMonth());
  }, [viewDate]);

  const handlePrevMonth = () => {
    if (miniMonth === 0) {
      setMiniYear(miniYear - 1);
      setMiniMonth(11);
    } else {
      setMiniMonth(miniMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (miniMonth === 11) {
      setMiniYear(miniYear + 1);
      setMiniMonth(0);
    } else {
      setMiniMonth(miniMonth + 1);
    }
  };

  const grid = getMonthGrid(miniYear, miniMonth, selectedDate);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setMiniYear(date.getFullYear());
    setMiniMonth(date.getMonth());
  };

  return (
    <div className="w-full text-xs select-none">
      {/* 미니 캘린더 헤더: 년/월 및 이동 버튼 */}
      <div className="flex items-center justify-between px-1 py-1 mb-1">
        <span className="font-semibold text-xs text-white">
          {miniYear}년 {miniMonth + 1}월
        </span>
        <div className="flex items-center space-x-0.5">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-[#383838] active:bg-[#444444] rounded transition-colors"
            title="이전 달"
            aria-label="이전 달"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-[#383838] active:bg-[#444444] rounded transition-colors"
            title="다음 달"
            aria-label="다음 달"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center text-[10px] text-[#999999] mb-1 font-medium">
        {WEEKDAYS_KO.map((day, idx) => (
          <div
            key={day}
            className={`py-0.5 ${
              idx === 0 ? 'text-[#ff7878]' : idx === 6 ? 'text-[#70b0ff]' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 42칸 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {grid.map((cell, idx) => {
          const isSelected = cell.isSelected;
          const isToday = cell.isToday;
          const isCurrent = cell.isCurrentMonth;

          return (
            <button
              key={`${cell.dateString}-${idx}`}
              onClick={() => handleDateClick(cell.date)}
              className={`h-6 w-6 mx-auto flex items-center justify-center rounded-full transition-colors relative text-xs
                ${isSelected ? 'bg-[#0078d7] text-white font-bold' : ''}
                ${!isSelected && isToday ? 'border border-[#0078d7] text-white font-bold' : ''}
                ${!isSelected && !isToday && isCurrent ? 'text-[#dddddd] hover:bg-[#3a3a3a]' : ''}
                ${!isSelected && !isToday && !isCurrent ? 'text-[#666666] hover:bg-[#333333]' : ''}
              `}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};
