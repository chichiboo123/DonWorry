import { useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import FileUploader from '@/components/FileUploader';
import AddBudgetForm from '@/components/AddBudgetForm';
import BudgetTable from '@/components/BudgetTable';
import { useBudget } from '@/hooks/use-budget';
import { Button } from '@/components/ui/button';
import { Trash2, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePage() {
  const budget = useBudget();

  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    budget.items.forEach(item => { if (item.group) groups.add(item.group); });
    return Array.from(groups);
  }, [budget.items]);

  const handleClearAll = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      budget.loadItems([]);
      toast.success('모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">예산 관리</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">데이터를 업로드하거나 항목을 추가/수정하세요</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={budget.undo} disabled={!budget.canUndo} className="gap-1 text-xs sm:text-sm h-8" title="되돌리기">
              <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">되돌리기</span>
            </Button>
            <Button variant="outline" size="sm" onClick={budget.redo} disabled={!budget.canRedo} className="gap-1 text-xs sm:text-sm h-8" title="다시 실행">
              <Redo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">다시 실행</span>
            </Button>
            {budget.items.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-1 text-destructive hover:text-destructive text-xs sm:text-sm h-8">
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">전체 삭제</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <FileUploader onDataLoaded={budget.loadItems} />
          <AddBudgetForm onAdd={budget.addItem} existingGroups={existingGroups} />
        </div>

        <div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground mb-3">현재 데이터 ({budget.items.length}건)</h2>
          <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} onDeleteGroup={budget.deleteGroup} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
