import React, { useRef } from 'react';
import { X, Palette, Calendar as CalIcon, Download, Upload, Check } from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { WIN10_ACCENT_COLORS, FIRST_DAY_OPTIONS, THEME_MODES } from '../../constants/settings';

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useCalendarStore((s) => s.isSettingsOpen);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const settings = useCalendarStore((s) => s.settings);
  const updateSettings = useCalendarStore((s) => s.updateSettings);
  const exportDataJSON = useCalendarStore((s) => s.exportDataJSON);
  const importDataJSON = useCalendarStore((s) => s.importDataJSON);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `win10_calendar_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('일정 데이터가 성공적으로 복원되었습니다.');
        } else {
          alert('데이터 형식이 올바르지 않습니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 재선택 가능하게 초기화
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none bg-black/40 backdrop-blur-xs">
      {/* 바깥 배경 클릭 시 닫기 */}
      <div className="flex-1" onClick={toggleSettings} />

      {/* 우측 슬라이드인 패널 (Windows 10 Fluent 규격: 360px 너비) */}
      <div className="w-[360px] h-full bg-[#262626] border-l border-[#3a3a3a] shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
        {/* 헤더 */}
        <div className="h-12 border-b border-[#333333] px-4 flex items-center justify-between">
          <span className="font-semibold text-sm">설정</span>
          <button
            onClick={toggleSettings}
            className="p-1.5 hover:bg-[#383838] active:bg-[#444444] rounded text-[#cccccc] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 설정 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* 1. 강조 색상 (Accent Color) 타일 그리드 */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[#dddddd]">
              <Palette className="w-4 h-4 text-[#0078d7]" />
              <span>강조 색상 (Accent Color)</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {WIN10_ACCENT_COLORS.map((accent) => {
                const isSelected = settings.accentColor.toLowerCase() === accent.color.toLowerCase();
                return (
                  <button
                    key={accent.id}
                    onClick={() => updateSettings({ accentColor: accent.color })}
                    className="h-10 rounded-sm relative flex items-center justify-center border transition-transform hover:scale-105 active:scale-95"
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

          {/* 2. 테마 모드 */}
          <div className="space-y-2 pt-3 border-t border-[#333333]">
            <span className="font-medium text-[13px] text-[#dddddd]">테마</span>
            <div className="space-y-1 pt-1">
              {THEME_MODES.map((mode) => (
                <label
                  key={mode.id}
                  className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-[#333333] cursor-pointer text-[#cccccc]"
                >
                  <input
                    type="radio"
                    name="themeMode"
                    checked={settings.themeMode === mode.id}
                    onChange={() => updateSettings({ themeMode: mode.id as 'dark' | 'light' })}
                    className="accent-[#0078d7]"
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. 캘린더 기본 설정 */}
          <div className="space-y-2 pt-3 border-t border-[#333333]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[#dddddd]">
              <CalIcon className="w-4 h-4 text-[#0078d7]" />
              <span>캘린더 표시</span>
            </div>
            <div className="pt-1 space-y-2">
              <span className="text-[#aaaaaa] block">주의 첫째 날</span>
              <div className="space-y-1">
                {FIRST_DAY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-[#333333] cursor-pointer text-[#cccccc]"
                  >
                    <input
                      type="radio"
                      name="firstDayOfWeek"
                      checked={settings.firstDayOfWeek === opt.id}
                      onChange={() => updateSettings({ firstDayOfWeek: opt.id as 0 | 1 })}
                      className="accent-[#0078d7]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 4. 데이터 백업 및 복원 */}
          <div className="space-y-3 pt-3 border-t border-[#333333]">
            <span className="font-medium text-[13px] text-[#dddddd]">데이터 관리</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#333333] hover:bg-[#444444] rounded text-white transition-colors border border-[#444444]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>백업 (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#333333] hover:bg-[#444444] rounded text-white transition-colors border border-[#444444]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>복원 (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* 버전 및 정보 */}
        <div className="p-3 border-t border-[#333333] bg-[#222222] text-[11px] text-[#777777] text-center">
          Windows 10 Classic Calendar Replica v0.1.0
        </div>
      </div>
    </div>
  );
};
