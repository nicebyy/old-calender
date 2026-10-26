import { MemoColor } from '../types';

export interface MemoColorOption {
  id: MemoColor;
  nameKo: string;
  nameEn: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  headerLight: string;
  headerDark: string;
  accent: string;
}

export const MEMO_COLORS: MemoColorOption[] = [
  {
    id: 'yellow',
    nameKo: '클래식 옐로우',
    nameEn: 'Classic Yellow',
    bgLight: '#fff9c4',
    bgDark: '#363219',
    borderLight: '#fff176',
    borderDark: '#574f26',
    textLight: '#212121',
    textDark: '#fefefe',
    headerLight: '#fff59d',
    headerDark: '#443f1f',
    accent: '#fbc02d',
  },
  {
    id: 'green',
    nameKo: '민트 그린',
    nameEn: 'Mint Green',
    bgLight: '#e8f5e9',
    bgDark: '#1b3322',
    borderLight: '#a5d6a7',
    borderDark: '#2e5539',
    textLight: '#1b5e20',
    textDark: '#f1f8f3',
    headerLight: '#c8e6c9',
    headerDark: '#23442c',
    accent: '#43a047',
  },
  {
    id: 'pink',
    nameKo: '파스텔 핑크',
    nameEn: 'Pastel Pink',
    bgLight: '#fce4ec',
    bgDark: '#3a1f2b',
    borderLight: '#f48fb1',
    borderDark: '#5c3144',
    textLight: '#880e4f',
    textDark: '#fef1f6',
    headerLight: '#f8bbd0',
    headerDark: '#472535',
    accent: '#d81b60',
  },
  {
    id: 'purple',
    nameKo: '라벤더 퍼플',
    nameEn: 'Lavender Purple',
    bgLight: '#f3e5f5',
    bgDark: '#2e1f3b',
    borderLight: '#ce93d8',
    borderDark: '#4a325e',
    textLight: '#4a148c',
    textDark: '#fbf4ff',
    headerLight: '#e1bee7',
    headerDark: '#3b284c',
    accent: '#8e24aa',
  },
  {
    id: 'blue',
    nameKo: '스카이 블루',
    nameEn: 'Sky Blue',
    bgLight: '#e1f5fe',
    bgDark: '#192b3b',
    borderLight: '#81d4fa',
    borderDark: '#27445c',
    textLight: '#01579b',
    textDark: '#f0f9ff',
    headerLight: '#b3e5fc',
    headerDark: '#1f3549',
    accent: '#039be5',
  },
  {
    id: 'gray',
    nameKo: '소프트 그레이',
    nameEn: 'Soft Gray',
    bgLight: '#f5f5f5',
    bgDark: '#2b2b2b',
    borderLight: '#e0e0e0',
    borderDark: '#424242',
    textLight: '#212121',
    textDark: '#eeeeee',
    headerLight: '#eeeeee',
    headerDark: '#363636',
    accent: '#757575',
  },
  {
    id: 'charcoal',
    nameKo: '다크 차콜',
    nameEn: 'Dark Charcoal',
    bgLight: '#374151',
    bgDark: '#1e1e24',
    borderLight: '#4b5563',
    borderDark: '#32323a',
    textLight: '#f9fafb',
    textDark: '#f3f4f6',
    headerLight: '#4b5563',
    headerDark: '#282830',
    accent: '#64748b',
  },
];
