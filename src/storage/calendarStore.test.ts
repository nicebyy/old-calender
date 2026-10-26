import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from './calendarStore';

describe('CalendarStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 스토어 상태가 정상적으로 설정되어야 한다', () => {
    const state = useCalendarStore.getState();
    expect(state.viewType).toBe('month');
    expect(state.isSidebarOpen).toBe(true);
    expect(state.categories.length).toBeGreaterThan(0);
  });

  it('일정 추가(addEvent) 시 즉시 events 목록에 반영되어야 한다', () => {
    const initialCount = useCalendarStore.getState().events.length;

    useCalendarStore.getState().addEvent({
      title: '테스트 새 일정',
      startDate: '2026-10-26T14:00:00',
      endDate: '2026-10-26T15:00:00',
      isAllDay: false,
      categoryId: 'default-personal',
    });

    const updated = useCalendarStore.getState().events;
    expect(updated.length).toBe(initialCount + 1);
    expect(updated[updated.length - 1].title).toBe('테스트 새 일정');
  });

  it('일정 삭제(deleteEvent) 시 해당 일정이 목록에서 제거되어야 한다', () => {
    const currentEvents = useCalendarStore.getState().events;
    const target = currentEvents[0];

    useCalendarStore.getState().deleteEvent(target.id);

    const remaining = useCalendarStore.getState().events;
    expect(remaining.some((e) => e.id === target.id)).toBe(false);
  });

  it('카테고리 가시성 토글(toggleCategoryVisibility)이 정상 작동해야 한다', () => {
    const category = useCalendarStore.getState().categories[0];
    const initialVisibility = category.isVisible;

    useCalendarStore.getState().toggleCategoryVisibility(category.id);

    const updatedCat = useCalendarStore
      .getState()
      .categories.find((c) => c.id === category.id);
    expect(updatedCat?.isVisible).toBe(!initialVisibility);
  });
});
