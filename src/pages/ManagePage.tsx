import { useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import FileUploader from '@/components/FileUploader';
import AddBudgetForm from '@/components/AddBudgetForm';
import BudgetTable from '@/components/BudgetTable';
import { useBudget } from '@/hooks/use-budget';
import { Button } from '@/components/ui/button';
import { Trash2, Undo2, Redo2, FolderUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ManagePage() {
  const budget = useBudget();
  const [importOpen, setImportOpen] = useState(false);

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
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                        <FolderUp className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>데이터 불러오기</TooltipContent>
                </Tooltip>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>데이터 불러오기</DialogTitle>
                  </DialogHeader>
                  <FileUploader onDataLoaded={(items) => { budget.loadItems(items); setImportOpen(false); }} />
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={budget.undo} disabled={!budget.canUndo} className="h-9 w-9 rounded-full">
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>되돌리기</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={budget.redo} disabled={!budget.canRedo} className="h-9 w-9 rounded-full">
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>다시 실행</TooltipContent>
              </Tooltip>
              {budget.items.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleClearAll} className="h-9 w-9 rounded-full text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>전체 삭제</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>

        <AddBudgetForm onAdd={budget.addItem} existingGroups={existingGroups} />

        <div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground mb-3">현재 데이터 ({budget.items.length}건)</h2>
          <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} onDeleteGroup={budget.deleteGroup} onReorder={budget.reorderItems} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
