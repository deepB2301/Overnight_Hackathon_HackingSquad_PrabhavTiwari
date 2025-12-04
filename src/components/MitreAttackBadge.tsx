import { Badge } from '@/components/ui/badge';
import { Shield, ExternalLink } from 'lucide-react';

interface MitreAttackBadgeProps {
  tactic?: string;
  technique?: string;
  id?: string;
}

export function MitreAttackBadge({ tactic, technique, id }: MitreAttackBadgeProps) {
  if (!id || id === 'N/A') return null;

  const mitreUrl = `https://attack.mitre.org/techniques/${id}/`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">MITRE ATT&CK</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {tactic && (
          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
            {tactic}
          </Badge>
        )}
        {technique && (
          <Badge variant="secondary" className="text-xs">
            {technique}
          </Badge>
        )}
        {id && (
          <a 
            href={mitreUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Badge variant="outline" className="text-xs font-mono bg-accent/20 border-accent/40">
              {id}
            </Badge>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
