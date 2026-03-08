import { useState } from 'react';
import { HelpCircle, X, ExternalLink, Monitor, Globe, Upload, FileSpreadsheet, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UsageGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="사용법"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">사용법</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground">
            📖 돈 워리 사용 가이드
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-5 pb-5 max-h-[70vh]">
          <div className="space-y-6 py-4 text-sm text-foreground/90 leading-relaxed">

            {/* 소개 */}
            <section>
              <h3 className="text-base font-bold text-foreground mb-2">💰 돈 워리(Don Worry)란?</h3>
              <p className="text-muted-foreground">
                모든 교사를 위한 학교 예산 관리 플랫폼입니다. 에듀파인에서 다운로드한 세출예산 데이터를 쉽게 시각화하고 관리할 수 있습니다.
              </p>
            </section>

            {/* 기초 데이터 준비 */}
            <section>
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                기초 데이터 준비
              </h3>
              <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                <p className="font-medium text-foreground">에듀파인에서 데이터 다운로드:</p>
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">에듀파인</span>
                  <span>→</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">학교회계</span>
                  <span>→</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">사업관리</span>
                  <span>→</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">사업관리카드(담당)</span>
                  <span>→</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">조회</span>
                  <span>→</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">파일다운로드</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  다운로드된 엑셀 파일(.xls)이 기초 데이터입니다.
                </p>
              </div>
            </section>

            {/* 로컬 모드 */}
            <section>
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                로컬 모드
              </h3>
              <p className="text-muted-foreground mb-2">
                인터넷 연결 없이 브라우저에서 바로 사용하는 모드입니다. 데이터는 브라우저에 저장됩니다.
              </p>
              <div className="space-y-2 pl-3 border-l-2 border-primary/30">
                <div>
                  <p className="font-medium text-foreground text-xs">방법 1: 엑셀 파일 직접 업로드</p>
                  <p className="text-xs text-muted-foreground">에듀파인에서 다운로드한 .xls 파일을 그대로 업로드하세요.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground text-xs">방법 2: 구글 시트 링크 사용</p>
                  <p className="text-xs text-muted-foreground">
                    엑셀 파일을 구글 드라이브에 업로드 → "Google Sheets로 저장" → 생성된 링크를 입력하세요.
                  </p>
                </div>
              </div>
            </section>

            {/* 온라인 모드 */}
            <section>
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                온라인 모드
              </h3>
              <p className="text-muted-foreground mb-2">
                구글 스프레드시트와 자동으로 동기화되는 모드입니다. 여러 기기에서 같은 데이터를 확인할 수 있습니다.
              </p>
              <div className="bg-accent/30 border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  온라인 모드를 사용하려면 <strong>Apps Script 세팅</strong>이 필요합니다.
                </p>
                <p className="text-xs text-muted-foreground">
                  사용을 희망하시는 경우 아래 이메일로 연락해 주세요:
                </p>
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <a href="mailto:chichiboo@kakao.com" className="text-primary font-medium text-xs hover:underline">
                      chichiboo@kakao.com
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      소속 / 성함 / 연락처 / 사용목적을 함께 보내주세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 주요 기능 */}
            <section>
              <h3 className="text-base font-bold text-foreground mb-2">🌟 주요 기능</h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                <li>예산 현황을 한눈에 보는 <strong>대시보드</strong></li>
                <li>사업별·항목별 <strong>차트 시각화</strong></li>
                <li>예산 항목 <strong>추가 / 수정 / 삭제</strong></li>
                <li><strong>테마 색상</strong> 변경 지원</li>
                <li>온라인 모드에서 <strong>자동 동기화</strong> (초록 불빛 표시)</li>
                <li>수동 동기화로 <strong>구글시트 업로드/다운로드</strong></li>
              </ul>
            </section>

            {/* 개발자 정보 */}
            <section className="bg-muted/30 border border-border rounded-lg p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">개발자</p>
              <p className="font-bold text-foreground">교육뮤지컬 꿈꾸는 치수쌤</p>
              <a
                href="https://litt.ly/chichiboo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                litt.ly/chichiboo
              </a>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
