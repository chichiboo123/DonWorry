export interface BudgetItem {
  id: string;
  group: string;            // 그룹 (예: [초]학교자율과제운영)
  category: string;         // 세부사업
  subCategory: string;      // 세부항목
  costType: string;         // 원가통계비목
  description: string;      // 산출내역
  budgetAmount: number;     // 예산현액
  executedAmount: number;   // 원인행위액
  executionRate: number;    // 집행률
  remainingAmount: number;  // 예산잔액
  settlementFund: number;   // 정산재원
  memo: string;             // 메모
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

// Group color palette for visual distinction
export const GROUP_COLORS = [
  { bg: '210 60% 95%', border: '210 60% 80%', text: '210 60% 35%' },
  { bg: '150 45% 95%', border: '150 45% 78%', text: '150 45% 30%' },
  { bg: '42 75% 95%', border: '42 75% 78%', text: '42 75% 30%' },
  { bg: '340 55% 95%', border: '340 55% 82%', text: '340 55% 30%' },
  { bg: '280 40% 95%', border: '280 40% 80%', text: '280 40% 30%' },
  { bg: '20 70% 95%', border: '20 70% 80%', text: '20 70% 30%' },
  { bg: '180 45% 95%', border: '180 45% 78%', text: '180 45% 30%' },
  { bg: '60 60% 95%', border: '60 60% 78%', text: '60 60% 30%' },
];
