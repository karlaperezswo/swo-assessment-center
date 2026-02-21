// Landing Zone Template Generators - AWS Best Practices

export interface LandingZoneConfig {
  organizationName: string;
  primaryRegion: string;
  secondaryRegion?: string;
  accountEmail: string;
  enableSecurityHub: boolean;
  enableGuardDuty: boolean;
  enableCloudTrail: boolean;
  enableConfig: boolean;
  vpcCidr: string;
  enableTransitGateway: boolean;
}

export const defaultLandingZoneConfig: LandingZoneConfig = {
  organizationName: 'MyOrganization',
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  accountEmail: 'aws-accounts@example.com',
  enableSecurityHub: true,
  enableGuardDuty: true,
  enableCloudTrail: true,
  enableConfig: true,
  vpcCidr: '10.0.0.0/16',
  enableTransitGateway: false,
};

export function generateCloudFormationTemplate(config: LandingZoneConfig): string {
  return `AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Landing Zone - ${config.organizationName} - Multi-Account Foundation'

Parameters:
  OrganizationName:
    Type: String
    Default: ${config.organizationName}
    Description: Nombre de la organización

  PrimaryRegion:
    Type: String
    Default: ${config.primaryRegion}
    Description: Región principal de AWS

  VpcCIDR:
    Type: String
    Default: ${config.vpcCidr}
    Description: CIDR block para la VPC principal
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Configuración de Organización"
        Parameters:
          - OrganizationName
          - PrimaryRegion
      - Label:
          default: "Configuración de Red"
        Parameters:
          - VpcCIDR

Resources:
  # ==========================================
  # ORGANIZATIONAL UNITS
  # ==========================================

  SecurityOU:
    Type: AWS::Organizations::OrganizationalUnit
    Properties:
      Name: Security
      ParentId: !GetAtt Organization.RootId

  InfrastructureOU:
    Type: AWS::Organizations::OrganizationalUnit
    Properties:
      Name: Infrastructure
      ParentId: !GetAtt Organization.RootId

  WorkloadsOU:
    Type: AWS::Organizations::OrganizationalUnit
    Properties:
      Name: Workloads
      ParentId: !GetAtt Organization.RootId

  # ==========================================
  # VPC FOUNDATION
  # ==========================================

  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-main-vpc'
        - Key: Environment
          Value: shared

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-private-subnet-2'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MainVPC
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-nat-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '\${OrganizationName}-public-routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2${config.enableCloudTrail ? `

  # ==========================================
  # CLOUDTRAIL - Audit Logging
  # ==========================================

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${OrganizationName}-cloudtrail-\${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '\${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  OrganizationTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '\${OrganizationName}-organization-trail'
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      IsMultiRegionTrail: true
      IsOrganizationTrail: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true` : ''}${config.enableGuardDuty ? `

  # ==========================================
  # GUARDDUTY - Threat Detection
  # ==========================================

  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES` : ''}${config.enableSecurityHub ? `

  # ==========================================
  # SECURITY HUB - Security Posture Management
  # ==========================================

  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        Organization: !Ref OrganizationName` : ''}${config.enableConfig ? `

  # ==========================================
  # AWS CONFIG - Configuration Compliance
  # ==========================================

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${OrganizationName}-config-\${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:PutObject
                  - s3:GetObject
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub '\${ConfigBucket.Arn}/*'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref ConfigBucket` : ''}

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref MainVPC
    Export:
      Name: !Sub '\${AWS::StackName}-VpcId'

  PublicSubnets:
    Description: Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '\${AWS::StackName}-PublicSubnets'

  PrivateSubnets:
    Description: Private Subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '\${AWS::StackName}-PrivateSubnets'${config.enableCloudTrail ? `

  CloudTrailBucket:
    Description: S3 Bucket for CloudTrail logs
    Value: !Ref CloudTrailBucket` : ''}${config.enableConfig ? `

  ConfigBucket:
    Description: S3 Bucket for AWS Config
    Value: !Ref ConfigBucket` : ''}
`;
}

export function generateTerraformTemplate(config: LandingZoneConfig): string {
  return `# AWS Landing Zone - ${config.organizationName}
# Terraform Configuration - Multi-Account Foundation

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configurar después de crear bucket de estado
    # bucket = "${config.organizationName.toLowerCase()}-terraform-state"
    # key    = "landing-zone/terraform.tfstate"
    # region = "${config.primaryRegion}"
    # encrypt = true
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Organization = var.organization_name
      ManagedBy    = "Terraform"
      Environment  = "shared"
    }
  }
}

# ==========================================
# VARIABLES
# ==========================================

variable "organization_name" {
  description = "Nombre de la organización"
  type        = string
  default     = "${config.organizationName}"
}

variable "primary_region" {
  description = "Región principal de AWS"
  type        = string
  default     = "${config.primaryRegion}"
}

variable "vpc_cidr" {
  description = "CIDR block para la VPC principal"
  type        = string
  default     = "${config.vpcCidr}"
}

variable "enable_security_hub" {
  description = "Habilitar AWS Security Hub"
  type        = bool
  default     = ${config.enableSecurityHub}
}

variable "enable_guardduty" {
  description = "Habilitar Amazon GuardDuty"
  type        = bool
  default     = ${config.enableGuardDuty}
}

variable "enable_cloudtrail" {
  description = "Habilitar AWS CloudTrail"
  type        = bool
  default     = ${config.enableCloudTrail}
}

variable "enable_config" {
  description = "Habilitar AWS Config"
  type        = bool
  default     = ${config.enableConfig}
}

# ==========================================
# DATA SOURCES
# ==========================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ==========================================
# VPC FOUNDATION
# ==========================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.organization_name}-main-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.organization_name}-public-subnet-\${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.organization_name}-private-subnet-\${count.index + 1}"
    Type = "Private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.organization_name}-igw"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "\${var.organization_name}-nat-eip-\${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "\${var.organization_name}-nat-\${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.organization_name}-public-routes"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "\${var.organization_name}-private-routes-\${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/\${var.organization_name}-flow-logs"
  retention_in_days = 30
}

resource "aws_iam_role" "flow_logs" {
  name = "\${var.organization_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect = "Allow"
      Resource = "*"
    }]
  })
}
${config.enableCloudTrail ? `
# ==========================================
# CLOUDTRAIL - Audit Logging
# ==========================================

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "\${var.organization_name}-cloudtrail-\${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "\${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "organization" {
  name                          = "\${var.organization_name}-organization-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  is_multi_region_trail         = true
  is_organization_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}
` : ''}${config.enableGuardDuty ? `
# ==========================================
# GUARDDUTY - Threat Detection
# ==========================================

resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}
` : ''}${config.enableSecurityHub ? `
# ==========================================
# SECURITY HUB - Security Posture Management
# ==========================================

resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0"
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0"
}
` : ''}${config.enableConfig ? `
# ==========================================
# AWS CONFIG - Configuration Compliance
# ==========================================

resource "aws_s3_bucket" "config" {
  bucket = "\${var.organization_name}-config-\${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "config" {
  name = "\${var.organization_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetBucketVersioning",
        "s3:PutObject",
        "s3:GetObject"
      ]
      Resource = [
        aws_s3_bucket.config.arn,
        "\${aws_s3_bucket.config.arn}/*"
      ]
    }]
  })
}

