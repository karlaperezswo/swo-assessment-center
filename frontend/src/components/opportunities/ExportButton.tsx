import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface ExportButtonProps {
  sessionId: string;
}

export function ExportButton({ sessionId }: ExportButtonProps) {
  const [format, setFormat] = useState<'pdf' | 'docx'>('docx');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await apiClient.post('/api/opportunities/export', {
        sessionId,
        format,
      });

      if (response.data.success) {
        const { downloadUrl, filename } = response.data.data;
        
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Playbook exportado exitosamente: ${filename}`);
      } else {
        toast.error(response.data.error || 'Error al exportar playbook');
      }
    } catch (err: any) {
      console.error('Error exporting playbook:', err);
      toast.error(err.response?.data?.error || 'Error al exportar playbook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'docx')}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">Word</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleExport} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exportar Playbook
          </>
        )}
      </Button>
    </div>
  );
}
