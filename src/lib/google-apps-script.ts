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

/** GAS fetch 헬퍼 - 리다이렉트 수동 처리 */
async function gasFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, {
      ...options,
      redirect: 'follow',
    });
    
    if (!res.ok) {
      console.error('GAS 응답 오류:', res.status, res.statusText);
      throw new Error(`서버 오류: ${res.status}`);
    }
    
    const text = await res.text();
    console.log('GAS 응답:', text.substring(0, 200));
    
    try {
      return JSON.parse(text);
    } catch {
      console.error('JSON 파싱 실패:', text.substring(0, 500));
      throw new Error('응답을 파싱할 수 없습니다.');
    }
  } catch (err: any) {
    console.error('GAS fetch 실패:', err.message, 'URL:', url.substring(0, 80));
    
    // CORS/네트워크 오류시 no-cors 모드로 재시도 (POST만)
    if (err.message === 'Failed to fetch' && options?.method === 'POST') {
      console.log('no-cors 모드로 POST 재시도...');
      await fetch(url, {
        ...options,
        mode: 'no-cors',
        redirect: 'follow',
      });
      // no-cors는 응답을 읽을 수 없지만 요청은 전달됨
      return { success: true, noCorsFallback: true };
    }
    
    throw err;
  }
}

/** 온라인: 스프레드시트에서 데이터 읽기 */
export async function fetchOnlineData(scriptUrl: string): Promise<BudgetItem[]> {
  const data = await gasFetch(`${scriptUrl}?action=read`);
  return data.items || [];
}

/** 온라인: 전체 데이터 저장 (동기화) */
export async function syncOnlineData(scriptUrl: string, items: BudgetItem[]): Promise<void> {
  await gasFetch(scriptUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'sync', items }),
  });
}

/** 온라인: 항목 수정 */
export async function updateOnlineItem(scriptUrl: string, item: BudgetItem): Promise<void> {
  await gasFetch(scriptUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'update', item }),
  });
}

/** 온라인: 항목 삭제 */
export async function deleteOnlineItem(scriptUrl: string, id: string): Promise<void> {
  await gasFetch(scriptUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
  });
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
