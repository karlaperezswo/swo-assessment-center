import type { IDatabaseService, DbRecommendationInput } from '../../types';
import type {
  CloudDatabaseRecommendation,
  NormalizedDbEngine,
} from '../../../../../shared/types/cloud.types';
import { recommendDb } from '../../algorithms/dbSizing';
import { ORACLE_DATABASE } from '../../../data/pricing/oracle/database';

const ENGINE_MAP: Record<string, { service: string; engine: NormalizedDbEngine }> = {
  MSSQL:        { service: 'OCI Base DB Service (SQL Server BYOL)', engine: 'sqlserver' },
  'SQL Server': { service: 'OCI Base DB Service (SQL Server BYOL)', engine: 'sqlserver' },
  PostgreSQL:   { service: 'OCI Database with PostgreSQL',          engine: 'postgresql' },
  MySQL:        { service: 'OCI MySQL HeatWave',                    engine: 'mysql' },
  MariaDB:      { service: 'OCI MySQL HeatWave',                    engine: 'mysql' },
  Oracle:       { service: 'Oracle Autonomous Database',            engine: 'oracle' },
};

export const oracleDatabase: IDatabaseService = {
  catalog: ORACLE_DATABASE,

  mapEngine(sourceEngine: string) {
    return ENGINE_MAP[sourceEngine] ?? { service: 'Oracle Autonomous Database', engine: 'oracle' };
  },

  recommend(input: DbRecommendationInput): CloudDatabaseRecommendation {
    const { service } = this.mapEngine(input.engineType);
    return recommendDb(input, ORACLE_DATABASE, 'oracle', service, {
      // OCI Block Volume for DB ~$0.0255/GB/month + replication overhead.
      storagePerGBMonth: 0.0425,
    });
  },
};
