import * as XLSX from 'xlsx';
import { BudgetItem } from './budget-types';

export function parseExcelFile(file: File): Promise<BudgetItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        
        const items = parseRows(json as string[][]);
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseRows(rows: string[][]): BudgetItem[] {
  const items: BudgetItem[] = [];
  let currentCategory = '';
  let currentSubCategory = '';

  // Find header row index
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (row && row.some(cell => String(cell).includes('예산현액') || String(cell).includes('산출내역'))) {
      headerIdx = i;
      break;
    }
  }

  const startIdx = headerIdx >= 0 ? headerIdx + 1 : 2;

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const budgetAmt = parseNumber(row[2]);
    const executedAmt = parseNumber(row[3]);
    const execRate = parseNumber(row[4]);
    const remainingAmt = parseNumber(row[5]);
    const settlementFund = parseNumber(row[6]);

    // Skip summary row
    if (col0.includes('합 계') || col0.includes('합계')) continue;

    // Determine hierarchy
    if (col0 && !col1 && budgetAmt > 0) {
      // This could be a category or subcategory
      if (col0.startsWith('[') || col0.startsWith('［')) {
        currentSubCategory = col0;
      } else {
        currentCategory = col0;
        currentSubCategory = '';
      }
      continue;
    }

    if (col0 && col1) {
      // Detail item
      items.push({
        id: crypto.randomUUID(),
        category: currentCategory,
        subCategory: currentSubCategory,
        costType: col0,
        description: col1,
        budgetAmount: budgetAmt,
        executedAmount: executedAmt,
        executionRate: execRate,
        remainingAmount: remainingAmt,
        settlementFund: settlementFund,
      });
    }
  }

  return items;
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

export async function fetchGoogleSheet(url: string): Promise<BudgetItem[]> {
  // Convert Google Sheets URL to CSV export URL
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('올바른 구글 스프레드시트 링크가 아닙니다.');
  
  const sheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error('스프레드시트를 불러올 수 없습니다. 전체 공개 설정을 확인해주세요.');
  
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  
  return parseRows(json as string[][]);
}
