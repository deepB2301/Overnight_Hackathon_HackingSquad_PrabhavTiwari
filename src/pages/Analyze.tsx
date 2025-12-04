import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { URLScanner } from '@/components/URLScanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Shield, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  id: string;
  filename: string;
  attacks: number;
  status: 'processing' | 'completed' | 'failed';
}

export default function Analyze() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const getFileType = (filename: string): 'pcap' | 'log' | 'json' | 'csv' | null => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pcap') return 'pcap';
    if (ext === 'log' || ext === 'txt') return 'log';
    if (ext === 'json') return 'json';
    if (ext === 'csv') return 'csv';
    return null;
  };

  const handleFile = async (file: File) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    const fileType = getFileType(file.name);
    if (!fileType) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PCAP, LOG, TXT, JSON, or CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadResult({ id: '', filename: file.name, attacks: 0, status: 'processing' });

    try {
      // Create file record in database
      const { data: fileRecord, error: insertError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: fileType,
          file_size: file.size,
          status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadResult(prev => prev ? { ...prev, id: fileRecord.id } : null);

      // Read file content
      const content = await file.text();

      // Process file with AI
      const { data, error } = await supabase.functions.invoke('process-file', {
        body: {
          fileId: fileRecord.id,
          content,
          filename: file.name,
        },
      });

      if (error) throw error;

      setUploadResult({
        id: fileRecord.id,
        filename: file.name,
        attacks: data.attacks_found || 0,
        status: 'completed',
      });

      toast({
        title: 'Analysis Complete',
        description: `Found ${data.attacks_found || 0} potential threats.`,
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      setUploadResult(prev => prev ? { ...prev, status: 'failed' } : null);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <main className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="cyber" className="mb-4">AI-Powered Analysis</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Analyze <span className="text-gradient-cyber">Traffic</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload PCAP files, log files, or scan URLs in real-time using machine learning to detect malicious activity.
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
                Upload PCAP captures or server logs for AI-powered deep analysis
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
                    <p className="text-lg font-medium">Processing file with AI...</p>
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
                      Supports PCAP, Apache logs, Nginx logs, JSON, CSV
                    </p>
                    <Button variant="outline" asChild>
                      <label className="cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          className="hidden"
                          accept=".pcap,.log,.txt,.json,.csv"
                          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                      </label>
                    </Button>
                  </>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && uploadResult.status !== 'processing' && (
                <div className={cn(
                  "mt-6 p-4 rounded-xl border animate-fade-in",
                  uploadResult.status === 'completed' 
                    ? "bg-secondary/50 border-border/50" 
                    : "bg-destructive/10 border-destructive/30"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        uploadResult.status === 'completed' ? "bg-primary/10" : "bg-destructive/10"
                      )}>
                        {uploadResult.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{uploadResult.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {uploadResult.status === 'completed' ? 'Analysis complete' : 'Analysis failed'}
                        </p>
                      </div>
                    </div>
                    {uploadResult.status === 'completed' && (
                      <div className="text-right">
                        <div className={cn(
                          "flex items-center gap-2",
                          uploadResult.attacks > 0 ? "text-destructive" : "text-success"
                        )}>
                          {uploadResult.attacks > 0 ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="font-bold">{uploadResult.attacks}</span>
                          <span className="text-sm">threats found</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadResult.status === 'completed' && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="default" size="sm" asChild>
                        <a href="/dashboard">View in Dashboard</a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/reports">Generate Report</a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { name: 'PCAP Files', desc: 'Network packet captures' },
              { name: 'Server Logs', desc: 'Apache, Nginx, IIS' },
              { name: 'JSON/CSV', desc: 'Exported data formats' },
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
