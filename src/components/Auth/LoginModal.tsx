import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  GraduationCap, 
  Sparkles, 
  Grid, 
  Users2, 
  CalendarCheck2, 
  Flame, 
  ClipboardList, 
  ArrowRight,
  Cloud,
  Lock,
  LayoutGrid
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  const features = [
    {
      icon: Grid,
      title: '랜덤 자리 배치',
      desc: '교실 좌석 형태 설정, 고정석/제외석 지정, 깔끔한 인쇄 출력',
      bg: 'bg-blue-100'
    },
    {
      icon: Users2,
      title: '모둠 편성',
      desc: '모둠 수/인원별 균등 배정, 남녀 비율 조정, 결과 즉시 복사',
      bg: 'bg-indigo-100'
    },
    {
      icon: CalendarCheck2,
      title: '외부활동 출석',
      desc: '체험학습·현장견학 시 원터치 출결 기록 및 실시간 통계',
      bg: 'bg-emerald-100'
    },
    {
      icon: Flame,
      title: '당번 배정',
      desc: '청소·칠판·분리수거 등 역할별 자동 배정 및 최근 이력 고려',
      bg: 'bg-amber-100'
    },
    {
      icon: Sparkles,
      title: '학생 뽑기 (추첨)',
      desc: '발표자 및 대표자 뽑기 슬롯 애니메이션과 축하 효과음',
      bg: 'bg-purple-100'
    },
    {
      icon: ClipboardList,
      title: '제출물 체크',
      desc: '가정통신문·동의서 마감일 관리 및 미제출자 문자 알림 명단 추출',
      bg: 'bg-rose-100'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="w-full max-w-4xl bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Side: App Intro & Login */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-300 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                <GraduationCap className="w-4 h-4" />
                <span>선생님을 위한 Bento 학급 운영 솔루션</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  「우리 반」 담임 업무 통합 웹앱
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  자리배치부터 모둠편성, 외부활동 출결, 청소당번, 학생 추첨, 과제 제출물 확인까지 — 
                  담임교사가 매일 쓰는 도구를 Bento Grid 스타일로 간편하게 처리하세요.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-bold rounded-xl flex items-start justify-between">
                  <span>{error}</span>
                  <button onClick={clearError} className="font-black ml-2 text-rose-600 hover:text-rose-900">✕</button>
                </div>
              )}

              {/* Login Button */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 text-sm sm:text-base group"
                >
                  <svg className="w-5 h-5 bg-white rounded-full p-0.5 border border-slate-900" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                    />
                  </svg>
                  <span>{loading ? 'Google 인증 연결 중...' : 'Google 계정으로 시작하기'}</span>
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-xs font-semibold text-slate-500">
                  별도의 회원가입 없이 학교/개인 Google 계정으로 1초만에 시작합니다.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 pt-6 border-t-2 border-slate-100 grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>클라우드 자동 동기화</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>교사별 독립 보안 데이터</span>
              </div>
            </div>
          </div>

          {/* Right Side: Features Bento Box */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-t-2 lg:border-t-0 lg:border-l-2 border-slate-900">
            <div>
              <div className="text-xs font-black text-amber-400 tracking-wider uppercase mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span>통합 학급 관리 기능 모듈</span>
              </div>
              <div className="space-y-3">
                {features.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-800 border border-slate-700">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{feat.title}</div>
                        <div className="text-[11px] text-slate-300 font-medium leading-snug">{feat.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Firebase Firestore 실시간 저장</span>
              <span>2026학년도 최적화</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

