import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface AttackSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  attackType: string;
  severity: string;
  timeRange: string;
  isSuccess: string;
}

const ATTACK_TYPES = [
  'all',
  'sql_injection',
  'xss',
  'path_traversal',
  'command_injection',
  'xxe',
  'ssrf',
  'lfi',
  'rce',
  'brute_force',
  'dos',
];

export function AttackSearch({ onSearch }: AttackSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    attackType: 'all',
    severity: 'all',
    timeRange: '7d',
    isSuccess: 'all',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      attackType: 'all',
      severity: 'all',
      timeRange: '7d',
      isSuccess: 'all',
    };
    setFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  const hasActiveFilters = 
    filters.query || 
    filters.attackType !== 'all' || 
    filters.severity !== 'all' || 
    filters.isSuccess !== 'all';

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attacks by URL, IP, or payload..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={showAdvanced ? 'bg-primary/10' : ''}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Attack Type</label>
            <Select 
              value={filters.attackType} 
              onValueChange={(v) => handleFilterChange('attackType', v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTACK_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
            <Select 
              value={filters.severity} 
              onValueChange={(v) => handleFilterChange('severity', v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Time Range</label>
            <Select 
              value={filters.timeRange} 
              onValueChange={(v) => handleFilterChange('timeRange', v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select 
              value={filters.isSuccess} 
              onValueChange={(v) => handleFilterChange('isSuccess', v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.query}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('query', '')} 
              />
            </Badge>
          )}
          {filters.attackType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.attackType}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('attackType', 'all')} 
              />
            </Badge>
          )}
          {filters.severity !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Severity: {filters.severity}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('severity', 'all')} 
              />
            </Badge>
          )}
          {filters.isSuccess !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.isSuccess}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('isSuccess', 'all')} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
