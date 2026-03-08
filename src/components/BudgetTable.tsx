import { useState, useMemo } from 'react';
import { BudgetItem, GROUP_COLORS } from '@/lib/budget-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Check, X, Plus, ChevronDown, ChevronRight, Ungroup } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  items: BudgetItem[];
  editable?: boolean;
  onUpdate?: (id: string, updated: Partial<BudgetItem>) => void;
  onDelete?: (id: string) => void;
}

interface EditForm {
  category: string;
  costType: string;
  description: string;
  budgetAmount: string;
  executedAmount: string;
}

export default function BudgetTable({ items, editable = false, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ category: '', costType: '', description: '', budgetAmount: '', executedAmount: '' });
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group items
  const groupedItems = useMemo(() => {
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
    return { groups, ungrouped };
  }, [items]);

  const groupNames = useMemo(() => Array.from(groupedItems.groups.keys()), [groupedItems]);

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
        아직 데이터가 없습니다. 엑셀 파일을 업로드하거나 직접 항목을 추가해주세요.
      </div>
    );
  }

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      costType: item.costType,
      description: item.description,
      budgetAmount: String(item.budgetAmount),
      executedAmount: String(item.executedAmount),
    });
    setAddingId(null);
  };

  const saveEdit = (item: BudgetItem) => {
    const budget = Number(editForm.budgetAmount.replace(/,/g, ''));
    const executed = Number(editForm.executedAmount.replace(/,/g, ''));
    if (isNaN(budget) || budget < 0) { toast.error('올바른 예산액을 입력해주세요.'); return; }
    if (isNaN(executed) || executed < 0) { toast.error('올바른 집행액을 입력해주세요.'); return; }
    const remaining = budget - executed;
    const rate = budget > 0 ? (executed / budget) * 100 : 0;
    onUpdate?.(item.id, {
      category: editForm.category,
      costType: editForm.costType,
      description: editForm.description,
      budgetAmount: budget,
      executedAmount: executed,
      remainingAmount: remaining,
      executionRate: rate,
    });
    setEditingId(null);
    toast.success('항목이 수정되었습니다.');
  };

  const startAddExecution = (item: BudgetItem) => {
    setAddingId(item.id);
    setAddAmount('');
    setEditingId(null);
  };

  const saveAddExecution = (item: BudgetItem) => {
    const amount = Number(addAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) { toast.error('올바른 금액을 입력해주세요.'); return; }
    const newExecuted = item.executedAmount + amount;
    const remaining = item.budgetAmount - newExecuted;
    const rate = item.budgetAmount > 0 ? (newExecuted / item.budgetAmount) * 100 : 0;
    onUpdate?.(item.id, {
      executedAmount: newExecuted,
      remainingAmount: remaining,
      executionRate: rate,
    });
    setAddingId(null);
    toast.success(`${formatKRW(amount)}원이 집행 반영되었습니다.`);
  };

  const handleDelete = (item: BudgetItem) => {
    if (confirm(`"${item.description}" 항목을 삭제하시겠습니까?`)) {
      onDelete?.(item.id);
      toast.success('항목이 삭제되었습니다.');
    }
  };

  const handleRemoveFromGroup = (item: BudgetItem) => {
    onUpdate?.(item.id, { group: '', subCategory: '' });
    toast.success('그룹에서 해제되었습니다.');
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const getGroupColor = (groupName: string) => {
    const idx = groupNames.indexOf(groupName);
    return GROUP_COLORS[idx % GROUP_COLORS.length];
  };

  const getGroupSummary = (groupItems: BudgetItem[]) => {
    const budget = groupItems.reduce((s, i) => s + i.budgetAmount, 0);
    const executed = groupItems.reduce((s, i) => s + i.executedAmount, 0);
    const remaining = budget - executed;
    const rate = budget > 0 ? (executed / budget) * 100 : 0;
    return { budget, executed, remaining, rate };
  };

  const renderRow = (item: BudgetItem, colorStyle?: { bg: string }) => {
    const isEditing = editingId === item.id;
    const isAdding = addingId === item.id;

    if (isEditing) {
      return (
        <TableRow key={item.id} className="bg-primary/5">
          <TableCell>
            <Input className="h-7 text-sm" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
          </TableCell>
          <TableCell>
            <Input className="h-7 text-sm" value={editForm.costType} onChange={e => setEditForm(f => ({ ...f, costType: e.target.value }))} />
          </TableCell>
          <TableCell>
            <Input className="h-7 text-sm" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
          </TableCell>
          <TableCell>
            <Input className="h-7 text-sm text-right" value={editForm.budgetAmount} onChange={e => setEditForm(f => ({ ...f, budgetAmount: e.target.value }))} />
          </TableCell>
          <TableCell>
            <Input className="h-7 text-sm text-right" value={editForm.executedAmount} onChange={e => setEditForm(f => ({ ...f, executedAmount: e.target.value }))} />
          </TableCell>
          <TableCell className="text-right text-sm text-muted-foreground">자동</TableCell>
          <TableCell className="text-right text-sm text-muted-foreground">자동</TableCell>
          <TableCell>
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(item)}>
                <Check className="w-3.5 h-3.5 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow key={item.id} style={colorStyle ? { backgroundColor: `hsl(${colorStyle.bg})` } : undefined}>
        <TableCell className="text-sm">{item.category}</TableCell>
        <TableCell className="text-sm">{item.costType}</TableCell>
        <TableCell className="text-sm">{item.description}</TableCell>
        <TableCell className="text-right text-sm font-medium">{formatKRW(item.budgetAmount)}</TableCell>
        <TableCell className="text-right text-sm">
          {isAdding ? (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatKRW(item.executedAmount)} +</span>
              <Input
                className="w-24 h-7 text-right text-sm"
                placeholder="추가 금액"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveAddExecution(item)}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveAddExecution(item)}>
                <Check className="w-3.5 h-3.5 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingId(null)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <span
              className={editable ? 'cursor-pointer hover:text-primary underline decoration-dotted underline-offset-2' : ''}
              onClick={() => editable && startAddExecution(item)}
              title={editable ? '클릭하여 집행액 추가' : ''}
            >
              {formatKRW(item.executedAmount)}
            </span>
          )}
        </TableCell>
        <TableCell className="text-right text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            item.executionRate > 80 ? 'bg-destructive/10 text-destructive' :
            item.executionRate > 50 ? 'bg-accent/20 text-accent-foreground' :
            'bg-secondary text-secondary-foreground'
          }`}>
            {item.executionRate.toFixed(1)}%
          </span>
        </TableCell>
        <TableCell className="text-right text-sm font-medium">{formatKRW(item.remainingAmount)}</TableCell>
        {editable && (
          <TableCell>
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)} title="전체 수정">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              {item.group && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveFromGroup(item)} title="그룹 해제">
                  <Ungroup className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)} title="삭제">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const tableHeader = (
    <TableHeader>
      <TableRow className="bg-primary/5">
        <TableHead className="font-semibold text-foreground">세부사업</TableHead>
        <TableHead className="font-semibold text-foreground">비목</TableHead>
        <TableHead className="font-semibold text-foreground">산출내역</TableHead>
        <TableHead className="text-right font-semibold text-foreground">예산현액</TableHead>
        <TableHead className="text-right font-semibold text-foreground">집행액</TableHead>
        <TableHead className="text-right font-semibold text-foreground">집행률</TableHead>
        <TableHead className="text-right font-semibold text-foreground">잔액</TableHead>
        {editable && <TableHead className="w-28"></TableHead>}
      </TableRow>
    </TableHeader>
  );

  return (
    <div className="space-y-4">
      {/* Grouped items */}
      {Array.from(groupedItems.groups.entries()).map(([groupName, groupItems]) => {
        const color = getGroupColor(groupName);
        const summary = getGroupSummary(groupItems);
        const isCollapsed = collapsedGroups.has(groupName);
        const cleanName = groupName.replace(/^\[초\]/, '').replace(/^\[초］/, '').replace(/^［초\]/, '').replace(/^［초］/, '');

        return (
          <div key={groupName} className="rounded-xl overflow-hidden border" style={{ borderColor: `hsl(${color.border})` }}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:opacity-90"
              style={{ backgroundColor: `hsl(${color.bg})`, color: `hsl(${color.text})` }}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="font-semibold">{cleanName}</span>
                <span className="text-xs opacity-70">({groupItems.length}건)</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>예산 <strong>{formatKRW(summary.budget)}</strong></span>
                <span>집행 <strong>{formatKRW(summary.executed)}</strong></span>
                <span>잔액 <strong>{formatKRW(summary.remaining)}</strong></span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  summary.rate > 80 ? 'bg-destructive/10 text-destructive' :
                  summary.rate > 50 ? 'bg-accent/20 text-accent-foreground' :
                  'bg-secondary text-secondary-foreground'
                }`}>
                  {summary.rate.toFixed(1)}%
                </span>
              </div>
            </button>

            {/* Group content */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <Table>
                  {tableHeader}
                  <TableBody>
                    {groupItems.map(item => renderRow(item, { bg: color.bg }))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped items */}
      {groupedItems.ungrouped.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          {groupedItems.groups.size > 0 && (
            <div className="px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
              그룹 미지정 항목 ({groupedItems.ungrouped.length}건)
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              {tableHeader}
              <TableBody>
                {groupedItems.ungrouped.map(item => renderRow(item))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
