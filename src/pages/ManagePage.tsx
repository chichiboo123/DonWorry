import AppHeader from '@/components/AppHeader';
import FileUploader from '@/components/FileUploader';
import AddBudgetForm from '@/components/AddBudgetForm';
import BudgetTable from '@/components/BudgetTable';
import { useBudget } from '@/hooks/use-budget';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePage() {
  const budget = useBudget();

  const handleClearAll = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      budget.loadItems([]);
      toast.success('모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">예산 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">데이터를 업로드하거나 항목을 추가/수정하세요</p>
          </div>
          {budget.items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-1 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> 전체 삭제
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUploader onDataLoaded={budget.loadItems} />
          <AddBudgetForm onAdd={budget.addItem} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">현재 데이터 ({budget.items.length}건)</h2>
          <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} />
        </div>
      </main>
    </div>
  );
}
