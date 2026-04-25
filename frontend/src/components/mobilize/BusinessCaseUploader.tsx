import { useCallback, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessCaseUploadResponse, BusinessCaseClientData } from '@/types/assessment';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { useActiveClouds } from '@/clouds/useActiveClouds';

interface BusinessCaseUploaderProps {
  onDataLoaded: (data: BusinessCaseUploadResponse, fileName?: string) => void;
  clientData: BusinessCaseClientData;
  alreadyLoaded?: boolean;
  loadedFileName?: string;
}

export function BusinessCaseUploader({ onDataLoaded, clientData, alreadyLoaded, loadedFileName }: BusinessCaseUploaderProps) {
  const { t } = useTranslation();
  const { state: cloudState } = useActiveClouds();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>(() =>
    alreadyLoaded ? 'success' : 'idle'
  );
  const [fileName, setFileName] = useState<string>(loadedFileName ?? '');
  const [fileSize, setFileSize] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setUploadState('uploading');
    setErrorMessage('');

    toast.loading(`Cargando ${file.name}...`, { id: 'business-case-upload' });

    try {
      setUploadProgress(t('uploader.uploading'));
      
      const useLocalUpload = import.meta.env.VITE_USE_LOCAL_UPLOAD === 'true';

      if (useLocalUpload) {
        // ========== MODO LOCAL: Upload directo sin S3 ==========
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientName', clientData.clientName);
        formData.append('assessmentTool', clientData.assessmentTool);
        if (clientData.otherToolName) formData.append('otherToolName', clientData.otherToolName);
        formData.append('vertical', clientData.vertical);
        formData.append('reportDate', clientData.reportDate);
        formData.append('awsRegion', clientData.awsRegion);
        formData.append('totalServers', clientData.totalServers.toString());
        formData.append('onPremisesCost', clientData.onPremisesCost.toString());
        formData.append('companyDescription', clientData.companyDescription);
        formData.append('priorities', JSON.stringify(clientData.priorities));
        formData.append('migrationReadiness', clientData.migrationReadiness);
        // Multi-cloud: send the active providers + per-cloud regions (AWS only
        // for now; other clouds default to their `defaultRegion` server-side).
        formData.append('selectedProviders', JSON.stringify(cloudState.active));
        formData.append('regions', JSON.stringify({ aws: clientData.awsRegion }));

        const response = await apiClient.post('/api/business-case/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          const uploadResponse: BusinessCaseUploadResponse = response.data.data;
          setUploadState('success');
          onDataLoaded(uploadResponse, file.name);
          const { summary } = uploadResponse;
          toast.success(`${clientData.clientName} - ${summary.dataSource} cargado: ${summary.totalServers} servidores`, {
            id: 'business-case-upload', duration: 5000
          });
        } else {
          throw new Error(response.data.error || 'Upload failed');
        }
      } else {
        // ========== MODO PRODUCCIÓN: Upload con S3 ==========
        setUploadProgress(t('uploader.preparing'));
        const urlResponse = await apiClient.post('/api/report/get-upload-url', {
          filename: file.name,
          contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        if (!urlResponse.data.success) throw new Error(urlResponse.data.error || 'Failed to get upload URL');
        const { uploadUrl, key } = urlResponse.data.data;

        setUploadProgress(t('uploader.uploadingS3'));
        await fetch(uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        setUploadProgress(t('uploader.analyzing'));
        const response = await apiClient.post('/api/business-case/upload-from-s3', {
          key,
          clientName: clientData.clientName,
          assessmentTool: clientData.assessmentTool,
          otherToolName: clientData.otherToolName,
          vertical: clientData.vertical,
          reportDate: clientData.reportDate,
          awsRegion: clientData.awsRegion,
          totalServers: clientData.totalServers,
          onPremisesCost: clientData.onPremisesCost,
          companyDescription: clientData.companyDescription,
          priorities: clientData.priorities,
          migrationReadiness: clientData.migrationReadiness,
          selectedProviders: cloudState.active,
          regions: { aws: clientData.awsRegion },
        });

        if (response.data.success) {
          const uploadResponse: BusinessCaseUploadResponse = response.data.data;
          setUploadState('success');
          onDataLoaded(uploadResponse, file.name);
          const { summary } = uploadResponse;
          toast.success(`${clientData.clientName} - ${summary.dataSource} cargado: ${summary.totalServers} servidores`, {
            id: 'business-case-upload', duration: 5000
          });
        } else {
          throw new Error(response.data.error || 'Upload failed');
        }
      }
    } catch (error) {
      setUploadState('error');
      const raw = error instanceof Error ? error.message : 'Failed to upload file';
      const isNetworkError = raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('network') || raw.toLowerCase().includes('failed');
      const message = isNetworkError
        ? t('businessCaseUploader.networkError')
        : raw;
      setErrorMessage(message);
      toast.error(`Error al cargar archivo: ${message}`, {
        id: 'business-case-upload',
        duration: 7000
      });
    }
  }, [onDataLoaded, clientData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t('businessCaseUploader.title')}
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
                {isDragActive ? t('uploader.dragActive') : t('uploader.dragInactive')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t('uploader.clickSelect')}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                {t('businessCaseUploader.supportedFiles')}
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
            </>
          )}

          {uploadState === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 animate-in zoom-in duration-300" />
              <p className="text-lg font-medium text-green-700">{fileName}</p>
              <p className="text-xs text-gray-500">{fileSize}</p>
              <p className="text-sm text-green-600 mt-2">{t('uploader.success')}</p>
            </>
          )}

          {uploadState === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-lg font-medium text-red-700">{t('uploader.failed')}</p>
              <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
              <p className="text-sm text-gray-500 mt-2">{t('uploader.retryHint')}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
