import { BudgetSummary } from '@/lib/budget-types';
import { Wallet, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

interface Props {
  summary: BudgetSummary;
}

export default function BudgetSummaryCards({ summary }: Props) {
  const cards = [
    { label: '총 예산', value: formatKRW(summary.totalBudget), icon: Wallet, accent: 'bg-primary/10' },
    { label: '집행액', value: formatKRW(summary.totalExecuted), icon: TrendingUp, accent: 'bg-accent/20' },
    { label: '잔액', value: formatKRW(summary.totalRemaining), icon: PiggyBank, accent: 'bg-secondary' },
    { label: '집행률', value: summary.executionRate.toFixed(1) + '%', icon: BarChart3, accent: 'bg-primary/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card rounded-xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`p-1.5 sm:p-2 rounded-lg ${card.accent}`}>
              <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
