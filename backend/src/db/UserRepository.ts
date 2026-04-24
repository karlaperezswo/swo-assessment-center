import { DynamoRepository, getDynamoRepository } from './DynamoRepository';
import { keys } from './keys';
import type { Role } from '../../../shared/permissions';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  defaultRole?: Role;
  createdAt: string;
}

interface StoredUser extends UserProfile {
  pk: string;
  sk: 'PROFILE';
  type: 'USER';
  gsi1pk: string;
  gsi1sk: string;
}

export class UserRepository {
  constructor(private readonly repo: DynamoRepository = getDynamoRepository()) {}

  async upsert(user: UserProfile): Promise<void> {
    const { gsi1pk, gsi1sk } = keys.user.byEmail(user.email);
    const item: StoredUser = {
      ...user,
      type: 'USER',
      pk: keys.user.pk(user.userId),
      sk: 'PROFILE',
      gsi1pk,
      gsi1sk,
    };
    await this.repo.put(item);
  }

  async getById(userId: string): Promise<UserProfile | null> {
    const raw = await this.repo.get<StoredUser>(keys.user.pk(userId), 'PROFILE');
    if (!raw) return null;
    return this.strip(raw);
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const { gsi1pk } = keys.user.byEmail(email);
    const rows = await this.repo.queryByPk<StoredUser>(gsi1pk, 'PROFILE', {
      indexName: 'GSI1',
      limit: 1,
    });
    const row = rows.items[0];
    return row ? this.strip(row) : null;
  }

  private strip(raw: StoredUser): UserProfile {
    const { pk, sk, type, gsi1pk, gsi1sk, ...rest } = raw;
    void pk; void sk; void type; void gsi1pk; void gsi1sk;
    return rest;
  }
}
