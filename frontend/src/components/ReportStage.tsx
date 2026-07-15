import React from 'react';
import { AnalysisSummary, ClauseAnalysis, MissingClause, SocialFlag } from '../types';
import { ClauseCard } from './ClauseCard';
import { AlertCircle, ShieldAlert, CheckCircle, Flag, FileText, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReportStageProps {
  summary: AnalysisSummary;
  missingClauses: MissingClause[];
  socialFlags: SocialFlag[];
  clauses: ClauseAnalysis[];
  onGenerateRewrite: () => void;
  isRewriting: boolean;
}

export function ReportStage({ 
  summary, 
  missingClauses, 
  socialFlags, 
  clauses,
  onGenerateRewrite,
  isRewriting
}: ReportStageProps) {
  
  const getOverallRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'Medium': return 'text-amber-700 bg-amber-500/10 border-amber-500/20';
      case 'Low': return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-foreground bg-muted border-border';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Legal Analysis Report
          </h1>
          <p className="text-muted-foreground">Comprehensive review per Indian Contract Act 1872</p>
        </div>
        <Button 
          onClick={onGenerateRewrite} 
          disabled={isRewriting}
          size="lg"
          className="shrink-0 shadow-md font-medium"
        >
          {isRewriting ? (
            <>
              <div className="w-4 h-4 mr-2 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Generating Mitigated Draft...
            </>
          ) : (
            <>
              Generate Corrected Draft <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Executive Summary */}
      <section className="bg-card border shadow-sm rounded-lg p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <h2 className="text-lg font-bold font-serif uppercase tracking-wider mb-6 flex items-center gap-2">
          Executive Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className={`p-4 rounded-md border ${getOverallRiskColor(summary.overallRiskLevel)}`}>
            <div className="text-sm font-semibold uppercase tracking-wider mb-1 opacity-80">Overall Risk</div>
            <div className="text-3xl font-bold">{summary.overallRiskLevel}</div>
          </div>
          <div className="p-4 rounded-md border bg-muted/20">
            <div className="text-sm font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Total Clauses</div>
            <div className="text-3xl font-bold text-foreground">{summary.totalClauses}</div>
          </div>
          <div className="p-4 rounded-md border bg-destructive/5 border-destructive/10">
            <div className="text-sm font-semibold uppercase tracking-wider mb-1 text-destructive/80">High Risk</div>
            <div className="text-3xl font-bold text-destructive">{summary.riskyClausesCount}</div>
          </div>
          <div className="p-4 rounded-md border bg-amber-500/5 border-amber-500/10">
            <div className="text-sm font-semibold uppercase tracking-wider mb-1 text-amber-700/80">Moderate Risk</div>
            <div className="text-3xl font-bold text-amber-700">{summary.moderateRiskClausesCount}</div>
          </div>
        </div>

        {summary.overview && (
          <div className="bg-muted/30 p-4 rounded border text-sm leading-relaxed font-serif italic text-foreground">
            {summary.overview}
          </div>
        )}
      </section>

      {/* Critical Findings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Missing Clauses */}
        <section className="bg-card border shadow-sm rounded-lg p-6">
          <h2 className="text-base font-bold font-serif uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground border-b pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Absent Provisions
          </h2>
          {missingClauses.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> No standard clauses are missing.
            </p>
          ) : (
            <div className="space-y-4">
              {missingClauses.map((mc, idx) => (
                <div key={idx} className="border-l-2 border-amber-500 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{mc.clauseName}</span>
                    <Badge variant={mc.importance === 'Critical' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {mc.importance}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{mc.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Social Flags */}
        <section className="bg-card border shadow-sm rounded-lg p-6">
          <h2 className="text-base font-bold font-serif uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground border-b pb-3">
            <Flag className="w-5 h-5 text-primary" />
            Contextual Anomalies
          </h2>
          {socialFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> No unusual cultural or contextual terms found.
            </p>
          ) : (
            <div className="space-y-4">
              {socialFlags.map((flag, idx) => (
                <div key={idx} className="bg-primary/5 border border-primary/10 rounded p-3">
                  <div className="text-xs font-mono bg-background border px-2 py-1 rounded mb-2 text-muted-foreground line-clamp-2">
                    "{flag.flaggedText}"
                  </div>
                  <p className="text-xs text-foreground font-medium flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {flag.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Clause Breakdown */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-serif mb-6 flex items-center gap-2 border-b pb-2">
          <FileText className="w-6 h-6 text-primary" />
          Clause-by-Clause Breakdown
        </h2>
        {clauses.map((clause, idx) => (
          <ClauseCard key={idx} clause={clause} />
        ))}
      </section>
    </div>
  );
}
