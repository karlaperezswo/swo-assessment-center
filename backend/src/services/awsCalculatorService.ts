import { EC2Recommendation, DatabaseRecommendation, Server, CostEstimate } from '../types';

interface CostBreakdown {
  onDemand: CostEstimate;
  oneYearNuri: CostEstimate;
  threeYearNuri: CostEstimate;
}

// Reserved Instance discount rates
const RI_DISCOUNTS = {
  oneYear: 0.36, // ~36% discount for 1-year NURI
  threeYear: 0.60 // ~60% discount for 3-year NURI
};

// EBS Storage pricing (gp3)
const EBS_PRICE_PER_GB = 0.08; // $/GB/month

export class AWSCalculatorService {
  calculateCosts(
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[],
    servers: Server[]
  ): CostBreakdown {
    // Calculate EC2 costs
    const ec2OnDemandMonthly = ec2Recommendations.reduce(
      (sum, rec) => sum + rec.monthlyEstimate,
      0
    );

    // Calculate storage costs
    const totalStorageGB = servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);
    const storageMonthly = totalStorageGB * EBS_PRICE_PER_GB;

    // Calculate RDS costs
    const rdsOnDemandMonthly = dbRecommendations.reduce(
      (sum, rec) => sum + rec.monthlyEstimate,
      0
    );

    // Calculate networking costs (estimate: 10% of compute)
    const networkingMonthly = (ec2OnDemandMonthly + rdsOnDemandMonthly) * 0.1;

    // Total on-demand monthly
    const totalOnDemandMonthly = ec2OnDemandMonthly + storageMonthly + rdsOnDemandMonthly + networkingMonthly;

    // Apply RI discounts (only to compute, not storage/networking)
    const computeOnDemand = ec2OnDemandMonthly + rdsOnDemandMonthly;
    const nonCompute = storageMonthly + networkingMonthly;

    const oneYearMonthly = computeOnDemand * (1 - RI_DISCOUNTS.oneYear) + nonCompute;
    const threeYearMonthly = computeOnDemand * (1 - RI_DISCOUNTS.threeYear) + nonCompute;

    return {
      onDemand: {
        monthly: Math.round(totalOnDemandMonthly * 100) / 100,
        annual: Math.round(totalOnDemandMonthly * 12 * 100) / 100,
        threeYear: Math.round(totalOnDemandMonthly * 36 * 100) / 100
      },
      oneYearNuri: {
        monthly: Math.round(oneYearMonthly * 100) / 100,
        annual: Math.round(oneYearMonthly * 12 * 100) / 100,
        threeYear: Math.round(oneYearMonthly * 36 * 100) / 100
      },
      threeYearNuri: {
        monthly: Math.round(threeYearMonthly * 100) / 100,
        annual: Math.round(threeYearMonthly * 12 * 100) / 100,
        threeYear: Math.round(threeYearMonthly * 36 * 100) / 100
      }
    };
  }

  generateCalculatorLinks(
    region: string,
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[]
  ): { onDemand: string; oneYearNuri: string; threeYearNuri: string } {
    // AWS Calculator URLs - Estos links llevan a la calculadora donde el usuario puede crear estimaciones
    // Nota: AWS Calculator no tiene API pública para generar configuraciones automáticamente
    // El documento incluye todas las especificaciones detalladas para ingresar manualmente

    const baseUrl = 'https://calculator.aws/#/addService';
    const regionParam = `?region=${region}`;

    // Links directos a agregar cada servicio en la calculadora
    const ec2Link = `${baseUrl}/EC2${regionParam}`;
    const rdsLink = `${baseUrl}/RDS${regionParam}`;
    const ebsLink = `${baseUrl}/EBS${regionParam}`;

    // Proporcionar el link a la calculadora principal con la región correcta
    const mainCalculatorUrl = `https://calculator.aws/#/estimate?region=${region}`;

    return {
      onDemand: mainCalculatorUrl,
      oneYearNuri: mainCalculatorUrl,
      threeYearNuri: mainCalculatorUrl
    };
  }

  private buildCalculatorConfig(
    region: string,
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[]
  ): object {
    return {
      region,
      ec2: {
        instances: ec2Recommendations.map(rec => ({
          instanceType: rec.recommendedInstance,
          quantity: 1,
          usage: 730 // hours per month
        }))
      },
      ebs: {
        volumes: ec2Recommendations.map(rec => ({
          type: 'gp3',
          size: rec.originalSpecs.storage,
          quantity: 1
        }))
      },
      rds: {
        instances: dbRecommendations.map(rec => ({
          instanceClass: rec.instanceClass,
          engine: rec.targetEngine,
          storage: rec.storageGB,
          quantity: 1
        }))
      },
      vpc: {
        natGateways: 2,
        dataTransferGB: 1000
      }
    };
  }

  generateDetailedCostBreakdown(
    ec2Recommendations: EC2Recommendation[],
    dbRecommendations: DatabaseRecommendation[],
    servers: Server[]
  ): {
    ec2: { total: number; details: { instance: string; cost: number }[] };
    ebs: { total: number; totalGB: number };
    rds: { total: number; details: { db: string; cost: number }[] };
    networking: { total: number };
  } {
    const ec2Details = ec2Recommendations.map(rec => ({
      instance: `${rec.hostname} (${rec.recommendedInstance})`,
      cost: rec.monthlyEstimate
    }));

    const totalStorageGB = servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0);
    const ebsTotal = totalStorageGB * EBS_PRICE_PER_GB;

    const rdsDetails = dbRecommendations.map(rec => ({
      db: `${rec.dbName} (${rec.instanceClass})`,
      cost: rec.monthlyEstimate
    }));

    const computeTotal = ec2Recommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0) +
      dbRecommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0);

    return {
      ec2: {
        total: ec2Recommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0),
        details: ec2Details
      },
      ebs: {
        total: ebsTotal,
        totalGB: totalStorageGB
      },
      rds: {
        total: dbRecommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0),
        details: rdsDetails
      },
      networking: {
        total: computeTotal * 0.1
      }
    };
  }
}
