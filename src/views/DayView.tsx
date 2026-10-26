import React, { useRef, useEffect } from 'react';
import { StickyNote, Plus } from 'lucide-react';
import { useCalendarStore } from '../storage/calendarStore';
import {
  formatDateKey,
  isSameDay,
  getEventDisplayTitle,
  getMemoDisplayTitle,
  getMemoDisplayContent,
} from '../core/calendar';
import { MEMO_COLORS } from '../constants/memo';
import { useTranslation } from '../locales';
import { CalendarEvent } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DayView: React.FC = () => {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const allEvents = useCalendarStore((s) => s.events);
  const categories = useCalendarStore((s) => s.categories);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const memos = useCalendarStore((s) => s.memos);
  const openMemoPanel = useCalendarStore((s) => s.openMemoPanel);
  const addMemo = useCalendarStore((s) => s.addMemo);
  const settings = useCalendarStore((s) => s.settings);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { t, weekdaysFull, months, language } = useTranslation();

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

  const dayMemos = memos.filter((m) => m.date === dateStr);

  const isLight =
    settings.themeMode === 'light' ||
    (settings.themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const handleSlotClick = (_hour: number) => {
    openEventModal(undefined, selectedDate);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    openEventModal(event);
  };

  const formattedDateTitle =
    language === 'ko'
      ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
      : `${months[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--win10-bg)] select-none overflow-hidden transition-colors">
      {/* 헤더 날짜 요약 */}
      <div className="h-14 border-b border-[var(--win10-border)] bg-[var(--win10-surface)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-3">
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
              {formattedDateTitle}
            </span>
            <span className="text-xs text-[var(--win10-text-secondary)]">
              {weekdaysFull[selectedDate.getDay()]}
            </span>
          </div>
        </div>

        {/* 우측: 이 날의 메모 바로가기 / 추가 버튼 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openMemoPanel(dateStr)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[var(--win10-border)] hover:bg-[var(--win10-button-hover)] text-xs text-[var(--win10-text-primary)] transition-colors cursor-pointer"
            title={t('memo.dayMemos')}
          >
            <StickyNote className="w-3.5 h-3.5 text-[#ffb900]" />
            <span>{t('memo.dayMemos')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--win10-card-bg)] border border-[var(--win10-border)] text-[10.5px] font-semibold text-[var(--win10-accent)]">
              {dayMemos.length}
            </span>
          </button>
        </div>
      </div>

      {/* 이 날의 스티커 메모 가로 스트립 (메모가 있는 경우 표시) */}
      {dayMemos.length > 0 && (
        <div className="border-b border-[var(--win10-border)] bg-[var(--win10-surface)] px-6 py-2 flex items-center space-x-2.5 overflow-x-auto shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-[var(--win10-text-secondary)] font-medium shrink-0 mr-1">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('memo.title')}</span>
          </div>
          {dayMemos.map((memo) => {
            const colorConfig = MEMO_COLORS.find((c) => c.id === memo.color) || MEMO_COLORS[0];
            return (
              <div
                key={memo.id}
                onClick={() => openMemoPanel(dateStr)}
                style={{
                  backgroundColor: isLight ? colorConfig.bgLight : colorConfig.bgDark,
                  borderColor: isLight ? colorConfig.borderLight : colorConfig.borderDark,
                  color: isLight ? colorConfig.textLight : colorConfig.textDark,
                }}
                className="px-2.5 py-1.5 rounded border text-xs max-w-[200px] shrink-0 cursor-pointer hover:shadow-md transition-shadow truncate"
                title={`${getMemoDisplayTitle(memo, language) || ''}\n${getMemoDisplayContent(memo, language)}`}
              >
                <div className="font-bold text-[11px] truncate">
                  {getMemoDisplayTitle(memo, language) || t('memo.untitled')}
                </div>
                <div className="text-[10px] opacity-80 truncate">
                  {getMemoDisplayContent(memo, language) || t('memo.noContent')}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => {
              addMemo({
                title: '',
                content: '',
                color: 'yellow',
                isPinned: false,
                date: dateStr,
              });
              openMemoPanel(dateStr);
            }}
            className="p-1.5 rounded border border-dashed border-[var(--win10-border-strong)] hover:border-[var(--win10-accent)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-accent)] text-xs flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
            title={t('memo.addDayMemo')}
          >
            <Plus className="w-3 h-3" />
            <span className="text-[11px]">{t('memo.newMemo')}</span>
          </button>
        </div>
      )}

      {/* 24시간 타임라인 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex relative bg-[var(--win10-bg)]">
        {/* 시간 라벨 열 */}
        <div className="w-16 border-r border-[var(--win10-border)] bg-[var(--win10-surface)] shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[56px] border-b border-[var(--win10-border)] pr-3 text-right text-xs text-[var(--win10-text-secondary)] flex items-start justify-end pt-1"
            >
              {hour === 0
                ? language === 'ko'
                  ? '자정'
                  : '12 AM'
                : hour === 12
                ? language === 'ko'
                  ? '정오'
                  : '12 PM'
                : `${hour}:00`}
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

          {/* 등록된 이벤트 블록 렌더링 */}
          {dayEvents.map((evt) => {
            const cat = categories.find((c) => c.id === evt.categoryId);
            const color = cat?.color || '#0078D7';

            const startHour = parseInt(evt.startDate.slice(11, 13) || '0', 10);
            const startMin = parseInt(evt.startDate.slice(14, 16) || '0', 10);
            const endHour = parseInt(evt.endDate.slice(11, 13) || '1', 10);
            const endMin = parseInt(evt.endDate.slice(14, 16) || '0', 10);

            const top = (startHour + startMin / 60) * 56;
            const duration = Math.max((endHour - startHour) * 60 + (endMin - startMin), 30);
            const height = (duration / 60) * 56;
            const displayTitle = getEventDisplayTitle(evt, language);

            return (
              <div
                key={evt.id}
                onClick={(e) => handleEventClick(e, evt)}
                className="absolute left-4 right-4 rounded px-3 py-1.5 text-xs border-l-4 shadow-md hover:brightness-110 cursor-pointer z-10 transition-all bg-[var(--win10-card-bg)] text-[var(--win10-text-primary)]"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height - 2, 28)}px`,
                  borderLeftColor: color,
                }}
              >
                <div className="font-semibold text-sm truncate">{displayTitle}</div>
                <div className="text-xs text-[var(--win10-text-secondary)]">
                  {evt.isAllDay ? t('calendar.allDay') : `${evt.startDate.slice(11, 16)} ~ ${evt.endDate.slice(11, 16)}`}
                  {evt.location && ` • ${evt.location}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
