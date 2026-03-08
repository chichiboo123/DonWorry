import { BudgetItem } from './budget-types';

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

/** 온라인: 스프레드시트에서 데이터 읽기 */
export async function fetchOnlineData(scriptUrl: string): Promise<BudgetItem[]> {
  const res = await fetch(`${scriptUrl}?action=read`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

/** GAS POST 헬퍼 (preflight 방지) */
async function gasPost(scriptUrl: string, payload: object): Promise<Response> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`요청 실패: ${res.status}`);
  return res;
}

/** 온라인: 전체 데이터 저장 (동기화) */
export async function syncOnlineData(scriptUrl: string, items: BudgetItem[]): Promise<void> {
  await gasPost(scriptUrl, { action: 'sync', items });
}

/** 온라인: 항목 수정 */
export async function updateOnlineItem(scriptUrl: string, item: BudgetItem): Promise<void> {
  await gasPost(scriptUrl, { action: 'update', item });
}

/** 온라인: 항목 삭제 */
export async function deleteOnlineItem(scriptUrl: string, id: string): Promise<void> {
  await gasPost(scriptUrl, { action: 'delete', id });
}
