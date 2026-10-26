import React from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { getMonthGrid } from '../core/calendar';
import { WEEKDAYS_KO } from '../constants/calendar';
import { CalendarEvent, DayCellData } from '../types';

export const MonthView: React.FC = () => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const allEvents = useCalendarStore((s) => s.events);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const openQuickAdd = useCalendarStore((s) => s.openQuickAdd);

  // 숨김 처리된 카테고리의 이벤트 필터링
  const visibleCategoryIds = new Set(
    categories.filter((c) => c.isVisible).map((c) => c.id)
  );
  const visibleEvents = allEvents.filter((e) => visibleCategoryIds.has(e.categoryId));

  // 월간 그리드 42개 셀 계산
  const grid = getMonthGrid(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    selectedDate,
    visibleEvents
  );

  const handleCellClick = (cell: DayCellData) => {
    setSelectedDate(cell.date);
    openQuickAdd(cell.date);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation(); // 셀 클릭(퀵 추가) 전파 방지
    openEventModal(event);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1f1f1f] select-none overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-[#333333] bg-[#222222] text-xs font-semibold text-[#aaaaaa]">
        {WEEKDAYS_KO.map((day, idx) => (
          <div
            key={day}
            className={`py-2 px-3 text-left ${
              idx === 0 ? 'text-[#ff7878]' : idx === 6 ? 'text-[#70b0ff]' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 6주 x 7일 캘린더 그리드 (균등 분할 레이아웃) */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l border-t border-[#2d2d2d]">
        {grid.map((cell, idx) => {
          const isSelected = cell.isSelected;
          const isToday = cell.isToday;
          const isCurrent = cell.isCurrentMonth;
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

          return (
            <div
              key={`${cell.dateString}-${idx}`}
              onClick={() => handleCellClick(cell)}
              className={`border-r border-b border-[#2d2d2d] p-1.5 flex flex-col justify-between transition-colors relative cursor-pointer group
                ${isCurrent ? 'bg-[#1f1f1f]' : 'bg-[#181818]'}
                ${isSelected ? 'ring-1 ring-[#0078d7] z-10' : ''}
                hover:bg-[#282828] hover:border-[#444444]
              `}
            >
              {/* 상단 날짜 헤더 */}
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`w-6 h-6 flex items-center justify-center text-xs rounded-full font-medium transition-colors
                    ${isToday ? 'bg-[#0078d7] text-white font-bold shadow' : ''}
                    ${!isToday && isCurrent ? 'text-white' : ''}
                    ${!isToday && !isCurrent ? 'text-[#666666]' : ''}
                    ${!isToday && isCurrent && isWeekend ? 'text-[#e0e0e0]' : ''}
                  `}
                >
                  {cell.dayNumber}
                </div>

                {/* 오늘 날짜가 1일인 경우 월 라벨 표시 (예: 10월 1일) */}
                {cell.dayNumber === 1 && (
                  <span className="text-[10px] text-[#888888] font-medium pr-1">
                    {cell.date.getMonth() + 1}월
                  </span>
                )}
              </div>

              {/* 일정 목록 (최대 3개 표시, 초과 시 +N 표시) */}
              <div className="flex-1 overflow-hidden space-y-1">
                {cell.events.slice(0, 3).map((evt) => {
                  const cat = categories.find((c) => c.id === evt.categoryId);
                  const color = cat?.color || '#0078D7';

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => handleEventClick(e, evt)}
                      className="px-1.5 py-0.5 rounded text-[11px] truncate flex items-center space-x-1.5 bg-[#2a2a2a] hover:bg-[#383838] border-l-2 transition-all shadow-xs"
                      style={{ borderLeftColor: color }}
                      title={`${evt.title} (${evt.startDate.slice(11, 16)}~${evt.endDate.slice(11, 16)})`}
                    >
                      <span className="font-normal text-white truncate flex-1">
                        {evt.title}
                      </span>
                      {!evt.isAllDay && (
                        <span className="text-[9.5px] text-[#888888] shrink-0">
                          {evt.startDate.slice(11, 16)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {cell.events.length > 3 && (
                  <div className="text-[10px] text-[#0078d7] font-medium pl-1 hover:underline">
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
