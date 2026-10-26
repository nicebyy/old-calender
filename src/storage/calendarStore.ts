import { create } from 'zustand';
import {
  AppSettings,
  CalendarCategory,
  CalendarEvent,
  CalendarViewType,
  QuickPopoverState,
  OAuthProvider,
  SyncedAccount,
  ThemePreset,
  ActiveToast,
  WeatherInfo,
  WeatherLocation,
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants/calendar';
import { DEFAULT_WEATHER_LOCATION } from '../constants/weather';
import { getNavigatedDate } from '../core/calendar';
import { expandEventsForRange } from '../core/recurrence';
import { exportEventsToICS, parseICSToEvents } from '../core/ical';
import { generateRemoteEventsForProvider, mergeRemoteEvents } from '../core/oauthSync';
import { getDueReminders, formatReminderMessage } from '../core/notifications';
import { fetchRealWeather, detectUserLocation, getFallbackWeather } from '../core/weather';

const STORAGE_KEY_EVENTS = 'win10_calendar_events';
const STORAGE_KEY_CATEGORIES = 'win10_calendar_categories';
const STORAGE_KEY_SETTINGS = 'win10_calendar_settings';
const STORAGE_KEY_ACCOUNTS = 'win10_calendar_synced_accounts';
const STORAGE_KEY_NOTIFIED = 'win10_calendar_notified_reminders';
const STORAGE_KEY_WEATHER_CACHE = 'win10_calendar_weather_cache';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ko',
  themeMode: 'dark',
  accentColor: '#0078D7',
  firstDayOfWeek: 0,
  showWeather: true,
  temperatureUnit: 'C',
  weatherLocation: DEFAULT_WEATHER_LOCATION,
  showLunarCalendar: true,
  backgroundTheme: 'none',
  backgroundFill: 'sidebar',
  backgroundOpacity: 0.35,
};

/**
 * 테마 설정(다크/라이트 모드, 액센트 컬러, 배경 불투명도)을 DOM에 실시간 반영
 */
