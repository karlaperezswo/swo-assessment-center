import type { IDatabaseService, DbRecommendationInput } from '../../types';
import type {
  CloudDatabaseRecommendation,
  NormalizedDbEngine,
} from '../../../../../shared/types/cloud.types';
import { recommendDb } from '../../algorithms/dbSizing';
import { GCP_DATABASE } from '../../../data/pricing/gcp/database';

const ENGINE_MAP: Record<string, { service: string; engine: NormalizedDbEngine }> = {
  MSSQL:        { service: 'Cloud SQL for SQL Server', engine: 'sqlserver' },
  'SQL Server': { service: 'Cloud SQL for SQL Server', engine: 'sqlserver' },
  PostgreSQL:   { service: 'Cloud SQL for PostgreSQL', engine: 'postgresql' },
  MySQL:        { service: 'Cloud SQL for MySQL',      engine: 'mysql' },
  MariaDB:      { service: 'Cloud SQL for MySQL',      engine: 'mysql' },     // GCP doesn't manage MariaDB; closest is MySQL.
  Oracle:       { service: 'Bare Metal Solution for Oracle', engine: 'oracle' },
};

export const gcpDatabase: IDatabaseService = {
  catalog: GCP_DATABASE,

  mapEngine(sourceEngine: string) {
    return ENGINE_MAP[sourceEngine] ?? { service: 'Cloud SQL', engine: 'mysql' };
  },

  recommend(input: DbRecommendationInput): CloudDatabaseRecommendation {
    const { service } = this.mapEngine(input.engineType);
    return recommendDb(input, GCP_DATABASE, 'gcp', service, {
      // pd-ssd ~$0.17/GB/month — Cloud SQL storage premium over Compute Engine.
      storagePerGBMonth: 0.17,
    });
  },
};
