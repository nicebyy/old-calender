import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Calendar as CalendarIcon } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.electronAPI.onWindowStateChange((state) => {
        setIsMaximized(state.isMaximized);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <header className="h-8 w-full bg-[#1f1f1f] flex items-center justify-between select-none app-drag-region border-b border-[#2b2b2b] text-xs text-[#cccccc] z-50">
      {/* 좌측 앱 아이콘 및 이름 */}
      <div className="flex items-center space-x-2.5 px-3 h-full">
        <CalendarIcon className="w-3.5 h-3.5 text-[#0078d7]" />
        <span className="font-normal text-[11.5px] tracking-tight">일정</span>
      </div>

      {/* 중앙 드래그 가능 빈 공간 */}
      <div className="flex-1 h-full" />

      {/* 우측 윈도우 창 제어 버튼들 (Windows 10 순수 규격: 46px 너비) */}
      <div className="flex items-center h-full app-no-drag">
        <button
          onClick={handleMinimize}
          className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
          title="최소화"
          aria-label="최소화"
        >
          <Minus className="w-3.5 h-3.5 text-white stroke-[1.5]" />
        </button>

        <button
          onClick={handleMaximize}
          className="w-[46px] h-full flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
          title={isMaximized ? '이전 크기로 복원' : '최대화'}
          aria-label={isMaximized ? '이전 크기로 복원' : '최대화'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 text-white stroke-[1.5] -rotate-90" />
          ) : (
            <Square className="w-3 h-3 text-white stroke-[1.5]" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] active:bg-[#c4101e] transition-colors group"
          title="닫기"
          aria-label="닫기"
        >
          <X className="w-3.5 h-3.5 text-white stroke-[1.5]" />
        </button>
      </div>
    </header>
  );
};
