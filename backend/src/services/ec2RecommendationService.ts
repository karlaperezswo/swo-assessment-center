import { Server, Database, EC2Recommendation, DatabaseRecommendation } from '../types';

interface EC2InstanceSpec {
  vcpus: number;
  memory: number;
  monthlyPriceOnDemand: number;
  monthlyPrice1YearNuri: number;
  monthlyPrice3YearNuri: number;
}

// EC2 Instance pricing (us-east-1, Linux, approximate)
const EC2_INSTANCES: Record<string, EC2InstanceSpec> = {
  // T3 - Burstable
  't3.micro': { vcpus: 2, memory: 1, monthlyPriceOnDemand: 7.59, monthlyPrice1YearNuri: 4.82, monthlyPrice3YearNuri: 3.07 },
  't3.small': { vcpus: 2, memory: 2, monthlyPriceOnDemand: 15.18, monthlyPrice1YearNuri: 9.64, monthlyPrice3YearNuri: 6.13 },
  't3.medium': { vcpus: 2, memory: 4, monthlyPriceOnDemand: 30.37, monthlyPrice1YearNuri: 19.27, monthlyPrice3YearNuri: 12.26 },
  't3.large': { vcpus: 2, memory: 8, monthlyPriceOnDemand: 60.74, monthlyPrice1YearNuri: 38.54, monthlyPrice3YearNuri: 24.53 },
  't3.xlarge': { vcpus: 4, memory: 16, monthlyPriceOnDemand: 121.47, monthlyPrice1YearNuri: 77.09, monthlyPrice3YearNuri: 49.06 },
  't3.2xlarge': { vcpus: 8, memory: 32, monthlyPriceOnDemand: 242.94, monthlyPrice1YearNuri: 154.18, monthlyPrice3YearNuri: 98.11 },

  // M5 - General Purpose
  'm5.large': { vcpus: 2, memory: 8, monthlyPriceOnDemand: 70.08, monthlyPrice1YearNuri: 44.53, monthlyPrice3YearNuri: 29.57 },
  'm5.xlarge': { vcpus: 4, memory: 16, monthlyPriceOnDemand: 140.16, monthlyPrice1YearNuri: 89.06, monthlyPrice3YearNuri: 59.13 },
  'm5.2xlarge': { vcpus: 8, memory: 32, monthlyPriceOnDemand: 280.32, monthlyPrice1YearNuri: 178.12, monthlyPrice3YearNuri: 118.26 },
  'm5.4xlarge': { vcpus: 16, memory: 64, monthlyPriceOnDemand: 560.64, monthlyPrice1YearNuri: 356.24, monthlyPrice3YearNuri: 236.52 },
  'm5.8xlarge': { vcpus: 32, memory: 128, monthlyPriceOnDemand: 1121.28, monthlyPrice1YearNuri: 712.48, monthlyPrice3YearNuri: 473.04 },
  'm5.12xlarge': { vcpus: 48, memory: 192, monthlyPriceOnDemand: 1681.92, monthlyPrice1YearNuri: 1068.72, monthlyPrice3YearNuri: 709.56 },
  'm5.16xlarge': { vcpus: 64, memory: 256, monthlyPriceOnDemand: 2242.56, monthlyPrice1YearNuri: 1424.96, monthlyPrice3YearNuri: 946.08 },

  // R5 - Memory Optimized
  'r5.large': { vcpus: 2, memory: 16, monthlyPriceOnDemand: 91.98, monthlyPrice1YearNuri: 58.40, monthlyPrice3YearNuri: 38.69 },
  'r5.xlarge': { vcpus: 4, memory: 32, monthlyPriceOnDemand: 183.96, monthlyPrice1YearNuri: 116.80, monthlyPrice3YearNuri: 77.38 },
  'r5.2xlarge': { vcpus: 8, memory: 64, monthlyPriceOnDemand: 367.92, monthlyPrice1YearNuri: 233.60, monthlyPrice3YearNuri: 154.75 },
  'r5.4xlarge': { vcpus: 16, memory: 128, monthlyPriceOnDemand: 735.84, monthlyPrice1YearNuri: 467.20, monthlyPrice3YearNuri: 309.50 },
  'r5.8xlarge': { vcpus: 32, memory: 256, monthlyPriceOnDemand: 1471.68, monthlyPrice1YearNuri: 934.40, monthlyPrice3YearNuri: 619.01 },
  'r5.12xlarge': { vcpus: 48, memory: 384, monthlyPriceOnDemand: 2207.52, monthlyPrice1YearNuri: 1401.60, monthlyPrice3YearNuri: 928.51 },

  // C5 - Compute Optimized
  'c5.large': { vcpus: 2, memory: 4, monthlyPriceOnDemand: 62.05, monthlyPrice1YearNuri: 39.42, monthlyPrice3YearNuri: 26.06 },
  'c5.xlarge': { vcpus: 4, memory: 8, monthlyPriceOnDemand: 124.10, monthlyPrice1YearNuri: 78.84, monthlyPrice3YearNuri: 52.12 },
  'c5.2xlarge': { vcpus: 8, memory: 16, monthlyPriceOnDemand: 248.20, monthlyPrice1YearNuri: 157.68, monthlyPrice3YearNuri: 104.24 },
  'c5.4xlarge': { vcpus: 16, memory: 32, monthlyPriceOnDemand: 496.40, monthlyPrice1YearNuri: 315.36, monthlyPrice3YearNuri: 208.48 },
  'c5.9xlarge': { vcpus: 36, memory: 72, monthlyPriceOnDemand: 1116.90, monthlyPrice1YearNuri: 709.56, monthlyPrice3YearNuri: 469.08 },
};

