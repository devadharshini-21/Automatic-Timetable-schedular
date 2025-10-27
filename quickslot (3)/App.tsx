import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './components/DashboardPage';
import { TimetableScheduler } from './components/TimetableScheduler';
import { ExamSchedulerPage } from './components/ExamSchedulerPage';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';

// Inlined Types
export interface Faculty { id: string; name: string; expertise: string[]; }
export interface Subject { id: string; name: string; hoursPerWeek: number; }
export interface Classroom { id: string; name: string; }
export interface Batch { id: string; name: string; subjectIds: string[]; }
export interface ScheduleEntry { day: string; period: string; subjectId: string; subjectName: string; facultyId: string; facultyName: string; classroomId: string; classroomName: string; batchId?: string; batchName?: string; }
export interface ExamScheduleEntry { date: string; session: 'Forenoon' | 'Afternoon'; startTime: string; endTime: string; subjectId: string; subjectName: string; batchId: string; }

// Local Mock Data
const mockSubjectsData: Subject[] = [
  { id: 'CS101', name: 'Intro to Programming', hoursPerWeek: 4 }, { id: 'MA101', name: 'Calculus I', hoursPerWeek: 4 }, { id: 'PH101', name: 'Physics for Engineers', hoursPerWeek: 4 }, { id: 'CH101', name: 'Chemistry', hoursPerWeek: 4 }, { id: 'HU101', name: 'Communication Skills', hoursPerWeek: 2 }, { id: 'EE101', name: 'Basic Electrical Engg', hoursPerWeek: 4 }, { id: 'PE101', name: 'Physical Education', hoursPerWeek: 1 }, { id: 'ME101', name: 'Automobile Engineering', hoursPerWeek: 4 }, { id: 'CS201', name: 'Data Structures', hoursPerWeek: 4 }, { id: 'CS202', name: 'Object-Oriented Programming', hoursPerWeek: 4 }, { id: 'HU102', name: 'Verbal & Quant Aptitude', hoursPerWeek: 2 }, { id: 'AI101', name: 'AI Fundamentals', hoursPerWeek: 4 }, { id: 'EE201', name: 'Circuit Theory', hoursPerWeek: 4 }, { id: 'EC101', name: 'Electrical Basics', hoursPerWeek: 4 }, { id: 'AI102', name: 'Programming for Problem Solving', hoursPerWeek: 4 }, { id: 'EE202', name: 'Electrical Machinery', hoursPerWeek: 4 }, { id: 'EE203', name: 'EMF', hoursPerWeek: 4 }, { id: 'SP101', name: 'Spine Hour', hoursPerWeek: 1 }, { id: 'CL101', name: 'Club Hour', hoursPerWeek: 1 }, { id: 'CS301', name: 'Advanced Algorithms', hoursPerWeek: 2 }, { id: 'EC201', name: 'Signal Processing', hoursPerWeek: 2 }, { id: 'ME201', name: 'Thermodynamics', hoursPerWeek: 4 }, { id: 'AI201', name: 'Machine Learning Lab', hoursPerWeek: 2 }, { id: 'EE301', name: 'Power Systems', hoursPerWeek: 2 }, { id: 'ME202', name: 'Mecatronics', hoursPerWeek: 4 }, { id: 'EC202', name: 'Digital Electronics', hoursPerWeek: 2 }, { id: 'ME301', name: 'Fluid Mechanics', hoursPerWeek: 2 }, { id: 'CS102', name: 'Digital Logic Design', hoursPerWeek: 3 }, { id: 'ME102', name: 'Engineering Graphics', hoursPerWeek: 3 },
];
const mockFacultiesData: Faculty[] = [
  { id: 'F001', name: 'Dr. Alan Turing', expertise: ['CS101', 'AI102'] }, { id: 'F002', name: 'Deepak', expertise: ['MA101', 'PH101'] }, { id: 'F003', name: 'Dr. Marie Curie', expertise: ['CH101'] }, { id: 'F004', name: 'Dr. Ada Lovelace', expertise: ['CS101', 'CS201', 'CS301'] }, { id: 'F005', name: 'Dr. W. Wordsworth', expertise: ['HU101'] }, { id: 'F006', name: 'Bharath', expertise: ['EE101', 'EE202'] }, { id: 'F007', name: 'Mr. P.T. Usha', expertise: ['PE101'] }, { id: 'F008', name: 'Mr. Henry Ford', expertise: ['ME101', 'ME102'] }, { id: 'F009', name: 'Dr. Geoffrey Hinton', expertise: ['AI101', 'AI201'] }, { id: 'F010', name: 'Dr. Bjarne Stroustrup', expertise: ['CS201', 'CS202'] }, { id: 'F011', name: 'Sharmila', expertise: ['HU102', 'HU101'] }, { id: 'F012', name: 'Dr. G. Kirchhoff', expertise: ['EE201', 'EC101'] }, { id: 'F013', name: 'Mr. John Doe', expertise: ['SP101'] }, { id: 'F014', name: 'Ms. Jane Smith', expertise: ['CL101'] }, { id: 'F015', name: 'Dr. Alexander Bell', expertise: ['EC201', 'EC202'] }, { id: 'F016', name: 'Dr. James Watt', expertise: ['ME201', 'ME202', 'ME301'] }, { id: 'F017', name: 'Dr. Gottfried Leibniz', expertise: ['MA101'] }, { id: 'F018', name: 'Christy Juliet', expertise: ['EE203'] }, { id: 'F019', name: 'Ramakrishnan', expertise: ['EE301'] }, { id: 'F020', name: 'Mr. George Boole', expertise: ['CS102'] }, { id: 'F021', name: 'Dr. Isaac Newton', expertise: ['PH101'] }, { id: 'F022', name: 'Dr. Dmitri Mendeleev', expertise: ['CH101'] }, { id: 'F023', name: 'Dr. Claude Shannon', expertise: ['CS102'] }, { id: 'F024', name: 'Mr. Leonardo da Vinci', expertise: ['ME102'] }, { id: 'F025', name: 'Dr. Leonhard Euler', expertise: ['MA101'] },
];
const mockClassroomsData: Classroom[] = [
  { id: 'C101', name: 'Room 101' }, { id: 'C102', name: 'Room 102' }, { id: 'C103', name: 'Room 103' }, { id: 'C104', name: 'Room 104' }, { id: 'C105', name: 'Room 105' }, { id: 'L201', name: 'Physics Lab' }, { id: 'L202', name: 'Chemistry Lab' }, { id: 'L203', name: 'Computer Lab' }, { id: 'L204', name: 'EEE Lab' }, { id: 'L205', name: 'Mechanical Lab' },
];
const mockBatchesData: Batch[] = [
  { id: 'B_CSE_Y1', name: 'CSE Year 1', subjectIds: ['CS101', 'CS201', 'CS202', 'CS301'] }, { id: 'B_ECE_Y1', name: 'ECE Year 1', subjectIds: ['EE101', 'EC101', 'EC201', 'EC202'] }, { id: 'B_ME_Y1', name: 'ME Year 1', subjectIds: ['ME101', 'ME201', 'ME202', 'ME301'] }, { id: 'B_AIML_Y1', name: 'AIML Year 1', subjectIds: ['AI101', 'AI102', 'AI201'] }, { id: 'B_EEE_Y1', name: 'EEE Year 1', subjectIds: ['EE201', 'EE202', 'EE203', 'EE301'] },
];
const initialCommonSubjects = ['MA101', 'PH101', 'CH101', 'HU101', 'CS102', 'ME102'];

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoginPage, setIsLoginPage] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false); // No initial load needed for local data

  // Global data state, initialized with local mock data
  const [faculties, setFaculties] = useState<Faculty[]>(mockFacultiesData);
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjectsData);
  const [classrooms, setClassrooms] = useState<Classroom[]>(mockClassroomsData);
  const [batches, setBatches] = useState<Batch[]>(mockBatchesData);
  const [commonSubjectIds, setCommonSubjectIds] = useState<string[]>(initialCommonSubjects);

  // Timetable Scheduler State
  const [classTimetables, setClassTimetables] = useState<Record<string, ScheduleEntry[]>>({});
  const [combinedClassTimetable, setCombinedClassTimetable] = useState<ScheduleEntry[] | null>(null);
  const [customRules, setCustomRules] = useState<string>('');
  
  // Exam Scheduler State
  const [examSchedule, setExamSchedule] = useState<ExamScheduleEntry[] | null>(null);
  const [examConfig, setExamConfig] = useState(() => {
    const initialDeptSubjects: Record<string, string[]> = {};
    mockBatchesData.forEach((batch: Batch) => {
        initialDeptSubjects[batch.id] = [...batch.subjectIds];
    });
    return {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        forenoonTime: '09:30',
        afternoonTime: '14:00',
        duration: 3,
        examRules: 'Sundays are holidays.',
        commonSubjectsForExams: [] as string[],
        selectedDeptSubjects: initialDeptSubjects,
    };
  });

  // Load saved schedules from localStorage on auth change
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const savedClassDataStr = localStorage.getItem('userClassSchedule');
        if (savedClassDataStr) {
          const savedClassData = JSON.parse(savedClassDataStr);
          setClassTimetables(savedClassData.timetables || {});
          setCombinedClassTimetable(savedClassData.combinedTimetable || null);
        }

        const savedExamDataStr = localStorage.getItem('userExamSchedule');
        if (savedExamDataStr) {
          const savedExamData = JSON.parse(savedExamDataStr);
          setExamSchedule(savedExamData.schedule || null);
          if (savedExamData.config) {
            setExamConfig(savedExamData.config);
          }
        }
      } catch (error) {
        console.error("Failed to parse saved schedule from localStorage", error);
      }
    }
  }, [isAuthenticated]);


  if (!isAuthenticated) {
    return isLoginPage ? (
      <LoginPage onSwitchToSignUp={() => setIsLoginPage(false)} />
    ) : (
      <SignUpPage onSwitchToLogin={() => setIsLoginPage(true)} />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
            <svg className="animate-spin mx-auto h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <h2 className="mt-4 text-xl font-semibold text-slate-700">Loading Your Workspace...</h2>
            <p className="text-slate-500">Setting up your local environment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans bg-slate-50 relative">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              faculties={faculties}
              subjects={subjects}
              classrooms={classrooms}
              batches={batches}
              setCurrentPage={setCurrentPage}
            />
          )}
          {currentPage === 'scheduler' && (
            <TimetableScheduler
              faculties={faculties} setFaculties={setFaculties}
              subjects={subjects} setSubjects={setSubjects}
              classrooms={classrooms} setClassrooms={setClassrooms}
              batches={batches} setBatches={setBatches}
              commonSubjectIds={commonSubjectIds} setCommonSubjectIds={setCommonSubjectIds}
              // State props
              timetables={classTimetables}
              setTimetables={setClassTimetables}
              combinedTimetable={combinedClassTimetable}
              setCombinedTimetable={setCombinedClassTimetable}
              customRules={customRules}
              setCustomRules={setCustomRules}
            />
          )}
          {currentPage === 'exams' && (
            <ExamSchedulerPage
                batches={batches}
                subjects={subjects}
                // State props
                schedule={examSchedule}
                setSchedule={setExamSchedule}
                examConfig={examConfig}
                setExamConfig={setExamConfig}
            />
          )}
        </main>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
export default App;