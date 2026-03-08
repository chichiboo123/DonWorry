import { BudgetItem } from '@/lib/budget-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  items: BudgetItem[];
}

export default function BudgetTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
        아직 데이터가 없습니다. 엑셀 파일을 업로드하거나 직접 항목을 추가해주세요.
      </div>
    );
  }

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-primary/3">
                <TableCell className="text-sm">{item.category}</TableCell>
                <TableCell className="text-sm">{item.costType}</TableCell>
                <TableCell className="text-sm">{item.description}</TableCell>
                <TableCell className="text-right text-sm font-medium">{formatKRW(item.budgetAmount)}</TableCell>
                <TableCell className="text-right text-sm">{formatKRW(item.executedAmount)}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
