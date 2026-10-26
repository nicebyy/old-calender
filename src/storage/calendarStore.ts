import { create } from 'zustand';
import { CalendarCategory, CalendarEvent, CalendarViewType } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/calendar';
import { getNavigatedDate } from '../core/calendar';

const STORAGE_KEY_EVENTS = 'win10_calendar_events';
const STORAGE_KEY_CATEGORIES = 'win10_calendar_categories';

function loadStoredEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) {
      // 초기 기본 샘플 일정 생성 (오늘 기준)
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
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'sample-2',
          title: '팀 주간 회고 및 계획',
          description: '스프린트 진행상황 공유',
          startDate: `${todayStr}T15:00:00`,
          endDate: `${todayStr}T16:00:00`,
          isAllDay: false,
          categoryId: 'default-personal',
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

interface CalendarState {
  // 상태
  selectedDate: Date;
  viewDate: Date;
  viewType: CalendarViewType;
  isSidebarOpen: boolean;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  quickAddDate: Date | null;

  // 액션
  setSelectedDate: (date: Date) => void;
  setViewDate: (date: Date) => void;
  setViewType: (viewType: CalendarViewType) => void;
  toggleSidebar: () => void;
  navigateViewDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;

  // 이벤트 액션
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  toggleCategoryVisibility: (categoryId: string) => void;

  // 모달 제어
  openEventModal: (event?: CalendarEvent, defaultDate?: Date) => void;
  closeEventModal: () => void;
  openQuickAdd: (date: Date) => void;
  closeQuickAdd: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  selectedDate: new Date(),
  viewDate: new Date(),
  viewType: 'month',
  isSidebarOpen: true,
  events: loadStoredEvents(),
  categories: loadStoredCategories(),
  isEventModalOpen: false,
  editingEvent: null,
  quickAddDate: null,

  setSelectedDate: (date: Date) =>
    set({
      selectedDate: date,
      viewDate: new Date(date), // 선택 시 해당 월로 뷰도 동기화
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
      return { events: updatedEvents, isEventModalOpen: false, quickAddDate: null };
    });
  },

  updateEvent: (updated) => {
    set((state) => {
      const updatedEvents = state.events.map((e) =>
        e.id === updated.id ? { ...updated, updatedAt: Date.now() } : e
      );
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      } catch (err) {
        console.error('Failed to persist events:', err);
      }
      return { events: updatedEvents, isEventModalOpen: false, editingEvent: null };
    });
  },

  deleteEvent: (id) => {
    set((state) => {
      const updatedEvents = state.events.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updatedEvents));
      } catch (err) {
        console.error('Failed to persist events:', err);
      }
      return { events: updatedEvents, isEventModalOpen: false, editingEvent: null };
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

  openEventModal: (event, defaultDate) => {
    set({
      isEventModalOpen: true,
      editingEvent: event || null,
      quickAddDate: defaultDate || null,
    });
  },

  closeEventModal: () => set({ isEventModalOpen: false, editingEvent: null }),

  openQuickAdd: (date: Date) => set({ quickAddDate: date }),

  closeQuickAdd: () => set({ quickAddDate: null }),
}));
