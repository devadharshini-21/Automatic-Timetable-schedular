import React from 'react';
import { useAuth } from '../AuthContext';

// Inlined Types
export interface Faculty { id: string; name: string; expertise: string[]; }
export interface Subject { id: string; name: string; hoursPerWeek: number; }
export interface Classroom { id: string; name: string; }
export interface Batch { id: string; name: string; subjectIds: string[]; }


interface DashboardPageProps {
    faculties: Faculty[];
    subjects: Subject[];
    classrooms: Classroom[];
    batches: Batch[];
    setCurrentPage: (page: string) => void;
}

const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactElement<{ className?: string }>;
    color: string;
    iconColor: string;
    onClick: () => void;
}> = ({ title, value, icon, color, iconColor, onClick }) => (
    <button onClick={onClick} className={`bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center transition-transform hover:scale-105 hover:shadow-lg w-full text-left`}>
        <div className={`p-3 rounded-full ${color}`}>
            {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}`})}
        </div>
        <div className="ml-4">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </button>
);


export const DashboardPage: React.FC<DashboardPageProps> = ({ faculties, subjects, classrooms, batches, setCurrentPage }) => {
    const { user } = useAuth();
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Hello, {user?.email?.split('@')[0] || 'Admin'}!</h1>
                <p className="text-slate-600 mt-1">Ready to orchestrate the perfect academic week? Let's get started.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Faculties" 
                    value={faculties.length}
                    onClick={() => setCurrentPage('scheduler')}
                    color="bg-blue-100"
                    iconColor="text-blue-600"
                    icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
                />
                 <StatCard 
                    title="Configured Subjects" 
                    value={subjects.length}
                    onClick={() => setCurrentPage('scheduler')}
                    color="bg-green-100"
                    iconColor="text-green-600"
                    icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"/></svg>}
                />
                 <StatCard 
                    title="Available Classrooms" 
                    value={classrooms.length}
                    onClick={() => setCurrentPage('scheduler')}
                    color="bg-yellow-100"
                    iconColor="text-yellow-600"
                    icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1"/></svg>}
                />
                <StatCard 
                    title="Student Batches" 
                    value={batches.length}
                    onClick={() => setCurrentPage('scheduler')}
                    color="bg-purple-100"
                    iconColor="text-purple-600"
                    icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
                />
            </div>
            
            <div className="mt-10">
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Getting Started Guide</h2>
                    <p className="text-slate-600 mb-4">
                        Navigate to the <button onClick={() => setCurrentPage('scheduler')} className="font-semibold text-primary-600 hover:underline">Scheduler</button> tab to begin. There you can:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600">
                        <li>Review and modify the pre-filled constraints for faculties, subjects, classrooms, and batches.</li>
                        <li>Define subjects that are common to all departments for easier configuration.</li>
                        <li>Generate a timetable for a single department to test a specific setup.</li>
                        <li>Use the "Generate Combined" feature to create a master timetable for all first-year departments, resolving clashes in shared resources like faculties or labs.</li>
                    </ul>
                </div>
            </div>

            <div className="mt-10">
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Plan?</h2>
                    <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                        All your data is ready. Head over to the scheduler to configure rules, manage resources, and generate your clash-free timetable with a single click.
                    </p>
                    <button
                        onClick={() => setCurrentPage('scheduler')}
                        className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105"
                    >
                        <span>Proceed to Scheduler</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};