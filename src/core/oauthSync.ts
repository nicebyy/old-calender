import { CalendarEvent, OAuthProvider, SyncedAccount } from '../types';
import { OAUTH_PROVIDERS } from '../constants/oauth';

/**
 * OAuth2 인증 URL 생성 (RFC 6749)
 */
export function buildOAuthAuthorizationUrl(
  provider: OAuthProvider,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const config = OAUTH_PROVIDERS.find((p) => p.provider === provider);
  if (!config) throw new Error(`Unsupported OAuth provider: ${provider}`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline', // Refresh Token 요청
    prompt: 'consent',
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * 토큰 만료 여부 확인
 */
export function isAccountTokenExpired(account: SyncedAccount): boolean {
  if (!account.expiresAt) return false;
  // 5분 마진을 두어 조기 갱신 유도
  return Date.now() > account.expiresAt - 5 * 60 * 1000;
}

/**
 * 공급자별 원격 캘린더 동기화 데이터 생성 및 변환 (Google/Apple 시뮬레이터 & 파서)
 */
export function generateRemoteEventsForProvider(
  account: SyncedAccount,
  baseDate = new Date()
): CalendarEvent[] {
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const nextDay = new Date(baseDate);
  nextDay.setDate(baseDate.getDate() + 2);
  const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

  if (account.provider === 'google') {
    return [
      {
        id: `google-${account.id}-sync-1`,
        title: `[Google] 클라우드 아키텍처 싱크 (${account.displayName})`,
        description: 'Google Calendar API에서 동기화된 이벤트',
        startDate: `${todayStr}T13:00:00`,
        endDate: `${todayStr}T14:30:00`,
        isAllDay: false,
        categoryId: 'default-work',
        accountId: account.id,
        location: 'Google Meet',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: `google-${account.id}-sync-2`,
        title: `[Google] 개발팀 스프린트 리뷰`,
        description: '주간 산출물 점검',
        startDate: `${nextDayStr}T16:00:00`,
        endDate: `${nextDayStr}T17:00:00`,
        isAllDay: false,
        categoryId: 'default-personal',
        accountId: account.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  // Apple / iCloud
  return [
    {
      id: `apple-${account.id}-sync-1`,
      title: `[iCloud] 개인 리마인더 & 일정`,
      startDate: `${todayStr}T11:00:00`,
      endDate: `${todayStr}T12:00:00`,
      isAllDay: false,
      categoryId: 'default-personal',
      accountId: account.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * 원격 일정(Remote Events)을 로컬 일정 배열과 병합
 * 해당 계정(accountId)의 기존 원격 일정을 갱신하고, 다른 계정이나 로컬 일정은 보존
 */
export function mergeRemoteEvents(
  localEvents: CalendarEvent[],
  remoteEvents: CalendarEvent[],
  accountId: string
): CalendarEvent[] {
  // 1. 해당 계정에 속하지 않은 일정들은 그대로 유지
  const otherEvents = localEvents.filter((e) => e.accountId !== accountId);

  // 2. 해당 계정의 원격 일정을 병합
  const merged = [...otherEvents, ...remoteEvents];
  return merged;
}
