import { FileUploader } from '@/components/FileUploader';
import { ClientForm } from '@/components/ClientForm';
import { MRAUploader } from '@/components/assess/MRAUploader';
import { QuestionnaireUploader } from '@/components/assess/QuestionnaireUploader';
import { Card, CardContent } from '@/components/ui/card';
import { ExcelData, UploadSummary, ClientFormData } from '@/types/assessment';
import { Upload, Building2, CheckCircle, FileText, FileQuestion } from 'lucide-react';

interface RapidDiscoveryProps {
  excelData: ExcelData | null;
  clientData: ClientFormData;
  onDataLoaded: (data: ExcelData, summary: UploadSummary) => void;
  onFormChange: (data: ClientFormData) => void;
  mraFile: File | null;
  onMRAFileChange: (file: File | null) => void;
  questionnaireFile: File | null;
  onQuestionnaireFileChange: (file: File | null) => void;
}

export function RapidDiscovery({ 
  excelData, 
  clientData, 
  onDataLoaded, 
  onFormChange, 
  mraFile, 
  onMRAFileChange,
  questionnaireFile,
  onQuestionnaireFileChange
}: RapidDiscoveryProps) {
  return (
    <div className="space-y-6">
      {/* Phase intro */}
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Upload className="h-6 w-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900 text-lg">Rapid Discovery</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                Carga tu exportación Excel del AWS Migration Portfolio Assessment (MPA) y el PDF del Migration Readiness Assessment (MRA).
                Proporciona los detalles del cliente para comenzar el proceso de evaluación. Estos datos impulsarán todas las fases de análisis posteriores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status indicators */}
      {(excelData || mraFile || questionnaireFile) && (
        <div className="flex flex-wrap gap-3">
          {excelData && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Datos Excel cargados ({excelData.servers.length} servidores, {excelData.databases.length} bases de datos)
            </div>
          )}
          {mraFile && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              PDF MRA cargado ({mraFile.name})
            </div>
          )}
          {questionnaireFile && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Cuestionario cargado ({questionnaireFile.name})
            </div>
          )}
          {clientData.clientName && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Cliente: {clientData.clientName}
            </div>
          )}
        </div>
      )}

      {/* Upload & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-5 w-5 text-fuchsia-600" />
              <h3 className="font-semibold text-gray-800">MPA Excel Upload</h3>
            </div>
            <FileUploader onDataLoaded={onDataLoaded} />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-fuchsia-600" />
              <h3 className="font-semibold text-gray-800">MRA PDF Upload (Opcional)</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Para análisis de oportunidades con IA
              </span>
            </div>
            <MRAUploader 
              selectedFile={mraFile}
              onFileSelected={onMRAFileChange}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileQuestion className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Cuestionario de Infraestructura (Opcional)</h3>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Mejora el análisis
              </span>
            </div>
            <QuestionnaireUploader 
              selectedFile={questionnaireFile}
              onFileSelected={onQuestionnaireFileChange}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">Información del Cliente</h3>
          </div>
          <ClientForm onFormChange={onFormChange} initialData={clientData} />
        </div>
      </div>
    </div>
  );
}
