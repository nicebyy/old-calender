import { CalendarEvent, CalendarMemo, DayCellData, WeatherInfo, WeatherLocation } from '../types';
import { DAYS_IN_WEEK, WEEKS_IN_MONTH_GRID } from '../constants/calendar';
import { getHolidayName, getApproxLunarDateString } from './holidays';
import { getWeatherForDate } from './weather';

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
  events: CalendarEvent[] = [],
  options?: {
    showWeather?: boolean;
    tempUnit?: 'C' | 'F';
    showLunar?: boolean;
    location?: WeatherLocation;
    weatherCache?: Record<string, WeatherInfo>;
    lang?: 'ko' | 'en';
  }
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

    const holidayName = getHolidayName(cellDate, options?.lang || 'ko');
    const lunarDateString = options?.showLunar
      ? getApproxLunarDateString(cellDate, options?.lang || 'ko')
      : undefined;
    const weather = options?.showWeather
      ? getWeatherForDate(
          cellDate,
          options.tempUnit || 'C',
          options.location,
          options.weatherCache,
          options.lang
        )
      : undefined;

    cells.push({
      date: cellDate,
      dateString,
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
      isToday: isSameDay(cellDate, today),
      isSelected: isSameDay(cellDate, selectedDate),
      events: dayEvents,
      holidayName,
      lunarDateString,
      weather,
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

/**
 * 기본 샘플 일정의 언어별 표시 제목 반환 (사용자가 직접 수정한 경우 수정본 유지)
 */
export function getEventDisplayTitle(evt: CalendarEvent, lang: 'ko' | 'en' = 'ko'): string {
  if (evt.id === 'sample-1') {
    if (
      evt.title === 'Windows 10 캘린더 프로젝트 킥오프' ||
      evt.title === 'Windows 10 Calendar Project Kickoff'
    ) {
      return lang === 'en' ? 'Windows 10 Calendar Project Kickoff' : 'Windows 10 캘린더 프로젝트 킥오프';
    }
  } else if (evt.id === 'sample-2') {
    if (
      evt.title === '팀 주간 회고 및 계획' ||
      evt.title === 'Team Weekly Retrospective & Planning'
    ) {
      return lang === 'en' ? 'Team Weekly Retrospective & Planning' : '팀 주간 회고 및 계획';
    }
  } else if (evt.id === 'sample-3') {
    if (
      evt.title === '프로젝트 릴리스 데이' ||
      evt.title === 'Project Release Day'
    ) {
      return lang === 'en' ? 'Project Release Day' : '프로젝트 릴리스 데이';
    }
  }
  return evt.title;
}

/**
 * 기본 샘플 일정의 언어별 표시 설명 반환 (사용자가 직접 수정한 경우 수정본 유지)
 */
export function getEventDisplayDescription(evt: CalendarEvent, lang: 'ko' | 'en' = 'ko'): string | undefined {
  if (evt.id === 'sample-1') {
    if (
      evt.description === '반응성 1위 초고속 네이티브 캘린더 앱 개발' ||
      evt.description === 'Top-responsiveness native calendar app development'
    ) {
      return lang === 'en'
        ? 'Top-responsiveness native calendar app development'
        : '반응성 1위 초고속 네이티브 캘린더 앱 개발';
    }
  } else if (evt.id === 'sample-2') {
    if (
      evt.description === '스프린트 진행상황 공유' ||
      evt.description === 'Sprint progress review'
    ) {
      return lang === 'en' ? 'Sprint progress review' : '스프린트 진행상황 공유';
    }
  } else if (evt.id === 'sample-3') {
    if (
      evt.description === '데스크톱 앱 패키징 및 최종 검증' ||
      evt.description === 'Desktop app packaging and final verification'
    ) {
      return lang === 'en'
        ? 'Desktop app packaging and final verification'
        : '데스크톱 앱 패키징 및 최종 검증';
    }
  }
  return evt.description;
}

/**
 * 기본 샘플 메모의 언어별 표시 제목 반환
 */
export function getMemoDisplayTitle(memo: CalendarMemo, lang: 'ko' | 'en' = 'ko'): string {
  if (memo.id === 'memo-sample-1') {
    if (memo.title === '오늘의 할 일 및 체크리스트' || memo.title === "Today's Tasks & Checklist") {
      return lang === 'en' ? "Today's Tasks & Checklist" : '오늘의 할 일 및 체크리스트';
    }
  } else if (memo.id === 'memo-sample-2') {
    if (memo.title === '아이디어 메모' || memo.title === 'Idea Notes') {
      return lang === 'en' ? 'Idea Notes' : '아이디어 메모';
    }
  }
  return memo.title || '';
}

/**
 * 기본 샘플 메모의 언어별 표시 본문 반환
 */
export function getMemoDisplayContent(memo: CalendarMemo, lang: 'ko' | 'en' = 'ko'): string {
  if (memo.id === 'memo-sample-1') {
    const koContent = '• 주간 캘린더 피드백 정리하기\n• 회의록 작성 및 팀원 공유\n• 저녁 운동 30분';
    const enContent = '• Organize weekly calendar feedback\n• Share meeting minutes with team\n• 30-min evening workout';
    if (memo.content === koContent || memo.content === enContent) {
      return lang === 'en' ? enContent : koContent;
    }
  } else if (memo.id === 'memo-sample-2') {
    const koContent = 'Windows 10 플루언트 디자인 스티커 메모!\n단축키 Ctrl + M으로 언제든 메모를 열고 닫을 수 있습니다.';
    const enContent = 'Windows 10 Fluent Design Sticky Notes!\nPress Ctrl + M anytime to toggle notes.';
    if (memo.content === koContent || memo.content === enContent) {
      return lang === 'en' ? enContent : koContent;
    }
  }
  return memo.content;
}

