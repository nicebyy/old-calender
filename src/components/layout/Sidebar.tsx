import React, { useState } from 'react';
import {
  Plus,
  Settings,
  Mail,
  Users,
  CheckSquare,
  Check,
  FolderPlus,
} from 'lucide-react';
import { useCalendarStore } from '../../storage/calendarStore';
import { MiniCalendar } from '../sidebar/MiniCalendar';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useCalendarStore((s) => s.isSidebarOpen);
  const categories = useCalendarStore((s) => s.categories);
  const toggleCategory = useCalendarStore((s) => s.toggleCategoryVisibility);
  const openEventModal = useCalendarStore((s) => s.openEventModal);
  const toggleSettings = useCalendarStore((s) => s.toggleSettings);
  const addCategory = useCalendarStore((s) => s.addCategory);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0078D7');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  return (
    <aside
      className={`h-full bg-[#262626] border-r border-[#333333] flex flex-col justify-between transition-all duration-150 ease-out select-none overflow-hidden z-20 print:hidden ${
        isSidebarOpen ? 'w-[250px]' : 'w-0 border-r-0'
      }`}
    >
      {/* 사이드바 상단 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* 새 이벤트 버튼 */}
        <button
          onClick={() => openEventModal()}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[#0078d7] hover:bg-[#1a86d9] active:bg-[#0063b1] text-white font-medium text-[13px] rounded transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>새 이벤트</span>
        </button>

        {/* 미니 캘린더 피커 */}
        <div className="pt-1">
          <MiniCalendar />
        </div>

        {/* 내 캘린더 범주 목록 */}
        <div className="pt-2 border-t border-[#333333]">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[12px] font-semibold text-[#aaaaaa]">내 캘린더</span>
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="text-[#888888] hover:text-white p-0.5 rounded hover:bg-[#333333] transition-colors"
              title="새 캘린더 범주 추가"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 새 캘린더 추가 인라인 폼 */}
          {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="mb-2 p-2 bg-[#202020] rounded border border-[#3a3a3a] space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="캘린더 이름"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-[#181818] border border-[#444444] rounded text-white outline-none focus:border-[#0078d7]"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
                <button
                  type="submit"
                  className="flex-1 py-1 px-2 text-[11px] bg-[#0078d7] hover:bg-[#1a86d9] rounded text-white font-medium"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="py-1 px-2 text-[11px] bg-[#333333] hover:bg-[#444444] rounded text-[#cccccc]"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 캘린더 리스트 */}
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className="flex items-center space-x-2.5 px-2 py-1.5 rounded hover:bg-[#333333] cursor-pointer text-xs text-[#dddddd] transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-sm flex items-center justify-center border transition-all"
                  style={{
                    backgroundColor: category.isVisible ? category.color : 'transparent',
                    borderColor: category.color,
                  }}
                >
                  {category.isVisible && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span className="font-normal truncate">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 사이드바 최하단: 윈도우 10 메일/피플/할일/설정 숏컷 바 */}
      <div className="h-10 border-t border-[#333333] bg-[#222222] flex items-center justify-between px-3 text-[#aaaaaa]">
        <div className="flex items-center space-x-3">
          <button
            className="p-1 hover:text-white hover:bg-[#333333] rounded transition-colors"
            title="메일"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:text-white hover:bg-[#333333] rounded transition-colors"
            title="피플(연락처)"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:text-white hover:bg-[#333333] rounded transition-colors"
            title="To Do"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={toggleSettings}
          className="p-1 hover:text-white hover:bg-[#333333] rounded transition-colors"
          title="설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
