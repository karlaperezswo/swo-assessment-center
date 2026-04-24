import { useTranslation } from '@/i18n/useTranslation';
import { FileUploader } from '@/components/FileUploader';
import { ClientForm } from '@/components/ClientForm';
import { MRAUploader } from '@/components/assess/MRAUploader';
import { QuestionnaireUploader } from '@/components/assess/QuestionnaireUploader';
import { Card, CardContent } from '@/components/ui/card';
import { ExcelData, UploadSummary, ClientFormData } from '@/types/assessment';
import { Upload, Building2, CheckCircle, FileText, FileQuestion } from 'lucide-react';
import { ExcelValidationPanel } from '@/components/assess/ExcelValidationPanel';
import { ReadinessQuestionnaire } from '@/components/assess/ReadinessQuestionnaire';

interface RapidDiscoveryProps {
  excelData: ExcelData | null;
  clientData: ClientFormData;
  onDataLoaded: (data: ExcelData, summary: UploadSummary, dependencyData?: any, migrationWaves?: any) => void;
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
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Phase intro */}
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Upload className="h-6 w-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900 text-lg">{t('rapidDiscovery.title')}</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                {t('rapidDiscovery.description')}
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
              {t('rapidDiscovery.excelLoaded', { servers: excelData.servers.length, databases: excelData.databases.length })}
            </div>
          )}
          {mraFile && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {t('rapidDiscovery.mraLoaded', { name: mraFile.name })}
            </div>
          )}
          {questionnaireFile && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {t('rapidDiscovery.questionnaireLoaded', { name: questionnaireFile.name })}
            </div>
          )}
          {clientData.clientName && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {t('rapidDiscovery.clientAdded', { name: clientData.clientName })}
            </div>
          )}
        </div>
      )}

      <ExcelValidationPanel excelData={excelData} />

      {/* Row 1 — Primary inputs: MPA inventory + client info side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">{t('rapidDiscovery.mpaExcelUpload')}</h3>
          </div>
          <FileUploader
            onDataLoaded={onDataLoaded}
            persistedSummary={excelData ? {
              serverCount: excelData.servers.length,
              databaseCount: excelData.databases.length,
              applicationCount: excelData.applications.length,
              totalStorageGB: excelData.servers.reduce((s, srv) => s + (srv.totalDiskSize || 0), 0),
              communicationCount: excelData.serverCommunications?.length,
              dataSource: excelData.dataSource,
            } : null}
          />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">{t('rapidDiscovery.clientInfo')}</h3>
          </div>
          <ClientForm onFormChange={onFormChange} initialData={clientData} />
        </section>
      </div>

      {/* Row 2 — Optional context: MRA PDF + Infrastructure questionnaire upload
          side by side so neither column is left dangling under primary inputs. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-fuchsia-600" />
            <h3 className="font-semibold text-gray-800">{t('rapidDiscovery.mraPdfUpload')}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {t('rapidDiscovery.forAiAnalysis')}
            </span>
          </div>
          <MRAUploader selectedFile={mraFile} onFileSelected={onMRAFileChange} />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">{t('rapidDiscovery.infrastructureQuestionnaire')}</h3>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {t('rapidDiscovery.improvesAnalysis')}
            </span>
          </div>
          <QuestionnaireUploader
            selectedFile={questionnaireFile}
            onFileSelected={onQuestionnaireFileChange}
          />
        </section>
      </div>

      {/* Row 3 — Guided readiness questionnaire (full width, collapsed by default).
          Captures organizational + security context that complements the MRA PDF
          upload. Answers feed Migration Readiness scoring via a shared store. */}
      <ReadinessQuestionnaire defaultCollapsed />
    </div>
  );
}
