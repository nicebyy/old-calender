import React, { useState } from 'react';
import {
  X,
  Mail,
  Building,
  Globe,
  Cloud,
  RotateCw,
  Trash2,
  Plus,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { OAUTH_PROVIDERS } from '../../constants/oauth';
import { OAuthProvider } from '../../types';

export const AccountModal: React.FC = () => {
  const isOpen = useCalendarStore((s) => s.isAccountModalOpen);
  const closeModal = useCalendarStore((s) => s.closeAccountModal);
  const syncedAccounts = useCalendarStore((s) => s.syncedAccounts);
  const addSyncedAccount = useCalendarStore((s) => s.addSyncedAccount);
  const removeSyncedAccount = useCalendarStore((s) => s.removeSyncedAccount);
  const syncAccount = useCalendarStore((s) => s.syncAccount);

  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleProviderClick = (provider: OAuthProvider) => {
    setSelectedProvider(provider);
    setEmailInput('');
    setNameInput('');
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !emailInput.trim()) return;

    setIsAuthenticating(true);
    // OAuth2 인증 흐름 모의 (토큰 발급 대기 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const defaultNames: Record<OAuthProvider, string> = {
      google: 'Google 캘린더',
      microsoft: 'Outlook 일정',
      exchange: 'Office 365 업무 일정',
      apple: 'iCloud 캘린더',
    };

    addSyncedAccount(
      selectedProvider,
      emailInput.trim(),
      nameInput.trim() || defaultNames[selectedProvider]
    );

    setIsAuthenticating(false);
    setSelectedProvider(null);
  };

  const renderProviderIcon = (provider: OAuthProvider) => {
    switch (provider) {
      case 'microsoft':
        return <Mail className="w-5 h-5 text-[#0078d7]" />;
      case 'exchange':
        return <Building className="w-5 h-5 text-[#107c41]" />;
      case 'google':
        return <Globe className="w-5 h-5 text-[#ea4335]" />;
      case 'apple':
        return <Cloud className="w-5 h-5 text-[#a2aaad]" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs select-none print:hidden">
      <div className="w-[460px] bg-[#262626] border border-[#3f3f3f] rounded shadow-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-150">
        {/* 모달 헤더 (Windows 10 특유의 상단 바) */}
        <div className="h-11 bg-[#202020] border-b border-[#333333] flex items-center justify-between px-4">
          <span className="text-sm font-semibold text-white">
            {selectedProvider ? '계정 로그인 및 연결' : '계정 선택 (Choose an account)'}
          </span>
          <button
            onClick={closeModal}
            className="p-1 hover:bg-[#e81123] rounded transition-colors text-[#aaaaaa] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto text-xs">
          {!selectedProvider ? (
            <>
              {/* 1. 현재 연동된 계정 목록 (있는 경우) */}
              {syncedAccounts.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-[#383838]">
                  <span className="text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider block">
                    연동된 계정 ({syncedAccounts.length})
                  </span>
                  <div className="space-y-1.5">
                    {syncedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2 rounded bg-[#1e1e1e] border border-[#333333] hover:border-[#444444] transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
                          {renderProviderIcon(acc.provider)}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white truncate text-[12px]">
                              {acc.displayName}
                            </div>
                            <div className="text-[10px] text-[#888888] truncate">{acc.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {/* 동기화 버튼 */}
                          <button
                            onClick={() => syncAccount(acc.id)}
                            disabled={acc.syncStatus === 'syncing'}
                            className="p-1.5 rounded hover:bg-[#333333] text-[#aaaaaa] hover:text-white transition-colors"
                            title="지금 동기화"
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
                            title="계정 연동 해제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. 공급자 선택 목록 (Windows 10 UWP 공식 메뉴) */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider block">
                  새 캘린더 계정 추가
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
                            일정, 회의 및 리마인더 양방향 동기화
                          </div>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-[#666666] group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* 3. 공급자 로그인 및 이메일 입력 폼 */
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-[#1e1e1e] rounded border border-[#333333]">
                {renderProviderIcon(selectedProvider)}
                <div>
                  <div className="font-semibold text-white">
                    {OAUTH_PROVIDERS.find((p) => p.provider === selectedProvider)?.name}
                  </div>
                  <div className="text-[10px] text-[#888888]">
                    OAuth2 표준 프로토콜을 통해 안전하게 일정을 동기화합니다.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#aaaaaa] block mb-1">
                    이메일 주소 <span className="text-[#e81123]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="example@domain.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#aaaaaa] block mb-1">
                    표시 이름 (선택사항)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 회사 업무 일정, 개인 구글 캘린더"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#181818] border border-[#444444] focus:border-[#0078d7] outline-none text-white rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-white hover:bg-[#333333] rounded transition-colors"
                >
                  뒤로
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3.5 py-1.5 text-xs bg-[#333333] hover:bg-[#444444] text-[#cccccc] rounded transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-4 py-1.5 text-xs font-semibold bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white rounded transition-colors flex items-center space-x-1.5 shadow"
                  >
                    {isAuthenticating ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>인증 중...</span>
                      </>
                    ) : (
                      <span>계정 연결</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
