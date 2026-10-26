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
  Users,
  Lock,
  Activity,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { formatDateKey } from '../../core/calendar';
import { RECURRENCE_OPTIONS, REMINDER_OPTIONS } from '../../constants/settings';
import { RecurrenceType, BusyStatusType } from '../../types';

const BUSY_STATUS_OPTIONS: { id: BusyStatusType; label: string }[] = [
  { id: 'busy', label: '약속 있음 (바쁨)' },
  { id: 'free', label: '한가함' },
  { id: 'tentative', label: '임시 일정' },
  { id: 'away', label: '다른 곳에 있음' },
];

export const EventModal: React.FC = () => {
  const isOpen = useCalendarStore((s) => s.isEventModalOpen);
  const editingEvent = useCalendarStore((s) => s.editingEvent);
  const defaultDate = useCalendarStore((s) => s.quickPopover.date || s.selectedDate);
  const categories = useCalendarStore((s) => s.categories);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const closeModal = useCalendarStore((s) => s.closeEventModal);

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
      deleteEvent(editingEvent.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none print:hidden">
      <div className="w-[500px] max-h-[90vh] bg-[var(--win10-modal-bg)] border border-[var(--win10-border)] rounded shadow-2xl overflow-hidden flex flex-col text-[var(--win10-text-primary)] transition-colors">
        {/* 모달 헤더 */}
        <div className="h-10 bg-[var(--win10-surface)] border-b border-[var(--win10-border)] flex items-center justify-between px-3 shrink-0">
          <div className="text-xs font-semibold text-[var(--win10-text-primary)] flex items-center space-x-2">
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--win10-accent)]" />
            <span>{editingEvent ? '이벤트 편집' : '새 이벤트'}</span>
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
              placeholder="이벤트 이름 추가"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--win10-input-bg)] border border-[var(--win10-border)] focus:border-[var(--win10-accent)] outline-none text-sm text-[var(--win10-text-primary)] placeholder-[var(--win10-text-muted)] rounded"
            />
          </div>

          {/* 종일 여부 및 비공개 토글 */}
          <div className="flex items-center space-x-5 text-[#cccccc]">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="accent-[#0078d7] w-3.5 h-3.5"
              />
              <span>종일</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-[#0078d7] w-3.5 h-3.5"
              />
              <Lock className="w-3 h-3 text-[#aaaaaa]" />
              <span>비공개</span>
            </label>
          </div>

          {/* 시작 및 종료 일시 */}
          <div className="space-y-2 bg-[#222222] p-2.5 rounded border border-[#333333]">
            {/* 시작일 */}
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <span className="w-12 text-[#aaaaaa]">시작:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#1f1f1f] border border-[#444444] px-2 py-1 rounded text-white outline-none"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#1f1f1f] border border-[#444444] px-2 py-1 rounded text-white outline-none"
                />
              )}
            </div>

            {/* 종료일 */}
            <div className="flex items-center space-x-2">
              <div className="w-3.5" />
              <span className="w-12 text-[#aaaaaa]">종료:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#1f1f1f] border border-[#444444] px-2 py-1 rounded text-white outline-none"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[#1f1f1f] border border-[#444444] px-2 py-1 rounded text-white outline-none"
                />
              )}
            </div>
          </div>

          {/* 캘린더 범주 & 상태 표시 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-12 text-[#aaaaaa]">캘린더:</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 bg-[#1f1f1f] border border-[#444444] px-2 py-1.5 rounded text-white outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 표시 상태 (바쁨 / 한가함) */}
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <select
                value={busyStatus}
                onChange={(e) => setBusyStatus(e.target.value as BusyStatusType)}
                className="flex-1 bg-[#1f1f1f] border border-[#444444] px-2 py-1.5 rounded text-white outline-none cursor-pointer"
              >
                {BUSY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 반복 주기 & 미리 알림 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1.5">
              <RotateCw className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="flex-1 bg-[#1f1f1f] border border-[#444444] px-2 py-1.5 rounded text-white outline-none cursor-pointer"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="flex-1 bg-[#1f1f1f] border border-[#444444] px-2 py-1.5 rounded text-white outline-none cursor-pointer"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.minutes} value={opt.minutes}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 위치 입력 */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            <input
              type="text"
              placeholder="위치 추가"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[#1f1f1f] border border-[#444444] focus:border-[#0078d7] outline-none text-white placeholder-[#888888] rounded"
            />
          </div>

          {/* 참석자 초대 (이메일 쉼표 구분) */}
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            <input
              type="text"
              placeholder="참석자 초대 (쉼표로 구분된 이메일)"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[#1f1f1f] border border-[#444444] focus:border-[#0078d7] outline-none text-white placeholder-[#888888] rounded"
            />
          </div>

          {/* 설명 입력 */}
          <div className="flex items-start space-x-2">
            <AlignLeft className="w-3.5 h-3.5 text-[#888888] mt-2 shrink-0" />
            <textarea
              rows={2}
              placeholder="설명 추가"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[#1f1f1f] border border-[#444444] focus:border-[#0078d7] outline-none text-white placeholder-[#888888] rounded resize-none"
            />
          </div>

          {/* 하단 액션 버튼 바 */}
          <div className="pt-2 flex items-center justify-between border-t border-[#383838]">
            {editingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-[#ff5555] hover:bg-[#3d2424] rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-xs bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#dddddd] rounded transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white rounded transition-colors shadow"
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
