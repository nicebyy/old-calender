import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { YearView } from './YearView';
import { HeaderControls } from '../components/layout/HeaderControls';
import { SettingsPanel } from '../components/layout/SettingsPanel';
import { Sidebar } from '../components/layout/Sidebar';
import { EventModal } from '../components/events/EventModal';
import { App } from '../App';
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

  it('MonthView에서 1일인 날짜는 월 구분 라벨(예: 10월, 11월)이 함께 렌더링되어야 한다', () => {
    render(<MonthView />);
    expect(screen.getByText('10월')).toBeInTheDocument();
    expect(screen.getByText('11월')).toBeInTheDocument();
  });

  it('MonthView에서 마우스 휠 스크롤 시 월 단위로 이전/다음 달로 이동해야 한다', () => {
    const { container, unmount } = render(<MonthView />);
    expect(useCalendarStore.getState().viewDate.getMonth()).toBe(9); // 10월

    const monthRoot = container.firstChild as HTMLElement;

    // 아래로 휠 스크롤 (deltaY: 100) -> 11월로 이동
    act(() => {
      fireEvent.wheel(monthRoot, { deltaY: 100 });
    });
    expect(useCalendarStore.getState().viewDate.getMonth()).toBe(10); // 11월

    // 정리
    act(() => {
      unmount();
    });
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

  it('SettingsPanel에서 테마 프리셋 및 모드를 선택하면 설정이 즉시 반영되어야 한다', () => {
    useCalendarStore.setState({ isSettingsOpen: true });

    render(<SettingsPanel />);
    expect(screen.getByText('완성형 테마 프리셋 (1-Click)')).toBeInTheDocument();
    expect(screen.getByText('Windows 시스템 강조 색상 (12종)')).toBeInTheDocument();

    // 프리셋 클릭 (에메랄드 포레스트)
    const emeraldPreset = screen.getByText('에메랄드 포레스트');
    act(() => {
      fireEvent.click(emeraldPreset);
    });

    const updatedSettings = useCalendarStore.getState().settings;
    expect(updatedSettings.accentColor).toBe('#107C41');
    expect(updatedSettings.backgroundTheme).toBe('lake');

    // 라이트 모드 라디오 클릭
    const lightRadio = screen.getByLabelText('밝게');
    act(() => {
      fireEvent.click(lightRadio);
    });

    expect(useCalendarStore.getState().settings.themeMode).toBe('light');
  });

  it('Sidebar에서 너비 조절 스플리터 드래그 및 더블클릭 초기화가 정상 작동해야 한다', () => {
    useCalendarStore.getState().resetSidebarWidth();
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(260);

    render(<Sidebar />);
    const splitter = screen.getByRole('separator');
    expect(splitter).toBeInTheDocument();

    // 마우스 다운 후 마우스 이동으로 드래그 시뮬레이션
    act(() => {
      fireEvent.mouseDown(splitter, { clientX: 260 });
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 340 }));
    });

    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(340);

    // 마우스 업
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // 스플리터 더블클릭 시 기본값 260px로 리셋
    act(() => {
      fireEvent.doubleClick(splitter);
    });
    expect(useCalendarStore.getState().settings.sidebarWidth).toBe(260);
  });

  it('App에서 Ctrl + 마우스 휠 및 키보드 단축키(Ctrl+Plus, Minus, Zero)로 화면 배율이 조절되어야 한다', () => {
    useCalendarStore.getState().resetZoom();
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);

    const { unmount } = render(<App />);

    // Ctrl + Wheel Up (zoom in)
    act(() => {
      const wheelUp = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, cancelable: true });
      window.dispatchEvent(wheelUp);
    });
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.05);

    // 플로팅 줌 인디케이터에 105% 배율 표시
    expect(screen.getByRole('status')).toHaveTextContent('105%');

    // Ctrl + '-' 단축키 (zoom out)
    act(() => {
      fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    });
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);

    // Ctrl + '0' 단축키 (reset)
    act(() => {
      useCalendarStore.getState().setZoomLevel(1.25);
      fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    });
    expect(useCalendarStore.getState().settings.zoomLevel).toBe(1.0);

    act(() => {
      unmount();
    });
  });

  it('MonthView가 minmax(84px, 1fr) 그리드 구조를 가지며 스크롤 컨테이너를 포함해야 한다', () => {
    const { container, unmount } = render(<MonthView />);
    const gridDiv = container.querySelector('[style*="grid-template-rows"]') as HTMLElement;
    expect(gridDiv).toBeInTheDocument();
    expect(gridDiv.style.gridTemplateRows).toBe('repeat(6, minmax(84px, 1fr))');

    act(() => {
      unmount();
    });
  });

  it('Sidebar에서 선택한 날짜의 일정 목록이 렌더링되고 편집 및 삭제 버튼이 정상 작동해야 한다', () => {
    useCalendarStore.setState({
      selectedDate: new Date(2026, 9, 26),
      events: [
        {
          id: 'test-agenda-1',
          title: '사이드바 테스트 미팅',
          startDate: '2026-10-26T14:00:00',
          endDate: '2026-10-26T15:00:00',
          isAllDay: false,
          categoryId: 'default-work',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    render(<Sidebar />);

    // 선택한 날짜 헤더 및 일정 제목 확인
    expect(screen.getByText('10월 26일 (월)')).toBeInTheDocument();
    expect(screen.getByText('사이드바 테스트 미팅')).toBeInTheDocument();

    // 편집 버튼 클릭 시 openEventModal 호출 확인
    const editBtn = screen.getByTitle('일정 편집');
    act(() => {
      fireEvent.click(editBtn);
    });
    expect(useCalendarStore.getState().isEventModalOpen).toBe(true);
    expect(useCalendarStore.getState().editingEvent?.id).toBe('test-agenda-1');

    // 삭제 버튼 클릭 시 인라인 확인 UI 표시 및 삭제 실행
    const deleteBtn = screen.getByTitle('일정 삭제');
    act(() => {
      fireEvent.click(deleteBtn);
    });
    const confirmDeleteBtn = screen.getByTitle('삭제');
    expect(confirmDeleteBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(confirmDeleteBtn);
    });
    expect(useCalendarStore.getState().events.some((e) => e.id === 'test-agenda-1')).toBe(false);
  });

  it('EventModal에서 삭제 클릭 시 인라인 확인창이 뜨고 즉시 삭제되어야 한다', () => {
    const testEvt = {
      id: 'test-modal-delete-evt',
      title: '삭제 대상 일정',
      startDate: '2026-10-26T10:00:00',
      endDate: '2026-10-26T11:00:00',
      isAllDay: false,
      categoryId: 'default-personal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    useCalendarStore.setState({
      events: [testEvt],
      isEventModalOpen: true,
      editingEvent: testEvt,
    });

    render(<EventModal />);

    // 최초 삭제 버튼 클릭
    const deleteBtn = screen.getByRole('button', { name: /삭제/i });
    act(() => {
      fireEvent.click(deleteBtn);
    });

    // 인라인 확인 문구 노출 확인
    expect(screen.getByText('정말 삭제할까요?')).toBeInTheDocument();

    // 인라인 확인 삭제 버튼 클릭
    const finalDeleteBtn = screen.getAllByRole('button', { name: /삭제/i })[0];
    act(() => {
      fireEvent.click(finalDeleteBtn);
    });

    expect(useCalendarStore.getState().events.some((e) => e.id === 'test-modal-delete-evt')).toBe(false);
    expect(useCalendarStore.getState().isEventModalOpen).toBe(false);
  });

  it('MonthView에 새 일정을 추가하면 즉시 캘린더 그리드에 반영되어야 한다', () => {
    useCalendarStore.setState({
      selectedDate: new Date(2026, 9, 26),
      viewDate: new Date(2026, 9, 26),
      events: [],
    });

    const { unmount } = render(<MonthView />);

    // store.addEvent 호출 시 즉시 MonthView에 렌더링되는지 검증
    act(() => {
      useCalendarStore.getState().addEvent({
        title: '즉각 반영 검증 일정',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-personal',
      });
    });

    expect(screen.getByText('즉각 반영 검증 일정')).toBeInTheDocument();

    act(() => {
      unmount();
    });
  });

  it('Sidebar에서 일정이 없는 날(27일)을 클릭했을 때 전날(26일) 일정이 뜨지 않고 단일 플러스 문구로 표시되어야 한다', () => {
    useCalendarStore.setState({
      selectedDate: new Date(2026, 9, 27),
      viewDate: new Date(2026, 9, 27),
      events: [
        {
          id: 'oct-26-event',
          title: '26일 전용 일정',
          startDate: '2026-10-26T10:00:00',
          endDate: '2026-10-26T11:00:00',
          isAllDay: false,
          categoryId: 'default-personal',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    const { unmount } = render(<Sidebar />);

    // 27일 헤더 확인 및 26일 일정이 사이드바에 나타나지 않음 검증
    expect(screen.getByText('10월 27일 (화)')).toBeInTheDocument();
    expect(screen.queryByText('26일 전용 일정')).toBeNull();
    expect(screen.getByText('등록된 일정이 없습니다.')).toBeInTheDocument();

    // '+ 새 일정 추가' 버튼에서 중복 '+'가 없음을 검증
    const addBtn = screen.getByText('새 일정 추가');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn.textContent).toBe('새 일정 추가');

    act(() => {
      unmount();
    });
  });
});