resource "aws_config_configuration_recorder" "main" {
  name     = "\${var.organization_name}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "\${var.organization_name}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.id

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}
` : ''}
# ==========================================
# OUTPUTS
# ==========================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public Subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private Subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ips" {
  description = "NAT Gateway Public IPs"
  value       = aws_eip.nat[*].public_ip
}${config.enableCloudTrail ? `

output "cloudtrail_bucket" {
  description = "S3 Bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.id
}` : ''}${config.enableConfig ? `

output "config_bucket" {
  description = "S3 Bucket for AWS Config"
  value       = aws_s3_bucket.config.id
}` : ''}
`;
}

export function generateReadmeTemplate(config: LandingZoneConfig): string {
  return `# AWS Landing Zone - ${config.organizationName}

Esta Landing Zone ha sido generada automáticamente basándose en las mejores prácticas de AWS.

## 📋 Componentes Incluidos

- ✅ VPC multi-AZ con subnets públicas y privadas
- ✅ NAT Gateways para alta disponibilidad
- ✅ VPC Flow Logs para auditoría de red${config.enableCloudTrail ? '\n- ✅ AWS CloudTrail para auditoría de API calls' : ''}${config.enableGuardDuty ? '\n- ✅ Amazon GuardDuty para detección de amenazas' : ''}${config.enableSecurityHub ? '\n- ✅ AWS Security Hub con CIS Benchmarks' : ''}${config.enableConfig ? '\n- ✅ AWS Config para compliance continuo' : ''}

## 🚀 Despliegue con CloudFormation

### Prerrequisitos
- AWS CLI configurado
- Permisos de administrador en la cuenta AWS
- AWS Organizations habilitado (para multi-account)

### Pasos de Despliegue

\`\`\`bash
# 1. Validar el template
aws cloudformation validate-template \\
  --template-body file://landing-zone.yaml

# 2. Crear el stack
aws cloudformation create-stack \\
  --stack-name ${config.organizationName}-landing-zone \\
  --template-body file://landing-zone.yaml \\
  --parameters \\
    ParameterKey=OrganizationName,ParameterValue=${config.organizationName} \\
    ParameterKey=PrimaryRegion,ParameterValue=${config.primaryRegion} \\
    ParameterKey=VpcCIDR,ParameterValue=${config.vpcCidr} \\
  --capabilities CAPABILITY_NAMED_IAM \\
  --region ${config.primaryRegion}

# 3. Monitorear el progreso
aws cloudformation wait stack-create-complete \\
  --stack-name ${config.organizationName}-landing-zone \\
  --region ${config.primaryRegion}

# 4. Obtener outputs
aws cloudformation describe-stacks \\
  --stack-name ${config.organizationName}-landing-zone \\
  --query 'Stacks[0].Outputs' \\
  --region ${config.primaryRegion}
\`\`\`

## 🔧 Despliegue con Terraform

### Prerrequisitos
- Terraform >= 1.0 instalado
- AWS CLI configurado
- Permisos de administrador en la cuenta AWS

### Pasos de Despliegue

\`\`\`bash
# 1. Inicializar Terraform
terraform init

# 2. Ver el plan de ejecución
terraform plan

# 3. Aplicar la configuración
terraform apply

# 4. Ver outputs
terraform output
\`\`\`

### Configurar Backend Remoto (Recomendado)

Primero crea un bucket S3 y tabla DynamoDB para el estado:

\`\`\`bash
# Crear bucket para estado de Terraform
aws s3 mb s3://${config.organizationName.toLowerCase()}-terraform-state \\
  --region ${config.primaryRegion}

# Habilitar versionado
aws s3api put-bucket-versioning \\
  --bucket ${config.organizationName.toLowerCase()}-terraform-state \\
  --versioning-configuration Status=Enabled

# Habilitar encriptación
aws s3api put-bucket-encryption \\
  --bucket ${config.organizationName.toLowerCase()}-terraform-state \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Crear tabla DynamoDB para lock
aws dynamodb create-table \\
  --table-name terraform-state-lock \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST \\
  --region ${config.primaryRegion}
\`\`\`

Luego descomenta el bloque \`backend\` en \`main.tf\` y ejecuta \`terraform init\`.

## 🔐 Configuración Post-Despliegue

### 1. Habilitar MFA para Root Account
\`\`\`bash
# Seguir guía: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html
\`\`\`

### 2. Configurar AWS Organizations (Multi-Account)
\`\`\`bash
# Crear OUs adicionales según necesidad
aws organizations create-organizational-unit \\
  --parent-id <ROOT_OU_ID> \\
  --name "Development"
\`\`\`

### 3. Configurar Presupuestos y Alertas
\`\`\`bash
aws budgets create-budget \\
  --account-id <ACCOUNT_ID> \\
  --budget file://budget-config.json
\`\`\`

### 4. Revisar Security Hub Findings
\`\`\`bash
aws securityhub get-findings \\
  --filters '{"SeverityLabel": [{"Value": "CRITICAL", "Comparison": "EQUALS"}]}' \\
  --region ${config.primaryRegion}
\`\`\`

## 📊 Monitoreo y Mantenimiento

### CloudWatch Dashboards
Se recomienda crear dashboards personalizados para:
- VPC Flow Logs analysis
- GuardDuty findings
- Config compliance status
- Cost and usage

### Compliance Checks
- Revisar Security Hub diariamente
- Revisar Config Rules semanalmente
- Auditar CloudTrail mensualmente

## 🆘 Troubleshooting

### Error: "InsufficientCapabilities"
**Solución**: Agregar \`--capabilities CAPABILITY_NAMED_IAM\` al comando de CloudFormation.

### Error: "VPC CIDR overlap"
**Solución**: Modificar el parámetro \`VpcCIDR\` con un rango diferente.

### Error: "GuardDuty already enabled"
**Solución**: Deshabilitar GuardDuty manualmente o eliminar ese recurso del template.

## 📝 Notas Importantes

- **Costos**: Esta configuración tiene costos asociados (NAT Gateways, VPC Flow Logs, etc.)
- **Región**: Desplegado en \`${config.primaryRegion}\` por defecto
- **Multi-Region**: Para alta disponibilidad global, considerar desplegar en múltiples regiones
- **Customización**: Revisa y ajusta los templates según necesidades específicas

## 🔗 Referencias

- [AWS Landing Zone User Guide](https://aws.amazon.com/solutions/implementations/landing-zone/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [AWS Multi-Account Strategy](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices_mgmt-acct.html)

---

**Generado por**: AWS Assessment Center
**Fecha**: ${new Date().toISOString().split('T')[0]}
`;
}
