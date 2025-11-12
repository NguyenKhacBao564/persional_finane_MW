import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Alert, AlertDescription } from '@/ui/alert';

type WizardStep = 'upload' | 'map' | 'preview';

function ImportCsvWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('upload');

  const handleBack = () => {
    navigate('/transactions');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Transactions
      </Button>

      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === 'upload'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              1
            </div>
            <span className={step === 'upload' ? 'font-medium' : 'text-muted-foreground'}>
              Upload
            </span>
          </div>
          <div className="h-0.5 flex-1 bg-muted mx-4" />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === 'map'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </div>
            <span className={step === 'map' ? 'font-medium' : 'text-muted-foreground'}>
              Map Columns
            </span>
          </div>
          <div className="h-0.5 flex-1 bg-muted mx-4" />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3
            </div>
            <span className={step === 'preview' ? 'font-medium' : 'text-muted-foreground'}>
              Preview & Import
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Transactions from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file and map columns to import your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              CSV import feature is under development. The backend API is not yet complete.
              This interface is for preview purposes only.
            </AlertDescription>
          </Alert>

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Button disabled>Choose File</Button>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Maximum file size: 5MB</li>
                  <li>Required columns: Date, Amount, Type (IN/OUT or Income/Expense)</li>
                  <li>Optional columns: Note, Category, Account</li>
                  <li>Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map your CSV columns to transaction fields
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <span className="font-medium">CSV Column</span>
                  <span className="font-medium">Transaction Field</span>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review transactions before importing
              </p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'map') setStep('upload');
                else if (step === 'preview') setStep('map');
                else handleBack();
              }}
            >
              {step === 'upload' ? 'Cancel' : 'Back'}
            </Button>
            <Button
              disabled
              onClick={() => {
                if (step === 'upload') setStep('map');
                else if (step === 'map') setStep('preview');
              }}
            >
              {step === 'preview' ? 'Import Transactions' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ImportCsvWizard;
