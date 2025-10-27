import { type Subject, type Batch, type ExamScheduleEntry, type ScheduleEntry, type Faculty, type Classroom, type TimeSettings } from '../types';

// Helper to shuffle an array for variety in schedules
const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Interface definitions to match the parameters from the frontend
interface ClassGenerationParams {
    batch: Batch;
    allSubjects: Subject[];
    allFaculties: Faculty[];
    allClassrooms: Classroom[];
    commonSubjectIds: string[];
    customRules: string;
    timeSettings: TimeSettings;
}

interface CombinedClassGenerationParams {
    batches: Batch[];
    allSubjects: Subject[];
    allFaculties: Faculty[];
    allClassrooms: Classroom[];
    commonSubjectIds: string[];
    customRules: string;
    timeSettings: TimeSettings;
}

interface ExamGenerationParams {
    startDate: string;
    endDate: string;
    selectedSubjects: Record<string, string[]>;
    commonSubjects: string[];
    examRules: string;
    duration: number;
    forenoonTime: string;
    afternoonTime: string;
    allSubjects: Subject[];
    allBatches: Batch[];
}


// ===============================================
// LOCAL CLASS TIMETABLE GENERATION LOGIC
// ===============================================

/**
 * Generates a class timetable for a single batch using local logic.
 */
