import starIcon from '@/assets/star-icon.png';
import ThemeSwitcher from './ThemeSwitcher';
import { ThemeColor } from '@/lib/budget-types';
import { Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  theme: ThemeColor;
  onThemeChange: (t: ThemeColor) => void;
}

export default function AppHeader({ theme, onThemeChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={starIcon} alt="Don Worry" className="w-7 h-7 animate-float" />
          <span className="text-lg font-bold text-foreground">돈 워리</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Don Worry</span>
        </button>

        <div className="flex items-center gap-3">
          <ThemeSwitcher current={theme} onChange={onThemeChange} />
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === '/' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              대시보드
            </button>
            <button
              onClick={() => navigate('/manage')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                location.pathname === '/manage' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              관리
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
