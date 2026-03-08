import { useState, useRef, useEffect } from 'react';
import { ThemeColor, THEME_MAP } from '@/lib/budget-types';
import { Palette } from 'lucide-react';

interface ThemeSwitcherProps {
  current: ThemeColor;
  onChange: (theme: ThemeColor) => void;
}

export default function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="테마 색상 변경"
      >
        <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: THEME_MAP[current].color }} />
        <Palette className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-xl shadow-lg p-3 z-50 min-w-[160px]">
          <p className="text-xs font-medium text-muted-foreground mb-2">테마 선택</p>
          <div className="space-y-1">
            {(Object.entries(THEME_MAP) as [ThemeColor, typeof THEME_MAP[ThemeColor]][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  current === key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    current === key ? 'border-primary scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: val.color }}
                />
                <span>{val.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
