import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { type Faculty, type Subject, type Classroom, type Batch, type ScheduleEntry, type ExamScheduleEntry, type TimeSettings } from '../types';
import { generateExamTimetable, generateClassTimetable, generateCombinedClassTimetable } from './geminiService';

// ===================================================================================
// MOCK API FOR DEMO MODE
// This section creates a fake in-memory database and an API request interceptor.
// When the user is logged in with the demo account, all API calls are caught
// and handled here, simulating a real backend.
// ===================================================================================

const mockSubjectsData: Subject[] = [
  { id: 'CS101', name: 'Intro to Programming', hoursPerWeek: 4 },
  { id: 'MA101', name: 'Calculus I', hoursPerWeek: 4 }, // a
  { id: 'PH101', name: 'Physics for Engineers', hoursPerWeek: 4 },
  { id: 'CH101', name: 'Chemistry', hoursPerWeek: 4 },
  { id: 'HU101', name: 'Communication Skills', hoursPerWeek: 2 },
  { id: 'EE101', name: 'Basic Electrical Engg', hoursPerWeek: 4 },
  { id: 'PE101', name: 'Physical Education', hoursPerWeek: 1 },
  { id: 'ME101', name: 'Automobile Engineering', hoursPerWeek: 4 },
  { id: 'CS201', name: 'Data Structures', hoursPerWeek: 4 },
  { id: 'CS202', name: 'Object-Oriented Programming', hoursPerWeek: 4 },
  { id: 'HU102', name: 'Verbal & Quant Aptitude', hoursPerWeek: 2 },
  { id: 'AI101', name: 'AI Fundamentals', hoursPerWeek: 4 },
  { id: 'EE201', name: 'Circuit Theory', hoursPerWeek: 4 },
  { id: 'EC101', name: 'Electrical Basics', hoursPerWeek: 4 },
  { id: 'AI102', name: 'Programming for Problem Solving', hoursPerWeek: 4 },
  { id: 'EE202', name: 'Electrical Machinery', hoursPerWeek: 4 },
  { id: 'EE203', name: 'EMF', hoursPerWeek: 4 },
  { id: 'SP101', name: 'Spine Hour', hoursPerWeek: 1 },
  { id: 'CL101', name: 'Club Hour', hoursPerWeek: 1 },
  { id: 'CS301', name: 'Advanced Algorithms', hoursPerWeek: 2 },
  { id: 'EC201', name: 'Signal Processing', hoursPerWeek: 2 },
  { id: 'ME201', name: 'Thermodynamics', hoursPerWeek: 4 },
  { id: 'AI201', name: 'Machine Learning Lab', hoursPerWeek: 2 },
  { id: 'EE301', name: 'Power Systems', hoursPerWeek: 2 },
  { id: 'ME202', name: 'Mecatronics', hoursPerWeek: 4 }, 
  { id: 'EC202', name: 'Digital Electronics', hoursPerWeek: 2 },
  { id: 'ME301', name: 'Fluid Mechanics', hoursPerWeek: 2 },
  { id: 'CS102', name: 'Digital Logic Design', hoursPerWeek: 3 },
  { id: 'ME102', name: 'Engineering Graphics', hoursPerWeek: 3 },
];

