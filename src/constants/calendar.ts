import { CalendarCategory, CalendarViewType } from '../types';

export const CALENDAR_VIEWS: { type: CalendarViewType; label: string }[] = [
  { type: 'day', label: '일' },
  { type: 'workWeek', label: '작업 주' },
  { type: 'week', label: '주' },
  { type: 'month', label: '월' },
  { type: 'year', label: '연' },
];

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const WEEKDAYS_FULL_KO = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
] as const;

export const MONTH_NAMES_KO = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
] as const;

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  {
    id: 'default-personal',
    name: '일정',
    color: '#0078D7', // Windows 10 Default Accent Blue
    isVisible: true,
  },
  {
    id: 'default-work',
    name: '업무',
    color: '#107C41', // Excel Green
    isVisible: true,
  },
  {
    id: 'default-holiday',
    name: '공휴일',
    color: '#D83B01', // Windows Orange-Red
    isVisible: true,
  },
  {
    id: 'default-birthday',
    name: '생일',
    color: '#8764B8', // Windows Purple
    isVisible: true,
  },
];

export const TIME_SLOT_MINUTES = 30; // 30분 간격
export const TOTAL_HOURS_PER_DAY = 24;
export const DAYS_IN_WEEK = 7;
export const WEEKS_IN_MONTH_GRID = 6; // 6주 고정 그리드(안정적인 레이아웃)
