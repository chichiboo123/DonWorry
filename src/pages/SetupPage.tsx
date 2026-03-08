import { useState } from 'react';
import moneyIcon from '@/assets/money-icon.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { markSetupDone, setSheetUrl } from '@/lib/budget-store';
import { parseExcelFile, fetchGoogleSheet } from '@/lib/excel-parser';
import { BudgetItem } from '@/lib/budget-types';
import { Upload, Link, ArrowRight, Loader2, Globe, HardDrive } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import AppFooter from '@/components/AppFooter';
import * as gas from '@/lib/google-apps-script';

interface Props {
  onComplete: (items: BudgetItem[], mode?: gas.DataMode) => void;
}

export default function SetupPage({ onComplete }: Props) {
  const [url, setUrl] = useState('');
  const [scriptUrl, setScriptUrlState] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'local' | 'online'>('local');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const items = await parseExcelFile(file);
      gas.setDataMode('local');
      markSetupDone();
      onComplete(items, 'local');
      toast.success('데이터를 성공적으로 불러왔습니다!');
    } catch {
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSheet = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const items = await fetchGoogleSheet(url);
      setSheetUrl(url);
      gas.setDataMode('local');
      markSetupDone();
      onComplete(items, 'local');
      toast.success('데이터를 성공적으로 불러왔습니다!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppsScript = async () => {
    if (!scriptUrl.trim()) return;
    setLoading(true);
    try {
      const items = await gas.fetchOnlineData(scriptUrl);
      gas.setScriptUrl(scriptUrl);
      gas.setDataMode('online');
      markSetupDone();
      onComplete(items, 'online');
      toast.success(`온라인 모드로 연결되었습니다! (${items.length}개 항목)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Apps Script 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    gas.setDataMode('local');
    markSetupDone();
    onComplete([], 'local');
  };

  return (
    <div className="min-h-screen flex flex-col theme-gradient">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <img src={moneyIcon} alt="" className="w-8 h-8" />
              <h1 className="text-3xl text-foreground tracking-tight" style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
                돈 워리
              </h1>
            </div>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Black Han Sans', sans-serif" }}>
              Don Worry
            </p>
            <p className="text-muted-foreground pt-2">
              학교 예산을 쉽고 편리하게 관리하세요.<br />
              시작하려면 예산 데이터를 불러와주세요.
            </p>
          </div>

          {/* 모드 탭 */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button
              onClick={() => setTab('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === 'local'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              로컬 모드
            </button>
            <button
              onClick={() => setTab('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === 'online'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-4 h-4" />
              온라인 모드
            </button>
          </div>

          {tab === 'local' ? (
            <div className="glass-card rounded-2xl p-6 space-y-4 text-left">
              <p className="text-xs text-muted-foreground text-center">
                엑셀 파일을 업로드하면 이 기기에 데이터가 저장됩니다.
              </p>
              {/* Excel */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">엑셀 파일 업로드</p>
                <input ref={fileRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFile} />
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  파일 선택
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">또는</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google Sheets (read-only import) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">구글 스프레드시트 링크</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://docs.google.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Button onClick={handleSheet} disabled={loading || !url.trim()} size="icon">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 space-y-4 text-left">
              <p className="text-xs text-muted-foreground text-center">
                Google Apps Script와 연동하여 어디서든 동일한 데이터에 접근할 수 있습니다.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Apps Script 배포 URL</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://script.google.com/macros/s/..."
                    value={scriptUrl}
                    onChange={(e) => setScriptUrlState(e.target.value)}
                  />
                  <Button onClick={handleAppsScript} disabled={loading || !scriptUrl.trim()} size="icon">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Apps Script 설정 방법은{' '}
                <a
                  href="https://github.com/chichiboo123/DonWorry/blob/main/docs/APPS_SCRIPT_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  가이드 문서
                </a>
                를 참고하세요.
              </p>
            </div>
          )}

          <Button variant="ghost" onClick={handleSkip} className="gap-1 text-muted-foreground">
            나중에 할게요 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
