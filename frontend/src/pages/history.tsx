import { Link } from 'wouter';
import { useHistoryList } from '@/hooks/use-history';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, FileText } from 'lucide-react';
import { ApiError } from '@/lib/api';

const riskBadgeVariant = (level?: string) => {
  if (level === 'High') return 'destructive' as const;
  if (level === 'Medium') return 'secondary' as const;
  return 'outline' as const;
};

export default function History() {
  const { data, isLoading, error } = useHistoryList();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <span className="font-serif font-bold text-xl">Analysis History</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {isLoading && <p className="text-muted-foreground">Loading history…</p>}

        {error instanceof ApiError && error.status === 503 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">History isn't enabled</p>
              <p className="text-sm">
                Set <code className="px-1 py-0.5 bg-muted rounded">MONGODB_URI</code> on the API
                server to start saving past analyses.
              </p>
            </CardContent>
          </Card>
        )}

        {error && !(error instanceof ApiError && error.status === 503) && (
          <p className="text-destructive">Failed to load history: {error.message}</p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-muted-foreground">No analyses yet — run one from the home page.</p>
        )}

        <div className="space-y-3">
          {data?.items.map((item) => (
            <Card key={item._id}>
              <CardContent className="pt-6 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.contractType}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {item.summary && (
                  <Badge variant={riskBadgeVariant(item.summary.overallRiskLevel)} className="shrink-0">
                    {item.summary.overallRiskLevel} risk
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
