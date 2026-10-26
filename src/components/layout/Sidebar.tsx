import React, { useState } from 'react';
import {
  Plus,
  Settings,
  Mail,
  Users,
  CheckSquare,
  Check,
  FolderPlus,
  Cloud,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { MiniCalendar } from '../sidebar/MiniCalendar';
import { WALLPAPER_THEMES } from '../../constants/theme';
import { useTranslation } from '../../locales';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useCalendarStore((s) => s.isSidebarOpen);
  const categories = useCalendarStore((s) => s.categories);
  const toggleCategory = useCalendarStore((s) => s.toggleCategoryVisibility);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const addCategory = useCalendarStore((s) => s.addCategory);
  const openAccountModal = useCalendarStore((s) => s.openAccountModal);
  const settings = useCalendarStore((s) => s.settings);

  const { t, language } = useTranslation();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0078D7');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const activeWallpaper = WALLPAPER_THEMES.find((w) => w.id === settings.backgroundTheme);
  const isCustomImage = settings.backgroundTheme && settings.backgroundTheme !== 'none' && !activeWallpaper;
  const wallpaperStyle = activeWallpaper
    ? activeWallpaper.cssBackground
    : isCustomImage
    ? `url(${settings.backgroundTheme}) center / cover no-repeat`
    : 'none';

  const getCategoryDisplayName = (id: string, name: string) => {
    if (language === 'en') {
      if (id === 'default-personal') return 'Personal';
      if (id === 'default-work') return 'Work';
      if (id === 'default-holiday') return 'Holidays';
      if (id === 'default-birthday') return 'Birthdays';
    }
    return name;
  };

  return (
    <aside
      className={`h-full bg-[var(--win10-sidebar)] border-r border-[var(--win10-border)] text-[var(--win10-text-primary)] flex flex-col justify-between transition-all duration-150 ease-out select-none overflow-hidden z-20 print:hidden relative ${
        isSidebarOpen ? 'w-[250px]' : 'w-0 border-r-0'
      }`}
    >
      {/* 사이드바 배경 채우기 레이어 */}
      {settings.backgroundFill === 'sidebar' && wallpaperStyle !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
          style={{
            background: wallpaperStyle,
            opacity: settings.backgroundOpacity ?? 0.35,
          }}
        />
      )}

      {/* 사이드바 상단 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 relative z-10">
        {/* 새 이벤트 버튼 */}
        <button
          onClick={() => openEventModal()}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[var(--win10-accent)] hover:opacity-90 active:opacity-80 text-white font-medium text-[13px] rounded transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('sidebar.newEvent')}</span>
        </button>

        {/* 미니 캘린더 피커 */}
        <div className="pt-1">
          <MiniCalendar />
        </div>

        {/* 내 캘린더 범주 목록 */}
        <div className="pt-2 border-t border-[var(--win10-border)]">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[12px] font-semibold text-[var(--win10-text-secondary)]">
              {t('sidebar.myCalendars')}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={openAccountModal}
                className="text-[var(--win10-text-secondary)] hover:text-[var(--win10-accent)] p-0.5 rounded hover:bg-[var(--win10-button-hover)] transition-colors"
                title={t('sidebar.cloudAccounts')}
              >
                <Cloud className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] p-0.5 rounded hover:bg-[var(--win10-button-hover)] transition-colors"
                title={t('sidebar.addCategory')}
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 새 캘린더 추가 인라인 폼 */}
          {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="mb-2 p-2 bg-[var(--win10-card-bg)] rounded border border-[var(--win10-border)] space-y-2">
              <input
                type="text"
                autoFocus
                placeholder={t('sidebar.categoryNamePlaceholder')}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-[var(--win10-input-bg)] border border-[var(--win10-border)] rounded text-[var(--win10-text-primary)] outline-none focus:border-[var(--win10-accent)]"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
                <button
                  type="submit"
                  className="flex-1 py-1 px-2 text-[11px] bg-[var(--win10-accent)] hover:opacity-90 rounded text-white font-medium"
                >
                  {t('sidebar.add')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="py-1 px-2 text-[11px] bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-secondary)]"
                >
                  {t('sidebar.cancel')}
                </button>
              </div>
            </form>
          )}

          {/* 캘린더 리스트 */}
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className="flex items-center space-x-2.5 px-2 py-1.5 rounded hover:bg-[var(--win10-button-hover)] cursor-pointer text-xs text-[var(--win10-text-primary)] transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-sm flex items-center justify-center border transition-all"
                  style={{
                    backgroundColor: category.isVisible ? category.color : 'transparent',
                    borderColor: category.color,
                  }}
                >
                  {category.isVisible && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span className="font-normal truncate">
                  {getCategoryDisplayName(category.id, category.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 사이드바 최하단: 윈도우 10 메일/피플/할일/설정 숏컷 바 */}
      <div className="h-10 border-t border-[var(--win10-border)] bg-[var(--win10-sidebar-bottom)] flex items-center justify-between px-3 text-[var(--win10-text-secondary)] relative z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={openAccountModal}
            className="p-1 hover:text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)] rounded transition-colors"
            title={t('sidebar.mail')}
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={openAccountModal}
            className="p-1 hover:text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)] rounded transition-colors"
            title={t('sidebar.people')}
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)] rounded transition-colors"
            title={t('sidebar.todo')}
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={toggleSettings}
          className="p-1 hover:text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)] rounded transition-colors"
          title={t('header.settings')}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
