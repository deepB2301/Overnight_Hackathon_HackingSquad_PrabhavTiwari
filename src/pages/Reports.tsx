import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock,
  TrendingUp,
  Shield,
  Eye
} from 'lucide-react';

const reports = [
  {
    id: 1,
    title: 'Weekly Security Summary',
    type: 'Summary',
    date: 'Dec 1, 2024',
    attacks: 1247,
    status: 'ready',
  },
  {
    id: 2,
    title: 'SQL Injection Analysis',
    type: 'Deep Dive',
    date: 'Nov 28, 2024',
    attacks: 423,
    status: 'ready',
  },
  {
    id: 3,
    title: 'Monthly Executive Report',
    type: 'Executive',
    date: 'Nov 30, 2024',
    attacks: 5621,
    status: 'ready',
  },
  {
    id: 4,
    title: 'Critical Incidents Report',
    type: 'Incident',
    date: 'Dec 3, 2024',
    attacks: 89,
    status: 'generating',
  },
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Security Reports</h1>
              <p className="text-muted-foreground">Generate and download security analysis reports</p>
            </div>
            <Button variant="cyber">
              <FileText className="h-4 w-4 mr-2" />
              Generate New Report
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card variant="cyber" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Reports this month</p>
                </div>
              </div>
            </Card>
            <Card variant="cyber" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">98.7%</p>
                  <p className="text-sm text-muted-foreground">Avg detection rate</p>
                </div>
              </div>
            </Card>
            <Card variant="cyber" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Weekly</p>
                  <p className="text-sm text-muted-foreground">Schedule active</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Download or view your generated security reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{report.title}</p>
                          <Badge variant="secondary">{report.type}</Badge>
                          {report.status === 'generating' && (
                            <Badge variant="warning">Generating...</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {report.attacks.toLocaleString()} attacks analyzed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={report.status === 'generating'}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card variant="glass" className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/10">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Automated Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary reports are sent every Monday at 9:00 AM
                    </p>
                  </div>
                </div>
                <Button variant="outline">Configure Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
