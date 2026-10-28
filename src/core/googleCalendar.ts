import { CalendarEvent } from '../types';

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface GoogleEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleApiEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  recurrence?: string[];
  updated?: string;
  created?: string;
}

/**
 * Google 날짜/시간 객체를 로컬 ISO 형식(YYYY-MM-DDTHH:mm:ss)으로 변환
 */
export function parseGoogleDateTime(dt: GoogleEventDateTime): { iso: string; isAllDay: boolean } {
  if (dt.date) {
    // 종일 일정 (YYYY-MM-DD)
    return { iso: `${dt.date}T00:00:00`, isAllDay: true };
  }
  if (dt.dateTime) {
    const d = new Date(dt.dateTime);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return {
        iso: `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`,
        isAllDay: false,
      };
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  return { iso: `${today}T00:00:00`, isAllDay: true };
}

/**
 * 로컬 CalendarEvent를 Google Calendar API 요청 본문 형식으로 변환
 */
export function formatLocalEventToGoogle(event: CalendarEvent): {
  summary: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
} {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  if (event.isAllDay) {
    const startDate = event.startDate.slice(0, 10);
    const rawEnd = event.endDate ? event.endDate.slice(0, 10) : startDate;

    // Google Calendar API에서 종일 일정의 종료일(end.date)은 exclusive(해당 날짜 자정 미포함)이므로
    // 시작일과 종료일이 같으면 다음 날짜를 end.date로 지정해야 온전한 1일로 등록됨
    const endD = new Date(rawEnd);
    endD.setDate(endD.getDate() + 1);
    const nextDayStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

    return {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: { date: startDate },
      end: { date: nextDayStr },
    };
  }

  // 일반 시간 지정 일정
  const startD = new Date(event.startDate);
  const endD = new Date(event.endDate || event.startDate);

  return {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: isNaN(startD.getTime()) ? new Date().toISOString() : startD.toISOString(),
      timeZone,
    },
    end: {
      dateTime: isNaN(endD.getTime()) ? new Date().toISOString() : endD.toISOString(),
      timeZone,
    },
  };
}

/**
 * Google API Event를 로컬 CalendarEvent 모델로 변환
 */
export function convertGoogleEventToLocal(
  item: GoogleApiEvent,
  accountId: string,
  calendarId: string,
  categoryId: string
): CalendarEvent {
  const startParsed = parseGoogleDateTime(item.start);
  const endParsed = parseGoogleDateTime(item.end);

  let endDate = endParsed.iso;
  // 종일 일정의 경우 Google의 exclusive 익일 자정을 다시 당일 23:59:59로 조정
  if (startParsed.isAllDay && endParsed.isAllDay && item.end.date) {
    const googleEnd = new Date(item.end.date);
    googleEnd.setDate(googleEnd.getDate() - 1);
    const y = googleEnd.getFullYear();
    const m = String(googleEnd.getMonth() + 1).padStart(2, '0');
    const d = String(googleEnd.getDate()).padStart(2, '0');
    endDate = `${y}-${m}-${d}T00:00:00`;
  }

  return {
    id: `g_${item.id}`,
    title: item.summary || '(제목 없음)',
    description: item.description || undefined,
    location: item.location || undefined,
    startDate: startParsed.iso,
    endDate: endDate || startParsed.iso,
    isAllDay: startParsed.isAllDay,
    categoryId,
    accountId,
    googleCalendarId: calendarId,
    remoteEventId: item.id,
    createdAt: item.created ? new Date(item.created).getTime() : Date.now(),
    updatedAt: item.updated ? new Date(item.updated).getTime() : Date.now(),
  };
}

/**
 * 사용자의 Google 계정에 속한 전체 캘린더 목록 조회 (기본 + 보조 + 공유 캘린더)
 */
export async function fetchGoogleCalendarList(accessToken: string): Promise<GoogleCalendarItem[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new Error('GOOGLE_AUTH_EXPIRED');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google 캘린더 목록 조회 실패 (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((c: any) => ({
    id: c.id,
    summary: c.summaryOverride || c.summary || 'Google 캘린더',
    description: c.description || undefined,
    primary: Boolean(c.primary),
    backgroundColor: c.backgroundColor || '#EA4335',
    foregroundColor: c.foregroundColor || '#FFFFFF',
    accessRole: c.accessRole || 'reader',
  }));
}

/**
 * 특정 Google 캘린더의 일정 목록 가져오기
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  accountId: string,
  categoryId: string,
  options?: { timeMin?: string; timeMax?: string }
): Promise<CalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('maxResults', '2500');
  if (options?.timeMin) url.searchParams.set('timeMin', options.timeMin);
  if (options?.timeMax) url.searchParams.set('timeMax', options.timeMax);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new Error('GOOGLE_AUTH_EXPIRED');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google 일정 조회 실패 (${calendarId}: HTTP ${res.status})`
    );
  }

  const data = await res.json();
  const items: GoogleApiEvent[] = data.items || [];

  // 취소된 일정 제외 후 로컬 모델 변환
  return items
    .filter((item) => item.status !== 'cancelled' && item.start)
    .map((item) => convertGoogleEventToLocal(item, accountId, calendarId, categoryId));
}

/**
 * Google 캘린더에 새 일정 생성 (양방향 쓰기)
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<{ id: string }> {
  const payload = formatLocalEventToGoogle(event);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 401) {
    throw new Error('GOOGLE_AUTH_EXPIRED');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google 일정 생성 실패 (HTTP ${res.status})`
    );
  }

  const created = await res.json();
  return { id: created.id };
}

/**
 * Google 캘린더의 일정 수정 (양방향 쓰기)
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  remoteEventId: string,
  event: CalendarEvent
): Promise<void> {
  const payload = formatLocalEventToGoogle(event);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(remoteEventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 401) {
    throw new Error('GOOGLE_AUTH_EXPIRED');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google 일정 수정 실패 (HTTP ${res.status})`
    );
  }
}

/**
 * Google 캘린더의 일정 삭제 (양방향 쓰기)
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  remoteEventId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(remoteEventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (res.status === 401) {
    throw new Error('GOOGLE_AUTH_EXPIRED');
  }

  // 404 or 410 means already deleted on Google, so we treat it as success
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Google 일정 삭제 실패 (HTTP ${res.status})`
    );
  }
}
