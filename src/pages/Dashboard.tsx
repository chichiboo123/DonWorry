import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BudgetSummaryCards from '@/components/BudgetSummaryCards';
import BudgetChart from '@/components/BudgetChart';
import BudgetTable from '@/components/BudgetTable';
import CompactBudgetView from '@/components/CompactBudgetView';
import { useBudget } from '@/hooks/use-budget';
import { isSetupDone, clearSetup } from '@/lib/budget-store';
import SetupPage from './SetupPage';
import { useState } from 'react';
import { LayoutGrid, Table as TableIcon, RotateCcw, RefreshCw, Globe, HardDrive, Loader2, Upload, Download, Link, ArrowUpDown } from 'lucide-react';
import { DataMode, getScriptUrl, setScriptUrl, setDataMode as setGasDataMode } from '@/lib/google-apps-script';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Dashboard() {
  const budget = useBudget();
  const [setupDone, setSetupDone] = useState(isSetupDone());
  const [compactView, setCompactView] = useState(false);
  const [showOnlineConnect, setShowOnlineConnect] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(getScriptUrl());
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  if (!setupDone) {
    return (
      <SetupPage
        onComplete={(items, mode) => {
          if (mode) budget.setDataMode(mode);
          budget.loadItems(items);
          setSetupDone(true);
        }}
      />
    );
  }

  const handleConnectOnline = () => {
    if (!scriptUrlInput.trim()) return;
    setScriptUrl(scriptUrlInput);
    setGasDataMode('online');
    budget.setDataMode('online');
    setShowOnlineConnect(false);
    toast.success('온라인 모드로 전환되었습니다. "업로드" 버튼을 눌러 데이터를 스프레드시트에 저장하세요.');
  };

  const handleSwitchToLocal = () => {
    setGasDataMode('local');
    budget.setDataMode('local');
    toast.success('로컬 모드로 전환되었습니다.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader theme={budget.theme} onThemeChange={budget.setTheme} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1">
        {/* 모드 표시 + 동기화 버튼 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {budget.dataMode === 'online' ? (
              <>
                {/* 자동동기화 상태 표시 */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-green-600 font-medium">자동 동기화 중</span>
                {budget.syncing && <Loader2 className="w-3 h-3 animate-spin" />}
                <button
                  onClick={handleSwitchToLocal}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                >
                  로컬로 전환
                </button>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>로컬 모드</span>
                <button
                  onClick={() => setShowOnlineConnect(!showOnlineConnect)}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                >
                  온라인 연결
                </button>
              </>
            )}
          </div>
          {/* 수동 동기화 버튼 */}
          {budget.dataMode === 'online' && (
            <div className="relative">
              <button
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                disabled={budget.syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                수동 동기화
              </button>
              {showSyncMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden min-w-[160px]">
                  <button
                    onClick={() => { budget.pushToOnline(); setShowSyncMenu(false); }}
                    disabled={budget.syncing || budget.items.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    구글시트 업로드
                  </button>
                  <div className="h-px bg-border" />
                  <button
                    onClick={() => { budget.refreshFromOnline(); setShowSyncMenu(false); }}
                    disabled={budget.syncing}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    구글시트 다운로드
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 온라인 연결 패널 */}
        {showOnlineConnect && budget.dataMode === 'local' && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm text-foreground font-medium">Apps Script URL로 온라인 연결</p>
            <p className="text-xs text-muted-foreground">
              연결 후 "업로드" 버튼을 눌러 현재 데이터를 스프레드시트에 저장할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://script.google.com/macros/s/.../exec"
                value={scriptUrlInput}
                onChange={(e) => setScriptUrlInput(e.target.value)}
                className="text-sm"
              />
              <Button onClick={handleConnectOnline} disabled={!scriptUrlInput.trim()} size="sm">
                <Link className="w-4 h-4 mr-1" />
                연결
              </Button>
            </div>
          </div>
        )}

        {/* Summary cards + Pie chart in one row */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="lg:w-1/3 flex flex-col gap-3 sm:gap-4">
            <BudgetSummaryCards summary={budget.summary} />
          </div>
          <div className="lg:w-2/3">
            <BudgetChart summary={budget.summary} items={budget.items} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-foreground">상세 내역</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearSetup();
                  setSetupDone(false);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">데이터 다시 불러오기</span>
                <span className="sm:hidden">다시 불러오기</span>
              </button>
              <button
                onClick={() => setCompactView(!compactView)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                  compactView
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {compactView ? <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{compactView ? '테이블 보기' : '간단하게 보기'}</span>
                <span className="sm:hidden">{compactView ? '테이블' : '간단히'}</span>
              </button>
            </div>
          </div>
          {compactView ? (
            <CompactBudgetView items={budget.items} />
          ) : (
            <BudgetTable items={budget.items} editable onUpdate={budget.updateItem} onDelete={budget.deleteItem} onDeleteGroup={budget.deleteGroup} />
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