const mockFacultiesData: Faculty[] = [
  { id: 'F001', name: 'Dr. Alan Turing', expertise: ['CS101', 'AI102'] },
  { id: 'F002', name: 'Deepak', expertise: ['MA101', 'PH101'] },
  { id: 'F003', name: 'Dr. Marie Curie', expertise: ['CH101'] },
  { id: 'F004', name: 'Dr. Ada Lovelace', expertise: ['CS101', 'CS201', 'CS301'] },
  { id: 'F005', name: 'Dr. W. Wordsworth', expertise: ['HU101'] },
  { id: 'F006', name: 'Bharath', expertise: ['EE101', 'EE202'] },
  { id: 'F007', name: 'Mr. P.T. Usha', expertise: ['PE101'] },
  { id: 'F008', name: 'Mr. Henry Ford', expertise: ['ME101', 'ME102'] },
  { id: 'F009', name: 'Dr. Geoffrey Hinton', expertise: ['AI101', 'AI201'] },
  { id: 'F010', name: 'Dr. Bjarne Stroustrup', expertise: ['CS201', 'CS202'] },
  { id: 'F011', name: 'Sharmila', expertise: ['HU102', 'HU101'] },
  { id: 'F012', name: 'Dr. G. Kirchhoff', expertise: ['EE201', 'EC101'] },
  { id: 'F013', name: 'Mr. John Doe', expertise: ['SP101'] },
  { id: 'F014', name: 'Ms. Jane Smith', expertise: ['CL101'] },
  { id: 'F015', name: 'Dr. Alexander Bell', expertise: ['EC201', 'EC202'] },
  { id: 'F016', name: 'Dr. James Watt', expertise: ['ME201', 'ME202', 'ME301'] },
  { id: 'F017', name: 'Dr. Gottfried Leibniz', expertise: ['MA101'] },
  { id: 'F018', name: 'Christy Juliet', expertise: ['EE203'] },
  { id: 'F019', name: 'Ramakrishnan', expertise: ['EE301'] },
  { id: 'F020', name: 'Mr. George Boole', expertise: ['CS102'] },
  { id: 'F021', name: 'Dr. Isaac Newton', expertise: ['PH101'] },
  { id: 'F022', name: 'Dr. Dmitri Mendeleev', expertise: ['CH101'] },
  { id: 'F023', name: 'Dr. Claude Shannon', expertise: ['CS102'] },
  { id: 'F024', name: 'Mr. Leonardo da Vinci', expertise: ['ME102'] },
  { id: 'F025', name: 'Dr. Leonhard Euler', expertise: ['MA101'] },
];

const mockClassroomsData: Classroom[] = [
  { id: 'C101', name: 'Room 101' },
  { id: 'C102', name: 'Room 102' },
  { id: 'C103', name: 'Room 103' },
  { id: 'C104', name: 'Room 104' },
  { id: 'C105', name: 'Room 105' },
  { id: 'L201', name: 'Physics Lab' },
  { id: 'L202', name: 'Chemistry Lab' },
  { id: 'L203', name: 'Computer Lab' },
  { id: 'L204', name: 'EEE Lab' },
  { id: 'L205', name: 'Mechanical Lab' },
];

const mockBatchesData: Batch[] = [
  { id: 'B_CSE_Y1', name: 'CSE Year 1', subjectIds: ['CS101', 'CS201', 'CS202', 'CS301'] },
  { id: 'B_ECE_Y1', name: 'ECE Year 1', subjectIds: ['EE101', 'EC101', 'EC201', 'EC202'] },
  { id: 'B_ME_Y1', name: 'ME Year 1', subjectIds: ['ME101', 'ME201', 'ME202', 'ME301'] },
  { id: 'B_AIML_Y1', name: 'AIML Year 1', subjectIds: ['AI101', 'AI102', 'AI201'] },
  { id: 'B_EEE_Y1', name: 'EEE Year 1', subjectIds: ['EE201', 'EE202', 'EE203', 'EE301'] },
];

// In-memory database with sessionStorage persistence
const initializeDb = () => {
    const stored = (key: string) => sessionStorage.getItem(key);
    return {
        faculties: [...mockFacultiesData],
        subjects: [...mockSubjectsData],
        classrooms: [...mockClassroomsData],
        batches: [...mockBatchesData],
        users: stored('mockApiUsers') ? JSON.parse(stored('mockApiUsers')!) : [] as {id: string, email: string, password?: string}[],
        settings: {
            commonSubjectIds: ['MA101', 'PH101', 'CH101', 'HU101', 'CS102', 'ME102'],
        },
        savedSchedules: stored('mockApiSchedules') ? JSON.parse(stored('mockApiSchedules')!) : {},
    };
};

let db = initializeDb();

const persist = (key: string, data: any) => {
    sessionStorage.setItem(key, JSON.stringify(data));
};


const uuid = () => `id_${Math.random().toString(36).substr(2, 9)}`;

const getUserFromConfig = (config: InternalAxiosRequestConfig): {id: string, email: string} | null => {
    const authHeader = config.headers?.Authorization;
    if (typeof authHeader !== 'string') return null;
    
    const token = authHeader.split(' ')[1];
    if (token === 'demo-token') return { id: 'demo', email: 'sns@gmail.com' };
    
    if (token?.startsWith('mock-token-for-')) {
        const userId = token.replace('mock-token-for-', '');
        const user = db.users.find(u => u.id === userId);
        return user ? { id: user.id, email: user.email } : null;
    }
    return null;
}


// ===================================================================================
// AXIOS CONFIGURATION
// ===================================================================================

