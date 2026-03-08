import { BudgetItem } from './budget-types';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY_SCRIPT_URL = 'donworry_script_url';
const STORAGE_KEY_MODE = 'donworry_mode';

export type DataMode = 'local' | 'online';

export function getDataMode(): DataMode {
  return (localStorage.getItem(STORAGE_KEY_MODE) as DataMode) || 'local';
}

export function setDataMode(mode: DataMode) {
  localStorage.setItem(STORAGE_KEY_MODE, mode);
}

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY_SCRIPT_URL) || '';
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEY_SCRIPT_URL, url);
}

/** Edge Function 프록시를 통해 GAS 호출 */
async function callGasProxy(scriptUrl: string, action: string, payload?: object): Promise<any> {
  const { data, error } = await supabase.functions.invoke('gas-proxy', {
    body: { scriptUrl, action, payload },
  });

  if (error) {
    console.error('GAS proxy 오류:', error);
    throw new Error(error.message || 'GAS 프록시 호출 실패');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/** 온라인: 스프레드시트에서 데이터 읽기 */
export async function fetchOnlineData(scriptUrl: string): Promise<BudgetItem[]> {
  const data = await callGasProxy(scriptUrl, 'read');
  return data.items || [];
}

/** 온라인: 전체 데이터 저장 (동기화) */
export async function syncOnlineData(scriptUrl: string, items: BudgetItem[]): Promise<void> {
  await callGasProxy(scriptUrl, 'sync', { action: 'sync', items });
}

/** 온라인: 항목 수정 */
export async function updateOnlineItem(scriptUrl: string, item: BudgetItem): Promise<void> {
  await callGasProxy(scriptUrl, 'update', { action: 'update', item });
}

/** 온라인: 항목 삭제 */
export async function deleteOnlineItem(scriptUrl: string, id: string): Promise<void> {
  await callGasProxy(scriptUrl, 'delete', { action: 'delete', id });
}
