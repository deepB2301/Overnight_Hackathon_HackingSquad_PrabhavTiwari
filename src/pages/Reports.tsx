import { Navbar } from '@/components/Navbar';
import { ReportGenerator } from '@/components/ReportGenerator';

export default function Reports() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Security Reports</h1>
            <p className="text-muted-foreground">Generate automated security analysis reports with AI insights</p>
          </div>

          <ReportGenerator />
        </div>
      </main>
    </div>
  );
}