// Windows pricing multiplier (approximately 1.8x Linux pricing)
const WINDOWS_MULTIPLIER = 1.8;

// RDS Instance pricing (approximate)
const RDS_INSTANCES: Record<string, EC2InstanceSpec> = {
  'db.t3.micro': { vcpus: 2, memory: 1, monthlyPriceOnDemand: 12.41, monthlyPrice1YearNuri: 8.03, monthlyPrice3YearNuri: 5.47 },
  'db.t3.small': { vcpus: 2, memory: 2, monthlyPriceOnDemand: 24.82, monthlyPrice1YearNuri: 16.06, monthlyPrice3YearNuri: 10.95 },
  'db.t3.medium': { vcpus: 2, memory: 4, monthlyPriceOnDemand: 49.64, monthlyPrice1YearNuri: 32.12, monthlyPrice3YearNuri: 21.90 },
  'db.t3.large': { vcpus: 2, memory: 8, monthlyPriceOnDemand: 99.28, monthlyPrice1YearNuri: 64.24, monthlyPrice3YearNuri: 43.80 },
  'db.m5.large': { vcpus: 2, memory: 8, monthlyPriceOnDemand: 125.56, monthlyPrice1YearNuri: 81.25, monthlyPrice3YearNuri: 55.37 },
  'db.m5.xlarge': { vcpus: 4, memory: 16, monthlyPriceOnDemand: 251.12, monthlyPrice1YearNuri: 162.50, monthlyPrice3YearNuri: 110.74 },
  'db.m5.2xlarge': { vcpus: 8, memory: 32, monthlyPriceOnDemand: 502.24, monthlyPrice1YearNuri: 325.00, monthlyPrice3YearNuri: 221.47 },
  'db.m5.4xlarge': { vcpus: 16, memory: 64, monthlyPriceOnDemand: 1004.48, monthlyPrice1YearNuri: 650.00, monthlyPrice3YearNuri: 442.94 },
  'db.r5.large': { vcpus: 2, memory: 16, monthlyPriceOnDemand: 175.20, monthlyPrice1YearNuri: 113.36, monthlyPrice3YearNuri: 77.25 },
  'db.r5.xlarge': { vcpus: 4, memory: 32, monthlyPriceOnDemand: 350.40, monthlyPrice1YearNuri: 226.72, monthlyPrice3YearNuri: 154.50 },
  'db.r5.2xlarge': { vcpus: 8, memory: 64, monthlyPriceOnDemand: 700.80, monthlyPrice1YearNuri: 453.44, monthlyPrice3YearNuri: 309.00 },
  'db.r5.4xlarge': { vcpus: 16, memory: 128, monthlyPriceOnDemand: 1401.60, monthlyPrice1YearNuri: 906.88, monthlyPrice3YearNuri: 618.00 },
};

export class EC2RecommendationService {
  generateRecommendations(servers: Server[], region: string): EC2Recommendation[] {
    return servers.map(server => this.recommendInstance(server));
  }

