import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BudgetItem } from '@/lib/budget-types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onAdd: (item: BudgetItem) => void;
}

export default function AddBudgetForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: '', costType: '', description: '', budgetAmount: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.budgetAmount) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }
    const amount = Number(form.budgetAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }
    onAdd({
      id: crypto.randomUUID(),
      category: form.category,
      subCategory: '',
      costType: form.costType,
      description: form.description,
      budgetAmount: amount,
      executedAmount: 0,
      executionRate: 0,
      remainingAmount: amount,
      settlementFund: 0,
    });
    setForm({ category: '', costType: '', description: '', budgetAmount: '' });
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
        <Input placeholder="세부사업 *" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        <Input placeholder="비목" value={form.costType} onChange={e => setForm(f => ({ ...f, costType: e.target.value }))} />
        <Input placeholder="산출내역 *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Input placeholder="예산액 *" value={form.budgetAmount} onChange={e => setForm(f => ({ ...f, budgetAmount: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">추가</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>취소</Button>
      </div>
    </form>
  );
}
