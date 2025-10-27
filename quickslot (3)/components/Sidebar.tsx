

import React from 'react';
import { useAuth } from '../AuthContext';
import { LayoutDashboardIcon, CalendarDaysIcon, LogOutIcon, AppLogoIcon, PencilIcon } from './icons';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {React.cloneElement(icon, { className: `h-5 w-5 ${isActive ? 'text-primary-700' : 'text-slate-500'}`})}
      <span className="ml-3">{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const handleNavClick = (page: string) => {
      setCurrentPage(page);
      setIsOpen(false); // Close sidebar on navigation in mobile view
  };

  return (
    <div className={`flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0 fixed lg:static inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center justify-center h-20 border-b border-slate-200">
         <div className="flex items-center text-primary-500">
             <AppLogoIcon className="h-8 w-8" />
             <span className="ml-2 text-xl font-bold text-slate-800 tracking-wider font-serif">QuickSlot</span>
         </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavItem
          icon={<LayoutDashboardIcon />}
          label="Dashboard"
          isActive={currentPage === 'dashboard'}
          onClick={() => handleNavClick('dashboard')}
        />
        <NavItem
          icon={<CalendarDaysIcon />}
          label="Scheduler"
          isActive={currentPage === 'scheduler'}
          onClick={() => handleNavClick('scheduler')}
        />
        <NavItem
          icon={<PencilIcon />}
          label="Exams"
          isActive={currentPage === 'exams'}
          onClick={() => handleNavClick('exams')}
        />
      </nav>
      
      <div className="px-4 py-4 border-t border-slate-200">
         <div className="bg-slate-100 p-4 rounded-lg">
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">User Information</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-800 truncate" title={user?.email || ''}>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-medium text-slate-800">Admin</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-medium text-slate-800">{currentDate}</span>
                </div>
            </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2.5 mt-4 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 hover:text-red-700 transition-colors"
        >
          <LogOutIcon className="h-5 w-5" />
          <span className="ml-2">Logout</span>
        </button>
      </div>
    </div>
  );
};