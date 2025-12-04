import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatsCard } from '@/components/StatsCard';
import { AttackCard } from '@/components/AttackCard';
import { AttackChart } from '@/components/AttackChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  generateAttacks, 
  generateStats, 
  Attack, 
  AttackStats,
  attackTypeColors
} from '@/lib/mock-data';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Download,
  Filter,
  Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [stats, setStats] = useState<AttackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    setAttacks(generateAttacks(20));
    setStats(generateStats());
    setLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setAttacks(prev => {
        const newAttack = generateAttacks(1)[0];
        return [newAttack, ...prev.slice(0, 19)];
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setAttacks(generateAttacks(20));
      setStats(generateStats());
      setLoading(false);
    }, 500);
  };

  // Calculate attack type distribution
  const attackTypeDistribution = attacks.reduce((acc, attack) => {
    acc[attack.attackType] = (acc[attack.attackType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(attackTypeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#00ff88', '#a855f7', '#facc15', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

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
              <Button variant="outline" size="sm" onClick={refresh}>
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Attacks"
              value={stats.total}
              change="+12.5% from last week"
              changeType="negative"
              icon={Activity}
              variant="cyber"
            />
            <StatsCard
              title="Blocked"
              value={stats.blocked}
              change="97% success rate"
              changeType="positive"
              icon={Shield}
              variant="success"
            />
            <StatsCard
              title="Successful Breaches"
              value={stats.successful}
              change="-8% from last week"
              changeType="positive"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatsCard
              title="Critical Threats"
              value={stats.critical}
              change="Requires attention"
              changeType="negative"
              icon={Zap}
              variant="warning"
            />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Timeline Chart */}
            <AttackChart data={stats.trends} />

            {/* Attack Distribution */}
            <Card variant="cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  Attack Types
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Recent Attacks */}
          <Card variant="cyber">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Recent Attacks
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Live feed of detected threats
                </p>
              </div>
              <Badge variant="cyber" className="gap-1">
                <Activity className="h-3 w-3" />
                Live
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {attacks.map((attack, i) => (
                  <div
                    key={attack.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <AttackCard attack={attack} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
