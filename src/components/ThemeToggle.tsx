'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-muted/50 animate-pulse" />;
  }

  // Cycle: system → light → dark → system
  const cycleTheme = () => {
    const modes = ['system', 'light', 'dark'];
    const currentIdx = modes.indexOf(theme || 'system');
    const nextIdx = (currentIdx + 1) % modes.length;
    setTheme(modes[nextIdx]);
    setCycleCount(c => c + 1);
  };

  const resolvedDisplay = (() => {
    if (theme === 'light') return 'light';
    if (theme === 'dark') return 'dark';
    return 'system';
  })();

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all text-[11px] font-semibold"
      title={`Theme: ${resolvedDisplay}. Click to cycle: system → light → dark`}
    >
      {resolvedDisplay === 'dark' ? (
        <Moon className="w-3.5 h-3.5" />
      ) : resolvedDisplay === 'light' ? (
        <Sun className="w-3.5 h-3.5" />
      ) : (
        <Monitor className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline capitalize">{resolvedDisplay}</span>
    </button>
  );
}
