import { useState, useRef } from 'react';
import { Upload, Link, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseExcelFile, fetchGoogleSheet } from '@/lib/excel-parser';
import { BudgetItem } from '@/lib/budget-types';
import { toast } from 'sonner';

interface Props {
  onDataLoaded: (items: BudgetItem[]) => void;
}

export default function FileUploader({ onDataLoaded }: Props) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const items = await parseExcelFile(file);
      onDataLoaded(items);
      toast.success(`${items.length}개 항목을 불러왔습니다.`);
    } catch {
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setLoading(true);
    try {
      const items = await fetchGoogleSheet(sheetUrl);
      onDataLoaded(items);
      toast.success(`${items.length}개 항목을 불러왔습니다.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '스프레드시트를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-primary" />
        데이터 불러오기
      </h3>

      {/* Excel Upload */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">엑셀 파일 업로드</p>
        <input ref={fileRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFile} />
        <Button
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          엑셀 파일 선택
        </Button>
      </div>

      {/* Google Sheets */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">구글 스프레드시트 링크</p>
        <div className="flex gap-2">
          <Input
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <Button onClick={handleSheet} disabled={loading || !sheetUrl.trim()} className="gap-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
            불러오기
          </Button>
        </div>
      </div>
    </div>
  );
}
