/**
 * 대한민국 법정 공휴일 및 음력/명절 계산 모듈
 */

interface HolidayRule {
  month: number; // 1-indexed
  day: number;
  name: string;
}

// 양력 고정 공휴일
const FIXED_HOLIDAYS: HolidayRule[] = [
  { month: 1, day: 1, name: '신정' },
  { month: 3, day: 1, name: '3·1절' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 12, day: 25, name: '성탄절' },
];

// 2025~2028년 주요 음력 명절 양력 변환 룩업 테이블
const LUNAR_HOLIDAYS_MAP: Record<string, string> = {
  // 2025년
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-05-05': '어린이날 / 부처님오신날',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일',

  // 2026년
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-05-24': '부처님오신날',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',

  // 2027년
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-05-13': '부처님오신날',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
};

/**
 * 특정 날짜의 공휴일 명칭 반환 (공휴일이 아니면 null)
 */
export function getHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  const padMonth = String(month).padStart(2, '0');
  const padDay = String(day).padStart(2, '0');
  const dateStr = `${year}-${padMonth}-${padDay}`;

  // 1. 음력 명절 룩업
  if (LUNAR_HOLIDAYS_MAP[dateStr]) {
    return LUNAR_HOLIDAYS_MAP[dateStr];
  }

  // 2. 양력 고정 공휴일 매칭
  const fixed = FIXED_HOLIDAYS.find((h) => h.month === month && h.day === day);
  if (fixed) {
    return fixed.name;
  }

  return null;
}

/**
 * 대체 캘린더 (음력 일자 표기) 계산 (예: 9.15, 보름, 10.1 등)
 */
export function getApproxLunarDateString(date: Date): string {
  // 음력 사이클 근사치 계산 (달의 위상 주기 약 29.530588일)
  // 기준점: 2026년 1월 1일은 음력 2025년 11월 13일
  const baseDate = new Date(2026, 0, 1).getTime();
  const targetDate = date.getTime();
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

  const lunarDay = ((13 + diffDays) % 29.53 + 29.53) % 29.53;
  const dayNum = Math.floor(lunarDay) + 1;

  if (dayNum === 1) return '초하루';
  if (dayNum === 15) return '보름';
  if (dayNum % 5 === 0) return `${dayNum}일`;

  return '';
}
