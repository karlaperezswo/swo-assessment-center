import {
  ServerCommunication,
  SecurityGroup,
  SecurityGroupRule,
  Server,
  Application
} from '../../../shared/types/assessment.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to generate security group rules from server communications
 */
export class SecurityGroupService {
  /**
   * Generate security groups from communications data
   */
  generateSecurityGroups(
    communications: ServerCommunication[],
    servers: Server[],
    applications: Application[]
  ): SecurityGroup[] {
    const securityGroups: SecurityGroup[] = [];

    // Group communications by application and environment
    const groupedByApp = this.groupCommunicationsByApplication(communications);

    // Create security groups for each application/environment combination
    groupedByApp.forEach((comms, key) => {
      const [appName, environment] = key.split('::');
      const group = this.createSecurityGroupForApp(
        appName,
        environment,
        comms,
        servers,
        applications
      );
      securityGroups.push(group);
    });

    // Create additional groups for servers without application mapping
    const unmappedServers = this.getUnmappedServers(communications, servers);
    unmappedServers.forEach(server => {
      const group = this.createSecurityGroupForServer(
        server,
        communications.filter(c =>
          c.sourceHostname === server.hostname ||
          c.targetHostname === server.hostname ||
          c.sourceIpAddress === server.ipAddress ||
          c.targetIpAddress === server.ipAddress
        )
      );
      securityGroups.push(group);
    });

    return securityGroups;
  }

