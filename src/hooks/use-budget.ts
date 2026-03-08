import { useState, useEffect, useCallback, useRef } from 'react';
import { BudgetItem, BudgetSummary, ThemeColor, THEME_MAP } from '@/lib/budget-types';
import * as store from '@/lib/budget-store';
import * as gas from '@/lib/google-apps-script';
import { toast } from 'sonner';

const MAX_HISTORY = 30;

export function useBudget() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [theme, setThemeState] = useState<ThemeColor>('blue');
  const [dataMode, setDataModeState] = useState<gas.DataMode>('local');
  const [syncing, setSyncing] = useState(false);
  const historyRef = useRef<BudgetItem[][]>([]);
  const futureRef = useRef<BudgetItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const data = store.getBudgetData();
    setItems(data);
    setThemeState(store.getTheme());
    setDataModeState(gas.getDataMode());
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

  // 온라인 동기화 헬퍼
  const syncToOnline = useCallback(async (newItems: BudgetItem[]) => {
    const mode = gas.getDataMode();
    const scriptUrl = gas.getScriptUrl();
    if (mode === 'online' && scriptUrl) {
      try {
        setSyncing(true);
        await gas.syncOnlineData(scriptUrl, newItems);
      } catch (err) {
        console.error('동기화 실패:', err);
        toast.error('온라인 동기화에 실패했습니다. 로컬에는 저장되었습니다.');
      } finally {
        setSyncing(false);
      }
    }
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

  const setDataMode = useCallback((mode: gas.DataMode) => {
    setDataModeState(mode);
    gas.setDataMode(mode);
  }, []);

  const loadItems = useCallback((newItems: BudgetItem[]) => {
    pushHistory(items);
    applyItems(newItems);
    syncToOnline(newItems);
  }, [items, pushHistory, applyItems, syncToOnline]);

  const addItem = useCallback((item: BudgetItem) => {
    pushHistory(items);
    store.addBudgetItem(item);
    const newItems = store.getBudgetData();
    setItems(newItems);
    syncToOnline(newItems);
  }, [items, pushHistory, syncToOnline]);

  const updateItem = useCallback((id: string, updated: Partial<BudgetItem>) => {
    pushHistory(items);
    store.updateBudgetItem(id, updated);
    const newItems = store.getBudgetData();
    setItems(newItems);
    
    // 온라인: 개별 항목 업데이트
    const mode = gas.getDataMode();
    const scriptUrl = gas.getScriptUrl();
    if (mode === 'online' && scriptUrl) {
      const fullItem = newItems.find(i => i.id === id);
      if (fullItem) {
        gas.updateOnlineItem(scriptUrl, fullItem).catch(() => {
          toast.error('온라인 동기화에 실패했습니다.');
        });
      }
    }
  }, [items, pushHistory]);

  const deleteItem = useCallback((id: string) => {
    pushHistory(items);
    store.deleteBudgetItem(id);
    const newItems = store.getBudgetData();
    setItems(newItems);
    
    const mode = gas.getDataMode();
    const scriptUrl = gas.getScriptUrl();
    if (mode === 'online' && scriptUrl) {
      gas.deleteOnlineItem(scriptUrl, id).catch(() => {
        toast.error('온라인 동기화에 실패했습니다.');
      });
    }
  }, [items, pushHistory]);

  const deleteGroup = useCallback((groupName: string) => {
    pushHistory(items);
    const newItems = items.filter(item => item.group !== groupName);
    applyItems(newItems);
    syncToOnline(newItems);
  }, [items, pushHistory, applyItems, syncToOnline]);

  // 온라인에서 데이터 새로고침
  const refreshFromOnline = useCallback(async () => {
    const scriptUrl = gas.getScriptUrl();
    if (!scriptUrl) return;
    
    setSyncing(true);
    try {
      const onlineItems = await gas.fetchOnlineData(scriptUrl);
      pushHistory(items);
      applyItems(onlineItems);
      toast.success('온라인 데이터를 불러왔습니다.');
    } catch (err) {
      toast.error('온라인 데이터 불러오기에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  }, [items, pushHistory, applyItems]);

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

  return {
    items, theme, setTheme, loadItems, addItem, updateItem, deleteItem, deleteGroup,
    summary, undo, redo, canUndo, canRedo,
    dataMode, setDataMode, syncing, refreshFromOnline,
  };
}
