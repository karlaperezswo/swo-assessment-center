import { useState, useRef } from 'react';
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
        setUploadError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
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
        setUploadError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
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
      console.log('[MatildaUploader] Uploading Business Case...');
      // Upload Business Case (OS Distribution)
      const formDataBC = new FormData();
      formDataBC.append('file', file);
      formDataBC.append('clientName', clientData.clientName);
      formDataBC.append('assessmentTool', 'Matilda'); // Always Matilda for this uploader
      if (clientData.otherToolName) formDataBC.append('otherToolName', clientData.otherToolName);
      formDataBC.append('vertical', clientData.vertical || 'Technology');
      formDataBC.append('reportDate', clientData.reportDate || new Date().toISOString().split('T')[0]);
      formDataBC.append('awsRegion', clientData.awsRegion || 'us-east-1');
      formDataBC.append('totalServers', (clientData.totalServers || 0).toString());
      formDataBC.append('onPremisesCost', (clientData.onPremisesCost || 0).toString());
      formDataBC.append('companyDescription', clientData.companyDescription || '');
      formDataBC.append('priorities', JSON.stringify(clientData.priorities || []));
      formDataBC.append('migrationReadiness', clientData.migrationReadiness || 'evaluating');

      const responseBC = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/business-case/upload`, {
        method: 'POST',
        body: formDataBC,
      });

      console.log('[MatildaUploader] Business Case response status:', responseBC.status);

      if (!responseBC.ok) {
        const errorText = await responseBC.text();
        console.error('[MatildaUploader] Business Case error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Error ${responseBC.status}: ${errorText}`);
        }
        throw new Error(errorData.error || 'Error al procesar Business Case');
      }

      const dataBC = await responseBC.json();
      console.log('[MatildaUploader] Business Case loaded successfully:', dataBC);
      onBusinessCaseLoaded(dataBC.data);

      // Upload TCO 1 Year
      console.log('[MatildaUploader] Uploading TCO 1 Year...');
      const formDataTCO = new FormData();
      formDataTCO.append('file', file);
      formDataTCO.append('storageIncrement', storageIncrement.toString());

      const responseTCO = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/business-case/upload-tco-1year`, {
        method: 'POST',
        body: formDataTCO,
      });

      console.log('[MatildaUploader] TCO response status:', responseTCO.status);

      if (!responseTCO.ok) {
        const errorText = await responseTCO.text();
        console.error('[MatildaUploader] TCO error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Error ${responseTCO.status}: ${errorText}`);
        }
        throw new Error(errorData.error || 'Error al procesar TCO 1 Year');
      }

      const dataTCO = await responseTCO.json();
      console.log('[MatildaUploader] TCO 1 Year loaded successfully:', dataTCO);
      onTCO1YearLoaded(dataTCO.data);

      setUploadSuccess(true);
      setUploadError(null);
      console.log('[MatildaUploader] ✓ Upload completed successfully');
    } catch (error) {
      console.error('[MatildaUploader] Error uploading Matilda file:', error);
      const msg = error instanceof Error ? error.message : 'Error al subir el archivo';
      // If it's a network/fetch error, likely the file is locked by another app
      const isNetworkError = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed');
      setUploadError(isNetworkError
        ? 'No se pudo conectar con el servidor. Si el archivo Excel está abierto en Excel u otra aplicación, ciérralo e intenta de nuevo.'
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
            <h3 className="font-semibold text-gray-800">Matilda Discovery Assessment</h3>
          </div>
          
          <p className="text-sm text-gray-600">
            Sube el archivo completo de Matilda. Este archivo contiene toda la información necesaria para el análisis.
          </p>

          <div className="space-y-3">
            {/* Drag & Drop Zone */}
            <div>
              <Label htmlFor="matilda-file">Archivo Excel de Matilda</Label>
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
                      Arrastra y suelta tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Archivos Excel (.xlsx, .xls)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storage-increment">
                Incremento de Storage (%)
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
                Porcentaje adicional a agregar al storage recomendado (opcional)
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
                  Procesando archivo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir y Procesar
                </>
              )}
            </Button>

            {/* Validation message */}
            {!clientData.clientName && file && (
              <div className="flex items-center gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Completa el nombre del cliente en el formulario de la derecha para continuar
                </p>
              </div>
            )}
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                ✓ Archivo procesado exitosamente
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
