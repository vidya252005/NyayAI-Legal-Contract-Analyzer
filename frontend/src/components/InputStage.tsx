import React, { useState, useRef } from 'react';
import { useContractAnalysis } from '../hooks/use-contract-analysis';
import { parseContractFile } from '../lib/file-parser';
import { CONTRACT_TYPES } from '../types';
import { Upload, FileText, AlertCircle, File, ChevronDown, Check, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InputStageProps {
  onAnalyze: (text: string, type: string) => void;
  isAnalyzing: boolean;
}

export function InputStage({ onAnalyze, isAnalyzing }: InputStageProps) {
  const [contractType, setContractType] = useState<string>('');
  const [contractText, setContractText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setIsParsing(true);
    setFileName(file.name);
    setContractText(''); // clear while loading

    try {
      const text = await parseContractFile(file);
      setContractText(text);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
      setFileName(null);
    } finally {
      setIsParsing(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractType) {
      setParseError('Please select a contract type.');
      return;
    }
    if (!contractText.trim()) {
      setParseError('Please provide the contract text via upload or paste.');
      return;
    }
    setParseError(null);
    onAnalyze(contractText, contractType);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground font-serif">
          NyayAI Legal Analysis
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Rigorous, clause-by-clause risk assessment tailored for the Indian Contract Act 1872 and related statutes. 
          Upload a contract to identify vulnerabilities and receive actionable mitigations.
        </p>
      </div>

      <div className="bg-card border shadow-xl rounded-lg overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {parseError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{parseError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="contract-type" className="text-base font-medium flex items-center gap-2">
                1. Select Contract Type
              </Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger id="contract-type" className="w-full h-12 bg-muted/30 border-muted-foreground/30 text-base">
                  <SelectValue placeholder="e.g., Non-Disclosure Agreement (NDA)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CONTRACT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                2. Provide Contract Text
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a document (.pdf, .docx, .txt) or paste the raw text below.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-16 border-dashed border-2 bg-muted/20 hover:bg-muted/50 hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing || isAnalyzing}
                >
                  {isParsing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      Parsing Document...
                    </span>
                  ) : fileName ? (
                    <span className="flex items-center gap-2 text-primary">
                      <File className="w-5 h-5" />
                      {fileName} loaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      Upload Document
                    </span>
                  )}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".txt,.pdf,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="relative">
                <Textarea 
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste contract text here..."
                  className="min-h-[250px] font-mono text-sm leading-relaxed p-4 bg-background resize-y"
                  disabled={isParsing || isAnalyzing}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-base font-medium h-14"
                disabled={isAnalyzing || isParsing}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Initializing Analysis Engine...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Commence Legal Analysis
                  </span>
                )}
              </Button>
            </div>
            
          </form>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-muted-foreground">
        Data is processed temporarily and not stored permanently. By proceeding, you agree to our Terms of Service.
      </div>
    </div>
  );
}
