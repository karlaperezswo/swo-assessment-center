import { ManualChecklistState } from '@/lib/migrationReadiness';

export type QuestionAnswer = 'yes' | 'no' | 'partial' | 'unknown';

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  hint?: string;
  /** Readiness check IDs that this answer should control. */
  mapsTo: string[];
  /** Which answer counts as "passed" for the mapped checks. */
  trueWhen: QuestionAnswer[];
}

export const READINESS_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'q.exec_sponsor',
    label: '¿Existe un patrocinador ejecutivo identificado para la migración?',
    hint: 'Persona con autoridad para desbloquear decisiones y presupuestos.',
    mapsTo: ['org.exec_sponsor'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.cloud_team',
    label: '¿El modelo operativo cloud (CCoE, plataforma, partner) está acordado?',
    mapsTo: ['org.cloud_team'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.aws_skills',
    label: '¿Hay al menos un ingeniero AWS certificado (interno o partner)?',
    mapsTo: ['org.skills_aws'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.budget',
    label: '¿El presupuesto para la migración está aprobado hasta go-live?',
    mapsTo: ['org.budget_approved'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.change_mgmt',
    label: '¿Existe un plan de gestión del cambio (comunicación + capacitación)?',
    mapsTo: ['org.change_mgmt'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.landing_zone',
    label: '¿La AWS Landing Zone (cuentas, SCPs, guardrails) está diseñada?',
    mapsTo: ['sec.landing_zone'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.iam_sso',
    label: '¿La estrategia de IAM/SSO (AD, SCIM, proveedor de identidad) está definida?',
    mapsTo: ['sec.iam_strategy'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.compliance',
    label: '¿Los requisitos de cumplimiento (ISO, SOC2, HIPAA, PCI) están documentados?',
    mapsTo: ['sec.compliance_reqs'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.encryption',
    label: '¿Los estándares de cifrado (KMS en reposo, TLS en tránsito) están acordados?',
    mapsTo: ['sec.encryption'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.incident_response',
    label: '¿El plan de respuesta a incidentes cubre el nuevo entorno AWS?',
    mapsTo: ['sec.incident_response'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.backup_strategy',
    label: '¿La estrategia de backup y recuperación (RTO/RPO) está documentada?',
    mapsTo: ['data.backup_strategy'],
    trueWhen: ['yes', 'partial'],
  },
  {
    id: 'q.data_classification',
    label: '¿Los datos sensibles (PII, PCI, PHI) están clasificados y etiquetados?',
    mapsTo: ['data.classification'],
    trueWhen: ['yes'],
  },
  {
    id: 'q.architecture_review',
    label: '¿La arquitectura destino AWS ha sido revisada con un SA?',
    mapsTo: ['tech.architecture_review'],
    trueWhen: ['yes'],
  },
];

export type AnswersState = Record<string, QuestionAnswer>;

export function applyAnswersToChecklist(
  answers: AnswersState,
  currentChecklist: ManualChecklistState
): ManualChecklistState {
  const next = { ...currentChecklist };
  READINESS_QUESTIONS.forEach((q) => {
    const answer = answers[q.id];
    if (!answer || answer === 'unknown') return;
    const passed = q.trueWhen.includes(answer);
    q.mapsTo.forEach((checkId) => {
      next[checkId] = passed;
    });
  });
  return next;
}

export function computeProgress(answers: AnswersState): {
  answered: number;
  total: number;
  percent: number;
} {
  const total = READINESS_QUESTIONS.length;
  const answered = READINESS_QUESTIONS.filter((q) => {
    const a = answers[q.id];
    return a && a !== 'unknown';
  }).length;
  return { answered, total, percent: Math.round((answered / total) * 100) };
}
