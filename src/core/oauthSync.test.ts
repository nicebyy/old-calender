import { describe, it, expect } from 'vitest';
import {
  buildOAuthAuthorizationUrl,
  isAccountTokenExpired,
  generateRemoteEventsForProvider,
  mergeRemoteEvents,
} from './oauthSync';
import { CalendarEvent, SyncedAccount } from '../types';

describe('OAuth2 Calendar Sync Core Engine', () => {
  it('Google 및 Microsoft OAuth2 인가 URL을 표준 형식으로 생성해야 한다', () => {
    const googleUrl = buildOAuthAuthorizationUrl(
      'google',
      'client-1234',
      'http://localhost:5173/oauth/callback',
      'state-xyz'
    );
    expect(googleUrl).toContain('accounts.google.com');
    expect(googleUrl).toContain('client_id=client-1234');
    expect(googleUrl).toContain('response_type=code');

    const msUrl = buildOAuthAuthorizationUrl(
      'microsoft',
      'ms-client-5678',
      'http://localhost:5173/oauth/callback',
      'state-abc'
    );
    expect(msUrl).toContain('login.microsoftonline.com');
    expect(msUrl).toContain('client_id=ms-client-5678');
  });

  it('토큰 만료 시간(expiresAt)을 정확히 판정해야 한다', () => {
    const now = Date.now();

    const expiredAccount: SyncedAccount = {
      id: 'acc-1',
      provider: 'google',
      email: 'test@gmail.com',
      displayName: '테스터',
      expiresAt: now - 1000, // 이미 만료됨
      syncStatus: 'idle',
      color: '#EA4335',
      isEnabled: true,
    };

    const validAccount: SyncedAccount = {
      id: 'acc-2',
      provider: 'google',
      email: 'test2@gmail.com',
      displayName: '테스터2',
      expiresAt: now + 3600 * 1000, // 1시간 뒤 만료
      syncStatus: 'idle',
      color: '#EA4335',
      isEnabled: true,
    };

    expect(isAccountTokenExpired(expiredAccount)).toBe(true);
    expect(isAccountTokenExpired(validAccount)).toBe(false);
  });

  it('원격 캘린더 이벤트를 로컬 이벤트 배열과 원자적으로 병합해야 한다', () => {
    const localEvents: CalendarEvent[] = [
      {
        id: 'local-1',
        title: '로컬 개인 일정',
        startDate: '2026-10-26T10:00:00',
        endDate: '2026-10-26T11:00:00',
        isAllDay: false,
        categoryId: 'default-personal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'old-google-1',
        title: '이전 동기화된 구글 일정',
        startDate: '2026-10-26T12:00:00',
        endDate: '2026-10-26T13:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        accountId: 'acc-google-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const newRemoteEvents: CalendarEvent[] = [
      {
        id: 'new-google-2',
        title: '새로 갱신된 구글 일정',
        startDate: '2026-10-26T15:00:00',
        endDate: '2026-10-26T16:00:00',
        isAllDay: false,
        categoryId: 'default-work',
        accountId: 'acc-google-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const merged = mergeRemoteEvents(localEvents, newRemoteEvents, 'acc-google-1');

    // 로컬 일정은 그대로 보존되어야 함
    expect(merged.some((e) => e.id === 'local-1')).toBe(true);
    // 이전 구글 일정은 교체되어야 함
    expect(merged.some((e) => e.id === 'old-google-1')).toBe(false);
    // 새 구글 일정이 추가되어야 함
    expect(merged.some((e) => e.id === 'new-google-2')).toBe(true);
    expect(merged.length).toBe(2);
  });
});
