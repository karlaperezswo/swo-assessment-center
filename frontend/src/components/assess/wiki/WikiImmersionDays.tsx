import { CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <CheckCircle className="h-4 w-4 text-fuchsia-500 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

const immersionTypes = [
  {
    title: 'Immersion Day Foundational',
    duration: '1 día (8 horas)',
    audience: 'Equipos nuevos en AWS',
    color: 'border-blue-200 bg-blue-50',
    items: ['Introducción a AWS y servicios core', 'Conceptos de VPC y networking', 'Compute con EC2', 'Almacenamiento con S3 y EBS'],
  },
  {
    title: 'Immersion Day Migration',
    duration: '2 días (16 horas)',
    audience: 'Equipos técnicos de migración',
    color: 'border-fuchsia-200 bg-fuchsia-50',
    items: ['Estrategias de migración 7Rs', 'AWS MGN y DMS hands-on', 'Well-Architected Review', 'Laboratorios de migración real'],
  },
  {
    title: 'Immersion Day Security',
    duration: '1 día (8 horas)',
    audience: 'Equipos de seguridad y compliance',
    color: 'border-purple-200 bg-purple-50',
    items: ['Modelo de responsabilidad compartida', 'IAM y gestión de identidades', 'CloudTrail y CloudWatch', 'Frameworks de compliance en AWS'],
  },
  {
    title: 'Immersion Day Database',
    duration: '2 días (16 horas)',
    audience: 'DBAs y arquitectos de datos',
    color: 'border-green-200 bg-green-50',
    items: ['AWS DMS y Schema Conversion Tool', 'RDS y Aurora', 'Migración Oracle/SQL Server', 'Pruebas de migración hands-on'],
  },
];

export function WikiImmersionDays() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Immersion Days</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Los AWS Immersion Days son sesiones de capacitación práctica diseñadas para acelerar el conocimiento del
            equipo del cliente sobre servicios y mejores prácticas de AWS.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Proporcionar experiencia práctica con servicios de AWS relevantes para la
            migración, reduciendo la curva de aprendizaje y aumentando la confianza del equipo.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">¿Qué incluyen los Immersion Days?</h3>
          <ul className="space-y-1.5">
            <CheckItem>Aprenden conceptos fundamentales de AWS</CheckItem>
            <CheckItem>Realizan ejercicios prácticos hands-on</CheckItem>
            <CheckItem>Construyen arquitecturas reales en AWS</CheckItem>
            <CheckItem>Reciben guía de expertos certificados</CheckItem>
            <CheckItem>Exploran casos de uso específicos de su industria</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tipos Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {immersionTypes.map((type) => (
            <div key={type.title} className={`p-4 rounded-xl border ${type.color}`}>
              <p className="font-semibold text-gray-800 text-sm">{type.title}</p>
              <div className="flex gap-3 mt-1 mb-2">
                <span className="text-xs text-gray-600">⏱ {type.duration}</span>
                <span className="text-xs text-gray-600">👥 {type.audience}</span>
              </div>
              <ul className="space-y-1">
                {type.items.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <span className="text-fuchsia-400 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
