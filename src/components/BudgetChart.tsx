import { useState } from 'react';
import { BudgetItem, BudgetSummary } from '@/lib/budget-types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COLORS = [
  'hsl(210,60%,65%)', 'hsl(45,80%,70%)', 'hsl(150,40%,60%)',
  'hsl(340,50%,70%)', 'hsl(280,30%,65%)', 'hsl(20,60%,65%)',
];

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

interface Props {
  summary: BudgetSummary;
  items?: BudgetItem[];
}

export default function BudgetChart({ summary, items = [] }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const data = summary.categoryBreakdown.map(c => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    value: c.budget,
    executed: c.executed,
    remaining: c.remaining,
  }));

  if (data.length === 0) return null;

  const handlePieClick = (dataItem: any) => {
    if (dataItem?.fullName) {
      setSelectedCategory(dataItem.fullName);
    }
  };

  const categoryItems = selectedCategory
    ? items.filter(i => i.category === selectedCategory)
    : [];

  const catSummary = selectedCategory
    ? summary.categoryBreakdown.find(c => c.name === selectedCategory)
    : null;

  const renderCustomLabel = ({ name, percent, x, y, midAngle }: any) => {
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="hsl(220,15%,40%)" textAnchor={midAngle > 180 ? 'end' : 'start'} dominantBaseline="central" fontSize={11}>
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <>
      <div className="glass-card rounded-xl p-4 sm:p-5 h-full flex flex-col">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">사업별 예산 현황</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">영역을 클릭하면 상세 정보를 볼 수 있습니다</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomLabel}
                outerRadius={90}
                innerRadius={40}
                dataKey="value"
                cursor="pointer"
                onClick={handlePieClick}
                strokeWidth={2}
                stroke="hsl(0,0%,100%)"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatKRW(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(210,25%,88%)', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedCategory} 상세</DialogTitle>
          </DialogHeader>
          {catSummary && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass-card rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">예산</p>
                <p className="text-sm font-bold text-foreground">{formatKRW(catSummary.budget)}</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">집행</p>
                <p className="text-sm font-bold text-foreground">{formatKRW(catSummary.executed)}</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">잔액</p>
                <p className="text-sm font-bold text-foreground">{formatKRW(catSummary.remaining)}</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">집행률</p>
                <p className="text-sm font-bold text-foreground">
                  {catSummary.budget > 0 ? ((catSummary.executed / catSummary.budget) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">항목 목록 ({categoryItems.length}건)</p>
            {categoryItems.map(item => (
              <div key={item.id} className="glass-card rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{item.description}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>예산 {formatKRW(item.budgetAmount)}</span>
                  <span>집행 {formatKRW(item.executedAmount)}</span>
                  <span>잔액 {formatKRW(item.remainingAmount)}</span>
                  <span className="font-semibold">{item.executionRate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {categoryItems.length === 0 && (
              <p className="text-sm text-muted-foreground">해당 사업의 항목을 찾을 수 없습니다.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
