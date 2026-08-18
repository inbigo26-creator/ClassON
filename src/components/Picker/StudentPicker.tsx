import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveStudentPick,
  getStudentPicks,
  deleteStudentPick
} from '../../lib/firestoreService';
import { playChimeSound, playTickSound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  History,
  RotateCcw,
  Users,
  Check,
  Calendar,
  Trash2,
  HelpCircle,
  Volume2,
  VolumeX,
  Shuffle
} from 'lucide-react';
import { StudentPickRecord, Student } from '../../types';

export const StudentPicker: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  // Picker config
  const [pickTitle, setPickTitle] = useState<string>('오늘의 발표자');
  const [pickCount, setPickCount] = useState<number>(1);
  const [excludeRecent, setExcludeRecent] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Picking animation state
  const [isPicking, setIsPicking] = useState(false);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<Student[]>([]);

  // History & Save state
  const [savedHistory, setSavedHistory] = useState<StudentPickRecord[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  const activeStudents = students.filter((s) => s.active);

  useEffect(() => {
    if (!user || !currentClass) return;
    loadHistory();
  }, [user, currentClass?.id]);

  const loadHistory = async () => {
    if (!user || !currentClass) return;
    try {
      const list = await getStudentPicks(currentClass.id, user.uid);
      setSavedHistory(list);
    } catch (err) {
      console.error('Error loading student picks history:', err);
    }
  };

  // Perform thrill random pick
  const handleStartPick = () => {
    if (activeStudents.length === 0) {
      alert('추첨할 학생이 없습니다. 먼저 학생 명단을 등록해주세요.');
      return;
    }

    // Filter candidate pool
    let candidates = [...activeStudents];
    if (excludeRecent && savedHistory.length > 0) {
      const recentIds = new Set<string>();
      // Collect winners from last 3 pick rounds
      savedHistory.slice(0, 3).forEach((h) => {
        h.pickedStudents.forEach((p) => recentIds.add(p.id));
      });

      const filtered = candidates.filter((c) => !recentIds.has(c.id));
      if (filtered.length >= pickCount) {
        candidates = filtered;
      }
    }

    setIsPicking(true);
    setSelectedWinners([]);
    setAutoSaved(false);

    // Dynamic slot-machine rapid shuffle simulation
    let iterations = 0;
    const maxIterations = 28;
    const intervalTime = 70;

    const timer = setInterval(() => {
      iterations++;
      // Pick random preview items
      const preview: Student[] = [];
      for (let i = 0; i < pickCount; i++) {
        const randIdx = Math.floor(Math.random() * candidates.length);
        preview.push(candidates[randIdx]);
      }
      setDisplayedStudents(preview);

      if (soundEnabled && iterations % 2 === 0) {
        playTickSound();
      }

      if (iterations >= maxIterations) {
        clearInterval(timer);

        // Final random pick
        const shuffled = [...candidates];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const winners = shuffled.slice(0, Math.min(pickCount, shuffled.length));
        setSelectedWinners(winners);
        setDisplayedStudents(winners);
        setIsPicking(false);

        // Sound & Confetti celebration
        if (soundEnabled) {
          playChimeSound();
        }

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        // Auto save to Firestore
        if (user && currentClass) {
          saveStudentPick({
            classId: currentClass.id,
            ownerUid: user.uid,
            title: pickTitle.trim() || '학생 추첨',
            pickedCount: winners.length,
            pickedStudents: winners.map((w) => ({
              id: w.id,
              number: w.number,
              name: w.name
            }))
          })
            .then(() => {
              setAutoSaved(true);
              loadHistory();
            })
            .catch((err) => console.error('Auto save pick error:', err));
        }
      }
    }, intervalTime);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 추첨 기록을 삭제하시겠습니까?')) {
      try {
        await deleteStudentPick(id);
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
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span>학생 뽑기 (발표자 추첨)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            수업 중 발표자, 도우미, 대표자를 공정하고 흥미진진하게 랜덤 추첨합니다.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? '효과음 ON' : '효과음 OFF'}</span>
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>추첨 이력 ({savedHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Control Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              추첨 목적 / 제목
            </label>
            <input
              type="text"
              value={pickTitle}
              onChange={(e) => setPickTitle(e.target.value)}
              placeholder="예: 오늘의 발표자, 대표 학생"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              뽑을 인원수
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPickCount(num)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors ${
                    pickCount === num
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {num}명
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <label className="w-full flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 select-none">
              <input
                type="checkbox"
                checked={excludeRecent}
                onChange={(e) => setExcludeRecent(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <span>최근 당첨자 제외</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Roulette / Draw Stage Area */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-12 border border-slate-800 shadow-xl text-center relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-xl mx-auto space-y-8">
          
          {/* Header Title */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>{pickTitle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isPicking
                ? '두구두구... 학생을 뽑는 중입니다!'
                : selectedWinners.length > 0
                ? '🎉 오늘의 당첨자를 축하합니다!'
                : '버튼을 눌러 추첨을 시작하세요'}
            </h2>
          </div>

          {/* Winner Display Cards / Slots */}
          <div className="min-h-[160px] flex items-center justify-center">
            {isPicking ? (
              <div className="flex flex-wrap items-center justify-center gap-4 animate-pulse">
                {displayedStudents.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-slate-800/90 border-2 border-indigo-400 rounded-3xl shadow-2xl min-w-[180px] transform scale-105 transition-all"
                  >
                    <div className="text-sm font-mono text-indigo-400 font-bold">
                      {s?.number ? `${s.number}번` : '??'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {s?.name || '추첨 중...'}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedWinners.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4 animate-in zoom-in-95 duration-200">
                {selectedWinners.map((winner, idx) => (
                  <div
                    key={winner.id}
                    className="p-6 sm:p-8 bg-gradient-to-b from-indigo-600 to-blue-700 rounded-3xl border-2 border-indigo-300 shadow-2xl min-w-[200px] sm:min-w-[220px] transform hover:scale-105 transition-transform"
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-1">
                      당 첨 #{idx + 1}
                    </div>
                    <div className="text-base font-mono font-bold text-indigo-200">
                      {winner.number.toString().padStart(2, '0')}번
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
                      {winner.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-700 rounded-3xl w-full max-w-sm mx-auto text-slate-400 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto text-slate-500 opacity-60" />
                <div className="text-sm font-medium">추첨 대기 중</div>
                <div className="text-xs text-slate-500">
                  대상 학생: 총 {activeStudents.length}명
                </div>
              </div>
            )}
          </div>

          {/* Draw Button */}
          <div className="pt-2">
            <button
              onClick={handleStartPick}
              disabled={isPicking || activeStudents.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-150 active:scale-95 disabled:opacity-50 inline-flex items-center gap-3"
            >
              <Sparkles className={`w-5 h-5 ${isPicking ? 'animate-spin' : ''}`} />
              <span>{selectedWinners.length > 0 ? '다시 뽑기 (재추첨)' : '랜덤 학생 뽑기 시작!'}</span>
            </button>

            {autoSaved && (
              <div className="text-[11px] text-indigo-300 font-medium mt-3 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>추첨 결과가 Firestore 이력에 자동 저장되었습니다.</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                학생 추첨 이력 ({savedHistory.length})
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
                  아직 저장된 추첨 이력이 없습니다.
                </div>
              ) : (
                savedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-indigo-700 font-semibold">
                        🎉 당첨: {item.pickedStudents.map((p) => `${p.number}번 ${p.name}`).join(', ')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString('ko-KR')}
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
