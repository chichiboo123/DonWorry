export interface BudgetItem {
  id: string;
  category: string;       // 세부사업
  subCategory: string;    // 세부항목
  costType: string;       // 원가통계비목
  description: string;    // 산출내역
  budgetAmount: number;   // 예산현액
  executedAmount: number; // 원인행위액
  executionRate: number;  // 집행률
  remainingAmount: number; // 예산잔액
  settlementFund: number; // 정산재원
}

export interface BudgetSummary {
  totalBudget: number;
  totalExecuted: number;
  totalRemaining: number;
  executionRate: number;
  categoryBreakdown: { name: string; budget: number; executed: number; remaining: number }[];
}

export type ThemeColor = 'blue' | 'green' | 'yellow' | 'pink';

export const THEME_MAP: Record<ThemeColor, { label: string; className: string; color: string }> = {
  blue: { label: '파스텔 블루', className: '', color: '#7BAFD4' },
  green: { label: '파스텔 그린', className: 'theme-green', color: '#7BC8A4' },
  yellow: { label: '파스텔 옐로우', className: 'theme-yellow', color: '#D4A843' },
  pink: { label: '파스텔 핑크', className: 'theme-pink', color: '#D48BA0' },
};
