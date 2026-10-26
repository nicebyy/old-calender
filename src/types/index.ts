/**
 * Windows 10 Calendar Types
 */

export type CalendarViewType = 'day' | 'workWeek' | 'week' | 'month' | 'year';

export interface CalendarCategory {
  id: string;
  name: string;
  color: string; // Hex color code
  isVisible: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
  endDate: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
  isAllDay: boolean;
  categoryId: string;
  location?: string;
  reminderMinutes?: number; // 분 단위 알림 (예: 15분 전)
  recurrenceRule?: string; // iCal RRULE (예: FREQ=WEEKLY)
  createdAt: number;
  updatedAt: number;
}

export interface DayCellData {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

export interface WindowState {
  isMaximized: boolean;
}

declare global {
  interface Window {
    electronAPI?: import('../../electron/preload').ElectronAPI;
  }
}
