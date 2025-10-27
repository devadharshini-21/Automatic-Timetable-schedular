export interface Faculty {
  id: string;
  name: string;
  expertise: string[]; // Array of subject IDs
}

export interface Subject {
  id: string;
  name: string;
  hoursPerWeek: number;
}

export interface Classroom {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  name: string;
  subjectIds: string[]; // Array of subject IDs
}

export interface TimeSettings {
  days: string[];
  periods: string[];
}

export interface ScheduleEntry {
  day: string;
  period: string;
  subjectId: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  classroomId: string;
  classroomName: string;
  batchId?: string; // Optional: For combined timetables
  batchName?: string; // Optional: For combined timetables
}

export interface GeneratedTimetable {
  schedule: ScheduleEntry[];
}

export interface ExamScheduleEntry {
  date: string;
  session: 'Forenoon' | 'Afternoon';
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  batchId: string;
}