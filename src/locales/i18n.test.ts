import { describe, it, expect } from 'vitest';
import {
  translate,
  getLocalizedWeekdays,
  getLocalizedWeekdaysFull,
  getLocalizedMonths,
  getLocalizedMonthsShort,
  formatYearMonth,
} from './index';
import { ko } from './ko';
import { en } from './en';
import { useCalendarStore } from '../storage/calendarStore';
import { getHolidayName, getApproxLunarDateString } from '../core/holidays';

describe('i18n 다국어 지원 엔진 및 사전 검증', () => {
  it('한국어(ko)와 영어(en) 사전의 모든 번역 키가 1:1로 일치해야 한다 (Key Parity)', () => {
    function getLeafKeys(obj: any, prefix = ''): string[] {
      let keys: string[] = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
          keys = keys.concat(getLeafKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    }

    const koKeys = getLeafKeys(ko);
    const enKeys = getLeafKeys(en);

    expect(koKeys).toEqual(enKeys);
    expect(koKeys.length).toBeGreaterThan(30);
  });

  it('기본 언어(ko) 및 영어(en)로 올바른 문자열을 반환해야 한다', () => {
    expect(translate('views.day', 'ko')).toBe('일');
    expect(translate('views.day', 'en')).toBe('Day');

    expect(translate('views.month', 'ko')).toBe('월');
    expect(translate('views.month', 'en')).toBe('Month');

    expect(translate('header.today', 'ko')).toBe('오늘');
    expect(translate('header.today', 'en')).toBe('Today');

    expect(translate('sidebar.newEvent', 'ko')).toBe('새 이벤트');
    expect(translate('sidebar.newEvent', 'en')).toBe('New event');
  });

  it('동적 파라미터({count}, {time} 등) 보간이 정상 작동해야 한다', () => {
    const koMsg = translate('settings.icsImportSuccess', 'ko', { count: 5 });
    expect(koMsg).toBe('5개의 일정을 iCalendar 파일에서 성공적으로 가져왔습니다.');

    const enMsg = translate('settings.icsImportSuccess', 'en', { count: 5 });
    expect(enMsg).toBe('Successfully imported 5 event(s) from iCalendar file.');

    const searchCount = translate('search.resultsCount', 'ko', { count: 3 });
    expect(searchCount).toBe('3개의 일정을 찾았습니다.');
  });

  it('존재하지 않는 키 요청 시 기본 Fallback(ko) 또는 키 자체를 반환해야 한다', () => {
    // 키가 아예 없는 경우
    expect(translate('non.existent.key', 'en')).toBe('non.existent.key');
    expect(translate('non.existent.key', 'ko')).toBe('non.existent.key');
  });

  it('로케일에 맞는 요일 및 월 배열을 정상 반환해야 한다', () => {
    const koWeekdays = getLocalizedWeekdays('ko');
    expect(koWeekdays).toEqual(['일', '월', '화', '수', '목', '금', '토']);

    const enWeekdays = getLocalizedWeekdays('en');
    expect(enWeekdays).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

    const koWeekdaysFull = getLocalizedWeekdaysFull('ko');
    expect(koWeekdaysFull[0]).toBe('일요일');

    const enWeekdaysFull = getLocalizedWeekdaysFull('en');
    expect(enWeekdaysFull[0]).toBe('Sunday');

    const koMonths = getLocalizedMonths('ko');
    expect(koMonths[0]).toBe('1월');
    expect(koMonths[11]).toBe('12월');

    const enMonths = getLocalizedMonths('en');
    expect(enMonths[0]).toBe('January');
    expect(enMonths[11]).toBe('December');

    const enMonthsShort = getLocalizedMonthsShort('en');
    expect(enMonthsShort[0]).toBe('Jan');
    expect(enMonthsShort[9]).toBe('Oct');
  });

  it('로케일에 맞는 연/월 타이틀 포맷팅이 정상 동작해야 한다', () => {
    // 2026년 10월 (0-indexed: 9)
    const koTitle = formatYearMonth(2026, 9, 'ko');
    expect(koTitle).toBe('2026년 10월');

    const enTitle = formatYearMonth(2026, 9, 'en');
    expect(enTitle).toBe('October 2026');
  });

  it('useCalendarStore에서 언어 설정 변경 및 실시간 반응이 정상 작동해야 한다', () => {
    const store = useCalendarStore.getState();
    expect(store.settings.language).toBeDefined();

    // 언어를 영어(en)로 변경
    store.updateSettings({ language: 'en' });
    expect(useCalendarStore.getState().settings.language).toBe('en');

    // 다시 한국어(ko)로 변경
    store.updateSettings({ language: 'ko' });
    expect(useCalendarStore.getState().settings.language).toBe('ko');
  });

  it('공휴일 및 음력 날짜가 선택된 언어에 맞게 변환되어야 한다', () => {
    // 2026-10-03 (개천절 / National Foundation Day)
    const oct3 = new Date(2026, 9, 3);
    expect(getHolidayName(oct3, 'ko')).toBe('개천절');
    expect(getHolidayName(oct3, 'en')).toBe('National Foundation Day');

    // 2026-10-09 (한글날 / Hangeul Day)
    const oct9 = new Date(2026, 9, 9);
    expect(getHolidayName(oct9, 'ko')).toBe('한글날');
    expect(getHolidayName(oct9, 'en')).toBe('Hangeul Day');

    // 음력 1일 (초하루 / 1st) 및 15일 (보름 / 15th)
    const lunar1 = getApproxLunarDateString(oct3, 'ko');
    expect(lunar1).toBeDefined();

    const lunar1En = getApproxLunarDateString(oct3, 'en');
    expect(lunar1En).toBeDefined();
    if (lunar1 === '초하루') expect(lunar1En).toBe('1st');
    if (lunar1 === '보름') expect(lunar1En).toBe('15th');
  });

  it('테마 프리셋, 액센트 색상, 월페이퍼, 샘플 일정이 다국어로 제공되어야 한다', () => {
    expect(translate('themePresets.classic-dark.name', 'ko')).toBe('Windows 10 클래식 다크');
    expect(translate('themePresets.classic-dark.name', 'en')).toBe('Windows 10 Classic Dark');

    expect(translate('accentColors.blue', 'ko')).toBe('기본 파랑');
    expect(translate('accentColors.blue', 'en')).toBe('Default Blue');

    expect(translate('wallpapers.windows', 'ko')).toBe('Windows 10 히어로');
    expect(translate('wallpapers.windows', 'en')).toBe('Windows 10 Hero');

    expect(translate('sampleEvents.sample1Title', 'ko')).toBe('Windows 10 캘린더 프로젝트 킥오프');
    expect(translate('sampleEvents.sample1Title', 'en')).toBe('Windows 10 Calendar Project Kickoff');
  });
});
