import React, { useEffect, useState } from 'react';
import { useCalendarStore } from '../storage/calendarStore';
import { getWeekDays, formatDateKey, isSameDay } from '../core/calendar';
import { layoutEventsForDay } from '../core/recurrence';
import { WEEKDAYS_KO, TOTAL_HOURS_PER_DAY } from '../constants/calendar';
import { CalendarEvent } from '../types';

interface WeekViewProps {
  isWorkWeek?: boolean; // true면 월~금(5일), false면 일~토(7일)
}

export const WeekView: React.FC<WeekViewProps> = ({ isWorkWeek = false }) => {
  const viewDate = useCalendarStore((s) => s.viewDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const getExpandedEvents = useCalendarStore((s) => s.getExpandedEvents);

  // 실시간 현재 시간 표시용 state (분 단위 갱신)
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

  // 주간 날짜 7일 계산 (일~토)
  const allWeekDays = getWeekDays(viewDate, false);
  // 작업 주면 월(1)~금(5)만 필터링
  const daysToDisplay = isWorkWeek
    ? allWeekDays.filter((d) => d.getDay() >= 1 && d.getDay() <= 5)
    : allWeekDays;

  const weekStart = daysToDisplay[0];
  const weekEnd = daysToDisplay[daysToDisplay.length - 1];

  // 반복 일정까지 전개된 주간 이벤트 목록
  const weekEvents = getExpandedEvents(weekStart, weekEnd);

  // 종일 일정과 시간 지정 일정 분리
  const allDayEvents = weekEvents.filter((e) => e.isAllDay);

  const handleSlotClick = (date: Date, hour: number) => {
    const dateStr = formatDateKey(date);
    const startHourStr = String(hour).padStart(2, '0');
    const endHourStr = String(Math.min(hour + 1, 23)).padStart(2, '0');

    setSelectedDate(date);
    openEventModal(undefined, date);
    // 모달에 시작/종료 시간 힌트 전달 가능
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

  const now = new Date();
  const timeIndicatorTopPercent = (currentMinutes / 1440) * 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1f1f1f] select-none overflow-hidden">
      {/* 1. 상단 날짜 헤더 열 */}
      <div className="flex border-b border-[#333333] bg-[#222222] shrink-0">
        {/* 좌측 시간 축 공간 (56px) */}
        <div className="w-14 shrink-0 border-r border-[#333333] p-2 text-[10px] text-[#777777] flex items-end justify-center">
          GMT+9
        </div>

        {/* 날짜 컬럼 헤더들 */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(0, 1fr))` }}>
          {daysToDisplay.map((day) => {
            const isToday = isSameDay(day, now);
            const isSelected = isSameDay(day, selectedDate);
            const dayOfWeek = day.getDay();

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`py-2 px-2 border-r border-[#333333] text-center cursor-pointer hover:bg-[#2a2a2a] transition-colors
                  ${isSelected ? 'bg-[#282828]' : ''}
                `}
              >
                <div
                  className={`text-[11px] font-medium
                    ${dayOfWeek === 0 ? 'text-[#ff7878]' : dayOfWeek === 6 ? 'text-[#70b0ff]' : 'text-[#aaaaaa]'}
                  `}
                >
                  {WEEKDAYS_KO[dayOfWeek]}
                </div>
                <div
                  className={`w-7 h-7 mx-auto mt-0.5 flex items-center justify-center rounded-full text-xs font-semibold
                    ${isToday ? 'bg-[#0078d7] text-white shadow' : 'text-white'}
                  `}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 종일 일정 섹션 (있는 경우 표시) */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-[#333333] bg-[#202020] shrink-0 max-h-24 overflow-y-auto">
          <div className="w-14 shrink-0 border-r border-[#333333] text-[10px] text-[#888888] p-1.5 text-center flex items-center justify-center">
            종일
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(0, 1fr))` }}>
            {daysToDisplay.map((day) => {
              const dateStr = formatDateKey(day);
              const dayAllDayEvents = allDayEvents.filter((e) => {
                const s = e.startDate.slice(0, 10);
                const end = e.endDate.slice(0, 10);
                return dateStr >= s && dateStr <= end;
              });

              return (
                <div key={dateStr} className="border-r border-[#333333] p-1 space-y-1 min-h-[32px]">
                  {dayAllDayEvents.map((evt) => {
                    const cat = categories.find((c) => c.id === evt.categoryId);
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(e, evt)}
                        className="px-1.5 py-0.5 rounded text-[11px] text-white truncate cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: cat?.color || '#0078D7' }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 24시간 스크롤 타임테이블 */}
      <div className="flex-1 overflow-y-auto flex relative">
        {/* 좌측 24시간 라벨 (매 시각 48px 높이) */}
        <div className="w-14 shrink-0 border-r border-[#333333] bg-[#1a1a1a] text-[10px] text-[#777777] select-none">
          {Array.from({ length: TOTAL_HOURS_PER_DAY }).map((_, hour) => (
            <div
              key={hour}
              className="h-12 border-b border-[#292929] pr-1.5 pt-0.5 text-right font-mono"
            >
              {hour === 0 ? '오전 12' : hour < 12 ? `오전 ${hour}` : hour === 12 ? '오후 12' : `오후 ${hour - 12}`}
            </div>
          ))}
        </div>

        {/* 요일별 타임 슬롯 컬럼들 */}
        <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(0, 1fr))` }}>
          {daysToDisplay.map((day) => {
            const dateStr = formatDateKey(day);
            const isToday = isSameDay(day, now);

            // 해당 날짜의 시간 지정 일정
            const dayEvents = weekEvents.filter((e) => {
              if (e.isAllDay) return false;
              const s = e.startDate.slice(0, 10);
              const end = e.endDate.slice(0, 10);
              return dateStr >= s && dateStr <= end;
            });

            // 겹침 레이아웃 계산
            const layout = layoutEventsForDay(dayEvents);

            return (
              <div
                key={dateStr}
                className="border-r border-[#2d2d2d] relative bg-[#1f1f1f] hover:bg-[#222222] transition-colors"
              >
                {/* 24시간 빈 슬롯 (클릭 시 일정 추가) */}
                {Array.from({ length: TOTAL_HOURS_PER_DAY }).map((_, hour) => (
                  <div
                    key={hour}
                    onClick={() => handleSlotClick(day, hour)}
                    className="h-12 border-b border-[#2b2b2b] hover:bg-[#282828] cursor-pointer transition-colors"
                  />
                ))}

                {/* 배치된 일정 블록들 */}
                {layout.map(({ event, topPercent, heightPercent, column, totalColumns }) => {
                  const cat = categories.find((c) => c.id === event.categoryId);
                  const color = cat?.color || '#0078D7';
                  const widthPercent = 100 / totalColumns;
                  const leftPercent = column * widthPercent;

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="absolute p-1.5 rounded text-[11px] text-white overflow-hidden cursor-pointer shadow-md hover:brightness-110 transition-all border-l-3 z-10"
                      style={{
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: '#2b2b2b',
                        borderLeftColor: color,
                      }}
                      title={`${event.title} (${event.startDate.slice(11, 16)} ~ ${event.endDate.slice(11, 16)})`}
                    >
                      <div className="font-semibold truncate leading-tight">{event.title}</div>
                      <div className="text-[10px] text-[#aaaaaa] truncate mt-0.5">
                        {event.startDate.slice(11, 16)} - {event.endDate.slice(11, 16)}
                      </div>
                      {event.location && (
                        <div className="text-[9.5px] text-[#888888] truncate">{event.location}</div>
                      )}
                    </div>
                  );
                })}

                {/* 오늘 날짜일 경우 실시간 시각선 (Red Indicator Line) */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${timeIndicatorTopPercent}%` }}
                  >
                    <div className="w-2.5 h-2.5 -ml-1.5 bg-[#e81123] rounded-full shadow" />
                    <div className="flex-1 h-[2px] bg-[#e81123] shadow-sm" />
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
