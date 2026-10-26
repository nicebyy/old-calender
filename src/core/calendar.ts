import { CalendarEvent, DayCellData } from '../types';
import { DAYS_IN_WEEK, WEEKS_IN_MONTH_GRID } from '../constants/calendar';

/**
 * 두 날짜가 같은 날(연/월/일)인지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Date 객체를 'YYYY-MM-DD' 형식 문자열로 변환 (로컬 타임 기준)
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 6주 42칸의 월간 캘린더 그리드 데이터 생성
 */
export function getMonthGrid(
  year: number,
  month: number, // 0-indexed (0 = 1월, 11 = 12월)
  selectedDate: Date,
  events: CalendarEvent[] = []
): DayCellData[] {
  const today = new Date();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)

  // 6주 고정 그리드(42일) 시작 날짜: 이전 달의 일요일
  const startDate = new Date(year, month, 1 - startDayOfWeek);

  const totalCells = DAYS_IN_WEEK * WEEKS_IN_MONTH_GRID;
  const cells: DayCellData[] = [];

  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + i
    );
    const dateString = formatDateKey(cellDate);

    // 해당 날짜에 걸쳐 있는 이벤트 필터링
    const dayEvents = events.filter((evt) => {
      const evtStart = evt.startDate.slice(0, 10);
      const evtEnd = evt.endDate.slice(0, 10);
      return dateString >= evtStart && dateString <= evtEnd;
    });

    cells.push({
      date: cellDate,
      dateString,
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
      isToday: isSameDay(cellDate, today),
      isSelected: isSameDay(cellDate, selectedDate),
      events: dayEvents,
    });
  }

  return cells;
}

/**
 * 특정 날짜가 속한 주의 7개 날짜 배열 반환
 */
export function getWeekDays(baseDate: Date, startOnMonday = false): Date[] {
  const currentDayOfWeek = baseDate.getDay();
  const diff = startOnMonday
    ? currentDayOfWeek === 0
      ? -6
      : 1 - currentDayOfWeek
    : -currentDayOfWeek;

  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() + diff);

  const days: Date[] = [];
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * 이전/다음 단위로 날짜 이동 계산
 */
export function getNavigatedDate(
  currentDate: Date,
  viewType: 'day' | 'workWeek' | 'week' | 'month' | 'year',
  direction: 'prev' | 'next'
): Date {
  const delta = direction === 'next' ? 1 : -1;
  const newDate = new Date(currentDate);

  switch (viewType) {
    case 'day':
      newDate.setDate(newDate.getDate() + delta);
      break;
    case 'workWeek':
    case 'week':
      newDate.setDate(newDate.getDate() + delta * 7);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() + delta);
      break;
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + delta);
      break;
  }

  return newDate;
}
