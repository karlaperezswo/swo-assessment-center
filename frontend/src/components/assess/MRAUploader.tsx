import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, X, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MRAUploaderProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
}

export function MRAUploader({ onFileSelected, selectedFile }: MRAUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('El archivo PDF es demasiado grande. Máximo 50MB.');
        return;
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF.');
        return;
      }

      onFileSelected(file);
      toast.success(`Archivo MRA seleccionado: ${file.name}`);
    }
    setIsDragging(false);
  }, [onFileSelected]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelected(null);
    toast.info('Archivo MRA eliminado');
  };

  return (
    <Card className={`border-2 border-dashed transition-all ${
      isDragging 
        ? 'border-fuchsia-500 bg-fuchsia-50' 
        : selectedFile 
        ? 'border-green-300 bg-green-50' 
        : 'border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50/30'
    }`}>
      <CardContent className="pt-6">
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Eliminar archivo"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-fuchsia-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Arrastra tu archivo MRA PDF aquí
              </p>
              <p className="text-xs text-gray-500 mb-3">
                o haz clic para seleccionar (máx. 50MB)
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Upload className="h-3 w-3" />
                <span>PDF únicamente</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Info note about questionnaire */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              El MRA mejora la calidad del análisis al proporcionar contexto sobre arquitectura y riesgos. Para un análisis aún más completo, también puedes subir el <strong>Cuestionario de Infraestructura</strong> (opcional) debajo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
