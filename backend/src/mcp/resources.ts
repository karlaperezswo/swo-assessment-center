/**
 * Canonical knowledge resources served by the MCP server. Kept as inline
 * constants so they're self-contained and don't need filesystem or network
 * access — the MCP server is designed to be embeddable in a Lambda cold
 * start where disk reads are expensive.
 */

export const SEVEN_RS_TAXONOMY = `# Las 7 estrategias de migración (7Rs)

| Estrategia | Qué hace | Cuándo elegirla |
|---|---|---|
| **Rehost** | Lift & shift — mover VMs tal cual a EC2 | Time-to-AWS crítico, bajo tiempo de ingeniería |
| **Replatform** | Lift & tinker — ajustes mínimos (RDS en vez de MySQL on-prem) | Ganancias rápidas de managed services sin refactor |
| **Repurchase** | Reemplazar con SaaS | Apps genéricas (CRM, ERP, ticketing) |
| **Refactor** | Reescribir nativo cloud | Microservicios, alta escalabilidad, valor estratégico |
| **Relocate** | Mover VMs a VMware Cloud on AWS | Disaster recovery, retirada de datacenter sin cambios |
| **Retain** | Dejar on-prem (por ahora) | Hardware reciente, compliance pendiente |
| **Retire** | Apagar | App en desuso, duplicados |

Referencia: https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-retiring-applications/apg-gloss.html
`;

export const WELL_ARCHITECTED_PILLARS = `# Pilares del AWS Well-Architected Framework

1. **Excelencia operacional** — IaC, observabilidad, runbooks, mejora continua.
2. **Seguridad** — IAM least-privilege, cifrado en tránsito y reposo, auditoría, DR.
3. **Fiabilidad** — Multi-AZ, backups verificados, health checks, autoscaling.
4. **Eficiencia de rendimiento** — dimensionado correcto, instancias adecuadas, caching.
5. **Optimización de costos** — Savings Plans, Spot, right-sizing, Graviton.
6. **Sostenibilidad** — huella de carbono, regiones low-carbon, tamaños adecuados.

Referencia: https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html
`;

export const BUSINESS_CASE_TEMPLATE = `# Plantilla — Business Case de migración (borrador inicial)

## Resumen ejecutivo
- Cliente: {CLIENT_NAME}
- Objetivo de negocio: (1-2 frases)
- Horizonte: 12–36 meses

## Estado actual
- N servidores on-prem / % Windows
- N bases de datos / motores
- Gasto anual (OpEx + CapEx)

## Estado objetivo en AWS
- Estrategia por aplicación (7Rs): breakdown
- Landing Zone + organización multi-cuenta
- Pilares Well-Architected a los que se mueve la aguja

## Caso financiero (3 años)
| Año | On-prem | AWS On-Demand | AWS con Savings Plans |
|---|---|---|---|
| 1 | … | … | … |
| 2 | … | … | … |
| 3 | … | … | … |

## Riesgos y mitigaciones

## Próximos pasos
`;

export const RESOURCES = [
  {
    uri: 'aws://knowledge/7rs-taxonomy',
    name: 'AWS migration 7Rs taxonomy',
    description:
      'Canonical 7Rs migration strategy taxonomy (Rehost, Replatform, Repurchase, Refactor, Relocate, Retain, Retire).',
    mimeType: 'text/markdown',
    text: SEVEN_RS_TAXONOMY,
  },
  {
    uri: 'aws://knowledge/well-architected-pillars',
    name: 'AWS Well-Architected Framework pillars',
    description: 'Six pillars of the Well-Architected Framework with short descriptions.',
    mimeType: 'text/markdown',
    text: WELL_ARCHITECTED_PILLARS,
  },
  {
    uri: 'template://business-case-v2',
    name: 'Business Case template (v2)',
    description: 'Draft skeleton for a client-ready migration Business Case document.',
    mimeType: 'text/markdown',
    text: BUSINESS_CASE_TEMPLATE,
  },
] as const;
