import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'cyber' | 'danger' | 'warning' | 'success';
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, variant = 'cyber' }: StatsCardProps) {
  return (
    <Card variant={variant} className="relative overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
            {change && (
              <p className={cn(
                "text-xs font-medium",
                changeType === 'positive' && "text-success",
                changeType === 'negative' && "text-destructive",
                changeType === 'neutral' && "text-muted-foreground"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            variant === 'cyber' && "bg-primary/10 text-primary group-hover:bg-primary/20",
            variant === 'danger' && "bg-destructive/10 text-destructive group-hover:bg-destructive/20",
            variant === 'warning' && "bg-warning/10 text-warning group-hover:bg-warning/20",
            variant === 'success' && "bg-success/10 text-success group-hover:bg-success/20",
            variant === 'default' && "bg-secondary text-foreground"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
      {/* Animated gradient line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 opacity-50",
        variant === 'cyber' && "bg-gradient-to-r from-primary/0 via-primary to-primary/0",
        variant === 'danger' && "bg-gradient-to-r from-destructive/0 via-destructive to-destructive/0",
        variant === 'warning' && "bg-gradient-to-r from-warning/0 via-warning to-warning/0",
        variant === 'success' && "bg-gradient-to-r from-success/0 via-success to-success/0",
      )} />
    </Card>
  );
}
