import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Pin,
  Trash2,
  Calendar as CalIcon,
  Palette,
  Check,
  StickyNote,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { MEMO_COLORS } from '../../constants/memo';
import { formatDateKey } from '../../core/calendar';
import { MemoColor } from '../../types';
import { useTranslation } from '../../locales';

export const MemoPanel: React.FC = () => {
  const isMemoPanelOpen = useCalendarStore((s) => s.isMemoPanelOpen);
  const closeMemoPanel = useCalendarStore((s) => s.closeMemoPanel);
  const memos = useCalendarStore((s) => s.memos);
  const addMemo = useCalendarStore((s) => s.addMemo);
  const updateMemo = useCalendarStore((s) => s.updateMemo);
  const deleteMemo = useCalendarStore((s) => s.deleteMemo);
  const togglePinMemo = useCalendarStore((s) => s.togglePinMemo);
  const memoFilterDate = useCalendarStore((s) => s.memoFilterDate);
  const setMemoFilterDate = useCalendarStore((s) => s.setMemoFilterDate);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const settings = useCalendarStore((s) => s.settings);

  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'all' | 'date' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [activeDatePickerId, setActiveDatePickerId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // memoFilterDate가 변경되거나 전달된 경우 날짜 탭으로 자동 전환
  useEffect(() => {
    if (memoFilterDate) {
      setActiveTab('date');
    }
  }, [memoFilterDate]);

  const isLight =
    settings.themeMode === 'light' ||
    (settings.themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const selectedDateStr = formatDateKey(selectedDate);
  const targetDateStr = memoFilterDate || selectedDateStr;

  // 필터링 및 검색 적용
  const filteredMemos = useMemo(() => {
    return memos
      .filter((memo) => {
        // 1. 탭 필터링
        if (activeTab === 'date') {
          if (memo.date !== targetDateStr) return false;
        } else if (activeTab === 'pinned') {
          if (!memo.isPinned) return false;
        }

        // 2. 검색어 필터링
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = memo.title ? memo.title.toLowerCase().includes(q) : false;
          const matchContent = memo.content.toLowerCase().includes(q);
          const matchDate = memo.date ? memo.date.includes(q) : false;
          if (!matchTitle && !matchContent && !matchDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 핀 고정 우선, 그 다음 최신 수정일 내림차순
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [memos, activeTab, targetDateStr, searchQuery]);

  if (!isMemoPanelOpen) return null;

  const handleCreateMemo = (customColor: MemoColor = 'yellow') => {
    addMemo({
      title: '',
      content: '',
      color: customColor,
      isPinned: activeTab === 'pinned',
      date: activeTab === 'date' ? targetDateStr : undefined,
    });
    // 생성 후 검색어 초기화
    if (searchQuery) setSearchQuery('');
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return t('memo.justNow');
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('memo.minutesAgo', { m: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t('memo.hoursAgo', { h: diffHour });
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return t('memo.daysAgo', { d: diffDay });
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleDateClick = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y && m && d) {
      setSelectedDate(new Date(y, m - 1, d));
      setMemoFilterDate(dateStr);
      setActiveTab('date');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none bg-black/40 backdrop-blur-xs print:hidden animate-in fade-in duration-150">
      {/* 바깥 배경 클릭 시 패널 닫기 */}
      <div className="flex-1" onClick={closeMemoPanel} />

      {/* 우측 슬라이드인 스티커 메모 패널 */}
      <div className="w-[430px] max-w-full h-full bg-[var(--win10-sidebar)] border-l border-[var(--win10-border)] shadow-2xl flex flex-col text-[var(--win10-text-primary)] animate-in slide-in-from-right duration-200">
        {/* 1. 패널 상단 타이틀바 */}
        <div className="h-12 border-b border-[var(--win10-border)] px-4 flex items-center justify-between shrink-0 bg-[var(--win10-surface)]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-[var(--win10-accent)] text-white shadow-xs">
              <StickyNote className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">{t('memo.title')}</span>
            <span className="px-1.5 py-0.2 text-[10.5px] rounded-full bg-[var(--win10-card-bg)] border border-[var(--win10-border)] text-[var(--win10-text-secondary)] font-medium">
              {memos.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleCreateMemo('yellow')}
              className="px-2.5 py-1 bg-[var(--win10-accent)] hover:opacity-90 active:opacity-80 text-white rounded text-xs font-medium flex items-center space-x-1 shadow-xs transition-opacity cursor-pointer"
              title={t('memo.newMemo')}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('memo.newMemo')}</span>
            </button>
            <button
              onClick={closeMemoPanel}
              className="p-1.5 hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors cursor-pointer"
              title={t('header.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. 검색 및 탭 필터 바 */}
        <div className="p-3 border-b border-[var(--win10-border)] bg-[var(--win10-surface)] space-y-2.5 shrink-0">
          {/* 검색창 */}
          <div className="flex items-center px-2.5 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] rounded text-xs focus-within:border-[var(--win10-accent)] transition-colors">
            <Search className="w-3.5 h-3.5 text-[var(--win10-text-secondary)] mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('memo.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 탭 버튼들 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setActiveTab('all');
                setMemoFilterDate(null);
              }}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-[var(--win10-accent)] text-white shadow-xs font-semibold'
                  : 'text-[var(--win10-text-secondary)] hover:bg-[var(--win10-button-hover)] hover:text-[var(--win10-text-primary)]'
              }`}
            >
              {t('memo.filterAll')}
            </button>
            <button
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors truncate ${
                activeTab === 'date'
                  ? 'bg-[var(--win10-accent)] text-white shadow-xs font-semibold'
                  : 'text-[var(--win10-text-secondary)] hover:bg-[var(--win10-button-hover)] hover:text-[var(--win10-text-primary)]'
              }`}
              title={`${t('memo.filterSelectedDate')} (${targetDateStr})`}
            >
              📅 {targetDateStr.slice(5)}
            </button>
            <button
              onClick={() => setActiveTab('pinned')}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'pinned'
                  ? 'bg-[var(--win10-accent)] text-white shadow-xs font-semibold'
                  : 'text-[var(--win10-text-secondary)] hover:bg-[var(--win10-button-hover)] hover:text-[var(--win10-text-primary)]'
              }`}
            >
              📌 {t('memo.filterPinned')}
            </button>
          </div>
        </div>

        {/* 3. 메모 카드 목록 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredMemos.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--win10-input-bg)] border border-[var(--win10-border)] flex items-center justify-center text-[var(--win10-text-secondary)]">
                <StickyNote className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-[var(--win10-text-primary)]">
                  {t('memo.noMemos')}
                </div>
                <div className="text-[11px] text-[var(--win10-text-muted)] max-w-[220px]">
                  {t('memo.noMemosHint')}
                </div>
              </div>
              <button
                onClick={() => handleCreateMemo('yellow')}
                className="mt-2 px-3 py-1.5 bg-[var(--win10-accent)] hover:opacity-90 active:opacity-80 text-white rounded text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('memo.newMemo')}</span>
              </button>
            </div>
          ) : (
            filteredMemos.map((memo) => {
              const colorConfig =
                MEMO_COLORS.find((c) => c.id === memo.color) || MEMO_COLORS[0];
              const cardBg = isLight ? colorConfig.bgLight : colorConfig.bgDark;
              const cardBorder = isLight ? colorConfig.borderLight : colorConfig.borderDark;
              const cardText = isLight ? colorConfig.textLight : colorConfig.textDark;
              const headerBg = isLight ? colorConfig.headerLight : colorConfig.headerDark;

              const isConfirmingDelete = confirmDeleteId === memo.id;
              const isColorPickerOpen = activeColorPickerId === memo.id;
              const isDatePickerOpen = activeDatePickerId === memo.id;

              return (
                <div
                  key={memo.id}
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: cardText,
                  }}
                  className="rounded-md border shadow-sm transition-all duration-150 flex flex-col overflow-hidden relative group/card"
                >
                  {/* 상단 툴바 / 헤더 */}
                  <div
                    style={{ backgroundColor: headerBg }}
                    className="px-2.5 py-1.5 flex items-center justify-between border-b text-xs transition-colors shrink-0"
                  >
                    {/* 좌측: 고정 버튼 및 날짜 뱃지 */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => togglePinMemo(memo.id)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          memo.isPinned
                            ? 'text-[var(--win10-accent)] bg-black/10'
                            : 'opacity-60 hover:opacity-100 hover:bg-black/10'
                        }`}
                        title={memo.isPinned ? t('memo.unpin') : t('memo.pin')}
                      >
                        <Pin className={`w-3.5 h-3.5 ${memo.isPinned ? 'fill-current' : ''}`} />
                      </button>

                      {/* 날짜 선택 / 연결 */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setActiveDatePickerId(isDatePickerOpen ? null : memo.id);
                            setActiveColorPickerId(null);
                          }}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            memo.date ? 'bg-black/10 hover:bg-black/20' : 'opacity-60 hover:opacity-100 hover:bg-black/10'
                          }`}
                          title={memo.date ? `${memo.date} (${t('memo.linkDate')})` : t('memo.linkDate')}
                        >
                          <CalIcon className="w-3 h-3" />
                          <span>{memo.date ? memo.date.slice(5) : '+ ' + t('memo.linkDate')}</span>
                        </button>

                        {/* 날짜 피커 팝오버 */}
                        {isDatePickerOpen && (
                          <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-[var(--win10-card-bg)] border border-[var(--win10-border)] rounded shadow-xl text-xs space-y-2 w-48 text-[var(--win10-text-primary)]">
                            <div className="font-semibold text-[11px] text-[var(--win10-text-secondary)]">
                              {t('memo.linkDate')}
                            </div>
                            <input
                              type="date"
                              value={memo.date || ''}
                              onChange={(e) => {
                                updateMemo({ id: memo.id, date: e.target.value || undefined });
                                setActiveDatePickerId(null);
                              }}
                              className="w-full px-2 py-1 text-xs bg-[var(--win10-input-bg)] border border-[var(--win10-border)] rounded text-[var(--win10-text-primary)] outline-none"
                            />
                            <div className="flex items-center space-x-1 pt-1">
                              <button
                                onClick={() => {
                                  updateMemo({ id: memo.id, date: targetDateStr });
                                  setActiveDatePickerId(null);
                                }}
                                className="flex-1 py-1 px-1.5 bg-[var(--win10-accent)] text-white rounded text-[10.5px] font-medium"
                              >
                                {t('memo.setDate', { date: targetDateStr.slice(5) })}
                              </button>
                              {memo.date && (
                                <button
                                  onClick={() => {
                                    updateMemo({ id: memo.id, date: undefined });
                                    setActiveDatePickerId(null);
                                  }}
                                  className="py-1 px-2 bg-[var(--win10-button-hover)] text-[var(--win10-text-secondary)] rounded text-[10.5px]"
                                >
                                  {t('memo.unlinkDate')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 우측: 컬러 팔레트 선택 및 삭제 */}
                    <div className="flex items-center space-x-1">
                      {/* 컬러 선택기 */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setActiveColorPickerId(isColorPickerOpen ? null : memo.id);
                            setActiveDatePickerId(null);
                          }}
                          className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer"
                          title={t('memo.changeColor')}
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>

                        {/* 컬러 팔레트 칩 팝오버 */}
                        {isColorPickerOpen && (
                          <div className="absolute top-full right-0 mt-1 z-30 p-2 bg-[var(--win10-card-bg)] border border-[var(--win10-border)] rounded shadow-xl flex items-center space-x-1.5">
                            {MEMO_COLORS.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  updateMemo({ id: memo.id, color: c.id });
                                  setActiveColorPickerId(null);
                                }}
                                style={{ backgroundColor: c.accent }}
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                                title={language === 'ko' ? c.nameKo : c.nameEn}
                              >
                                {memo.color === c.id && (
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 삭제 버튼 */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center space-x-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10.5px] font-medium shadow-xs animate-in fade-in">
                          <button
                            onClick={() => {
                              deleteMemo(memo.id);
                              setConfirmDeleteId(null);
                            }}
                            className="hover:underline font-bold"
                          >
                            {t('common.delete')}
                          </button>
                          <span>/</span>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="hover:underline"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(memo.id)}
                          className="p-1 rounded opacity-60 hover:opacity-100 hover:text-red-500 hover:bg-black/10 transition-colors cursor-pointer"
                          title={t('memo.deleteMemo')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 본문: 제목 입력 및 텍스트에리어 */}
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      placeholder={t('memo.titlePlaceholder')}
                      value={memo.title || ''}
                      onChange={(e) => updateMemo({ id: memo.id, title: e.target.value })}
                      style={{ color: cardText }}
                      className="w-full font-bold text-xs bg-transparent border-none outline-none placeholder:opacity-50"
                    />

                    <textarea
                      placeholder={t('memo.contentPlaceholder')}
                      value={memo.content}
                      onChange={(e) => updateMemo({ id: memo.id, content: e.target.value })}
                      style={{ color: cardText }}
                      rows={Math.max(2, Math.min(memo.content.split('\n').length, 10))}
                      className="w-full text-xs bg-transparent border-none outline-none resize-none placeholder:opacity-40 leading-relaxed font-sans"
                    />
                  </div>

                  {/* 하단 정보 바 */}
                  <div
                    style={{ color: cardText }}
                    className="px-3 py-1.5 flex items-center justify-between text-[10.5px] opacity-60 border-t border-black/5 shrink-0"
                  >
                    <div className="flex items-center space-x-2">
                      {memo.date ? (
                        <button
                          onClick={() => handleDateClick(memo.date!)}
                          className="hover:underline font-medium flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>📅 {memo.date}</span>
                        </button>
                      ) : (
                        <span>{t('memo.freeMemo')}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(memo.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. 패널 하단 빠른 액션 바 */}
        <div className="p-3 border-t border-[var(--win10-border)] bg-[var(--win10-surface)] flex items-center justify-between text-xs text-[var(--win10-text-secondary)] shrink-0">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--win10-accent)]" />
            <span className="text-[11px]">
              {t('memo.memoCount', { count: filteredMemos.length })}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {MEMO_COLORS.slice(0, 5).map((colorOpt) => (
              <button
                key={colorOpt.id}
                onClick={() => handleCreateMemo(colorOpt.id)}
                style={{ backgroundColor: colorOpt.accent }}
                className="w-4 h-4 rounded-full hover:scale-125 transition-transform shadow-xs cursor-pointer"
                title={`+ ${language === 'ko' ? colorOpt.nameKo : colorOpt.nameEn} ${language === 'ko' ? '메모' : 'Note'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
