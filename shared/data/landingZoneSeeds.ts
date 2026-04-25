// Landing Zone seed catalogs for the four supported clouds. Consumed by both
// backend (provider IFrameworkService) and frontend (multi-cloud Landing Zone view).
//
// Items in GCP/Azure/Oracle catalogs are marked experimental until validated
// by certified architects of each cloud (per the multi-cloud plan's
// pre-requisites). The AWS catalog mirrors the calibrated baseline already
// referenced elsewhere in the app.

import type { CloudProvider, LandingZoneSection } from '../types/cloud.types';

const exp = { experimental: true } as const;

const AWS: readonly LandingZoneSection[] = Object.freeze([
  {
    id: 'org_structure',
    title: 'Organization & Account Structure',
    items: [
      { id: 'aws.org.organizations', title: 'AWS Organizations enabled',  description: 'Multi-account hierarchy with consolidated billing.', status: 'pending', docsUrl: 'https://docs.aws.amazon.com/organizations/' },
      { id: 'aws.org.control_tower', title: 'Control Tower deployed',     description: 'Automated landing zone over Organizations.',       status: 'pending', docsUrl: 'https://docs.aws.amazon.com/controltower/' },
      { id: 'aws.org.ous',           title: 'OU strategy defined',        description: 'Workload separation by environment / business unit.', status: 'pending' },
      { id: 'aws.org.scps',          title: 'Service Control Policies',   description: 'Guardrails preventing risky API actions.',         status: 'pending' },
    ],
  },
  {
    id: 'identity',
    title: 'Identity & Access',
    items: [
      { id: 'aws.iam.identity_center', title: 'IAM Identity Center (SSO)', description: 'Centralized SSO via external IdP.', status: 'pending', docsUrl: 'https://docs.aws.amazon.com/singlesignon/' },
      { id: 'aws.iam.roles',           title: 'IAM Roles for least privilege', description: 'Workload roles with scoped policies.', status: 'pending' },
      { id: 'aws.iam.mfa',             title: 'MFA on root and privileged users', description: 'Mandatory MFA for break-glass access.', status: 'pending' },
    ],
  },
  {
    id: 'networking',
    title: 'Networking',
    items: [
      { id: 'aws.net.vpc',           title: 'VPC topology with private subnets', description: 'Multi-AZ VPC with public/private/data tiers.', status: 'pending' },
      { id: 'aws.net.tgw',           title: 'Transit Gateway for inter-VPC',     description: 'Hub-and-spoke topology for connectivity.',     status: 'pending' },
      { id: 'aws.net.directconnect', title: 'Direct Connect or VPN',             description: 'Hybrid connectivity to on-premises.',          status: 'pending' },
      { id: 'aws.net.waf',           title: 'AWS WAF on public endpoints',       description: 'L7 protection in front of ALB/CloudFront.',    status: 'pending' },
    ],
  },
  {
    id: 'logging',
    title: 'Logging & Audit',
    items: [
      { id: 'aws.log.cloudtrail',  title: 'CloudTrail org-wide',        description: 'Multi-account audit log to a hardened account.', status: 'pending' },
      { id: 'aws.log.config',      title: 'AWS Config aggregator',      description: 'Resource configuration history.',                status: 'pending' },
      { id: 'aws.log.cloudwatch',  title: 'CloudWatch Logs centralized', description: 'Application and service logs aggregated.',       status: 'pending' },
    ],
  },
  {
    id: 'security',
    title: 'Security & Posture',
    items: [
      { id: 'aws.sec.guardduty',     title: 'GuardDuty enabled',           description: 'Threat detection across all accounts.',           status: 'pending' },
      { id: 'aws.sec.security_hub',  title: 'Security Hub',                description: 'Findings aggregation and CIS scoring.',           status: 'pending' },
      { id: 'aws.sec.kms',           title: 'KMS keys for data at rest',   description: 'Customer-managed keys for sensitive workloads.',  status: 'pending' },
    ],
  },
  {
    id: 'governance',
    title: 'Governance & Cost',
    items: [
      { id: 'aws.gov.budgets',  title: 'Budgets and cost alerts',  description: 'Per-OU budgets with anomaly detection.', status: 'pending' },
      { id: 'aws.gov.tagging',  title: 'Tagging policy enforced',  description: 'Mandatory tags for cost allocation.',    status: 'pending' },
    ],
  },
]);