  private recommendInstance(server: Server): EC2Recommendation {
    // Calculate total vCPUs
    const totalVcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
    const memoryGB = server.totalRAM;

    // Rightsizing based on utilization
    let targetVcpus = totalVcpus;
    let targetMemory = memoryGB;
    let rightsizingNote = 'Direct match';

    const avgCpu = server.avgCpuUsage || 0;
    const avgRam = server.avgRamUsage || 0;

    if (avgCpu > 0 || avgRam > 0) {
      if (avgCpu < 20 && avgRam < 30) {
        targetVcpus = Math.max(2, Math.ceil(totalVcpus * 0.5));
        targetMemory = Math.max(2, Math.ceil(memoryGB * 0.5));
        rightsizingNote = 'Rightsized (50%): Very low utilization detected';
      } else if (avgCpu < 40 && avgRam < 50) {
        targetVcpus = Math.max(2, Math.ceil(totalVcpus * 0.75));
        targetMemory = Math.max(2, Math.ceil(memoryGB * 0.75));
        rightsizingNote = 'Rightsized (75%): Low utilization detected';
      }
    }

    // Determine instance family based on CPU:Memory ratio
    const ratio = targetMemory / Math.max(targetVcpus, 1);
    let family: string;

    if (ratio >= 8) {
      family = 'r5'; // Memory optimized
    } else if (ratio <= 2) {
      family = 'c5'; // Compute optimized
    } else if (targetVcpus <= 4 && targetMemory <= 16) {
      family = 't3'; // Burstable for small workloads
    } else {
      family = 'm5'; // General purpose
    }

    // Find best matching instance
    const candidates = Object.entries(EC2_INSTANCES)
      .filter(([name]) => name.startsWith(family))
      .filter(([_, spec]) => spec.vcpus >= targetVcpus && spec.memory >= targetMemory)
      .sort((a, b) => a[1].monthlyPriceOnDemand - b[1].monthlyPriceOnDemand);

    const [instanceName, spec] = candidates[0] || ['m5.large', EC2_INSTANCES['m5.large']];

    // Apply Windows pricing if applicable
    const isWindows = server.osName?.toLowerCase().includes('windows');
    const priceMultiplier = isWindows ? WINDOWS_MULTIPLIER : 1;

    return {
      hostname: server.hostname,
      originalSpecs: {
        vcpus: totalVcpus,
        ram: memoryGB,
        storage: server.totalDiskSize
      },
      recommendedInstance: instanceName,
      instanceFamily: family,
      rightsizingNote,
      monthlyEstimate: spec.monthlyPriceOnDemand * priceMultiplier
    };
  }

  generateDatabaseRecommendations(databases: Database[], region: string): DatabaseRecommendation[] {
    return databases.map(db => this.recommendDatabaseInstance(db));
  }

  private recommendDatabaseInstance(db: Database): DatabaseRecommendation {
    // Map source engine to target AWS service
    const engineMapping: Record<string, string> = {
      'MSSQL': 'Amazon RDS for SQL Server',
      'SQL Server': 'Amazon RDS for SQL Server',
      'PostgreSQL': 'Amazon RDS for PostgreSQL',
      'MySQL': 'Amazon RDS for MySQL',
      'MariaDB': 'Amazon RDS for MariaDB',
      'Oracle': 'Amazon RDS for Oracle'
    };

    const targetEngine = engineMapping[db.engineType] || 'Amazon RDS';

    // Recommend instance based on database size
    let instanceClass = 'db.t3.medium';
    let monthlyEstimate = RDS_INSTANCES['db.t3.medium'].monthlyPriceOnDemand;

    if (db.totalSize > 500) {
      instanceClass = 'db.r5.2xlarge';
      monthlyEstimate = RDS_INSTANCES['db.r5.2xlarge'].monthlyPriceOnDemand;
    } else if (db.totalSize > 200) {
      instanceClass = 'db.r5.xlarge';
      monthlyEstimate = RDS_INSTANCES['db.r5.xlarge'].monthlyPriceOnDemand;
    } else if (db.totalSize > 100) {
      instanceClass = 'db.m5.xlarge';
      monthlyEstimate = RDS_INSTANCES['db.m5.xlarge'].monthlyPriceOnDemand;
    } else if (db.totalSize > 50) {
      instanceClass = 'db.m5.large';
      monthlyEstimate = RDS_INSTANCES['db.m5.large'].monthlyPriceOnDemand;
    } else if (db.totalSize > 20) {
      instanceClass = 'db.t3.large';
      monthlyEstimate = RDS_INSTANCES['db.t3.large'].monthlyPriceOnDemand;
    }

    // Add storage cost (gp3: $0.08/GB/month)
    const storageCost = db.totalSize * 0.08;
    monthlyEstimate += storageCost;

    return {
      dbName: db.dbName,
      sourceEngine: db.engineType,
      targetEngine,
      instanceClass,
      storageGB: db.totalSize,
      monthlyEstimate,
      licenseModel: db.licenseModel || 'license-included'
    };
  }

  getInstancePricing(instanceName: string, isWindows: boolean = false): EC2InstanceSpec | undefined {
    const spec = EC2_INSTANCES[instanceName];
    if (!spec) return undefined;

    const multiplier = isWindows ? WINDOWS_MULTIPLIER : 1;
    return {
      ...spec,
      monthlyPriceOnDemand: spec.monthlyPriceOnDemand * multiplier,
      monthlyPrice1YearNuri: spec.monthlyPrice1YearNuri * multiplier,
      monthlyPrice3YearNuri: spec.monthlyPrice3YearNuri * multiplier
    };
  }
}
