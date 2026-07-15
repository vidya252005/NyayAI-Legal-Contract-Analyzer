import { useState, useRef, useCallback } from 'react';
import { AnalysisSummary, ClauseAnalysis, MissingClause, SocialFlag } from '../types';

interface UseContractAnalysisReturn {
  analyze: (contractText: string, contractType: string) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  summary: AnalysisSummary | null;
  missingClauses: MissingClause[];
  socialFlags: SocialFlag[];
  clauses: ClauseAnalysis[];
  isDone: boolean;
  reset: () => void;
}

export function useContractAnalysis(): UseContractAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [missingClauses, setMissingClauses] = useState<MissingClause[]>([]);
  const [socialFlags, setSocialFlags] = useState<SocialFlag[]>([]);
  const [clauses, setClauses] = useState<ClauseAnalysis[]>([]);
  const [isDone, setIsDone] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setError(null);
    setSummary(null);
    setMissingClauses([]);
    setSocialFlags([]);
    setClauses([]);
    setIsDone(false);
  }, []);

  const analyze = useCallback(async (contractText: string, contractType: string) => {
    reset();
    setIsAnalyzing(true);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/contracts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText, contractType }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body stream available.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasSummary = false;
      let hasClauses = false;

      while (true) {
        const { value, done } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const event = JSON.parse(line);
              
              if (event.type === 'summary') {
                hasSummary = true;
                setSummary(event.data);
              } else if (event.type === 'missingClause') {
                setMissingClauses(prev => [...prev, event.data]);
              } else if (event.type === 'socialFlag') {
                setSocialFlags(prev => [...prev, event.data]);
              } else if (event.type === 'clauseAnalysis') {
                hasClauses = true;
                setClauses(prev => [...prev, event.data]);
              } else if (event.type === 'error') {
                setError(event.data.message);
                setIsAnalyzing(false);
                return;
              } else if (event.type === 'done') {
                setIsAnalyzing(false);
                if (!hasSummary || !hasClauses) {
                  setError('The analysis stream ended unexpectedly before producing a complete result. Please try again.');
                } else {
                  setIsDone(true);
                }
                return;
              }
            } catch (e) {
              console.warn('Failed to parse NDJSON line:', line, e);
            }
          }
        }
        
        if (done) {
          // Process any remaining buffer (server flushes a trailing line without a newline)
          if (buffer.trim()) {
             try {
               const event = JSON.parse(buffer);
               if (event.type === 'done') {
                 setIsDone(true);
               } else if (event.type === 'error') {
                 setError(event.data?.message || 'Unknown error');
                 setIsAnalyzing(false);
                 return;
               } else if (event.type === 'summary') {
                 hasSummary = true;
                 setSummary(event.data);
               } else if (event.type === 'missingClause') {
                 setMissingClauses(prev => [...prev, event.data]);
               } else if (event.type === 'socialFlag') {
                 setSocialFlags(prev => [...prev, event.data]);
               } else if (event.type === 'clauseAnalysis') {
                 hasClauses = true;
                 setClauses(prev => [...prev, event.data]);
               }
             } catch (e) {
               console.warn('Failed to parse final NDJSON line:', buffer, e);
             }
          }
          break;
        }
      }

      setIsAnalyzing(false);
      // The stream ended without an explicit error/done event, or ended before
      // any usable analysis arrived -- surface this as an error rather than
      // leaving the UI stuck in an ambiguous "done but empty" state.
      if (!hasSummary || !hasClauses) {
        setError('The analysis stream ended unexpectedly before producing a complete result. Please try again.');
      } else {
        setIsDone(true);
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An unexpected error occurred during analysis.');
        setIsAnalyzing(false);
      }
    }
  }, [reset]);

  return {
    analyze,
    isAnalyzing,
    error,
    summary,
    missingClauses,
    socialFlags,
    clauses,
    isDone,
    reset,
  };
}