const GCP: readonly LandingZoneSection[] = Object.freeze([
  {
    id: 'org_structure', title: 'Organization & Resource Hierarchy',
    items: [
      { id: 'gcp.org.organization', title: 'Cloud Identity / Workspace Organization', description: 'Top-level Org node bound to a domain.', status: 'pending', docsUrl: 'https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy', ...exp },
      { id: 'gcp.org.folders',      title: 'Folder hierarchy by environment / BU',    description: 'Folders for prod/non-prod/shared/sandbox.', status: 'pending', ...exp },
      { id: 'gcp.org.projects',     title: 'Per-workload Projects',                   description: 'One project per app/environment for blast radius isolation.', status: 'pending', ...exp },
      { id: 'gcp.org.policies',     title: 'Organization Policies',                   description: 'Constraints on resource locations, allowed services, public IPs.', status: 'pending', docsUrl: 'https://cloud.google.com/resource-manager/docs/organization-policy/overview', ...exp },
    ],
  },
  {
    id: 'identity', title: 'Identity & Access',
    items: [
      { id: 'gcp.iam.cloud_identity', title: 'Cloud Identity / federated SSO',  description: 'External IdP via SAML/OIDC.',                    status: 'pending', ...exp },
      { id: 'gcp.iam.iam',            title: 'IAM with least-privilege roles',   description: 'Custom roles + IAM Recommender.',                status: 'pending', ...exp },
      { id: 'gcp.iam.workload_id',    title: 'Workload Identity Federation',     description: 'Keyless authentication for GKE/Cloud Run.',      status: 'pending', ...exp },
    ],
  },
  {
    id: 'networking', title: 'Networking',
    items: [
      { id: 'gcp.net.shared_vpc',  title: 'Shared VPC (host project)',         description: 'Centralized network with service-project attachments.', status: 'pending', ...exp },
      { id: 'gcp.net.interconnect',title: 'Cloud Interconnect / VPN',           description: 'Hybrid connectivity to on-prem.',                       status: 'pending', ...exp },
      { id: 'gcp.net.vpc_sc',      title: 'VPC Service Controls',               description: 'Perimeters around managed services to prevent exfiltration.', status: 'pending', ...exp },
      { id: 'gcp.net.cloud_armor', title: 'Cloud Armor on external load balancers', description: 'L7 WAF + DDoS protection.',                       status: 'pending', ...exp },
    ],
  },
  {
    id: 'logging', title: 'Logging & Audit',
    items: [
      { id: 'gcp.log.audit_logs',     title: 'Cloud Audit Logs aggregated',         description: 'Admin Activity, Data Access, System Events to a logging project.', status: 'pending', ...exp },
      { id: 'gcp.log.cloud_logging',  title: 'Cloud Logging buckets centralized',   description: 'Org-level log sinks with retention policy.',                       status: 'pending', ...exp },
      { id: 'gcp.log.asset_inventory',title: 'Cloud Asset Inventory',                description: 'Snapshot + change history of all resources.',                      status: 'pending', ...exp },
    ],
  },
  {
    id: 'security', title: 'Security & Posture',
    items: [
      { id: 'gcp.sec.scc',         title: 'Security Command Center Premium',      description: 'Threat detection + Security Health Analytics.', status: 'pending', ...exp },
      { id: 'gcp.sec.cmek',        title: 'Customer-Managed Encryption Keys (CMEK)', description: 'Cloud KMS for sensitive workloads.',          status: 'pending', ...exp },
      { id: 'gcp.sec.binary_auth', title: 'Binary Authorization for GKE',         description: 'Image attestation and signature verification.',  status: 'pending', ...exp },
    ],
  },
  {
    id: 'governance', title: 'Governance & Cost',
    items: [
      { id: 'gcp.gov.budgets', title: 'Budgets and billing alerts', description: 'Per-folder budgets with thresholds.', status: 'pending', ...exp },
      { id: 'gcp.gov.labels',  title: 'Labeling / tagging policy',  description: 'Mandatory labels for cost allocation.', status: 'pending', ...exp },
    ],
  },
]);

