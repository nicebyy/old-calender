import { create } from 'zustand';
import {
  AppSettings,
  CalendarCategory,
  CalendarEvent,
  CalendarViewType,
  QuickPopoverState,
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants/calendar';
import { getNavigatedDate } from '../core/calendar';
import { expandEventsForRange } from '../core/recurrence';
import { exportEventsToICS, parseICSToEvents } from '../core/ical';

const STORAGE_KEY_EVENTS = 'win10_calendar_events';
const STORAGE_KEY_CATEGORIES = 'win10_calendar_categories';
const STORAGE_KEY_SETTINGS = 'win10_calendar_settings';

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  accentColor: '#0078D7',
  firstDayOfWeek: 0,
  showWeather: true,
  temperatureUnit: 'C',
  showLunarCalendar: true,
};

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
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
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
  toggleSettings: () => void;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;

  // 모달 및 팝오버 액션
  openEventModal: (event?: CalendarEvent, defaultDate?: Date) => void;
  closeEventModal: () => void;
  openQuickPopover: (x: number, y: number, date?: Date, event?: CalendarEvent) => void;
  closeQuickPopover: () => void;

  // 카테고리 관리
  addCategory: (name: string, color: string) => void;

  // 일정 일정 변경 (드래그 앤 드롭 이동)
  rescheduleEvent: (id: string, newDateStr: string, newStartTime?: string) => void;

  // 데이터 백업 및 복원 (JSON & iCal)
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
  exportEventsToICSFile: () => string;
  importEventsFromICS: (icsContent: string) => number;

  // 헬퍼
  getExpandedEvents: (rangeStart: Date, rangeEnd: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  selectedDate: new Date(),
  viewDate: new Date(),
  viewType: 'month',
  isSidebarOpen: true,
  events: loadStoredEvents(),
  categories: loadStoredCategories(),
  settings: loadStoredSettings(),

  isSettingsOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  isEventModalOpen: false,
  editingEvent: null,
  quickPopover: { isOpen: false, x: 0, y: 0 },

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

      // 동적 액센트 컬러 CSS 변수 갱신
      if (newSettings.accentColor) {
        document.documentElement.style.setProperty('--win10-accent', newSettings.accentColor);
      }

      return { settings: updated };
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

  getExpandedEvents: (rangeStart, rangeEnd) => {
    const { events, categories } = get();
    const visibleCategoryIds = new Set(
      categories.filter((c) => c.isVisible).map((c) => c.id)
    );
    const visible = events.filter((e) => visibleCategoryIds.has(e.categoryId));
    return expandEventsForRange(visible, rangeStart, rangeEnd);
  },
}));
