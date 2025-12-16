import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadCsv, previewImport, commitImport } from '@/api/imports';
import type { ColumnMapping, ImportOptions, PreviewRow } from '@/api/imports';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import { Alert, AlertDescription } from '@/ui/alert';

type WizardStep = 'upload' | 'map' | 'preview';

interface WizardState {
  cursorId: string | null;
  headers: string[];
  sample: Array<Record<string, string>>;
  totalRows: number;
  hasMore: boolean;
  mapping: Partial<ColumnMapping>;
  options: ImportOptions;
  previewData: PreviewRow[];
  validCount: number;
  invalidCount: number;
}

const REQUIRED_FIELDS = ['date', 'amount', 'type'] as const;
const OPTIONAL_FIELDS = ['note', 'category', 'account'] as const;

export function ImportWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<WizardState>({
    cursorId: null,
    headers: [],
    sample: [],
    totalRows: 0,
    hasMore: false,
    mapping: {},
    options: { dateFormat: 'YYYY-MM-DD', hasHeader: true },
    previewData: [],
    validCount: 0,
    invalidCount: 0,
  });

  // Step 1: Upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }

    setIsLoading(true);
    try {
      const result = await uploadCsv(file);
      setState((prev) => ({
        ...prev,
        cursorId: result.cursorId,
        headers: result.headers,
        sample: result.sample,
        totalRows: result.totalRows,
        hasMore: result.hasMore,
      }));
      toast.success(`File uploaded: ${result.totalRows} rows detected`);
      setStep('map');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2: Validate mapping
  const handleMapNext = useCallback(async () => {
    // Validate required mappings
    const missing = REQUIRED_FIELDS.filter((field) => state.mapping[field] === undefined);
    if (missing.length > 0) {
      toast.error(`Please map required fields: ${missing.join(', ')}`);
      return;
    }

    if (!state.cursorId) {
      toast.error('Session expired, please upload again');
      setStep('upload');
      return;
    }

    setIsLoading(true);
    try {
      const result = await previewImport(
        state.cursorId,
        state.mapping as ColumnMapping,
        state.options
      );
      setState((prev) => ({
        ...prev,
        previewData: result.rows,
        validCount: result.validCount,
        invalidCount: result.invalidCount,
      }));
      toast.success(`Preview ready: ${result.validCount} valid, ${result.invalidCount} invalid`);
      setStep('preview');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setIsLoading(false);
    }
  }, [state.cursorId, state.mapping, state.options]);

  // Step 3: Commit
  const handleCommit = useCallback(async () => {
    if (!state.cursorId) {
      toast.error('Session expired');
      return;
    }

    setIsLoading(true);
    try {
      const result = await commitImport(
        state.cursorId,
        state.mapping as ColumnMapping,
        state.options,
        true
      );
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success(
        `Import complete: ${result.inserted} inserted, ${result.skipped} skipped`
      );

      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }

      navigate('/transactions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  }, [state.cursorId, state.mapping, state.options, navigate, queryClient]);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { key: 'upload', label: 'Upload', icon: Upload },
          { key: 'map', label: 'Map Columns', icon: FileText },
          { key: 'preview', label: 'Preview & Import', icon: CheckCircle },
        ].map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const isCompleted = 
            (s.key === 'upload' && (step === 'map' || step === 'preview')) ||
            (s.key === 'map' && step === 'preview');

          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>
                {s.label}
              </span>
              {idx < 2 && <div className="h-0.5 w-12 bg-muted mx-2" />}
            </div>
          );
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload your transaction history in CSV format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Maximum file size: 5MB
                </p>
                <label htmlFor="file-upload">
                  <Button asChild disabled={isLoading}>
                    <span>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Choose File
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>File must be smaller than 5MB</li>
                  <li>First row should contain column headers</li>
                  <li>Required columns: Date, Amount, Type (IN/OUT or Income/Expense)</li>
                  <li>Optional columns: Note, Category, Account</li>
                  <li>Date formats supported: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Map Columns */}
      {step === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to transaction fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {state.totalRows} rows detected. {state.hasMore && 'Showing first 2,000 rows.'}
                </AlertDescription>
              </Alert>

              {/* Date Format Option */}
              <div>
                <Label>Date Format in CSV</Label>
                <Select
                  value={state.options.dateFormat}
                  onValueChange={(value) =>
                    setState((prev) => ({
                      ...prev,
                      options: { ...prev.options, dateFormat: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-01-15)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (15/01/2025)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/15/2025)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Required Field Mappings */}
              <div className="space-y-4">
                <h4 className="font-medium">Required Fields</h4>
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field}>
                    <Label className="capitalize">{field}</Label>
                    <Select
                      value={state.mapping[field]?.toString()}
                      onValueChange={(value) =>
                        setState((prev) => ({
                          ...prev,
                          mapping: { ...prev.mapping, [field]: parseInt(value) },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field} column`} />
                      </SelectTrigger>
                      <SelectContent>
                        {state.headers.map((header, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {header} (sample: {state.sample[0]?.[header] || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Optional Field Mappings */}
              <div className="space-y-4">
                <h4 className="font-medium">Optional Fields</h4>
                {OPTIONAL_FIELDS.map((field) => (
                  <div key={field}>
                    <Label className="capitalize">{field}</Label>
                    <Select
                      value={state.mapping[field]?.toString() || 'skip'}
                      onValueChange={(value) =>
                        setState((prev) => ({
                          ...prev,
                          mapping: {
                            ...prev.mapping,
                            [field]: value === 'skip' ? undefined : parseInt(value),
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Skip this field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip this field</SelectItem>
                        {state.headers.map((header, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {header} (sample: {state.sample[0]?.[header] || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={handleMapNext} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Preview Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview & Import */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Import</CardTitle>
            <CardDescription>
              Review the first 200 rows before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{state.validCount}</div>
                  <div className="text-sm text-muted-foreground">Valid Rows</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{state.invalidCount}</div>
                  <div className="text-sm text-muted-foreground">Invalid Rows</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{state.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.previewData.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx} className={!row.valid ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div title={row.errors.join(', ')}>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{row.txDate || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={
                              row.type === 'IN' ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {row.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.amount?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="truncate max-w-32">
                          {row.categoryId || '-'}
                        </TableCell>
                        <TableCell className="truncate max-w-48">
                          {row.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {state.invalidCount > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {state.invalidCount} row(s) have validation errors and will be skipped.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('map')}>
                  Back to Mapping
                </Button>
                <Button
                  onClick={handleCommit}
                  disabled={isLoading || state.validCount === 0}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import {state.validCount} Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