const AZURE: readonly LandingZoneSection[] = Object.freeze([
  {
    id: 'org_structure', title: 'Management Group & Subscription Structure',
    items: [
      { id: 'azure.org.tenant_root',   title: 'Tenant Root Group',          description: 'Top-level Microsoft Entra tenant configured.',                                             status: 'pending', docsUrl: 'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview', ...exp },
      { id: 'azure.org.mg_hierarchy',  title: 'Management Group hierarchy', description: 'Platform / Landing Zones / Decommissioned / Sandbox MGs.',                               status: 'pending', ...exp },
      { id: 'azure.org.subscriptions', title: 'Subscription strategy',      description: 'One subscription per workload + connectivity / identity / management subs.',             status: 'pending', ...exp },
      { id: 'azure.org.azure_policy',  title: 'Azure Policy as guardrails', description: 'Built-in initiatives (Security Benchmark, ISO 27001).',                                  status: 'pending', ...exp },
    ],
  },
  {
    id: 'identity', title: 'Identity & Access',
    items: [
      { id: 'azure.iam.entra_id',    title: 'Microsoft Entra ID tenant',   description: 'Federated SSO, MFA enforced for privileged users.',                                       status: 'pending', ...exp },
      { id: 'azure.iam.rbac',        title: 'Azure RBAC with PIM',          description: 'Just-in-time elevation via Privileged Identity Management.',                              status: 'pending', ...exp },
      { id: 'azure.iam.conditional', title: 'Conditional Access policies',  description: 'Context-aware sign-in policies.',                                                         status: 'pending', ...exp },
    ],
  },
  {
    id: 'networking', title: 'Networking',
    items: [
      { id: 'azure.net.hub_spoke',    title: 'Hub-and-spoke VNet topology', description: 'Hub VNet with shared services, spoke VNets per workload.',                                 status: 'pending', ...exp },
      { id: 'azure.net.expressroute', title: 'ExpressRoute or VPN',          description: 'Hybrid connectivity to on-prem.',                                                          status: 'pending', ...exp },
      { id: 'azure.net.firewall',     title: 'Azure Firewall in hub',        description: 'Centralized egress filtering.',                                                            status: 'pending', ...exp },
      { id: 'azure.net.front_door',   title: 'Front Door + WAF',             description: 'Global L7 with WAF for public endpoints.',                                                 status: 'pending', ...exp },
    ],
  },
  {
    id: 'logging', title: 'Logging & Audit',
    items: [
      { id: 'azure.log.activity_log',  title: 'Activity Log archived',                      description: 'Subscription-level audit log forwarded to Log Analytics.', status: 'pending', ...exp },
      { id: 'azure.log.log_analytics', title: 'Log Analytics workspace',                    description: 'Central workspace in management subscription.',           status: 'pending', ...exp },
      { id: 'azure.log.diagnostics',   title: 'Diagnostic Settings on all resources',       description: 'Per-resource diagnostic export by Azure Policy.',          status: 'pending', ...exp },
    ],
  },
  {
    id: 'security', title: 'Security & Posture',
    items: [
      { id: 'azure.sec.defender',  title: 'Microsoft Defender for Cloud',  description: 'Cloud Security Posture Management (CSPM) + workload protection.', status: 'pending', ...exp },
      { id: 'azure.sec.sentinel',  title: 'Microsoft Sentinel SIEM',       description: 'SIEM/SOAR for security events.',                                  status: 'pending', ...exp },
      { id: 'azure.sec.key_vault', title: 'Azure Key Vault per workload',  description: 'Centralized secret + certificate management.',                    status: 'pending', ...exp },
    ],
  },
  {
    id: 'governance', title: 'Governance & Cost',
    items: [
      { id: 'azure.gov.cost_management', title: 'Cost Management + Budgets', description: 'Per-MG budgets with alerts.',  status: 'pending', ...exp },
      { id: 'azure.gov.tags',            title: 'Tag taxonomy enforced',     description: 'Required tags via Azure Policy.', status: 'pending', ...exp },
    ],
  },
]);