  /**
   * Group communications by application name and environment
   */
  private groupCommunicationsByApplication(
    communications: ServerCommunication[]
  ): Map<string, ServerCommunication[]> {
    const grouped = new Map<string, ServerCommunication[]>();

    communications.forEach(comm => {
      // Group by source app
      if (comm.sourceAppName) {
        const key = `${comm.sourceAppName}::${comm.sourceEnvironment || 'Unknown'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(comm);
      }

      // Group by target app
      if (comm.targetAppName) {
        const key = `${comm.targetAppName}::${comm.targetEnvironment || 'Unknown'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(comm);
      }
    });

    return grouped;
  }

  /**
   * Create a security group for an application
   */
  private createSecurityGroupForApp(
    appName: string,
    environment: string,
    communications: ServerCommunication[],
    servers: Server[],
    applications: Application[]
  ): SecurityGroup {
    const groupId = this.generateGroupId(appName, environment);
    const groupName = this.generateGroupName(appName, environment);

    // Find associated servers
    const associatedServers = servers
      .filter(s =>
        communications.some(c =>
          c.sourceHostname === s.hostname ||
          c.targetHostname === s.hostname ||
          c.sourceIpAddress === s.ipAddress ||
          c.targetIpAddress === s.ipAddress
        )
      )
      .map(s => s.hostname);

    // Generate inbound rules (where this app is the target)
    const inboundRules = this.generateInboundRules(
      communications.filter(c => c.targetAppName === appName)
    );

    // Generate outbound rules (where this app is the source)
    const outboundRules = this.generateOutboundRules(
      communications.filter(c => c.sourceAppName === appName)
    );

    return {
      groupId,
      groupName,
      description: `Security group for ${appName} in ${environment} environment`,
      inboundRules,
      outboundRules,
      associatedServers,
      associatedApplications: [appName],
      environment
    };
  }

  /**
   * Create a security group for a server without application mapping
   */
  private createSecurityGroupForServer(
    server: Server,
    communications: ServerCommunication[]
  ): SecurityGroup {
    const groupId = this.generateGroupId(server.hostname, server.environment || 'Unknown');
    const groupName = this.generateGroupName(server.hostname, server.environment || 'Unknown');

    // Generate inbound rules (where this server is the target)
    const inboundRules = this.generateInboundRules(
      communications.filter(c =>
        c.targetHostname === server.hostname ||
        c.targetIpAddress === server.ipAddress
      )
    );

    // Generate outbound rules (where this server is the source)
    const outboundRules = this.generateOutboundRules(
      communications.filter(c =>
        c.sourceHostname === server.hostname ||
        c.sourceIpAddress === server.ipAddress
      )
    );

    return {
      groupId,
      groupName,
      description: `Security group for server ${server.hostname}`,
      inboundRules,
      outboundRules,
      associatedServers: [server.hostname],
      associatedApplications: [],
      environment: server.environment
    };
  }

  /**
   * Generate inbound security group rules
   */
  private generateInboundRules(
    communications: ServerCommunication[]
  ): SecurityGroupRule[] {
    // Group by protocol and port to consolidate rules
    const ruleMap = new Map<string, ServerCommunication[]>();

    communications.forEach(comm => {
      const key = `${comm.protocol}:${comm.destinationPort}`;
      if (!ruleMap.has(key)) {
        ruleMap.set(key, []);
      }
      ruleMap.get(key)!.push(comm);
    });

    // Create rules from grouped communications
    const rules: SecurityGroupRule[] = [];

    ruleMap.forEach((comms, key) => {
      const [protocol, port] = key.split(':');
      const portNum = parseInt(port);

      // Group by source to create more specific rules
      const sourceGroups = this.groupBySource(comms);

      sourceGroups.forEach((groupComms, source) => {
        const rule: SecurityGroupRule = {
          ruleId: uuidv4(),
          direction: 'inbound',
          protocol: protocol.toLowerCase(),
          port: portNum || undefined,
          source,
          description: this.generateRuleDescription('inbound', protocol, portNum, groupComms),
          relatedApplications: this.getUniqueValues(groupComms.map(c => c.sourceAppName || '')),
          relatedServers: this.getUniqueValues(groupComms.map(c => c.sourceHostname))
        };

        rules.push(rule);
      });
    });

    return rules;
  }

  /**
   * Generate outbound security group rules
   */
  private generateOutboundRules(
    communications: ServerCommunication[]
  ): SecurityGroupRule[] {
    // Group by protocol and port to consolidate rules
    const ruleMap = new Map<string, ServerCommunication[]>();

    communications.forEach(comm => {
      const key = `${comm.protocol}:${comm.destinationPort}`;
      if (!ruleMap.has(key)) {
        ruleMap.set(key, []);
      }
      ruleMap.get(key)!.push(comm);
    });

    // Create rules from grouped communications
    const rules: SecurityGroupRule[] = [];

    ruleMap.forEach((comms, key) => {
      const [protocol, port] = key.split(':');
      const portNum = parseInt(port);

      // Group by destination to create more specific rules
      const destGroups = this.groupByDestination(comms);

      destGroups.forEach((groupComms, destination) => {
        const rule: SecurityGroupRule = {
          ruleId: uuidv4(),
          direction: 'outbound',
          protocol: protocol.toLowerCase(),
          port: portNum || undefined,
          destination,
          description: this.generateRuleDescription('outbound', protocol, portNum, groupComms),
          relatedApplications: this.getUniqueValues(groupComms.map(c => c.targetAppName || '')),
          relatedServers: this.getUniqueValues(groupComms.map(c => c.targetHostname))
        };

        rules.push(rule);
      });
    });

    return rules;
  }

  /**
   * Group communications by source IP or application
   */
  private groupBySource(
    communications: ServerCommunication[]
  ): Map<string, ServerCommunication[]> {
    const grouped = new Map<string, ServerCommunication[]>();

    communications.forEach(comm => {
      // Prefer grouping by application, fall back to IP
      const key = comm.sourceAppName || comm.sourceIpAddress || comm.sourceHostname;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(comm);
    });

    return grouped;
  }

  /**
   * Group communications by destination IP or application
   */
  private groupByDestination(
    communications: ServerCommunication[]
  ): Map<string, ServerCommunication[]> {
    const grouped = new Map<string, ServerCommunication[]>();

    communications.forEach(comm => {
      // Prefer grouping by application, fall back to IP
      const key = comm.targetAppName || comm.targetIpAddress || comm.targetHostname;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(comm);
    });

    return grouped;
  }

  /**
   * Generate a descriptive rule description
   */
  private generateRuleDescription(
    direction: 'inbound' | 'outbound',
    protocol: string,
    port: number,
    communications: ServerCommunication[]
  ): string {
    const serviceName = this.getServiceNameForPort(port, protocol);
    const uniqueApps = this.getUniqueValues(
      communications.map(c =>
        direction === 'inbound' ? c.sourceAppName || '' : c.targetAppName || ''
      )
    );

    if (serviceName) {
      const appInfo = uniqueApps.length > 0 ? ` from ${uniqueApps.join(', ')}` : '';
      return `Allow ${direction} ${serviceName} (${protocol}/${port})${appInfo}`;
    }

    const appInfo = uniqueApps.length > 0 ? ` for ${uniqueApps.join(', ')}` : '';
    return `Allow ${direction} ${protocol}/${port}${appInfo}`;
  }

  /**
   * Get common service name for a port
   */
  private getServiceNameForPort(port: number, protocol: string): string | null {
    const commonPorts: { [key: string]: string } = {
      // File Transfer & Remote Access
      '20': 'FTP Data',
      '21': 'FTP Control',
      '22': 'SSH',
      '23': 'Telnet',
      '69': 'TFTP',
      '115': 'SFTP',
      '989': 'FTPS Data',
      '990': 'FTPS Control',

      // Email Services
      '25': 'SMTP',
      '110': 'POP3',
      '143': 'IMAP',
      '465': 'SMTPS',
      '587': 'SMTP Submission',
      '993': 'IMAPS',
      '995': 'POP3S',

      // Web Services
      '80': 'HTTP',
      '443': 'HTTPS',
      '8000': 'HTTP Alt',
      '8008': 'HTTP Alt',
      '8080': 'HTTP Alternate',
      '8081': 'HTTP Alt',
      '8443': 'HTTPS Alternate',
      '8888': 'HTTP Alt',

      // Databases
      '1433': 'MSSQL',
      '1434': 'MSSQL Browser',
      '1521': 'Oracle TNS',
      '3050': 'Firebird',
      '3306': 'MySQL',
      '5432': 'PostgreSQL',
      '5984': 'CouchDB',
      '7474': 'Neo4j',
      '9042': 'Cassandra',
      '27017': 'MongoDB',
      '27018': 'MongoDB Shard',
      '28017': 'MongoDB Web',

      // Windows Services
      '135': 'MS RPC',
      '137': 'NetBIOS Name',
      '138': 'NetBIOS Datagram',
      '139': 'NetBIOS Session',
      '445': 'SMB',
      '3389': 'RDP',
      '5985': 'WinRM HTTP',
      '5986': 'WinRM HTTPS',

      // Directory Services
      '88': 'Kerberos',
      '389': 'LDAP',
      '636': 'LDAPS',
      '3268': 'LDAP GC',
      '3269': 'LDAP GC SSL',

      // DNS & Network
      '53': 'DNS',
      '67': 'DHCP Server',
      '68': 'DHCP Client',
      '123': 'NTP',
      '161': 'SNMP',
      '162': 'SNMP Trap',
      '514': 'Syslog',

      // Messaging & Cache
      '5672': 'AMQP/RabbitMQ',
      '6379': 'Redis',
      '11211': 'Memcached',
      '15672': 'RabbitMQ Management',

      // Search & Analytics
      '9200': 'Elasticsearch HTTP',
      '9300': 'Elasticsearch Transport',
      '5601': 'Kibana',
      '8086': 'InfluxDB',

      // Container & Orchestration
      '2375': 'Docker',
      '2376': 'Docker TLS',
      '6443': 'Kubernetes API',
      '10250': 'Kubelet',

      // Monitoring & Logging
      '3000': 'Grafana',
      '4317': 'OpenTelemetry',
      '9090': 'Prometheus',
      '9091': 'Prometheus Pushgateway',
      '9093': 'Alertmanager',

      // Application Servers
      '1099': 'Java RMI',
      '5000': 'Flask/UPnP',
      '8009': 'Apache JServ',
      '9000': 'PHP-FPM',
      '9443': 'WSO2'
    };

    // Check for port ranges (custom applications)
    if (port >= 1430 && port <= 1440) return 'MSSQL Variant';
    if (port >= 8000 && port <= 8999) return 'Web Application';
    if (port >= 9000 && port <= 9999) return 'Application Service';
    if (port >= 32768 && port <= 65535) return 'Dynamic/Ephemeral Port';

    return commonPorts[port.toString()] || null;
  }

  /**
   * Get unique non-empty values from array
   */
  private getUniqueValues(arr: string[]): string[] {
    return Array.from(new Set(arr.filter(v => v && v.trim())));
  }

  /**
   * Get servers without application mapping
   */
  private getUnmappedServers(
    communications: ServerCommunication[],
    servers: Server[]
  ): Server[] {
    // Find servers that appear in communications but don't have app names
    const serversInComms = new Set<string>();

    communications.forEach(comm => {
      if (!comm.sourceAppName && comm.sourceHostname) {
        serversInComms.add(comm.sourceHostname);
      }
      if (!comm.targetAppName && comm.targetHostname) {
        serversInComms.add(comm.targetHostname);
      }
    });

    return servers.filter(s => serversInComms.has(s.hostname));
  }

  /**
   * Generate a security group ID
   */
  private generateGroupId(name: string, environment: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const envSanitized = environment.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `sg-${sanitized}-${envSanitized}`;
  }

  /**
   * Generate a security group name
   */
  private generateGroupName(name: string, environment: string): string {
    return `${name}-${environment}-sg`;
  }

  /**
   * Export security groups to a format suitable for Terraform or CloudFormation
   */
  exportToTerraform(securityGroups: SecurityGroup[]): string {
    // This would generate Terraform HCL code
    // Placeholder for now
    return '# Terraform security groups would be generated here';
  }

  /**
   * Export security groups to CloudFormation YAML
   */
  exportToCloudFormation(securityGroups: SecurityGroup[]): string {
    // This would generate CloudFormation YAML
    // Placeholder for now
    return '# CloudFormation security groups would be generated here';
  }
}
