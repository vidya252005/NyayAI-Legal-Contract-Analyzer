import React from 'react';
import { RewrittenContract, AnalysisSummary, MissingClause, SocialFlag, ClauseAnalysis } from '../types';
import { CheckCircle2, Download, FileText, ArrowLeft, PenTool, LayoutTemplate, Diff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContractExport } from '../hooks/use-contract-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RewriteStageProps {
  rewrittenContract: RewrittenContract;
  contractType: string;
  summary: AnalysisSummary;
  missingClauses: MissingClause[];
  socialFlags: SocialFlag[];
  clauses: ClauseAnalysis[];
  onBack: () => void;
}

export function RewriteStage({
  rewrittenContract,
  contractType,
  summary,
  missingClauses,
  socialFlags,
  clauses,
  onBack
}: RewriteStageProps) {
  const { exportFile, isExporting } = useContractExport();

  const handleDownloadContract = (format: 'pdf' | 'txt') => {
    exportFile(format, `NyayAI_${contractType.replace(/\s+/g, '_')}_Corrected`, {
      kind: 'contract',
      updatedContractText: rewrittenContract.updatedContractText,
      changeLog: rewrittenContract.changeLog
    });
  };

  const handleDownloadReport = (format: 'pdf' | 'txt') => {
    exportFile(format, `NyayAI_${contractType.replace(/\s+/g, '_')}_Report`, {
      kind: 'report',
      contractType,
      summary,
      missingClauses,
      socialFlags,
      clauses,
      updatedContractText: rewrittenContract.updatedContractText,
      changeLog: rewrittenContract.changeLog
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analysis
          </Button>
          <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            Mitigated Contract Draft
          </h1>
          <p className="text-muted-foreground mt-1">Risks neutralized per Indian legal standards.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted/50 p-1 rounded-md border">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDownloadContract('pdf')}
              disabled={isExporting}
              className="text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> PDF Draft
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDownloadContract('txt')}
              disabled={isExporting}
              className="text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> TXT Draft
            </Button>
          </div>
          
          <Button 
            onClick={() => handleDownloadReport('pdf')}
            disabled={isExporting}
            className="shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" /> Download Full Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contract" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="contract" className="font-medium">
            <LayoutTemplate className="w-4 h-4 mr-2" /> Full Text
          </TabsTrigger>
          <TabsTrigger value="changelog" className="font-medium">
            <Diff className="w-4 h-4 mr-2" /> Log of Changes
            <Badge variant="secondary" className="ml-2 bg-background/50 text-foreground px-1.5 py-0 text-[10px]">
              {rewrittenContract.changeLog.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="mt-0">
          <div className="bg-card border shadow-sm rounded-lg overflow-hidden flex flex-col">
            <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Document Viewer</span>
              <span className="text-xs text-muted-foreground font-mono">NyayAI • Verified Draft</span>
            </div>
            <div className="p-8 lg:p-12 bg-white dark:bg-card">
              <div className="prose dark:prose-invert max-w-none font-serif text-foreground leading-loose">
                {rewrittenContract.updatedContractText.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 min-h-[1.5em]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="changelog" className="mt-0">
          <div className="space-y-4">
            {rewrittenContract.changeLog.map((change, idx) => (
              <div key={idx} className="bg-card border shadow-sm rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={change.changeType === 'Removed' ? 'destructive' : change.changeType === 'Added' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
                      {change.changeType}
                    </Badge>
                    {change.clauseNumber && (
                      <span className="text-sm font-semibold text-muted-foreground font-mono">Clause {change.clauseNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {change.changeType !== 'Added' && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original</div>
                      <div className="bg-destructive/5 border border-destructive/10 p-3 rounded text-sm font-serif italic text-muted-foreground line-through decoration-destructive/30">
                        {change.original}
                      </div>
                    </div>
                  )}
                  
                  {change.changeType !== 'Removed' && (
                    <div className="space-y-1.5 lg:col-start-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Revised</div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded text-sm font-serif text-foreground">
                        {change.revised}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">Reason for Mitigation</span>
                  <p className="text-sm text-foreground">{change.reason}</p>
                </div>
              </div>
            ))}
            
            {rewrittenContract.changeLog.length === 0 && (
              <div className="text-center py-12 bg-card border rounded-lg">
                <p className="text-muted-foreground">No significant changes were required.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}
