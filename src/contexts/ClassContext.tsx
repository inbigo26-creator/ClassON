import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { ClassInfo, Student, Gender } from '../types';

interface ClassContextType {
  classes: ClassInfo[];
  currentClass: ClassInfo | null;
  setCurrentClass: (cls: ClassInfo | null) => void;
  students: Student[];
  loadingClasses: boolean;
  loadingStudents: boolean;
  createClass: (schoolName: string, grade: number, className: string, schoolYear?: number) => Promise<ClassInfo>;
  updateClass: (classId: string, updates: Partial<ClassInfo>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  addStudent: (number: number, name: string, gender?: Gender, memo?: string) => Promise<void>;
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  bulkAddStudents: (studentsList: { number: number; name: string; gender?: Gender; memo?: string }[]) => Promise<void>;
  generateSampleStudents: () => Promise<void>;
  deleteAllStudentsInClass: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

// High school student sample names for Korean classrooms
const SAMPLE_STUDENTS = [
  { name: '김민준', gender: 'male' as Gender },
  { name: '이서연', gender: 'female' as Gender },
  { name: '박도현', gender: 'male' as Gender },
  { name: '정지우', gender: 'female' as Gender },
  { name: '최하은', gender: 'female' as Gender },
  { name: '윤시우', gender: 'male' as Gender },
  { name: '장예준', gender: 'male' as Gender },
  { name: '임수아', gender: 'female' as Gender },
  { name: '한은우', gender: 'male' as Gender },
  { name: '오지유', gender: 'female' as Gender },
  { name: '서준혁', gender: 'male' as Gender },
  { name: '신채원', gender: 'female' as Gender },
  { name: '권우진', gender: 'male' as Gender },
  { name: '황지민', gender: 'female' as Gender },
  { name: '송태윤', gender: 'male' as Gender },
  { name: '안다은', gender: 'female' as Gender },
  { name: '류건우', gender: 'male' as Gender },
  { name: '홍유진', gender: 'female' as Gender },
  { name: '고성현', gender: 'male' as Gender },
  { name: '문서윤', gender: 'female' as Gender },
  { name: '양주원', gender: 'male' as Gender },
  { name: '손민서', gender: 'female' as Gender },
  { name: '배현우', gender: 'male' as Gender },
  { name: '조예린', gender: 'female' as Gender },
  { name: '백승우', gender: 'male' as Gender },
  { name: '유하린', gender: 'female' as Gender },
  { name: '노진우', gender: 'male' as Gender },
  { name: '남가은', gender: 'female' as Gender },
  { name: '심도윤', gender: 'male' as Gender },
  { name: '하소율', gender: 'female' as Gender },
];

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  // 1. Listen to teacher's classes in Firestore
  useEffect(() => {
    if (!user) {
      setClasses([]);
      setCurrentClass(null);
      setStudents([]);
      setLoadingClasses(false);
      return;
    }

    setLoadingClasses(true);
    const classesQuery = query(
      collection(db, 'classes'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(classesQuery, async (snapshot) => {
      const fetchedClasses: ClassInfo[] = [];
      snapshot.forEach((docSnap) => {
        fetchedClasses.push({ id: docSnap.id, ...docSnap.data() } as ClassInfo);
      });

      // Sort by schoolYear desc, grade asc, className asc
      fetchedClasses.sort((a, b) => {
        if (b.schoolYear !== a.schoolYear) return b.schoolYear - a.schoolYear;
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.className.localeCompare(b.className);
      });

      setClasses(fetchedClasses);

      if (fetchedClasses.length === 0) {
        // Automatically create a friendly default class for first-time user
        try {
          const defaultYear = new Date().getFullYear();
          const docRef = await addDoc(collection(db, 'classes'), {
            ownerUid: user.uid,
            schoolName: '우리 고등학교',
            grade: 2,
            className: '3반',
            schoolYear: defaultYear,
            homeroomTeacherName: user.displayName || '담임교사',
            createdAt: new Date().toISOString()
          });
          const newClass: ClassInfo = {
            id: docRef.id,
            ownerUid: user.uid,
            schoolName: '우리 고등학교',
            grade: 2,
            className: '3반',
            schoolYear: defaultYear,
            homeroomTeacherName: user.displayName || '담임교사',
            createdAt: new Date().toISOString()
          };
          setCurrentClass(newClass);
        } catch (err) {
          console.error('Error creating default class:', err);
        }
      } else {
        // Keep current selected class or default to first
        setCurrentClass((prev) => {
          if (!prev) return fetchedClasses[0];
          const exists = fetchedClasses.find((c) => c.id === prev.id);
          return exists || fetchedClasses[0];
        });
      }
      setLoadingClasses(false);
    }, (error) => {
      console.error('Classes listener error:', error);
      setLoadingClasses(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Listen to students of active class in Firestore
  useEffect(() => {
    if (!user || !currentClass) {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);
    const studentsQuery = query(
      collection(db, 'students'),
      where('ownerUid', '==', user.uid),
      where('classId', '==', currentClass.id)
    );

    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const fetchedStudents: Student[] = [];
      snapshot.forEach((docSnap) => {
        fetchedStudents.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });

      // Sort by student number asc
      fetchedStudents.sort((a, b) => a.number - b.number);
      setStudents(fetchedStudents);
      setLoadingStudents(false);
    }, (error) => {
      console.error('Students listener error:', error);
      setLoadingStudents(false);
    });

    return () => unsubscribe();
  }, [user, currentClass?.id]);

  // 3. Class operations
  const createClass = async (
    schoolName: string,
    grade: number,
    className: string,
    schoolYear: number = new Date().getFullYear()
  ): Promise<ClassInfo> => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const docRef = await addDoc(collection(db, 'classes'), {
      ownerUid: user.uid,
      schoolName: schoolName.trim(),
      grade: Number(grade),
      className: className.trim(),
      schoolYear: Number(schoolYear),
      homeroomTeacherName: user.displayName || '',
      createdAt: new Date().toISOString()
    });

    const newClass: ClassInfo = {
      id: docRef.id,
      ownerUid: user.uid,
      schoolName: schoolName.trim(),
      grade: Number(grade),
      className: className.trim(),
      schoolYear: Number(schoolYear),
      homeroomTeacherName: user.displayName || '',
      createdAt: new Date().toISOString()
    };

    setCurrentClass(newClass);
    return newClass;
  };

  const updateClass = async (classId: string, updates: Partial<ClassInfo>) => {
    if (!user) throw new Error('로그인이 필요합니다.');
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteClass = async (classId: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');
    
    // Delete all students in this class first using batch
    const classStudents = students.filter(s => s.classId === classId);
    const batch = writeBatch(db);
    classStudents.forEach(student => {
      batch.delete(doc(db, 'students', student.id));
    });
    batch.delete(doc(db, 'classes', classId));
    await batch.commit();
  };

  // 4. Student operations
  const addStudent = async (
    number: number,
    name: string,
    gender: Gender = 'unspecified',
    memo: string = ''
  ) => {
    if (!user || !currentClass) throw new Error('학급 정보가 없습니다.');

    await addDoc(collection(db, 'students'), {
      classId: currentClass.id,
      ownerUid: user.uid,
      number: Number(number),
      name: name.trim(),
      gender,
      active: true,
      memo: memo.trim(),
      createdAt: new Date().toISOString()
    });
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    if (!user) throw new Error('로그인이 필요합니다.');
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteStudent = async (studentId: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');
    await deleteDoc(doc(db, 'students', studentId));
  };

  const bulkAddStudents = async (
    studentsList: { number: number; name: string; gender?: Gender; memo?: string }[]
  ) => {
    if (!user || !currentClass) throw new Error('학급 정보가 없습니다.');
    if (studentsList.length === 0) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    studentsList.forEach((item) => {
      const newDocRef = doc(collection(db, 'students'));
      batch.set(newDocRef, {
        classId: currentClass.id,
        ownerUid: user.uid,
        number: Number(item.number),
        name: item.name.trim(),
        gender: item.gender || 'unspecified',
        active: true,
        memo: item.memo ? item.memo.trim() : '',
        createdAt: now
      });
    });

    await batch.commit();
  };

  const generateSampleStudents = async () => {
    if (!user || !currentClass) throw new Error('학급 정보가 없습니다.');

    const sampleList = SAMPLE_STUDENTS.map((item, index) => ({
      number: index + 1,
      name: item.name,
      gender: item.gender,
      memo: ''
    }));

    await bulkAddStudents(sampleList);
  };

  const deleteAllStudentsInClass = async () => {
    if (!user || !currentClass) throw new Error('학급 정보가 없습니다.');
    if (students.length === 0) return;

    const batch = writeBatch(db);
    students.forEach((student) => {
      batch.delete(doc(db, 'students', student.id));
    });
    await batch.commit();
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        currentClass,
        setCurrentClass,
        students,
        loadingClasses,
        loadingStudents,
        createClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkAddStudents,
        generateSampleStudents,
        deleteAllStudentsInClass
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};
