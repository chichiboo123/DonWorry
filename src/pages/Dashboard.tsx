import AppHeader from '@/components/AppHeader';
import BudgetSummaryCards from '@/components/BudgetSummaryCards';
import BudgetChart from '@/components/BudgetChart';
import BudgetTable from '@/components/BudgetTable';
import { useBudget } from '@/hooks/use-budget';
import { isSetupDone } from '@/lib/budget-store';
import SetupPage from './SetupPage';
import { useState } from 'react';

export default function Dashboard() {
  const budget = useBudget();
  const [setupDone, setSetupDone] = useState(isSetupDone());

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
    <div className="min-h-screen bg-background">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">예산 현황</h1>
          <p className="text-sm text-muted-foreground mt-1">세출예산 집행현황을 한눈에 확인하세요</p>
        </div>
        <BudgetSummaryCards summary={budget.summary} />
        <BudgetChart summary={budget.summary} />
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">상세 내역</h2>
          <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} />
        </div>
      </main>
    </div>
  );
}
