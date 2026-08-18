import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveSeatArrangement,
  getSeatArrangements,
  deleteSeatArrangement
} from '../../lib/firestoreService';
import {
  Grid,
  Shuffle,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  Printer,
  History,
  Check,
  X,
  Sparkles,
  Users,
  Eye,
  Sliders,
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import { SeatArrangement as ISeatArrangement, SeatSlot, Student } from '../../types';

export const SeatArrangement: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  // Grid Configuration
  const [rows, setRows] = useState<number>(5);
  const [cols, setCols] = useState<number>(6);
  const [layoutType, setLayoutType] = useState<'grid' | 'pairs'>('grid');
  const [title, setTitle] = useState<string>('2026학년도 자리 배치');

  // Seats State
  const [seats, setSeats] = useState<SeatSlot[]>([]);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // History & Save States
  const [savedHistory, setSavedHistory] = useState<ISeatArrangement[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeStudents = students.filter((s) => s.active);

  // Initialize or re-shape seats when rows/cols change
  useEffect(() => {
    const totalSlots = rows * cols;
    setSeats((prevSeats) => {
      const newSeats: SeatSlot[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const seatIdx = r * cols + c;
          const existing = prevSeats.find((s) => s.seatIndex === seatIdx);
          if (existing) {
            newSeats.push({
              ...existing,
              row: r,
              col: c
            });
          } else {
            newSeats.push({
              seatIndex: seatIdx,
              row: r,
              col: c,
              studentId: null,
              isLocked: false
            });
          }
        }
      }
      return newSeats;
    });
  }, [rows, cols]);

  // Load history on mount or class change
  useEffect(() => {
    if (!user || !currentClass) return;
    loadHistory();
  }, [user, currentClass?.id]);

  const loadHistory = async () => {
    if (!user || !currentClass) return;
    try {
      const list = await getSeatArrangements(currentClass.id, user.uid);
      setSavedHistory(list);
    } catch (err) {
      console.error('Error loading seat arrangements history:', err);
    }
  };

  // Perform Random Arrangement
  const handleRandomize = () => {
    if (activeStudents.length === 0) {
      alert('배치할 학생이 없습니다. 학생 명단에서 먼저 학생을 등록해주세요.');
      return;
    }

    setIsShuffling(true);

    // 1. Identify which students are already locked in specific seats
    const lockedStudentIds = new Set<string>();
    const lockedSeatIndices = new Set<number>();

    seats.forEach((seat) => {
      if (seat.isLocked && seat.studentId) {
        lockedStudentIds.add(seat.studentId);
        lockedSeatIndices.add(seat.seatIndex);
      }
    });

    // 2. Filter students who need to be placed
    const unplacedStudents = activeStudents.filter(
      (s) => !lockedStudentIds.has(s.id)
    );

    // 3. Shuffle unplaced students (Fisher-Yates)
    const shuffled = [...unplacedStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 4. Fill unlocked seat slots
    let studentCursor = 0;
    const newSeats = seats.map((seat) => {
      if (seat.isLocked && seat.studentId) {
        // Keep locked student
        const matched = activeStudents.find((s) => s.id === seat.studentId);
        return {
          ...seat,
          studentName: matched?.name || seat.studentName,
          studentNumber: matched?.number || seat.studentNumber,
          studentGender: matched?.gender || seat.studentGender
        };
      }

      if (studentCursor < shuffled.length) {
        const student = shuffled[studentCursor++];
        return {
          ...seat,
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.number,
          studentGender: student.gender,
          isLocked: false
        };
      }

      // Empty desk
      return {
        ...seat,
        studentId: null,
        studentName: undefined,
        studentNumber: undefined,
        studentGender: undefined,
        isLocked: false
      };
    });

    setTimeout(() => {
      setSeats(newSeats);
      setIsShuffling(false);
    }, 250);
  };

  // Toggle Lock
  const handleToggleLock = (seatIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeats((prev) =>
      prev.map((s) =>
        s.seatIndex === seatIndex
          ? { ...s, isLocked: !s.isLocked }
          : s
      )
    );
  };

  // Seat Click & Swap Handler
  const handleSeatClick = (seatIndex: number) => {
    if (selectedSeatIndex === null) {
      // First click: select
      setSelectedSeatIndex(seatIndex);
    } else if (selectedSeatIndex === seatIndex) {
      // Clicked same seat: deselect
      setSelectedSeatIndex(null);
    } else {
      // Swap seat A and seat B
      const seatA = seats.find((s) => s.seatIndex === selectedSeatIndex);
      const seatB = seats.find((s) => s.seatIndex === seatIndex);

      if (seatA && seatB) {
        setSeats((prev) =>
          prev.map((s) => {
            if (s.seatIndex === selectedSeatIndex) {
              return {
                ...s,
                studentId: seatB.studentId,
                studentName: seatB.studentName,
                studentNumber: seatB.studentNumber,
                studentGender: seatB.studentGender,
                isLocked: false
              };
            }
            if (s.seatIndex === seatIndex) {
              return {
                ...s,
                studentId: seatA.studentId,
                studentName: seatA.studentName,
                studentNumber: seatA.studentNumber,
                studentGender: seatA.studentGender,
                isLocked: false
              };
            }
            return s;
          })
        );
      }
      setSelectedSeatIndex(null);
    }
  };

  // Reset Seats
  const handleReset = () => {
    if (window.confirm('모든 좌석을 초기화하시겠습니까? (고정석 포함)')) {
      setSeats((prev) =>
        prev.map((s) => ({
          ...s,
          studentId: null,
          studentName: undefined,
          studentNumber: undefined,
          studentGender: undefined,
          isLocked: false
        }))
      );
      setSelectedSeatIndex(null);
    }
  };

  // Save to Firebase
  const handleSaveToFirebase = async () => {
    if (!user || !currentClass) return;

    try {
      setIsSaving(true);
      await saveSeatArrangement({
        classId: currentClass.id,
        ownerUid: user.uid,
        title: title.trim() || '자리 배치',
        rows,
        cols,
        layoutType,
        podiumPosition: 'top',
        seats,
        excludedStudentIds: students.filter((s) => !s.active).map((s) => s.id),
        note: `${activeStudents.length}명 배치`
      });

      setSaveSuccessMsg('자리 배치가 Firebase에 성공적으로 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      loadHistory();
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load selected arrangement from history
  const handleLoadArrangement = (arrangement: ISeatArrangement) => {
    setRows(arrangement.rows);
    setCols(arrangement.cols);
    setLayoutType(arrangement.layoutType || 'grid');
    setTitle(arrangement.title);
    setSeats(arrangement.seats);
    setIsHistoryModalOpen(false);
  };

  // Delete history item
  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 저장 기록을 삭제하시겠습니까?')) {
      try {
        await deleteSeatArrangement(id);
        loadHistory();
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  const occupiedCount = seats.filter((s) => s.studentId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Grid className="w-6 h-6 text-indigo-600" />
            <span>랜덤 자리 배치</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            교실 책상 형태를 설정하고 원클릭으로 학생들을 랜덤 배치합니다. 고정석 지정, 좌석간 맞바꾸기, 저장 및 인쇄를 지원합니다.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>이전 배치 불러오기 ({savedHistory.length})</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>인쇄 모드</span>
          </button>

          <button
            onClick={handleSaveToFirebase}
            disabled={isSaving || occupiedCount === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '배치 결과 저장'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Configuration & Controls Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Row / Col Selectors & Layout */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200">
              <span>행 (줄)</span>
              <select
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-hidden"
              >
                {[3, 4, 5, 6, 7, 8].map((r) => (
                  <option key={r} value={r}>
                    {r}줄
                  </option>
                ))}
              </select>

              <span className="text-slate-300">×</span>

              <span>열 (분단)</span>
              <select
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-hidden"
              >
                {[4, 5, 6, 7, 8, 9, 10].map((c) => (
                  <option key={c} value={c}>
                    {c}열
                  </option>
                ))}
              </select>

              <span className="text-slate-400 text-[11px]">
                (총 {rows * cols}석)
              </span>
            </div>

            {/* Layout type */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setLayoutType('grid')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  layoutType === 'grid'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                단일 격자형
              </button>
              <button
                onClick={() => setLayoutType('pairs')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  layoutType === 'pairs'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2인 짝꿍형 (분단)
              </button>
            </div>
          </div>

          {/* Randomizer Main Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="좌석 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleRandomize}
              disabled={isShuffling || activeStudents.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{occupiedCount === 0 ? '랜덤 자리 배치 시작' : '다시 섞기 (랜덤)'}</span>
            </button>
          </div>
        </div>

        {/* Tip & Status bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 gap-2">
          <div className="flex items-center gap-4">
            <span>
              배치 대상: <strong className="text-slate-800">{activeStudents.length}명</strong>
            </span>
            <span>
              현재 채워진 좌석: <strong className="text-indigo-600">{occupiedCount}석</strong> / {rows * cols}석
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 좌석 클릭 후 다른 좌석을 누르면 위치가 교환됩니다.
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" /> 좌석의 자물쇠를 누르면 고정됩니다.
            </span>
          </div>
        </div>
      </div>

      {/* Classroom View Container (Printable) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="text-center space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-center font-bold text-xl sm:text-2xl text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden px-2 py-0.5"
          />
          <p className="text-xs text-slate-500 print:text-black">
            {currentClass?.schoolYear}학년도 {currentClass?.grade}학년 {currentClass?.className} ({currentClass?.schoolName || '학급'})
          </p>
        </div>

        {/* Podium (교탁 / 칠판 위치) */}
        <div className="flex justify-center">
          <div className="w-64 sm:w-80 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white text-center shadow-md flex items-center justify-center gap-2">
            <span className="text-xs tracking-widest font-semibold uppercase text-slate-300">칠 판 / 교 탁</span>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="overflow-x-auto pb-4">
          <div
            className="grid gap-3 sm:gap-4 mx-auto justify-center min-w-max"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(110px, 135px))`
            }}
          >
            {seats.map((seat) => {
              const isSelected = selectedSeatIndex === seat.seatIndex;
              const hasStudent = !!seat.studentId;
              const isPairGap = layoutType === 'pairs' && seat.col % 2 === 1 && seat.col !== cols - 1;

              return (
                <div
                  key={seat.seatIndex}
                  onClick={() => handleSeatClick(seat.seatIndex)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-24 sm:h-28 ${
                    isPairGap ? 'mr-3 sm:mr-5' : ''
                  } ${
                    isSelected
                      ? 'ring-3 ring-indigo-500 bg-indigo-50 border-indigo-400 shadow-md scale-105 z-10'
                      : hasStudent
                      ? seat.isLocked
                        ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                        : seat.studentGender === 'male'
                        ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 hover:shadow-xs'
                        : seat.studentGender === 'female'
                        ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 hover:shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                      : 'bg-slate-50/50 border-dashed border-slate-300 hover:bg-slate-100/80 text-slate-400'
                  }`}
                >
                  {/* Top Bar inside Desk: Seat Number & Lock Button */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px]">
                      {seat.row + 1}-{seat.col + 1}
                    </span>

                    {hasStudent && (
                      <button
                        onClick={(e) => handleToggleLock(seat.seatIndex, e)}
                        className={`p-1 rounded-md transition-colors ${
                          seat.isLocked
                            ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                            : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200/50'
                        }`}
                        title={seat.isLocked ? '고정 좌석 해제' : '좌석 고정 (랜덤 배치 시 유지)'}
                      >
                        {seat.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Student Info */}
                  {hasStudent ? (
                    <div className="my-auto text-center space-y-0.5">
                      <div className="text-xs font-mono font-bold text-slate-600">
                        {seat.studentNumber}번
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        {seat.studentName}
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto text-center text-xs text-slate-400">
                      빈 좌석
                    </div>
                  )}

                  {/* Bottom Indicator */}
                  <div className="flex items-center justify-between text-[10px]">
                    {hasStudent && seat.studentGender && seat.studentGender !== 'unspecified' ? (
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold ${
                          seat.studentGender === 'male'
                            ? 'text-blue-700 bg-blue-100/80'
                            : 'text-rose-700 bg-rose-100/80'
                        }`}
                      >
                        {seat.studentGender === 'male' ? '남' : '여'}
                      </span>
                    ) : (
                      <span></span>
                    )}

                    {seat.isLocked && (
                      <span className="text-[10px] text-amber-700 font-semibold">고정</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Classroom Note */}
        <div className="text-center text-xs text-slate-400 print:text-black">
          ※ 뒤쪽 (출입문 / 사물함 방향)
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                이전 자리 배치 기록 ({savedHistory.length})
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-2.5">
              {savedHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  아직 저장된 자리 배치 기록이 없습니다.
                </div>
              ) : (
                savedHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadArrangement(item)}
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
                        <span>
                          {item.rows}×{item.cols} ({item.seats.filter((s) => s.studentId).length}명)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
