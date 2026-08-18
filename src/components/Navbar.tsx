import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { 
  GraduationCap, 
  LogOut, 
  ChevronDown, 
  Plus, 
  Users, 
  Menu, 
  X,
  School,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { NavigationTab } from '../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const { user, userProfile, logout, signInWithGoogle } = useAuth();
  const { classes, currentClass, setCurrentClass, students } = useClass();
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const activeStudentsCount = students.filter(s => s.active).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: App Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-800 hover:bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => onSelectTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] flex items-center justify-center text-white group-hover:-translate-y-0.5 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">우리 반</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]">
                    Bento 학급도구
                  </span>
                </div>
              </div>
            </button>

            {/* Current Class Selector Pill */}
            {currentClass && user && (
              <div className="relative ml-2 sm:ml-4">
                <button
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-900 transition-all border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <School className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">
                    {currentClass.schoolYear}학년도 {currentClass.grade}학년 {currentClass.className}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                </button>

                {showClassDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowClassDropdown(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] border-2 border-slate-900 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b-2 border-slate-100 text-xs font-black text-slate-600 uppercase tracking-wider">
                        내 학급 목록
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1">
                        {classes.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCurrentClass(c);
                              setShowClassDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                              c.id === currentClass.id ? 'bg-indigo-50 text-indigo-950 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {c.schoolYear}학년도 {c.grade}학년 {c.className}
                              </div>
                              <div className="text-[11px] text-slate-500">{c.schoolName || '학교'}</div>
                            </div>
                            {c.id === currentClass.id && (
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-slate-900"></span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t-2 border-slate-100 p-2">
                        <button
                          onClick={() => {
                            setShowClassDropdown(false);
                            onSelectTab('settings');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          새 학급 추가 / 학급 관리
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Quick Stats & User Profile */}
          <div className="flex items-center gap-3">
            {user && currentClass && (
              <div 
                onClick={() => onSelectTab('roster')} 
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-sky-100 text-sky-950 rounded-xl text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer hover:-translate-y-0.5 transition-all"
                title="학생 명단 바로가기"
              >
                <Users className="w-3.5 h-3.5 text-sky-700" />
                <span>학생 {students.length}명</span>
                {students.length > 0 && activeStudentsCount < students.length && (
                  <span className="text-[10px] text-sky-800">({activeStudentsCount}명 재적)</span>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || '교사'}
                      className="w-7 h-7 rounded-lg border border-slate-900 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs border border-slate-900">
                      {user.displayName ? user.displayName.slice(0, 2) : '선생'}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs font-bold text-slate-800">
                    {user.displayName || '선생님'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 hidden md:inline" />
                </button>

                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] border-2 border-slate-900 py-2 z-50">
                      <div className="px-4 py-2 border-b-2 border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user.displayName || '선생님'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Google 계정 독립 보안</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onSelectTab('settings');
                          }}
                          className="w-full px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                        >
                          <School className="w-3.5 h-3.5 text-slate-600" />
                          학급 및 교사 정보 설정
                        </button>
                      </div>

                      <div className="border-t-2 border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            logout();
                          }}
                          className="w-full px-4 py-2.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Google 로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

