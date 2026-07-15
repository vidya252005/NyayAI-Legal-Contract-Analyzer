import React from 'react';
import { AnalysisSummary, ClauseAnalysis, MissingClause, SocialFlag } from '../types';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalysisLoadingStateProps {
  summary: AnalysisSummary | null;
  missingClausesCount: number;
  socialFlagsCount: number;
  clausesCount: number;
}

export function AnalysisLoadingState({ 
  summary, 
  missingClausesCount, 
  socialFlagsCount, 
  clausesCount 
}: AnalysisLoadingStateProps) {
  
  // Calculate a fake progress based on what data has arrived.
  // In a real scenario, the backend might send a total clauses count early on.
  let progress = 10; // Start at 10%
  if (summary) progress += 20;
  if (missingClausesCount > 0) progress += 10;
  if (socialFlagsCount > 0) progress += 10;
  if (clausesCount > 0) {
    if (summary?.totalClauses) {
      progress += Math.min(45, (clausesCount / summary.totalClauses) * 45);
    } else {
      progress += Math.min(45, clausesCount * 2);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
      <div className="bg-card border shadow-lg rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6 mb-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-serif font-semibold">Analyzing Legal Document</h2>
            <p className="text-muted-foreground mt-2">Evaluating clauses against the Indian Contract Act 1872...</p>
          </div>
          <div className="w-full max-w-md">
            <Progress value={progress} className="h-2 w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <StatusItem 
            active={!!summary} 
            label="Generating executive summary" 
            value={summary ? "Complete" : "Processing..."} 
          />
          <StatusItem 
            active={missingClausesCount > 0 || (summary !== null && missingClausesCount === 0)} 
            label="Identifying missing provisions" 
            value={missingClausesCount > 0 ? `${missingClausesCount} found` : "Scanning..."} 
          />
          <StatusItem 
            active={socialFlagsCount > 0 || (summary !== null && socialFlagsCount === 0)} 
            label="Checking social context & anomalies" 
            value={socialFlagsCount > 0 ? `${socialFlagsCount} flagged` : "Checking..."} 
          />
          <StatusItem 
            active={clausesCount > 0} 
            label="Reviewing clauses one-by-one" 
            value={`${clausesCount} clauses analyzed`} 
            highlight={clausesCount > 0}
          />
        </div>

        {clausesCount > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Latest Clause Analysis</h3>
            <div className="bg-muted/30 border rounded p-4 text-sm font-mono text-muted-foreground animate-pulse">
              [Clause stream active... mapping identified risks]
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusItem({ active, label, value, highlight }: { active: boolean, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-md border transition-colors duration-500 ${active ? 'bg-background border-border/60' : 'bg-muted/10 border-transparent opacity-50'}`}>
      {active ? (
        highlight ? <ChevronRight className="w-5 h-5 text-primary mt-0.5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground/60 animate-spin mt-0.5" />
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className={`text-xs mt-1 ${active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>{value}</p>
      </div>
    </div>
  );
}
