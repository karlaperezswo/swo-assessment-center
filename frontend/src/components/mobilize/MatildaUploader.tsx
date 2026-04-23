import { useState, useRef } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { BusinessCaseUploadResponse, BusinessCaseClientData, TCO1YearUploadResponse } from '@/types/assessment';

interface MatildaUploaderProps {
  onBusinessCaseLoaded: (data: BusinessCaseUploadResponse) => void;
  onTCO1YearLoaded: (data: TCO1YearUploadResponse) => void;
  clientData: BusinessCaseClientData;
}

export function MatildaUploader({ onBusinessCaseLoaded, onTCO1YearLoaded, clientData }: MatildaUploaderProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storageIncrement, setStorageIncrement] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setUploadSuccess(false);
        setUploadError(null);
      } else {
        setUploadError(t('matildaUploader.invalidFile'));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setUploadSuccess(false);
        setUploadError(null);
      } else {
        setUploadError(t('matildaUploader.invalidFile'));
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    console.log('[MatildaUploader] Starting upload...');
    console.log('[MatildaUploader] File:', file?.name);
    console.log('[MatildaUploader] Client Data:', clientData);
    
    if (!file) {
      setUploadError('Por favor selecciona un archivo');
      return;
    }

    if (!clientData.clientName || clientData.clientName.trim() === '') {
      setUploadError('Por favor completa el nombre del cliente en el formulario de la derecha');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const useLocalUpload = import.meta.env.VITE_USE_LOCAL_UPLOAD === 'true';
      const API_URL = import.meta.env.VITE_API_URL || '';

      if (useLocalUpload) {
        // ========== MODO LOCAL ==========
        const formDataBC = new FormData();
        formDataBC.append('file', file);
        formDataBC.append('clientName', clientData.clientName);
        formDataBC.append('assessmentTool', 'Matilda');
        if (clientData.otherToolName) formDataBC.append('otherToolName', clientData.otherToolName);
        formDataBC.append('vertical', clientData.vertical || 'Technology');
        formDataBC.append('reportDate', clientData.reportDate || new Date().toISOString().split('T')[0]);
        formDataBC.append('awsRegion', clientData.awsRegion || 'us-east-1');
        formDataBC.append('totalServers', (clientData.totalServers || 0).toString());
        formDataBC.append('onPremisesCost', (clientData.onPremisesCost || 0).toString());
        formDataBC.append('companyDescription', clientData.companyDescription || '');
        formDataBC.append('priorities', JSON.stringify(clientData.priorities || []));
        formDataBC.append('migrationReadiness', clientData.migrationReadiness || 'evaluating');

        const responseBC = await fetch(`${API_URL}/api/business-case/upload`, { method: 'POST', body: formDataBC });
        if (!responseBC.ok) { const e = await responseBC.json(); throw new Error(e.error || `Error ${responseBC.status}`); }
        const dataBC = await responseBC.json();
        onBusinessCaseLoaded(dataBC.data);

        const formDataTCO = new FormData();
        formDataTCO.append('file', file);
        formDataTCO.append('storageIncrement', storageIncrement.toString());
        const responseTCO = await fetch(`${API_URL}/api/business-case/upload-tco-1year`, { method: 'POST', body: formDataTCO });
        if (!responseTCO.ok) { const e = await responseTCO.json(); throw new Error(e.error || `Error ${responseTCO.status}`); }
        const dataTCO = await responseTCO.json();
        onTCO1YearLoaded(dataTCO.data);
      } else {
        // ========== MODO PRODUCCIÓN: S3 ==========
        // Step 1: Get pre-signed URL (single upload, reuse key for both parsers)
        const urlRes = await fetch(`${API_URL}/api/report/get-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        });
        const urlData = await urlRes.json();
        if (!urlData.success) throw new Error(urlData.error || 'Failed to get upload URL');
        const { uploadUrl, key } = urlData.data;

        // Step 2: Upload to S3 once
        await fetch(uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        // Step 3: Process Business Case from S3
        const responseBC = await fetch(`${API_URL}/api/business-case/upload-from-s3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key, clientName: clientData.clientName, assessmentTool: 'Matilda',
            otherToolName: clientData.otherToolName, vertical: clientData.vertical || 'Technology',
            reportDate: clientData.reportDate || new Date().toISOString().split('T')[0],
            awsRegion: clientData.awsRegion || 'us-east-1', totalServers: clientData.totalServers || 0,
            onPremisesCost: clientData.onPremisesCost || 0, companyDescription: clientData.companyDescription || '',
            priorities: clientData.priorities || [], migrationReadiness: clientData.migrationReadiness || 'evaluating'
          })
        });
        if (!responseBC.ok) { const e = await responseBC.json(); throw new Error(e.error || `Error ${responseBC.status}`); }
        const dataBC = await responseBC.json();
        onBusinessCaseLoaded(dataBC.data);

        // Step 4: Get a second pre-signed URL for TCO (S3 key was deleted after BC processing)
        const urlRes2 = await fetch(`${API_URL}/api/report/get-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        });
        const urlData2 = await urlRes2.json();
        if (!urlData2.success) throw new Error(urlData2.error || 'Failed to get upload URL for TCO');
        const { uploadUrl: uploadUrl2, key: key2 } = urlData2.data;

        await fetch(uploadUrl2, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        const responseTCO = await fetch(`${API_URL}/api/business-case/upload-tco-1year-from-s3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: key2, storageIncrement })
        });
        if (!responseTCO.ok) { const e = await responseTCO.json(); throw new Error(e.error || `Error ${responseTCO.status}`); }
        const dataTCO = await responseTCO.json();
        onTCO1YearLoaded(dataTCO.data);
      }

      setUploadSuccess(true);
      setUploadError(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al subir el archivo';
      const isNetworkError = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed');
      setUploadError(isNetworkError
        ? t('matildaUploader.networkError')
        : msg
      );
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">{t('matildaUploader.title')}</h3>
          </div>

          <p className="text-sm text-gray-600">
            {t('matildaUploader.description')}
          </p>

          <div className="space-y-3">
            {/* Drag & Drop Zone */}
            <div>
              <Label htmlFor="matilda-file">{t('matildaUploader.fileLabel')}</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  id="matilda-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {t('matildaUploader.dragOrClick')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('matildaUploader.fileTypes')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storage-increment">
                {t('matildaUploader.storageIncrement')}
              </Label>
              <Input
                id="storage-increment"
                type="number"
                min="0"
                max="100"
                value={storageIncrement}
                onChange={(e) => setStorageIncrement(Number(e.target.value))}
                disabled={isUploading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('matildaUploader.storageIncrementHelper')}
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading || !clientData.clientName}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('matildaUploader.processing')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('matildaUploader.upload')}
                </>
              )}
            </Button>

            {/* Validation message */}
            {!clientData.clientName && file && (
              <div className="flex items-center gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800 font-medium">
                  {t('matildaUploader.clientNameRequired')}
                </p>
              </div>
            )}
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                {t('matildaUploader.success')}
              </p>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800 font-medium">
                {uploadError}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
