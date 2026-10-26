import { CalendarEvent } from '../types';

export interface DueReminderResult {
  event: CalendarEvent;
  title: string;
  body: string;
  reminderTime: number;
}

/**
 * 이벤트의 알림 예정 시각(ms) 계산
 */
export function calculateReminderTime(event: CalendarEvent): number | null {
  if (event.reminderMinutes === undefined || event.reminderMinutes < 0) {
    return null;
  }

  const startMs = new Date(event.startDate).getTime();
  if (isNaN(startMs)) return null;

  return startMs - event.reminderMinutes * 60 * 1000;
}

/**
 * Windows 10 UWP 스타일 알림 메시지 텍스트 포맷팅
 */
export function formatReminderMessage(event: CalendarEvent): { title: string; body: string } {
  const title = `[일정 알림] ${event.title}`;

  const timePart = event.isAllDay
    ? '종일 일정'
    : `${event.startDate.slice(11, 16)} ~ ${event.endDate.slice(11, 16)}`;

  let relativeTimeStr = '';
  if (event.reminderMinutes === 0) {
    relativeTimeStr = '지금 시작';
  } else if (event.reminderMinutes && event.reminderMinutes > 0) {
    if (event.reminderMinutes >= 1440) {
      relativeTimeStr = `${Math.floor(event.reminderMinutes / 1440)}일 후 시작`;
    } else if (event.reminderMinutes >= 60) {
      relativeTimeStr = `${Math.floor(event.reminderMinutes / 60)}시간 후 시작`;
    } else {
      relativeTimeStr = `${event.reminderMinutes}분 후 시작`;
    }
  }

  const bodyParts = [relativeTimeStr, timePart].filter(Boolean);
  if (event.location) {
    bodyParts.push(`장소: ${event.location}`);
  }

  return {
    title,
    body: bodyParts.join(' | '),
  };
}

/**
 * 현재 시각 기준으로 알림을 발송해야 하는 일정 목록 추출
 * @param events 전체 등록 일정
 * @param currentTime 현재 기준 시각
 * @param notifiedMap 이미 알림이 전송된 기록 { [eventId]: lastNotifiedReminderTime }
 */
export function getDueReminders(
  events: CalendarEvent[],
  currentTime: Date,
  notifiedMap: Record<string, number> = {}
): DueReminderResult[] {
  const nowMs = currentTime.getTime();
  const results: DueReminderResult[] = [];

  for (const evt of events) {
    const reminderTime = calculateReminderTime(evt);
    if (reminderTime === null) continue;

    const endMs = new Date(evt.endDate).getTime();

    // 1. 이미 지난 지 1시간 이상 된 과거 일정은 알림 제외
    if (nowMs > endMs + 60 * 60 * 1000) {
      continue;
    }

    // 2. 알림 시간이 아직 도래하지 않았으면 제외
    if (nowMs < reminderTime) {
      continue;
    }

    // 3. 이미 이 알림 시점에 대해 발송된 기록이 있으면 중복 발송 방지
    const lastNotified = notifiedMap[evt.id];
    if (lastNotified && lastNotified >= reminderTime) {
      continue;
    }

    const { title, body } = formatReminderMessage(evt);
    results.push({
      event: evt,
      title,
      body,
      reminderTime,
    });
  }

  return results;
}