export function applyThemeToDOM(settings: AppSettings) {
  if (typeof document === 'undefined') return;

  // 1. Accent color CSS variables
  if (settings.accentColor) {
    document.documentElement.style.setProperty('--win10-accent', settings.accentColor);
  }

  // 2. Theme Mode: 'dark' | 'light' | 'system'
  let resolvedMode: 'dark' | 'light' = 'dark';
  if (settings.themeMode === 'system') {
    resolvedMode =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
  } else {
    resolvedMode = settings.themeMode === 'light' ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', resolvedMode);

  // 3. Background Opacity variable
  if (typeof settings.backgroundOpacity === 'number') {
    document.documentElement.style.setProperty(
      '--win10-bg-opacity',
      String(settings.backgroundOpacity)
    );
  }
}

function loadStoredAccounts(): SyncedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadStoredNotifiedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadStoredEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return [
        {
          id: 'sample-1',
          title: 'Windows 10 캘린더 프로젝트 킥오프',
          description: '반응성 1위 초고속 네이티브 캘린더 앱 개발',
          startDate: `${todayStr}T10:00:00`,
          endDate: `${todayStr}T11:30:00`,
          isAllDay: false,
          categoryId: 'default-work',
          location: '온라인 회의실',
          reminderMinutes: 15,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-2',
          title: '팀 주간 회고 및 계획',
          description: '스프린트 진행상황 공유',
          startDate: `${todayStr}T14:00:00`,
          endDate: `${todayStr}T15:00:00`,
          isAllDay: false,
          categoryId: 'default-personal',
          recurrence: 'weekly',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-3',
          title: '프로젝트 릴리스 데이',
          description: '데스크톱 앱 패키징 및 최종 검증',
          startDate: `${todayStr}T00:00:00`,
          endDate: `${todayStr}T23:59:59`,
          isAllDay: true,
          categoryId: 'default-holiday',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadStoredCategories(): CalendarCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    const loaded: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      weatherLocation: parsed.weatherLocation
        ? { ...DEFAULT_WEATHER_LOCATION, ...parsed.weatherLocation }
        : DEFAULT_WEATHER_LOCATION,
    };
    applyThemeToDOM(loaded);
    return loaded;
  } catch {
    applyThemeToDOM(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

function loadStoredWeatherCache(): { current: WeatherInfo | null; daily: Record<string, WeatherInfo> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEATHER_CACHE);
    return raw ? JSON.parse(raw) : { current: null, daily: {} };
  } catch {
    return { current: null, daily: {} };
  }
}

interface CalendarState {
  // 상태
  selectedDate: Date;
  viewDate: Date;
  viewType: CalendarViewType;
  isSidebarOpen: boolean;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  settings: AppSettings;

  // 패널 및 팝업 상태
  isSettingsOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  quickPopover: QuickPopoverState;

  // 네비게이션 및 뷰 액션
  setSelectedDate: (date: Date) => void;
  setViewDate: (date: Date) => void;
  setViewType: (viewType: CalendarViewType) => void;
  toggleSidebar: () => void;
  navigateViewDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;

  // 이벤트 CRUD 액션
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  toggleCategoryVisibility: (categoryId: string) => void;

  // 설정 액션
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  applyThemePreset: (preset: ThemePreset) => void;
  toggleSettings: () => void;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;

  // 모달 및 팝오버 액션
  openEventModal: (event?: CalendarEvent, defaultDate?: Date) => void;
  closeEventModal: () => void;
  openQuickPopover: (x: number, y: number, date?: Date, event?: CalendarEvent) => void;
  closeQuickPopover: () => void;

  // 계정 동기화 상태
  syncedAccounts: SyncedAccount[];
  isAccountModalOpen: boolean;
  isSyncing: boolean;

  // 카테고리 관리
  addCategory: (name: string, color: string) => void;

  // 일정 일정 변경 (드래그 앤 드롭 이동)
  rescheduleEvent: (id: string, newDateStr: string, newStartTime?: string) => void;

  // OAuth2 계정 동기화 액션
  addSyncedAccount: (provider: OAuthProvider, email: string, displayName: string) => void;
  removeSyncedAccount: (accountId: string) => void;
  toggleAccountEnabled: (accountId: string) => void;
  syncAccount: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  openAccountModal: () => void;
  closeAccountModal: () => void;

  // 데이터 백업 및 복원 (JSON & iCal)
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
  exportEventsToICSFile: () => string;
  importEventsFromICS: (icsContent: string) => number;

  // 실시간 일정 알림(Toast Notification) 상태 및 액션
  activeToasts: ActiveToast[];
  notifiedReminderMap: Record<string, number>;
  dismissToast: (id: string) => void;
  snoozeToast: (id: string, minutes?: number) => void;
  triggerReminderNotification: (event: CalendarEvent) => void;
  checkDueReminders: () => void;

  // 위치 기반 실시간 날씨 상태 및 액션
  currentWeather: WeatherInfo | null;
  weatherDailyCache: Record<string, WeatherInfo>;
  isWeatherLoading: boolean;
  refreshWeather: () => Promise<void>;
  setWeatherLocation: (location: WeatherLocation) => Promise<void>;
  autoDetectLocation: () => Promise<void>;

  // 헬퍼
  getExpandedEvents: (rangeStart: Date, rangeEnd: Date) => CalendarEvent[];
}

const initialStoredSettings = loadStoredSettings();
const initialWeatherCache = loadStoredWeatherCache();

export const useCalendarStore = create<CalendarState>((set, get) => ({
  selectedDate: new Date(),
  viewDate: new Date(),
  viewType: 'month',
  isSidebarOpen: true,
  events: loadStoredEvents(),
  categories: loadStoredCategories(),
  settings: initialStoredSettings,

  isSettingsOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  isEventModalOpen: false,
  editingEvent: null,
  quickPopover: { isOpen: false, x: 0, y: 0 },
  syncedAccounts: loadStoredAccounts(),
  isAccountModalOpen: false,
  isSyncing: false,
  activeToasts: [],
  notifiedReminderMap: loadStoredNotifiedMap(),
  currentWeather: initialWeatherCache.current || getFallbackWeather(new Date(), initialStoredSettings.weatherLocation, initialStoredSettings.temperatureUnit, initialStoredSettings.language),
  weatherDailyCache: initialWeatherCache.daily,
  isWeatherLoading: false,

  setSelectedDate: (date: Date) =>
    set({
      selectedDate: date,
      viewDate: new Date(date),
    }),

  setViewDate: (date: Date) => set({ viewDate: date }),

  setViewType: (viewType: CalendarViewType) => set({ viewType }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  navigateViewDate: (direction: 'prev' | 'next') => {
    const { viewDate, viewType } = get();
    const newDate = getNavigatedDate(viewDate, viewType, direction);
    set({ viewDate: newDate });
  },

  goToToday: () => {
    const today = new Date();
    set({
      selectedDate: today,
      viewDate: today,
    });
  },

  addEvent: (eventData) => {
    const now = Date.now();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${now}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const updatedEvents = [...state.events, newEvent];
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      } catch (err) {
        console.error('Failed to persist events:', err);
      }
      return {
        events: updatedEvents,
        isEventModalOpen: false,
        quickPopover: { isOpen: false, x: 0, y: 0 },
      };
    });
  },

  updateEvent: (updated) => {
    // 인스턴스 ID인 경우 원본 ID 추출
    const realId = updated.id.includes('_instance_')
      ? updated.id.split('_instance_')[0]
      : updated.id;

    set((state) => {
      const updatedEvents = state.events.map((e) =>
        e.id === realId ? { ...updated, id: realId, updatedAt: Date.now() } : e
      );
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      } catch (err) {
        console.error('Failed to persist events:', err);
      }
      return {
        events: updatedEvents,
        isEventModalOpen: false,
        editingEvent: null,
        quickPopover: { isOpen: false, x: 0, y: 0 },
      };
    });
  },

  deleteEvent: (id) => {
    const realId = id.includes('_instance_') ? id.split('_instance_')[0] : id;
    set((state) => {
      const updatedEvents = state.events.filter((e) => e.id !== realId);
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      } catch (err) {
        console.error('Failed to persist events:', err);
      }
      return {
        events: updatedEvents,
        isEventModalOpen: false,
        editingEvent: null,
        quickPopover: { isOpen: false, x: 0, y: 0 },
      };
    });
  },

  toggleCategoryVisibility: (categoryId) => {
    set((state) => {
      const updatedCategories = state.categories.map((c) =>
        c.id === categoryId ? { ...c, isVisible: !c.isVisible } : c
      );
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));
      } catch (err) {
        console.error('Failed to persist categories:', err);
      }
      return { categories: updatedCategories };
    });
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist settings:', err);
      }

      // 동적 액센트 컬러 및 테마 DOM 반영
      applyThemeToDOM(updated);

      if (
        newSettings.temperatureUnit !== undefined ||
        newSettings.weatherLocation !== undefined ||
        newSettings.showWeather !== undefined
      ) {
        setTimeout(() => {
          get().refreshWeather();
        }, 0);
      }

      return { settings: updated };
    });
  },

  applyThemePreset: (preset) => {
    get().updateSettings({
      themeMode: preset.themeMode,
      accentColor: preset.accentColor,
      backgroundTheme: preset.backgroundTheme,
      backgroundFill: preset.backgroundFill,
    });
  },

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      searchQuery: state.isSearchOpen ? '' : state.searchQuery,
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  openEventModal: (event, defaultDate) => {
    set({
      isEventModalOpen: true,
      editingEvent: event || null,
      selectedDate: defaultDate || get().selectedDate,
      quickPopover: { isOpen: false, x: 0, y: 0 },
    });
  },

  closeEventModal: () => set({ isEventModalOpen: false, editingEvent: null }),

  openQuickPopover: (x, y, date, event) => {
    set({
      quickPopover: {
        isOpen: true,
        x,
        y,
        date,
        event,
      },
    });
  },

  closeQuickPopover: () => set({ quickPopover: { isOpen: false, x: 0, y: 0 } }),

  exportDataJSON: () => {
    const { events, categories, settings } = get();
    return JSON.stringify({ events, categories, settings }, null, 2);
  },

  importDataJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.events)) {
        set({
          events: parsed.events,
          categories: parsed.categories || get().categories,
          settings: parsed.settings || get().settings,
        });
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(parsed.events));
        if (parsed.categories) {
          localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(parsed.categories));
        }
        if (parsed.settings) {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed.settings));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  addCategory: (name, color) => {
    const newCat: CalendarCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      color,
      isVisible: true,
    };
    set((state) => {
      const updated = [...state.categories, newCat];
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
      return { categories: updated };
    });
  },

  rescheduleEvent: (id, newDateStr, newStartTime) => {
    const realId = id.includes('_instance_') ? id.split('_instance_')[0] : id;
    set((state) => {
      const target = state.events.find((e) => e.id === realId);
      if (!target) return state;

      const durationMs =
        new Date(target.endDate).getTime() - new Date(target.startDate).getTime();

      let newStartISO = `${newDateStr}${target.startDate.slice(10)}`;
      if (newStartTime) {
        newStartISO = `${newDateStr}T${newStartTime}:00`;
      }
      const newEndISO = new Date(new Date(newStartISO).getTime() + durationMs)
        .toISOString()
        .slice(0, 19);

      const updatedEvents = state.events.map((e) =>
        e.id === realId
          ? { ...e, startDate: newStartISO, endDate: newEndISO, updatedAt: Date.now() }
          : e
      );

      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      return { events: updatedEvents };
    });
  },

  exportEventsToICSFile: () => {
    return exportEventsToICS(get().events);
  },

  importEventsFromICS: (icsContent) => {
    const defaultCat = get().categories[0]?.id || 'default-personal';
    const parsed = parseICSToEvents(icsContent, defaultCat);
    if (parsed.length === 0) return 0;

    const now = Date.now();
    const newEvents: CalendarEvent[] = parsed.map((item, idx) => ({
      ...item,
      id: `evt-ics-${now}-${idx}`,
      createdAt: now,
      updatedAt: now,
    }));

    set((state) => {
      const updated = [...state.events, ...newEvents];
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
      return { events: updated };
    });

    return newEvents.length;
  },

  // OAuth2 계정 동기화 구현
  openAccountModal: () => set({ isAccountModalOpen: true }),
  closeAccountModal: () => set({ isAccountModalOpen: false }),

  addSyncedAccount: (provider, email, displayName) => {
    const providerColors: Record<OAuthProvider, string> = {
      google: '#EA4335',
      apple: '#888888',
    };

    const newAcc: SyncedAccount = {
      id: `acc-${Date.now()}`,
      provider,
      email,
      displayName: displayName || email,
      syncStatus: 'idle',
      color: providerColors[provider] || '#0078D7',
      isEnabled: true,
      createdAt: Date.now(),
    } as SyncedAccount;

    set((state) => {
      const updatedAccounts = [...state.syncedAccounts, newAcc];
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updatedAccounts));

      // 해당 계정 전용 캘린더 카테고리도 자동 등록
      const newCat: CalendarCategory = {
        id: `cat-${newAcc.id}`,
        name: `${newAcc.displayName} (${provider.toUpperCase()})`,
        color: newAcc.color,
        isVisible: true,
      };
      const updatedCategories = [...state.categories, newCat];
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));

      return {
        syncedAccounts: updatedAccounts,
        categories: updatedCategories,
        isAccountModalOpen: false,
      };
    });

    // 계정 추가 직후 즉각 1차 동기화 수행
    get().syncAccount(newAcc.id);
  },

  removeSyncedAccount: (accountId) => {
    set((state) => {
      const updatedAccounts = state.syncedAccounts.filter((a) => a.id !== accountId);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updatedAccounts));

      // 해당 계정의 원격 일정 및 전용 카테고리 정리
      const updatedEvents = state.events.filter((e) => e.accountId !== accountId);
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));

      const updatedCategories = state.categories.filter((c) => c.id !== `cat-${accountId}`);
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCategories));

      return {
        syncedAccounts: updatedAccounts,
        events: updatedEvents,
        categories: updatedCategories,
      };
    });
  },

  toggleAccountEnabled: (accountId) => {
    set((state) => {
      const updatedAccounts = state.syncedAccounts.map((a) =>
        a.id === accountId ? { ...a, isEnabled: !a.isEnabled } : a
      );
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updatedAccounts));

      // 연동된 카테고리 가시성도 동기화
      const target = updatedAccounts.find((a) => a.id === accountId);
      if (target) {
        const updatedCats = state.categories.map((c) =>
          c.id === `cat-${accountId}` ? { ...c, isVisible: target.isEnabled } : c
        );
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updatedCats));
        return { syncedAccounts: updatedAccounts, categories: updatedCats };
      }

      return { syncedAccounts: updatedAccounts };
    });
  },

  syncAccount: async (accountId) => {
    const account = get().syncedAccounts.find((a) => a.id === accountId);
    if (!account) return;

    // 동기화 중 상태 표시
    set((state) => ({
      isSyncing: true,
      syncedAccounts: state.syncedAccounts.map((a) =>
        a.id === accountId ? { ...a, syncStatus: 'syncing' } : a
      ),
    }));

    // 실제 원격 일정 가져오기 시뮬레이션 및 데이터 변환 (약 300ms 지연으로 부드러운 UI 경험)
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const remoteEvents = generateRemoteEventsForProvider(account, get().selectedDate);
      const mergedEvents = mergeRemoteEvents(get().events, remoteEvents, accountId);

      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(mergedEvents));

      set((state) => ({
        isSyncing: false,
        events: mergedEvents,
        syncedAccounts: state.syncedAccounts.map((a) =>
          a.id === accountId
            ? {
                ...a,
                syncStatus: 'success',
                lastSyncTime: Date.now(),
              }
            : a
        ),
      }));
    } catch (err: any) {
      set((state) => ({
        isSyncing: false,
        syncedAccounts: state.syncedAccounts.map((a) =>
          a.id === accountId
            ? {
                ...a,
                syncStatus: 'error',
                errorMessage: err?.message || '동기화 실패',
              }
            : a
        ),
      }));
    }
  },

  syncAllAccounts: async () => {
    const { syncedAccounts } = get();
    const activeAccounts = syncedAccounts.filter((a) => a.isEnabled);
    for (const acc of activeAccounts) {
      await get().syncAccount(acc.id);
    }
  },

  getExpandedEvents: (rangeStart, rangeEnd) => {
    const { events, categories } = get();
    const visibleCategoryIds = new Set(
      categories.filter((c) => c.isVisible).map((c) => c.id)
    );
    const visible = events.filter((e) => visibleCategoryIds.has(e.categoryId));
    return expandEventsForRange(visible, rangeStart, rangeEnd);
  },

  // 실시간 알림 액션 구현
  dismissToast: (id: string) => {
    set((state) => ({
      activeToasts: state.activeToasts.filter((t) => t.id !== id),
    }));
  },

  snoozeToast: (id: string, minutes = 5) => {
    const toast = get().activeToasts.find((t) => t.id === id);
    if (!toast) return;

    // 해당 토스트를 화면에서 닫고 minutes분 뒤 다시 알림 발생
    get().dismissToast(id);
    setTimeout(() => {
      get().triggerReminderNotification(toast.event);
    }, minutes * 60 * 1000);
  },

  triggerReminderNotification: (event: CalendarEvent) => {
    const { title, body } = formatReminderMessage(event);
    const toastId = `toast-${event.id}-${Date.now()}`;
    const newToast: ActiveToast = {
      id: toastId,
      event,
      title,
      body,
      timestamp: Date.now(),
    };

    // 1. Electron 네이티브 알림 발송
    if (typeof window !== 'undefined' && window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({ title, body });
    } else if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, { body });
      } catch {
        // 브라우저 샌드박스 정책 무시
      }
    }

    // 2. 앱 내 UWP 토스트 추가 및 발송 기록 업데이트
    set((state) => {
      const updatedMap = {
        ...state.notifiedReminderMap,
        [event.id]: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(updatedMap));
      return {
        activeToasts: [...state.activeToasts.filter((t) => t.event.id !== event.id), newToast],
        notifiedReminderMap: updatedMap,
      };
    });
  },

  checkDueReminders: () => {
    const { events, notifiedReminderMap, triggerReminderNotification } = get();
    const dueList = getDueReminders(events, new Date(), notifiedReminderMap);
    for (const item of dueList) {
      triggerReminderNotification(item.event);
    }
  },

  // 위치 기반 실시간 날씨 액션 구현
  refreshWeather: async () => {
    const { settings } = get();
    if (!settings.showWeather) return;

    set({ isWeatherLoading: true });
    try {
      const { current, daily } = await fetchRealWeather(
        settings.weatherLocation,
        settings.temperatureUnit,
        settings.language
      );
      set({
        currentWeather: current,
        weatherDailyCache: daily,
        isWeatherLoading: false,
      });
      localStorage.setItem(
        STORAGE_KEY_WEATHER_CACHE,
        JSON.stringify({ current, daily })
      );
    } catch {
      set({ isWeatherLoading: false });
    }
  },

  setWeatherLocation: async (location: WeatherLocation) => {
    get().updateSettings({ weatherLocation: location });
    await get().refreshWeather();
  },

  autoDetectLocation: async () => {
    set({ isWeatherLoading: true });
    try {
      const detected = await detectUserLocation();
      get().updateSettings({ weatherLocation: detected });
      await get().refreshWeather();
    } catch {
      set({ isWeatherLoading: false });
    }
  },
}));
