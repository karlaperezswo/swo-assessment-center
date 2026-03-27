import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TCO1YearUploadResponse } from '@/types/assessment';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface BusinessCaseTCO1YearUploaderProps {
  onDataLoaded: (data: TCO1YearUploadResponse) => void;
}

export function BusinessCaseTCO1YearUploader({ onDataLoaded }: BusinessCaseTCO1YearUploaderProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [storageIncrement, setStorageIncrement] = useState<string>(''); // Empty string to force user input
  const [isIncrementConfirmed, setIsIncrementConfirmed] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Store uploaded file

  const uploadFile = async (file: File, increment: string) => {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setUploadState('uploading');
    setErrorMessage('');

    toast.loading(`Cargando ${file.name}...`, { id: 'tco-1year-upload' });

    try {
      setUploadProgress('Subiendo archivo...');
      
      const useLocalUpload = import.meta.env.VITE_USE_LOCAL_UPLOAD === 'true';

      if (useLocalUpload) {
        // ========== MODO LOCAL ==========
        const formData = new FormData();
        formData.append('file', file);
        formData.append('storageIncrement', increment);

        const response = await apiClient.post('/api/business-case/upload-tco-1year', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          const uploadResponse: TCO1YearUploadResponse = response.data.data;
          setUploadState('success');
          setUploadedFile(file);
          onDataLoaded(uploadResponse);
          toast.success(`TCO 1 Año cargado: ${uploadResponse.summary.totalResources} recursos (Storage +${increment}%)`, {
            id: 'tco-1year-upload', duration: 5000
          });
        } else {
          throw new Error(response.data.error || 'Upload failed');
        }
      } else {
        // ========== MODO PRODUCCIÓN: S3 ==========
        setUploadProgress('Preparando carga...');
        const urlResponse = await apiClient.post('/api/report/get-upload-url', {
          filename: file.name,
          contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        if (!urlResponse.data.success) throw new Error(urlResponse.data.error || 'Failed to get upload URL');
        const { uploadUrl, key } = urlResponse.data.data;

        setUploadProgress('Subiendo a S3...');
        await fetch(uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });

        setUploadProgress('Analizando datos...');
        const response = await apiClient.post('/api/business-case/upload-tco-1year-from-s3', {
          key, storageIncrement: increment
        });

        if (response.data.success) {
          const uploadResponse: TCO1YearUploadResponse = response.data.data;
          setUploadState('success');
          setUploadedFile(file);
          onDataLoaded(uploadResponse);
          toast.success(`TCO 1 Año cargado: ${uploadResponse.summary.totalResources} recursos (Storage +${increment}%)`, {
            id: 'tco-1year-upload', duration: 5000
          });
        } else {
          throw new Error(response.data.error || 'Upload failed');
        }
      }
    } catch (error) {
      setUploadState('error');
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      setErrorMessage(message);
      toast.error(`Error al cargar archivo: ${message}`, {
        id: 'tco-1year-upload',
        duration: 7000
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate that increment is confirmed
    if (!isIncrementConfirmed) {
      toast.error('Por favor confirma el porcentaje de incremento de Storage', {
        description: 'Debes ingresar y confirmar el porcentaje antes de subir el archivo',
        duration: 5000
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    await uploadFile(file, storageIncrement);
  }, [onDataLoaded, storageIncrement, isIncrementConfirmed]);

  const handleConfirmIncrement = async () => {
    if (storageIncrement === '') {
      toast.error('Por favor ingresa un porcentaje de incremento', {
        description: 'Puedes ingresar 0 si no deseas incremento',
        duration: 4000
      });
      return;
    }

    const incrementValue = Number(storageIncrement);
    if (isNaN(incrementValue) || incrementValue < 0 || incrementValue > 100) {
      toast.error('Porcentaje inválido', {
        description: 'Debe ser un número entre 0 y 100',
        duration: 4000
      });
      return;
    }

    setIsIncrementConfirmed(true);
    
    // If there's already an uploaded file, re-upload it with the new percentage
    if (uploadedFile) {
      toast.info('Recalculando con nuevo porcentaje...', {
        duration: 2000
      });
      await uploadFile(uploadedFile, storageIncrement);
    } else {
      toast.success(`Porcentaje confirmado: ${incrementValue}%`, {
        description: incrementValue === 0 ? 'Sin incremento de Storage' : `Se aplicará ${incrementValue}% de incremento al Storage`,
        duration: 3000
      });
    }
  };

  const handleChangeIncrement = (value: string) => {
    setStorageIncrement(value);
    setIsIncrementConfirmed(false); // Reset confirmation when value changes
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: !isIncrementConfirmed  // Disable until increment is confirmed
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          TCO 1 Año
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Storage Increment Input */}
        <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Label htmlFor="storageIncrement" className="text-sm font-medium">
            Incremento de Storage (%) *
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="storageIncrement"
              type="number"
              min="0"
              max="100"
              value={storageIncrement}
              onChange={(e) => handleChangeIncrement(e.target.value)}
              className="flex-1"
              placeholder="Ej: 20 o 0 para sin incremento"
              disabled={isIncrementConfirmed}
            />
            {!isIncrementConfirmed ? (
              <Button 
                onClick={handleConfirmIncrement}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
            ) : (
              <Button 
                onClick={() => setIsIncrementConfirmed(false)}
                variant="outline"
              >
                Cambiar
              </Button>
            )}
          </div>
          {isIncrementConfirmed ? (
            <p className="text-xs text-green-600 font-medium mt-2">
              ✓ Porcentaje confirmado: {storageIncrement}% {Number(storageIncrement) === 0 ? '(sin incremento)' : ''}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-2">
              Ingresa el porcentaje y confirma antes de subir el archivo
            </p>
          )}
        </div>

        {!isIncrementConfirmed && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Debes confirmar el porcentaje de incremento antes de subir el archivo
            </p>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out transform
            ${!isIncrementConfirmed ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
            ${isDragActive && isIncrementConfirmed ? 'border-primary bg-primary/10 scale-105 shadow-lg' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
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
                o haz clic para seleccionar archivo (.xlsx, .xls)
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Archivo TCO 1 Año con hojas: Compute, Storage, Network
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
              <p className="text-sm text-green-600 mt-2">Archivo cargado exitosamente</p>
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
