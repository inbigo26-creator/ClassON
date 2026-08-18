import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveSubmissionItem,
  updateSubmissionItem,
  getSubmissionItems,
  deleteSubmissionItem
} from '../../lib/firestoreService';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Copy,
  Check,
  Search,
  Trash2,
  Clock,
  Send,
  FileCheck,
  X,
  Edit2
} from 'lucide-react';
import { SubmissionItem, Student } from '../../types';

export const SubmissionTracker: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, students } = useClass();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New Submission Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [unsubmittedOnly, setUnsubmittedOnly] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const activeStudents = students.filter((s) => s.active);

  useEffect(() => {
    if (!user || !currentClass) return;
    loadSubmissions();
  }, [user, currentClass?.id]);

  const loadSubmissions = async () => {
    if (!user || !currentClass) return;
    try {
      setLoading(true);
      const list = await getSubmissionItems(currentClass.id, user.uid);
      setSubmissions(list);
      if (list.length > 0 && !selectedSubmissionId) {
        setSelectedSubmissionId(list[0].id);
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentSubmission = submissions.find((s) => s.id === selectedSubmissionId);

  // Toggle student submission status
  const handleToggleSubmit = async (studentId: string) => {
    if (!currentSubmission) return;

    const submittedSet = new Set<string>(currentSubmission.submittedStudentIds || []);
    if (submittedSet.has(studentId)) {
      submittedSet.delete(studentId);
    } else {
      submittedSet.add(studentId);
    }

    const updatedList: string[] = Array.from(submittedSet);

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === currentSubmission.id
          ? { ...item, submittedStudentIds: updatedList }
          : item
      )
    );

    try {
      await updateSubmissionItem(currentSubmission.id, {
        submittedStudentIds: updatedList
      });
    } catch (err: any) {
      console.error('Error updating submission item:', err);
    }
  };

  // Bulk mark all submitted
  const handleMarkAllSubmitted = async () => {
    if (!currentSubmission) return;
    const allIds = activeStudents.map((s) => s.id);

    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === currentSubmission.id
          ? { ...item, submittedStudentIds: allIds }
          : item
      )
    );

    try {
      await updateSubmissionItem(currentSubmission.id, {
        submittedStudentIds: allIds
      });
    } catch (err: any) {
      console.error('Error marking all submitted:', err);
    }
  };

  // Create new submission item
  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentClass || !newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const newId = await saveSubmissionItem({
        classId: currentClass.id,
        ownerUid: user.uid,
        title: newTitle.trim(),
        dueDate: newDueDate,
        description: newDescription.trim(),
        targetStudentIds: activeStudents.map((s) => s.id),
        submittedStudentIds: [],
        notesMap: {}
      });

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      await loadSubmissions();
      setSelectedSubmissionId(newId);
    } catch (err: any) {
      alert('등록 실패: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete submission item
  const handleDeleteSubmission = async (id: string) => {
    if (window.confirm('이 제출물 항목을 삭제하시겠습니까?')) {
      try {
        await deleteSubmissionItem(id);
        const remaining = submissions.filter((s) => s.id !== id);
        setSubmissions(remaining);
        if (selectedSubmissionId === id) {
          setSelectedSubmissionId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  // Copy unsubmitted students list for texting parents/notice
  const handleCopyUnsubmittedList = () => {
    if (!currentSubmission) return;

    const submittedSet = new Set(currentSubmission.submittedStudentIds || []);
    const unsubmittedStudents = activeStudents.filter((s) => !submittedSet.has(s.id));

    if (unsubmittedStudents.length === 0) {
      alert('모든 학생이 제출 완료하였습니다! 🎉');
      return;
    }

    const nameList = unsubmittedStudents
      .map((s) => `${s.number}번 ${s.name}`)
      .join(', ');

    const text = `[${currentClass?.grade}학년 ${currentClass?.className} ${currentSubmission.title} 미제출 안내]\n• 마감일: ${currentSubmission.dueDate}\n• 미제출 학생 (${unsubmittedStudents.length}명): ${nameList}\n※ 확인 후 빠른 제출 부탁드립니다.`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Calculate D-Day
  const getDDay = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: '오늘 마감', color: 'bg-rose-100 text-rose-800 font-bold border-rose-300' };
    if (diffDays > 0) return { label: `D-${diffDays}`, color: 'bg-indigo-100 text-indigo-800 font-semibold border-indigo-200' };
    return { label: `마감 초과 (${Math.abs(diffDays)}일 전)`, color: 'bg-slate-200 text-slate-700 font-medium' };
  };

  const submittedCount = currentSubmission
    ? (currentSubmission.submittedStudentIds || []).length
    : 0;
  const unsubmittedCount = activeStudents.length - submittedCount;
  const submitRate =
    activeStudents.length > 0 ? Math.round((submittedCount / activeStudents.length) * 100) : 0;

  // Filter students
  const filteredStudents = activeStudents.filter((student) => {
    const isSubmitted = (currentSubmission?.submittedStudentIds || []).includes(student.id);
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.number.toString().includes(searchTerm);

    if (unsubmittedOnly && isSubmitted) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            <span>제출물 체크 및 관리</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            동의서, 과제, 설문지 등의 제출 현황을 한눈에 확인하고 미제출 학생 명단을 간편하게 추출합니다.
          </p>
        </div>

        {/* Action */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>새 제출 항목 추가</span>
        </button>
      </div>

      {/* Main Layout: Left Submissions List, Right Active Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Submission Items List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            진행 중인 제출 항목 ({submissions.length})
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <ClipboardList className="w-8 h-8 mx-auto text-slate-400" />
              <div>등록된 제출물이 없습니다.</div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                + 첫 제출물 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {submissions.map((item) => {
                const isSelected = selectedSubmissionId === item.id;
                const dDay = getDDay(item.dueDate);
                const sCount = (item.submittedStudentIds || []).length;
                const rate =
                  activeStudents.length > 0
                    ? Math.round((sCount / activeStudents.length) * 100)
                    : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSubmissionId(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'bg-white border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 leading-snug">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] border ${dDay.color}`}
                          >
                            {dDay.label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubmission(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="제출물 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">
                          {sCount}/{activeStudents.length}명 제출
                        </span>
                        <span className="font-bold text-indigo-600">{rate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            rate === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Checker for Selected Submission */}
        <div className="lg:col-span-8 space-y-4">
          {currentSubmission ? (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              
              {/* Submission Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {currentSubmission.title}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs border ${
                        getDDay(currentSubmission.dueDate).color
                      }`}
                    >
                      {getDDay(currentSubmission.dueDate).label}
                    </span>
                  </div>
                  {currentSubmission.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {currentSubmission.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyUnsubmittedList}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedText ? '문자 양식 복사됨' : '미제출 명단 복사'}</span>
                  </button>

                  <button
                    onClick={handleMarkAllSubmitted}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>전원 제출 처리</span>
                  </button>
                </div>
              </div>

              {/* Big Progress Status Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-slate-500 font-medium">제출 완료</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">
                    {submittedCount}명
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">미제출</div>
                  <div className="text-2xl font-black text-rose-600 mt-0.5">
                    {unsubmittedCount}명
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">진행률</div>
                  <div className="text-2xl font-black text-indigo-700 mt-0.5">
                    {submitRate}%
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="학생 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 select-none">
                    <input
                      type="checkbox"
                      checked={unsubmittedOnly}
                      onChange={(e) => setUnsubmittedOnly(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                    />
                    <span>미제출 학생만 보기 ({unsubmittedCount}명)</span>
                  </label>
                </div>
              </div>

              {/* Student Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredStudents.map((student) => {
                  const isSubmitted = (currentSubmission.submittedStudentIds || []).includes(
                    student.id
                  );

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleSubmit(student.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSubmitted
                          ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {student.number.toString().padStart(2, '0')}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{student.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>제출 완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>미제출</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">확인할 제출물을 선택해주세요</div>
              <p className="text-xs text-slate-500">
                좌측 목록에서 항목을 선택하거나 [새 제출 항목 추가] 버튼을 눌러 과제를 등록하세요.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Submission Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                새 제출 항목 추가
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmission} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  제출 항목명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 현장체험학습 참가 동의서"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  제출 마감일 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  설명 또는 안내사항 (선택)
                </label>
                <textarea
                  rows={3}
                  placeholder="예: 학부모 서명 필히 포함, 온라인 구글폼 제출 가능"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? '추가 중...' : '제출 항목 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
