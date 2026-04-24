import { DynamoRepository, getDynamoRepository } from './DynamoRepository';
import { keys } from './keys';
import type { Role } from '../../../shared/permissions';

export interface Organization {
  orgId: string;
  name: string;
  plan?: string;
  createdAt: string;
}

export interface Membership {
  orgId: string;
  userId: string;
  role: Role;
  joinedAt: string;
}

interface StoredOrg extends Organization {
  pk: string;
  sk: 'META';
  type: 'ORG';
}

interface StoredMembership extends Membership {
  pk: string;
  sk: string;
  type: 'MEMBERSHIP';
  gsi1pk: string;
  gsi1sk: string;
}

/**
 * Tenancy repository. Organizations and memberships live under
 * `ORG#<orgId>` in the single table. Memberships are duplicated on GSI1
 * (partitioned by user) so a user's org lookups are O(1) without a scan.
 */
export class OrgRepository {
  constructor(private readonly repo: DynamoRepository = getDynamoRepository()) {}

  async createOrg(org: Organization): Promise<void> {
    const item: StoredOrg = {
      ...org,
      type: 'ORG',
      pk: keys.org.pk(org.orgId),
      sk: 'META',
    };
    await this.repo.put(item);
  }

  async getOrg(orgId: string): Promise<Organization | null> {
    const raw = await this.repo.get<StoredOrg>(keys.org.pk(orgId), 'META');
    if (!raw) return null;
    const { pk, sk, type, ...org } = raw;
    void pk; void sk; void type;
    return org;
  }

  async addMembership(m: Membership): Promise<void> {
    const membership: StoredMembership = {
      ...m,
      type: 'MEMBERSHIP',
      pk: keys.org.pk(m.orgId),
      sk: keys.org.membership(m.userId).sk,
      gsi1pk: keys.user.pk(m.userId),
      gsi1sk: `MEMBERSHIP#${m.orgId}`,
    };
    await this.repo.put(membership);
  }

  async listMemberships(orgId: string): Promise<Membership[]> {
    const rows = await this.repo.queryAll<StoredMembership>(
      keys.org.pk(orgId),
      'USER#'
    );
    return rows.map(({ pk, sk, type, gsi1pk, gsi1sk, ...m }) => {
      void pk; void sk; void type; void gsi1pk; void gsi1sk;
      return m;
    });
  }

  async getMembershipForUser(userId: string): Promise<Membership | null> {
    const rows = await this.repo.queryByPk<StoredMembership>(
      keys.user.pk(userId),
      'MEMBERSHIP#',
      { indexName: 'GSI1', limit: 1 }
    );
    const row = rows.items[0];
    if (!row) return null;
    const { pk, sk, type, gsi1pk, gsi1sk, ...m } = row;
    void pk; void sk; void type; void gsi1pk; void gsi1sk;
    return m;
  }
}
