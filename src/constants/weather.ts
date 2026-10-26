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
  autoDetect: true,
};

export const WEATHER_CITY_PRESETS: WeatherCityPreset[] = [
  // 특별시 / 광역시 / 특별자치시
  { id: 'seoul', nameKo: '서울', nameEn: 'Seoul', latitude: 37.5665, longitude: 126.9780 },
  { id: 'busan', nameKo: '부산', nameEn: 'Busan', latitude: 35.1796, longitude: 129.0756 },
  { id: 'daegu', nameKo: '대구', nameEn: 'Daegu', latitude: 35.8714, longitude: 128.6014 },
  { id: 'incheon', nameKo: '인천', nameEn: 'Incheon', latitude: 37.4563, longitude: 126.7052 },
  { id: 'gwangju', nameKo: '광주', nameEn: 'Gwangju', latitude: 35.1595, longitude: 126.8526 },
  { id: 'daejeon', nameKo: '대전', nameEn: 'Daejeon', latitude: 36.3504, longitude: 127.3845 },
  { id: 'ulsan', nameKo: '울산', nameEn: 'Ulsan', latitude: 35.5384, longitude: 129.3114 },
  { id: 'sejong', nameKo: '세종', nameEn: 'Sejong', latitude: 36.4800, longitude: 127.2890 },

  // 경상북도 / 대구경북
  { id: 'chilgok', nameKo: '경북 (칠곡)', nameEn: 'Chilgok', latitude: 35.9950, longitude: 128.4017 },
  { id: 'gumi', nameKo: '경북 (구미)', nameEn: 'Gumi', latitude: 36.1195, longitude: 128.3446 },
  { id: 'pohang', nameKo: '경북 (포항)', nameEn: 'Pohang', latitude: 36.0190, longitude: 129.3435 },
  { id: 'andong', nameKo: '경북 (안동)', nameEn: 'Andong', latitude: 36.5684, longitude: 128.7294 },
  { id: 'gyeongju', nameKo: '경북 (경주)', nameEn: 'Gyeongju', latitude: 35.8562, longitude: 129.2247 },
  { id: 'gimcheon', nameKo: '경북 (김천)', nameEn: 'Gimcheon', latitude: 36.1398, longitude: 128.1136 },

  // 경상남도
  { id: 'changwon', nameKo: '경남 (창원)', nameEn: 'Changwon', latitude: 35.2280, longitude: 128.6811 },
  { id: 'gimhae', nameKo: '경남 (김해)', nameEn: 'Gimhae', latitude: 35.2285, longitude: 128.8894 },
  { id: 'jinju', nameKo: '경남 (진주)', nameEn: 'Jinju', latitude: 35.1802, longitude: 128.1076 },
  { id: 'yangsan', nameKo: '경남 (양산)', nameEn: 'Yangsan', latitude: 35.3350, longitude: 129.0373 },

  // 경기도
  { id: 'suwon', nameKo: '경기 (수원)', nameEn: 'Suwon', latitude: 37.2636, longitude: 127.0286 },
  { id: 'seongnam', nameKo: '경기 (성남/분당)', nameEn: 'Seongnam/Bundang', latitude: 37.4200, longitude: 127.1265 },
  { id: 'goyang', nameKo: '경기 (고양/일산)', nameEn: 'Goyang/Ilsan', latitude: 37.6584, longitude: 126.8320 },
  { id: 'yongin', nameKo: '경기 (용인)', nameEn: 'Yongin', latitude: 37.2411, longitude: 127.1776 },
  { id: 'bucheon', nameKo: '경기 (부천)', nameEn: 'Bucheon', latitude: 37.5034, longitude: 126.7660 },
  { id: 'ansan', nameKo: '경기 (안산)', nameEn: 'Ansan', latitude: 37.3219, longitude: 126.8309 },
  { id: 'hwaseong', nameKo: '경기 (화성)', nameEn: 'Hwaseong', latitude: 37.1995, longitude: 126.8315 },
  { id: 'pyeongtaek', nameKo: '경기 (평택)', nameEn: 'Pyeongtaek', latitude: 36.9921, longitude: 127.1129 },

  // 강원특별자치도
  { id: 'chuncheon', nameKo: '강원 (춘천)', nameEn: 'Chuncheon', latitude: 37.8854, longitude: 127.7298 },
  { id: 'wonju', nameKo: '강원 (원주)', nameEn: 'Wonju', latitude: 37.3422, longitude: 127.9202 },
  { id: 'gangneung', nameKo: '강원 (강릉)', nameEn: 'Gangneung', latitude: 37.7519, longitude: 128.8761 },

  // 충청북도 / 충청남도
  { id: 'cheongju', nameKo: '충북 (청주)', nameEn: 'Cheongju', latitude: 36.6424, longitude: 127.4890 },
  { id: 'chungju', nameKo: '충북 (충주)', nameEn: 'Chungju', latitude: 36.9910, longitude: 127.9259 },
  { id: 'cheonan', nameKo: '충남 (천안)', nameEn: 'Cheonan', latitude: 36.8151, longitude: 127.1139 },
  { id: 'asan', nameKo: '충남 (아산)', nameEn: 'Asan', latitude: 36.7898, longitude: 127.0019 },

  // 전북특별자치도 / 전라남도
  { id: 'jeonju', nameKo: '전북 (전주)', nameEn: 'Jeonju', latitude: 35.8242, longitude: 127.1480 },
  { id: 'gunsan', nameKo: '전북 (군산)', nameEn: 'Gunsan', latitude: 35.9677, longitude: 126.7369 },
  { id: 'mokpo', nameKo: '전남 (목포)', nameEn: 'Mokpo', latitude: 34.8118, longitude: 126.3922 },
  { id: 'yeosu', nameKo: '전남 (여수)', nameEn: 'Yeosu', latitude: 34.7604, longitude: 127.6622 },
  { id: 'suncheon', nameKo: '전남 (순천)', nameEn: 'Suncheon', latitude: 34.9506, longitude: 127.4872 },

  // 제주특별자치도
  { id: 'jeju', nameKo: '제주', nameEn: 'Jeju', latitude: 33.4996, longitude: 126.5312 },
  { id: 'seogwipo', nameKo: '제주 (서귀포)', nameEn: 'Seogwipo', latitude: 33.2541, longitude: 126.5601 },

  // 글로벌 주요 거점
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
