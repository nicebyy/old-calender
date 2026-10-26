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

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
  endDate: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
  isAllDay: boolean;
  categoryId: string;
  location?: string;
  reminderMinutes?: number; // 분 단위 알림 (예: 15분 전, 없으면 -1)
  recurrence?: RecurrenceType;
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

export interface AppSettings {
  themeMode: 'dark' | 'light';
  accentColor: string;
  firstDayOfWeek: 0 | 1; // 0: 일요일, 1: 월요일
}

export interface QuickPopoverState {
  isOpen: boolean;
  x: number;
  y: number;
  date?: Date;
  event?: CalendarEvent;
}

export interface WindowState {
  isMaximized: boolean;
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

