import { WeatherInfo, WeatherLocation } from '../types';
import {
  DEFAULT_WEATHER_LOCATION,
  WEATHER_CITY_PRESETS,
  WMO_WEATHER_MAP,
  WeatherCityPreset,
} from '../constants/weather';

/**
 * 섭씨 -> 화씨 변환
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

/**
 * 화씨 -> 섭씨 변환
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

/**
 * 위도/경도 기반 가장 가까운 프리셋 도시 탐색 (Haversine 간이 유클리드 거리)
 */
export function findNearestPresetCity(lat: number, lon: number): WeatherCityPreset {
  let nearest = WEATHER_CITY_PRESETS[0];
  let minDistance = Number.MAX_VALUE;

  for (const preset of WEATHER_CITY_PRESETS) {
    const dLat = preset.latitude - lat;
    const dLon = preset.longitude - lon;
    const distSq = dLat * dLat + dLon * dLon;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = preset;
    }
  }

  return nearest;
}

/**
 * 브라우저 Geolocation API를 통한 현재 위치 자동 감지
 */
export async function detectUserLocation(): Promise<WeatherLocation> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return DEFAULT_WEATHER_LOCATION;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const nearest = findNearestPresetCity(lat, lon);

        resolve({
          city: nearest.nameKo,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
          autoDetect: true,
        });
      },
      () => {
        // Geolocation 거부 또는 실패 시 기본값(서울) 반환
        resolve(DEFAULT_WEATHER_LOCATION);
      },
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}

/**
 * 날짜 및 위치 기반 결정론적 로컬 날씨 폴백 (네트워크 오프라인 또는 API 실패 시 0ms 즉시 반환)
 */
export function getFallbackWeather(
  date: Date,
  location: WeatherLocation = DEFAULT_WEATHER_LOCATION,
  unit: 'C' | 'F' = 'C',
  lang: 'ko' | 'en' = 'ko'
): WeatherInfo {
  const month = date.getMonth(); // 0~11
  const day = date.getDate();

  // 날짜 및 위치 기반 시드 생성
  const locSeed = Math.abs(Math.round(location.latitude * 10 + location.longitude * 10));
  const seed = (date.getFullYear() * 372 + month * 31 + day + locSeed) % 100;

  let condition: WeatherInfo['condition'] = 'sunny';
  let label = lang === 'ko' ? '맑음' : 'Clear Sky';

  if (seed < 40) {
    condition = 'sunny';
    label = lang === 'ko' ? '맑음' : 'Clear Sky';
  } else if (seed < 65) {
    condition = 'partlyCloudy';
    label = lang === 'ko' ? '구름 조금' : 'Partly Cloudy';
  } else if (seed < 80) {
    condition = 'cloudy';
    label = lang === 'ko' ? '흐림' : 'Overcast';
  } else if (seed < 95) {
    condition = 'rainy';
    label = lang === 'ko' ? '비' : 'Rainy';
  } else {
    condition = 'snowy';
    label = lang === 'ko' ? '눈' : 'Snowy';
  }

  // 위도에 따른 계절 기본 기온 보정 (북위 37도 기준 남쪽일수록 온화)
  const latDelta = (37.56 - location.latitude) * 0.8;

  let baseMax = 20 + latDelta;
  let baseMin = 10 + latDelta;

  if (month === 11 || month === 0 || month === 1) {
    // 겨울 (12~2월)
    baseMax = 3 + (seed % 5) + latDelta;
    baseMin = -7 + (seed % 4) + latDelta;
    if (condition === 'rainy' && baseMin < 0) {
      condition = 'snowy';
      label = lang === 'ko' ? '눈' : 'Snowy';
    }
  } else if (month >= 2 && month <= 4) {
    // 봄 (3~5월)
    baseMax = 15 + (seed % 8) + latDelta;
    baseMin = 5 + (seed % 6) + latDelta;
  } else if (month >= 5 && month <= 7) {
    // 여름 (6~8월)
    baseMax = 28 + (seed % 6) + latDelta;
    baseMin = 21 + (seed % 4) + latDelta;
  } else {
    // 가을 (9~11월)
    baseMax = 19 + (seed % 7) + latDelta;
    baseMin = 9 + (seed % 6) + latDelta;
  }

  let tempMax = Math.round(baseMax);
  let tempMin = Math.round(baseMin);
  let currentTemp = Math.round((baseMax + baseMin) / 2);

  if (unit === 'F') {
    tempMax = celsiusToFahrenheit(tempMax);
    tempMin = celsiusToFahrenheit(tempMin);
    currentTemp = celsiusToFahrenheit(currentTemp);
  }

  return {
    condition,
    tempMax,
    tempMin,
    currentTemp,
    label,
    locationName: location.city,
    humidity: 50 + (seed % 30),
  };
}

