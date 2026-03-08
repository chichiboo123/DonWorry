import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BudgetSummaryCards from '@/components/BudgetSummaryCards';
import BudgetChart from '@/components/BudgetChart';
import BudgetTable from '@/components/BudgetTable';
import CompactBudgetView from '@/components/CompactBudgetView';
import { useBudget } from '@/hooks/use-budget';
import { isSetupDone, clearSetup } from '@/lib/budget-store';
import SetupPage from './SetupPage';
import { useState } from 'react';
import { LayoutGrid, Table as TableIcon, RotateCcw, RefreshCw, Globe, HardDrive, Loader2, Upload } from 'lucide-react';
import { DataMode } from '@/lib/google-apps-script';

export default function Dashboard() {
  const budget = useBudget();
  const [setupDone, setSetupDone] = useState(isSetupDone());
  const [compactView, setCompactView] = useState(false);

  if (!setupDone) {
    return (
      <SetupPage
        onComplete={(items, mode) => {
          if (mode) budget.setDataMode(mode);
          budget.loadItems(items);
          setSetupDone(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1">
        {/* 모드 표시 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {budget.dataMode === 'online' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-green-500" />
                <span>온라인 모드</span>
                {budget.syncing && <Loader2 className="w-3 h-3 animate-spin" />}
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>로컬 모드</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {budget.dataMode === 'online' && (
              <>
                <button
                  onClick={budget.pushToOnline}
                  disabled={budget.syncing || budget.items.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="현재 로컬 데이터를 스프레드시트에 업로드"
                >
                  <Upload className={`w-3.5 h-3.5`} />
                  업로드
                </button>
                <button
                  onClick={budget.refreshFromOnline}
                  disabled={budget.syncing}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="스프레드시트에서 최신 데이터 불러오기"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${budget.syncing ? 'animate-spin' : ''}`} />
                  다운로드
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary cards + Pie chart in one row */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="lg:w-1/3 flex flex-col gap-3 sm:gap-4">
            <BudgetSummaryCards summary={budget.summary} />
          </div>
          <div className="lg:w-2/3">
            <BudgetChart summary={budget.summary} items={budget.items} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">상세 내역</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearSetup();
                  setSetupDone(false);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">데이터 다시 불러오기</span>
                <span className="sm:hidden">다시 불러오기</span>
              </button>
              <button
                onClick={() => setCompactView(!compactView)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                  compactView
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {compactView ? <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{compactView ? '테이블 보기' : '간단하게 보기'}</span>
                <span className="sm:hidden">{compactView ? '테이블' : '간단히'}</span>
              </button>
            </div>
          </div>
          {compactView ? (
            <CompactBudgetView items={budget.items} />
          ) : (
            <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} onDeleteGroup={budget.deleteGroup} />
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
