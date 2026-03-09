import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BudgetItem } from '@/lib/budget-types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onAdd: (item: BudgetItem) => void;
  existingGroups?: string[];
}

export default function AddBudgetForm({ onAdd, existingGroups = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    group: '', category: '', costType: '', description: '', budgetAmount: '', executedAmount: '', memo: '',
  });

  const budgetNum = Number((form.budgetAmount || '0').replace(/,/g, ''));
  const executedNum = Number((form.executedAmount || '0').replace(/,/g, ''));
  const remainingAmount = isNaN(budgetNum) || isNaN(executedNum) ? 0 : budgetNum - executedNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.budgetAmount) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('올바른 예산액을 입력해주세요.');
      return;
    }
    if (isNaN(executedNum) || executedNum < 0) {
      toast.error('올바른 집행액을 입력해주세요.');
      return;
    }
    const rate = budgetNum > 0 ? (executedNum / budgetNum) * 100 : 0;
    onAdd({
      id: crypto.randomUUID(),
      group: form.group,
      category: form.category,
      subCategory: form.group,
      costType: form.costType,
      description: form.description,
      budgetAmount: budgetNum,
      executedAmount: executedNum,
      executionRate: rate,
      remainingAmount: remainingAmount,
      settlementFund: 0,
      memo: form.memo,
    });
    setForm({ group: '', category: '', costType: '', description: '', budgetAmount: '', executedAmount: '', memo: '' });
    setOpen(false);
    toast.success('항목이 추가되었습니다.');
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> 예산 항목 추가
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground">새 예산 항목</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="그룹 (선택사항, 예: [초]학교자율과제운영)"
            value={form.group}
            onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
            list="group-suggestions"
          />
          {existingGroups.length > 0 && (
            <datalist id="group-suggestions">
              {existingGroups.map(g => <option key={g} value={g} />)}
            </datalist>
          )}
        </div>
        <Input placeholder="세부사업 *" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        <Input placeholder="비목" value={form.costType} onChange={e => setForm(f => ({ ...f, costType: e.target.value }))} />
        <Input placeholder="산출내역 *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="sm:col-span-2" />
        <Input placeholder="예산현액 *" value={form.budgetAmount} onChange={e => setForm(f => ({ ...f, budgetAmount: e.target.value }))} />
        <Input placeholder="집행액 (기본 0)" value={form.executedAmount} onChange={e => setForm(f => ({ ...f, executedAmount: e.target.value }))} />
        <Input placeholder="메모 (선택사항)" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} className="sm:col-span-2" />
      </div>
      <div className="text-sm text-muted-foreground">
        예산 잔액 (자동 계산): <span className="font-medium text-foreground">{remainingAmount.toLocaleString('ko-KR')}원</span>
      </div>
      <div className="flex gap-2">
        <Button type="submit">추가</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>취소</Button>
      </div>
    </form>
  );
}
