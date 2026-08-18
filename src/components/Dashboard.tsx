import React, { useEffect, useState } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getSeatArrangements,
  getDutyArrangements,
  getFieldAttendances,
  getSubmissionItems
} from '../lib/firestoreService';
import {
  Users,
  Grid,
  Users2,
  CalendarCheck2,
  Flame,
  Sparkles,
  ClipboardList,
  ArrowRight,
  School,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { NavigationTab, DutyArrangement, SubmissionItem, FieldAttendanceRecord, SeatArrangement } from '../types';

interface DashboardProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const { currentClass, students, generateSampleStudents } = useClass();

  const [latestDuty, setLatestDuty] = useState<DutyArrangement | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [latestAttendance, setLatestAttendance] = useState<FieldAttendanceRecord | null>(null);
  const [latestSeat, setLatestSeat] = useState<SeatArrangement | null>(null);

  const activeStudents = students.filter((s) => s.active);

  useEffect(() => {
    if (!user || !currentClass) return;

    // Load recent activities for dashboard widgets
    getDutyArrangements(currentClass.id, user.uid)
      .then((list) => {
        if (list.length > 0) setLatestDuty(list[0]);
      })
      .catch(console.error);

    getSubmissionItems(currentClass.id, user.uid)
      .then((list) => {
        setSubmissions(list);
      })
      .catch(console.error);

    getFieldAttendances(currentClass.id, user.uid)
      .then((list) => {
        if (list.length > 0) setLatestAttendance(list[0]);
      })
      .catch(console.error);

    getSeatArrangements(currentClass.id, user.uid)
      .then((list) => {
        if (list.length > 0) setLatestSeat(list[0]);
      })
      .catch(console.error);
  }, [user, currentClass?.id]);

  const quickTools = [
    {
      tab: 'seats' as NavigationTab,
      title: '자리 배치',
      emoji: '🎲',
      badge: '랜덤',
      desc: '교실 좌석 형태 설정 및 무작위 자리 섞기',
      accentBg: 'bg-blue-100',
      badgeBg: 'bg-blue-300'
    },
    {
      tab: 'groups' as NavigationTab,
      title: '모둠 편성',
      emoji: '👥',
      badge: '균등배정',
      desc: '모둠수·인원별 균등 배정 및 남녀 비율 조정',
      accentBg: 'bg-indigo-100',
      badgeBg: 'bg-indigo-300'
    },
    {
      tab: 'attendance' as NavigationTab,
      title: '외부활동 출석',
      emoji: '📱',
      badge: '실시간',
      desc: '현장체험학습 및 진로체험 원터치 출결 체크',
      accentBg: 'bg-emerald-100',
      badgeBg: 'bg-emerald-300'
    },
    {
      tab: 'duties' as NavigationTab,
      title: '당번 배정',
      emoji: '🧹',
      badge: '청소/역할',
      desc: '청소·칠판·분리수거 등 학급 역할 자동 배정',
      accentBg: 'bg-amber-100',
      badgeBg: 'bg-amber-300'
    },
    {
      tab: 'picker' as NavigationTab,
      title: '학생 뽑기',
      emoji: '🎯',
      badge: '추첨룰렛',
      desc: '발표자 및 대표자 추첨 애니메이션',
      accentBg: 'bg-purple-100',
      badgeBg: 'bg-purple-300'
    },
    {
      tab: 'submissions' as NavigationTab,
      title: '제출물 체크',
      emoji: '📋',
      badge: '미제출관리',
      desc: '동의서·과제 마감일 관리 및 명단 복사',
      accentBg: 'bg-rose-100',
      badgeBg: 'bg-rose-300'
    }
  ];

  // Calculate ongoing pending submissions
  const pendingSubmissions = submissions.filter((item) => {
    const submittedCount = (item.submittedStudentIds || []).length;
    return submittedCount < activeStudents.length;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Bento Header: Hero Class Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a] relative overflow-hidden">
        {/* Bento Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <School className="w-3.5 h-3.5" />
              <span>{currentClass?.schoolName || '우리 고등학교'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              우리 반 ({currentClass?.schoolYear}학년도 {currentClass?.grade}학년 {currentClass?.className})
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              담임교사 <span className="text-amber-300 font-bold">{currentClass?.homeroomTeacherName || user?.displayName || '선생님'}</span>의 학급 운영 통합 대시보드
            </p>
          </div>

          {/* Quick Roster Badge / Stat Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => onSelectTab('roster')}
              className="bg-white text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] hover:-translate-y-0.5 p-3.5 px-5 rounded-2xl cursor-pointer transition-all flex items-center gap-4 text-left active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-indigo-700 font-black">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">학급 재적 현황</div>
                <div className="text-xl font-black text-slate-900">
                  {students.length}명 <span className="text-xs font-bold text-indigo-600">({activeStudents.length}명 재적)</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* If no students exist, show quick onboarding Bento Banner */}
      {students.length === 0 && (
        <div className="bg-amber-100 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-slate-950 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-base text-slate-900">
                학급에 등록된 학생 명단이 없습니다.
              </div>
              <div className="text-xs text-slate-700 mt-1 font-semibold leading-relaxed">
                테스트를 위해 가상의 고등학생 30명 명단을 원클릭으로 생성하거나 학생을 직접 등록하세요.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={generateSampleStudents}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>샘플 학생 30명 생성</span>
            </button>
            <button
              onClick={() => onSelectTab('roster')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              학생 직접 등록
            </button>
          </div>
        </div>
      )}

      {/* 2. Bento Quick Launchers (빠른 실행 Bento Boxes) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
            <span>담임 업무 빠른 실행 도구 (Bento Tools)</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">원하는 도구를 클릭하여 즉시 시작하세요</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {quickTools.map((tool) => (
            <button
              key={tool.tab}
              onClick={() => onSelectTab(tool.tab)}
              className="bg-white hover:bg-slate-50 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-2xl p-4 text-left transition-all group flex flex-col justify-between h-36 select-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl">{tool.emoji}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900 ${tool.badgeBg} text-slate-950`}>
                  {tool.badge}
                </span>
              </div>

              <div>
                <div className="font-black text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tool.title}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 line-clamp-1 mt-0.5">
                  {tool.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bento Status Widgets Grid (학급 현황 Bento Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>오늘의 학급 현황 요약 (Bento Widgets)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Bento Widget 1: Student Roster Summary */}
          <div
            onClick={() => onSelectTab('roster')}
            className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 bg-sky-100 px-2 py-0.5 rounded-md border border-slate-900">
                <Users className="w-3.5 h-3.5 text-sky-700" />
                학생 명단
              </span>
              <span className="text-xs text-indigo-700 font-extrabold flex items-center gap-0.5">
                상세보기 →
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-slate-900">
                총 {students.length}명
              </div>
              <div className="text-xs font-bold text-slate-600">
                재적 {activeStudents.length}명 / 남 {students.filter((s) => s.gender === 'male').length}명 · 여 {students.filter((s) => s.gender === 'female').length}명
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
              학급 기본 명단 및 특이사항 관리
            </div>
          </div>

          {/* Bento Widget 2: Recent Outdoor Attendance */}
          <div
            onClick={() => onSelectTab('attendance')}
            className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 bg-emerald-100 px-2 py-0.5 rounded-md border border-slate-900">
                <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                외부활동 출결
              </span>
              <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-0.5">
                출석체크 →
              </span>
            </div>

            {latestAttendance ? (
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 truncate">
                  {latestAttendance.activityName}
                </div>
                <div className="text-xs text-emerald-800 font-bold">
                  출석 {Object.values(latestAttendance.statusMap || {}).filter((v) => v === 'present').length}명 / 결석 {Object.values(latestAttendance.statusMap || {}).filter((v) => v === 'absent').length}명
                </div>
                <div className="text-[11px] font-bold text-slate-500">{latestAttendance.date}</div>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 my-auto">
                기록된 외부활동 출결이 없습니다.
              </div>
            )}

            <div className="text-[11px] font-bold text-slate-500 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              현장체험·체육대회 실시간 모바일 출결
            </div>
          </div>

          {/* Bento Widget 3: Pending Submissions */}
          <div
            onClick={() => onSelectTab('submissions')}
            className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 bg-rose-100 px-2 py-0.5 rounded-md border border-slate-900">
                <ClipboardList className="w-3.5 h-3.5 text-rose-700" />
                제출물 확인
              </span>
              <span className="text-xs text-rose-700 font-extrabold flex items-center gap-0.5">
                확인하기 →
              </span>
            </div>

            {pendingSubmissions.length > 0 ? (
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 truncate">
                  {pendingSubmissions[0].title}
                </div>
                <div className="text-xs text-rose-700 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    미제출 {activeStudents.length - (pendingSubmissions[0].submittedStudentIds || []).length}명
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  마감일: {pendingSubmissions[0].dueDate}
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 my-auto">
                모든 제출물이 완료되었거나 항목이 없습니다.
              </div>
            )}

            <div className="text-[11px] font-bold text-slate-500 bg-rose-50 p-2 rounded-xl border border-rose-200">
              진행 중 제출물 총 {submissions.length}개
            </div>
          </div>

          {/* Bento Widget 4: Today's Duty Summary */}
          <div
            onClick={() => onSelectTab('duties')}
            className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-0.5 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 bg-amber-100 px-2 py-0.5 rounded-md border border-slate-900">
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                오늘의 당번
              </span>
              <span className="text-xs text-amber-800 font-extrabold flex items-center gap-0.5">
                배정하기 →
              </span>
            </div>

            {latestDuty ? (
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 truncate">
                  {latestDuty.title}
                </div>
                <div className="text-xs font-bold text-slate-700 truncate">
                  {latestDuty.roles
                    .slice(0, 2)
                    .map((r) => `${r.roleName}: ${r.assignedStudents.map((s) => s.name).join(', ')}`)
                    .join(' / ')}
                </div>
                <div className="text-[11px] font-bold text-slate-500">{latestDuty.date}</div>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 my-auto">
                오늘 배정된 당번 기록이 없습니다.
              </div>
            )}

            <div className="text-[11px] font-bold text-slate-500 bg-amber-50 p-2 rounded-xl border border-amber-200">
              청소·칠판·분리수거 역할 관리
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

