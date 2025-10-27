import React, { useState, useCallback, useEffect } from 'react';
import { ConstraintInput } from './ConstraintInput';
import { TimetableDisplay } from './TimetableDisplay';
import { PlusIcon, SaveIcon, TrashIcon } from './icons';

// Inlined Types
export interface Faculty { id: string; name: string; expertise: string[]; }
export interface Subject { id: string; name: string; hoursPerWeek: number; }
export interface Classroom { id: string; name: string; }
export interface Batch { id: string; name: string; subjectIds: string[]; }
export interface TimeSettings { days: string[]; periods: string[]; }
export interface ScheduleEntry { day: string; period: string; subjectId: string; subjectName: string; facultyId: string; facultyName: string; classroomId: string; classroomName: string; batchId?: string; batchName?: string; }


// Inlined Local Timetable Generation Logic
// FIX: Changed to a standard function declaration to avoid TSX parsing ambiguity with generics.
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const generateClassTimetable = async (params: { batch: Batch; allSubjects: Subject[]; allFaculties: Faculty[]; allClassrooms: Classroom[]; commonSubjectIds: string[]; customRules: string; timeSettings: TimeSettings; }): Promise<ScheduleEntry[]> => {
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
                
                const expertFaculties = allFaculties.filter(f => f.expertise.includes(classToSchedule.subjectId));
                let faculty = expertFaculties.length > 0 ? shuffleArray(expertFaculties)[0] : shuffleArray(allFaculties)[0];
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

const generateCombinedClassTimetable = async (params: { batches: Batch[]; allSubjects: Subject[]; allFaculties: Faculty[]; allClassrooms: Classroom[]; commonSubjectIds: string[]; customRules: string; timeSettings: TimeSettings; }): Promise<ScheduleEntry[]> => {
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
                            continue;
                        }
                    }
                }

                const expertFaculties = allFaculties.filter(f => f.expertise.includes(classToSchedule.subjectId) && !slotOccupants.some(occ => occ.facultyId === f.id));
                const otherFaculties = allFaculties.filter(f => !f.expertise.includes(classToSchedule.subjectId) && !slotOccupants.some(occ => occ.facultyId === f.id));
                const availableFaculties = [...shuffleArray(expertFaculties), ...shuffleArray(otherFaculties)];

                if (availableFaculties.length > 0) {
                    const assignedFaculty = availableFaculties[0];
                    const availableClassrooms = shuffleArray(allClassrooms.filter(c => !slotOccupants.some(occ => occ.classroomId === c.id)));

                    if (availableClassrooms.length > 0) {
                        const assignedClassroom = availableClassrooms[0];
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
                        break;
                    }
                }
            }
            if (placed) break;
        }

        if (!placed) {
            throw new Error(`Could not place subject ${classToSchedule.subjectName} for batch ${classToSchedule.batchName}. Check if there are enough faculties and classrooms available.`);
        }
    }

    return Promise.resolve(combinedSchedule);
};

