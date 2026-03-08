import { useMemo, useState } from 'react';
import { BudgetItem, GROUP_COLORS } from '@/lib/budget-types';
import { ChevronDown, ChevronRight } from 'lucide-react';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

interface Props {
  items: BudgetItem[];
}

export default function CompactBudgetView({ items }: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { groups, ungrouped, groupNames } = useMemo(() => {
    const groups = new Map<string, BudgetItem[]>();
    const ungrouped: BudgetItem[] = [];
    items.forEach(item => {
      if (item.group) {
        const list = groups.get(item.group) || [];
        list.push(item);
        groups.set(item.group, list);
      } else {
        ungrouped.push(item);
      }
    });
    return { groups, ungrouped, groupNames: Array.from(groups.keys()) };
  }, [items]);

  const toggleGroup = (name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const getColor = (name: string) => {
    const idx = groupNames.indexOf(name);
    return GROUP_COLORS[idx % GROUP_COLORS.length];
  };

  const renderCard = (item: BudgetItem) => {
    const rateColor = item.executionRate > 80
      ? 'bg-destructive/10 text-destructive'
      : item.executionRate > 50
      ? 'bg-accent/20 text-accent-foreground'
      : 'bg-secondary text-secondary-foreground';

    return (
      <div key={item.id} className="glass-card rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-foreground leading-snug truncate" title={item.description}>
          {item.description}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">예산현액</span>
          <span className="text-right font-medium text-foreground">{formatKRW(item.budgetAmount)}</span>
          <span className="text-muted-foreground">집행액</span>
          <span className="text-right font-medium text-foreground">{formatKRW(item.executedAmount)}</span>
          <span className="text-muted-foreground">잔액</span>
          <span className="text-right font-medium text-foreground">{formatKRW(item.remainingAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">집행률</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(item.executionRate, 100)}%` }}
              />
            </div>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${rateColor}`}>
              {item.executionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([groupName, groupItems]) => {
        const color = getColor(groupName);
        const isCollapsed = collapsedGroups.has(groupName);
        const cleanName = groupName.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '');
        const totalBudget = groupItems.reduce((s, i) => s + i.budgetAmount, 0);
        const totalExecuted = groupItems.reduce((s, i) => s + i.executedAmount, 0);
        const rate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

        return (
          <div key={groupName} className="rounded-xl overflow-hidden border" style={{ borderColor: `hsl(${color.border})` }}>
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:opacity-90"
              style={{ backgroundColor: `hsl(${color.bg})`, color: `hsl(${color.text})` }}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="font-semibold text-sm">{cleanName}</span>
                <span className="text-xs opacity-70">({groupItems.length}건)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>예산 <strong>{formatKRW(totalBudget)}</strong></span>
                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                  rate > 80 ? 'bg-destructive/10 text-destructive' :
                  rate > 50 ? 'bg-accent/20 text-accent-foreground' :
                  'bg-secondary text-secondary-foreground'
                }`}>{rate.toFixed(1)}%</span>
              </div>
            </button>
            {!isCollapsed && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ backgroundColor: `hsl(${color.bg} / 0.3)` }}>
                {groupItems.map(renderCard)}
              </div>
            )}
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div>
          {groups.size > 0 && (
            <p className="text-sm font-medium text-muted-foreground mb-2">그룹 미지정 ({ungrouped.length}건)</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ungrouped.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
}
