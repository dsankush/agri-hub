'use client';

import { useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Badge } from '@/components/ui/components';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';

function UploadContent() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(ext || '')) {
      toast.error('Invalid file', 'Only CSV and XLSX files are supported');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        toast.success('Upload complete', `${data.data.successfulRows} of ${data.data.totalRows} rows imported`);
      } else {
        toast.error('Upload failed', data.error);
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bulk Upload</h1>
          <p className="text-gray-500 text-sm mt-1">Import products from CSV or Excel files</p>
        </div>

        {/* Drop Zone */}
        <Card className="p-8">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-300 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">CSV, XLSX up to 10MB</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileChange} />
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setResult(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={!file} loading={uploading}>
              <Upload className="w-4 h-4" /> Upload & Import
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Upload Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{result.totalRows}</p>
                <p className="text-xs text-gray-500">Total Rows</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{result.successfulRows}</p>
                <p className="text-xs text-emerald-600">Successful</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.failedRows}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Errors</h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.errors.map((err: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-red-50 rounded p-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-red-700">Row {err.row}: {err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Template Info */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3">CSV Template</h3>
          <p className="text-sm text-gray-600 mb-3">Your CSV should include these columns (at minimum: company_name, product_name):</p>
          <div className="flex flex-wrap gap-1.5">
            {['company_name', 'product_name', 'brand_name', 'product_type', 'sub_type',
              'applied_seasons', 'suitable_crops', 'dosage', 'application_method',
              'pack_sizes', 'price_range', 'organic_certified', 'iso_certified', 'govt_approved'].map(col => (
              <Badge key={col}>{col}</Badge>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Array fields (seasons, crops, etc.) can be comma or pipe-separated within the cell.</p>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function UploadPage() {
  return <ToastProvider><UploadContent /></ToastProvider>;
}
