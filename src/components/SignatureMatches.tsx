import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SignatureMatch {
  attackType: string;
  patterns: string[];
}

interface SignatureMatchesProps {
  matches: SignatureMatch[];
  anomalyScore?: number;
}

const ATTACK_TYPE_LABELS: Record<string, string> = {
  sql_injection: 'SQL Injection',
  xss: 'Cross-Site Scripting',
  path_traversal: 'Path Traversal',
  command_injection: 'Command Injection',
  xxe: 'XML External Entity',
  ssrf: 'Server-Side Request Forgery',
  lfi: 'Local File Inclusion',
  rce: 'Remote Code Execution',
};

export function SignatureMatches({ matches, anomalyScore = 0 }: SignatureMatchesProps) {
  const hasMatches = matches && matches.length > 0;
  const isAnomalous = anomalyScore > 0.5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Detection Layers</h4>
        <div className="flex items-center gap-2">
          <Badge variant={hasMatches ? 'destructive' : 'secondary'} className="text-xs">
            Signature: {hasMatches ? 'Match' : 'Clear'}
          </Badge>
          <Badge 
            variant={isAnomalous ? 'destructive' : 'secondary'} 
            className="text-xs"
          >
            Anomaly: {(anomalyScore * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {hasMatches ? (
        <div className="space-y-2">
          {matches.map((match, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-lg border border-destructive/30 bg-destructive/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {ATTACK_TYPE_LABELS[match.attackType] || match.attackType}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{match.patterns.length}</span> pattern(s) matched
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            No signature patterns detected
          </span>
        </div>
      )}

      {/* Anomaly Score Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Anomaly Score</span>
          <span>{(anomalyScore * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              anomalyScore > 0.7 ? 'bg-destructive' : 
              anomalyScore > 0.4 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${anomalyScore * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
