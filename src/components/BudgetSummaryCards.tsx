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
    <div className="grid grid-cols-2 gap-2 sm:gap-3 h-full">
      {cards.map((card) => (
        <div key={card.label} className="glass-card rounded-xl p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 justify-center">
          <div className="flex items-center gap-1.5">
            <div className={`p-1 sm:p-1.5 rounded-md ${card.accent}`}>
              <card.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
