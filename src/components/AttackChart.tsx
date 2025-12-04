import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AttackChartProps {
  data: { time: string; attacks: number; blocked: number }[];
}

export function AttackChart({ data }: AttackChartProps) {
  return (
    <Card variant="cyber" className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Attack Timeline (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(165, 100%, 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(165, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(220, 20%, 15%)" 
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 20%, 7%)',
                  border: '1px solid hsl(165, 100%, 50%, 0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 0 20px hsl(165, 100%, 50%, 0.2)',
                }}
                labelStyle={{ color: 'hsl(180, 100%, 95%)' }}
                itemStyle={{ color: 'hsl(165, 100%, 50%)' }}
              />
              <Area
                type="monotone"
                dataKey="attacks"
                stroke="hsl(165, 100%, 50%)"
                strokeWidth={2}
                fill="url(#attackGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: 'hsl(165, 100%, 50%)',
                  stroke: 'hsl(220, 20%, 4%)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
