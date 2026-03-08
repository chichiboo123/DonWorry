import { useState, useEffect, useCallback } from 'react';
import { BudgetItem, BudgetSummary, ThemeColor, THEME_MAP } from '@/lib/budget-types';
import * as store from '@/lib/budget-store';

export function useBudget() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [theme, setThemeState] = useState<ThemeColor>('blue');

  useEffect(() => {
    setItems(store.getBudgetData());
    setThemeState(store.getTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    Object.values(THEME_MAP).forEach(t => {
      if (t.className) root.classList.remove(t.className);
    });
    // Add current
    const current = THEME_MAP[theme];
    if (current.className) root.classList.add(current.className);
  }, [theme]);

  const setTheme = useCallback((t: ThemeColor) => {
    setThemeState(t);
    store.setTheme(t);
  }, []);

  const loadItems = useCallback((newItems: BudgetItem[]) => {
    store.saveBudgetData(newItems);
    setItems(newItems);
  }, []);

  const addItem = useCallback((item: BudgetItem) => {
    store.addBudgetItem(item);
    setItems(store.getBudgetData());
  }, []);

  const updateItem = useCallback((id: string, updated: Partial<BudgetItem>) => {
    store.updateBudgetItem(id, updated);
    setItems(store.getBudgetData());
  }, []);

  const deleteItem = useCallback((id: string) => {
    store.deleteBudgetItem(id);
    setItems(store.getBudgetData());
  }, []);

  const summary: BudgetSummary = {
    totalBudget: items.reduce((s, i) => s + i.budgetAmount, 0),
    totalExecuted: items.reduce((s, i) => s + i.executedAmount, 0),
    totalRemaining: items.reduce((s, i) => s + i.remainingAmount, 0),
    executionRate: 0,
    categoryBreakdown: [],
  };
  summary.executionRate = summary.totalBudget > 0 ? (summary.totalExecuted / summary.totalBudget) * 100 : 0;

  // Category breakdown
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

  return { items, theme, setTheme, loadItems, addItem, updateItem, deleteItem, summary };
}
