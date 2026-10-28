import React, { useState } from 'react';
import {
  X,
  Globe,
  Cloud,
  RotateCw,
  Trash2,
  Plus,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  SlidersHorizontal,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { OAUTH_PROVIDERS } from '../../constants/oauth';
import { OAuthProvider, SyncedAccountCalendar } from '../../types';
import { useTranslation } from '../../locales';
import { fetchGoogleCalendarList } from '../../core/googleCalendar';

type ModalView = 'list' | 'google-setup' | 'google-auth-wait' | 'calendar-select' | 'manual-form';

export const AccountModal: React.FC = () => {
  const isOpen = useCalendarStore((s) => s.isAccountModalOpen);
  const closeModal = useCalendarStore((s) => s.closeAccountModal);
  const syncedAccounts = useCalendarStore((s) => s.syncedAccounts);
  const addSyncedAccount = useCalendarStore((s) => s.addSyncedAccount);
  const removeSyncedAccount = useCalendarStore((s) => s.removeSyncedAccount);
  const syncAccount = useCalendarStore((s) => s.syncAccount);
  const updateAccountCalendars = useCalendarStore((s) => s.updateAccountCalendars);
  const settings = useCalendarStore((s) => s.settings);
  const setGoogleOAuthConfig = useCalendarStore((s) => s.setGoogleOAuthConfig);

  const { t, language } = useTranslation();

  const [view, setView] = useState<ModalView>('list');
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);

  // Google OAuth Client ID & Secret
  const [clientIdInput, setClientIdInput] = useState(settings.googleOAuth?.clientId || '');
  const [clientSecretInput, setClientSecretInput] = useState(settings.googleOAuth?.clientSecret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Google OAuth 실행 상태
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUserInfo, setAuthUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [authTokens, setAuthTokens] = useState<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  } | null>(null);

  // 캘린더 선택 상태
  const [fetchedCalendars, setFetchedCalendars] = useState<SyncedAccountCalendar[]>([]);
  const [isFetchingCalendars, setIsFetchingCalendars] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // 수동/기타 계정 폼
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setView('list');
    setSelectedProvider(null);
    setAuthError(null);
    setEditingAccountId(null);
    closeModal();
  };

  const handleProviderClick = (provider: OAuthProvider) => {
    setSelectedProvider(provider);
    setAuthError(null);

    if (provider === 'google') {
      const configuredId = settings.googleOAuth?.clientId || clientIdInput.trim();
      if (!configuredId) {
        setView('google-setup');
      } else {
        startGoogleAuthFlow(configuredId, settings.googleOAuth?.clientSecret || clientSecretInput.trim());
      }
    } else {
      setManualEmail('');
      setManualName('');
      setView('manual-form');
    }
  };

  const handleSaveGoogleConfigAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;

    setGoogleOAuthConfig({
      clientId: clientIdInput.trim(),
      clientSecret: clientSecretInput.trim(),
    });

    startGoogleAuthFlow(clientIdInput.trim(), clientSecretInput.trim());
  };

  const startGoogleAuthFlow = async (clientId: string, clientSecret?: string) => {
    setView('google-auth-wait');
    setAuthError(null);

    if (typeof window !== 'undefined' && window.electronAPI?.startGoogleOAuth) {
      try {
        const result = await window.electronAPI.startGoogleOAuth({
          clientId,
          clientSecret,
        });

        if (result.success && result.tokens?.accessToken) {
          const email = result.userInfo?.email || 'Google 계정';
          const name = result.userInfo?.name || email;
          setAuthUserInfo({ email, name });
          setAuthTokens({
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresAt: result.tokens.expiresAt,
          });

          // Google Calendar API로 사용자의 전체 캘린더 목록 조회
          setIsFetchingCalendars(true);
          try {
            const calendars = await fetchGoogleCalendarList(result.tokens.accessToken);
            const mapped: SyncedAccountCalendar[] = calendars.map((c) => ({
              id: c.id,
              name: c.summary,
              color: c.backgroundColor || '#EA4335',
              isPrimary: c.primary,
              isSelected: true, // 기본 전체 선택
              accessRole: c.accessRole,
            }));
            setFetchedCalendars(mapped);
            setView('calendar-select');
          } catch (err: any) {
            setAuthError(err?.message || '구글 캘린더 목록을 불러오지 못했습니다.');
          } finally {
            setIsFetchingCalendars(false);
          }
        } else {
          setAuthError(result.error || 'Google 로그인 인증에 실패했습니다.');
        }
      } catch (err: any) {
        setAuthError(err?.message || '인증 프로세스 실행 중 오류가 발생했습니다.');
      }
    } else {
      // Electron API 미지원 환경 (웹 개발 모드 fallback)
      setAuthError('Electron 데스크톱 환경에서만 구글 루프백 인증이 지원됩니다.');
    }
  };

  const handleToggleCalendar = (calendarId: string) => {
    setFetchedCalendars((prev) =>
      prev.map((c) => (c.id === calendarId ? { ...c, isSelected: !c.isSelected } : c))
    );
  };

  const handleSelectAllCalendars = (selectAll: boolean) => {
    setFetchedCalendars((prev) => prev.map((c) => ({ ...c, isSelected: selectAll })));
  };

  const handleConfirmCalendars = async () => {
    const selected = fetchedCalendars.filter((c) => c.isSelected);
    if (selected.length === 0) {
      alert(language === 'ko' ? '최소 하나 이상의 캘린더를 선택해 주세요.' : 'Please select at least one calendar.');
      return;
    }

    if (editingAccountId) {
      // 기존 계정의 캘린더 구성 수정
      await updateAccountCalendars(editingAccountId, fetchedCalendars);
      setEditingAccountId(null);
      setView('list');
    } else if (authTokens && authUserInfo) {
      // 새 계정 추가
      addSyncedAccount('google', authUserInfo.email, authUserInfo.name, {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: authTokens.expiresAt,
        calendars: fetchedCalendars,
      });
      setView('list');
      setSelectedProvider(null);
    }
  };

  const handleOpenCalendarManagement = async (account: (typeof syncedAccounts)[0]) => {
    setEditingAccountId(account.id);
    setAuthUserInfo({ email: account.email, name: account.displayName });

    if (account.calendars && account.calendars.length > 0) {
      setFetchedCalendars(account.calendars);
      setView('calendar-select');
    } else if (account.accessToken) {
      setIsFetchingCalendars(true);
      try {
        const calendars = await fetchGoogleCalendarList(account.accessToken);
        const mapped: SyncedAccountCalendar[] = calendars.map((c) => ({
          id: c.id,
          name: c.summary,
          color: c.backgroundColor || '#EA4335',
          isPrimary: c.primary,
          isSelected: true,
          accessRole: c.accessRole,
        }));
        setFetchedCalendars(mapped);
        setView('calendar-select');
      } catch {
        alert(language === 'ko' ? '캘린더 목록을 불러오지 못했습니다. 계정을 다시 동기화해 주세요.' : 'Failed to fetch calendars.');
      } finally {
        setIsFetchingCalendars(false);
      }
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !manualEmail.trim()) return;

    setIsManualSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    addSyncedAccount(
      selectedProvider,
      manualEmail.trim(),
      manualName.trim() || (selectedProvider === 'apple' ? 'iCloud 캘린더' : '캘린더 계정')
    );

    setIsManualSubmitting(false);
    setSelectedProvider(null);
    setView('list');
  };

  const renderProviderIcon = (provider: OAuthProvider) => {
    switch (provider) {
      case 'google':
        return <Globe className="w-4 h-4 text-[#ea4335]" />;
      case 'apple':
        return <Cloud className="w-4 h-4 text-[#a2aaad]" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none print:hidden">
      <div className="w-[500px] max-w-[92vw] bg-[#262626] border border-[#444444] rounded shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-150">
        {/* 모달 헤더 (Windows 10 스타일) */}
        <div className="h-11 bg-[#202020] border-b border-[#333333] flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-white">
              {view === 'google-setup'
                ? t('sync.googleSetupTitle')
                : view === 'google-auth-wait'
                ? t('sync.googleAuthWaitingTitle')
                : view === 'calendar-select'
                ? t('sync.selectCalendarsTitle')
                : view === 'manual-form'
                ? (language === 'ko' ? '계정 로그인 및 연결' : 'Sign in & Connect')
                : t('sync.title')}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[#e81123] rounded transition-colors text-[#aaaaaa] hover:text-white"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 space-y-4 max-h-[560px] overflow-y-auto text-xs">
          {/* VIEW 1: 기본 계정 목록 및 공급자 선택 */}
          {view === 'list' && (
            <>
              {/* 연동된 계정 목록 */}
              {syncedAccounts.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-[#383838]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider block">
                      {t('sync.connectedAccounts')} ({syncedAccounts.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {syncedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded bg-[#1e1e1e] border border-[#333333] hover:border-[#444444] transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                            {renderProviderIcon(acc.provider)}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white truncate text-[12.5px]">
                                {acc.displayName}
                              </div>
                              <div className="text-[10.5px] text-[#888888] truncate">{acc.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {/* 캘린더 관리 버튼 (Google 계정) */}
                            {acc.provider === 'google' && (
                              <button
                                onClick={() => handleOpenCalendarManagement(acc)}
                                className="p-1.5 rounded hover:bg-[#333333] text-[#aaaaaa] hover:text-[#0078d7] transition-colors"
                                title={t('sync.manageCalendars')}
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 동기화 버튼 */}
                            <button
                              onClick={() => syncAccount(acc.id)}
                              disabled={acc.syncStatus === 'syncing'}
                              className="p-1.5 rounded hover:bg-[#333333] text-[#aaaaaa] hover:text-white transition-colors"
                              title={t('sync.syncNow')}
                            >
                              <RotateCw
                                className={`w-3.5 h-3.5 ${
                                  acc.syncStatus === 'syncing' ? 'animate-spin text-[#0078d7]' : ''
                                }`}
                              />
                            </button>

                            {/* 계정 제거 버튼 */}
                            <button
                              onClick={() => removeSyncedAccount(acc.id)}
                              className="p-1.5 rounded hover:bg-[#3d2424] text-[#888888] hover:text-[#ff6b6b] transition-colors"
                              title={t('sync.disconnect')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 계정에 속한 캘린더 목록 배지 */}
                        {acc.calendars && acc.calendars.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-[#2a2a2a]">
                            {acc.calendars.map((c) => (
                              <span
                                key={c.id}
                                className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 ${
                                  c.isSelected
                                    ? 'bg-[#2a2a2a] text-[#ddd] border border-[#444]'
                                    : 'bg-[#181818] text-[#666] line-through'
                                }`}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full inline-block"
                                  style={{ backgroundColor: c.color }}
                                />
                                <span>{c.name}</span>
                                {c.isPrimary && (
                                  <span className="text-[9px] text-[#0078d7] ml-0.5 font-bold">
                                    [{t('sync.primaryBadge')}]
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 동기화 오류 메시지 표시 */}
                        {acc.syncStatus === 'error' && acc.errorMessage && (
                          <div className="text-[10px] text-[#ff6b6b] flex items-center space-x-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{acc.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 공급자 선택 목록 */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider block">
                  {t('sync.addAccount')}
                </span>
                <div className="space-y-1.5">
                  {OAUTH_PROVIDERS.map((prov) => (
                    <button
                      key={prov.provider}
                      onClick={() => handleProviderClick(prov.provider)}
                      className="w-full flex items-center justify-between p-2.5 rounded bg-[#202020] hover:bg-[#2e2e2e] active:bg-[#383838] border border-[#333333] hover:border-[#0078d7] transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        {renderProviderIcon(prov.provider)}
                        <div>
                          <div className="font-medium text-[12.5px] text-white group-hover:text-[#0078d7] transition-colors">
                            {prov.name}
                          </div>
                          <div className="text-[10.5px] text-[#777777]">
                            {prov.provider === 'google'
                              ? (language === 'ko'
                                  ? '다중 캘린더 지원 및 양방향 쓰기 실시간 동기화'
                                  : 'Multi-calendar support & two-way real-time sync')
                              : (language === 'ko'
                                  ? '표준 CalDAV 호환 일정 동기화'
                                  : 'Standard CalDAV compatible event sync')}
                          </div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-[#666666] group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: Google Cloud OAuth2 Client ID / Secret 설정 화면 */}
          {view === 'google-setup' && (
            <form onSubmit={handleSaveGoogleConfigAndLogin} className="space-y-4">
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
                <div className="flex items-center space-x-2 text-[#0078d7] font-semibold text-[13px]">
                  <Key className="w-4 h-4" />
                  <span>{t('sync.googleSetupTitle')}</span>
                </div>
                <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                  {t('sync.googleSetupDesc')}
                </p>

                {/* 간편 가이드 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="flex items-center space-x-1 text-[11px] text-[#0078d7] hover:underline pt-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t('sync.guideHelpText')}</span>
                  {isGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* 가이드 상세 내용 */}
                {isGuideOpen && (
                  <div className="p-2.5 bg-[#141414] rounded border border-[#383838] space-y-2 text-[10.5px] text-[#bbbbbb]">
                    <div className="font-medium text-white flex items-center justify-between">
                      <span>Google Cloud Console 설정 순서 (1분 소요):</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0078d7] hover:underline flex items-center space-x-0.5"
                      >
                        <span>콘솔 바로가기</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Google Cloud Console에서 프로젝트 생성 또는 선택</li>
                      <li><strong>[API 및 서비스] &gt; [라이브러리]</strong>에서 <strong>Google Calendar API</strong> 사용 설정</li>
                      <li><strong>[사용자 인증 정보] &gt; [사용자 인증 정보 만들기] &gt; [OAuth 클라이언트 ID]</strong> 선택</li>
                      <li>애플리케이션 유형을 <strong>데스크톱 앱(Desktop App)</strong>으로 선택</li>
                      <li>발급된 <strong>클라이언트 ID</strong>와 <strong>클라이언트 보안 비밀번호</strong>를 아래에 입력</li>
                    </ol>
                    <div className="pt-1 text-[#888888]">
                      리디렉션 URI (자동 처리): <code className="text-[#0078d7]">http://127.0.0.1:52123/oauth2callback</code>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#aaaaaa] block mb-1">
                    {t('sync.googleSetupClientId')} <span className="text-[#e81123]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-[#aaaaaa]">
                      {t('sync.googleSetupClientSecret')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[10px] text-[#888888] hover:text-white"
                    >
                      {showSecret ? '숨기기' : '표시'}
                    </button>
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-white hover:bg-[#333333] rounded transition-colors"
                >
                  {language === 'ko' ? '뒤로' : 'Back'}
                </button>

                <button
                  type="submit"
                  disabled={!clientIdInput.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white rounded transition-colors shadow disabled:opacity-50"
                >
                  {t('sync.googleSetupSaveAndLogin')}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: Google 웹 브라우저 인증 대기 화면 */}
          {view === 'google-auth-wait' && (
            <div className="py-6 px-2 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-[#0078d7] flex items-center justify-center mx-auto">
                <RotateCw className="w-6 h-6 text-[#0078d7] animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm">
                  {t('sync.googleAuthWaitingTitle')}
                </h3>
                <p className="text-[#aaaaaa] text-xs max-w-sm mx-auto leading-relaxed">
                  {t('sync.googleAuthWaitingDesc')}
                </p>
                <p className="text-[11px] text-[#777777] pt-1">
                  {t('sync.googleAuthWaitingBrowserNotice')}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-[#3d2424] border border-[#ff6b6b] rounded text-[#ff6b6b] text-xs text-left">
                  <div className="font-semibold mb-0.5">인증 오류:</div>
                  <div>{authError}</div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center space-x-3 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setView('google-setup')}
                  className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-white hover:bg-[#333333] rounded transition-colors"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startGoogleAuthFlow(
                      settings.googleOAuth?.clientId || clientIdInput,
                      settings.googleOAuth?.clientSecret || clientSecretInput
                    )
                  }
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] text-white rounded transition-colors flex items-center space-x-1.5"
                >
                  <span>{t('sync.googleAuthReopenBrowser')}</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: Google 캘린더 목록 선택 화면 */}
          {view === 'calendar-select' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#333333] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-[13px]">
                    {authUserInfo?.name}
                  </div>
                  <div className="text-[11px] text-[#888888]">{authUserInfo?.email}</div>
                </div>
                <div className="text-[11px] text-[#0078d7] font-medium">Google 계정 확인됨</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white text-[12px] block">
                      {t('sync.selectCalendarsTitle')}
                    </span>
                    <span className="text-[10.5px] text-[#888888]">
                      {t('sync.selectCalendarsDesc')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAllCalendars(true)}
                      className="text-[#0078d7] hover:underline"
                    >
                      전체 선택
                    </button>
                    <span className="text-[#555]">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllCalendars(false)}
                      className="text-[#888888] hover:underline"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>

                {isFetchingCalendars ? (
                  <div className="p-6 text-center text-[#888888]">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0078d7]" />
                    <span>구글 계정의 캘린더 목록을 불러오는 중...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {fetchedCalendars.map((cal) => (
                      <div
                        key={cal.id}
                        onClick={() => handleToggleCalendar(cal.id)}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                          cal.isSelected
                            ? 'bg-[#222222] border-[#0078d7]'
                            : 'bg-[#181818] border-[#333333] opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {cal.isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0078d7] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#666666] shrink-0" />
                          )}
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cal.color }}
                          />
                          <span className="font-medium text-white text-xs truncate">
                            {cal.name}
                          </span>
                        </div>

                        {cal.isPrimary && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0078d7]/20 text-[#0078d7] font-semibold border border-[#0078d7]/30 shrink-0">
                            {t('sync.primaryBadge')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-white hover:bg-[#333333] rounded transition-colors"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCalendars}
                  disabled={isFetchingCalendars}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white rounded transition-colors shadow"
                >
                  {t('sync.selectCalendarsConfirm')}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 5: iCloud/기타 수동 연결 폼 */}
          {view === 'manual-form' && (
            <form onSubmit={handleManualConnect} className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-[#1e1e1e] rounded border border-[#333333]">
                {renderProviderIcon(selectedProvider || 'apple')}
                <div>
                  <div className="font-semibold text-white">
                    {OAUTH_PROVIDERS.find((p) => p.provider === selectedProvider)?.name}
                  </div>
                  <div className="text-[10px] text-[#888888]">
                    표준 CalDAV 호환 방식으로 일정을 동기화합니다.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#aaaaaa] block mb-1">
                    {language === 'ko' ? '이메일 주소' : 'Email Address'} <span className="text-[#e81123]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="example@icloud.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#aaaaaa] block mb-1">
                    {language === 'ko' ? '표시 이름 (선택사항)' : 'Display Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="iCloud 캘린더"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-white hover:bg-[#333333] rounded transition-colors"
                >
                  {language === 'ko' ? '뒤로' : 'Back'}
                </button>

                <button
                  type="submit"
                  disabled={isManualSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white rounded transition-colors shadow flex items-center space-x-1.5"
                >
                  {isManualSubmitting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('sync.syncing')}</span>
                    </>
                  ) : (
                    <span>{t('sync.connect')}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
