import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClauseAnalysis, MissingClause, RewrittenContract } from "@/types";

interface RewriteContractInput {
  contractText: string;
  contractType: string;
  clauses: ClauseAnalysis[];
  missingClauses: MissingClause[];
}

export function useRewriteContract() {
  return useMutation({
    mutationFn: (input: RewriteContractInput) =>
      api.post<RewrittenContract>("/contracts/rewrite", input),
  });
}
