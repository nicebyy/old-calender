import { ThemePreset, WallpaperOption } from '../types';

/**
 * Windows 10 Fluent Design System Theme Tokens
 */
export const THEME_COLORS = {
  // Windows 10 Default Accent
  accent: '#0078D7',
  accentHover: '#1A86D9',
  accentPressed: '#0063B1',

  // Dark Theme Surfaces
  background: '#1F1F1F',
  surfaceSidebar: '#2B2B2B',
  surfaceCard: '#333333',
  surfaceHover: '#3A3A3A',
  surfaceActive: '#444444',

  // Borders & Grid
  borderSubtle: '#383838',
  borderStrong: '#555555',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textDisabled: '#6E6E6E',

  // Titlebar controls
  titlebarHover: '#333333',
  closeButtonHover: '#E81123',
};

export const FLUENT_FONTS = {
  primary: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  mono: "'Consolas', monospace",
};

export const ACRYLIC_EFFECT = {
  backdropBlur: 'blur(20px)',
  sidebarBackground: 'rgba(38, 38, 38, 0.85)',
  popupBackground: 'rgba(43, 43, 43, 0.95)',
};

/**
 * Windows 10 캘린더 개인 설정용 배경 테마 (Wallpapers)
 */
export const WALLPAPER_THEMES: WallpaperOption[] = [
  {
    id: 'none',
    name: '단색 (기본)',
    thumbnail: '#1f1f1f',
    cssBackground: 'none',
  },
  {
    id: 'windows',
    name: 'Windows 10 히어로',
    thumbnail: 'linear-gradient(135deg, #001f3f, #0078d7)',
    cssBackground: 'radial-gradient(ellipse at bottom, #0078d7 0%, #003a6b 45%, #001122 90%)',
  },
  {
    id: 'alps',
    name: '알프스 설산',
    thumbnail: 'linear-gradient(135deg, #102a45, #90b8dc)',
    cssBackground: 'linear-gradient(135deg, #102a45 0%, #1a446c 40%, #3a75a4 70%, #90b8dc 100%)',
  },
  {
    id: 'lake',
    name: '에메랄드 호수',
    thumbnail: 'linear-gradient(135deg, #09201a, #71b280)',
    cssBackground: 'linear-gradient(135deg, #09201a 0%, #134e5e 45%, #2a6f65 75%, #71b280 100%)',
  },
  {
    id: 'city',
    name: '메트로폴리스 야경',
    thumbnail: 'linear-gradient(135deg, #0a0e17, #415a77)',
    cssBackground: 'linear-gradient(135deg, #0a0e17 0%, #1b263b 50%, #415a77 100%)',
  },
  {
    id: 'bloom',
    name: '봄날의 벚꽃',
    thumbnail: 'linear-gradient(135deg, #2b1020, #f48fb1)',
    cssBackground: 'linear-gradient(135deg, #2b1020 0%, #591b3e 45%, #904e95 80%, #f48fb1 100%)',
  },
  {
    id: 'aurora',
    name: '북극 오로라',
    thumbnail: 'linear-gradient(135deg, #02111b, #00bf72)',
    cssBackground: 'linear-gradient(135deg, #02111b 0%, #004d7a 35%, #008793 65%, #00bf72 100%)',
  },
  {
    id: 'sunset',
    name: '노을 지평선',
    thumbnail: 'linear-gradient(135deg, #2c0b24, #f1a97a)',
    cssBackground: 'linear-gradient(135deg, #2c0b24 0%, #611e3b 40%, #c94b4b 75%, #f1a97a 100%)',
  },
];

/**
 * 1-클릭 완성형 멀티 테마 프리셋
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic-dark',
    name: 'Windows 10 클래식 다크',
    themeMode: 'dark',
    accentColor: '#0078D7',
    backgroundTheme: 'windows',
    backgroundFill: 'sidebar',
    description: 'Windows 10 시그니처 파랑과 클래식 다크 아크릴 테마',
  },
  {
    id: 'modern-light',
    name: 'Windows 10 모던 라이트',
    themeMode: 'light',
    accentColor: '#0078D7',
    backgroundTheme: 'none',
    backgroundFill: 'none',
    description: '깨끗하고 시인성이 뛰어난 오피스 스타일 밝은 테마',
  },
  {
    id: 'emerald-forest',
    name: '에메랄드 포레스트',
    themeMode: 'dark',
    accentColor: '#107C41',
    backgroundTheme: 'lake',
    backgroundFill: 'sidebar',
    description: '차분한 초록 숲과 에메랄드 호수 자연 테마',
  },
  {
    id: 'crimson-sunset',
    name: '크림슨 선셋',
    themeMode: 'dark',
    accentColor: '#E81123',
    backgroundTheme: 'sunset',
    backgroundFill: 'sidebar',
    description: '강렬하고 화려한 붉은 노을 그라데이션 테마',
  },
  {
    id: 'cyber-neon',
    name: '사이버 네온 시안',
    themeMode: 'dark',
    accentColor: '#00B7C3',
    backgroundTheme: 'city',
    backgroundFill: 'window',
    description: '도시 야경과 형광 시안 액센트의 사이버 테마',
  },
  {
    id: 'royal-aurora',
    name: '로열 오로라 바이올렛',
    themeMode: 'dark',
    accentColor: '#744DA9',
    backgroundTheme: 'aurora',
    backgroundFill: 'sidebar',
    description: '신비로운 보랏빛 오로라 테마',
  },
  {
    id: 'golden-autumn',
    name: '골든 가을 앰버',
    themeMode: 'light',
    accentColor: '#C19C00',
    backgroundTheme: 'sunset',
    backgroundFill: 'sidebar',
    description: '따스한 가을 햇살과 골드 액센트 테마',
  },
  {
    id: 'high-contrast',
    name: '고대비 흑백',
    themeMode: 'dark',
    accentColor: '#0078D7',
    backgroundTheme: 'none',
    backgroundFill: 'none',
    description: '시인성을 극대화한 순수 고대비 블랙 & 화이트',
  },
];
