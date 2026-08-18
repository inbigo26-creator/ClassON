import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveFieldAttendance,
  updateFieldAttendance,
  getFieldAttendances,
  deleteFieldAttendance
} from '../../lib/firestoreService';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Save,
  Plus,
  History,
  QrCode,
  Copy,
  Check,
  Search,
  Users,
  MapPin,
  Calendar,
  Trash2,
  FileText
} from 'lucide-react';
import { FieldAttendanceRecord, AttendanceStatus, Student } from '../../types';

export const FieldAttendance: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  // Current activity fields
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [activityName, setActivityName] = useState<string>('현장체험학습 (외부활동)');
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [location, setLocation] = useState<string>('국립중앙박물관');

  // Attendance states
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // History & QR States
  const [savedHistory, setSavedHistory] = useState<FieldAttendanceRecord[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const activeStudents = students.filter((s) => s.active);

  // Initialize statusMap: default all to 'present' if new
  useEffect(() => {
    if (activeStudents.length > 0 && Object.keys(statusMap).length === 0) {
      const initialMap: Record<string, AttendanceStatus> = {};
      activeStudents.forEach((s) => {
        initialMap[s.id] = 'present';
      });
      setStatusMap(initialMap);
    }
  }, [activeStudents.length]);

  useEffect(() => {
    if (!user || !currentClass) return;
    loadHistory();
  }, [user, currentClass?.id]);

  const loadHistory = async () => {
    if (!user || !currentClass) return;
    try {
      const list = await getFieldAttendances(currentClass.id, user.uid);
      setSavedHistory(list);
    } catch (err) {
      console.error('Error loading attendances history:', err);
    }
  };

  // Status toggle handler
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Set all to Present
  const handleAllPresent = () => {
    const newMap: Record<string, AttendanceStatus> = {};
    activeStudents.forEach((s) => {
      newMap[s.id] = 'present';
    });
    setStatusMap(newMap);
  };

  // Note handler
  const handleSaveNote = (studentId: string, note: string) => {
    setNotesMap((prev) => ({
      ...prev,
      [studentId]: note
    }));
    setEditingNoteStudentId(null);
  };

  // Save or Update Attendance Record in Firestore
  const handleSaveToFirestore = async () => {
    if (!user || !currentClass) return;

    try {
      setIsSaving(true);
      if (currentId) {
        // Update existing
        await updateFieldAttendance(currentId, {
          activityName: activityName.trim() || '외부활동 출석',
          date: activityDate,
          location: location.trim(),
          statusMap,
          notesMap
        });
        setSaveSuccessMsg('출석 기록이 수정 저장되었습니다.');
      } else {
        // Create new
        const newId = await saveFieldAttendance({
          classId: currentClass.id,
          ownerUid: user.uid,
          activityName: activityName.trim() || '외부활동 출석',
          date: activityDate,
          location: location.trim(),
          statusMap,
          notesMap
        });
        setCurrentId(newId);
        setSaveSuccessMsg('새 출석 기록이 Firebase에 안전하게 저장되었습니다!');
      }

      setTimeout(() => setSaveSuccessMsg(null), 3500);
      loadHistory();
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load from history
  const handleLoadRecord = (record: FieldAttendanceRecord) => {
    setCurrentId(record.id);
    setActivityName(record.activityName);
    setActivityDate(record.date);
    setLocation(record.location || '');
    setStatusMap(record.statusMap || {});
    setNotesMap(record.notesMap || {});
    setIsHistoryModalOpen(false);
  };

  // New attendance sheet
  const handleNewRecord = () => {
    setCurrentId(null);
    setActivityName('새 외부활동 출석');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    const initialMap: Record<string, AttendanceStatus> = {};
    activeStudents.forEach((s) => {
      initialMap[s.id] = 'present';
    });
    setStatusMap(initialMap);
    setNotesMap({});
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 출석 기록을 삭제하시겠습니까?')) {
      try {
        await deleteFieldAttendance(id);
        if (currentId === id) {
          handleNewRecord();
        }
        loadHistory();
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  // Calculate statistics
  const presentCount = activeStudents.filter((s) => (statusMap[s.id] || 'present') === 'present').length;
  const lateCount = activeStudents.filter((s) => statusMap[s.id] === 'late').length;
  const absentCount = activeStudents.filter((s) => statusMap[s.id] === 'absent').length;
  const excusedCount = activeStudents.filter((s) => statusMap[s.id] === 'excused').length;

  const attendanceRate = activeStudents.length > 0 ? Math.round((presentCount / activeStudents.length) * 100) : 0;

  // Filtered students for display
  const filteredStudents = activeStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.number.toString().includes(searchTerm);

    const currentStatus = statusMap[student.id] || 'present';
    const matchesStatus = statusFilter === 'all' ? true : currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Copy Attendance Summary for text/messenger
  const handleCopySummary = () => {
    const absentList = activeStudents
      .filter((s) => statusMap[s.id] === 'absent')
      .map((s) => `${s.number}번 ${s.name}${notesMap[s.id] ? `(${notesMap[s.id]})` : ''}`)
      .join(', ');

    const lateList = activeStudents
      .filter((s) => statusMap[s.id] === 'late')
      .map((s) => `${s.number}번 ${s.name}${notesMap[s.id] ? `(${notesMap[s.id]})` : ''}`)
      .join(', ');

    let report = `[${currentClass?.schoolYear}학년도 ${currentClass?.grade}학년 ${currentClass?.className} ${activityName} 출결 보고]\n`;
    report += `• 일시: ${activityDate} / 장소: ${location || '미기재'}\n`;
    report += `• 총원: ${activeStudents.length}명 / 출석: ${presentCount}명 / 지각: ${lateCount}명 / 결석: ${absentCount}명 / 미참여: ${excusedCount}명\n`;
    if (absentList) report += `• 결석자: ${absentList}\n`;
    if (lateList) report += `• 지각자: ${lateList}\n`;

    navigator.clipboard.writeText(report.trim());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-indigo-600" />
            <span>외부활동 출석체크</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            현장체험학습, 진로탐방, 교외행사 등에서 학생 출결을 실시간으로 확인하고 기록을 보관합니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleNewRecord}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>새 활동 작성</span>
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>이전 출석 기록 ({savedHistory.length})</span>
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>QR 출석 안내</span>
          </button>

          <button
            onClick={handleSaveToFirestore}
            disabled={isSaving || activeStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '출석 기록 저장'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Activity Details Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              활동명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="예: 2026학년도 현장체험학습"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">활동 일자</label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">장소 / 목적지</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 에버랜드, 국립박물관"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Live Attendance Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">재적 총원</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{activeStudents.length}명</div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/80">
            <div className="text-[11px] font-medium text-emerald-700 flex items-center justify-between">
              <span>출석</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-emerald-800 mt-0.5">
              {presentCount}명 <span className="text-xs font-normal text-emerald-600">({attendanceRate}%)</span>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-medium text-amber-700 flex items-center justify-between">
              <span>지각</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-amber-800 mt-0.5">{lateCount}명</div>
          </div>

          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/80">
            <div className="text-[11px] font-medium text-rose-700 flex items-center justify-between">
              <span>결석</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-rose-800 mt-0.5">{absentCount}명</div>
          </div>

          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
              <span>미참여/인정</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{excusedCount}명</div>
          </div>
        </div>
      </div>

      {/* Roster & Attendance Check Table */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="학생 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter & Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleAllPresent}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>전원 출석 처리</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedSummary ? '보고서 복사됨' : '출결 보고서 복사'}</span>
            </button>

            {/* Status Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setStatusFilter('absent')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'absent' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                결석자만 ({absentCount})
              </button>
              <button
                onClick={() => setStatusFilter('late')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === 'late' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                지각자만 ({lateCount})
              </button>
            </div>
          </div>
        </div>

        {/* Student Attendance List */}
        {activeStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            등록된 재적 학생이 없습니다. 먼저 [학생 명단]에서 학생을 등록해주세요.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            해당 조건의 학생이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((student) => {
              const currentStatus = statusMap[student.id] || 'present';
              const currentNote = notesMap[student.id] || '';
              const isEditingNote = editingNoteStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    currentStatus === 'present'
                      ? 'bg-white border-slate-200 hover:border-emerald-300'
                      : currentStatus === 'late'
                      ? 'bg-amber-50/40 border-amber-300'
                      : currentStatus === 'absent'
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-slate-100/60 border-slate-300'
                  }`}
                >
                  {/* Student Header & Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {student.number.toString().padStart(2, '0')}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{student.name}</span>
                      {student.gender && student.gender !== 'unspecified' && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            student.gender === 'male' ? 'text-blue-700 bg-blue-100/80' : 'text-rose-700 bg-rose-100/80'
                          }`}
                        >
                          {student.gender === 'male' ? '남' : '여'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setEditingNoteStudentId(isEditingNote ? null : student.id)
                      }
                      className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{currentNote ? '메모 수정' : '메모 추가'}</span>
                    </button>
                  </div>

                  {/* Fast Status Selector Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>출석</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>지각</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>결석</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(student.id, 'excused')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                        currentStatus === 'excused'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>미참여</span>
                    </button>
                  </div>

                  {/* Memo field or display */}
                  {isEditingNote ? (
                    <div className="pt-1 flex items-center gap-1">
                      <input
                        type="text"
                        defaultValue={currentNote}
                        placeholder="사유 입력 (예: 병결, 10시 합류)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNote(student.id, (e.target as HTMLInputElement).value);
                          }
                        }}
                        onBlur={(e) => handleSaveNote(student.id, e.target.value)}
                        autoFocus
                        className="w-full px-2 py-1 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ) : currentNote ? (
                    <div className="text-[11px] text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-slate-200/60 truncate">
                      📝 {currentNote}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Attendance 안내 Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                현장체험학습 QR 출석 안내
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              {/* Clean SVG QR Code Placeholder / Simulator */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border border-slate-300 flex items-center justify-center shadow-xs">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner boxes */}
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="14" width="16" height="16" fill="white" />
                  <rect x="18" y="18" width="8" height="8" fill="#4338ca" />

                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                  <rect x="70" y="14" width="16" height="16" fill="white" />
                  <rect x="74" y="18" width="8" height="8" fill="#4338ca" />

                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                  <rect x="14" y="70" width="16" height="16" fill="white" />
                  <rect x="18" y="74" width="8" height="8" fill="#4338ca" />

                  {/* QR Pattern dots */}
                  <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="44" y="24" width="8" height="8" fill="#4338ca" />
                  <rect x="40" y="40" width="20" height="20" fill="#0f172a" />
                  <rect x="46" y="46" width="8" height="8" fill="white" />
                  <rect x="12" y="44" width="8" height="8" fill="#0f172a" />
                  <rect x="24" y="48" width="6" height="6" fill="#0f172a" />
                  <rect x="68" y="42" width="10" height="10" fill="#0f172a" />
                  <rect x="80" y="56" width="8" height="8" fill="#4338ca" />
                  <rect x="42" y="70" width="12" height="12" fill="#0f172a" />
                  <rect x="68" y="72" width="18" height="14" fill="#0f172a" />
                </svg>
              </div>

              <div className="text-xs font-semibold text-slate-800">
                {currentClass?.grade}학년 {currentClass?.className} {activityName}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                학생들이 카메라로 QR을 스캔하면 본인의 출석번호와 이름을 선택하여 출석 체크를 전송할 수 있는 확장 구조가 지원됩니다.
              </p>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold"
            >
              확인 완료
            </button>
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
                이전 출석 기록 ({savedHistory.length})
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
                  아직 저장된 외부활동 출석 기록이 없습니다.
                </div>
              ) : (
                savedHistory.map((item) => {
                  const pCount = Object.values(item.statusMap || {}).filter(
                    (v) => v === 'present'
                  ).length;
                  const total = Object.keys(item.statusMap || {}).length;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleLoadRecord(item)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        currentId === item.id
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">
                          {item.activityName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          {item.location && (
                            <>
                              <span>•</span>
                              <span>{item.location}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            출석 {pCount}/{total || activeStudents.length}명
                          </span>
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
