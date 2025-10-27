import React, { useState } from 'react';
import { ExamTimetableDisplay } from './ExamTimetableDisplay';
import { SaveIcon } from './icons';

// Inlined Types
export interface Batch { id: string; name: string; subjectIds: string[]; }
export interface Subject { id: string; name: string; hoursPerWeek: number; }
export interface ExamScheduleEntry { date: string; session: 'Forenoon' | 'Afternoon'; startTime: string; endTime: string; subjectId: string; subjectName: string; batchId: string; }

// Inlined Local Exam Timetable Generation Logic
// FIX: Changed to a standard function declaration to avoid TSX parsing ambiguity with generics.
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const calculateEndTime = (startTime: string, dur: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setHours(date.getHours() + dur);
    return date.toTimeString().substring(0, 5);
};

const generateExamTimetable = async (params: { startDate: string; endDate: string; selectedSubjects: Record<string, string[]>; commonSubjects: string[]; examRules: string; duration: number; forenoonTime: string; afternoonTime: string; allSubjects: Subject[]; allBatches: Batch[]; }): Promise<ExamScheduleEntry[]> => {
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

interface ExamConfig {
    startDate: string;
    endDate: string;
    forenoonTime: string;
    afternoonTime: string;
    duration: number;
    examRules: string;
    commonSubjectsForExams: string[];
    selectedDeptSubjects: Record<string, string[]>;
}

interface ExamSchedulerPageProps {
  batches: Batch[];
  subjects: Subject[];
  schedule: ExamScheduleEntry[] | null;
  setSchedule: React.Dispatch<React.SetStateAction<ExamScheduleEntry[] | null>>;
  examConfig: ExamConfig;
  setExamConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
}

const SubjectSelector: React.FC<{
  title: string;
  subjects: Subject[];
  selectedSubjects: string[];
  onChange: (subjectId: string, isSelected: boolean) => void;
}> = ({ title, subjects, selectedSubjects, onChange }) => (
  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
    <h4 className="font-bold text-slate-700 mb-3">{title}</h4>
    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
      {subjects.map(subject => (
        <label key={subject.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={selectedSubjects.includes(subject.id)}
            onChange={e => onChange(subject.id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-800">{subject.id}: {subject.name}</span>
        </label>
      ))}
      {subjects.length === 0 && <p className="text-sm text-slate-500 text-center">No subjects to display.</p>}
    </div>
  </div>
);


export const ExamSchedulerPage: React.FC<ExamSchedulerPageProps> = ({
    batches, subjects, schedule, setSchedule, examConfig, setExamConfig
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const showSuccess = (message: string) => {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleConfigChange = (field: keyof ExamConfig, value: any) => {
        setExamConfig(prev => ({ ...prev, [field]: value }));
    };
    
    const handleCommonSubjectChange = (subjectId: string, isSelected: boolean) => {
        const newCommon = isSelected
            ? [...examConfig.commonSubjectsForExams, subjectId]
            : examConfig.commonSubjectsForExams.filter(id => id !== subjectId);
        handleConfigChange('commonSubjectsForExams', newCommon);
    };

    const handleDeptSubjectChange = (batchId: string, subjectId: string, isSelected: boolean) => {
        const newDeptSubjects = { ...examConfig.selectedDeptSubjects };
        newDeptSubjects[batchId] = isSelected
            ? [...(newDeptSubjects[batchId] || []), subjectId]
            : (newDeptSubjects[batchId] || []).filter(id => id !== subjectId);
        handleConfigChange('selectedDeptSubjects', newDeptSubjects);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setSchedule(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
            const generatedSchedule = await generateExamTimetable({
                ...examConfig,
                allSubjects: subjects,
                allBatches: batches,
                commonSubjects: examConfig.commonSubjectsForExams,
                selectedSubjects: examConfig.selectedDeptSubjects
            });
            setSchedule(generatedSchedule);
            showSuccess("Exam schedule generated successfully. Don't forget to save!");
        } catch (err: any) {
            setError(err.message || 'Failed to generate exam timetable. Please check inputs and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            localStorage.setItem('userExamSchedule', JSON.stringify({ schedule, config: examConfig }));
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
            showSuccess('Exam schedule and configuration saved successfully!');
        } catch (err: any) {
            setError('Failed to save the schedule. LocalStorage might be full or disabled.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Exam Timetable Generator</h1>
            <p className="text-slate-600 mb-8">Configure exam details and select subjects to generate a clash-free schedule.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Exam Period & Timings</h3>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                                <input type="date" id="start-date" value={examConfig.startDate} onChange={e => handleConfigChange('startDate', e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                                <input type="date" id="end-date" value={examConfig.endDate} onChange={e => handleConfigChange('endDate', e.target.value)} min={examConfig.startDate} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fn-time" className="block text-sm font-medium text-slate-600 mb-1">Forenoon Start</label>
                                    <input type="time" id="fn-time" value={examConfig.forenoonTime} onChange={e => handleConfigChange('forenoonTime', e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500" />
                                </div>
                                 <div>
                                    <label htmlFor="an-time" className="block text-sm font-medium text-slate-600 mb-1">Afternoon Start</label>
                                    <input type="time" id="an-time" value={examConfig.afternoonTime} onChange={e => handleConfigChange('afternoonTime', e.target.value)} className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-slate-600 mb-1">Duration (hours)</label>
                                <input type="number" id="duration" value={examConfig.duration} onChange={e => handleConfigChange('duration', Number(e.target.value))} min="1" max="5" className="w-full p-2 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Scheduling Rules & Exclusions</h3>
                        <textarea
                            value={examConfig.examRules}
                            onChange={(e) => handleConfigChange('examRules', e.target.value)}
                            placeholder="e.g., Sundays are holidays. Schedule CS101 and MA101 on the same day for CSE."
                            className="w-full p-3 border border-slate-300 bg-slate-50 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                            aria-label="Scheduling Rules and Exclusions"
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Subject Selection for Exams</h3>
                    <div className="mb-6">
                        <SubjectSelector
                            title="Common Subjects (Select subjects to be scheduled for all departments)"
                            subjects={subjects}
                            selectedSubjects={examConfig.commonSubjectsForExams}
                            onChange={handleCommonSubjectChange}
                        />
                    </div>
                    <div>
                         <h4 className="font-bold text-slate-700 mb-3">Department-Specific Subjects</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {batches.map(batch => (
                                <SubjectSelector
                                    key={batch.id}
                                    title={batch.name}
                                    subjects={subjects.filter(s => batch.subjectIds.includes(s.id))}
                                    selectedSubjects={examConfig.selectedDeptSubjects[batch.id] || []}
                                    onChange={(subjectId, isSelected) => handleDeptSubjectChange(batch.id, subjectId, isSelected)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mb-8">
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full max-w-sm bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105 disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'Generating Schedule...' : 'Generate Exam Schedule'}
                </button>
            </div>


            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-8" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}
            
            {schedule && schedule.length > 0 && (
                <>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 text-center mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Save Your Exam Schedule</h3>
                    <p className="text-slate-600 mb-4">Save the generated schedule and your settings. They will be loaded automatically next time.</p>
                    <button
                        onClick={handleSave}
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
                <ExamTimetableDisplay schedule={schedule} batches={batches} />
                </>
            )}
            {schedule && schedule.length === 0 && !isLoading && 
                <div className="text-center p-8 bg-white rounded-2xl shadow-md border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-700">No Schedule Generated</h3>
                    <p className="text-slate-500 mt-2">Could not generate a schedule. Try extending the date range or checking your holiday rules.</p>
                </div>
            }
        </div>
    );
};