interface TimetableSchedulerProps {
  faculties: Faculty[];
  setFaculties: React.Dispatch<React.SetStateAction<Faculty[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  classrooms: Classroom[];
  setClassrooms: React.Dispatch<React.SetStateAction<Classroom[]>>;
  batches: Batch[];
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  commonSubjectIds: string[];
  setCommonSubjectIds: React.Dispatch<React.SetStateAction<string[]>>;
  timetables: Record<string, ScheduleEntry[]>;
  setTimetables: React.Dispatch<React.SetStateAction<Record<string, ScheduleEntry[]>>>;
  combinedTimetable: ScheduleEntry[] | null;
  setCombinedTimetable: React.Dispatch<React.SetStateAction<ScheduleEntry[] | null>>;
  customRules: string;
  setCustomRules: React.Dispatch<React.SetStateAction<string>>;
}

interface BreakConfig { id: string; afterPeriod: number; name: string; duration: number; }

const uuid = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const TimetableScheduler: React.FC<TimetableSchedulerProps> = ({
  faculties, setFaculties, subjects, setSubjects, classrooms, setClassrooms, batches, setBatches,
  commonSubjectIds, setCommonSubjectIds, timetables, setTimetables, combinedTimetable, setCombinedTimetable, customRules, setCustomRules
}) => {

  const [timeConfig, setTimeConfig] = useState({
    periodsPerDay: 8,
    periodDuration: 50,
    startTime: '09:00',
    breaks: [
      { id: 'break1', afterPeriod: 2, name: 'Short Break', duration: 20 },
      { id: 'break2', afterPeriod: 4, name: 'Lunch Break', duration: 50 },
      { id: 'break3', afterPeriod: 6, name: 'Short Break', duration: 20 },
    ] as BreakConfig[],
  });

  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [],
  });

  useEffect(() => {
    const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newPeriods: string[] = [];
    
    const [startHour, startMinute] = timeConfig.startTime.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0, 0);

    const sortedBreaks = [...timeConfig.breaks].sort((a, b) => a.afterPeriod - b.afterPeriod);

    for (let i = 1; i <= timeConfig.periodsPerDay; i++) {
        const startTimeStr = formatTime(currentTime);
        currentTime.setMinutes(currentTime.getMinutes() + timeConfig.periodDuration);
        const endTimeStr = formatTime(currentTime);
        newPeriods.push(`${startTimeStr}-${endTimeStr}`);

        const breakInfo = sortedBreaks.find(b => b.afterPeriod === i);
        if (breakInfo) {
            newPeriods.push(breakInfo.name);
            currentTime.setMinutes(currentTime.getMinutes() + breakInfo.duration);
        }
    }
    setTimeSettings(prev => ({ ...prev, periods: newPeriods }));
  }, [timeConfig]);

  const handleBreakChange = (id: string, field: keyof Omit<BreakConfig, 'id'>, value: string | number) => {
    setTimeConfig(prev => ({ ...prev, breaks: prev.breaks.map(b => b.id === id ? { ...b, [field]: value } : b) }));
  };
  const addBreak = () => {
    setTimeConfig(prev => ({ ...prev, breaks: [...prev.breaks, { id: `break${Date.now()}`, afterPeriod: prev.breaks.length * 2 + 2, name: 'New Break', duration: 15 }] }));
  };
  const removeBreak = (id: string) => {
    setTimeConfig(prev => ({ ...prev, breaks: prev.breaks.filter(b => b.id !== id) }));
  };

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isCombinedLoading, setIsCombinedLoading] = useState(false);
  const [selectedCombinedTab, setSelectedCombinedTab] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (combinedTimetable && combinedTimetable.length > 0) {
        setSelectedBatchId(null);
        const firstYearBatch = batches.find(b => b.name.includes('Year 1'));
        if(firstYearBatch) setSelectedCombinedTab(firstYearBatch.id);
    } else if (Object.keys(timetables).length > 0) {
        setCombinedTimetable(null);
        setSelectedBatchId(Object.keys(timetables)[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleGenerate = useCallback(async (batchId: string) => {
    setLoadingStates(prev => ({ ...prev, [batchId]: true }));
    setError(null);
    setSuccessMessage(null);
    setCombinedTimetable(null);

    const batch = batches.find(b => b.id === batchId);
    if (!batch) {
      setError(`Error: Batch with ID ${batchId} could not be found.`);
      setLoadingStates(prev => ({ ...prev, [batchId]: false }));
      return;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
      const schedule = await generateClassTimetable({
        batch, allSubjects: subjects, allFaculties: faculties,
        allClassrooms: classrooms, commonSubjectIds, customRules, timeSettings
      });
      setTimetables(prev => ({ ...prev, [batchId]: schedule }));
      setSelectedBatchId(batchId);
      showSuccess(`Timetable generated for ${batch.name}. Don't forget to save.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate timetable. The scheduler might have been unable to find a valid solution with the given constraints.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [batchId]: false }));
    }
  }, [batches, subjects, faculties, classrooms, commonSubjectIds, customRules, timeSettings, setTimetables, setCombinedTimetable]);

  const handleGenerateCombined = useCallback(async () => {
    setIsCombinedLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSelectedBatchId(null);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
        const batchesToSchedule = batches.filter(b => b.name.includes('Year 1'));
        const schedule = await generateCombinedClassTimetable({
            batches: batchesToSchedule, allSubjects: subjects, allFaculties: faculties,
            allClassrooms: classrooms, commonSubjectIds, customRules, timeSettings
        });
        setCombinedTimetable(schedule);
        const firstYearBatch = batches.find(b => b.name.includes('Year 1'));
        if(firstYearBatch) setSelectedCombinedTab(firstYearBatch.id);
        showSuccess('Combined timetable generated. Don\'t forget to save.');
    } catch (err: any) {
        setError(err.message || 'Failed to generate combined timetable. Try simplifying the inputs.');
    } finally {
        setIsCombinedLoading(false);
    }
  }, [batches, subjects, faculties, classrooms, commonSubjectIds, customRules, timeSettings, setCombinedTimetable]);
  
  const handleSaveSchedule = useCallback(async () => {
      setIsSaving(true);
      setError(null);
      try {
          localStorage.setItem('userClassSchedule', JSON.stringify({ timetables, combinedTimetable }));
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
          showSuccess('Your schedule has been saved successfully!');
      } catch (err: any) {
          setError('Failed to save the schedule. LocalStorage might be full or disabled.');
      } finally {
          setIsSaving(false);
      }
  }, [timetables, combinedTimetable]);

  const year1BatchesForTabs = batches.filter(b => b.name.includes('Year 1'));
  const commonSubjectsDetails = subjects.filter(s => commonSubjectIds.includes(s.id));
  const isAnyTimetableGenerated = Object.keys(timetables).length > 0 || (combinedTimetable && combinedTimetable.length > 0);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        <ConstraintInput
          title="Faculties"
          items={faculties.map(f => ({ id: f.id, text: `${f.name} (Expertise: ${f.expertise.join(', ')})` }))}
          onAdd={(item) => {
            const [name, expertiseStr] = item.split('(').map(s => s.trim());
            const expertise = expertiseStr?.replace('Expertise: ', '').replace(')', '').split(',').map(s => s.trim().toUpperCase()) || [];
            const newFaculty = { id: uuid(), name, expertise };
            setFaculties(prev => [...prev, newFaculty]);
            showSuccess('Faculty added successfully.');
          }}
          onRemove={(id) => {
            setFaculties(prev => prev.filter(f => f.id !== id));
            showSuccess('Faculty removed successfully.');
          }}
          placeholder="Name (Expertise: SubjID1, SubjID2)"
        />
        <ConstraintInput
          title="Department-Specific Subjects"
          items={subjects.map(s => ({ id: s.id, text: `${s.id}: ${s.name} (${s.hoursPerWeek} hrs/week)` }))}
          onAdd={(item) => {
            const [name, hoursStr] = item.split('(').map(s => s.trim());
            const hoursPerWeek = parseInt(hoursStr?.replace('hrs/week', '').trim() || '3', 10);
            if (name && !isNaN(hoursPerWeek)) {
                const newSubject = { id: name.substring(0,2).toUpperCase() + Date.now().toString().slice(-3), name, hoursPerWeek };
                setSubjects(prev => [...prev, newSubject]);
                showSuccess('Subject added successfully.');
            }
          }}
          onRemove={(id) => {
            setSubjects(prev => prev.filter(s => s.id !== id));
            showSuccess('Subject removed successfully.');
          }}
          placeholder="Subject Name (X hrs/week)"
        />
        <ConstraintInput
          title="Classrooms & Labs"
          items={classrooms.map(c => ({ id: c.id, text: c.name }))}
          onAdd={(name) => {
            setClassrooms(prev => [...prev, { id: uuid(), name }]);
            showSuccess('Classroom added successfully.');
          }}
          onRemove={(id) => {
            setClassrooms(prev => prev.filter(c => c.id !== id));
            showSuccess('Classroom removed successfully.');
          }}
          placeholder="e.g., Room 205, Lab B"
        />
         <ConstraintInput
          title="Student Batches"
          items={batches.map(b => ({ id: b.id, text: `${b.name} (Dept Subjects: ${b.subjectIds.join(', ')})` }))}
          onAdd={(item) => {
            const match = item.match(/(.*?)\s*\((?:Dept Subjects:)?\s*(.*?)\)/);
            let name, subjectIds;
            if (match) {
              name = match[1].trim();
              subjectIds = match[2].split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
            } else { name = item.trim(); subjectIds = []; }
            const newBatch = { id: uuid(), name, subjectIds };
            setBatches(prev => [...prev, newBatch]);
            showSuccess('Batch added successfully.');
          }}
          onRemove={(id) => {
            setBatches(prev => prev.filter(b => b.id !== id));
            showSuccess('Batch removed successfully.');
          }}
          placeholder="Batch Name (Dept Subjects: SUBJID1)"
        />
         <ConstraintInput
          title="Common Subjects for All Departments"
          items={commonSubjectsDetails.map(s => ({ id: s.id, text: `${s.id}: ${s.name}` }))}
          onAdd={(subjectId) => {
            if (!commonSubjectIds.includes(subjectId)) {
                setCommonSubjectIds(prev => [...prev, subjectId]);
                showSuccess('Common subject added.');
            }
          }}
          onRemove={(id) => {
            setCommonSubjectIds(prev => prev.filter(subjectId => subjectId !== id));
            showSuccess('Common subject removed.');
          }}
          placeholder="Select a common subject"
          selectOptions={subjects.map(s => ({ value: s.id, label: `${s.id}: ${s.name}` }))}
        />
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Time & Period Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                <input type="time" id="startTime" value={timeConfig.startTime} onChange={(e) => setTimeConfig(p => ({ ...p, startTime: e.target.value }))} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label htmlFor="periodsPerDay" className="block text-sm font-medium text-slate-600 mb-1">Periods per Day</label>
                <input type="number" id="periodsPerDay" value={timeConfig.periodsPerDay} onChange={(e) => setTimeConfig(p => ({ ...p, periodsPerDay: Math.max(1, parseInt(e.target.value) || 8) }))} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div className="col-span-2">
                <label htmlFor="periodDuration" className="block text-sm font-medium text-slate-600 mb-1">Period Duration (min)</label>
                <input type="number" id="periodDuration" value={timeConfig.periodDuration} onChange={(e) => setTimeConfig(p => ({ ...p, periodDuration: Math.max(15, parseInt(e.target.value) || 50) }))} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Breaks</h4>
              <div className="space-y-2">
                {timeConfig.breaks.map(b => (
                  <div key={b.id} className="flex flex-wrap items-center gap-2">
                    <input type="text" value={b.name} onChange={e => handleBreakChange(b.id, 'name', e.target.value)} placeholder="Break Name" className="flex-grow p-1.5 border border-slate-300 bg-slate-50 rounded-md text-sm min-w-[100px]" />
                    <span className="text-xs text-slate-500">After</span>
                    <input type="number" value={b.afterPeriod} onChange={e => handleBreakChange(b.id, 'afterPeriod', parseInt(e.target.value) || 1)} className="w-16 p-1.5 border border-slate-300 bg-slate-50 rounded-md text-sm" />
                    <input type="number" value={b.duration} onChange={e => handleBreakChange(b.id, 'duration', parseInt(e.target.value) || 15)} className="w-16 p-1.5 border border-slate-300 bg-slate-50 rounded-md text-sm" />
                    <button onClick={() => removeBreak(b.id)} className="text-slate-400 hover:text-red-500"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addBreak} className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1">
                <PlusIcon className="h-4 w-4" /> Add Break
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Custom Scheduling Rules (Optional)</h3>
        <p className="text-sm text-slate-600 mb-4">
            Provide additional instructions in plain English for the scheduler. For example: "Physics should have two consecutive periods twice a week." or "Avoid scheduling math classes after lunch."
        </p>
        <textarea
            value={customRules}
            onChange={(e) => setCustomRules(e.target.value)}
            placeholder="Enter custom rules here..."
            className="w-full p-3 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition placeholder:text-slate-400 text-slate-900 min-h-[100px]"
            aria-label="Custom Scheduling Rules"
        />
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Generate Timetable for a Single Batch</h3>
          <div className="space-y-3">
          {batches.map(batch => {
              const isLoading = loadingStates[batch.id] || false;
              const hasTimetable = !!timetables[batch.id];
              return (
              <div key={batch.id} className={`p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all ${selectedBatchId === batch.id ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  <p className="font-semibold text-slate-800 mb-2 sm:mb-0">{batch.name}</p>
                  <div className="flex items-center gap-2 self-end sm:self-center" style={{ minWidth: '220px', justifyContent: 'flex-end' }}>
                    {isLoading ? (
                      <button
                          disabled
                          className="bg-primary-300 disabled:cursor-not-allowed text-white font-bold text-sm py-1.5 px-4 rounded-md shadow-sm w-[130px] text-center"
                      >
                          Generating...
                      </button>
                    ) : hasTimetable ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                            setCombinedTimetable(null);
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm py-1.5 px-4 rounded-md"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleGenerate(batch.id)}
                          className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm py-1.5 px-4 rounded-md shadow-sm w-[130px]"
                        >
                          Regenerate
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleGenerate(batch.id)}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-1.5 px-4 rounded-md shadow-sm w-[130px]"
                      >
                        Generate
                      </button>
                    )}
                  </div>
              </div>
              );
          })}
          </div>
      </div>

       <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Generate Combined Timetable (Year 1)</h3>
           <p className="text-sm text-slate-600 mb-4">
             This generates a master timetable for all first-year batches, resolving shared resource conflicts like common subjects or faculty.
           </p>
          <button
              onClick={handleGenerateCombined}
              disabled={isCombinedLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md shadow-sm transition-transform hover:scale-105 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
              {isCombinedLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isCombinedLoading ? 'Generating Master Schedule...' : 'Generate Combined Timetable'}
          </button>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
      {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-8" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}
      
      {isAnyTimetableGenerated && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Save Your Progress</h3>
              <p className="text-slate-600 mb-4">Save the current generated schedule to your browser's local storage. It will be automatically loaded the next time you visit.</p>
              <button
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md shadow-sm transition-transform hover:scale-105 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                  {isSaving ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                      <SaveIcon className="h-5 w-5 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Schedule'}
              </button>
          </div>
      )}

      {selectedBatchId && timetables[selectedBatchId] && (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                Timetable for {batches.find(b => b.id === selectedBatchId)?.name}
            </h2>
            <TimetableDisplay schedule={timetables[selectedBatchId]} timeSettings={timeSettings} />
        </div>
      )}
      
      {combinedTimetable && (
        <div>
           <div className="border-b border-slate-200 mb-4">
              <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
                  {year1BatchesForTabs.map((batch) => (
                      <button
                          key={batch.id}
                          onClick={() => setSelectedCombinedTab(batch.id)}
                          className={`whitespace-nowrap py-3 px-1 sm:px-2 border-b-2 font-medium text-sm transition-colors ${
                            selectedCombinedTab === batch.id
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                      >
                          {batch.name}
                      </button>
                  ))}
              </nav>
          </div>
          {selectedCombinedTab && (
            <TimetableDisplay 
                schedule={combinedTimetable.filter(entry => entry.batchId === selectedCombinedTab)} 
                timeSettings={timeSettings} 
            />
          )}
        </div>
      )}
    </div>
  );
};