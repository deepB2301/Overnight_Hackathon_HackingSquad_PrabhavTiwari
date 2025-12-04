import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanResult {
  url: string;
  safe: boolean;
  threats: string[];
  confidence: number;
  timestamp: Date;
}

export function URLScanner() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    
    setScanning(true);
    setResult(null);

    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for common malicious patterns
    const threats: string[] = [];
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('<script') || lowerUrl.includes('javascript:')) {
      threats.push('XSS Attack Pattern');
    }
    if (lowerUrl.includes("'") && (lowerUrl.includes('or') || lowerUrl.includes('union') || lowerUrl.includes('select'))) {
      threats.push('SQL Injection Pattern');
    }
    if (lowerUrl.includes('..') && lowerUrl.includes('/')) {
      threats.push('Path Traversal Attempt');
    }
    if (lowerUrl.includes('cmd=') || lowerUrl.includes('exec(') || lowerUrl.includes('system(')) {
      threats.push('Command Injection');
    }

    setResult({
      url,
      safe: threats.length === 0,
      threats,
      confidence: threats.length > 0 ? 0.85 + Math.random() * 0.14 : 0.95 + Math.random() * 0.05,
      timestamp: new Date(),
    });

    setScanning(false);
  };

  return (
    <Card variant="cyber" className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          URL Threat Scanner
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
            disabled={scanning || !url.trim()}
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
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
        </div>

        {result && (
          <div className={cn(
            "p-4 rounded-xl border transition-all duration-300 animate-fade-in",
            result.safe 
              ? "bg-success/5 border-success/30" 
              : "bg-destructive/5 border-destructive/30"
          )}>
            <div className="flex items-start gap-3">
              {result.safe ? (
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "font-semibold",
                    result.safe ? "text-success" : "text-destructive"
                  )}>
                    {result.safe ? 'No Threats Detected' : 'Threats Detected!'}
                  </p>
                  <Badge variant={result.safe ? 'success' : 'destructive'}>
                    {Math.round(result.confidence * 100)}% confidence
                  </Badge>
                </div>
                
                {result.threats.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.threats.map((threat, i) => (
                      <Badge key={i} variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {threat}
                      </Badge>
                    ))}
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
