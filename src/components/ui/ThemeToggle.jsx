import React from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-surface-overlay border border-border-subtle rounded-xl p-1 gap-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'light' ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'
        }`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'system' ? 'bg-surface shadow-sm text-brand-500' : 'text-text-secondary hover:text-text-primary'
        }`}
        title="System Theme"
      >
        <Monitor size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'dark' ? 'bg-slate-800 shadow-sm text-brand-400' : 'text-text-secondary hover:text-text-primary'
        }`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
