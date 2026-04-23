import { Info, CheckCircle } from 'lucide-react';
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

export function WikiIntroduccion() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-fuchsia-900">Introducción al Programa MAP</h2>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">¿Qué es el AWS Migration Acceleration Program (MAP)?</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El AWS Migration Acceleration Program (MAP) es un programa integral diseñado por Amazon Web Services para
            ayudar a las organizaciones a migrar sus cargas de trabajo a la nube de AWS de manera más rápida, eficiente
            y con menor riesgo.
          </p>
          <InfoAlert>
            <strong>Nota:</strong> MAP proporciona metodología comprobada, herramientas especializadas y financiamiento
            para acelerar el proceso de migración.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Visión General del Programa</h3>
          <p className="text-sm text-gray-700">El programa MAP se estructura en tres fases principales:</p>
          <ul className="space-y-2">
            <CheckItem><strong>Assess (Evaluación):</strong> Análisis del estado actual de la infraestructura y planificación de la migración</CheckItem>
            <CheckItem><strong>Mobilize (Movilización):</strong> Preparación de la organización y el entorno para la migración</CheckItem>
            <CheckItem><strong>Migrate &amp; Modernize:</strong> Ejecución de la migración y optimización de las cargas de trabajo</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Beneficios del Programa MAP</h3>
          <ul className="space-y-2">
            <CheckItem>Reducción de costos operativos hasta en un 30%</CheckItem>
            <CheckItem>Mejora en la productividad del equipo de TI</CheckItem>
            <CheckItem>Aceleración del tiempo de migración</CheckItem>
            <CheckItem>Acceso a financiamiento y créditos de AWS</CheckItem>
            <CheckItem>Metodología probada y mejores prácticas</CheckItem>
            <CheckItem>Herramientas especializadas de evaluación y migración</CheckItem>
            <CheckItem>Soporte de expertos certificados</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Fases del Programa MAP</h3>

          <div className="space-y-4">
            <div className="border-l-4 border-fuchsia-400 pl-4">
              <h4 className="font-semibold text-fuchsia-800 text-sm">1. Fase de Assess (Evaluación)</h4>
              <p className="text-sm text-gray-700 mt-1">
                Crear un caso de negocio para la migración a la nube y desarrollar un plan de migración de alto nivel.
              </p>
              <p className="text-xs font-medium text-gray-500 mt-2 uppercase tracking-wide">Actividades clave:</p>
              <ul className="mt-1 space-y-1">
                <CheckItem>Discovery and Analysis: Recopilar datos sobre cargas de trabajo existentes</CheckItem>
                <CheckItem>TCO Analysis: Análisis de Costo Total de Propiedad</CheckItem>
                <CheckItem>Migration Readiness Assessment (MRA): Evaluar preparación en 6 perspectivas</CheckItem>
              </ul>
              <p className="text-xs font-medium text-gray-500 mt-2 uppercase tracking-wide">Entregables:</p>
              <ul className="mt-1 space-y-1">
                <CheckItem>Business Case: Caso de negocio completo</CheckItem>
                <CheckItem>Migration Plan: Plan de migración de alto nivel</CheckItem>
              </ul>
            </div>

            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-semibold text-purple-800 text-sm">2. Fase de Mobilize (Movilización)</h4>
              <p className="text-sm text-gray-700 mt-1">
                Planificación detallada, construcción de capacidades fundamentales y abordaje de brechas identificadas
                durante la Fase de Evaluación.
              </p>
            </div>

            <div className="border-l-4 border-amber-400 pl-4">
              <h4 className="font-semibold text-amber-800 text-sm">3. Fase de Migrate &amp; Modernize</h4>
              <p className="text-sm text-gray-700 mt-1">
                Ejecución de la migración de cargas de trabajo y modernización de aplicaciones en AWS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
