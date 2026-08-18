import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveGroupArrangement,
  getGroupArrangements,
  deleteGroupArrangement
} from '../../lib/firestoreService';
import {
  Users2,
  Shuffle,
  Save,
  Copy,
  Check,
  History,
  Printer,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Trash2,
  Calendar,
  UserCheck
} from 'lucide-react';
import { GroupArrangement as IGroupArrangement, GroupItem, Student, Gender } from '../../types';

export const GroupFormation: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  // Mode: by total group count OR members per group
  const [formationMode, setFormationMode] = useState<'by_groups' | 'by_members'>('by_groups');
  const [groupCount, setGroupCount] = useState<number>(6);
  const [membersPerGroup, setMembersPerGroup] = useState<number>(5);
  const [balanceGender, setBalanceGender] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('모둠 활동 편성');

  // Groups state
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // History & Save states
  const [savedHistory, setSavedHistory] = useState<IGroupArrangement[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Moving members between groups
  const [selectedMember, setSelectedMember] = useState<{
    fromGroupIdx: number;
    student: { id: string; number: number; name: string; gender: Gender };
  } | null>(null);

  const activeStudents = students.filter((s) => s.active);

  useEffect(() => {
    if (!user || !currentClass) return;
    loadHistory();
  }, [user, currentClass?.id]);

  const loadHistory = async () => {
    if (!user || !currentClass) return;
    try {
      const list = await getGroupArrangements(currentClass.id, user.uid);
      setSavedHistory(list);
    } catch (err) {
      console.error('Error loading group arrangements history:', err);
    }
  };

  // Perform Random Grouping
  const handleFormGroups = () => {
    if (activeStudents.length === 0) {
      alert('편성할 학생이 없습니다. 학생 명단에서 먼저 학생을 등록해주세요.');
      return;
    }

    setIsShuffling(true);

    let calculatedGroupCount = groupCount;
    if (formationMode === 'by_members') {
      calculatedGroupCount = Math.max(1, Math.ceil(activeStudents.length / membersPerGroup));
    }

    // Initialize empty groups
    const newGroups: GroupItem[] = Array.from({ length: calculatedGroupCount }, (_, i) => ({
      groupNumber: i + 1,
      groupName: `${i + 1}모둠`,
      memberIds: [],
      members: []
    }));

    if (balanceGender) {
      // Split into males and females and shuffle separately for balance
      const males = activeStudents.filter((s) => s.gender === 'male');
      const females = activeStudents.filter((s) => s.gender === 'female');
      const unspecified = activeStudents.filter((s) => s.gender !== 'male' && s.gender !== 'female');

      const shuffleArray = (arr: Student[]) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const shuffledMales = shuffleArray(males);
      const shuffledFemales = shuffleArray(females);
      const shuffledUnspecified = shuffleArray(unspecified);

      let gIdx = 0;
      shuffledMales.forEach((student) => {
        newGroups[gIdx % calculatedGroupCount].members.push({
          id: student.id,
          number: student.number,
          name: student.name,
          gender: student.gender
        });
        newGroups[gIdx % calculatedGroupCount].memberIds.push(student.id);
        gIdx++;
      });

      // Reverse distribute females for balanced distribution
      let fIdx = calculatedGroupCount - 1;
      shuffledFemales.forEach((student) => {
        const targetGroup = ((fIdx % calculatedGroupCount) + calculatedGroupCount) % calculatedGroupCount;
        newGroups[targetGroup].members.push({
          id: student.id,
          number: student.number,
          name: student.name,
          gender: student.gender
        });
        newGroups[targetGroup].memberIds.push(student.id);
        fIdx--;
      });

      shuffledUnspecified.forEach((student) => {
        // find group with fewest members
        newGroups.sort((a, b) => a.members.length - b.members.length);
        newGroups[0].members.push({
          id: student.id,
          number: student.number,
          name: student.name,
          gender: student.gender
        });
        newGroups[0].memberIds.push(student.id);
      });

      // Re-sort groups by groupNumber
      newGroups.sort((a, b) => a.groupNumber - b.groupNumber);
    } else {
      // Simple random shuffle of all active students
      const shuffled = [...activeStudents];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      shuffled.forEach((student, idx) => {
        const targetGroup = idx % calculatedGroupCount;
        newGroups[targetGroup].members.push({
          id: student.id,
          number: student.number,
          name: student.name,
          gender: student.gender
        });
        newGroups[targetGroup].memberIds.push(student.id);
      });
    }

    // Sort students within each group by number asc
    newGroups.forEach((g) => {
      g.members.sort((a, b) => a.number - b.number);
    });

    setTimeout(() => {
      setGroups(newGroups);
      setIsShuffling(false);
      setSelectedMember(null);
    }, 250);
  };

  // Move member between groups
  const handleMemberClick = (
    groupIdx: number,
    student: { id: string; number: number; name: string; gender: Gender }
  ) => {
    if (!selectedMember) {
      setSelectedMember({ fromGroupIdx: groupIdx, student });
    } else if (selectedMember.student.id === student.id) {
      setSelectedMember(null);
    } else {
      // Swap two members between groups
      const newGroups = [...groups];
      const fromG = newGroups[selectedMember.fromGroupIdx];
      const toG = newGroups[groupIdx];

      fromG.members = fromG.members.filter((m) => m.id !== selectedMember.student.id);
      toG.members = toG.members.filter((m) => m.id !== student.id);

      fromG.members.push(student);
      toG.members.push(selectedMember.student);

      fromG.memberIds = fromG.members.map((m) => m.id);
      toG.memberIds = toG.members.map((m) => m.id);

      fromG.members.sort((a, b) => a.number - b.number);
      toG.members.sort((a, b) => a.number - b.number);

      setGroups(newGroups);
      setSelectedMember(null);
    }
  };

  const handleGroupHeaderClick = (targetGroupIdx: number) => {
    if (selectedMember && selectedMember.fromGroupIdx !== targetGroupIdx) {
      // Move member to target group
      const newGroups = [...groups];
      const fromG = newGroups[selectedMember.fromGroupIdx];
      const toG = newGroups[targetGroupIdx];

      fromG.members = fromG.members.filter((m) => m.id !== selectedMember.student.id);
      toG.members.push(selectedMember.student);

      fromG.memberIds = fromG.members.map((m) => m.id);
      toG.memberIds = toG.members.map((m) => m.id);

      toG.members.sort((a, b) => a.number - b.number);

      setGroups(newGroups);
      setSelectedMember(null);
    }
  };

  // Save to Firebase
  const handleSave = async () => {
    if (!user || !currentClass || groups.length === 0) return;

    try {
      setIsSaving(true);
      await saveGroupArrangement({
        classId: currentClass.id,
        ownerUid: user.uid,
        title: title.trim() || '모둠 편성',
        groupCount: groups.length,
        membersPerGroup: Math.round(activeStudents.length / groups.length),
        groups,
        excludedStudentIds: students.filter((s) => !s.active).map((s) => s.id),
        balanceGender
      });

      setSaveSuccessMsg('모둠 편성이 Firebase에 성공적으로 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      loadHistory();
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Formatted Text to Clipboard
  const handleCopyText = () => {
    if (groups.length === 0) return;

    let text = `[${currentClass?.schoolYear}학년도 ${currentClass?.grade}학년 ${currentClass?.className} ${title}]\n\n`;
    groups.forEach((g) => {
      text += `■ ${g.groupName} (${g.members.length}명)\n`;
      const memberList = g.members
        .map((m) => `${m.number.toString().padStart(2, '0')}번 ${m.name}`)
        .join(', ');
      text += `${memberList}\n\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadHistory = (item: IGroupArrangement) => {
    setTitle(item.title);
    setGroupCount(item.groupCount);
    setBalanceGender(item.balanceGender ?? true);
    setGroups(item.groups);
    setIsHistoryModalOpen(false);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 모둠 기록을 삭제하시겠습니까?')) {
      try {
        await deleteGroupArrangement(id);
        loadHistory();
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-indigo-600" />
            <span>랜덤 모둠 편성</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            원하는 모둠 수 또는 모둠별 인원수에 맞춰 학생들을 균등하고 공정하게 편성합니다.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>이전 모둠 불러오기 ({savedHistory.length})</span>
          </button>

          {groups.length > 0 && (
            <>
              <button
                onClick={handleCopyText}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? '복사 완료!' : '텍스트 복사'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>인쇄</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? '저장 중...' : '모둠 결과 저장'}</span>
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

      {/* Control Configuration Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Mode switch */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFormationMode('by_groups')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  formationMode === 'by_groups'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                모둠 수 기준
              </button>
              <button
                onClick={() => setFormationMode('by_members')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  formationMode === 'by_members'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                모둠당 인원수 기준
              </button>
            </div>

            {/* Selector */}
            {formationMode === 'by_groups' ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200">
                <span>총 모둠 수:</span>
                <select
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-hidden"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}개 모둠
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400">
                  (모둠당 약 {Math.round(activeStudents.length / groupCount)}명)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200">
                <span>모둠당 인원:</span>
                <select
                  value={membersPerGroup}
                  onChange={(e) => setMembersPerGroup(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-hidden"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num}명씩
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400">
                  (약 {Math.ceil(activeStudents.length / membersPerGroup)}개 모둠)
                </span>
              </div>
            )}

            {/* Gender balance checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 select-none">
              <input
                type="checkbox"
                checked={balanceGender}
                onChange={(e) => setBalanceGender(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <span>남/여 비율 균등 배정</span>
            </label>
          </div>

          {/* Shuffle Button */}
          <button
            onClick={handleFormGroups}
            disabled={isShuffling || activeStudents.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{groups.length === 0 ? '랜덤 모둠 편성 시작' : '다시 편성 (셔플)'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 gap-2">
          <span>
            편성 대상: <strong className="text-slate-800">{activeStudents.length}명</strong> (재적 학생 기준)
          </span>
          <span className="text-[11px] text-slate-400">
            💡 학생 카드를 클릭한 후 다른 학생 또는 모둠을 클릭하여 자리를 바꿀 수 있습니다.
          </span>
        </div>
      </div>

      {/* Group Cards Display */}
      {groups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">모둠을 편성해보세요</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              상단의 옵션을 설정한 뒤 [랜덤 모둠 편성 시작] 버튼을 누르면 인원에 맞춰 자동으로 편성됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Printable title header */}
          <div className="text-center print:block hidden mb-4">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-600">
              {currentClass?.schoolYear}학년도 {currentClass?.grade}학년 {currentClass?.className} ({currentClass?.schoolName})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group, gIdx) => (
              <div
                key={group.groupNumber}
                onClick={() => handleGroupHeaderClick(gIdx)}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 space-y-3 flex flex-col justify-between shadow-xs ${
                  selectedMember && selectedMember.fromGroupIdx !== gIdx
                    ? 'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 cursor-pointer'
                    : 'border-slate-200'
                }`}
              >
                {/* Group Card Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {group.groupNumber}
                    </span>
                    <input
                      type="text"
                      value={group.groupName}
                      onChange={(e) => {
                        const newGroups = [...groups];
                        newGroups[gIdx].groupName = e.target.value;
                        setGroups(newGroups);
                      }}
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden px-1"
                    />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {group.members.length}명
                  </span>
                </div>

                {/* Group Members List */}
                <div className="space-y-1.5 min-h-[140px]">
                  {group.members.map((member) => {
                    const isSelected =
                      selectedMember?.student.id === member.id;

                    return (
                      <div
                        key={member.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberClick(gIdx, member);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md scale-102 ring-2 ring-indigo-300'
                            : 'bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/60 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-600'}`}>
                            {member.number.toString().padStart(2, '0')}
                          </span>
                          <span className="font-semibold text-slate-900">{member.name}</span>
                        </div>

                        {member.gender && member.gender !== 'unspecified' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              isSelected
                                ? 'bg-indigo-700 text-indigo-100'
                                : member.gender === 'male'
                                ? 'text-blue-700 bg-blue-100/70'
                                : 'text-rose-700 bg-rose-100/70'
                            }`}
                          >
                            {member.gender === 'male' ? '남' : '여'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer stats */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>남 {group.members.filter((m) => m.gender === 'male').length}</span>
                  <span>여 {group.members.filter((m) => m.gender === 'female').length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                이전 모둠 편성 기록 ({savedHistory.length})
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
                  아직 저장된 모둠 기록이 없습니다.
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
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <span>•</span>
                        <span>{item.groupCount}개 모둠</span>
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
