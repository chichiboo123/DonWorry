import { useState } from 'react';
import { BudgetItem } from '@/lib/budget-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  items: BudgetItem[];
  editable?: boolean;
  onUpdate?: (id: string, updated: Partial<BudgetItem>) => void;
  onDelete?: (id: string) => void;
}

export default function BudgetTable({ items, editable = false, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
        아직 데이터가 없습니다. 엑셀 파일을 업로드하거나 직접 항목을 추가해주세요.
      </div>
    );
  }

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditValue(String(item.executedAmount));
  };

  const saveEdit = (item: BudgetItem) => {
    const newExecuted = Number(editValue.replace(/,/g, ''));
    if (isNaN(newExecuted) || newExecuted < 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }
    const remaining = item.budgetAmount - newExecuted;
    const rate = item.budgetAmount > 0 ? (newExecuted / item.budgetAmount) * 100 : 0;
    onUpdate?.(item.id, {
      executedAmount: newExecuted,
      remainingAmount: remaining,
      executionRate: rate,
    });
    setEditingId(null);
    toast.success('집행액이 반영되었습니다.');
  };

  const handleDelete = (item: BudgetItem) => {
    if (confirm(`"${item.description}" 항목을 삭제하시겠습니까?`)) {
      onDelete?.(item.id);
      toast.success('항목이 삭제되었습니다.');
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="font-semibold text-foreground">세부사업</TableHead>
              <TableHead className="font-semibold text-foreground">비목</TableHead>
              <TableHead className="font-semibold text-foreground">산출내역</TableHead>
              <TableHead className="text-right font-semibold text-foreground">예산현액</TableHead>
              <TableHead className="text-right font-semibold text-foreground">집행액</TableHead>
              <TableHead className="text-right font-semibold text-foreground">집행률</TableHead>
              <TableHead className="text-right font-semibold text-foreground">잔액</TableHead>
              {editable && <TableHead className="w-20"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-primary/3">
                <TableCell className="text-sm">{item.category}</TableCell>
                <TableCell className="text-sm">{item.costType}</TableCell>
                <TableCell className="text-sm">{item.description}</TableCell>
                <TableCell className="text-right text-sm font-medium">{formatKRW(item.budgetAmount)}</TableCell>
                <TableCell className="text-right text-sm">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Input
                        className="w-28 h-7 text-right text-sm"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(item)}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(item)}>
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={editable ? 'cursor-pointer hover:text-primary underline decoration-dotted underline-offset-2' : ''}
                      onClick={() => editable && startEdit(item)}
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
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
