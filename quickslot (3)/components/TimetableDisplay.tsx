import React from 'react';

// Inlined Types
export interface TimeSettings { days: string[]; periods: string[]; }
export interface ScheduleEntry { day: string; period: string; subjectId: string; subjectName: string; facultyId: string; facultyName: string; classroomId: string; classroomName: string; batchId?: string; batchName?: string; }


interface TimetableDisplayProps {
  schedule: ScheduleEntry[];
  timeSettings: TimeSettings;
}

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

const getSubjectColor = (subjectId: string, subjectIds: string[]): string => {
  const index = subjectIds.indexOf(subjectId);
  return colorPalette[index % colorPalette.length];
};

export const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ schedule, timeSettings }) => {
  const uniqueSubjectIds: string[] = [...new Set(schedule.map(s => s.subjectId))];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-center">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-3 font-semibold text-slate-600 border-b-2 border-slate-200">Time</th>
              {timeSettings.days.map(day => (
                <th key={day} className="p-3 font-semibold text-slate-600 border-b-2 border-slate-200">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSettings.periods.map(period => {
               if (period.includes('Break')) {
                return (
                  <tr key={period}>
                    <td colSpan={timeSettings.days.length + 1} className="p-2 text-center font-semibold text-slate-500 bg-slate-100 border border-slate-200">
                      {period}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={period}>
                  <td className="p-3 font-medium text-slate-500 border border-slate-200 bg-slate-50">{period}</td>
                  {timeSettings.days.map(day => {
                    const entry = schedule.find(s => s.day === day && s.period === period);
                    if (entry) {
                      const color = getSubjectColor(entry.subjectId, uniqueSubjectIds);
                      return (
                        <td key={`${day}-${period}`} className={`p-1.5 border border-slate-200`}>
                          <div className={`rounded-lg p-2 h-full flex flex-col justify-center border ${color}`}>
                            <p className="font-bold text-sm">{entry.subjectName}</p>
                            <p className="text-xs">{entry.facultyName}</p>
                            <p className="text-xs italic opacity-75">{entry.classroomName}</p>
                          </div>
                        </td>
                      );
                    }
                    return <td key={`${day}-${period}`} className="p-3 border border-slate-200"></td>;
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile View: List */}
      <div className="block lg:hidden">
        {timeSettings.days.map(day => (
          <div key={day} className="mb-6 last:mb-0">
            <h3 className="font-bold text-lg text-slate-800 mb-3 sticky top-0 bg-white/80 backdrop-blur-sm py-2">{day}</h3>
            <div className="space-y-2">
              {timeSettings.periods.map(period => {
                if (period.includes('Break')) {
                  return (
                    <div key={`${day}-${period}`} className="text-center font-semibold text-sm text-slate-500 bg-slate-100 p-3 rounded-lg">
                      {period}
                    </div>
                  );
                }
                const entry = schedule.find(s => s.day === day && s.period === period);
                if (entry) {
                  const color = getSubjectColor(entry.subjectId, uniqueSubjectIds);
                  const lightColor = color.replace('bg-', 'bg-').replace('-100', '-50');
                  return (
                    <div key={`${day}-${period}`} className={`p-3 rounded-lg border ${lightColor}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-base text-slate-800">{entry.subjectName}</span>
                        <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded-full">{period}</span>
                      </div>
                      <div className="text-sm text-slate-700">
                        <p>{entry.facultyName}</p>
                        <p className="italic opacity-80">{entry.classroomName}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};