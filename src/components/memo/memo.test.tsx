import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoPanel } from './MemoPanel';
import { useCalendarStore } from '../../storage/calendarStore';

describe('MemoPanel Component Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useCalendarStore.setState({
      isMemoPanelOpen: true,
      memoFilterDate: null,
      memos: [
        {
          id: 'test-memo-1',
          title: '테스트 메모 1',
          content: '테스트 메모 내용입니다.',
          color: 'yellow',
          isPinned: true,
          date: '2026-10-26',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'test-memo-2',
          title: '자유 아이디어',
          content: '날짜 없는 자유 메모입니다.',
          color: 'blue',
          isPinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });
  });

  it('MemoPanel이 열려 있을 때 타이틀과 메모 목록을 렌더링해야 한다', () => {
    render(<MemoPanel />);
    expect(screen.getByText('스티커 메모')).toBeInTheDocument();
    expect(screen.getByDisplayValue('테스트 메모 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('자유 아이디어')).toBeInTheDocument();
  });

  it('새 메모 추가 버튼을 클릭하면 새로운 메모 카드가 추가되어야 한다', () => {
    render(<MemoPanel />);
    const prevCount = useCalendarStore.getState().memos.length;

    const addButtons = screen.getAllByTitle('새 메모 추가');
    act(() => {
      fireEvent.click(addButtons[0]);
    });

    expect(useCalendarStore.getState().memos.length).toBe(prevCount + 1);
  });

  it('검색창에 키워드를 입력하면 일치하는 메모만 필터링되어야 한다', () => {
    render(<MemoPanel />);
    const searchInput = screen.getByPlaceholderText('메모 검색...');

    act(() => {
      fireEvent.change(searchInput, { target: { value: '자유' } });
    });

    expect(screen.getByDisplayValue('자유 아이디어')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('테스트 메모 1')).not.toBeInTheDocument();
  });

  it('고정됨(Pinned) 탭을 클릭하면 핀 고정된 메모만 표시되어야 한다', () => {
    render(<MemoPanel />);
    const pinnedTab = screen.getByText(/고정됨/);

    act(() => {
      fireEvent.click(pinnedTab);
    });

    expect(screen.getByDisplayValue('테스트 메모 1')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('자유 아이디어')).not.toBeInTheDocument();
  });

  it('메모 텍스트 수정 시 상태가 즉시 업데이트되어야 한다', () => {
    render(<MemoPanel />);
    const textarea = screen.getByDisplayValue('테스트 메모 내용입니다.');

    act(() => {
      fireEvent.change(textarea, { target: { value: '수정된 새로운 내용' } });
    });

    const updated = useCalendarStore.getState().memos.find((m) => m.id === 'test-memo-1');
    expect(updated?.content).toBe('수정된 새로운 내용');
  });

  it('삭제 버튼 클릭 후 삭제 확인 시 메모가 제거되어야 한다', () => {
    render(<MemoPanel />);
    const deleteButtons = screen.getAllByTitle('메모 삭제');

    // 첫 번째 메모 삭제 버튼 클릭 -> 확인 상태 진입
    act(() => {
      fireEvent.click(deleteButtons[0]);
    });

    // '삭제' 확인 버튼 클릭
    const confirmBtn = screen.getByText('삭제');
    act(() => {
      fireEvent.click(confirmBtn);
    });

    expect(useCalendarStore.getState().memos.some((m) => m.id === 'test-memo-1')).toBe(false);
  });
});
