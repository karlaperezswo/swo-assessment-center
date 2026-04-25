import type { IDatabaseService, DbRecommendationInput } from '../../types';
import type {
  CloudDatabaseRecommendation,
  NormalizedDbEngine,
} from '../../../../../shared/types/cloud.types';
import { recommendDb } from '../../algorithms/dbSizing';
import { AZURE_DATABASE } from '../../../data/pricing/azure/database';

const ENGINE_MAP: Record<string, { service: string; engine: NormalizedDbEngine }> = {
  MSSQL:        { service: 'Azure SQL Database',                 engine: 'sqlserver' },
  'SQL Server': { service: 'Azure SQL Database',                 engine: 'sqlserver' },
  PostgreSQL:   { service: 'Azure DB for PostgreSQL Flex Server',engine: 'postgresql' },
  MySQL:        { service: 'Azure DB for MySQL Flex Server',     engine: 'mysql' },
  MariaDB:      { service: 'Azure DB for MySQL Flex Server',     engine: 'mariadb' },
  Oracle:       { service: 'Oracle DB on Azure (BYOL on VM)',    engine: 'oracle' },
};

export const azureDatabase: IDatabaseService = {
  catalog: AZURE_DATABASE,

  mapEngine(sourceEngine: string) {
    return ENGINE_MAP[sourceEngine] ?? { service: 'Azure SQL Database', engine: 'sqlserver' };
  },

  recommend(input: DbRecommendationInput): CloudDatabaseRecommendation {
    const { service } = this.mapEngine(input.engineType);
    return recommendDb(input, AZURE_DATABASE, 'azure', service, {
      // Azure SQL storage ~$0.115/GB/month + LRS replication.
      storagePerGBMonth: 0.115,
    });
  },
};
