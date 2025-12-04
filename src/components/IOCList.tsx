import { Badge } from '@/components/ui/badge';
import { Globe, Mail, Hash, Server, Link2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IOC {
  type: string;
  value: string;
  count?: number;
}

interface IOCListProps {
  iocs: IOC[];
  compact?: boolean;
}

const IOC_ICONS: Record<string, React.ReactNode> = {
  ip: <Server className="h-3 w-3" />,
  domain: <Globe className="h-3 w-3" />,
  url: <Link2 className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  md5: <Hash className="h-3 w-3" />,
  sha1: <Hash className="h-3 w-3" />,
  sha256: <Hash className="h-3 w-3" />,
};

const IOC_COLORS: Record<string, string> = {
  ip: 'bg-red-500/20 text-red-400 border-red-500/30',
  domain: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  url: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  md5: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sha1: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sha256: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function IOCList({ iocs, compact = false }: IOCListProps) {
  const { toast } = useToast();

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copied',
      description: 'IOC copied to clipboard',
    });
  };

  if (!iocs || iocs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No IOCs extracted</p>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {iocs.slice(0, 5).map((ioc, idx) => (
          <Badge 
            key={idx} 
            variant="outline" 
            className={`text-xs ${IOC_COLORS[ioc.type] || ''}`}
          >
            {IOC_ICONS[ioc.type]}
            <span className="ml-1 truncate max-w-[100px]">{ioc.value}</span>
          </Badge>
        ))}
        {iocs.length > 5 && (
          <Badge variant="secondary" className="text-xs">
            +{iocs.length - 5} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">Indicators of Compromise</h4>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {iocs.map((ioc, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className={`text-xs shrink-0 ${IOC_COLORS[ioc.type] || ''}`}>
                {IOC_ICONS[ioc.type]}
                <span className="ml-1">{ioc.type}</span>
              </Badge>
              <span className="text-sm font-mono truncate">{ioc.value}</span>
              {ioc.count && ioc.count > 1 && (
                <Badge variant="secondary" className="text-xs">
                  ×{ioc.count}
                </Badge>
              )}
            </div>
            <button
              onClick={() => copyToClipboard(ioc.value)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
