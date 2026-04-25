import type { IDatabaseService, DbRecommendationInput } from '../../types';
import type {
  CloudDatabaseRecommendation,
  NormalizedDbEngine,
} from '../../../../../shared/types/cloud.types';
import { recommendDb } from '../../algorithms/dbSizing';
import { AWS_DATABASE } from '../../../data/pricing/aws/database';

const ENGINE_MAP: Record<string, { service: string; engine: NormalizedDbEngine }> = {
  MSSQL:        { service: 'Amazon RDS for SQL Server', engine: 'sqlserver' },
  'SQL Server': { service: 'Amazon RDS for SQL Server', engine: 'sqlserver' },
  PostgreSQL:   { service: 'Amazon RDS for PostgreSQL', engine: 'postgresql' },
  MySQL:        { service: 'Amazon RDS for MySQL',      engine: 'mysql' },
  MariaDB:      { service: 'Amazon RDS for MariaDB',    engine: 'mariadb' },
  Oracle:       { service: 'Amazon RDS for Oracle',     engine: 'oracle' },
};

export const awsDatabase: IDatabaseService = {
  catalog: AWS_DATABASE,

  mapEngine(sourceEngine: string) {
    return ENGINE_MAP[sourceEngine] ?? { service: 'Amazon RDS', engine: 'mysql' };
  },

  recommend(input: DbRecommendationInput): CloudDatabaseRecommendation {
    const { service } = this.mapEngine(input.engineType);
    return recommendDb(input, AWS_DATABASE, 'aws', service, {
      storagePerGBMonth: 0.08,
    });
  },
};
