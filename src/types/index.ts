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
export type BusyStatusType = 'busy' | 'free' | 'tentative' | 'away';

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
  busyStatus?: BusyStatusType; // 표시 상태 (약속 있음, 한가함 등)
  attendees?: string[]; // 참석자 이메일 목록
  isPrivate?: boolean; // 비공개 일정 여부
  createdAt: number;
  updatedAt: number;
}

export interface WeatherInfo {
  condition: 'sunny' | 'partlyCloudy' | 'cloudy' | 'rainy' | 'snowy';
  tempMax: number;
  tempMin: number;
  label: string;
}

export interface DayCellData {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  holidayName?: string | null;
  lunarDateString?: string | null;
  weather?: WeatherInfo;
}

export interface AppSettings {
  themeMode: 'dark' | 'light';
  accentColor: string;
  firstDayOfWeek: 0 | 1; // 0: 일요일, 1: 월요일
  showWeather: boolean; // Windows 10 날씨 표시 여부
  temperatureUnit: 'C' | 'F'; // 섭씨/화씨
  showLunarCalendar: boolean; // 대체 캘린더 (음력 표시)
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

declare global {
  interface Window {
    electronAPI?: import('../../electron/preload.cts').ElectronAPI;
  }
}
