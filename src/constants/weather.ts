import { WeatherLocation } from '../types';

export interface WeatherCityPreset {
  id: string;
  nameKo: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  city: '서울',
  latitude: 37.5665,
  longitude: 126.9780,
  autoDetect: false,
};

export const WEATHER_CITY_PRESETS: WeatherCityPreset[] = [
  { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', latitude: 37.5665, longitude: 126.9780 },
  { id: 'gyeonggi', nameKo: '경기 (수원)', nameEn: 'Gyeonggi (Suwon)', latitude: 37.2636, longitude: 127.0286 },
  { id: 'incheon', nameKo: '인천', nameEn: 'Incheon', latitude: 37.4563, longitude: 126.7052 },
  { id: 'busan', nameKo: '부산', nameEn: 'Busan', latitude: 35.1796, longitude: 129.0756 },
  { id: 'daegu', nameKo: '대구', nameEn: 'Daegu', latitude: 35.8714, longitude: 128.6014 },
  { id: 'daejeon', nameKo: '대전', nameEn: 'Daejeon', latitude: 36.3504, longitude: 127.3845 },
  { id: 'gwangju', nameKo: '광주', nameEn: 'Gwangju', latitude: 35.1595, longitude: 126.8526 },
  { id: 'ulsan', nameKo: '울산', nameEn: 'Ulsan', latitude: 35.5384, longitude: 129.3114 },
  { id: 'sejong', nameKo: '세종', nameEn: 'Sejong', latitude: 36.4800, longitude: 127.2890 },
  { id: 'gangwon', nameKo: '강원 (춘천)', nameEn: 'Gangwon (Chuncheon)', latitude: 37.8854, longitude: 127.7298 },
  { id: 'chungbuk', nameKo: '충북 (청주)', nameEn: 'Chungbuk (Cheongju)', latitude: 36.6424, longitude: 127.4890 },
  { id: 'chungnam', nameKo: '충남 (천안)', nameEn: 'Chungnam (Cheonan)', latitude: 36.8151, longitude: 127.1139 },
  { id: 'jeonbuk', nameKo: '전북 (전주)', nameEn: 'Jeonbuk (Jeonju)', latitude: 35.8242, longitude: 127.1480 },
  { id: 'jeonnam', nameKo: '전남 (목포)', nameEn: 'Jeonnam (Mokpo)', latitude: 34.8118, longitude: 126.3922 },
  { id: 'gyeongbuk', nameKo: '경북 (포항)', nameEn: 'Gyeongbuk (Pohang)', latitude: 36.0190, longitude: 129.3435 },
  { id: 'gyeongnam', nameKo: '경남 (창원)', nameEn: 'Gyeongnam (Changwon)', latitude: 35.2280, longitude: 128.6811 },
  { id: 'jeju', nameKo: '제주', nameEn: 'Jeju', latitude: 33.4996, longitude: 126.5312 },
  // 글로벌 주요 도시
  { id: 'tokyo', nameKo: '도쿄', nameEn: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { id: 'newyork', nameKo: '뉴욕', nameEn: 'New York', latitude: 40.7128, longitude: -74.0060 },
  { id: 'london', nameKo: '런던', nameEn: 'London', latitude: 51.5074, longitude: -0.1278 },
  { id: 'paris', nameKo: '파리', nameEn: 'Paris', latitude: 48.8566, longitude: 2.3522 },
];

/**
 * WMO Weather interpretation codes (WW) 매핑
 */
export const WMO_WEATHER_MAP: Record<number, { condition: 'sunny' | 'partlyCloudy' | 'cloudy' | 'rainy' | 'snowy'; labelKo: string; labelEn: string }> = {
  0: { condition: 'sunny', labelKo: '맑음', labelEn: 'Clear Sky' },
  1: { condition: 'sunny', labelKo: '대체로 맑음', labelEn: 'Mainly Clear' },
  2: { condition: 'partlyCloudy', labelKo: '구름 조금', labelEn: 'Partly Cloudy' },
  3: { condition: 'cloudy', labelKo: '흐림', labelEn: 'Overcast' },
  45: { condition: 'cloudy', labelKo: '안개', labelEn: 'Fog' },
  48: { condition: 'cloudy', labelKo: '착빙 안개', labelEn: 'Depositing Rime Fog' },
  51: { condition: 'rainy', labelKo: '실비', labelEn: 'Light Drizzle' },
  53: { condition: 'rainy', labelKo: '이슬비', labelEn: 'Moderate Drizzle' },
  55: { condition: 'rainy', labelKo: '강한 이슬비', labelEn: 'Dense Drizzle' },
  61: { condition: 'rainy', labelKo: '약한 비', labelEn: 'Slight Rain' },
  63: { condition: 'rainy', labelKo: '보통 비', labelEn: 'Moderate Rain' },
  65: { condition: 'rainy', labelKo: '강한 비', labelEn: 'Heavy Rain' },
  71: { condition: 'snowy', labelKo: '약한 눈', labelEn: 'Slight Snow' },
  73: { condition: 'snowy', labelKo: '보통 눈', labelEn: 'Moderate Snow' },
  75: { condition: 'snowy', labelKo: '강한 눈', labelEn: 'Heavy Snow' },
  77: { condition: 'snowy', labelKo: '싸락눈', labelEn: 'Snow Grains' },
  80: { condition: 'rainy', labelKo: '약한 소나기', labelEn: 'Slight Showers' },
  81: { condition: 'rainy', labelKo: '소나기', labelEn: 'Moderate Showers' },
  82: { condition: 'rainy', labelKo: '폭우성 소나기', labelEn: 'Violent Showers' },
  85: { condition: 'snowy', labelKo: '소낙눈', labelEn: 'Snow Showers' },
  86: { condition: 'snowy', labelKo: '강한 소낙눈', labelEn: 'Heavy Snow Showers' },
  95: { condition: 'rainy', labelKo: '뇌우', labelEn: 'Thunderstorm' },
  96: { condition: 'rainy', labelKo: '우박 동반 뇌우', labelEn: 'Thunderstorm with Hail' },
  99: { condition: 'rainy', labelKo: '강한 우박 뇌우', labelEn: 'Heavy Thunderstorm with Hail' },
};
