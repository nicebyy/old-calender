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
  accountId?: string; // OAuth2 연동 계정 ID (Google, Microsoft 등)
  location?: string;
  reminderMinutes?: number; // 분 단위 알림 (예: 15분 전, 없으면 -1)
  recurrence?: RecurrenceType;
  busyStatus?: BusyStatusType; // 표시 상태 (약속 있음, 한가함 등)
  attendees?: string[]; // 참석자 이메일 목록
  isPrivate?: boolean; // 비공개 일정 여부
  createdAt: number;
  updatedAt: number;
}

export type MemoColor =
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'blue'
  | 'gray'
  | 'charcoal';

export interface CalendarMemo {
  id: string;
  title?: string;
  content: string;
  date?: string; // YYYY-MM-DD (특정 날짜 연결) 또는 undefined/null (일반 자유 메모)
  color: MemoColor;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WeatherLocation {
  city: string;
  latitude: number;
  longitude: number;
  autoDetect: boolean;
}

export interface WeatherInfo {
  condition: 'sunny' | 'partlyCloudy' | 'cloudy' | 'rainy' | 'snowy';
  tempMax: number;
  tempMin: number;
  currentTemp?: number;
  label: string;
  locationName?: string;
  humidity?: number;
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

export type ThemeMode = 'dark' | 'light' | 'system';
export type BackgroundFillOption = 'window' | 'sidebar' | 'none';

export interface WallpaperOption {
  id: string;
  name: string;
  thumbnail: string;
  cssBackground: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  themeMode: 'dark' | 'light';
  accentColor: string;
  backgroundTheme: string;
  backgroundFill: BackgroundFillOption;
  description: string;
}

export type SupportedLanguage = 'ko' | 'en';

export interface AppSettings {
  language: SupportedLanguage; // 'ko' | 'en'
  themeMode: ThemeMode;
  accentColor: string;
  firstDayOfWeek: 0 | 1; // 0: 일요일, 1: 월요일
  showWeather: boolean; // Windows 10 날씨 표시 여부
  temperatureUnit: 'C' | 'F'; // 섭씨/화씨
  weatherLocation: WeatherLocation; // 지역/위치 기반 날씨 설정
  showLunarCalendar: boolean; // 대체 캘린더 (음력 표시)
  backgroundTheme: string; // 'none' | 'alps' | 'lake' | 'city' | 'bloom' | 'aurora' | 'sunset' | 'windows' | custom url/data
  backgroundFill: BackgroundFillOption;
  backgroundOpacity: number; // 0.1 ~ 1.0
  zoomLevel?: number; // 0.70 ~ 1.60 (기본 1.0)
  sidebarWidth?: number; // 200 ~ 480 (기본 260)
}

/**
 * OAuth2 공급자 및 연동 계정 타입 (Google Calendar, iCloud)
 */
export type OAuthProvider = 'google' | 'apple';

export interface SyncedAccount {
  id: string;
  provider: OAuthProvider;
  email: string;
  displayName: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  lastSyncTime?: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  color: string;
  isEnabled: boolean;
}

export interface OAuth2ProviderConfig {
  provider: OAuthProvider;
  name: string;
  iconName: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  defaultColor: string;
}

export interface QuickPopoverState {
  isOpen: boolean;
  x: number;
  y: number;
  date?: Date;
  event?: CalendarEvent;
}

export interface ActiveToast {
  id: string;
  event: CalendarEvent;
  title: string;
  body: string;
  timestamp: number;
}

export interface WindowState {
  isMaximized: boolean;
}

export type UpdateStateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateStatusPayload {
  status: UpdateStateStatus;
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  error?: string;
}

declare global {
  interface Window {
    electronAPI?: import('../../electron/preload.cts').ElectronAPI;
  }
}

