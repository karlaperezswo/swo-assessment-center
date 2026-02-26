import { FileUploader } from '@/components/FileUploader';
import { ClientForm } from '@/components/ClientForm';
import { Card, CardContent } from '@/components/ui/card';
import { ExcelData, UploadSummary, ClientFormData } from '@/types/assessment';
import { Upload, Building2, CheckCircle } from 'lucide-react';

interface RapidDiscoveryProps {
  excelData: ExcelData | null;
  clientData: ClientFormData;
  onDataLoaded: (data: ExcelData, summary: UploadSummary, dependencyData?: any, migrationWaves?: any) => void;
  onFormChange: (data: ClientFormData) => void;
}

export function RapidDiscovery({ excelData, clientData, onDataLoaded, onFormChange }: RapidDiscoveryProps) {
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
                Upload your AWS Migration Portfolio Assessment (MPA) Excel export and provide client details
                to begin the assessment process. This data will drive all subsequent analysis phases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status indicators */}
      {excelData && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Excel data loaded ({excelData.servers.length} servers, {excelData.databases.length} databases)
          </div>
          {clientData.clientName && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Client: {clientData.clientName}
            </div>
          )}
        </div>
      )}

      {/* Upload & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">Data Upload</h3>
          </div>
          <FileUploader onDataLoaded={onDataLoaded} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">Client Information</h3>
          </div>
          <ClientForm onFormChange={onFormChange} initialData={clientData} />
        </div>
      </div>
    </div>
  );
}
