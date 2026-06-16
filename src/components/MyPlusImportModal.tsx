'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { importCsvAction, quickAddLeadAction } from '@/lib/actions/imports';

type ImportResult = {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  total: number;
};

export function MyPlusImportModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'csv' | 'quick'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [listType, setListType] = useState('Expired');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Quick add form
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickSource, setQuickSource] = useState('MyPlus');
  const [quickListType, setQuickListType] = useState('Expired');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setImporting(false);
    setQuickFirstName('');
    setQuickLastName('');
    setQuickEmail('');
    setQuickPhone('');
    setQuickAddress('');
    setQuickSource('MyPlus');
    setQuickListType('Expired');
    setQuickNotes('');
  };

  const handleCsvImport = async () => {
    if (!file) {
      toast.error('Select a CSV file first.');
      return;
    }

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('listType', listType);

    try {
      const res = await importCsvAction(formData);
      if (res && 'error' in res) {
        toast.error(res.error as string);
      } else {
        setResult(res as ImportResult);
        if ((res as ImportResult).imported > 0) {
          toast.success(`Imported ${(res as ImportResult).imported} leads!`);
          router.refresh();
        }
      }
    } catch {
      toast.error('Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickAdding(true);

    const formData = new FormData();
    formData.append('firstName', quickFirstName);
    formData.append('lastName', quickLastName);
    formData.append('email', quickEmail);
    formData.append('phone', quickPhone);
    formData.append('address', quickAddress);
    formData.append('source', quickSource);
    formData.append('listType', quickListType);
    formData.append('notes', quickNotes);

    try {
      const res = await quickAddLeadAction(formData);
      if (res && 'error' in res) {
        toast.error(res.error as string);
      } else {
        toast.success('Lead added successfully!');
        setQuickFirstName('');
        setQuickLastName('');
        setQuickEmail('');
        setQuickPhone('');
        setQuickAddress('');
        setQuickNotes('');
        router.refresh();
      }
    } catch {
      toast.error('Failed to add lead.');
    } finally {
      setQuickAdding(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); resetForm(); }}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow text-sm"
      >
        <Download className="w-4 h-4" />
        Import from MyPlus
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Import from MyPlus Leads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import Expired, FSBO, and other lead lists into the CRM
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === 'csv'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-1.5" />
            CSV Import (Bulk)
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === 'quick'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-1.5" />
            Quick Add (Single)
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* CSV Import Tab */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              {/* Instructions */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm space-y-2">
                <p className="font-semibold text-foreground">How to export from MyPlus:</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">
                  <li>Log in to <a href="https://portal.myplusleads.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">portal.myplusleads.com</a></li>
                  <li>Go to <strong>Leads → Search Leads</strong> and filter by list type (Expired, FSBO, etc.)</li>
                  <li>Click the <strong>Export/Download CSV</strong> button</li>
                  <li>Save the CSV file and upload it here</li>
                </ol>
              </div>

              {/* List Type Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">List Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Expired', 'FSBO', 'Preforeclosure'].map(type => (
                    <button
                      key={type}
                      onClick={() => setListType(type)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        listType === type
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                      }`}
                    >
                      {type === 'Expired' ? '📋 Expired' : type === 'FSBO' ? '🏠 FSBO' : '⚠️ Preforeclosure'}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-primary mx-auto" />
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="font-semibold text-foreground">Drop CSV file here or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports MyPlus, MLS, and standard CSV formats</p>
                  </div>
                )}
              </div>

              {/* Import Button */}
              <button
                onClick={handleCsvImport}
                disabled={!file || importing}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {file ? file.name : 'CSV'}
                  </>
                )}
              </button>

              {/* Results */}
              {result && (
                <div className={`rounded-xl border p-4 space-y-2 ${
                  result.imported > 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.imported > 0
                      ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                      : <AlertCircle className="w-5 h-5 text-amber-500" />
                    }
                    <span className="font-semibold text-sm">
                      {result.imported > 0
                        ? `Imported ${result.imported} of ${result.total} leads`
                        : 'No new leads imported'
                      }
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Total: <strong>{result.total}</strong></div>
                    <div>Imported: <strong className="text-emerald-500">{result.imported}</strong></div>
                    <div>Skipped: <strong>{result.skipped}</strong></div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="text-xs text-red-500 mt-2">
                      {result.errors.length} error(s). Check console for details.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Add Tab */}
          {activeTab === 'quick' && (
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Copy lead details from MyPlus and paste them here for a single lead.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">First Name</label>
                  <input
                    type="text"
                    value={quickFirstName}
                    onChange={(e) => setQuickFirstName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={quickLastName}
                    onChange={(e) => setQuickLastName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                  <input
                    type="text"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="(586) 555-1234"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Property Address</label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="123 Main St, Macomb, MI 48042"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Source</label>
                  <input
                    type="text"
                    value={quickSource}
                    onChange={(e) => setQuickSource(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="MyPlus Expired"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">List Type</label>
                  <select
                    value={quickListType}
                    onChange={(e) => setQuickListType(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Expired">Expired</option>
                    <option value="FSBO">FSBO</option>
                    <option value="Preforeclosure">Preforeclosure</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes (optional)</label>
                <textarea
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Any notes from MyPlus about this lead..."
                />
              </div>

              <button
                type="submit"
                disabled={quickAdding}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {quickAdding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Add Lead to CRM</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
