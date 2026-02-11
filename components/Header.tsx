import React from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from '../types';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  return (
    <header className="py-6 text-center relative">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="text-4xl">
          <span role="img" aria-label="sparkle and pen">✨</span>
          <span role="img" aria-label="pen">🖋️</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          <span className="font-extrabold">Prompt</span>
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Builder</span>
        </h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400">From Thoughts to Perfect Prompts.</p>
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </div>
    </header>
  );
};

export default Header;
