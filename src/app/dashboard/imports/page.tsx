'use client';
// Data imports — bulk import leads, contacts, and listings from CSV/Excel.
// API: /api/imports (POST multipart form data with file field).

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ImportsPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/imports', { method: 'POST', body: fd });
      const data = await res.json();
      setResult(data.message || data.error || 'Import complete');
    } catch (err) {
      setResult('Upload failed');
    } finally { setUploading(false); }
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" /> Data Imports
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">Bulk import leads, contacts, and listings from CSV or Excel files.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Upload CSV or Excel files to bulk-import leads, contacts, and listings.</p>

        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}>
          {uploading ? (
            <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          )}
          <p className="font-medium mb-1">{uploading ? 'Importing...' : 'Drop file here or click to browse'}</p>
          <p className="text-xs text-muted-foreground">Supports CSV, XLSX, XLS (max 10MB)</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" />
        </div>
        {result && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" /> {result}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