/**
 * Open-Meteo 응답 데이터로부터 실시간 현재 날씨 파싱
 */
export function parseOpenMeteoCurrentWeather(
  data: any,
  unit: 'C' | 'F' = 'C',
  lang: 'ko' | 'en' = 'ko',
  locationName = '서울'
): WeatherInfo {
  if (!data?.current) {
    return getFallbackWeather(new Date(), DEFAULT_WEATHER_LOCATION, unit, lang);
  }

  const code = data.current.weather_code ?? 0;
  const mapped = WMO_WEATHER_MAP[code] || WMO_WEATHER_MAP[0];

  let currentTemp = Math.round(data.current.temperature_2m ?? 18);
  let tempMax = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp + 4);
  let tempMin = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp - 5);

  if (unit === 'F') {
    currentTemp = celsiusToFahrenheit(currentTemp);
    tempMax = celsiusToFahrenheit(tempMax);
    tempMin = celsiusToFahrenheit(tempMin);
  }

  return {
    condition: mapped.condition,
    tempMax,
    tempMin,
    currentTemp,
    label: lang === 'ko' ? mapped.labelKo : mapped.labelEn,
    locationName,
    humidity: data.current.relative_humidity_2m ?? 55,
  };
}

/**
 * Open-Meteo 응답 데이터로부터 7일간 일별 예보 맵 파싱
 */
export function parseOpenMeteoDailyForecast(
  data: any,
  unit: 'C' | 'F' = 'C',
  lang: 'ko' | 'en' = 'ko',
  locationName = '서울'
): Record<string, WeatherInfo> {
  const result: Record<string, WeatherInfo> = {};
  if (!data?.daily?.time) return result;

  const times: string[] = data.daily.time;
  const codes: number[] = data.daily.weather_code || [];
  const maxes: number[] = data.daily.temperature_2m_max || [];
  const mins: number[] = data.daily.temperature_2m_min || [];

  for (let i = 0; i < times.length; i++) {
    const dateKey = times[i];
    const code = codes[i] ?? 0;
    const mapped = WMO_WEATHER_MAP[code] || WMO_WEATHER_MAP[0];

    let tMax = Math.round(maxes[i] ?? 20);
    let tMin = Math.round(mins[i] ?? 10);

    if (unit === 'F') {
      tMax = celsiusToFahrenheit(tMax);
      tMin = celsiusToFahrenheit(tMin);
    }

    result[dateKey] = {
      condition: mapped.condition,
      tempMax: tMax,
      tempMin: tMin,
      currentTemp: Math.round((tMax + tMin) / 2),
      label: lang === 'ko' ? mapped.labelKo : mapped.labelEn,
      locationName,
    };
  }

  return result;
}

/**
 * Open-Meteo 기상청 API를 통한 실시간 예보 페칭 (No API Key Required)
 */
export async function fetchRealWeather(
  location: WeatherLocation = DEFAULT_WEATHER_LOCATION,
  unit: 'C' | 'F' = 'C',
  lang: 'ko' | 'en' = 'ko'
): Promise<{ current: WeatherInfo; daily: Record<string, WeatherInfo> }> {
  try {
    const lat = location.latitude;
    const lon = location.longitude;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4초 타임아웃

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

    const data = await res.json();
    const current = parseOpenMeteoCurrentWeather(data, unit, lang, location.city);
    const daily = parseOpenMeteoDailyForecast(data, unit, lang, location.city);

    return { current, daily };
  } catch {
    // 오프라인이거나 네트워크 오류 시 위치 기반 폴백 데이터 생성
    const fallbackCurrent = getFallbackWeather(new Date(), location, unit, lang);
    return {
      current: fallbackCurrent,
      daily: {},
    };
  }
}

/**
 * 특정 일자의 날씨 정보 반환 (캐시 우선, 없으면 폴백)
 */
export function getWeatherForDate(
  date: Date,
  unit: 'C' | 'F' = 'C',
  location: WeatherLocation = DEFAULT_WEATHER_LOCATION,
  cacheMap: Record<string, WeatherInfo> = {},
  lang: 'ko' | 'en' = 'ko'
): WeatherInfo {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  if (cacheMap[dateKey]) {
    return cacheMap[dateKey];
  }

  return getFallbackWeather(date, location, unit, lang);
}
