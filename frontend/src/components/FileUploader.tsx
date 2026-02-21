import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExcelData, UploadSummary } from '@/types/assessment';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface FileUploaderProps {
  onDataLoaded: (data: ExcelData, summary: UploadSummary) => void;
}

// Helper function to get data source label
const getDataSourceLabel = (dataSource?: string): string => {
  switch (dataSource) {
    case 'AWS_MPA':
      return 'AWS MPA';
    case 'CONCIERTO':
      return 'Concierto MPA';
    case 'MATILDA':
      return 'Matilda';
    case 'UNKNOWN':
      return 'Archivo';
    default:
      return 'Archivo';
  }
};

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setUploadState('uploading');
    setErrorMessage('');

    toast.loading(`Cargando ${file.name}...`, { id: 'file-upload' });

    try {
      // Step 1: Get pre-signed URL for S3 upload
      setUploadProgress('Preparando carga...');
      const urlResponse = await apiClient.post('/api/report/get-upload-url', {
        filename: file.name,
        contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      if (!urlResponse.data.success) {
        throw new Error(urlResponse.data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = urlResponse.data.data;

      // Step 2: Upload file directly to S3
      setUploadProgress('Subiendo a S3...');
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      // Step 3: Process file from S3
      setUploadProgress('Analizando datos...');
      const response = await apiClient.post('/api/report/upload-from-s3', {
        key
      });

      if (response.data.success) {
        const { excelData, summary } = response.data.data;
        setSummary(summary);
        setUploadState('success');
        onDataLoaded(excelData, summary);

        // Create success message with data source info
        const dataSourceLabel = getDataSourceLabel(summary.dataSource);
        const successMsg = `${dataSourceLabel} cargado: ${summary.serverCount} servidores, ${summary.databaseCount} bases de datos${
          summary.communicationCount ? `, ${summary.communicationCount} conexiones` : ''
        }`;

        toast.success(successMsg, {
          id: 'file-upload',
          duration: 5000
        });
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadState('error');
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      setErrorMessage(message);
      toast.error(`Error al cargar archivo: ${message}`, {
        id: 'file-upload',
        duration: 7000
      });
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Cargar Excel MPA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out transform
            ${isDragActive ? 'border-primary bg-primary/10 scale-105 shadow-lg' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
            ${uploadState === 'success' ? 'border-green-500 bg-green-50' : ''}
            ${uploadState === 'error' ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />

          {uploadState === 'idle' && (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Suelta el archivo Excel aquí' : 'Arrastra y suelta el archivo Excel aquí'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                o haz clic para seleccionar archivo (.xlsx)
              </p>
            </>
          )}

          {uploadState === 'uploading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">{fileName}</p>
              <p className="text-sm text-gray-500">{fileSize}</p>
              <div className="mt-4 space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
                <p className="text-sm text-primary font-medium animate-pulse">
                  {uploadProgress}
                </p>
              </div>
              {uploadProgress === 'Analizando datos...' && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded p-3 space-y-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="bg-white rounded p-3 space-y-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="bg-white rounded p-3 space-y-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="bg-white rounded p-3 space-y-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              )}
            </>
          )}

          {uploadState === 'success' && summary && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 animate-in zoom-in duration-300" />
              <p className="text-lg font-medium text-green-700">{fileName}</p>
              <p className="text-xs text-gray-500">{fileSize}</p>
              {summary.dataSource && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getDataSourceLabel(summary.dataSource)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-white rounded p-2">
                  <span className="font-bold text-2xl text-primary">{summary.serverCount}</span>
                  <p className="text-gray-600">Servidores</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-bold text-2xl text-primary">{summary.databaseCount}</span>
                  <p className="text-gray-600">Bases de Datos</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-bold text-2xl text-primary">{summary.applicationCount}</span>
                  <p className="text-gray-600">Aplicaciones</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-bold text-2xl text-primary">{summary.totalStorageGB.toFixed(0)}</span>
                  <p className="text-gray-600">GB Totales</p>
                </div>
                {summary.communicationCount !== undefined && summary.communicationCount > 0 && (
                  <div className="bg-white rounded p-2">
                    <span className="font-bold text-2xl text-primary">{summary.communicationCount}</span>
                    <p className="text-gray-600">Conexiones</p>
                  </div>
                )}
                {summary.securityGroupCount !== undefined && summary.securityGroupCount > 0 && (
                  <div className="bg-white rounded p-2">
                    <span className="font-bold text-2xl text-primary">{summary.securityGroupCount}</span>
                    <p className="text-gray-600">Grupos Seg.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {uploadState === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-lg font-medium text-red-700">Carga Fallida</p>
              <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
              <p className="text-sm text-gray-500 mt-2">Haz clic para intentar de nuevo</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
