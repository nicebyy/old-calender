import React, { useRef, useEffect } from 'react';
import { Search, X, Calendar as CalIcon, MapPin, Clock, StickyNote, Pin } from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { searchEvents } from '../../core/recurrence';
import { CalendarEvent, CalendarMemo } from '../../types';
import { MEMO_COLORS } from '../../constants/memo';
import { useTranslation } from '../../locales';

export const SearchOverlay: React.FC = () => {
  const isSearchOpen = useCalendarStore((s) => s.isSearchOpen);
  const toggleSearch = useCalendarStore((s) => s.toggleSearch);
  const searchQuery = useCalendarStore((s) => s.searchQuery);
  const setSearchQuery = useCalendarStore((s) => s.setSearchQuery);
  const events = useCalendarStore((s) => s.events);
  const categories = useCalendarStore((s) => s.categories);
  const memos = useCalendarStore((s) => s.memos);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const openMemoPanel = useCalendarStore((s) => s.openMemoPanel);

  const { t, language } = useTranslation();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const eventResults = searchEvents(events, searchQuery);
  const memoResults = searchQuery.trim()
    ? memos.filter((memo) => {
        const q = searchQuery.toLowerCase();
        return (
          (memo.title && memo.title.toLowerCase().includes(q)) ||
          memo.content.toLowerCase().includes(q) ||
          (memo.date && memo.date.includes(q))
        );
      })
    : [];

  const handleSelectEvent = (event: CalendarEvent) => {
    const eventDate = new Date(event.startDate);
    setSelectedDate(eventDate);
    openEventModal(event);
    toggleSearch();
  };

  const handleSelectMemo = (memo: CalendarMemo) => {
    if (memo.date) {
      const [y, m, d] = memo.date.split('-').map(Number);
      if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
    }
    openMemoPanel(memo.date);
    toggleSearch();
  };

  const emptyHint =
    language === 'ko'
      ? '검색어를 입력하시면 일정 및 메모를 실시간으로 찾아드립니다.'
      : 'Type to search scheduled events and sticky notes in real-time.';

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-16 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-[520px] bg-[#292929] border border-[#444444] rounded shadow-2xl overflow-hidden text-white flex flex-col max-h-[500px]">
        {/* 검색 인풋 바 */}
        <div className="h-12 border-b border-[#383838] px-3 flex items-center space-x-2 bg-[#222222]">
          <Search className="w-4 h-4 text-[#888888] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[#888888]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:text-white text-[#888888]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={toggleSearch}
            className="px-2 py-1 text-xs text-[#aaaaaa] hover:text-white rounded hover:bg-[#333333]"
          >
            {t('common.close')}
          </button>
        </div>

        {/* 검색 결과 목록 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {searchQuery.trim() === '' ? (
            <div className="py-8 text-center text-xs text-[#777777]">
              {emptyHint}
            </div>
          ) : eventResults.length === 0 && memoResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#777777]">
              {t('search.noResults')}
            </div>
          ) : (
            <>
              {/* 1. 일정 검색 결과 */}
              {eventResults.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-0.5 text-[10.5px] font-semibold text-[#888888] uppercase tracking-wider flex items-center justify-between">
                    <span>일정 ({eventResults.length})</span>
                  </div>
                  {eventResults.map((evt) => {
                    const cat = categories.find((c) => c.id === evt.categoryId);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleSelectEvent(evt)}
                        className="p-2.5 rounded hover:bg-[#333333] cursor-pointer transition-colors border-l-3 space-y-1"
                        style={{ borderLeftColor: cat?.color || '#0078D7' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-white">{evt.title}</span>
                          <span className="text-[10px] text-[#aaaaaa]">
                            {cat?.name || t('calendar.allDay')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-[#888888]">
                          <div className="flex items-center space-x-1">
                            <CalIcon className="w-3 h-3" />
                            <span>{evt.startDate.slice(0, 10)}</span>
                          </div>
                          {!evt.isAllDay && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {evt.startDate.slice(11, 16)} ~ {evt.endDate.slice(11, 16)}
                              </span>
                            </div>
                          )}
                          {evt.location && (
                            <div className="flex items-center space-x-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{evt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. 메모 검색 결과 */}
              {memoResults.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-[#383838]">
                  <div className="px-2 py-0.5 text-[10.5px] font-semibold text-[#888888] uppercase tracking-wider flex items-center justify-between">
                    <span>스티커 메모 ({memoResults.length})</span>
                  </div>
                  {memoResults.map((memo) => {
                    const colorOpt = MEMO_COLORS.find((c) => c.id === memo.color) || MEMO_COLORS[0];
                    return (
                      <div
                        key={memo.id}
                        onClick={() => handleSelectMemo(memo)}
                        className="p-2.5 rounded hover:bg-[#333333] cursor-pointer transition-colors border-l-3 space-y-1"
                        style={{ borderLeftColor: colorOpt.accent }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-medium text-xs text-white">
                            <StickyNote className="w-3 h-3 text-[#ffb900]" />
                            <span>{memo.title || '제목 없음'}</span>
                            {memo.isPinned && <Pin className="w-2.5 h-2.5 fill-current text-[var(--win10-accent)]" />}
                          </div>
                          {memo.date && (
                            <span className="text-[10px] text-[#aaaaaa]">
                              📅 {memo.date}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#bbbbbb] line-clamp-2 leading-relaxed">
                          {memo.content || '(내용 없음)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
