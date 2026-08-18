export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface ClassInfo {
  id: string;
  ownerUid: string;
  schoolName: string;
  grade: number;
  className: string; // e.g. "3반"
  schoolYear: number; // e.g. 2026
  homeroomTeacherName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Gender = 'male' | 'female' | 'unspecified';

export interface Student {
  id: string;
  classId: string;
  ownerUid: string;
  number: number;
  name: string;
  gender: Gender;
  active: boolean; // active in class (false if transferred or long-term absent)
  memo?: string;
  avoidWith?: string[]; // IDs of students to avoid sitting next to
  createdAt: string;
  updatedAt?: string;
}

export interface SeatSlot {
  seatIndex: number;
  row: number;
  col: number;
  studentId: string | null;
  studentName?: string;
  studentNumber?: number;
  studentGender?: Gender;
  isLocked?: boolean;
  isEmptyDesk?: boolean; // placeholder or empty corridor
}

export interface SeatArrangement {
  id: string;
  classId: string;
  ownerUid: string;
  title: string;
  rows: number;
  cols: number;
  layoutType: 'grid' | 'pairs' | 'u_shape'; // standard grid or 2-person desk pairs
  podiumPosition: 'top' | 'bottom';
  seats: SeatSlot[];
  excludedStudentIds: string[];
  createdAt: string;
  note?: string;
}

export interface GroupItem {
  groupNumber: number;
  groupName: string;
  memberIds: string[];
  members: {
    id: string;
    number: number;
    name: string;
    gender: Gender;
  }[];
}

export interface GroupArrangement {
  id: string;
  classId: string;
  ownerUid: string;
  title: string;
  groupCount: number;
  membersPerGroup: number;
  groups: GroupItem[];
  excludedStudentIds: string[];
  balanceGender: boolean;
  createdAt: string;
}

export interface DutyRole {
  roleId: string;
  roleName: string;
  iconName?: string;
  count: number;
  assignedStudentIds: string[];
  assignedStudents: {
    id: string;
    number: number;
    name: string;
  }[];
}

export interface DutyArrangement {
  id: string;
  classId: string;
  ownerUid: string;
  title: string;
  date: string; // YYYY-MM-DD
  roles: DutyRole[];
  notes?: string;
  createdAt: string;
}

export interface StudentPickRecord {
  id: string;
  classId: string;
  ownerUid: string;
  title: string; // e.g. "수학 문제 발표자", "학급 청소 도우미"
  pickedCount: number;
  pickedStudents: {
    id: string;
    number: number;
    name: string;
  }[];
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface FieldAttendanceRecord {
  id: string;
  classId: string;
  ownerUid: string;
  activityName: string; // e.g. "2026학년도 1학기 현장체험학습", "대학 탐방 진로체험"
  date: string; // YYYY-MM-DD
  location?: string;
  statusMap: Record<string, AttendanceStatus>; // studentId -> status
  notesMap: Record<string, string>; // studentId -> note (e.g. "사유: 병결")
  createdAt: string;
  updatedAt?: string;
}

export interface SubmissionItem {
  id: string;
  classId: string;
  ownerUid: string;
  title: string; // e.g. "수학여행 참가 동의서", "건강검진 문진표", "진로활동 보고서"
  dueDate: string; // YYYY-MM-DD
  description?: string;
  targetStudentIds: string[]; // which students need to submit (default all active)
  submittedStudentIds: string[]; // who submitted
  notesMap: Record<string, string>; // studentId -> memo
  createdAt: string;
  updatedAt?: string;
}

export type NavigationTab = 
  | 'dashboard'
  | 'roster'
  | 'seats'
  | 'groups'
  | 'attendance'
  | 'duties'
  | 'picker'
  | 'submissions'
  | 'settings';
