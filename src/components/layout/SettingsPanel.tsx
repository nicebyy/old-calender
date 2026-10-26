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
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { WIN10_ACCENT_COLORS, FIRST_DAY_OPTIONS, THEME_MODES } from '../../constants/settings';

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useCalendarStore((s) => s.isSettingsOpen);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const settings = useCalendarStore((s) => s.settings);
  const updateSettings = useCalendarStore((s) => s.updateSettings);
  const exportDataJSON = useCalendarStore((s) => s.exportDataJSON);
  const importDataJSON = useCalendarStore((s) => s.importDataJSON);
  const exportEventsToICSFile = useCalendarStore((s) => s.exportEventsToICSFile);
  const importEventsFromICS = useCalendarStore((s) => s.importEventsFromICS);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const icsFileInputRef = useRef<HTMLInputElement>(null);

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
        alert('일정 데이터가 성공적으로 복원되었습니다.');
      } else {
        alert('올바른 JSON 백업 파일이 아닙니다.');
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
          alert(`${count}개의 일정을 iCalendar 파일에서 성공적으로 가져왔습니다.`);
        } else {
          alert('iCal 파일에서 유효한 일정을 찾을 수 없습니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none bg-black/40 backdrop-blur-xs print:hidden">
      {/* 바깥 배경 클릭 시 닫기 */}
      <div className="flex-1" onClick={toggleSettings} />

      {/* 우측 슬라이드인 패널 */}
      <div className="w-[380px] h-full bg-[#262626] border-l border-[#3a3a3a] shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* 1. 강조 색상 (Accent Color) 타일 그리드 */}
          <div className="space-y-2">
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

          {/* 2. 테마 모드 */}
          <div className="space-y-1.5 pt-2 border-t border-[#333333]">
            <span className="font-medium text-[13px] text-[#dddddd]">테마</span>
            <div className="space-y-1">
              {THEME_MODES.map((mode) => (
                <label
                  key={mode.id}
                  className="flex items-center space-x-2.5 p-1 rounded hover:bg-[#333333] cursor-pointer text-[#cccccc]"
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

          {/* 3. 날씨 설정 (Windows 10 UWP 시그니처) */}
          <div className="space-y-2 pt-2 border-t border-[#333333]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[#dddddd]">
              <CloudSun className="w-4 h-4 text-[#0078d7]" />
              <span>날씨 연동 (MSN Weather 스타일)</span>
            </div>
            <label className="flex items-center space-x-2 p-1 rounded hover:bg-[#333333] cursor-pointer text-[#cccccc]">
              <input
                type="checkbox"
                checked={settings.showWeather}
                onChange={(e) => updateSettings({ showWeather: e.target.checked })}
                className="accent-[#0078d7]"
              />
              <span>캘린더에 날씨 및 일일 기온 표시</span>
            </label>
            {settings.showWeather && (
              <div className="flex items-center space-x-3 pl-6 pt-1">
                <span className="text-[#aaaaaa]">온도 단위:</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tempUnit"
                    checked={settings.temperatureUnit === 'C'}
                    onChange={() => updateSettings({ temperatureUnit: 'C' })}
                    className="accent-[#0078d7]"
                  />
                  <span>섭씨 (°C)</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tempUnit"
                    checked={settings.temperatureUnit === 'F'}
                    onChange={() => updateSettings({ temperatureUnit: 'F' })}
                    className="accent-[#0078d7]"
                  />
                  <span>화씨 (°F)</span>
                </label>
              </div>
            )}
          </div>

          {/* 4. 대체 캘린더 (음력) 및 캘린더 표시 */}
          <div className="space-y-2 pt-2 border-t border-[#333333]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[#dddddd]">
              <CalIcon className="w-4 h-4 text-[#0078d7]" />
              <span>캘린더 표시 및 대체 캘린더</span>
            </div>
            <label className="flex items-center space-x-2 p-1 rounded hover:bg-[#333333] cursor-pointer text-[#cccccc]">
              <input
                type="checkbox"
                checked={settings.showLunarCalendar}
                onChange={(e) => updateSettings({ showLunarCalendar: e.target.checked })}
                className="accent-[#0078d7]"
              />
              <Moon className="w-3.5 h-3.5 text-[#aaaaaa]" />
              <span>음력 일자 표시 (초하루, 보름 등)</span>
            </label>

            <div className="pt-1">
              <span className="text-[#aaaaaa] block mb-1">주의 첫째 날</span>
              <div className="flex space-x-4">
                {FIRST_DAY_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center space-x-1.5 cursor-pointer text-[#cccccc]">
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

          {/* 5. iCalendar (.ics) 연동 및 JSON 백업 */}
          <div className="space-y-2 pt-2 border-t border-[#333333]">
            <div className="flex items-center space-x-2 font-medium text-[13px] text-[#dddddd]">
              <FileText className="w-4 h-4 text-[#0078d7]" />
              <span>iCalendar (.ics) 및 데이터 연동</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportICS}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#333333] hover:bg-[#444444] rounded text-white transition-colors border border-[#444444]"
                title="Google, Outlook 호환 .ics 파일로 내보내기"
              >
                <Download className="w-3 h-3" />
                <span>iCal (.ics) 저장</span>
              </button>

              <button
                onClick={() => icsFileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#333333] hover:bg-[#444444] rounded text-white transition-colors border border-[#444444]"
                title="외부 .ics 일정 파일 가져오기"
              >
                <Upload className="w-3 h-3" />
                <span>iCal (.ics) 열기</span>
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
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#2a2a2a] hover:bg-[#383838] rounded text-[#cccccc] transition-colors border border-[#383838]"
              >
                <Download className="w-3 h-3" />
                <span>JSON 전체 백업</span>
              </button>

              <button
                onClick={() => jsonFileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-[#2a2a2a] hover:bg-[#383838] rounded text-[#cccccc] transition-colors border border-[#383838]"
              >
                <Upload className="w-3 h-3" />
                <span>JSON 복원</span>
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
        <div className="p-3 border-t border-[#333333] bg-[#222222] text-[11px] text-[#777777] text-center">
          Windows 10 Classic Calendar Replica v0.2.0
        </div>
      </div>
    </div>
  );
};
