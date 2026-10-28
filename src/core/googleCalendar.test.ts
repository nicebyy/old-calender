import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGoogleDateTime,
  formatLocalEventToGoogle,
  convertGoogleEventToLocal,
  fetchGoogleCalendarList,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  GoogleApiEvent,
} from './googleCalendar';
import { CalendarEvent } from '../types';

describe('Google Calendar API Service & Formatter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('종일 날짜(YYYY-MM-DD)와 시간 지정(dateTime)을 올바르게 파싱해야 한다', () => {
    const allDayParsed = parseGoogleDateTime({ date: '2026-10-28' });
    expect(allDayParsed.isAllDay).toBe(true);
    expect(allDayParsed.iso).toBe('2026-10-28T00:00:00');

    const timedParsed = parseGoogleDateTime({ dateTime: '2026-10-28T14:30:00+09:00' });
    expect(timedParsed.isAllDay).toBe(false);
    expect(timedParsed.iso).toContain('2026-10-28T');
  });

  it('로컬 일정을 Google API 형식으로 포맷팅할 때 종일 일정의 종료일을 익일(exclusive)로 변환해야 한다', () => {
    const allDayEvent: CalendarEvent = {
      id: 'local-1',
      title: '하루 종일 워크숍',
      startDate: '2026-10-28T00:00:00',
      endDate: '2026-10-28T00:00:00',
      isAllDay: true,
      categoryId: 'cat-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const googlePayload = formatLocalEventToGoogle(allDayEvent);
    expect(googlePayload.summary).toBe('하루 종일 워크숍');
    expect(googlePayload.start.date).toBe('2026-10-28');
    expect(googlePayload.end.date).toBe('2026-10-29');

    const timedEvent: CalendarEvent = {
      id: 'local-2',
      title: '팀 회의',
      startDate: '2026-10-28T14:00:00',
      endDate: '2026-10-28T15:00:00',
      isAllDay: false,
      categoryId: 'cat-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const timedPayload = formatLocalEventToGoogle(timedEvent);
    expect(timedPayload.summary).toBe('팀 회의');
    expect(timedPayload.start.dateTime).toBeDefined();
    expect(timedPayload.end.dateTime).toBeDefined();
  });

  it('Google API 이벤트를 로컬 CalendarEvent로 정확히 매핑해야 한다', () => {
    const googleEvent: GoogleApiEvent = {
      id: 'google-item-123',
      summary: '클라우드 프로젝트 발표',
      description: '주요 아키텍처 리뷰',
      location: 'Google Meet',
      start: { dateTime: '2026-10-28T10:00:00+09:00' },
      end: { dateTime: '2026-10-28T11:30:00+09:00' },
      created: '2026-10-20T00:00:00Z',
      updated: '2026-10-25T00:00:00Z',
    };

    const mapped = convertGoogleEventToLocal(
      googleEvent,
      'acc-test-1',
      'primary',
      'cat-acc-test-1-primary'
    );

    expect(mapped.id).toBe('g_google-item-123');
    expect(mapped.remoteEventId).toBe('google-item-123');
    expect(mapped.accountId).toBe('acc-test-1');
    expect(mapped.googleCalendarId).toBe('primary');
    expect(mapped.categoryId).toBe('cat-acc-test-1-primary');
    expect(mapped.title).toBe('클라우드 프로젝트 발표');
    expect(mapped.description).toBe('주요 아키텍처 리뷰');
    expect(mapped.location).toBe('Google Meet');
  });

  it('fetchGoogleCalendarList가 사용자의 구글 캘린더 목록을 정상적으로 가져와야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'primary',
            summary: '내 캘린더 (기본)',
            primary: true,
            backgroundColor: '#0078D7',
            accessRole: 'owner',
          },
          {
            id: 'secondary@group.calendar.google.com',
            summary: '개발팀 업무 캘린더',
            primary: false,
            backgroundColor: '#107C41',
            accessRole: 'writer',
          },
        ],
      }),
    } as any);

    const list = await fetchGoogleCalendarList('valid-token');
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('primary');
    expect(list[0].primary).toBe(true);
    expect(list[1].summary).toBe('개발팀 업무 캘린더');
  });

  it('Google API 토큰이 만료된 경우(401) GOOGLE_AUTH_EXPIRED 에러를 던져야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid Credentials' } }),
    } as any);

    await expect(fetchGoogleCalendarList('expired-token')).rejects.toThrow('GOOGLE_AUTH_EXPIRED');
  });

  it('createGoogleCalendarEvent로 새 일정을 등록하면 반환된 ID를 반환해야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'new-google-event-xyz' }),
    } as any);

    const res = await createGoogleCalendarEvent('valid-token', 'primary', {
      id: 'local-test',
      title: '새 일정',
      startDate: '2026-10-28T10:00:00',
      endDate: '2026-10-28T11:00:00',
      isAllDay: false,
      categoryId: 'cat-test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(res.id).toBe('new-google-event-xyz');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/calendars/primary/events'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchGoogleCalendarEvents가 원격 이벤트를 정상 조회하고 로컬 모델로 변환해야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'evt-1',
            summary: '주간 싱크',
            start: { dateTime: '2026-10-28T10:00:00Z' },
            end: { dateTime: '2026-10-28T11:00:00Z' },
          },
          {
            id: 'evt-2-cancelled',
            status: 'cancelled',
            summary: '취소된 미팅',
          },
        ],
      }),
    } as any);

    const events = await fetchGoogleCalendarEvents(
      'valid-token',
      'primary',
      'acc-1',
      'cat-1'
    );

    // 취소된 일정은 제외되어야 함
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('g_evt-1');
    expect(events[0].title).toBe('주간 싱크');
    expect(events[0].accountId).toBe('acc-1');
    expect(events[0].categoryId).toBe('cat-1');
  });

  it('updateGoogleCalendarEvent가 PATCH 요청을 정상 전송해야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as any);

    await updateGoogleCalendarEvent('valid-token', 'primary', 'remote-id-1', {
      id: 'local-1',
      title: '수정된 제목',
      startDate: '2026-10-28T14:00:00',
      endDate: '2026-10-28T15:00:00',
      isAllDay: false,
      categoryId: 'cat-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/calendars/primary/events/remote-id-1'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('deleteGoogleCalendarEvent가 404/410 상태 코드일 때도 성공으로 처리해야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as any);

    // 404는 이미 원격에서 삭제된 것이므로 에러를 던지지 않아야 함
    await expect(
      deleteGoogleCalendarEvent('valid-token', 'primary', 'already-deleted-id')
    ).resolves.not.toThrow();
  });
});
