import { BudgetItem, ThemeColor } from './budget-types';

const STORAGE_KEYS = {
  BUDGET_DATA: 'donworry_budget_data',
  THEME: 'donworry_theme',
  SHEET_URL: 'donworry_sheet_url',
  SETUP_DONE: 'donworry_setup_done',
};

export function getBudgetData(): BudgetItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.BUDGET_DATA);
  return data ? JSON.parse(data) : [];
}

export function saveBudgetData(items: BudgetItem[]) {
  localStorage.setItem(STORAGE_KEYS.BUDGET_DATA, JSON.stringify(items));
}

export function addBudgetItem(item: BudgetItem) {
  const items = getBudgetData();
  items.push(item);
  saveBudgetData(items);
}

export function updateBudgetItem(id: string, updated: Partial<BudgetItem>) {
  const items = getBudgetData().map(item => item.id === id ? { ...item, ...updated } : item);
  saveBudgetData(items);
}

export function deleteBudgetItem(id: string) {
  saveBudgetData(getBudgetData().filter(item => item.id !== id));
}

export function getTheme(): ThemeColor {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeColor) || 'blue';
}

export function setTheme(theme: ThemeColor) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function getSheetUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '';
}

export function setSheetUrl(url: string) {
  localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
}

export function isSetupDone(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SETUP_DONE) === 'true';
}

export function markSetupDone() {
  localStorage.setItem(STORAGE_KEYS.SETUP_DONE, 'true');
}

export function clearSetup() {
  localStorage.removeItem(STORAGE_KEYS.SETUP_DONE);
}
