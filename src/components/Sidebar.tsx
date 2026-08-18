import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid,
  Users2,
  CalendarCheck2,
  Sparkles,
  ClipboardList,
  Settings,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  studentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  studentCount
}) => {
  const navSections = [
    {
      title: '대시보드',
      items: [
        {
          id: 'dashboard' as NavigationTab,
          label: '학급 홈',
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      title: '학급 명단',
      items: [
        {
          id: 'roster' as NavigationTab,
          label: '학생 명단 관리',
          icon: Users,
          badge: studentCount > 0 ? `${studentCount}명` : null
        }
      ]
    },
    {
      title: '랜덤 편성 도구',
      items: [
        {
          id: 'seats' as NavigationTab,
          label: '자리 배치',
          icon: Grid,
          badge: '🎲'
        },
        {
          id: 'groups' as NavigationTab,
          label: '모둠 편성',
          icon: Users2,
          badge: null
        },
        {
          id: 'duties' as NavigationTab,
          label: '당번 배정',
          icon: Flame,
          badge: null
        },
        {
          id: 'picker' as NavigationTab,
          label: '학생 뽑기 (추첨)',
          icon: Sparkles,
          badge: '🎯'
        }
      ]
    },
    {
      title: '출결 및 제출물',
      items: [
        {
          id: 'attendance' as NavigationTab,
          label: '외부활동 출석',
          icon: CalendarCheck2,
          badge: null
        },
        {
          id: 'submissions' as NavigationTab,
          label: '제출물 체크',
          icon: ClipboardList,
          badge: null
        }
      ]
    },
    {
      title: '설정',
      items: [
        {
          id: 'settings' as NavigationTab,
          label: '학급 정보 및 설정',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#F8FAFC] lg:bg-transparent border-r-2 border-slate-900 lg:border-r-0 transform transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-5 lg:pr-2">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-black tracking-wider text-slate-500 uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                        isActive
                          ? 'bg-indigo-600 text-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] -translate-y-0.5'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-700'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black border border-slate-900 shrink-0 ${
                            isActive
                              ? 'bg-amber-300 text-slate-950 shadow-[1px_1px_0px_0px_#0f172a]'
                              : 'bg-indigo-100 text-indigo-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick teacher tip / badge */}
          <div className="pt-2">
            <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-xs text-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>클라우드 실시간 동기화</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                선생님별 Google 계정으로 모든 학급 데이터가 안전하게 Firestore에 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

