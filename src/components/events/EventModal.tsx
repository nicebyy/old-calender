import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlignLeft,
  RotateCw,
  Bell,
  BellRing,
  Users,
  Lock,
  Activity,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { formatDateKey } from '../../core/calendar';
import { RECURRENCE_OPTIONS, REMINDER_OPTIONS } from '../../constants/settings';
import { RecurrenceType, BusyStatusType } from '../../types';
import { useTranslation } from '../../locales';

const BUSY_STATUS_OPTIONS: BusyStatusType[] = ['busy', 'free', 'tentative', 'away'];

export const EventModal: React.FC = () => {
  const isOpen = useCalendarStore((s) => s.isEventModalOpen);
  const editingEvent = useCalendarStore((s) => s.editingEvent);
  const defaultDate = useCalendarStore((s) => s.quickPopover.date || s.selectedDate);
  const categories = useCalendarStore((s) => s.categories);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const closeModal = useCalendarStore((s) => s.closeEventModal);
  const triggerReminderNotification = useCalendarStore((s) => s.triggerReminderNotification);

  const { t, language } = useTranslation();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('11:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'default-personal');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [busyStatus, setBusyStatus] = useState<BusyStatusType>('busy');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setStartDate(editingEvent.startDate.slice(0, 10));
      setStartTime(editingEvent.startDate.slice(11, 16) || '10:00');
      setEndDate(editingEvent.endDate.slice(0, 10));
      setEndTime(editingEvent.endDate.slice(11, 16) || '11:00');
      setIsAllDay(editingEvent.isAllDay);
      setCategoryId(editingEvent.categoryId);
      setLocation(editingEvent.location || '');
      setDescription(editingEvent.description || '');
      setRecurrence(editingEvent.recurrence || 'none');
      setReminderMinutes(
        editingEvent.reminderMinutes !== undefined ? editingEvent.reminderMinutes : 15
      );
      setBusyStatus(editingEvent.busyStatus || 'busy');
      setAttendeesInput(editingEvent.attendees ? editingEvent.attendees.join(', ') : '');
      setIsPrivate(!!editingEvent.isPrivate);
    } else {
      const dateStr = formatDateKey(defaultDate);
      setTitle('');
      setStartDate(dateStr);
      setStartTime('10:00');
      setEndDate(dateStr);
      setEndTime('11:00');
      setIsAllDay(false);
      setCategoryId(categories[0]?.id || 'default-personal');
      setLocation('');
      setDescription('');
      setRecurrence('none');
      setReminderMinutes(15);
      setBusyStatus('busy');
      setAttendeesInput('');
      setIsPrivate(false);
    }
  }, [editingEvent, defaultDate, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = isAllDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
    const endISO = isAllDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`;

    const attendees = attendeesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const eventPayload = {
      title: title.trim(),
      startDate: startISO,
      endDate: endISO,
      isAllDay,
      categoryId,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      recurrence,
      reminderMinutes,
      busyStatus,
      attendees: attendees.length > 0 ? attendees : undefined,
      isPrivate,
    };

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        ...eventPayload,
      });
    } else {
      addEvent(eventPayload);
    }
  };

  const handleDelete = () => {
    if (editingEvent) {
      if (confirm(t('event.deleteConfirm'))) {
        deleteEvent(editingEvent.id);
      }
    }
  };

  const handleTestReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    const startISO = isAllDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
    const endISO = isAllDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`;

    triggerReminderNotification({
      id: editingEvent?.id || `preview-${Date.now()}`,
      title: title.trim() || t('event.testReminderTitle'),
      startDate: startISO,
      endDate: endISO,
      isAllDay,
      categoryId,
      location: location.trim() || undefined,
      reminderMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const getCategoryDisplayName = (id: string, name: string) => {
    if (language === 'en') {
      if (id === 'default-personal') return 'Personal';
      if (id === 'default-work') return 'Work';
      if (id === 'default-holiday') return 'Holidays';
      if (id === 'default-birthday') return 'Birthdays';
    }
    return name;
  };

  const getBusyStatusLabel = (status: BusyStatusType) => {
    switch (status) {
      case 'busy':
        return t('event.busyStatusBusy');
      case 'free':
        return t('event.busyStatusFree');
      case 'tentative':
        return t('event.busyStatusTentative');
      case 'away':
        return t('event.busyStatusAway');
      default:
        return status;
    }
  };

  const getRecurrenceLabel = (rec: RecurrenceType) => {
    switch (rec) {
      case 'none':
        return t('event.recurrenceNone');
      case 'daily':
        return t('event.recurrenceDaily');
      case 'weekly':
        return t('event.recurrenceWeekly');
      case 'monthly':
        return t('event.recurrenceMonthly');
      case 'yearly':
        return t('event.recurrenceYearly');
      default:
        return rec;
    }
  };

  const getReminderLabel = (minutes: number) => {
    switch (minutes) {
      case -1:
        return t('event.reminderNone');
      case 0:
        return t('event.reminderAtTime');
      case 15:
        return t('event.reminder15m');
      case 30:
        return t('event.reminder30m');
      case 60:
        return t('event.reminder1h');
      case 1440:
        return t('event.reminder1d');
      default:
        return `${minutes}m`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none print:hidden">
      <div className="w-[500px] max-h-[90vh] bg-[var(--win10-modal-bg)] border border-[var(--win10-border)] rounded shadow-2xl overflow-hidden flex flex-col text-[var(--win10-text-primary)] transition-colors">
        {/* 모달 헤더 */}
        <div className="h-10 bg-[var(--win10-surface)] border-b border-[var(--win10-border)] flex items-center justify-between px-3 shrink-0">
          <div className="text-xs font-semibold text-[var(--win10-text-primary)] flex items-center space-x-2">
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--win10-accent)]" />
            <span>{editingEvent ? t('event.editTitle') : t('event.newTitle')}</span>
          </div>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-[#e81123] rounded transition-colors text-[var(--win10-text-secondary)] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 본문 (스크롤 지원) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {/* 이벤트 제목 */}
          <div>
            <input
              type="text"
              required
              autoFocus
              placeholder={t('event.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] focus:border-[var(--win10-accent)] outline-none text-sm text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)] rounded"
            />
          </div>

          {/* 종일 여부 및 비공개 토글 */}
          <div className="flex items-center space-x-5 text-[var(--win10-text-secondary)]">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="accent-[var(--win10-accent)] w-3.5 h-3.5"
              />
              <span>{t('event.allDayToggle')}</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-[var(--win10-accent)] w-3.5 h-3.5"
              />
              <Lock className="w-3 h-3 text-[var(--win10-text-muted)]" />
              <span>{t('event.privateEvent')}</span>
            </label>
          </div>

          {/* 시작 및 종료 일시 */}
          <div className="space-y-2 bg-[var(--win10-card-bg)] p-2.5 rounded border border-[var(--win10-border)]">
            {/* 시작일 */}
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
              <span className="w-12 text-[var(--win10-text-secondary)]">{t('event.startDate')}:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1 rounded text-[var(--win10-text-primary)] outline-none"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1 rounded text-[var(--win10-text-primary)] outline-none"
                />
              )}
            </div>

            {/* 종료일 */}
            <div className="flex items-center space-x-2">
              <div className="w-3.5" />
              <span className="w-12 text-[var(--win10-text-secondary)]">{t('event.endDate')}:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1 rounded text-[var(--win10-text-primary)] outline-none"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1 rounded text-[var(--win10-text-primary)] outline-none"
                />
              )}
            </div>
          </div>

          {/* 캘린더 범주 & 상태 표시 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-12 text-[var(--win10-text-secondary)]">{t('event.calendarSelect')}:</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1.5 rounded text-[var(--win10-text-primary)] outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[var(--win10-surface)] text-[var(--win10-text-primary)]">
                    {getCategoryDisplayName(c.id, c.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* 표시 상태 (바쁨 / 한가함) */}
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
              <select
                value={busyStatus}
                onChange={(e) => setBusyStatus(e.target.value as BusyStatusType)}
                className="flex-1 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1.5 rounded text-[var(--win10-text-primary)] outline-none cursor-pointer"
              >
                {BUSY_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-[var(--win10-surface)] text-[var(--win10-text-primary)]">
                    {getBusyStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 반복 주기 & 미리 알림 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1.5">
              <RotateCw className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="flex-1 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1.5 rounded text-[var(--win10-text-primary)] outline-none cursor-pointer"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[var(--win10-surface)] text-[var(--win10-text-primary)]">
                    {getRecurrenceLabel(opt.id as RecurrenceType)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="flex-1 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] px-2 py-1.5 rounded text-[var(--win10-text-primary)] outline-none cursor-pointer text-xs"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes} className="bg-[var(--win10-surface)] text-[var(--win10-text-primary)]">
                    {getReminderLabel(opt.minutes)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleTestReminder}
                className="p-1.5 rounded bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] border border-[var(--win10-border)] text-[var(--win10-text-secondary)] hover:text-[var(--win10-accent)] transition-colors shrink-0"
                title={t('event.testReminderButton')}
              >
                <BellRing className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 위치 입력 */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
            <input
              type="text"
              placeholder={t('event.locationPlaceholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] focus:border-[var(--win10-accent)] outline-none text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)] rounded"
            />
          </div>

          {/* 참석자 초대 (이메일 쉼표 구분) */}
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-[var(--win10-text-muted)] shrink-0" />
            <input
              type="text"
              placeholder={t('event.attendeesPlaceholder')}
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] focus:border-[var(--win10-accent)] outline-none text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)] rounded"
            />
          </div>

          {/* 설명 입력 */}
          <div className="flex items-start space-x-2">
            <AlignLeft className="w-3.5 h-3.5 text-[var(--win10-text-muted)] mt-2 shrink-0" />
            <textarea
              rows={2}
              placeholder={t('event.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] focus:border-[var(--win10-accent)] outline-none text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)] rounded resize-none"
            />
          </div>

          {/* 하단 액션 버튼 바 */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--win10-border)]">
            {editingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#ff5555] hover:bg-[#e81123]/20 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('event.delete')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-xs bg-[var(--win10-card-bg)] hover:bg-[var(--win10-button-hover)] text-[var(--win10-text-primary)] border border-[var(--win10-border)] rounded transition-colors"
              >
                {t('event.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-semibold bg-[var(--win10-accent)] hover:opacity-90 active:opacity-80 text-white rounded transition-opacity shadow"
              >
                {t('event.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
