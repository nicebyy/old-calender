/**
 * 대한민국 법정 공휴일 및 음력/명절 계산 모듈 (다국어 지원)
 */

interface HolidayRule {
  month: number; // 1-indexed
  day: number;
  nameKo: string;
  nameEn: string;
}

// 양력 고정 공휴일
const FIXED_HOLIDAYS: HolidayRule[] = [
  { month: 1, day: 1, nameKo: '신정', nameEn: "New Year's Day" },
  { month: 3, day: 1, nameKo: '3·1절', nameEn: 'Independence Movement Day' },
  { month: 5, day: 5, nameKo: '어린이날', nameEn: "Children's Day" },
  { month: 6, day: 6, nameKo: '현충일', nameEn: 'Memorial Day' },
  { month: 8, day: 15, nameKo: '광복절', nameEn: 'Liberation Day' },
  { month: 10, day: 3, nameKo: '개천절', nameEn: 'National Foundation Day' },
  { month: 10, day: 9, nameKo: '한글날', nameEn: 'Hangeul Day' },
  { month: 12, day: 25, nameKo: '성탄절', nameEn: 'Christmas' },
];

interface LunarHolidayEntry {
  nameKo: string;
  nameEn: string;
}

// 2025~2028년 주요 음력 명절 양력 변환 룩업 테이블
const LUNAR_HOLIDAYS_MAP: Record<string, LunarHolidayEntry> = {
  // 2025년
  '2025-01-28': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2025-01-29': { nameKo: '설날', nameEn: 'Lunar New Year' },
  '2025-01-30': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2025-05-05': { nameKo: '어린이날 / 부처님오신날', nameEn: "Children's / Buddha's Day" },
  '2025-10-05': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },
  '2025-10-06': { nameKo: '추석', nameEn: 'Chuseok' },
  '2025-10-07': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },
  '2025-10-08': { nameKo: '대체공휴일', nameEn: 'Substitute Holiday' },

  // 2026년
  '2026-02-16': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2026-02-17': { nameKo: '설날', nameEn: 'Lunar New Year' },
  '2026-02-18': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2026-05-24': { nameKo: '부처님오신날', nameEn: "Buddha's Birthday" },
  '2026-09-24': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },
  '2026-09-25': { nameKo: '추석', nameEn: 'Chuseok' },
  '2026-09-26': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },

  // 2027년
  '2027-02-06': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2027-02-07': { nameKo: '설날', nameEn: 'Lunar New Year' },
  '2027-02-08': { nameKo: '설날 연휴', nameEn: 'Lunar New Year Holiday' },
  '2027-05-13': { nameKo: '부처님오신날', nameEn: "Buddha's Birthday" },
  '2027-09-14': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },
  '2027-09-15': { nameKo: '추석', nameEn: 'Chuseok' },
  '2027-09-16': { nameKo: '추석 연휴', nameEn: 'Chuseok Holiday' },
};

/**
 * 특정 날짜의 공휴일 명칭 반환 (공휴일이 아니면 null)
 */
export function getHolidayName(date: Date, lang: 'ko' | 'en' = 'ko'): string | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  const padMonth = String(month).padStart(2, '0');
  const padDay = String(day).padStart(2, '0');
  const dateStr = `${year}-${padMonth}-${padDay}`;

  // 1. 음력 명절 룩업
  if (LUNAR_HOLIDAYS_MAP[dateStr]) {
    const entry = LUNAR_HOLIDAYS_MAP[dateStr];
    return lang === 'en' ? entry.nameEn : entry.nameKo;
  }

  // 2. 양력 고정 공휴일 매칭
  const fixed = FIXED_HOLIDAYS.find((h) => h.month === month && h.day === day);
  if (fixed) {
    return lang === 'en' ? fixed.nameEn : fixed.nameKo;
  }

  return null;
}

/**
 * 대체 캘린더 (음력 일자 표기) 계산 (예: 9.15, 보름, 10.1 등)
 */
export function getApproxLunarDateString(date: Date, lang: 'ko' | 'en' = 'ko'): string {
  // 음력 사이클 근사치 계산 (달의 위상 주기 약 29.530588일)
  // 기준점: 2026년 1월 1일은 음력 2025년 11월 13일
  const baseDate = new Date(2026, 0, 1).getTime();
  const targetDate = date.getTime();
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

  const lunarDay = ((13 + diffDays) % 29.53 + 29.53) % 29.53;
  const dayNum = Math.floor(lunarDay) + 1;

  if (dayNum === 1) return lang === 'en' ? '1st' : '초하루';
  if (dayNum === 15) return lang === 'en' ? '15th' : '보름';
  if (dayNum % 5 === 0) return lang === 'en' ? `Day ${dayNum}` : `${dayNum}일`;

  return '';
}
