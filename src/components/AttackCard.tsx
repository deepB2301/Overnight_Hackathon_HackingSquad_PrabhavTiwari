import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Attack, severityColors, attackTypeColors } from '@/lib/mock-data';
import { Clock, Globe, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttackCardProps {
  attack: Attack;
  onClick?: () => void;
}

export function AttackCard({ attack, onClick }: AttackCardProps) {
  const severityBadge = severityColors[attack.severity] as 'success' | 'warning' | 'destructive';
  const typeBadge = attackTypeColors[attack.attackType] as 'cyber' | 'accent' | 'warning' | 'destructive' | 'secondary';

  return (
    <Card 
      variant={attack.isSuccess ? 'danger' : 'cyber'} 
      className="cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={typeBadge}>{attack.attackType}</Badge>
              <Badge variant={severityBadge} className="capitalize">{attack.severity}</Badge>
              {attack.isSuccess ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Breach
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Blocked
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span className="font-mono">{attack.sourceIp}</span>
                <span className="text-xs">({attack.country})</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                <span className="font-mono truncate">{attack.method} {attack.targetUrl}</span>
              </div>
            </div>
            
            {attack.payload && (
              <div className="mt-3 p-2 bg-secondary/50 rounded-lg border border-border/50 overflow-hidden">
                <code className="text-xs text-destructive font-mono truncate block">{attack.payload}</code>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {attack.timestamp.toLocaleTimeString()}
            </div>
            <div className={cn(
              "text-2xl font-bold",
              attack.confidence > 0.9 ? "text-primary glow-text" : "text-foreground"
            )}>
              {Math.round(attack.confidence * 100)}%
            </div>
            <span className="text-xs text-muted-foreground">confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
