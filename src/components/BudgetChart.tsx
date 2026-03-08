import { useState } from 'react';
import { BudgetItem, BudgetSummary } from '@/lib/budget-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
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
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = summary.categoryBreakdown.map(c => ({
    name: c.name,
    value: c.budget,
    executed: c.executed,
    remaining: c.remaining,
  }));

  if (data.length === 0) return null;

  const handlePieClick = (_: any, idx: number) => {
    setSelectedCategory(data[idx]?.name || null);
  };

  const categoryItems = selectedCategory
    ? items.filter(i => i.category === selectedCategory)
    : [];

  const catSummary = selectedCategory
    ? summary.categoryBreakdown.find(c => c.name === selectedCategory)
    : null;

  const total = data.reduce((s, d) => s + d.value, 0);

  // Legend below chart
  const legendItems = data.map((d, i) => ({
    name: d.name,
    color: COLORS[i % COLORS.length],
    percent: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0',
    value: d.value,
  }));

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          fillOpacity={1}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="hsl(220,25%,20%)" fontSize={13} fontWeight="bold">
          {payload.name.length > 8 ? payload.name.slice(0, 8) + '…' : payload.name}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(220,15%,50%)" fontSize={11}>
          {(percent * 100).toFixed(1)}%
        </text>
      </g>
    );
  };

  return (
    <>
      <div className="glass-card rounded-xl p-4 sm:p-5 h-full flex flex-col">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">사업별 예산 현황</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">영역을 클릭하면 상세 정보를 볼 수 있습니다</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                dataKey="value"
                cursor="pointer"
                onClick={handlePieClick}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(undefined)}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                strokeWidth={2}
                stroke="hsl(0,0%,100%)"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate max-w-[120px]">{item.name}</span>
              <span className="text-muted-foreground">{item.percent}%</span>
            </div>
          ))}
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
