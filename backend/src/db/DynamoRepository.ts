import {
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

export interface DynamoItemKeys {
  pk: string;
  sk: string;
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  ttl?: number;
}

export interface QueryOptions {
  indexName?: 'GSI1' | 'GSI2';
  limit?: number;
  scanIndexForward?: boolean;
  exclusiveStartKey?: Record<string, unknown>;
  filterExpression?: string;
  filterNames?: Record<string, string>;
  filterValues?: Record<string, unknown>;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
}

/**
 * Thin wrapper around DynamoDB DocumentClient for the single-table design.
 *
 * Keeps table-name injection, marshalling and a couple of convenience helpers
 * (query-by-pk, paginated full-pk scan) in one place so feature code stays
 * focused on business logic.
 */
export class DynamoRepository {
  private readonly doc: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    clientConfig: DynamoDBClientConfig = {}
  ) {
    const raw = new DynamoDBClient({
      region: clientConfig.region ?? process.env.AWS_REGION ?? 'us-east-1',
      ...clientConfig,
    });
    this.doc = DynamoDBDocumentClient.from(raw, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      },
    });
  }

  get client(): DynamoDBDocumentClient {
    return this.doc;
  }

  get table(): string {
    return this.tableName;
  }

  async put<T extends DynamoItemKeys>(item: T): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
  }

  async get<T>(pk: string, sk: string): Promise<T | null> {
    const result = await this.doc.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk, sk },
      })
    );
    return (result.Item as T) ?? null;
  }

  async delete(pk: string, sk: string): Promise<void> {
    await this.doc.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk, sk },
      })
    );
  }

  async update(input: Omit<UpdateCommandInput, 'TableName'>): Promise<void> {
    await this.doc.send(
      new UpdateCommand({ TableName: this.tableName, ...input })
    );
  }

  /**
   * Query by partition key, optionally scoped to a sort-key prefix or a GSI.
   */
  async queryByPk<T>(
    pk: string,
    skPrefix?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const input: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: options.indexName,
      Limit: options.limit,
      ScanIndexForward: options.scanIndexForward,
      ExclusiveStartKey: options.exclusiveStartKey,
      FilterExpression: options.filterExpression,
    };

    const pkAttr = options.indexName === 'GSI1'
      ? 'gsi1pk'
      : options.indexName === 'GSI2'
      ? 'gsi2pk'
      : 'pk';
    const skAttr = options.indexName === 'GSI1'
      ? 'gsi1sk'
      : options.indexName === 'GSI2'
      ? 'gsi2sk'
      : 'sk';

    const expressionNames: Record<string, string> = {
      '#pk': pkAttr,
      ...(options.filterNames ?? {}),
    };
    const expressionValues: Record<string, unknown> = {
      ':pk': pk,
      ...(options.filterValues ?? {}),
    };

    let keyExpr = '#pk = :pk';
    if (skPrefix !== undefined) {
      expressionNames['#sk'] = skAttr;
      expressionValues[':sk'] = skPrefix;
      keyExpr += ' AND begins_with(#sk, :sk)';
    }

    input.KeyConditionExpression = keyExpr;
    input.ExpressionAttributeNames = expressionNames;
    input.ExpressionAttributeValues = expressionValues;

    const result = await this.doc.send(new QueryCommand(input));
    return {
      items: (result.Items ?? []) as T[],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Exhaust pagination automatically. Use for small/medium result sets only.
   */
  async queryAll<T>(
    pk: string,
    skPrefix?: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const all: T[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const page = await this.queryByPk<T>(pk, skPrefix, {
        ...options,
        exclusiveStartKey: cursor,
      });
      all.push(...page.items);
      cursor = page.lastEvaluatedKey;
    } while (cursor);
    return all;
  }

  async batchWrite(items: DynamoItemKeys[]): Promise<void> {
    if (items.length === 0) return;
    // BatchWriteItem supports up to 25 items per call.
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await this.doc.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: chunk.map((Item) => ({
              PutRequest: { Item },
            })),
          },
        })
      );
    }
  }

  async transactWrite(
    input: Omit<TransactWriteCommandInput, 'TransactItems'> & {
      TransactItems: NonNullable<TransactWriteCommandInput['TransactItems']>;
    }
  ): Promise<void> {
    await this.doc.send(new TransactWriteCommand(input));
  }
}

let singleton: DynamoRepository | null = null;

export function getDynamoRepository(): DynamoRepository {
  if (singleton) return singleton;
  const tableName = process.env.SWO_TABLE_NAME;
  if (!tableName) {
    throw new Error(
      'SWO_TABLE_NAME env var is required when USE_DYNAMO_STORAGE=true'
    );
  }
  singleton = new DynamoRepository(tableName);
  return singleton;
}

export function __resetDynamoRepositoryForTests(): void {
  singleton = null;
}
