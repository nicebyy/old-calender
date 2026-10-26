/**
 * Windows 10 Fluent Accent Color Palette (12 Accent Colors)
 */
export interface AccentColorOption {
  id: string;
  name: string;
  color: string;
  hoverColor: string;
}

export const WIN10_ACCENT_COLORS: AccentColorOption[] = [
  { id: 'blue', name: '기본 파랑', color: '#0078D7', hoverColor: '#1A86D9' },
  { id: 'crimson', name: '크림슨', color: '#E81123', hoverColor: '#F03A4A' },
  { id: 'orange', name: '오렌지', color: '#CA5010', hoverColor: '#DA6526' },
  { id: 'gold', name: '골드', color: '#C19C00', hoverColor: '#D4B018' },
  { id: 'green', name: '에메랄드 그린', color: '#107C41', hoverColor: '#1A9651' },
  { id: 'teal', name: '틸', color: '#008272', hoverColor: '#009D8B' },
  { id: 'cyan', name: '시안', color: '#00B7C3', hoverColor: '#19CCD7' },
  { id: 'navy', name: '네이비', color: '#004E8C', hoverColor: '#0F65AB' },
  { id: 'purple', name: '퍼플', color: '#744DA9', hoverColor: '#8862BD' },
  { id: 'magenta', name: '마젠타', color: '#881798', hoverColor: '#A02BAF' },
  { id: 'rose', name: '로즈', color: '#EA005E', hoverColor: '#F5257B' },
  { id: 'gray', name: '스톰 그레이', color: '#5D5A58', hoverColor: '#726F6D' },
];

export const THEME_MODES = [
  { id: 'dark', label: '어둡게 (기본값)' },
  { id: 'light', label: '밝게' },
  { id: 'system', label: 'Windows 모드 사용 (시스템 설정 연동)' },
] as const;

export const BACKGROUND_FILL_OPTIONS = [
  { id: 'sidebar', label: '사이드바에만 채우기 (Windows 10 기본)' },
  { id: 'window', label: '창 전체 채우기' },
  { id: 'none', label: '배경 채우지 않음' },
] as const;

export const FIRST_DAY_OPTIONS = [
  { id: 0, label: '일요일' },
  { id: 1, label: '월요일' },
] as const;

export const REMINDER_OPTIONS = [
  { minutes: -1, label: '없음' },
  { minutes: 0, label: '정각' },
  { minutes: 15, label: '15분 전' },
  { minutes: 30, label: '30분 전' },
  { minutes: 60, label: '1시간 전' },
  { minutes: 1440, label: '1일 전' },
] as const;

export const RECURRENCE_OPTIONS = [
  { id: 'none', label: '반복 안 함' },
  { id: 'daily', label: '매일' },
  { id: 'weekly', label: '매주' },
  { id: 'monthly', label: '매월' },
  { id: 'yearly', label: '매년' },
] as const;

/**
 * 화면 배율 및 레이아웃 크기 상수
 */
export const ZOOM_DEFAULT = 1.0;
export const ZOOM_MIN = 0.70;
export const ZOOM_MAX = 1.60;
export const ZOOM_STEP = 0.05;

export const SIDEBAR_DEFAULT_WIDTH = 260;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;

