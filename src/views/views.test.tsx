import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { YearView } from './YearView';
import { HeaderControls } from '../components/layout/HeaderControls';
import { useCalendarStore } from '../storage/calendarStore';

describe('Calendar Views & HeaderControls Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useCalendarStore.setState({
      selectedDate: new Date(2026, 9, 26),
      viewDate: new Date(2026, 9, 26),
      viewType: 'month',
      isSidebarOpen: true,
      searchQuery: '',
      isSearchOpen: false,
    });
  });

  it('MonthView가 정상적으로 렌더링되고 요일 헤더를 포함해야 한다', () => {
    render(<MonthView />);
    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument();
  });

  it('WeekView가 정상적으로 렌더링되어야 한다', () => {
    render(<WeekView isWorkWeek={false} />);
    expect(screen.getByText('자정')).toBeInTheDocument();
    expect(screen.getByText('정오')).toBeInTheDocument();
  });

  it('DayView가 선택된 날짜와 24시간 타임라인을 렌더링해야 한다', () => {
    render(<DayView />);
    expect(screen.getByText(/2026년 10월 26일/)).toBeInTheDocument();
    expect(screen.getByText('월요일')).toBeInTheDocument();
  });

  it('YearView가 12개 월을 모두 렌더링해야 한다', () => {
    render(<YearView />);
    expect(screen.getByText('1월')).toBeInTheDocument();
    expect(screen.getByText('6월')).toBeInTheDocument();
    expect(screen.getByText('12월')).toBeInTheDocument();
  });

  it('HeaderControls에서 윈도우 최소화, 최대화, 닫기 버튼 클릭 시 electronAPI가 호출되어야 한다', async () => {
    const mockMinimize = vi.fn();
    const mockMaximize = vi.fn();
    const mockClose = vi.fn();
    const mockIsMaximized = vi.fn().mockResolvedValue(false);
    const mockOnWindowStateChange = vi.fn().mockReturnValue(() => {});

    window.electronAPI = {
      minimizeWindow: mockMinimize,
      maximizeWindow: mockMaximize,
      closeWindow: mockClose,
      isWindowMaximized: mockIsMaximized,
      onWindowStateChange: mockOnWindowStateChange,
      showNotification: vi.fn(),
    };

    await act(async () => {
      render(<HeaderControls />);
    });

    const minimizeBtn = screen.getByTitle('최소화');
    const maximizeBtn = screen.getByTitle('최대화');
    const closeBtn = screen.getByTitle('닫기');

    act(() => {
      fireEvent.click(minimizeBtn);
    });
    expect(mockMinimize).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.click(maximizeBtn);
    });
    expect(mockMaximize).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
