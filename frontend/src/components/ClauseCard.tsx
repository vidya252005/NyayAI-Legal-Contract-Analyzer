import React from 'react';
import { ClauseAnalysis, XaiExplanation } from '../types';
import { AlertTriangle, Info, CheckCircle, Scale, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface ClauseCardProps {
  clause: ClauseAnalysis;
}

export function ClauseCard({ clause }: ClauseCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Risky': return 'bg-destructive text-destructive-foreground border-destructive';
      case 'Moderate Risk': return 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400';
      case 'Low Risk': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Risky': return <AlertTriangle className="w-4 h-4" />;
      case 'Moderate Risk': return <Info className="w-4 h-4" />;
      case 'Low Risk': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={`border rounded-md overflow-hidden transition-all duration-200 ${isOpen ? 'shadow-md ring-1 ring-primary/10' : 'hover:shadow-sm'}`}
    >
      <CollapsibleTrigger className="w-full flex items-start justify-between p-4 text-left bg-card hover:bg-muted/20 transition-colors">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold mt-1">
            {clause.clauseNumber}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground font-serif">{clause.clauseType}</span>
              <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider text-[10px] border ${getRiskColor(clause.riskLevel)}`}>
                {getRiskIcon(clause.riskLevel)}
                {clause.riskLevel}
              </Badge>
              {clause.riskScore >= 0.7 && (
                <span className="text-xs font-mono text-destructive font-medium">Score: {(clause.riskScore * 100).toFixed(0)}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 pr-4 font-serif italic">
              "{clause.clauseText}"
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="bg-background border-t">
        <div className="p-5 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" /> Legal Basis
                </h4>
                <p className="text-sm font-medium text-foreground bg-primary/5 px-3 py-2 rounded border border-primary/10 inline-block">
                  {clause.legalBasis}
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Analysis</h4>
                <p className="text-sm text-foreground leading-relaxed">{clause.explanation}</p>
              </div>

              {clause.riskLevel !== 'Low Risk' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-primary">Suggested Mitigation</h4>
                  <div className="text-sm text-primary-foreground bg-primary p-3 rounded-md shadow-sm">
                    {clause.suggestion}
                  </div>
                </div>
              )}
            </div>
            
            {clause.xaiExplanation && clause.xaiExplanation.length > 0 && (
              <div className="bg-muted/30 p-4 rounded-md border border-muted">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">XAI Keyword Drivers</h4>
                <div className="space-y-4">
                  {clause.xaiExplanation.map((xai, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border/50 text-foreground font-medium">"{xai.word}"</span>
                        <span className="text-muted-foreground text-xs font-mono">Impact: {(xai.importance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/60 rounded-full" 
                          style={{ width: `${xai.importance * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{xai.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-border/50">
             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Original Text</h4>
             <div className="bg-muted/20 p-3 rounded text-sm font-serif italic text-muted-foreground leading-relaxed border-l-2 border-muted">
               {clause.clauseText}
             </div>
          </div>

        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
