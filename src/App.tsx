import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassProvider, useClass } from './contexts/ClassContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentRoster } from './components/Roster/StudentRoster';
import { SeatArrangement } from './components/Seats/SeatArrangement';
import { GroupFormation } from './components/Groups/GroupFormation';
import { FieldAttendance } from './components/Attendance/FieldAttendance';
import { DutyAssignment } from './components/Duties/DutyAssignment';
import { StudentPicker } from './components/Picker/StudentPicker';
import { SubmissionTracker } from './components/Submissions/SubmissionTracker';
import { ClassSettings } from './components/Settings/ClassSettings';
import { LoginModal } from './components/Auth/LoginModal';
import { NavigationTab } from './types';

const MainContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { students } = useClass();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center animate-bounce">
          <span className="text-2xl text-white font-black">班</span>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-800 tracking-tight">학급 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // If user is not logged in, show Bento-themed Login Screen
  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Bento Header / Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* 2. Bento Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          studentCount={students.length}
        />

        {/* 3. Main Workspace Bento Stage */}
        <main className="flex-1 min-w-0 lg:pl-64">
          <div className="transition-all duration-200">
            {currentTab === 'dashboard' && <Dashboard onSelectTab={setCurrentTab} />}
            {currentTab === 'roster' && <StudentRoster />}
            {currentTab === 'seats' && <SeatArrangement />}
            {currentTab === 'groups' && <GroupFormation />}
            {currentTab === 'attendance' && <FieldAttendance />}
            {currentTab === 'duties' && <DutyAssignment />}
            {currentTab === 'picker' && <StudentPicker />}
            {currentTab === 'submissions' && <SubmissionTracker />}
            {currentTab === 'settings' && <ClassSettings />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClassProvider>
        <MainContent />
      </ClassProvider>
    </AuthProvider>
  );
}

