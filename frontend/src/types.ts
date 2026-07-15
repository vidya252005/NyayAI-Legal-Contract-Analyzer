export type ClauseAnalysisRiskLevel = 'Risky' | 'Moderate Risk' | 'Low Risk';

export interface XaiExplanation {
  word: string;
  importance: number;
  reason: string;
}

export interface ClauseAnalysis {
  clauseNumber: number;
  clauseText: string;
  clauseType: string;
  riskLevel: ClauseAnalysisRiskLevel;
  riskScore: number;
  legalBasis: string;
  explanation: string;
  suggestion: string;
  xaiExplanation: XaiExplanation[];
}

export type MissingClauseImportance = 'Critical' | 'Recommended';

export interface MissingClause {
  clauseName: string;
  suggestion: string;
  importance: MissingClauseImportance;
}

export interface SocialFlag {
  flaggedText: string;
  explanation: string;
}

export type AnalysisSummaryOverallRiskLevel = 'High' | 'Medium' | 'Low';

export interface AnalysisSummary {
  totalClauses: number;
  riskyClausesCount: number;
  moderateRiskClausesCount: number;
  overallRiskLevel: AnalysisSummaryOverallRiskLevel;
  overview?: string;
}

export type ChangeLogEntryChangeType = 'Modified' | 'Added' | 'Removed';

export interface ChangeLogEntry {
  clauseNumber: number | null;
  changeType: ChangeLogEntryChangeType;
  original: string;
  revised: string;
  reason: string;
}

export interface RewrittenContract {
  updatedContractText: string;
  changeLog: ChangeLogEntry[];
}

export type AnalysisStreamEvent =
  | { type: 'summary'; data: AnalysisSummary }
  | { type: 'missingClause'; data: MissingClause }
  | { type: 'socialFlag'; data: SocialFlag }
  | { type: 'clauseAnalysis'; data: ClauseAnalysis }
  | { type: 'error'; data: { message: string } }
  | { type: 'done' };

export const CONTRACT_TYPES = [
  'Adoption Deed', 'Agreement for Sale of Property', 'Arbitration Agreement', 'Construction Agreement',
  'Consultancy Agreement', 'Distributorship Agreement', 'Employment Agreement', 'End-User License Agreement (EULA)',
  'Franchise Agreement', 'Gift Deed', 'Hire-Purchase Agreement', 'Indemnity Bond', 'Independent Contractor Agreement',
  'Joint Venture Agreement', 'Leave and License Agreement', 'Lease Agreement', 'Loan Agreement', 'Miscellaneous Agreement',
  'Mortgage Deed', 'Non-Disclosure Agreement (NDA)', 'Partnership Deed', 'Power of Attorney', 'Prenuptial Agreement',
  'Privacy Policy', 'Rental Agreement', 'Sale Deed', 'Service Agreement', "Shareholders' Agreement",
  'Software License Agreement', 'Terms of Service (ToS)', 'Trust Deed', 'Vendor Agreement', 'Will'
] as const;