const ORACLE: readonly LandingZoneSection[] = Object.freeze([
  {
    id: 'org_structure', title: 'Tenancy & Compartments',
    items: [
      { id: 'oci.org.tenancy',         title: 'Tenancy provisioned',           description: 'Root tenancy with default home region.', status: 'pending', docsUrl: 'https://docs.oracle.com/en/cloud/get-started/subscriptions-cloud/csgsg/oci-tenancy.html', ...exp },
      { id: 'oci.org.compartments',    title: 'Compartment hierarchy',         description: 'Top-level compartments per environment / business unit.', status: 'pending', ...exp },
      { id: 'oci.org.budgets_quota',   title: 'Compartment quotas + budgets',  description: 'Resource caps per compartment.', status: 'pending', ...exp },
      { id: 'oci.org.tag_namespaces',  title: 'Tag Namespaces (defined tags)', description: 'Standardized tagging for governance.', status: 'pending', ...exp },
    ],
  },
  {
    id: 'identity', title: 'Identity & Access',
    items: [
      { id: 'oci.iam.identity_domains', title: 'Identity Domains (IAM with IDCS)', description: 'SSO / federation with external IdP.', status: 'pending', ...exp },
      { id: 'oci.iam.policies',         title: 'IAM Policies (least privilege)',    description: 'Compartment-scoped resource access.',  status: 'pending', ...exp },
      { id: 'oci.iam.mfa',              title: 'MFA enforced for privileged users', description: 'Mandatory MFA via IDCS.',              status: 'pending', ...exp },
    ],
  },
  {
    id: 'networking', title: 'Networking',
    items: [
      { id: 'oci.net.vcn_topology',     title: 'VCN topology with subnets', description: 'Hub-and-spoke or flat per BU.',          status: 'pending', ...exp },
      { id: 'oci.net.fastconnect',      title: 'FastConnect / IPSec VPN',   description: 'Hybrid connectivity to on-prem.',         status: 'pending', ...exp },
      { id: 'oci.net.network_firewall', title: 'OCI Network Firewall',      description: 'Centralized L4-L7 inspection.',           status: 'pending', ...exp },
      { id: 'oci.net.waf',              title: 'OCI WAF on public LBs',     description: 'L7 protection for public services.',      status: 'pending', ...exp },
    ],
  },
  {
    id: 'logging', title: 'Logging & Audit',
    items: [
      { id: 'oci.log.audit',         title: 'Audit Service (org-wide)',  description: 'API-level audit trail for compliance.',          status: 'pending', ...exp },
      { id: 'oci.log.logging',       title: 'OCI Logging service',        description: 'Centralized service + custom logs.',             status: 'pending', ...exp },
      { id: 'oci.log.connector_hub', title: 'Service Connector Hub',      description: 'Pipeline logs/events to SIEM or Object Storage.', status: 'pending', ...exp },
    ],
  },
  {
    id: 'security', title: 'Security & Posture',
    items: [
      { id: 'oci.sec.cloud_guard', title: 'Cloud Guard (CSPM)',            description: 'Threat detection + posture management.', status: 'pending', ...exp },
      { id: 'oci.sec.vault',       title: 'OCI Vault (KMS + Secrets)',     description: 'Customer-managed keys + secret store.',  status: 'pending', ...exp },
      { id: 'oci.sec.vss',         title: 'Vulnerability Scanning Service', description: 'Scheduled scans on hosts and images.',  status: 'pending', ...exp },
    ],
  },
  {
    id: 'governance', title: 'Governance & Cost',
    items: [
      { id: 'oci.gov.budgets',       title: 'Budgets and cost tracking', description: 'Per-compartment budgets with alerts.',         status: 'pending', ...exp },
      { id: 'oci.gov.cost_analysis', title: 'Cost Analysis dashboards',  description: 'Universal Credits consumption tracking.',      status: 'pending', ...exp },
    ],
  },
]);

export const LANDING_ZONE_SEEDS: Readonly<Record<CloudProvider, readonly LandingZoneSection[]>> = Object.freeze({
  aws: AWS,
  gcp: GCP,
  azure: AZURE,
  oracle: ORACLE,
});
