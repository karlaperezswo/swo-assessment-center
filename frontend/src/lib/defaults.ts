import { LandingZoneChecklist, SecurityComplianceChecklist, SkillAssessment } from '@/types/assessment';

export function createDefaultLandingZoneChecklist(): LandingZoneChecklist {
  return {
    accountStructure: [
      { id: 'lz-as-1', category: 'Account Structure', title: 'Multi-account strategy defined', description: 'Define AWS Organizations structure with separate accounts for workloads, security, logging, and shared services', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-as-2', category: 'Account Structure', title: 'AWS Control Tower enabled', description: 'Enable Control Tower for automated account provisioning and governance guardrails', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-as-3', category: 'Account Structure', title: 'OU structure defined', description: 'Create Organizational Units for Security, Infrastructure, Sandbox, Workloads (Prod/Non-Prod)', completed: false, priority: 'high', notes: '' },
      { id: 'lz-as-4', category: 'Account Structure', title: 'Account naming convention', description: 'Establish consistent naming and tagging convention for all AWS accounts', completed: false, priority: 'medium', notes: '' },
    ],
    networking: [
      { id: 'lz-net-1', category: 'Networking', title: 'VPC design completed', description: 'Design VPCs with appropriate CIDR ranges, subnets (public/private/isolated), and availability zones', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-net-2', category: 'Networking', title: 'Transit Gateway configured', description: 'Set up AWS Transit Gateway for inter-VPC and on-premises connectivity', completed: false, priority: 'high', notes: '' },
      { id: 'lz-net-3', category: 'Networking', title: 'Direct Connect / VPN established', description: 'Configure hybrid connectivity between on-premises data center and AWS', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-net-4', category: 'Networking', title: 'DNS strategy defined', description: 'Configure Route 53 for DNS resolution, including hybrid DNS with on-premises', completed: false, priority: 'high', notes: '' },
      { id: 'lz-net-5', category: 'Networking', title: 'Network firewall rules', description: 'Define security groups and NACLs for network segmentation', completed: false, priority: 'high', notes: '' },
    ],
    security: [
      { id: 'lz-sec-1', category: 'Security', title: 'IAM Identity Center (SSO) configured', description: 'Set up centralized identity management with federation to corporate IdP', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-sec-2', category: 'Security', title: 'GuardDuty enabled', description: 'Enable Amazon GuardDuty across all accounts for threat detection', completed: false, priority: 'high', notes: '' },
      { id: 'lz-sec-3', category: 'Security', title: 'Security Hub enabled', description: 'Enable AWS Security Hub for centralized security findings and compliance checks', completed: false, priority: 'high', notes: '' },
      { id: 'lz-sec-4', category: 'Security', title: 'KMS key strategy', description: 'Define AWS KMS encryption strategy for data at rest and in transit', completed: false, priority: 'high', notes: '' },
    ],
    logging: [
      { id: 'lz-log-1', category: 'Logging', title: 'CloudTrail enabled (org-level)', description: 'Enable AWS CloudTrail organization trail for API activity logging', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-log-2', category: 'Logging', title: 'Centralized logging account', description: 'Configure centralized log archive account with S3 buckets and retention policies', completed: false, priority: 'high', notes: '' },
      { id: 'lz-log-3', category: 'Logging', title: 'AWS Config enabled', description: 'Enable AWS Config across all accounts for resource configuration tracking', completed: false, priority: 'high', notes: '' },
      { id: 'lz-log-4', category: 'Logging', title: 'CloudWatch alarms configured', description: 'Set up baseline CloudWatch alarms for billing, security, and operational metrics', completed: false, priority: 'medium', notes: '' },
    ],
    governance: [
      { id: 'lz-gov-1', category: 'Governance', title: 'Service Control Policies (SCPs)', description: 'Define SCPs to restrict unauthorized services, regions, and actions', completed: false, priority: 'critical', notes: '' },
      { id: 'lz-gov-2', category: 'Governance', title: 'Tagging strategy enforced', description: 'Implement mandatory tagging policy for cost allocation and resource management', completed: false, priority: 'high', notes: '' },
      { id: 'lz-gov-3', category: 'Governance', title: 'Budget alerts configured', description: 'Set up AWS Budgets with alerts for cost anomalies and thresholds', completed: false, priority: 'medium', notes: '' },
      { id: 'lz-gov-4', category: 'Governance', title: 'Backup strategy defined', description: 'Configure AWS Backup with policies for critical workloads', completed: false, priority: 'high', notes: '' },
    ],
  };
}

export function createDefaultSecurityChecklist(): SecurityComplianceChecklist {
  return {
    identityAccess: [
      { id: 'sc-ia-1', category: 'Identity & Access', title: 'MFA enforced for all users', description: 'Require multi-factor authentication for all IAM users and root accounts', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-ia-2', category: 'Identity & Access', title: 'Root account secured', description: 'Secure root account with MFA, no access keys, and limited usage', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-ia-3', category: 'Identity & Access', title: 'Least privilege IAM policies', description: 'Implement least-privilege access policies for all roles and users', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-ia-4', category: 'Identity & Access', title: 'Service-linked roles configured', description: 'Use service-linked roles for AWS service access instead of broad permissions', completed: false, priority: 'high', notes: '' },
    ],
    dataProtection: [
      { id: 'sc-dp-1', category: 'Data Protection', title: 'Encryption at rest enabled', description: 'Enable encryption at rest for all storage services (S3, EBS, RDS, DynamoDB)', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-dp-2', category: 'Data Protection', title: 'Encryption in transit enforced', description: 'Enforce TLS/SSL for all data in transit between services and clients', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-dp-3', category: 'Data Protection', title: 'S3 bucket policies reviewed', description: 'Ensure no public S3 buckets and apply appropriate bucket policies', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-dp-4', category: 'Data Protection', title: 'Data classification completed', description: 'Classify data by sensitivity level and apply corresponding protection controls', completed: false, priority: 'high', notes: '' },
    ],
    networkSecurity: [
      { id: 'sc-ns-1', category: 'Network Security', title: 'WAF configured', description: 'Deploy AWS WAF on public-facing endpoints with OWASP rule sets', completed: false, priority: 'high', notes: '' },
      { id: 'sc-ns-2', category: 'Network Security', title: 'DDoS protection (Shield)', description: 'Enable AWS Shield Standard/Advanced for DDoS protection', completed: false, priority: 'high', notes: '' },
      { id: 'sc-ns-3', category: 'Network Security', title: 'VPC Flow Logs enabled', description: 'Enable VPC Flow Logs for network traffic monitoring and analysis', completed: false, priority: 'high', notes: '' },
      { id: 'sc-ns-4', category: 'Network Security', title: 'Private endpoints configured', description: 'Use VPC endpoints for AWS service access to avoid internet traversal', completed: false, priority: 'medium', notes: '' },
    ],
    compliance: [
      { id: 'sc-co-1', category: 'Compliance', title: 'Compliance framework identified', description: 'Identify applicable compliance frameworks (SOC2, HIPAA, PCI-DSS, ISO 27001)', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-co-2', category: 'Compliance', title: 'AWS Audit Manager configured', description: 'Set up Audit Manager for continuous compliance evidence collection', completed: false, priority: 'high', notes: '' },
      { id: 'sc-co-3', category: 'Compliance', title: 'Config conformance packs', description: 'Deploy AWS Config conformance packs for automated compliance checks', completed: false, priority: 'high', notes: '' },
    ],
    incidentResponse: [
      { id: 'sc-ir-1', category: 'Incident Response', title: 'Incident response plan documented', description: 'Create and document incident response procedures for cloud security events', completed: false, priority: 'critical', notes: '' },
      { id: 'sc-ir-2', category: 'Incident Response', title: 'SNS alert notifications', description: 'Configure SNS topics for security alerts to appropriate stakeholders', completed: false, priority: 'high', notes: '' },
      { id: 'sc-ir-3', category: 'Incident Response', title: 'Automated remediation rules', description: 'Set up automated remediation for common security findings (e.g., public S3 buckets)', completed: false, priority: 'medium', notes: '' },
    ],
  };
}

export function createDefaultSkillAssessments(): SkillAssessment[] {
  return [
    { id: 'sk-1', skillArea: 'AWS Core Services (EC2, S3, VPC)', currentLevel: 'none', targetLevel: 'advanced', gap: 75, trainingRecommendation: 'AWS Cloud Practitioner + Solutions Architect Associate' },
    { id: 'sk-2', skillArea: 'Infrastructure as Code (CloudFormation/Terraform)', currentLevel: 'none', targetLevel: 'intermediate', gap: 50, trainingRecommendation: 'HashiCorp Terraform Associate certification path' },
    { id: 'sk-3', skillArea: 'Containers & Kubernetes (ECS/EKS)', currentLevel: 'none', targetLevel: 'intermediate', gap: 50, trainingRecommendation: 'AWS Container services workshop + EKS workshop' },
    { id: 'sk-4', skillArea: 'CI/CD & DevOps (CodePipeline, CodeBuild)', currentLevel: 'none', targetLevel: 'intermediate', gap: 50, trainingRecommendation: 'AWS DevOps Engineer Professional path' },
    { id: 'sk-5', skillArea: 'Database Migration (DMS, SCT)', currentLevel: 'none', targetLevel: 'advanced', gap: 75, trainingRecommendation: 'AWS Database Specialty certification path' },
    { id: 'sk-6', skillArea: 'Security & Compliance (IAM, GuardDuty)', currentLevel: 'none', targetLevel: 'advanced', gap: 75, trainingRecommendation: 'AWS Security Specialty certification path' },
    { id: 'sk-7', skillArea: 'Monitoring & Observability (CloudWatch)', currentLevel: 'none', targetLevel: 'intermediate', gap: 50, trainingRecommendation: 'AWS Observability workshop' },
    { id: 'sk-8', skillArea: 'Cost Management (Cost Explorer, Budgets)', currentLevel: 'none', targetLevel: 'basic', gap: 25, trainingRecommendation: 'AWS Cloud Financial Management course' },
  ];
}
