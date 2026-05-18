import { Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  description: string;
  rowCount?: number;
  onDownloadCsv: () => void;
  onDownloadExcel?: () => void;
  onDownloadPdf?: () => void;
  loading?: boolean;
}

export default function ReportCard({
  title, description, rowCount, onDownloadCsv, onDownloadExcel, onDownloadPdf, loading
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        {rowCount !== undefined && (
          <span className="text-2xl font-bold text-slate-700">{rowCount}</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={onDownloadCsv}
            disabled={loading || rowCount === 0}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Завантаження...' : 'Завантажити CSV'}
          </Button>
          {onDownloadExcel && (
            <Button
              variant="outline"
              onClick={onDownloadExcel}
              disabled={loading || rowCount === 0}
              className="w-full text-green-700 border-green-300 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Завантажити Excel
            </Button>
          )}
          {onDownloadPdf && (
            <Button
              variant="outline"
              onClick={onDownloadPdf}
              disabled={loading || rowCount === 0}
              className="w-full text-red-700 border-red-300 hover:bg-red-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Завантажити PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}