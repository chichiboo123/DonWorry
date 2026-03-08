import { useState, useEffect, useCallback, useRef } from 'react';
import { BudgetItem, BudgetSummary, ThemeColor, THEME_MAP } from '@/lib/budget-types';
import * as store from '@/lib/budget-store';
import { toast } from 'sonner';

const MAX_HISTORY = 30;

export function useBudget() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [theme, setThemeState] = useState<ThemeColor>('blue');
  const historyRef = useRef<BudgetItem[][]>([]);
  const futureRef = useRef<BudgetItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const data = store.getBudgetData();
    setItems(data);
    setThemeState(store.getTheme());
    historyRef.current = [];
    futureRef.current = [];
  }, []);

  const pushHistory = useCallback((currentItems: BudgetItem[]) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), currentItems];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const applyItems = useCallback((newItems: BudgetItem[]) => {
    store.saveBudgetData(newItems);
    setItems(newItems);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    Object.values(THEME_MAP).forEach(t => {
      if (t.className) root.classList.remove(t.className);
    });
    const current = THEME_MAP[theme];
    if (current.className) root.classList.add(current.className);
  }, [theme]);

  const setTheme = useCallback((t: ThemeColor) => {
    setThemeState(t);
    store.setTheme(t);
  }, []);

  const loadItems = useCallback((newItems: BudgetItem[]) => {
    pushHistory(items);
    applyItems(newItems);
  }, [items, pushHistory, applyItems]);

  const addItem = useCallback((item: BudgetItem) => {
    pushHistory(items);
    store.addBudgetItem(item);
    setItems(store.getBudgetData());
  }, [items, pushHistory]);

  const updateItem = useCallback((id: string, updated: Partial<BudgetItem>) => {
    pushHistory(items);
    store.updateBudgetItem(id, updated);
    setItems(store.getBudgetData());
  }, [items, pushHistory]);

  const deleteItem = useCallback((id: string) => {
    pushHistory(items);
    store.deleteBudgetItem(id);
    setItems(store.getBudgetData());
  }, [items, pushHistory]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    futureRef.current.push([...items]);
    applyItems(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
    toast('되돌리기 완료', { description: '이전 상태로 복원되었습니다.' });
  }, [items, applyItems]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push([...items]);
    applyItems(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    toast('다시 실행 완료', { description: '변경 사항이 다시 적용되었습니다.' });
  }, [items, applyItems]);

  const summary: BudgetSummary = {
    totalBudget: items.reduce((s, i) => s + i.budgetAmount, 0),
    totalExecuted: items.reduce((s, i) => s + i.executedAmount, 0),
    totalRemaining: items.reduce((s, i) => s + i.remainingAmount, 0),
    executionRate: 0,
    categoryBreakdown: [],
  };
  summary.executionRate = summary.totalBudget > 0 ? (summary.totalExecuted / summary.totalBudget) * 100 : 0;

  const catMap = new Map<string, { budget: number; executed: number; remaining: number }>();
  items.forEach(item => {
    const cat = item.category || '기타';
    const prev = catMap.get(cat) || { budget: 0, executed: 0, remaining: 0 };
    catMap.set(cat, {
      budget: prev.budget + item.budgetAmount,
      executed: prev.executed + item.executedAmount,
      remaining: prev.remaining + item.remainingAmount,
    });
  });
  summary.categoryBreakdown = Array.from(catMap.entries()).map(([name, data]) => ({ name, ...data }));

  return { items, theme, setTheme, loadItems, addItem, updateItem, deleteItem, summary, undo, redo, canUndo, canRedo };
}
