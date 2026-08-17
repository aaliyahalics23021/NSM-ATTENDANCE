import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 shadow-sm transition-all"
        title="Switch Theme"
      >
        {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
        {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
        {theme === 'system' && <Monitor className="w-4 h-4 text-slate-400" />}
        <span className="capitalize hidden sm:inline">{theme}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-50 py-1 text-xs">
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800 transition-colors ${
                theme === 'light' ? 'text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" /> Light
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800 transition-colors ${
                theme === 'dark' ? 'text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4 text-blue-400" /> Dark
            </button>
            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800 transition-colors ${
                theme === 'system' ? 'text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Monitor className="w-4 h-4 text-slate-400" /> System
            </button>
          </div>
        </>
      )}
    </div>
  );
}
