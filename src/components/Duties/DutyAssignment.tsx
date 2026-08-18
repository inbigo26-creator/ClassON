import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveDutyArrangement,
  getDutyArrangements,
  deleteDutyArrangement
} from '../../lib/firestoreService';
import {
  Flame,
  Shuffle,
  Save,
  Plus,
  Trash2,
  History,
  Calendar,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Copy,
  Printer,
  X,
  Tv
} from 'lucide-react';
import { DutyArrangement, DutyRole, Student } from '../../types';

interface RoleTemplate {
  name: string;
  count: number;
}

const DEFAULT_ROLES: RoleTemplate[] = [
  { name: '칠판 및 교탁 정리', count: 1 },
  { name: '분리수거 및 쓰레기통', count: 2 },
  { name: '교실 바닥 쓸기/닦기', count: 2 },
  { name: '복도 및 창문 환기', count: 2 },
  { name: '이동수업 소등 및 문단속', count: 1 }
];

export const DutyAssignment: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  // Roles definition
  const [roleConfigs, setRoleConfigs] = useState<RoleTemplate[]>(DEFAULT_ROLES);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCount, setNewRoleCount] = useState<number>(1);

  // Duty assignment state
  const [dutyTitle, setDutyTitle] = useState<string>('오늘의 학급 당번');
  const [dutyDate, setDutyDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [assignedRoles, setAssignedRoles] = useState<DutyRole[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // Avoid recently assigned students
  const [avoidRecent, setAvoidRecent] = useState<boolean>(true);

  // History & Save states
  const [savedHistory, setSavedHistory] = useState<DutyArrangement[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBoardMode, setIsBoardMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeStudents = students.filter((s) => s.active);

  useEffect(() => {
    if (!user || !currentClass) return;
    loadHistory();
  }, [user, currentClass?.id]);

  const loadHistory = async () => {
    if (!user || !currentClass) return;
    try {
      const list = await getDutyArrangements(currentClass.id, user.uid);
      setSavedHistory(list);
    } catch (err) {
      console.error('Error loading duty history:', err);
    }
  };

  // Perform Duty Random Assignment
  const handleAssignDuties = () => {
    if (activeStudents.length === 0) {
      alert('배정할 학생이 없습니다. 학생 명단에서 먼저 학생을 등록해주세요.');
      return;
    }

    const totalNeeded = roleConfigs.reduce((sum, r) => sum + r.count, 0);
    if (totalNeeded > activeStudents.length) {
      alert(`배정 인원(${totalNeeded}명)이 재적 학생 수(${activeStudents.length}명)보다 많습니다. 역할 인원을 조정해주세요.`);
      return;
    }

    setIsShuffling(true);

    // Get recently assigned student IDs to deprioritize
    const recentlyAssignedMap = new Map<string, number>(); // studentId -> count
    if (avoidRecent && savedHistory.length > 0) {
      savedHistory.slice(0, 3).forEach((h, hIdx) => {
        h.roles.forEach((r) => {
          r.assignedStudentIds.forEach((sid) => {
            const currentWeight = recentlyAssignedMap.get(sid) || 0;
            recentlyAssignedMap.set(sid, currentWeight + (3 - hIdx));
          });
        });
      });
    }

    // Shuffle students with priority to those not recently assigned
    let pool = [...activeStudents];
    pool.sort((a, b) => {
      const weightA = recentlyAssignedMap.get(a.id) || 0;
      const weightB = recentlyAssignedMap.get(b.id) || 0;
      if (weightA !== weightB) return weightA - weightB;
      return Math.random() - 0.5;
    });

    // Randomize within same weight
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Only swap if same recent weight
      const wI = recentlyAssignedMap.get(pool[i].id) || 0;
      const wJ = recentlyAssignedMap.get(pool[j].id) || 0;
      if (wI === wJ) {
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    let cursor = 0;
    const newAssignedRoles: DutyRole[] = roleConfigs.map((cfg, idx) => {
      const roleStudents: Student[] = [];
      for (let i = 0; i < cfg.count; i++) {
        if (cursor < pool.length) {
          roleStudents.push(pool[cursor++]);
        }
      }

      return {
        roleId: `role-${idx}-${Date.now()}`,
        roleName: cfg.name,
        count: cfg.count,
        assignedStudentIds: roleStudents.map((s) => s.id),
        assignedStudents: roleStudents.map((s) => ({
          id: s.id,
          number: s.number,
          name: s.name
        }))
      };
    });

    setTimeout(() => {
      setAssignedRoles(newAssignedRoles);
      setIsShuffling(false);
    }, 250);
  };

  // Add custom role
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setRoleConfigs((prev) => [
      ...prev,
      { name: newRoleName.trim(), count: Number(newRoleCount) || 1 }
    ]);
    setNewRoleName('');
    setNewRoleCount(1);
  };

  // Remove role
  const handleRemoveRole = (index: number) => {
    setRoleConfigs((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update role headcount
  const handleCountChange = (index: number, delta: number) => {
    setRoleConfigs((prev) =>
      prev.map((r, idx) =>
        idx === index ? { ...r, count: Math.max(1, r.count + delta) } : r
      )
    );
  };

  // Save to Firebase
  const handleSaveToFirestore = async () => {
    if (!user || !currentClass || assignedRoles.length === 0) return;

    try {
      setIsSaving(true);
      await saveDutyArrangement({
        classId: currentClass.id,
        ownerUid: user.uid,
        title: dutyTitle.trim() || '학급 당번',
        date: dutyDate,
        roles: assignedRoles,
        notes: `총 ${roleConfigs.reduce((s, r) => s + r.count, 0)}명 배정`
      });

      setSaveSuccessMsg('당번 배정 결과가 Firebase에 안전하게 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      loadHistory();
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = () => {
    if (assignedRoles.length === 0) return;

    let text = `[${currentClass?.schoolYear}학년도 ${currentClass?.grade}학년 ${currentClass?.className} ${dutyTitle} (${dutyDate})]\n\n`;
    assignedRoles.forEach((role) => {
      const studentNames = role.assignedStudents
        .map((s) => `${s.number}번 ${s.name}`)
        .join(', ');
      text += `🧹 ${role.roleName}: ${studentNames || '미배정'}\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadHistory = (item: DutyArrangement) => {
    setDutyTitle(item.title);
    setDutyDate(item.date);
    setAssignedRoles(item.roles);
    setIsHistoryModalOpen(false);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 당번 기록을 삭제하시겠습니까?')) {
      try {
        await deleteDutyArrangement(id);
        loadHistory();
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  const totalAssignedStudents = assignedRoles.reduce(
    (sum, r) => sum + r.assignedStudents.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-indigo-600" />
            <span>학급 당번 배정</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            청소, 칠판, 분리수거 등 학급 역할을 자동으로 균등 배정하고 기록을 관리합니다.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>이전 당번 기록 ({savedHistory.length})</span>
          </button>

          {assignedRoles.length > 0 && (
            <>
              <button
                onClick={() => setIsBoardMode(!isBoardMode)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Tv className="w-4 h-4 text-indigo-400" />
                <span>칠판/TV 화면 모드</span>
              </button>

              <button
                onClick={handleCopyText}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? '복사 완료' : '알림장 복사'}</span>
              </button>

              <button
                onClick={handleSaveToFirestore}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? '저장 중...' : '당번 결과 저장'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Role Configs & Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">당번 일자</label>
              <input
                type="date"
                value={dutyDate}
                onChange={(e) => setDutyDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 select-none mt-4 sm:mt-0">
              <input
                type="checkbox"
                checked={avoidRecent}
                onChange={(e) => setAvoidRecent(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <span>최근 당번 맡았던 학생 우선 배제</span>
            </label>
          </div>

          <button
            onClick={handleAssignDuties}
            disabled={isShuffling || activeStudents.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{assignedRoles.length === 0 ? '당번 자동 배정 시작' : '다시 배정 (셔플)'}</span>
          </button>
        </div>

        {/* Editable Roles Tags */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>배정할 역할 및 인원 설정:</span>
            <span className="text-slate-500 font-normal">
              필요 인원: <strong className="text-indigo-600">{roleConfigs.reduce((s, r) => s + r.count, 0)}명</strong> / 재적 {activeStudents.length}명
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roleConfigs.map((role, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium transition-colors"
              >
                <span>{role.name}</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
                  <button
                    onClick={() => handleCountChange(idx, -1)}
                    className="text-slate-400 hover:text-slate-700 font-bold px-0.5"
                  >
                    -
                  </button>
                  <span className="font-bold text-indigo-700 text-xs px-1">{role.count}명</span>
                  <button
                    onClick={() => handleCountChange(idx, 1)}
                    className="text-slate-400 hover:text-slate-700 font-bold px-0.5"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveRole(idx)}
                  className="text-slate-400 hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Inline Add Role Form */}
            <form onSubmit={handleAddRole} className="inline-flex items-center gap-1.5">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="+ 새 역할 추가 (예: 식물 물주기)"
                className="px-3 py-1.5 text-xs bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44"
              />
              {newRoleName.trim() && (
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  추가
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Classroom TV / Board Display Mode or Standard Cards */}
      {assignedRoles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Flame className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">오늘의 당번을 배정해보세요</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              위의 역할별 인원을 확인하고 [당번 자동 배정 시작]을 누르면 랜덤으로 학생이 배정됩니다.
            </p>
          </div>
        </div>
      ) : isBoardMode ? (
        /* Classroom Board/TV Display Mode */
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                CLASSROOM DUTY BOARD
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                🧹 오늘의 당번 ({dutyDate})
              </h2>
            </div>
            <button
              onClick={() => setIsBoardMode(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              일반 모드로 전환
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedRoles.map((role, idx) => (
              <div
                key={idx}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-bold text-base text-indigo-300">{role.roleName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                    {role.assignedStudents.length}명
                  </span>
                </div>

                <div className="space-y-2">
                  {role.assignedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60"
                    >
                      <span className="font-mono text-sm text-indigo-400 font-bold">
                        {student.number.toString().padStart(2, '0')}번
                      </span>
                      <span className="text-base font-extrabold text-white">{student.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Standard Card Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedRoles.map((role, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-indigo-600" />
                  {role.roleName}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {role.assignedStudents.length}명
                </span>
              </div>

              <div className="space-y-2 min-h-[90px]">
                {role.assignedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {student.number.toString().padStart(2, '0')}번
                    </span>
                    <span className="text-sm font-bold text-slate-900">{student.name}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 text-right text-[11px] text-slate-400">
                {dutyDate} 배정
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                이전 당번 배정 기록 ({savedHistory.length})
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-2.5">
              {savedHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  아직 저장된 당번 배정 기록이 없습니다.
                </div>
              ) : (
                savedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistory(item)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">
                        {item.title} ({item.date})
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.roles.map((r) => `${r.roleName}(${r.assignedStudents.length})`).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
