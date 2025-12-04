import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatrixRain } from '@/components/MatrixRain';
import { URLScanner } from '@/components/URLScanner';
import { LiveCounter } from '@/components/LiveCounter';
import { Navbar } from '@/components/Navbar';
import { 
  Shield, 
  Zap, 
  Brain, 
  Lock, 
  BarChart3, 
  Globe, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Detection',
    description: 'Advanced machine learning models trained on millions of attack patterns detect threats in real-time.',
    badge: 'ML Engine',
  },
  {
    icon: Zap,
    title: 'Real-Time Analysis',
    description: 'Process HTTP traffic instantly with sub-millisecond latency. No delays, no blind spots.',
    badge: 'Fast',
  },
  {
    icon: Shield,
    title: 'Multi-Layer Defense',
    description: 'Detect SQL injection, XSS, CSRF, RCE, and dozens of other attack vectors simultaneously.',
    badge: 'Comprehensive',
  },
  {
    icon: BarChart3,
    title: 'Success Classification',
    description: 'Distinguish between blocked attempts and successful breaches. Know your actual risk.',
    badge: 'Smart',
  },
  {
    icon: Globe,
    title: 'Global Threat Intel',
    description: 'Leverage threat intelligence from attacks detected across our global network.',
    badge: 'Intel',
  },
  {
    icon: Lock,
    title: 'Zero Trust Ready',
    description: 'Built for modern security architectures with API-first design and seamless integration.',
    badge: 'Enterprise',
  },
];

const attackTypes = [
  { name: 'SQL Injection', count: 8942, blocked: 99.2 },
  { name: 'Cross-Site Scripting', count: 6721, blocked: 98.7 },
  { name: 'Remote Code Execution', count: 2134, blocked: 99.8 },
  { name: 'Path Traversal', count: 4567, blocked: 97.9 },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 animate-fade-in">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">
                <LiveCounter initialValue={24892} incrementRange={[1, 3]} className="text-primary" /> attacks analyzed today
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="text-foreground">Detect & Neutralize</span>
              <br />
              <span className="text-gradient-cyber glow-text">Cyber Attacks</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              AI-powered HTTP traffic analysis that identifies SQL injections, XSS, and sophisticated attacks—distinguishing attempts from successful breaches in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="cyber" size="xl" asChild>
                <Link to="/dashboard">
                  Launch Dashboard
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl">
                View Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                99.8% Detection Rate
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                &lt;10ms Latency
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                SOC 2 Compliant
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <Badge variant="cyber" className="mb-4">Try It Now</Badge>
            <h2 className="text-3xl font-bold mb-2">Interactive Threat Scanner</h2>
            <p className="text-muted-foreground">Test our detection engine with sample attack payloads</p>
          </div>
          <URLScanner />
        </section>

        {/* Stats Bar */}
        <section className="container mx-auto px-4 py-16">
          <Card variant="glass" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
                {attackTypes.map((type, i) => (
                  <div key={type.name} className="p-6 text-center group hover:bg-primary/5 transition-colors">
                    <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {type.count.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">{type.name}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-success">
                      <Shield className="h-3 w-3" />
                      {type.blocked}% blocked
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Badge variant="accent" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade Security,<br />
              <span className="text-gradient-cyber">Simplified</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to monitor, detect, and respond to web application attacks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={feature.title} 
                variant="cyber" 
                className="group animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card variant="cyber" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <CardContent className="relative p-8 md:p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Don't Wait for a Breach
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Start protecting your applications today. Set up in minutes, not days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="cyber" size="lg" asChild>
                  <Link to="/dashboard">Start Free Trial</Link>
                </Button>
                <Button variant="outline" size="lg">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold">CyberShield</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 CyberShield. Protecting the digital frontier.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
