import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { URLScanner } from '@/components/URLScanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Analyze() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<null | { 
    filename: string; 
    attacks: number; 
    status: 'processing' | 'complete';
  }>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadResult({ filename: file.name, attacks: 0, status: 'processing' });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setUploadResult({
      filename: file.name,
      attacks: Math.floor(Math.random() * 150) + 20,
      status: 'complete',
    });
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="cyber" className="mb-4">Analysis Tools</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Analyze <span className="text-gradient-cyber">Traffic</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload PCAP files, log files, or scan URLs in real-time to detect malicious activity.
            </p>
          </div>

          {/* URL Scanner */}
          <div className="mb-12">
            <URLScanner />
          </div>

          {/* File Upload */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                File Analysis
              </CardTitle>
              <CardDescription>
                Upload PCAP captures or server logs for deep analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 hover:border-primary/50",
                  uploading && "pointer-events-none opacity-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-lg font-medium">Processing file...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing traffic patterns and detecting threats
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Drag and drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports PCAP, Apache logs, Nginx logs, IIS logs
                    </p>
                    <Button variant="outline" asChild>
                      <label className="cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          className="hidden"
                          accept=".pcap,.log,.txt,.json"
                          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                      </label>
                    </Button>
                  </>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && uploadResult.status === 'complete' && (
                <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/50 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{uploadResult.filename}</p>
                        <p className="text-sm text-muted-foreground">Analysis complete</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-bold">{uploadResult.attacks}</span>
                        <span className="text-sm">threats found</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="default" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Export Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { name: 'PCAP Files', desc: 'Network packet captures' },
              { name: 'Server Logs', desc: 'Apache, Nginx, IIS' },
              { name: 'JSON Exports', desc: 'From other tools' },
            ].map((format) => (
              <Card key={format.name} variant="glass" className="text-center p-4">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{format.name}</p>
                <p className="text-xs text-muted-foreground">{format.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
