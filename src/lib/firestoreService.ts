import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SeatArrangement,
  GroupArrangement,
  DutyArrangement,
  StudentPickRecord,
  FieldAttendanceRecord,
  SubmissionItem
} from '../types';

// ==========================================
// 1. SEAT ARRANGEMENTS
// ==========================================
export async function saveSeatArrangement(
  data: Omit<SeatArrangement, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'seat_arrangements'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getSeatArrangements(
  classId: string,
  ownerUid: string
): Promise<SeatArrangement[]> {
  const q = query(
    collection(db, 'seat_arrangements'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: SeatArrangement[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as SeatArrangement);
  });
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function deleteSeatArrangement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'seat_arrangements', id));
}

// ==========================================
// 2. GROUP ARRANGEMENTS
// ==========================================
export async function saveGroupArrangement(
  data: Omit<GroupArrangement, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'group_arrangements'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getGroupArrangements(
  classId: string,
  ownerUid: string
): Promise<GroupArrangement[]> {
  const q = query(
    collection(db, 'group_arrangements'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: GroupArrangement[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as GroupArrangement);
  });
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function deleteGroupArrangement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'group_arrangements', id));
}

// ==========================================
// 3. DUTY ARRANGEMENTS (당번 배정)
// ==========================================
export async function saveDutyArrangement(
  data: Omit<DutyArrangement, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'duty_arrangements'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getDutyArrangements(
  classId: string,
  ownerUid: string
): Promise<DutyArrangement[]> {
  const q = query(
    collection(db, 'duty_arrangements'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: DutyArrangement[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as DutyArrangement);
  });
  list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  return list;
}

export async function deleteDutyArrangement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'duty_arrangements', id));
}

// ==========================================
// 4. STUDENT PICKS (학생 뽑기 기록)
// ==========================================
export async function saveStudentPick(
  data: Omit<StudentPickRecord, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'student_picks'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getStudentPicks(
  classId: string,
  ownerUid: string
): Promise<StudentPickRecord[]> {
  const q = query(
    collection(db, 'student_picks'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: StudentPickRecord[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as StudentPickRecord);
  });
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function deleteStudentPick(id: string): Promise<void> {
  await deleteDoc(doc(db, 'student_picks', id));
}

// ==========================================
// 5. FIELD ATTENDANCES (외부활동 출석)
// ==========================================
export async function saveFieldAttendance(
  data: Omit<FieldAttendanceRecord, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'field_attendances'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateFieldAttendance(
  id: string,
  updates: Partial<FieldAttendanceRecord>
): Promise<void> {
  await updateDoc(doc(db, 'field_attendances', id), {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getFieldAttendances(
  classId: string,
  ownerUid: string
): Promise<FieldAttendanceRecord[]> {
  const q = query(
    collection(db, 'field_attendances'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: FieldAttendanceRecord[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as FieldAttendanceRecord);
  });
  list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  return list;
}

export async function deleteFieldAttendance(id: string): Promise<void> {
  await deleteDoc(doc(db, 'field_attendances', id));
}

// ==========================================
// 6. SUBMISSIONS (제출물 체크)
// ==========================================
export async function saveSubmissionItem(
  data: Omit<SubmissionItem, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'submissions'), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateSubmissionItem(
  id: string,
  updates: Partial<SubmissionItem>
): Promise<void> {
  await updateDoc(doc(db, 'submissions', id), {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function getSubmissionItems(
  classId: string,
  ownerUid: string
): Promise<SubmissionItem[]> {
  const q = query(
    collection(db, 'submissions'),
    where('ownerUid', '==', ownerUid),
    where('classId', '==', classId)
  );
  const snapshot = await getDocs(q);
  const list: SubmissionItem[] = [];
  snapshot.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as SubmissionItem);
  });
  list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return list;
}

export async function deleteSubmissionItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'submissions', id));
}
