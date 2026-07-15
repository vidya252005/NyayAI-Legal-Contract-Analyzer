import React, { useState } from 'react';
import { Link } from 'wouter';
import { useContractAnalysis } from '../hooks/use-contract-analysis';
import { useRewriteContract } from '../hooks/use-rewrite-contract';
import { InputStage } from '../components/InputStage';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';
import { ReportStage } from '../components/ReportStage';
import { RewriteStage } from '../components/RewriteStage';
import { RewrittenContract } from '../types';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { toast } = useToast();
  
  // Analysis Hook
  const {
    analyze,
    isAnalyzing,
    error: analysisError,
    summary,
    missingClauses,
    socialFlags,
    clauses,
    isDone,
    reset: resetAnalysis
  } = useContractAnalysis();

  // Rewrite Hook
  const rewriteMutation = useRewriteContract();
  
  // Local state for the selected contract type
  const [contractType, setContractType] = useState<string>('');
  const [contractText, setContractText] = useState<string>('');
  
  // Local state to store the rewritten contract once done
  const [rewrittenContract, setRewrittenContract] = useState<RewrittenContract | null>(null);

  // Derive active stage
  // Stage 1: Input (No analysis started, no results)
  // Stage 2: Loading Analysis (isAnalyzing = true, or not isDone)
  // Stage 3: Report (isDone = true, rewrittenContract = null)
  // Stage 4: Rewrite (rewrittenContract != null)

  const handleStartAnalysis = (text: string, type: string) => {
    setContractText(text);
    setContractType(type);
    setRewrittenContract(null);
    analyze(text, type);
  };

  const handleGenerateRewrite = () => {
    rewriteMutation.mutate({
      contractText,
      contractType,
      clauses,
      missingClauses
    }, {
      onSuccess: (data) => {
        setRewrittenContract(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error: any) => {
        toast({
          title: "Generation Failed",
          description: error?.error || error?.message || "Could not generate rewritten contract.",
          variant: "destructive"
        });
      }
    });
  };

  const handleBackToReport = () => {
    setRewrittenContract(null);
  };

  // Error handling
  if (analysisError && !isAnalyzing && !isDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-serif font-bold text-destructive mb-3">Analysis Failed</h2>
          <p className="text-foreground mb-6">{analysisError}</p>
          <button 
            onClick={resetAnalysis}
            className="px-6 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { if(!isAnalyzing) { resetAnalysis(); setRewrittenContract(null); }}}>
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-serif font-bold text-xl">
              N
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Nyay<span className="text-primary">AI</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono text-muted-foreground font-medium uppercase tracking-wider hidden sm:block">
              Indian Contract Law Analyzer
            </div>
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pb-20">
        {!isAnalyzing && !isDone && !rewrittenContract && (
          <InputStage 
            onAnalyze={handleStartAnalysis} 
            isAnalyzing={isAnalyzing} 
          />
        )}

        {(isAnalyzing || (isDone && !summary && clauses.length === 0)) && !rewrittenContract && (
          <AnalysisLoadingState 
            summary={summary}
            missingClausesCount={missingClauses.length}
            socialFlagsCount={socialFlags.length}
            clausesCount={clauses.length}
          />
        )}

        {isDone && summary && !rewrittenContract && (
          <ReportStage 
            summary={summary}
            missingClauses={missingClauses}
            socialFlags={socialFlags}
            clauses={clauses}
            onGenerateRewrite={handleGenerateRewrite}
            isRewriting={rewriteMutation.isPending}
          />
        )}

        {rewrittenContract && summary && (
          <RewriteStage 
            rewrittenContract={rewrittenContract}
            contractType={contractType}
            summary={summary}
            missingClauses={missingClauses}
            socialFlags={socialFlags}
            clauses={clauses}
            onBack={handleBackToReport}
          />
        )}
      </main>
      
    </div>
  );
}
