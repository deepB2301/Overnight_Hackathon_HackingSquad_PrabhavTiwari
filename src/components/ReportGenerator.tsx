import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { FileText, Download, Loader2, BarChart3, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportContent {
  summary: {
    total_attacks: number;
    blocked_attacks: number;
    successful_attacks: number;
    block_rate: string;
  };
  severity_breakdown: Record<string, number>;
  attack_types: Record<string, number>;
  mitre_techniques: Record<string, number>;
  detection_methods: Record<string, number>;
  top_iocs: { type: string; value: string; count: number }[];
  ai_summary?: string;
  generated_at: string;
}

export function ReportGenerator() {
  const [reportType, setReportType] = useState('summary');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<ReportContent | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const generateReport = async () => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to generate reports',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { 
          reportType,
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          }
        },
      });

      if (error) throw error;
      
      setReport(data.report);
      toast({
        title: 'Report Generated',
        description: 'Your security report is ready',
      });
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportText = `
SECURITY THREAT REPORT
Generated: ${new Date(report.generated_at).toLocaleString()}
Type: ${reportType.toUpperCase()}
=====================================

EXECUTIVE SUMMARY
-----------------
Total Attacks: ${report.summary.total_attacks}
Blocked: ${report.summary.blocked_attacks} (${report.summary.block_rate}%)
Successful: ${report.summary.successful_attacks}

SEVERITY BREAKDOWN
------------------
Critical: ${report.severity_breakdown.critical || 0}
High: ${report.severity_breakdown.high || 0}
Medium: ${report.severity_breakdown.medium || 0}
Low: ${report.severity_breakdown.low || 0}

ATTACK TYPES
------------
${Object.entries(report.attack_types).map(([type, count]) => `${type}: ${count}`).join('\n')}

MITRE ATT&CK TECHNIQUES
-----------------------
${Object.entries(report.mitre_techniques).map(([id, count]) => `${id}: ${count}`).join('\n')}

TOP IOCs
--------
${report.top_iocs.slice(0, 10).map(ioc => `[${ioc.type}] ${ioc.value} (${ioc.count}x)`).join('\n')}

${report.ai_summary ? `\nAI ANALYSIS\n-----------\n${report.ai_summary}` : ''}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card variant="cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Create automated security reports with AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="executive">Executive Report (AI)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card variant="cyber">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Security Report</CardTitle>
              <CardDescription>
                Generated {new Date(report.generated_at).toLocaleString()}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {report.summary.total_attacks}
                </div>
                <div className="text-xs text-muted-foreground">Total Attacks</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-2xl font-bold text-green-500">
                  {report.summary.blocked_attacks}
                </div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-2xl font-bold text-destructive">
                  {report.summary.successful_attacks}
                </div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-2xl font-bold text-primary">
                  {report.summary.block_rate}%
                </div>
                <div className="text-xs text-muted-foreground">Block Rate</div>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Severity Distribution
              </h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(report.severity_breakdown).map(([severity, count]) => (
                  <Badge 
                    key={severity} 
                    variant={severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-sm"
                  >
                    {severity}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Attack Types */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Attack Types
              </h4>
              <div className="space-y-2">
                {Object.entries(report.attack_types)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-sm">{type.replace('_', ' ')}</div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ 
                              width: `${(count / report.summary.total_attacks) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* AI Summary */}
            {report.ai_summary && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-2">AI Analysis</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.ai_summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
