import React, { useRef, useState } from 'react';
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
  MapPin,
  Navigation,
  RotateCw,
  Search,
  Loader2,
  RefreshCw,
  ArrowDownCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { WIN10_ACCENT_COLORS, FIRST_DAY_OPTIONS, THEME_MODES, BACKGROUND_FILL_OPTIONS } from '../../constants/settings';
import { WALLPAPER_THEMES, THEME_PRESETS } from '../../constants/theme';
import { WEATHER_CITY_PRESETS } from '../../constants/weather';
import { searchLocations, LocationSearchResult } from '../../core/weather';
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
  const autoDetectLocation = useCalendarStore((s) => s.autoDetectLocation);
  const setWeatherLocation = useCalendarStore((s) => s.setWeatherLocation);
  const refreshWeather = useCalendarStore((s) => s.refreshWeather);
  const isWeatherLoading = useCalendarStore((s) => s.isWeatherLoading);
  const updateStatus = useCalendarStore((s) => s.updateStatus);
  const checkForUpdates = useCalendarStore((s) => s.checkForUpdates);
  const quitAndInstallUpdate = useCalendarStore((s) => s.quitAndInstallUpdate);

  const { t, language, setLanguage } = useTranslation();

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const icsFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQueryLocal] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLocationSearch = (query: string) => {
    setSearchQueryLocal(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    setIsSearchDropdownOpen(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(query, language);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    setWeatherLocation({
      city: result.city,
      latitude: result.latitude,
      longitude: result.longitude,
      autoDetect: false,
    });
    setSearchQueryLocal('');
    setSearchResults([]);
    setIsSearchDropdownOpen(false);
  };

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
              <div className="space-y-3 pl-6 pt-1">
                {/* 온도 단위 선택 */}
                <div className="flex items-center space-x-3">
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

                {/* 현재 설정된 위치 상태 표시 배지 */}
                <div className="p-2.5 rounded bg-[var(--win10-card-bg)] border border-[var(--win10-border)] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[var(--win10-accent)] shrink-0" />
                    <div>
                      <div className="font-semibold text-[var(--win10-text-primary)] flex items-center space-x-1.5">
                        <span>{settings.weatherLocation?.city || '서울'}</span>
                        {settings.weatherLocation?.autoDetect && (
                          <span className="px-1.5 py-0.5 bg-[var(--win10-accent)]/20 text-[var(--win10-accent)] text-[10px] rounded font-medium">
                            GPS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--win10-text-muted)]">
                        {(settings.weatherLocation?.latitude ?? 37.56).toFixed(2)}°N, {(settings.weatherLocation?.longitude ?? 126.98).toFixed(2)}°E
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => refreshWeather()}
                    disabled={isWeatherLoading}
                    className="p-1.5 rounded hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-text-primary)] transition-colors"
                    title={t('settings.refreshWeather')}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-[var(--win10-accent)]' : ''}`} />
                  </button>
                </div>

                {/* 위치 선택 컨트롤: GPS 자동 감지 버튼, 동네 직접 검색, 프리셋 드롭다운 */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => autoDetectLocation()}
                    disabled={isWeatherLoading}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 text-xs bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] border border-[var(--win10-border)] text-[var(--win10-text-primary)] rounded transition-colors disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-[var(--win10-accent)] ${isWeatherLoading ? 'animate-pulse' : ''}`} />
                    <span>{isWeatherLoading ? t('settings.detectingLocation') : t('settings.autoDetectLocation')}</span>
                  </button>

                  {/* 지역 및 동네 직접 검색 입력창 */}
                  <div className="relative space-y-1">
                    <label className="block text-[11px] text-[var(--win10-text-secondary)]">
                      {t('settings.searchLocationTitle')}
                    </label>
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-2 text-[var(--win10-text-muted)] pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setIsSearchDropdownOpen(true); }}
                        placeholder={t('settings.searchLocationPlaceholder')}
                        className="w-full text-xs pl-7 pr-7 py-1.5 rounded bg-[var(--win10-input-bg)] border border-[var(--win10-border)] text-[var(--win10-text-primary)] focus:outline-none focus:border-[var(--win10-accent)]"
                      />
                      {isSearchingLocation && (
                        <Loader2 className="w-3.5 h-3.5 absolute right-2 text-[var(--win10-accent)] animate-spin" />
                      )}
                    </div>

                    {/* 검색 결과 드롭다운 */}
                    {isSearchDropdownOpen && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-[var(--win10-bg)] border border-[var(--win10-border)] rounded shadow-lg">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSearchResult(item)}
                            className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-primary)] flex items-center justify-between border-b border-[var(--win10-border)]/50 last:border-b-0 cursor-pointer"
                          >
                            <span className="truncate font-medium">{item.displayName}</span>
                            <span className="text-[10px] text-[var(--win10-text-muted)] shrink-0 ml-2">
                              {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 도시/지역 프리셋 선택 */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[var(--win10-text-secondary)]">
                      {t('settings.selectCity')}
                    </label>
                    <select
                      value={
                        WEATHER_CITY_PRESETS.find(
                          (p) => p.nameKo === settings.weatherLocation?.city || p.nameEn === settings.weatherLocation?.city
                        )?.id || ''
                      }
                      onChange={(e) => {
                        const preset = WEATHER_CITY_PRESETS.find((p) => p.id === e.target.value);
                        if (preset) {
                          setWeatherLocation({
                            city: language === 'ko' ? preset.nameKo : preset.nameEn,
                            latitude: preset.latitude,
                            longitude: preset.longitude,
                            autoDetect: false,
                          });
                        }
                      }}
                      className="w-full text-xs p-1.5 rounded bg-[var(--win10-input-bg)] border border-[var(--win10-border)] text-[var(--win10-text-primary)] focus:outline-none focus:border-[var(--win10-accent)]"
                    >
                      <option value="" disabled>
                        {t('settings.selectCity')}
                      </option>
                      <optgroup label={language === 'ko' ? '특별시 / 광역시 / 특별자치시' : 'Metropolitan Cities'}>
                        {WEATHER_CITY_PRESETS.slice(0, 9).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '경상북도 / 대구경북' : 'Gyeongsangbuk-do'}>
                        {WEATHER_CITY_PRESETS.slice(9, 15).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '경상남도 / 부산경남' : 'Gyeongsangnam-do'}>
                        {WEATHER_CITY_PRESETS.slice(15, 19).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '경기도 (수도권)' : 'Gyeonggi-do'}>
                        {WEATHER_CITY_PRESETS.slice(19, 27).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '강원 / 충청 / 전라 / 제주' : 'Gangwon, Chungcheong, Jeolla, Jeju'}>
                        {WEATHER_CITY_PRESETS.slice(27, 40).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'ko' ? '해외 주요 거점' : 'Global Cities'}>
                        {WEATHER_CITY_PRESETS.slice(40).map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {language === 'ko' ? preset.nameKo : preset.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
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

          {/* 소프트웨어 자동 업데이트 (Auto-Update) */}
          <div className="space-y-2 pt-3 border-t border-[var(--win10-border)]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[var(--win10-text-primary)]">
              <RefreshCw className="w-4 h-4 text-[var(--win10-accent)]" />
              <span>{t('settings.softwareUpdate')}</span>
            </div>

            <div className="bg-[var(--win10-card-bg)] border border-[var(--win10-border)] rounded p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--win10-text-secondary)]">
                <span>{t('settings.currentVersion')}</span>
                <span className="font-semibold text-[var(--win10-text-primary)]">v1.0.0</span>
              </div>

              {/* 상태 메시지 및 프로그레스 바 */}
              {updateStatus?.status === 'checking' && (
                <div className="flex items-center space-x-2 text-[var(--win10-accent)] py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{t('settings.checkingForUpdates')}</span>
                </div>
              )}

              {updateStatus?.status === 'available' && (
                <div className="flex items-center space-x-2 text-amber-400 py-1">
                  <ArrowDownCircle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                  <span>{t('settings.updateAvailable', { version: updateStatus.version || '' })}</span>
                </div>
              )}

              {updateStatus?.status === 'downloading' && (
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-[11px] text-[var(--win10-text-secondary)]">
                    <span>{t('settings.updateDownloading', { percent: updateStatus.percent || 0 })}</span>
                    <span>{updateStatus.percent || 0}%</span>
                  </div>
                  <div className="w-full bg-[var(--win10-input-bg)] h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-[var(--win10-accent)] h-full transition-all duration-300"
                      style={{ width: `${updateStatus.percent || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {updateStatus?.status === 'downloaded' && (
                <div className="space-y-2 py-1">
                  <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t('settings.updateDownloaded', { version: updateStatus.version || '' })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={quitAndInstallUpdate}
                    className="w-full py-1.5 px-3 bg-[var(--win10-accent)] hover:opacity-90 text-white font-medium rounded transition-opacity flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('settings.restartAndInstall')}</span>
                  </button>
                </div>
              )}

              {updateStatus?.status === 'not-available' && (
                <div className="flex items-center space-x-1.5 text-emerald-400 py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('settings.updateLatest')}</span>
                </div>
              )}

              {updateStatus?.status === 'error' && (
                <div className="flex items-center space-x-1.5 text-red-400 py-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{updateStatus.error || t('settings.updateError')}</span>
                </div>
              )}

              {/* 업데이트 확인 버튼 */}
              {updateStatus?.status !== 'downloaded' && (
                <button
                  type="button"
                  disabled={updateStatus?.status === 'checking' || updateStatus?.status === 'downloading'}
                  onClick={() => checkForUpdates()}
                  className="w-full mt-1 py-1.5 px-2 bg-[var(--win10-input-bg)] hover:bg-[var(--win10-button-hover)] disabled:opacity-50 text-[var(--win10-text-primary)] rounded border border-[var(--win10-border)] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${updateStatus?.status === 'checking' ? 'animate-spin' : ''}`} />
                  <span>{t('settings.checkForUpdates')}</span>
                </button>
              )}
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
