import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  findNearestPresetCity,
  getFallbackWeather,
  parseOpenMeteoCurrentWeather,
  parseOpenMeteoDailyForecast,
  getWeatherForDate,
} from './weather';
import { WeatherLocation } from '../types';

describe('Location-based Weather Core Module', () => {
  it('섭씨와 화씨 온도를 올바르게 상호 변환해야 한다', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(20)).toBe(68);
    expect(celsiusToFahrenheit(100)).toBe(212);

    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(68)).toBe(20);
  });

  it('주어진 위도/경도와 가장 가까운 프리셋 도시를 정확하게 찾아야 한다', () => {
    // 서울역 부근 (37.5547, 126.9706) -> 서울
    const seoulNear = findNearestPresetCity(37.5547, 126.9706);
    expect(seoulNear.id).toBe('seoul');
    expect(seoulNear.nameKo).toBe('서울');

    // 해운대 부근 (35.1587, 129.1604) -> 부산
    const busanNear = findNearestPresetCity(35.1587, 129.1604);
    expect(busanNear.id).toBe('busan');

    // 한라산 부근 (33.3617, 126.5292) -> 제주
    const jejuNear = findNearestPresetCity(33.3617, 126.5292);
    expect(jejuNear.id).toBe('jeju');
  });

  it('위치와 날짜에 기반한 결정론적 폴백 날씨를 정상 반환해야 한다', () => {
    const busanLocation: WeatherLocation = {
      city: '부산',
      latitude: 35.1796,
      longitude: 129.0756,
      autoDetect: false,
    };

    const weather = getFallbackWeather(new Date(2026, 9, 26), busanLocation, 'C', 'ko');
    expect(weather.locationName).toBe('부산');
    expect(weather.tempMax).toBeGreaterThanOrEqual(weather.tempMin);
    expect(weather.label).toBeDefined();
    expect(['sunny', 'partlyCloudy', 'cloudy', 'rainy', 'snowy']).toContain(weather.condition);
  });

  it('Open-Meteo 응답 데이터를 WeatherInfo 규격으로 정확하게 파싱해야 한다', () => {
    const mockOpenMeteoData = {
      current: {
        temperature_2m: 19.4,
        relative_humidity_2m: 62,
        weather_code: 0, // Clear Sky (맑음)
      },
      daily: {
        time: ['2026-10-26', '2026-10-27'],
        weather_code: [0, 61], // 맑음, 약한 비
        temperature_2m_max: [22.1, 18.5],
        temperature_2m_min: [11.2, 13.0],
      },
    };

    const current = parseOpenMeteoCurrentWeather(mockOpenMeteoData, 'C', 'ko', '서울');
    expect(current.condition).toBe('sunny');
    expect(current.label).toBe('맑음');
    expect(current.currentTemp).toBe(19);
    expect(current.locationName).toBe('서울');
    expect(current.humidity).toBe(62);

    const dailyMap = parseOpenMeteoDailyForecast(mockOpenMeteoData, 'C', 'ko', '서울');
    expect(dailyMap['2026-10-26']).toBeDefined();
    expect(dailyMap['2026-10-26'].condition).toBe('sunny');
    expect(dailyMap['2026-10-26'].tempMax).toBe(22);
    expect(dailyMap['2026-10-26'].tempMin).toBe(11);

    expect(dailyMap['2026-10-27']).toBeDefined();
    expect(dailyMap['2026-10-27'].condition).toBe('rainy');
    expect(dailyMap['2026-10-27'].tempMax).toBe(19);
  });

  it('getWeatherForDate가 캐시가 있으면 캐시를, 없으면 폴백을 반환해야 한다', () => {
    const testDate = new Date(2026, 9, 26);
    const dateKey = '2026-10-26';

    const cachedWeather = {
      condition: 'rainy' as const,
      tempMax: 15,
      tempMin: 8,
      currentTemp: 12,
      label: '비',
      locationName: '제주',
    };

    const cacheMap = {
      [dateKey]: cachedWeather,
    };

    // 캐시 있는 경우
    const fromCache = getWeatherForDate(testDate, 'C', undefined, cacheMap);
    expect(fromCache.condition).toBe('rainy');
    expect(fromCache.locationName).toBe('제주');

    // 캐시 없는 날짜인 경우 -> 폴백 생성
    const otherDate = new Date(2026, 9, 27);
    const fallback = getWeatherForDate(otherDate, 'C', undefined, cacheMap);
    expect(fallback).toBeDefined();
    expect(fallback.tempMax).toBeDefined();
  });
});
