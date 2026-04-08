import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { CarbonReportUploadResponse } from '@/types/assessment';
import apiClient from '@/lib/api';

interface CarbonReportUploaderProps {
  onDataLoaded: (data: CarbonReportUploadResponse, fileName?: string) => void;
  alreadyLoaded?: boolean;
  loadedFileName?: string;
}

export function CarbonReportUploader({ onDataLoaded, alreadyLoaded, loadedFileName }: CarbonReportUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>(() =>
    alreadyLoaded ? 'success' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>(loadedFileName ?? '');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      let result: any;

      try {
        // Intentar primero con S3
        const urlResponse = await apiClient.post('/api/report/get-upload-url', {
          filename: file.name,
          contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        if (!urlResponse.data.success) throw new Error('S3 URL failed');
        const { uploadUrl, key } = urlResponse.data.data;

        await fetch(uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        const response = await apiClient.post('/api/business-case/upload-carbon-report-from-s3', { key });
        result = response.data;
      } catch (_s3Error) {
        // Fallback: upload directo al backend
        console.warn('[CarbonReport] S3 no disponible, usando upload directo...');
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/business-case/upload-carbon-report', formData);
        result = response.data;
      }

      if (result.success) {
        setUploadStatus('success');
        onDataLoaded(result.data, file.name);
      } else {
        setUploadStatus('error');
        setErrorMessage(result.error || 'Error al procesar el archivo');
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          Reporte de Carbonización
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
              <p className="text-sm text-gray-600">Procesando archivo...</p>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-green-700">Archivo cargado exitosamente</p>
              <p className="text-xs text-gray-500">{fileName}</p>
              <p className="text-xs text-gray-400 mt-2">Arrastra otro archivo para reemplazar</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <p className="text-sm font-medium text-red-700">Error al procesar archivo</p>
              <p className="text-xs text-red-500">{errorMessage}</p>
              <p className="text-xs text-gray-400 mt-2">Arrastra otro archivo para intentar de nuevo</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra el archivo Excel aquí'}
                </p>
                <p className="text-xs text-gray-500 mt-1">o haz clic para seleccionar</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Archivo Excel con datos de carbonización (.xlsx)
              </p>
            </div>
          )}
        </div>

        {uploadStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Datos de carbonización cargados correctamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
