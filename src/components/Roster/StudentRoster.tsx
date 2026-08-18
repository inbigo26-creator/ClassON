import React, { useState } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Search, 
  Printer, 
  Check, 
  X, 
  UserX, 
  UserCheck, 
  AlertCircle,
  HelpCircle,
  ArrowUpDown
} from 'lucide-react';
import { Student, Gender } from '../../types';

export const StudentRoster: React.FC = () => {
  const { 
    currentClass, 
    students, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    bulkAddStudents, 
    generateSampleStudents,
    deleteAllStudentsInClass 
  } = useClass();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Gender>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Single Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [singleNumber, setSingleNumber] = useState<number>(students.length + 1);
  const [singleName, setSingleName] = useState('');
  const [singleGender, setSingleGender] = useState<Gender>('unspecified');
  const [singleMemo, setSingleMemo] = useState('');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Batch Upload Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchError, setBatchError] = useState<string | null>(null);

  // Delete all confirm modal
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.number.toString().includes(searchTerm);

    const matchesGender =
      genderFilter === 'all' ? true : student.gender === genderFilter;

    const matchesActive =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? student.active
        : !student.active;

    return matchesSearch && matchesGender && matchesActive;
  });

  const activeCount = students.filter((s) => s.active).length;
  const maleCount = students.filter((s) => s.gender === 'male').length;
  const femaleCount = students.filter((s) => s.gender === 'female').length;

  const handleOpenAddModal = () => {
    // Next available number
    const maxNum = students.reduce((max, s) => Math.max(max, s.number), 0);
    setSingleNumber(maxNum + 1);
    setSingleName('');
    setSingleGender('unspecified');
    setSingleMemo('');
    setIsAddModalOpen(true);
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    try {
      setIsSubmitting(true);
      await addStudent(singleNumber, singleName.trim(), singleGender, singleMemo.trim());
      setIsAddModalOpen(false);
      setSingleName('');
    } catch (err: any) {
      alert(err.message || '학생 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name.trim()) return;

    try {
      setIsSubmitting(true);
      await updateStudent(editingStudent.id, {
        number: Number(editingStudent.number),
        name: editingStudent.name.trim(),
        gender: editingStudent.gender,
        active: editingStudent.active,
        memo: editingStudent.memo?.trim() || ''
      });
      setEditingStudent(null);
    } catch (err: any) {
      alert(err.message || '학생 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (student: Student) => {
    try {
      await updateStudent(student.id, { active: !student.active });
    } catch (err: any) {
      alert('상태 변경 실패: ' + err.message);
    }
  };

  const handleDelete = async (student: Student) => {
    if (window.confirm(`${student.number}번 ${student.name} 학생을 명단에서 삭제하시겠습니까?`)) {
      try {
        await deleteStudent(student.id);
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  const handleBatchSubmit = async () => {
    if (!batchText.trim()) {
      setBatchError('학생 명단 텍스트를 입력해주세요.');
      return;
    }

    const lines = batchText.trim().split('\n');
    const parsedList: { number: number; name: string; gender?: Gender; memo?: string }[] = [];

    let currentAutoNum = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check CSV, tab-separated, or space-separated
      const tokens = line.split(/[,\t\s]+/).filter(Boolean);
      if (tokens.length === 0) continue;

      let num: number = currentAutoNum;
      let name: string = '';
      let gender: Gender = 'unspecified';
      let memo: string = '';

      // Check if first token is a number
      const firstNum = parseInt(tokens[0], 10);
      if (!isNaN(firstNum) && firstNum > 0 && firstNum < 100) {
        num = firstNum;
        name = tokens[1] || '';
        if (tokens[2]) {
          if (tokens[2] === '남' || tokens[2].toLowerCase() === 'm' || tokens[2] === 'male') gender = 'male';
          else if (tokens[2] === '여' || tokens[2].toLowerCase() === 'f' || tokens[2] === 'female') gender = 'female';
          else memo = tokens.slice(2).join(' ');
        }
        if (tokens[3]) {
          memo = tokens.slice(3).join(' ');
        }
      } else {
        // Name first, auto assign number
        name = tokens[0];
        num = currentAutoNum;
        if (tokens[1]) {
          if (tokens[1] === '남' || tokens[1].toLowerCase() === 'm') gender = 'male';
          else if (tokens[1] === '여' || tokens[1].toLowerCase() === 'f') gender = 'female';
          else memo = tokens.slice(1).join(' ');
        }
      }

      if (name) {
        parsedList.push({ number: num, name, gender, memo });
        currentAutoNum = num + 1;
      }
    }

    if (parsedList.length === 0) {
      setBatchError('유효한 학생 정보를 찾지 못했습니다. 번호와 이름을 확인해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await bulkAddStudents(parsedList);
      setIsBatchModalOpen(false);
      setBatchText('');
      setBatchError(null);
    } catch (err: any) {
      setBatchError(err.message || '일괄 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>학급 학생 명단 관리</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentClass?.schoolYear}학년도 {currentClass?.grade}학년 {currentClass?.className} 학생들의 기본 정보를 관리합니다.
            여기서 등록된 학생 데이터는 자리배치, 모둠, 출석, 당번, 추첨 등 모든 기능에 자동 연동됩니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>명단 인쇄</span>
          </button>
          
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>엑셀/명단 일괄 등록</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>학생 추가</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">전체 등록 학생</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{students.length}명</div>
          <div className="text-[11px] text-slate-400 mt-0.5">총 배정 학생 수</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-emerald-600">재적 (활성) 학생</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}명</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">활동 및 배치 대상</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-blue-600">남학생</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{maleCount}명</div>
          <div className="text-[11px] text-blue-500 mt-0.5">
            {students.length > 0 ? `${Math.round((maleCount / students.length) * 100)}%` : '0%'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-rose-600">여학생</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{femaleCount}명</div>
          <div className="text-[11px] text-rose-500 mt-0.5">
            {students.length > 0 ? `${Math.round((femaleCount / students.length) * 100)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Roster Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="이름 또는 번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  genderFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                전체 성별
              </button>
              <button
                onClick={() => setGenderFilter('male')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  genderFilter === 'male' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                남학생
              </button>
              <button
                onClick={() => setGenderFilter('female')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  genderFilter === 'female' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                여학생
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                재적
              </button>
              <button
                onClick={() => setActiveFilter('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeFilter === 'inactive' ? 'bg-slate-700 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                제외/전출
              </button>
            </div>
          </div>
        </div>

        {/* Empty state check or table */}
        {students.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">아직 등록된 학생이 없습니다</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                학생을 한 명씩 추가하거나, 엑셀/텍스트를 붙여넣어 일괄 등록하세요.
                빠른 테스트를 원하시면 가상 샘플 명단을 생성할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={generateSampleStudents}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>샘플 학생 30명 자동 생성 (원클릭)</span>
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-all"
              >
                명단 직접 입력 / 붙여넣기
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            검색 조건에 맞는 학생이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16">번호</th>
                  <th className="py-3 px-4">이름</th>
                  <th className="py-3 px-3 w-24">성별</th>
                  <th className="py-3 px-3 w-28">상태</th>
                  <th className="py-3 px-4">메모</th>
                  <th className="py-3 px-4 w-32 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !student.active ? 'bg-slate-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {student.number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{student.name}</span>
                        {!student.active && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                            비활성
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {student.gender === 'male' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          남
                        </span>
                      ) : student.gender === 'female' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          여
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleActive(student)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          student.active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {student.active ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>재적 (활성)</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>제외 (비활성)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {student.memo || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="학생 정보 수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom controls */}
        {students.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              표시 중: <span className="font-semibold text-slate-700">{filteredStudents.length}명</span> / 총 {students.length}명
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                학급 전체 학생 명단 비우기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Add Single Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                학생 개별 등록
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    출석번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={singleNumber}
                    onChange={(e) => setSingleNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    학생 성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 홍길동"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleGender('unspecified')}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      singleGender === 'unspecified'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    미지정
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleGender('male')}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      singleGender === 'male'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    남학생
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleGender('female')}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      singleGender === 'female'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    여학생
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">메모 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 반장, 시력 저하로 앞자리 권장 등"
                  value={singleMemo}
                  onChange={(e) => setSingleMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '학생 추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                학생 정보 수정
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    출석번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={editingStudent.number}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, number: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    학생 성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, gender: 'unspecified' })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      editingStudent.gender === 'unspecified'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    미지정
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, gender: 'male' })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      editingStudent.gender === 'male'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    남학생
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, gender: 'female' })}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      editingStudent.gender === 'female'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    여학생
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">활동 상태</label>
                <button
                  type="button"
                  onClick={() => setEditingStudent({ ...editingStudent, active: !editingStudent.active })}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                    editingStudent.active
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {editingStudent.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  <span>{editingStudent.active ? '재적 상태 (활동 및 자리배치 포함)' : '제외 상태 (자리/모둠 등에서 배제)'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
                <input
                  type="text"
                  value={editingStudent.memo || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, memo: e.target.value })
                  }
                  placeholder="특이사항, 직책 등"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '수정사항 적용'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Batch Registration Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                학생 명단 일괄 등록
              </h3>
              <button
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setBatchError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-800 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>복사하여 붙여넣기 안내 (나이스/엑셀 호환)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-700">
                  줄바꿈으로 구분된 텍스트를 붙여넣으세요. 지원 형식:
                  <br />• <strong>번호 이름</strong> (예: <code>1 김민준</code>, <code>2 이서연</code>)
                  <br />• <strong>번호 이름 성별</strong> (예: <code>1 김민준 남</code>, <code>2 이서연 여</code>)
                  <br />• <strong>이름만 한 줄에 하나씩</strong> (번호가 1번부터 자동 부여됩니다)
                </p>
              </div>

              {batchError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  학생 명단 텍스트 붙여넣기
                </label>
                <textarea
                  rows={8}
                  placeholder={`1 김민준 남\n2 이서연 여\n3 박도현 남\n4 정지우 여\n...`}
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    setBatchError(null);
                  }}
                  className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBatchText(
                      `1 김민준 남\n2 이서연 여\n3 박도현 남\n4 정지우 여\n5 최하은 여\n6 윤시우 남\n7 장예준 남\n8 임수아 여`
                    );
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  예시 데이터 채우기
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchModalOpen(false);
                      setBatchError(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={isSubmitting || !batchText.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? '등록 중...' : '일괄 등록하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete All Confirm Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">학생 명단을 모두 삭제할까요?</h3>
              <p className="text-xs text-slate-500 mt-1">
                현재 학급의 모든 학생 데이터({students.length}명)가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteAllStudentsInClass();
                    setIsDeleteAllModalOpen(false);
                  } catch (err: any) {
                    alert('삭제 실패: ' + err.message);
                  }
                }}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                모두 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
