import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, X, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionnaireUploaderProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
}

export function QuestionnaireUploader({ onFileSelected, selectedFile }: QuestionnaireUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('El archivo Word es demasiado grande. Máximo 50MB.');
        return;
      }

      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        toast.error('Solo se permiten archivos Word (.docx o .doc).');
        return;
      }

      onFileSelected(file);
      toast.success(`Cuestionario seleccionado: ${file.name}`);
    }
    setIsDragging(false);
  }, [onFileSelected]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelected(null);
    toast.info('Cuestionario eliminado');
  };

  return (
    <Card className={`border-2 border-dashed transition-all ${
      isDragging 
        ? 'border-blue-500 bg-blue-50' 
        : selectedFile 
        ? 'border-green-300 bg-green-50' 
        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
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
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Cuestionario de Infraestructura
                </p>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  OPCIONAL
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Arrastra tu archivo Word aquí o haz clic para seleccionar (máx. 50MB)
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-3">
                <Upload className="h-3 w-3" />
                <span>Word (.docx, .doc)</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg max-w-md mx-auto">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-left">
                  El cuestionario mejora la calidad del análisis al proporcionar contexto sobre prioridades, 
                  restricciones y objetivos del cliente. Los datos sensibles se anonimizan automáticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
