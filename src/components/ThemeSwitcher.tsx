import { ThemeColor, THEME_MAP } from '@/lib/budget-types';

interface ThemeSwitcherProps {
  current: ThemeColor;
  onChange: (theme: ThemeColor) => void;
}

export default function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      {(Object.entries(THEME_MAP) as [ThemeColor, typeof THEME_MAP[ThemeColor]][]).map(([key, val]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${
            current === key ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: val.color }}
          title={val.label}
        />
      ))}
    </div>
  );
}
