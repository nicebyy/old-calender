import React from 'react';
import { X, Moon, Sun, Download, Upload, Palette } from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';

const ACCENT_COLORS = [
  { name: 'Windows Blue', value: '#0078D7' },
  { name: 'Excel Green', value: '#107C41' },
  { name: 'Windows Orange', value: '#D83B01' },
  { name: 'Purple', value: '#8764B8' },
  { name: 'Crimson Red', value: '#E81123' },
  { name: 'Teal', value: '#008272' },
];

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useCalendarStore((s) => s.isSettingsOpen);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const settings = useCalendarStore((s) => s.settings);
  const updateSettings = useCalendarStore((s) => s.updateSettings);
  const exportDataJSON = useCalendarStore((s) => s.exportDataJSON);
  const importDataJSON = useCalendarStore((s) => s.importDataJSON);

  if (!isSettingsOpen) return null;

  const handleExport = () => {
    const dataStr = exportDataJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('데이터를 성공적으로 복원했습니다.');
        } else {
          alert('올바르지 않은 JSON 파일입니다.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-100">
      {/* 바깥 영역 클릭 시 닫기 */}
      <div className="flex-1" onClick={toggleSettings} />

      {/* 우측 슬라이드 패널 */}
      <div className="w-80 h-full bg-[#262626] border-l border-[#333333] shadow-2xl flex flex-col text-white select-none">
        {/* 헤더 */}
        <div className="h-12 border-b border-[#333333] flex items-center justify-between px-4">
          <span className="font-semibold text-sm">설정</span>
          <button
            onClick={toggleSettings}
            className="p-1 hover:bg-[#383838] rounded text-[#cccccc] hover:text-white transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 바디 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* 1. 테마 모드 */}
          <div className="space-y-2">
            <label className="text-[#aaaaaa] font-medium block">앱 테마</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ themeMode: 'dark' })}
                className={`py-2 px-3 rounded flex items-center justify-center space-x-2 border transition-all ${
                  settings.themeMode === 'dark'
                    ? 'border-[#0078d7] bg-[#333333] font-semibold text-white'
                    : 'border-[#3d3d3d] bg-[#222222] text-[#888888] hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>어둡게</span>
              </button>
              <button
                onClick={() => updateSettings({ themeMode: 'light' })}
                className={`py-2 px-3 rounded flex items-center justify-center space-x-2 border transition-all ${
                  settings.themeMode === 'light'
                    ? 'border-[#0078d7] bg-[#333333] font-semibold text-white'
                    : 'border-[#3d3d3d] bg-[#222222] text-[#888888] hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>밝게</span>
              </button>
            </div>
          </div>

          {/* 2. 액센트 색상 */}
          <div className="space-y-2">
            <label className="text-[#aaaaaa] font-medium flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-[#0078d7]" />
              <span>Windows 액센트 색상</span>
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.value}
                  onClick={() => updateSettings({ accentColor: col.value })}
                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#333333] transition-colors border text-left"
                  style={{
                    borderColor: settings.accentColor === col.value ? '#ffffff' : 'transparent',
                  }}
                  title={col.name}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: col.value }}
                  />
                  <span className="truncate text-[11px] text-[#cccccc]">{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 주 시작 요일 */}
          <div className="space-y-2">
            <label className="text-[#aaaaaa] font-medium block">한 주의 첫째 날</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ firstDayOfWeek: 0 })}
                className={`py-1.5 px-3 rounded border text-center transition-all ${
                  settings.firstDayOfWeek === 0
                    ? 'border-[#0078d7] bg-[#333333] font-semibold text-white'
                    : 'border-[#3d3d3d] bg-[#222222] text-[#888888] hover:text-white'
                }`}
              >
                일요일
              </button>
              <button
                onClick={() => updateSettings({ firstDayOfWeek: 1 })}
                className={`py-1.5 px-3 rounded border text-center transition-all ${
                  settings.firstDayOfWeek === 1
                    ? 'border-[#0078d7] bg-[#333333] font-semibold text-white'
                    : 'border-[#3d3d3d] bg-[#222222] text-[#888888] hover:text-white'
                }`}
              >
                월요일
              </button>
            </div>
          </div>

          {/* 4. 데이터 백업 및 복원 */}
          <div className="space-y-2 pt-2 border-t border-[#333333]">
            <label className="text-[#aaaaaa] font-medium block">데이터 백업 및 복원</label>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-[#333333] hover:bg-[#3d3d3d] rounded text-white transition-colors border border-[#444444]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>일정 JSON 내보내기</span>
              </button>

              <label className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-[#333333] hover:bg-[#3d3d3d] rounded text-white transition-colors border border-[#444444] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>일정 JSON 불러오기</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 5. 앱 정보 */}
          <div className="pt-4 border-t border-[#333333] text-[#777777] text-[11px] space-y-1">
            <div className="text-white font-medium">Windows 10 일정 앱 레플리카</div>
            <div>버전 0.1.0 (Fluent Design Native)</div>
            <div>초고속 반응형 캘린더 엔진 구동 중</div>
          </div>
        </div>
      </div>
    </div>
  );
};
