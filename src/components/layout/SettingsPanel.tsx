import React, { useRef } from 'react';
import {
  X,
  Palette,
  Calendar as CalIcon,
  Download,
  Upload,
  Check,
  CloudSun,
  FileText,
  Moon,
  Image as ImageIcon,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { WIN10_ACCENT_COLORS, FIRST_DAY_OPTIONS, THEME_MODES, BACKGROUND_FILL_OPTIONS } from '../../constants/settings';
import { WALLPAPER_THEMES, THEME_PRESETS } from '../../constants/theme';
import { ThemePreset } from '../../types';
import { useTranslation, SUPPORTED_LANGUAGES } from '../../locales';

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useCalendarStore((s) => s.isSettingsOpen);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const settings = useCalendarStore((s) => s.settings);
  const updateSettings = useCalendarStore((s) => s.updateSettings);
  const applyThemePreset = useCalendarStore((s) => s.applyThemePreset);
  const exportDataJSON = useCalendarStore((s) => s.exportDataJSON);
  const importDataJSON = useCalendarStore((s) => s.importDataJSON);
  const exportEventsToICSFile = useCalendarStore((s) => s.exportEventsToICSFile);
  const importEventsFromICS = useCalendarStore((s) => s.importEventsFromICS);

  const { t, language, setLanguage } = useTranslation();

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const icsFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  // JSON 백업 다운로드
  const handleExportJSON = () => {
    const json = exportDataJSON();
    downloadFile(json, `win10_calendar_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // iCal(.ics) 내보내기
  const handleExportICS = () => {
    const ics = exportEventsToICSFile();
    downloadFile(ics, `win10_calendar_events_${new Date().toISOString().slice(0, 10)}.ics`, 'text/calendar');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 복원
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDataJSON(content)) {
        alert(t('settings.backupSuccess'));
      } else {
        alert(t('settings.backupFail'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // iCal 가져오기
  const handleImportICS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const count = importEventsFromICS(content);
        if (count > 0) {
          alert(t('settings.icsImportSuccess', { count }));
        } else {
          alert(t('settings.icsImportFail'));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 사용자 지정 배경 이미지 업로드
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSettings({
          backgroundTheme: dataUrl,
          backgroundFill: settings.backgroundFill === 'none' ? 'sidebar' : settings.backgroundFill,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none bg-black/40 backdrop-blur-xs print:hidden">
      {/* 바깥 배경 클릭 시 닫기 */}
      <div className="flex-1" onClick={toggleSettings} />

      {/* 우측 슬라이드인 패널 */}
      <div className="w-[400px] h-full bg-[var(--win10-sidebar)] border-l border-[var(--win10-border)] shadow-2xl flex flex-col text-[var(--win10-text-primary)] animate-in slide-in-from-right duration-200">
        {/* 헤더 */}
        <div className="h-12 border-b border-[var(--win10-border)] px-4 flex items-center justify-between">
          <span className="font-semibold text-sm">{t('settings.title')}</span>
          <button
            onClick={toggleSettings}
            className="p-1.5 hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors"
            title={t('header.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 설정 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* 1. 언어 선택 (Language) */}
          <div className="space-y-2.5 pb-2">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <Globe className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.language')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`py-2 px-3 rounded-sm border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[var(--win10-accent)] bg-[var(--win10-accent)] text-white font-medium shadow-xs'
                        : 'border-[var(--win10-border)] bg-[var(--win10-card-bg)] text-[var(--win10-text-primary)] hover:bg-[var(--win10-button-hover)]'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 원클릭 완성형 멀티 테마 프리셋 */}
          <div className="space-y-2.5 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.themePresets')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((preset: ThemePreset) => {
                const isActive =
                  settings.themeMode === preset.themeMode &&
                  settings.accentColor.toLowerCase() === preset.accentColor.toLowerCase() &&
                  settings.backgroundTheme === preset.backgroundTheme;

                return (
                  <button
                    key={preset.id}
                    onClick={() => applyThemePreset(preset)}
                    className={`p-2.5 rounded-sm border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                      isActive
                        ? 'border-[var(--win10-accent)] ring-1 ring-[var(--win10-accent)] bg-[var(--win10-cell-hover)]'
                        : 'border-[var(--win10-border)] bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-black/20"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                        <span className="font-semibold text-[11px] truncate">{preset.name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[var(--win10-accent)] stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-[var(--win10-text-secondary)] line-clamp-2 leading-tight">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 테마 모드 (Dark, Light, System) */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <span className="font-medium text-[13px] text-[var(--win10-text-primary)] block">
              {t('settings.themeMode')}
            </span>
            <div className="space-y-1.5">
              {THEME_MODES.map((mode) => {
                const label =
                  mode.id === 'dark'
                    ? t('settings.themeDark')
                    : mode.id === 'light'
                    ? t('settings.themeLight')
                    : t('settings.themeSystem');
                return (
                  <label
                    key={mode.id}
                    className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-[var(--win10-button-hover)] cursor-pointer text-[var(--win10-text-primary)] transition-colors"
                  >
                    <input
                      type="radio"
                      name="themeMode"
                      checked={settings.themeMode === mode.id}
                      onChange={() => updateSettings({ themeMode: mode.id })}
                      className="accent-[var(--win10-accent)]"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. 시스템 강조 색상 (12가지 Accent Colors) */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <Palette className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.accentColor')}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {WIN10_ACCENT_COLORS.map((accent) => {
                const isSelected = settings.accentColor.toLowerCase() === accent.color.toLowerCase();
                return (
                  <button
                    key={accent.id}
                    onClick={() => updateSettings({ accentColor: accent.color })}
                    className="h-9 rounded-sm relative flex items-center justify-center border transition-transform hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: accent.color,
                      borderColor: isSelected ? '#ffffff' : 'transparent',
                    }}
                    title={accent.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3] drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 캘린더 배경 테마 (Windows 10 시그니처 개인 설정) */}
          <div className="space-y-3 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <ImageIcon className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.wallpaper')}</span>
            </div>

            {/* 배경 채우기 위치 */}
            <div className="space-y-1">
              <span className="text-[11px] text-[var(--win10-text-secondary)] block">
                {t('settings.wallpaperFill')}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BACKGROUND_FILL_OPTIONS.map((fill) => {
                  const fillLabel =
                    fill.id === 'sidebar'
                      ? t('settings.wallpaperFillSidebar')
                      : fill.id === 'window'
                      ? t('settings.wallpaperFillWindow')
                      : t('settings.wallpaperFillNone');
                  return (
                    <button
                      key={fill.id}
                      onClick={() => updateSettings({ backgroundFill: fill.id })}
                      className={`py-1 px-1.5 rounded-sm border text-[10.5px] text-center transition-all ${
                        settings.backgroundFill === fill.id
                          ? 'border-[var(--win10-accent)] bg-[var(--win10-accent)] text-white font-medium'
                          : 'border-[var(--win10-border)] bg-[var(--win10-card-bg)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)]'
                      }`}
                    >
                      {fillLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 배경 프리셋 타일 목록 */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {WALLPAPER_THEMES.map((wp) => {
                const isSelected = settings.backgroundTheme === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() =>
                      updateSettings({
                        backgroundTheme: wp.id,
                        backgroundFill: settings.backgroundFill === 'none' ? 'sidebar' : settings.backgroundFill,
                      })
                    }
                    className="h-14 rounded-sm border relative overflow-hidden flex flex-col justify-end p-1 text-left transition-all hover:scale-105 active:scale-95 group shadow-xs"
                    style={{
                      background: wp.cssBackground === 'none' ? 'var(--win10-cell-other)' : wp.cssBackground,
                      borderColor: isSelected ? 'var(--win10-accent)' : 'var(--win10-border)',
                      boxShadow: isSelected ? '0 0 0 1px var(--win10-accent)' : 'none',
                    }}
                    title={wp.name}
                  >
                    <span className="text-[9.5px] text-white font-medium drop-shadow-md truncate z-10">
                      {wp.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-[var(--win10-accent)] rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 사용자 정의 이미지 업로드 버튼 */}
            <div className="pt-1 flex space-x-2">
              <button
                onClick={() => imageFileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] border border-[var(--win10-border)] rounded text-[var(--win10-text-primary)] transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('settings.uploadImage')}</span>
              </button>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomImageUpload}
                className="hidden"
              />
            </div>

            {/* 배경 불투명도 조절 슬라이더 */}
            {settings.backgroundTheme !== 'none' && settings.backgroundFill !== 'none' && (
              <div className="space-y-1 pt-1 bg-[var(--win10-card-bg)] p-2.5 rounded border border-[var(--win10-border)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--win10-text-secondary)]">
                  <span>{t('settings.opacity')}</span>
                  <span>{Math.round((settings.backgroundOpacity ?? 0.35) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.05"
                  value={settings.backgroundOpacity ?? 0.35}
                  onChange={(e) => updateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--win10-accent)] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 6. 날씨 설정 (Windows 10 UWP 시그니처) */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <CloudSun className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.weather')}</span>
            </div>
            <label className="flex items-center space-x-2 p-1 rounded hover:bg-[var(--win10-button-hover)] cursor-pointer text-[var(--win10-text-primary)]">
              <input
                type="checkbox"
                checked={settings.showWeather}
                onChange={(e) => updateSettings({ showWeather: e.target.checked })}
                className="accent-[var(--win10-accent)]"
              />
              <span>{t('settings.showWeather')}</span>
            </label>
            {settings.showWeather && (
              <div className="flex items-center space-x-3 pl-6 pt-1">
                <span className="text-[var(--win10-text-secondary)]">{t('settings.tempUnit')}</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tempUnit"
                    checked={settings.temperatureUnit === 'C'}
                    onChange={() => updateSettings({ temperatureUnit: 'C' })}
                    className="accent-[var(--win10-accent)]"
                  />
                  <span>{t('settings.celsius')}</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tempUnit"
                    checked={settings.temperatureUnit === 'F'}
                    onChange={() => updateSettings({ temperatureUnit: 'F' })}
                    className="accent-[var(--win10-accent)]"
                  />
                  <span>{t('settings.fahrenheit')}</span>
                </label>
              </div>
            )}
          </div>

          {/* 7. 대체 캘린더 (음력) 및 첫째 날 설정 */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <CalIcon className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.lunar')}</span>
            </div>
            <label className="flex items-center space-x-2 p-1 rounded hover:bg-[var(--win10-button-hover)] cursor-pointer text-[var(--win10-text-primary)]">
              <input
                type="checkbox"
                checked={settings.showLunarCalendar}
                onChange={(e) => updateSettings({ showLunarCalendar: e.target.checked })}
                className="accent-[var(--win10-accent)]"
              />
              <Moon className="w-3.5 h-3.5 text-[var(--win10-text-secondary)]" />
              <span>{t('settings.showLunar')}</span>
            </label>

            <div className="pt-1">
              <span className="text-[var(--win10-text-secondary)] block mb-1">
                {t('settings.firstDayOfWeek')}
              </span>
              <div className="flex space-x-4">
                {FIRST_DAY_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center space-x-1.5 cursor-pointer text-[var(--win10-text-primary)]">
                    <input
                      type="radio"
                      name="firstDayOfWeek"
                      checked={settings.firstDayOfWeek === opt.id}
                      onChange={() => updateSettings({ firstDayOfWeek: opt.id as 0 | 1 })}
                      className="accent-[var(--win10-accent)]"
                    />
                    <span>{opt.id === 0 ? t('settings.sunday') : t('settings.monday')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 8. iCalendar (.ics) 연동 및 JSON 백업 */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <FileText className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.dataSync')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportICS}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-primary)] transition-colors border border-[var(--win10-border)]"
                title={t('settings.saveIcsTitle')}
              >
                <Download className="w-3 h-3" />
                <span>{t('settings.saveIcs')}</span>
              </button>

              <button
                onClick={() => icsFileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-primary)] transition-colors border border-[var(--win10-border)]"
                title={t('settings.openIcsTitle')}
              >
                <Upload className="w-3 h-3" />
                <span>{t('settings.openIcs')}</span>
              </button>
              <input
                ref={icsFileInputRef}
                type="file"
                accept=".ics"
                onChange={handleImportICS}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors border border-[var(--win10-border)]"
              >
                <Download className="w-3 h-3" />
                <span>{t('settings.backupJson')}</span>
              </button>

              <button
                onClick={() => jsonFileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] rounded text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors border border-[var(--win10-border)]"
              >
                <Upload className="w-3 h-3" />
                <span>{t('settings.restoreJson')}</span>
              </button>
              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* 버전 및 정보 */}
        <div className="p-3 border-t border-[var(--win10-border)] bg-[var(--win10-surface)] text-[11px] text-[var(--win10-text-secondary)] text-center">
          {t('settings.appInfo')}
        </div>
      </div>
    </div>
  );
};
