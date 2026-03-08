import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BudgetSummaryCards from '@/components/BudgetSummaryCards';
import BudgetChart from '@/components/BudgetChart';
import BudgetTable from '@/components/BudgetTable';
import CompactBudgetView from '@/components/CompactBudgetView';
import { useBudget } from '@/hooks/use-budget';
import { isSetupDone } from '@/lib/budget-store';
import SetupPage from './SetupPage';
import { useState } from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';

export default function Dashboard() {
  const budget = useBudget();
  const [setupDone, setSetupDone] = useState(isSetupDone());
  const [compactView, setCompactView] = useState(false);

  if (!setupDone) {
    return (
      <SetupPage
        onComplete={(items) => {
          budget.loadItems(items);
          setSetupDone(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">예산 현황</h1>
            <p className="text-sm text-muted-foreground mt-1">세출예산 집행현황을 한눈에 확인하세요</p>
          </div>
          <button
            onClick={() => setCompactView(!compactView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              compactView
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {compactView ? <TableIcon className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            {compactView ? '테이블 보기' : '간단하게 보기'}
          </button>
        </div>
        <BudgetSummaryCards summary={budget.summary} />
        <BudgetChart summary={budget.summary} items={budget.items} />
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">상세 내역</h2>
          {compactView ? (
            <CompactBudgetView items={budget.items} />
          ) : (
            <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} />
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