export const generateClassTimetable = async (params: ClassGenerationParams): Promise<ScheduleEntry[]> => {
    const { batch, allSubjects, allFaculties, allClassrooms, commonSubjectIds, timeSettings, customRules } = params;
    
    const schedule: ScheduleEntry[] = [];
    const timeGrid: Record<string, Record<string, boolean>> = {};
    timeSettings.days.forEach(day => {
        timeGrid[day] = {};
        timeSettings.periods.forEach(period => {
            if (!period.toLowerCase().includes('break')) {
                timeGrid[day][period] = false;
            }
        });
    });

    const subjectIdsForBatch = [...new Set([...commonSubjectIds, ...batch.subjectIds])];
    let subjectsForBatch = allSubjects.filter(s => subjectIdsForBatch.includes(s.id));

    // Fill empty slots by increasing hours of existing subjects
    const periodsPerDay = timeSettings.periods.filter(p => !p.toLowerCase().includes('break')).length;
    const totalSlots = timeSettings.days.length * periodsPerDay;
    const totalRequiredHours = subjectsForBatch.reduce((sum, s) => sum + s.hoursPerWeek, 0);
    
    if (totalRequiredHours > totalSlots) {
        throw new Error(`The total required class hours (${totalRequiredHours}) for ${batch.name} exceeds the available slots (${totalSlots}). Please reduce the number of subjects or hours per week.`);
    }


    if (totalRequiredHours < totalSlots && subjectsForBatch.length > 0) {
        let deficit = totalSlots - totalRequiredHours;
        const tempSubjectsForBatch = JSON.parse(JSON.stringify(subjectsForBatch));
        // Prioritize subjects with fewer hours to get extra slots
        tempSubjectsForBatch.sort((a, b) => a.hoursPerWeek - b.hoursPerWeek);
        
        let i = 0;
        while (deficit > 0) {
            // Cycle through subjects to distribute extra hours evenly
            tempSubjectsForBatch[i % tempSubjectsForBatch.length].hoursPerWeek++;
            i++;
            deficit--;
        }
        subjectsForBatch = tempSubjectsForBatch;
    }


    let requiredClasses: { subjectId: string, subjectName: string }[] = [];
    subjectsForBatch.forEach(subject => {
        for (let i = 0; i < subject.hoursPerWeek; i++) {
            requiredClasses.push({ subjectId: subject.id, subjectName: subject.name });
        }
    });
    
    requiredClasses = shuffleArray(requiredClasses);

    const periods = timeSettings.periods.filter(p => !p.toLowerCase().includes('break'));
    const days = [...timeSettings.days];
    const avoidConsecutive = customRules.toLowerCase().includes('avoid consecutive');

    for (const classToSchedule of requiredClasses) {
        let placed = false;
        const shuffledPeriods = shuffleArray(periods);
        const shuffledDays = shuffleArray(days);
        
        for (const period of shuffledPeriods) {
            for (const day of shuffledDays) {
                if (timeGrid[day][period]) continue;

                if (avoidConsecutive) {
                    const periodIndex = timeSettings.periods.indexOf(period);
                    const prevPeriod = periodIndex > 0 ? timeSettings.periods[periodIndex - 1] : null;
                    if (prevPeriod && !prevPeriod.toLowerCase().includes('break')) {
                        const prevClass = schedule.find(e => e.day === day && e.period === prevPeriod);
                        if (prevClass?.subjectId === classToSchedule.subjectId) continue;
                    }
                }
                
                // Prioritize expert faculty, but fall back to any if none exist for the subject
                const expertFaculties = allFaculties.filter(f => f.expertise.includes(classToSchedule.subjectId));
                let faculty;
                if (expertFaculties.length > 0) {
                    faculty = shuffleArray(expertFaculties)[0];
                } else {
                    faculty = shuffleArray(allFaculties)[0];
                }
                
                // Pick a random classroom
                const classroom = shuffleArray(allClassrooms)[0];

                if (faculty && classroom) {
                    const newEntry: ScheduleEntry = { day, period, ...classToSchedule, facultyId: faculty.id, facultyName: faculty.name, classroomId: classroom.id, classroomName: classroom.name, batchId: batch.id, batchName: batch.name };
                    schedule.push(newEntry);
                    timeGrid[day][period] = true;
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }

        if (!placed) {
            throw new Error(`Could not place subject ${classToSchedule.subjectName} for batch ${batch.name}. This usually happens if required hours exceed available slots.`);
        }
    }

    return Promise.resolve(schedule);
};

/**
 * Generates a combined class timetable for multiple batches using a "class-first" approach.
 */
export const generateCombinedClassTimetable = async (params: CombinedClassGenerationParams): Promise<ScheduleEntry[]> => {
    const { batches, allSubjects, allFaculties, allClassrooms, commonSubjectIds, customRules, timeSettings } = params;

    const combinedSchedule: ScheduleEntry[] = [];
    const timeGrid: Record<string, Record<string, { facultyId?: string, classroomId?: string }[]>> = {};
    timeSettings.days.forEach(day => {
        timeGrid[day] = {};
        timeSettings.periods.forEach(period => {
            if (!period.toLowerCase().includes('break')) {
                timeGrid[day][period] = [];
            }
        });
    });

    let allClassesToSchedule: { batchId: string; batchName: string; subjectId: string; subjectName: string }[] = [];
    batches.forEach(batch => {
        const subjectIdsForBatch = [...new Set([...commonSubjectIds, ...batch.subjectIds])];
        let subjectsForBatch = allSubjects.filter(s => subjectIdsForBatch.includes(s.id));

        // Fill empty slots for this batch
        const periodsPerDay = timeSettings.periods.filter(p => !p.toLowerCase().includes('break')).length;
        const totalSlots = timeSettings.days.length * periodsPerDay;
        const totalRequiredHours = subjectsForBatch.reduce((sum, s) => sum + s.hoursPerWeek, 0);

        if (totalRequiredHours > totalSlots) {
            throw new Error(`The total required class hours (${totalRequiredHours}) for ${batch.name} exceeds the available slots (${totalSlots}). Please reduce the number of subjects or hours per week.`);
        }

        if (totalRequiredHours < totalSlots && subjectsForBatch.length > 0) {
            let deficit = totalSlots - totalRequiredHours;
            const tempSubjectsForBatch = JSON.parse(JSON.stringify(subjectsForBatch));
            tempSubjectsForBatch.sort((a, b) => a.hoursPerWeek - b.hoursPerWeek);
            
            let i = 0;
            while (deficit > 0) {
                tempSubjectsForBatch[i % tempSubjectsForBatch.length].hoursPerWeek++;
                i++;
                deficit--;
            }
            subjectsForBatch = tempSubjectsForBatch;
        }
        
        subjectsForBatch.forEach(subject => {
            for (let i = 0; i < subject.hoursPerWeek; i++) {
                allClassesToSchedule.push({ batchId: batch.id, batchName: batch.name, subjectId: subject.id, subjectName: subject.name });
            }
        });
    });

    allClassesToSchedule = shuffleArray(allClassesToSchedule);

    const periods = timeSettings.periods.filter(p => !p.toLowerCase().includes('break'));
    const days = [...timeSettings.days];
    const avoidConsecutive = customRules.toLowerCase().includes('avoid consecutive');

    for (const classToSchedule of allClassesToSchedule) {
        let placed = false;
        const shuffledDays = shuffleArray(days);
        const shuffledPeriods = shuffleArray(periods);

        for (const day of shuffledDays) {
            for (const period of shuffledPeriods) {
                const slotOccupants = timeGrid[day][period];

                if (avoidConsecutive) {
                    const periodIndex = timeSettings.periods.indexOf(period);
                    const prevPeriod = periodIndex > 0 ? timeSettings.periods[periodIndex - 1] : null;
                    if (prevPeriod && !prevPeriod.toLowerCase().includes('break')) {
                        const prevClassForBatch = combinedSchedule.find(e => e.batchId === classToSchedule.batchId && e.day === day && e.period === prevPeriod);
                        if (prevClassForBatch?.subjectId === classToSchedule.subjectId) {
                            continue; // Skip this slot for this batch
                        }
                    }
                }

                // More robust resource finding
                // Prioritize expert faculties who are available, then fall back to any other available faculty
                const expertFaculties = allFaculties.filter(f => f.expertise.includes(classToSchedule.subjectId) && !slotOccupants.some(occ => occ.facultyId === f.id));
                const otherFaculties = allFaculties.filter(f => !f.expertise.includes(classToSchedule.subjectId) && !slotOccupants.some(occ => occ.facultyId === f.id));
                const availableFaculties = [...shuffleArray(expertFaculties), ...shuffleArray(otherFaculties)];

                if (availableFaculties.length > 0) {
                    const assignedFaculty = availableFaculties[0]; // Pick the best available option
                    
                    const availableClassrooms = shuffleArray(allClassrooms.filter(c => !slotOccupants.some(occ => occ.classroomId === c.id)));

                    if (availableClassrooms.length > 0) {
                        const assignedClassroom = availableClassrooms[0];
                        // We found a valid pair, place the class
                        const newEntry: ScheduleEntry = {
                            day, period,
                            subjectId: classToSchedule.subjectId,
                            subjectName: classToSchedule.subjectName,
                            facultyId: assignedFaculty.id,
                            facultyName: assignedFaculty.name,
                            classroomId: assignedClassroom.id,
                            classroomName: assignedClassroom.name,
                            batchId: classToSchedule.batchId,
                            batchName: classToSchedule.batchName
                        };
                        combinedSchedule.push(newEntry);
                        timeGrid[day][period].push({ facultyId: assignedFaculty.id, classroomId: assignedClassroom.id });
                        placed = true;
                        break; // Exit period loop
                    }
                }
            }
            if (placed) break; // Exit day loop
        }

        if (!placed) {
            throw new Error(`Could not place subject ${classToSchedule.subjectName} for batch ${classToSchedule.batchName}. There are likely not enough unique faculties or classrooms to handle all batches simultaneously. Try reducing the number of batches or adding more resources.`);
        }
    }

    return Promise.resolve(combinedSchedule);
};


// ===============================================
// LOCAL EXAM TIMETABLE GENERATION LOGIC
// ===============================================

const calculateEndTime = (startTime: string, dur: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setHours(date.getHours() + dur);
    return date.toTimeString().substring(0, 5);
};

/**
 * Generates an exam timetable using local logic.
 * This function replaces the previous AI-based implementation.
 */
export const generateExamTimetable = async (params: ExamGenerationParams): Promise<ExamScheduleEntry[]> => {
    const { startDate, endDate, selectedSubjects, commonSubjects, examRules, duration, forenoonTime, afternoonTime, allSubjects, allBatches } = params;

    const availableSlots: { date: Date; session: 'Forenoon' | 'Afternoon' }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSundayHoliday = examRules.toLowerCase().includes("sunday");

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isSundayHoliday && d.getDay() === 0) continue;
        availableSlots.push({ date: new Date(d), session: 'Forenoon' });
        availableSlots.push({ date: new Date(d), session: 'Afternoon' });
    }

    let examsToSchedule: { batchId: string; subjectId: string }[] = [];
    allBatches.forEach(batch => {
        const deptSubjects = selectedSubjects[batch.id] || [];
        const subjectsForBatch = [...new Set([...commonSubjects, ...deptSubjects])];
        subjectsForBatch.forEach(subjectId => {
            examsToSchedule.push({ batchId: batch.id, subjectId });
        });
    });

    examsToSchedule = shuffleArray(examsToSchedule);

    const schedule: ExamScheduleEntry[] = [];
    const batchExamDays: Record<string, Set<string>> = {};

    for (const exam of examsToSchedule) {
        let placed = false;
        for (const slot of availableSlots) {
            const dateStr = slot.date.toISOString().split('T')[0];
            
            // Constraint: A batch can have at most ONE exam per day.
            if (batchExamDays[exam.batchId]?.has(dateStr)) {
                continue;
            }

            const subject = allSubjects.find(s => s.id === exam.subjectId);
            const batch = allBatches.find(b => b.id === exam.batchId);
            if (!subject || !batch) continue;
            
            const startTime = slot.session === 'Forenoon' ? forenoonTime : afternoonTime;
            const endTime = calculateEndTime(startTime, duration);

            const newEntry: ExamScheduleEntry = {
                date: dateStr,
                session: slot.session,
                startTime,
                endTime,
                subjectId: exam.subjectId,
                subjectName: subject.name,
                batchId: exam.batchId,
            };
            schedule.push(newEntry);
            
            if (!batchExamDays[exam.batchId]) batchExamDays[exam.batchId] = new Set();
            batchExamDays[exam.batchId].add(dateStr);
            
            // Remove the used slot to prevent clashes (e.g., if one room is assumed)
            // This is a simple constraint, more complex logic would be needed for multiple rooms.
            const slotIndex = availableSlots.findIndex(s => s.date.getTime() === slot.date.getTime() && s.session === slot.session);
            if (slotIndex > -1) {
                // For simplicity, we assume one exam happens per slot across all batches.
                // A more advanced scheduler could handle parallel exams.
                // availableSlots.splice(slotIndex, 1);
            }
            
            placed = true;
            break; 
        }
        if (!placed) {
            const batchName = allBatches.find(b => b.id === exam.batchId)?.name;
            const subjectName = allSubjects.find(s => s.id === exam.subjectId)?.name;
            throw new Error(`Could not find a valid slot for exam "${subjectName}" for batch "${batchName}". Try extending the date range or relaxing rules.`);
        }
    }

    return Promise.resolve(schedule);
};