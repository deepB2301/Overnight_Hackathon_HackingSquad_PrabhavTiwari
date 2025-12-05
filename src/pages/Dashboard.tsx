import { Navbar } from '@/components/Navbar';
import { StatsCard } from '@/components/StatsCard';
import { AttackCard } from '@/components/AttackCard';
import { AttackChart } from '@/components/AttackChart';
import { AttackGlobe } from '@/components/AttackGlobe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAttacks, Attack } from '@/hooks/useAttacks';
import { 
  Shield, 
  AlertTriangle, 
  Activity,
  RefreshCw,
  Download,
  Filter,
  Zap,
  Database
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const { attacks, stats, loading, refetch } = useAttacks();

  // Generate chart data from real attacks
  const generateTrendData = () => {
    const now = new Date();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 3600000);
      const hourStr = hour.toISOString().slice(0, 13);
      const hourAttacks = attacks.filter(a => a.detected_at.slice(0, 13) === hourStr);
      data.push({
        time: `${hour.getHours()}:00`,
        attacks: hourAttacks.length,
        blocked: hourAttacks.filter(a => !a.is_success).length,
      });
    }
    return data;
  };

  const pieData = stats?.byType 
    ? Object.entries(stats.byType).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#00ff88', '#a855f7', '#facc15', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const displayAttacks: Attack[] = attacks.length > 0 ? attacks : [];
  const displayStats = stats || { total: 0, blocked: 0, successful: 0, critical: 0, byType: {}, bySeverity: {} };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Security Dashboard</h1>
              <p className="text-muted-foreground">Real-time threat monitoring and analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="default" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Empty State */}
          {attacks.length === 0 && (
            <Card variant="cyber" className="mb-8">
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Attacks Detected Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start analyzing URLs or upload log files to detect threats.
                </p>
                <Button variant="cyber" asChild>
                  <a href="/analyze">Start Analyzing</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Attacks"
              value={displayStats.total}
              change={displayStats.total > 0 ? "Detected threats" : "No threats yet"}
              changeType={displayStats.total > 0 ? "negative" : "neutral"}
              icon={Activity}
              variant="cyber"
            />
            <StatsCard
              title="Blocked"
              value={displayStats.blocked}
              change={displayStats.total > 0 ? `${Math.round((displayStats.blocked / displayStats.total) * 100) || 0}% block rate` : "N/A"}
              changeType="positive"
              icon={Shield}
              variant="success"
            />
            <StatsCard
              title="Successful Breaches"
              value={displayStats.successful}
              change={displayStats.successful > 0 ? "Requires review" : "None detected"}
              changeType={displayStats.successful > 0 ? "negative" : "positive"}
              icon={AlertTriangle}
              variant="danger"
            />
            <StatsCard
              title="Critical Threats"
              value={displayStats.critical}
              change={displayStats.critical > 0 ? "Immediate action" : "All clear"}
              changeType={displayStats.critical > 0 ? "negative" : "positive"}
              icon={Zap}
              variant="warning"
            />
          </div>

          {/* Globe Visualization */}
          {attacks.length > 0 && (
            <div className="mb-8">
              <AttackGlobe attacks={attacks} />
            </div>
          )}

          {/* Charts Row */}
          {attacks.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Timeline Chart */}
              <AttackChart data={generateTrendData()} />

              {/* Attack Distribution */}
              <Card variant="cyber">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    Attack Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]}
                                  stroke="hsl(220, 20%, 7%)"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(220, 20%, 7%)',
                                border: '1px solid hsl(165, 100%, 50%, 0.3)',
                                borderRadius: '8px',
                              }}
                              labelStyle={{ color: 'hsl(180, 100%, 95%)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {pieData.slice(0, 4).map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: COLORS[index] }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No attack data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Attacks */}
          {attacks.length > 0 && (
            <Card variant="cyber">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    Recent Attacks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your detected security threats
                  </p>
                </div>
                <Badge variant="cyber" className="gap-1">
                  <Activity className="h-3 w-3" />
                  {attacks.length} total
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {displayAttacks.map((attack, i) => (
                    <div
                      key={attack.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <AttackCard attack={{
                        id: attack.id,
                        timestamp: new Date(attack.detected_at),
                        sourceIp: attack.source_ip || 'Unknown',
                        targetUrl: attack.target_url,
                        attackType: attack.attack_type,
                        severity: attack.severity,
                        confidence: attack.confidence,
                        isBlocked: !attack.is_success,
                      }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
