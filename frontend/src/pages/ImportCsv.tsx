import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/button';
import { ImportWizard } from '@/features/import-csv/ImportWizard';

function ImportCsvPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/transactions')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Transactions
      </Button>

      <ImportWizard />
    </div>
  );
}

export default ImportCsvPage;
