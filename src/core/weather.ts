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

export interface LocationSearchResult {
  id: string;
  displayName: string;
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * 위도/경도 좌표를 한글/영문 행정구역명(시/군/구)으로 변환 (BigDataCloud Free Reverse Geocoding)
 */
export async function reverseGeocodeCoords(
  lat: number,
  lon: number,
  lang: 'ko' | 'en' = 'ko'
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (lang === 'ko') {
      const admin = Array.isArray(data.localityInfo?.administrative)
        ? data.localityInfo.administrative
        : [];

      const level4 = admin.find((a: any) => a.adminLevel === 4)?.name || ''; // "대구광역시", "서울특별시", "경기도" 등
      const level6 = admin.find((a: any) => a.adminLevel === 6)?.name || ''; // "달서구", "칠곡군", "강남구" 등
      const level8 = admin.find((a: any) => a.adminLevel === 8)?.name || data.locality || ''; // "본동", "역삼동" 등

      const shortProvince = level4.replace(/특별자치시|특별자치도|광역시|특별시|도/g, '').trim();

      // "대구 달서구 본동", "서울 강남구 역삼동" 등
      if (shortProvince && level6 && level8) {
        return `${shortProvince} ${level6} ${level8}`;
      }
      // "달서구 본동"
      if (level6 && level8) {
        return `${level6} ${level8}`;
      }
      // "대구 달서구"
      if (shortProvince && level6) {
        return `${shortProvince} ${level6}`;
      }

      const city = data.city || '';
      const locality = data.locality || '';
      if (city && locality && !city.includes(locality)) {
        return `${city} ${locality}`;
      }
      return city || locality || level4 || null;
    } else {
      return data.locality || data.city || data.principalSubdivision || null;
    }
  } catch {
    return null;
  }
}

/**
 * 데스크톱 및 GPS 미지원 환경을 위한 초고속 IP Geolocation 자동 감지 (GeoJS & ipapi.co)
 */
export async function detectLocationViaIP(): Promise<{ lat: number; lon: number; city?: string } | null> {
  // 1차: GeoJS (초고속 오픈 무료 IP Geolocation)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon, city: data.city };
      }
    }
  } catch {
    // 1차 실패 시 2차 시도
  }

  // 2차: ipapi.co
  try {
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 3500);
    const res2 = await fetch('https://ipapi.co/json/', { signal: controller2.signal });
    clearTimeout(timeout2);
    if (res2.ok) {
      const data2 = await res2.json();
      const lat = parseFloat(data2.latitude);
      const lon = parseFloat(data2.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon, city: data2.city };
      }
    }
  } catch {
    // 2차 실패 시 무시
  }

  return null;
}

/**
 * Windows 네이티브 Wi-Fi Geolocation + 브라우저 GPS + 고정밀 IP + Reverse Geocoding
 */
export async function detectUserLocation(lang: 'ko' | 'en' = 'ko'): Promise<WeatherLocation> {
  let coords: { lat: number; lon: number } | null = null;

  // 1. Electron Windows 10/11 네이티브 Wi-Fi Geolocation 우선 시도 (동/번지 수준 10m 초고정밀)
  if (typeof window !== 'undefined' && window.electronAPI?.getNativeGeolocation) {
    try {
      const native = await window.electronAPI.getNativeGeolocation();
      if (native && !isNaN(native.latitude) && !isNaN(native.longitude)) {
        coords = { lat: native.latitude, lon: native.longitude };
      }
    } catch {
      coords = null;
    }
  }

  // 2. 브라우저 표준 Geolocation 시도 (GPS / Wi-Fi)
  if (!coords && typeof window !== 'undefined' && navigator?.geolocation) {
    try {
      coords = await new Promise<{ lat: number; lon: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { timeout: 3000, maximumAge: 300000 }
        );
      });
    } catch {
      coords = null;
    }
  }

  // 3. Geolocation 불가/거부/타임아웃 시 고정밀 IP Geolocation 수행 (광역 폴백)
  let ipCityName: string | undefined;
  if (!coords) {
    const ipGeo = await detectLocationViaIP();
    if (ipGeo) {
      coords = { lat: ipGeo.lat, lon: ipGeo.lon };
      ipCityName = ipGeo.city;
    }
  }

  // 4. 좌표 확보 시 Reverse Geocoding으로 정확한 한글 시/구/동 행정구역명 획득
  if (coords) {
    const districtName = await reverseGeocodeCoords(coords.lat, coords.lon, lang);
    const nearest = findNearestPresetCity(coords.lat, coords.lon);

    return {
      city: districtName || ipCityName || (lang === 'ko' ? nearest.nameKo : nearest.nameEn),
      latitude: Number(coords.lat.toFixed(4)),
      longitude: Number(coords.lon.toFixed(4)),
      autoDetect: true,
    };
  }

  // 5. 모든 네트워크/위치 탐색 실패 시 기본 위치 반환
  return DEFAULT_WEATHER_LOCATION;
}

/**
 * 전국 시/군/구 및 동/면/읍 또는 글로벌 도시 직접 검색 (OSM Nominatim API)
 */
export async function searchLocations(
  query: string,
  lang: 'ko' | 'en' = 'ko'
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const encoded = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&countrycodes=kr&limit=5`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': lang === 'ko' ? 'ko-KR,ko;q=0.9' : 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map((item: any, idx: number) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const addr = item.address || {};
      const cityName =
        addr.county ||
        addr.city ||
        addr.borough ||
        addr.town ||
        addr.suburb ||
        item.name ||
        trimmed;

      const province = addr.province || addr.state || '';
      const displayName =
        province && !cityName.includes(province)
          ? `${cityName} (${province})`
          : item.display_name.split(',').slice(0, 2).join(', ').trim();

      return {
        id: `search-${idx}-${item.place_id || Date.now()}`,
        displayName,
        city: cityName,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
      };
    });
  } catch {
    return [];
  }
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
