import { SupportedLanguage } from '../types';
import { ko, TranslationSchema } from './ko';
import { en } from './en';
import { useCalendarStore } from '../storage/calendarStore';

export type { TranslationSchema };
export type { SupportedLanguage };

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';

export interface SupportedLanguageOption {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageOption[] = [
  { id: 'ko', name: '한국어 (Korean)', nativeName: '한국어' },
  { id: 'en', name: 'English (US)', nativeName: 'English' },
];

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  ko,
  en,
};

/**
 * 중첩된 객체에서 점(dot) 표기법으로 값 탐색
 */
function getNestedValue(obj: any, path: string): string | string[] | undefined {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * 템플릿 문자열 내 {param} 형태 치환
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * 번역 문자열 반환 함수
 * @param key dot 표기법 경로 (예: 'header.today', 'views.month')
 * @param lang 언어 코드 (생략 시 기본 'ko')
 * @param params 파라미터 보간 객체
 */
export function translate(
  key: string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  let val = getNestedValue(dict, key);

  // 번역 누락 시 기본 언어(ko)로 Fallback
  if (val === undefined && lang !== DEFAULT_LANGUAGE) {
    val = getNestedValue(translations[DEFAULT_LANGUAGE], key);
  }

  if (typeof val === 'string') {
    return interpolate(val, params);
  }

  // 값이 없거나 배열 등일 경우 키 자체를 반환
  return key;
}

/**
 * 로케일에 맞는 요일 목록 (단축형: 일~토 / Sun~Sat)
 */
export function getLocalizedWeekdays(lang: SupportedLanguage = DEFAULT_LANGUAGE): readonly string[] {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return dict.calendar.weekdays;
}

/**
 * 로케일에 맞는 요일 목록 (전체형: 일요일~토요일 / Sunday~Saturday)
 */
export function getLocalizedWeekdaysFull(lang: SupportedLanguage = DEFAULT_LANGUAGE): readonly string[] {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return dict.calendar.weekdaysFull;
}

/**
 * 로케일에 맞는 월 목록 (1월~12월 / January~December)
 */
export function getLocalizedMonths(lang: SupportedLanguage = DEFAULT_LANGUAGE): readonly string[] {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return dict.calendar.months;
}

/**
 * 로케일에 맞는 월 단축형 목록 (1월~12월 / Jan~Dec)
 */
export function getLocalizedMonthsShort(lang: SupportedLanguage = DEFAULT_LANGUAGE): readonly string[] {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  return dict.calendar.monthsShort;
}

/**
 * 로케일에 맞는 연/월 타이틀 포맷팅
 * 예: ko -> "2026년 10월", en -> "October 2026"
 */
export function formatYearMonth(
  year: number,
  monthIndex: number, // 0-indexed (0: 1월)
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
  const monthName = dict.calendar.months[monthIndex] || `${monthIndex + 1}`;
  return interpolate(dict.calendar.yearMonthFormat, {
    year,
    month: monthName,
  });
}

/**
 * React 컴포넌트 전용 다국어 훅 (Zustand 스토어의 현재 언어와 반응형 연동)
 */
export function useTranslation() {
  const language = useCalendarStore((s) => s.settings.language || DEFAULT_LANGUAGE);
  const updateSettings = useCalendarStore((s) => s.updateSettings);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, language, params);
  };

  const setLanguage = (newLang: SupportedLanguage) => {
    updateSettings({ language: newLang });
  };

  return {
    t,
    language,
    setLanguage,
    weekdays: getLocalizedWeekdays(language),
    weekdaysFull: getLocalizedWeekdaysFull(language),
    months: getLocalizedMonths(language),
    monthsShort: getLocalizedMonthsShort(language),
    formatYearMonth: (year: number, month: number) => formatYearMonth(year, month, language),
  };
}