const API_BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Mock API request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('authToken');
    if (token !== 'demo-token') {
      console.warn("[DEMO MODE] Running in offline mock mode.");
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    config.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
        const url = (config.url || '').replace('/api/v1/', '');
        const urlParts = url.split('/').filter(Boolean);
        const resource = urlParts[0];
        const id = urlParts[1];
        const { data } = config;

        try {
            switch (config.method?.toLowerCase()) {
                case 'get':
                    if (resource === 'auth' && id === 'me') {
                        const user = getUserFromConfig(config);
                        if (user) return { data: { user }, status: 200, config, headers: {}, statusText: 'OK' };
                        return Promise.reject({ response: { data: { error: { message: 'Invalid token' }}, status: 401, statusText: 'Unauthorized' } });
                    }
                    if (resource === 'faculties') return { data: [...db.faculties], status: 200, config, headers: {}, statusText: 'OK' };
                    if (resource === 'subjects') return { data: [...db.subjects], status: 200, config, headers: {}, statusText: 'OK' };
                    if (resource === 'classrooms') return { data: [...db.classrooms], status: 200, config, headers: {}, statusText: 'OK' };
                    if (resource === 'batches') return { data: [...db.batches], status: 200, config, headers: {}, statusText: 'OK' };
                    if (resource === 'settings' && id === 'common-subjects') return { data: { subjectIds: [...db.settings.commonSubjectIds] }, status: 200, config, headers: {}, statusText: 'OK' };
                    if (resource === 'dashboard' && id === 'stats') {
                        return { data: { facultyCount: db.faculties.length, subjectCount: db.subjects.length, classroomCount: db.classrooms.length, batchCount: db.batches.length }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                    if (resource === 'timetables' && id === 'user-schedule') {
                        const user = getUserFromConfig(config);
                        if (!user) return Promise.reject({ response: { status: 401 } });
                        const schedule = db.savedSchedules[user.id]?.classSchedule || null;
                        return { data: { schedule }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                    if (resource === 'exams' && id === 'user-schedule') {
                        const user = getUserFromConfig(config);
                        if (!user) return Promise.reject({ response: { status: 401 } });
                        const schedule = db.savedSchedules[user.id]?.examSchedule || null;
                        return { data: { schedule }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                    break;
                
                case 'post':
                    const body = data ? (typeof data === 'string' ? JSON.parse(data) : data) : {};
                     if (resource === 'auth') {
                        if (id === 'register') {
                            const { email, password } = body;
                            if (email === 'sns@gmail.com' || db.users.find(u => u.email === email)) {
                                return Promise.reject({ response: { data: { error: { message: 'User already exists or email is reserved.' }}, status: 400, statusText: 'Bad Request' } });
                            }
                            const newUser = { id: uuid(), email, password };
                            db.users.push(newUser);
                            persist('mockApiUsers', db.users);
                            const token = `mock-token-for-${newUser.id}`;
                            return { data: { token, user: { id: newUser.id, email: newUser.email } }, status: 201, config, headers: {}, statusText: 'Created' };
                        }
                        if (id === 'login') {
                            const { email, password } = body;
                            const user = db.users.find(u => u.email === email);
                            if (user && user.password === password) {
                                const token = `mock-token-for-${user.id}`;
                                return { data: { token, user: { id: user.id, email: user.email } }, status: 200, config, headers: {}, statusText: 'OK' };
                            }
                            return Promise.reject({ response: { data: { error: { message: 'Invalid credentials' }}, status: 401, statusText: 'Unauthorized' } });
                        }
                    }
                    if (resource === 'faculties') { const d = { ...body, id: uuid() }; db.faculties.push(d); return { data: d, status: 201, config, headers: {}, statusText: 'Created' }; }
                    if (resource === 'subjects') { const d = { ...body, id: body.name.substring(0,2).toUpperCase() + Date.now().toString().slice(-3) }; db.subjects.push(d); return { data: d, status: 201, config, headers: {}, statusText: 'Created' }; }
                    if (resource === 'classrooms') { const d = { ...body, id: uuid() }; db.classrooms.push(d); return { data: d, status: 201, config, headers: {}, statusText: 'Created' }; }
                    if (resource === 'batches') { const d = { ...body, id: uuid() }; db.batches.push(d); return { data: d, status: 201, config, headers: {}, statusText: 'Created' }; }
                    if (resource === 'timetables' && urlParts[1] === 'generate' && urlParts[2] === 'single-batch') {
                        try {
                             const schedule = await generateClassTimetable(body);
                             return { data: { schedule }, status: 200, config, headers: {}, statusText: 'OK' };
                        } catch (error: any) {
                             return Promise.reject({ response: { data: { error: { message: error.message } }, status: 500 } });
                        }
                    }
                    if (resource === 'timetables' && urlParts[1] === 'generate' && urlParts[2] === 'combined') {
                         try {
                            const schedule = await generateCombinedClassTimetable(body);
                            return { data: { schedule }, status: 200, config, headers: {}, statusText: 'OK' };
                        } catch (error: any) {
                             return Promise.reject({ response: { data: { error: { message: error.message } }, status: 500 } });
                        }
                    }
                    if (resource === 'exams' && urlParts[1] === 'generate') {
                        try {
                            const schedule = await generateExamTimetable({
                                ...body,
                                allSubjects: db.subjects,
                                allBatches: db.batches
                            });
                            return { data: { schedule }, status: 200, config, headers: {}, statusText: 'OK' };
                        } catch (error: any) {
                             return Promise.reject({
                                response: {
                                    data: { error: { message: error.message || 'Generation Failed' } },
                                    status: 500,
                                    statusText: 'Internal Server Error'
                                }
                            });
                        }
                    }
                    break;

                case 'delete':
                    if (resource === 'faculties') { db.faculties = db.faculties.filter(f => f.id !== id); return { data: null, status: 204, config, headers: {}, statusText: 'No Content' }; }
                    if (resource === 'subjects') { db.subjects = db.subjects.filter(s => s.id !== id); return { data: null, status: 204, config, headers: {}, statusText: 'No Content' }; }
                    if (resource === 'classrooms') { db.classrooms = db.classrooms.filter(c => c.id !== id); return { data: null, status: 204, config, headers: {}, statusText: 'No Content' }; }
                    if (resource === 'batches') { db.batches = db.batches.filter(b => b.id !== id); return { data: null, status: 204, config, headers: {}, statusText: 'No Content' }; }
                    break;

                case 'put':
                     if (resource === 'settings' && id === 'common-subjects') {
                        const body = data ? (typeof data === 'string' ? JSON.parse(data) : data) : {};
                        db.settings.commonSubjectIds = body.subjectIds;
                        return { data: { subjectIds: [...db.settings.commonSubjectIds] }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                     if (url === '/timetables/user-schedule') {
                        const user = getUserFromConfig(config);
                        if (!user) return Promise.reject({ response: { status: 401 } });
                        const body = JSON.parse(config.data);
                        if (!db.savedSchedules[user.id]) db.savedSchedules[user.id] = {};
                        db.savedSchedules[user.id].classSchedule = body;
                        persist('mockApiSchedules', db.savedSchedules);
                        return { data: { message: 'Schedule saved successfully.' }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                     if (url === '/exams/user-schedule') {
                        const user = getUserFromConfig(config);
                        if (!user) return Promise.reject({ response: { status: 401 } });
                        const body = JSON.parse(config.data);
                        if (!db.savedSchedules[user.id]) db.savedSchedules[user.id] = {};
                        db.savedSchedules[user.id].examSchedule = body;
                        persist('mockApiSchedules', db.savedSchedules);
                        return { data: { message: 'Exam schedule saved successfully.' }, status: 200, config, headers: {}, statusText: 'OK' };
                    }
                    break;
            }
        } catch (e: any) {
            console.error('[API] Error processing request:', e.message);
            const message = e.response?.data?.error?.message || e.message || 'Internal Server Error';
            return Promise.reject({ response: { data: { error: { message }}, status: 500, statusText: 'Internal Server Error' } });
        }
        
        console.error(`[API] No mock handler for ${config.method?.toUpperCase()} ${config.url}`);
        return Promise.reject({ response: { status: 404, statusText: 'Not Found' } });
    };

    return config;
  },
  (error) => Promise.reject(error)
);


// This flag ensures the interceptor is only set up once.
let interceptorSetup = false;

// We are now exporting this function to be called from our Auth context.
export const setupResponseInterceptor = (onUnauthorized: () => void) => {
  if (interceptorSetup) {
    return;
  }
  
  api.interceptors.response.use(
    (response) => {
      if (response.data && response.data.hasOwnProperty('data')) {
        return { ...response, data: response.data.data };
      }
      return response;
    },
    (error) => {
      // The initial session check is handled in AuthContext.
      // This interceptor handles 401s for all subsequent API calls.
      if (error.response && error.response.status === 401 && error.config.url !== '/auth/me') {
        console.error('Session expired or invalid. Logging out.');
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  interceptorSetup = true;
};