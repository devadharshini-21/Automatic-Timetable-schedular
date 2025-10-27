

import React from 'react';
import { AppLogoIcon, MenuIcon } from './icons';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 z-10">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-500"
            aria-label="Open menu"
          >
              <MenuIcon className="h-6 w-6" />
          </button>
          <AppLogoIcon className="h-8 w-8 text-primary-500 mr-3" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-serif">
            QuickSlot
          </h1>
        </div>
      </div>
    </header>
  );
};
