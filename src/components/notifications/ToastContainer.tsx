import React from 'react';
import { Bell, X, Clock, MapPin } from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';

export const ToastContainer: React.FC = () => {
  const activeToasts = useCalendarStore((s) => s.activeToasts);
  const dismissToast = useCalendarStore((s) => s.dismissToast);
  const snoozeToast = useCalendarStore((s) => s.snoozeToast);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none select-none max-w-sm w-full print:hidden">
      {activeToasts.map((toast) => {
        const evt = toast.event;

        const handleToastClick = () => {
          setSelectedDate(new Date(evt.startDate));
          openEventModal(evt);
          dismissToast(toast.id);
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[var(--win10-surface)] border border-[var(--win10-border)] text-[var(--win10-text-primary)] rounded shadow-2xl p-3 flex flex-col space-y-2 animate-in slide-in-from-right-5 fade-in duration-200 transition-all hover:border-[var(--win10-accent)]"
          >
            {/* 상단 앱 헤더 */}
            <div className="flex items-center justify-between text-xs text-[var(--win10-text-secondary)]">
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-[var(--win10-accent)] flex items-center justify-center text-white">
                  <Bell className="w-2.5 h-2.5" />
                </div>
                <span className="font-semibold text-[11px] text-[var(--win10-accent)]">일정 알림</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
                className="p-1 hover:bg-[#e81123] rounded transition-colors text-[var(--win10-text-secondary)] hover:text-white"
                title="닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 일정 정보 본문 */}
            <div
              onClick={handleToastClick}
              className="cursor-pointer space-y-1 hover:opacity-90 transition-opacity"
            >
              <div className="text-sm font-bold text-[var(--win10-text-primary)] truncate">
                {evt.title}
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-[var(--win10-text-secondary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
                <span>
                  {evt.isAllDay
                    ? '종일 일정'
                    : `${evt.startDate.slice(11, 16)} ~ ${evt.endDate.slice(11, 16)}`}
                </span>
              </div>

              {evt.location && (
                <div className="flex items-center space-x-1.5 text-xs text-[var(--win10-text-secondary)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </div>
              )}
            </div>

            {/* 하단 Windows 10 UWP 액션 버튼 */}
            <div className="flex items-center justify-end space-x-2 pt-1.5 border-t border-[var(--win10-border)] text-xs">
              <button
                onClick={() => snoozeToast(toast.id, 5)}
                className="px-2.5 py-1 rounded bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-primary)] border border-[var(--win10-border)] transition-colors text-[11px]"
                title="5분 뒤 다시 알림"
              >
                다시 알림 (5분)
              </button>

              <button
                onClick={() => dismissToast(toast.id)}
                className="px-3 py-1 rounded bg-[var(--win10-accent)] hover:brightness-110 active:brightness-95 text-white font-medium transition-all text-[11px] shadow-sm"
              >
                해제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
