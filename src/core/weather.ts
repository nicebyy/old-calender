import { WeatherInfo } from '../types';

/**
 * 날짜 기반 결정론적 날씨 정보 반환 (계절 및 날짜 해시 기반)
 */
export function getWeatherForDate(date: Date, unit: 'C' | 'F' = 'C'): WeatherInfo {
  const month = date.getMonth(); // 0(1월) ~ 11(12월)
  const day = date.getDate();

  // 날짜 기반 간단한 해시 생성
  const seed = (date.getFullYear() * 372 + month * 31 + day) % 100;

  let condition: WeatherInfo['condition'] = 'sunny';
  let label = '맑음';

  if (seed < 40) {
    condition = 'sunny';
    label = '맑음';
  } else if (seed < 65) {
    condition = 'partlyCloudy';
    label = '구름 조금';
  } else if (seed < 80) {
    condition = 'cloudy';
    label = '흐림';
  } else if (seed < 95) {
    condition = 'rainy';
    label = '비';
  } else {
    condition = 'snowy';
    label = '눈';
  }

  // 계절별 기본 온도 설정 (한국 서울 기준)
  let baseMax = 20;
  let baseMin = 10;

  if (month === 11 || month === 0 || month === 1) {
    // 겨울 (12~2월)
    baseMax = 3 + (seed % 5);
    baseMin = -7 + (seed % 4);
    if (condition === 'rainy' && baseMin < 0) {
      condition = 'snowy';
      label = '눈';
    }
  } else if (month >= 2 && month <= 4) {
    // 봄 (3~5월)
    baseMax = 15 + (seed % 8);
    baseMin = 5 + (seed % 6);
  } else if (month >= 5 && month <= 7) {
    // 여름 (6~8월)
    baseMax = 28 + (seed % 6);
    baseMin = 21 + (seed % 4);
  } else {
    // 가을 (9~11월)
    baseMax = 19 + (seed % 7);
    baseMin = 9 + (seed % 6);
  }

  if (unit === 'F') {
    baseMax = Math.round((baseMax * 9) / 5 + 32);
    baseMin = Math.round((baseMin * 9) / 5 + 32);
  }

  return {
    condition,
    tempMax: baseMax,
    tempMin: baseMin,
    label,
  };
}
