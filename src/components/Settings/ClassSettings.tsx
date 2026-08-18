import React, { useState } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Settings,
  School,
  User,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Calendar,
  Cloud,
  LogOut
} from 'lucide-react';

export const ClassSettings: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const {
    classes,
    currentClass,
    setCurrentClass,
    createClass,
    updateClass,
    deleteClass
  } = useClass();

  // Edit current class fields
  const [schoolName, setSchoolName] = useState(currentClass?.schoolName || '우리 고등학교');
  const [schoolYear, setSchoolYear] = useState(currentClass?.schoolYear || 2026);
  const [grade, setGrade] = useState(currentClass?.grade || 2);
  const [className, setClassName] = useState(currentClass?.className || '3반');
  const [teacherName, setTeacherName] = useState(
    currentClass?.homeroomTeacherName || user?.displayName || '담임교사'
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Class Form State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('우리 고등학교');
  const [newSchoolYear, setNewSchoolYear] = useState(2026);
  const [newGrade, setNewGrade] = useState(1);
  const [newClassName, setNewClassName] = useState('1반');
  const [isCreating, setIsCreating] = useState(false);

  const handleUpdateCurrentClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;

    try {
      setIsUpdating(true);
      await updateClass(currentClass.id, {
        schoolName: schoolName.trim(),
        schoolYear: Number(schoolYear),
        grade: Number(grade),
        className: className.trim(),
        homeroomTeacherName: teacherName.trim()
      });

      setSuccessMsg('학급 정보가 성공적으로 수정되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('수정 실패: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await createClass(newSchoolName, newGrade, newClassName, newSchoolYear);
      setIsCreatingNew(false);
      setSuccessMsg('새 학급이 생성되어 활성화되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('학급 생성 실패: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (classes.length <= 1) {
      alert('최소 하나의 학급이 존재해야 합니다.');
      return;
    }

    if (
      window.confirm(
        '이 학급과 해당 학급의 모든 학생 데이터가 삭제됩니다. 정말 삭제하시겠습니까?'
      )
    ) {
      try {
        await deleteClass(classId);
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>학급 정보 및 설정</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          현재 담당 중인 학급 정보, 다중 학급 관리 및 교사 계정 설정을 관리합니다.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Current Class Information Form */}
      {currentClass && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">현재 학급 기본 정보</h2>
                <p className="text-xs text-slate-500">
                  앱 상단 및 인쇄물에 표시되는 학급 명칭을 수정합니다.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateCurrentClass} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학교명
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학년도
                </label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2035"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학년
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학급명 (반)
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="예: 3반"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  담임교사 성명
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                {isUpdating ? '저장 중...' : '학급 정보 저장'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. My Classes List (학급 목록 및 관리) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">내 학급 목록 관리</h2>
            <p className="text-xs text-slate-500">
              여러 학년/학급을 맡거나 이전 학년도 학급을 추가 생성하여 전환할 수 있습니다.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 학급 추가</span>
          </button>
        </div>

        {/* New Class Modal / Inline Form */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreateNewClass}
            className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-indigo-900">새 학급 생성</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                placeholder="학교명"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="number"
                required
                placeholder="학년도"
                value={newSchoolYear}
                onChange={(e) => setNewSchoolYear(Number(e.target.value))}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(Number(e.target.value))}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    {g}학년
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="학급명 (예: 2반)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
              >
                {isCreating ? '생성 중...' : '학급 생성'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {classes.map((cls) => {
            const isActive = currentClass?.id === cls.id;
            return (
              <div
                key={cls.id}
                onClick={() => setCurrentClass(cls)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-100 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isActive ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {cls.schoolYear}학년도 {cls.grade}학년 {cls.className}
                    </div>
                    <div className="text-xs text-slate-500">
                      {cls.schoolName} {cls.homeroomTeacherName ? `(담임: ${cls.homeroomTeacherName})` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                      현재 선택된 학급
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">클릭하여 전환</span>
                  )}

                  {classes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg ml-1"
                      title="학급 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Teacher Account & Cloud Security Card */}
      {user && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">교사 계정 및 보안 정보</h2>
              <p className="text-xs text-slate-500">
                Google 계정 연동 및 클라우드 저장소 상태
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-500">로그인 계정</div>
              <div className="font-bold text-slate-900 text-sm">{user.displayName || '선생님'}</div>
              <div className="text-slate-500 font-mono text-[11px] truncate">{user.email}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-500">클라우드 데이터 보안</div>
              <div className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                <Cloud className="w-4 h-4" />
                <span>Google Cloud Firestore 연결됨</span>
              </div>
              <div className="text-[11px] text-slate-500">
                UID: <span className="font-mono">{user.uid.slice(0, 12)}...</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={logout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
