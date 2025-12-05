import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Shield, AlertTriangle, Loader2, CheckCircle, XCircle, Brain, Activity, Fingerprint, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyzeThreat } from '@/hooks/useAttacks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SignatureMatch {
  attackType: string;
  patterns: string[];
}

interface ScanResult {
  url: string;
  is_malicious: boolean;
  attack_type: string;
  confidence: number;
  severity: string;
  is_success: boolean;
  explanation: string;
  indicators: string[];
  recommendations: string[];
  analyzed_at: string;
  detection_method?: string;
  signatures_matched?: SignatureMatch[];
  anomaly_score?: number;
  mitre_tactic?: string;
  mitre_technique?: string;
  mitre_id?: string;
}

export function URLScanner() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const { analyze, analyzing } = useAnalyzeThreat();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setResult(null);

    try {
      const data = await analyze(url, 'url');
      
      if (data.error) {
        toast({
          title: 'Analysis Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setResult({
        url,
        ...data,
      });

      if (data.is_malicious && user) {
        toast({
          title: 'Threat Detected & Logged',
          description: 'This threat has been added to your security dashboard.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze the URL',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card variant="cyber" className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          AI Threat Scanner
          <Badge variant="cyber" className="ml-2 gap-1">
            <Brain className="h-3 w-3" />
            ML Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              variant="cyber"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL or request to analyze..."
              className="pr-10 font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button 
            variant="cyber" 
            onClick={handleScan} 
            disabled={analyzing || !url.trim()}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {/* Demo suggestions */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">Try:</span>
          <button 
            className="text-primary hover:underline font-mono"
            onClick={() => setUrl("' OR '1'='1' --")}
          >
            SQL Injection
          </button>
          <button 
            className="text-primary hover:underline font-mono"
            onClick={() => setUrl("<script>alert('XSS')</script>")}
          >
            XSS Attack
          </button>
          <button 
            className="text-primary hover:underline font-mono"
            onClick={() => setUrl("../../etc/passwd")}
          >
            Path Traversal
          </button>
          <button 
            className="text-primary hover:underline font-mono"
            onClick={() => setUrl("; cat /etc/passwd")}
          >
            Command Injection
          </button>
        </div>

        {result && (
          <div className={cn(
            "p-4 rounded-xl border transition-all duration-300 animate-fade-in",
            !result.is_malicious 
              ? "bg-success/5 border-success/30" 
              : "bg-destructive/5 border-destructive/30"
          )}>
            <div className="flex items-start gap-3">
              {!result.is_malicious ? (
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className={cn(
                    "font-semibold",
                    !result.is_malicious ? "text-success" : "text-destructive"
                  )}>
                    {!result.is_malicious ? 'No Threats Detected' : `${result.attack_type} Detected`}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant={!result.is_malicious ? 'success' : 'destructive'}>
                      {result.confidence}% confidence
                    </Badge>
                    {result.is_malicious && (
                      <Badge variant={
                        result.severity === 'critical' ? 'destructive' :
                        result.severity === 'high' ? 'destructive' :
                        result.severity === 'medium' ? 'warning' : 'secondary'
                      }>
                        {result.severity}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {result.explanation && (
                  <p className="text-sm text-muted-foreground">
                    {result.explanation}
                  </p>
                )}

                {result.indicators && result.indicators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.indicators.map((indicator, i) => (
                      <Badge key={i} variant="outline" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Detection Details */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  {/* Anomaly Score */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Activity className="h-3 w-3 text-primary" />
                      Anomaly Score
                    </div>
                    <Progress 
                      value={(result.anomaly_score || 0) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {((result.anomaly_score || 0) * 100).toFixed(0)}% deviation
                    </p>
                  </div>
                  
                  {/* Detection Method */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Cpu className="h-3 w-3 text-primary" />
                      Detection Method
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.detection_method === 'signature+ai' ? 'Signature + AI' : 'AI Analysis'}
                    </Badge>
                  </div>
                </div>

                {/* Signature Matches */}
                {result.signatures_matched && result.signatures_matched.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2">
                      <Fingerprint className="h-3 w-3" />
                      Signature Matches ({result.signatures_matched.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.signatures_matched.map((match, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {match.attackType.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* MITRE ATT&CK */}
                {result.mitre_id && result.mitre_id !== 'N/A' && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="cyber" className="font-mono">
                      {result.mitre_id}
                    </Badge>
                    <span className="text-muted-foreground">
                      {result.mitre_tactic} → {result.mitre_technique}
                    </span>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-secondary/50">
                    <p className="text-xs font-medium mb-1">Recommendations:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {result.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground font-mono truncate">
                  Analyzed: {result.url}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
