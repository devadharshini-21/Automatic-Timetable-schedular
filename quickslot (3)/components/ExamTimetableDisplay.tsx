import React from 'react';

// Inlined Types
export interface ExamScheduleEntry { date: string; session: 'Forenoon' | 'Afternoon'; startTime: string; endTime: string; subjectId: string; subjectName: string; batchId: string; }
export interface Batch { id: string; name: string; subjectIds: string[]; }


// Fix: Add an interface for the shape of grouped schedule data for type safety.
interface GroupedExamData {
    date: string;
    session: 'Forenoon' | 'Afternoon';
    startTime: string;
    endTime: string;
    exams: Record<string, {name: string, id: string}>;
}


export const ExamTimetableDisplay: React.FC<{ schedule: ExamScheduleEntry[]; batches: Batch[] }> = ({ schedule, batches }) => {
    // Group schedule by date and session
    const groupedSchedule = schedule.reduce((acc, entry) => {
        const key = `${entry.date}|${entry.session}`;
        if (!acc[key]) {
            acc[key] = {
                date: entry.date,
                session: entry.session,
                startTime: entry.startTime,
                endTime: entry.endTime,
                exams: {}
            };
        }
        acc[key].exams[entry.batchId] = { name: entry.subjectName, id: entry.subjectId };
        return acc;
    }, {} as Record<string, GroupedExamData>);

    const sortedSchedule = Object.values(groupedSchedule).sort((a: GroupedExamData, b: GroupedExamData) => 
        new Date(a.date).getTime() - new Date(b.date).getTime() || a.session.localeCompare(b.session)
    );

    const uniqueSubjectIds = Array.from(new Set(schedule.map(s => s.subjectId)));
    
    const colorPalette = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-teal-100 text-teal-800 border-teal-200',
    ];

    const getSubjectColor = (subjectId: string): string => {
        const index = uniqueSubjectIds.indexOf(subjectId);
        return colorPalette[index % colorPalette.length];
    };
    
    const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200 mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Generated Exam Timetable</h2>
          
          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-center">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 font-semibold text-slate-600 border-b-2 border-slate-200">Date</th>
                  <th className="p-3 font-semibold text-slate-600 border-b-2 border-slate-200">Time Slot</th>
                  {batches.map(batch => (
                    <th key={batch.id} className="p-3 font-semibold text-slate-600 border-b-2 border-slate-200">{batch.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSchedule.map(({ date, session, startTime, endTime, exams }) => (
                  <tr key={`${date}-${session}`}>
                    <td className="p-3 font-medium text-slate-500 border border-slate-200 bg-slate-50">{formatDate(date)}</td>
                    <td className="p-3 font-medium text-slate-500 border border-slate-200 bg-slate-50">{startTime} - {endTime}<br/><span className="text-xs">({session})</span></td>
                    {batches.map(batch => {
                      const exam = exams[batch.id];
                      if (exam) {
                         const color = getSubjectColor(exam.id);
                         return (
                            <td key={batch.id} className={`p-1.5 border border-slate-200`}>
                              <div className={`rounded-lg p-2 h-full flex flex-col justify-center border ${color}`}>
                                <p className="font-bold text-sm">{exam.name}</p>
                              </div>
                            </td>
                         );
                      }
                      return <td key={batch.id} className="p-3 border border-slate-200"></td>;
                    })}
                  </tr>
                ))}
                 {sortedSchedule.length === 0 && (
                  <tr>
                      <td colSpan={batches.length + 2} className="text-center text-slate-500 py-10">
                          No exam schedule generated for the selected criteria.
                      </td>
                  </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden">
            <div className="space-y-6">
              {sortedSchedule.map(({ date, session, startTime, endTime, exams }) => (
                <div key={`${date}-${session}`} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                   <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                        <div>
                            <p className="font-bold text-slate-800">{formatDate(date)}</p>
                            <p className="text-sm text-slate-500">{session} Session</p>
                        </div>
                        <p className="font-medium text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{startTime} - {endTime}</p>
                   </div>
                   <div className="space-y-2">
                       {batches.map(batch => {
                           const exam = exams[batch.id];
                           if(exam) {
                               const color = getSubjectColor(exam.id);
                               const lightColor = color.replace('bg-', 'bg-').replace('-100', '-50');
                               return (
                                   <div key={batch.id} className={`p-2 rounded-md flex justify-between items-center ${lightColor}`}>
                                        <span className="font-semibold text-sm text-slate-700">{batch.name}</span>
                                        <span className="font-bold text-sm">{exam.name}</span>
                                   </div>
                               );
                           }
                           return null;
                       })}
                   </div>
                </div>
              ))}
              {sortedSchedule.length === 0 && (
                  <p className="text-center text-slate-500 py-10">
                    No exam schedule generated for the selected criteria.
                  </p>
              )}
            </div>
          </div>
        </div>
    );
};