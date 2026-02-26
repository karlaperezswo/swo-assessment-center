import { v4 as uuidv4 } from 'uuid';
import { SelectorSession, SessionSchema } from '../../types/selector';
import * as fs from 'fs/promises';
import * as path from 'path';

const USE_S3 = process.env.USE_S3 === 'true';
const S3_PREFIX = 'selector/sessions';
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'data', 'selector', 'sessions');

export class SelectorSessionService {
  static generateSessionId(): string {
    return uuidv4();
  }

  static createSession(clientName: string): SelectorSession {
    const now = new Date().toISOString();
    return {
      sessionId: this.generateSessionId(),
      clientName,
      answers: [],
      createdAt: now,
      updatedAt: now,
      completed: false,
    };
  }

  static updateAnswer(session: SelectorSession, questionId: string, answer: string): SelectorSession {
    const timestamp = new Date().toISOString();
    const existingIndex = session.answers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      session.answers[existingIndex] = { questionId, answer, timestamp };
    } else {
      session.answers.push({ questionId, answer, timestamp });
    }
    session.updatedAt = timestamp;
    return session;
  }

  static markCompleted(session: SelectorSession): SelectorSession {
    session.completed = true;
    session.updatedAt = new Date().toISOString();
    return session;
  }

  private static getSessionKey(clientName: string, sessionId: string): string {
    const sanitizedClient = clientName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    return `${sanitizedClient}/${sessionId}.json`;
  }

  static async saveSession(session: SelectorSession): Promise<void> {
    const validated = SessionSchema.parse(session);
    const key = this.getSessionKey(validated.clientName, validated.sessionId);
    const content = JSON.stringify(validated, null, 2);

    if (USE_S3) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'map-central-data',
        Key: `${S3_PREFIX}/${key}`,
        Body: content,
        ContentType: 'application/json',
      }));
    } else {
      const filePath = path.join(LOCAL_STORAGE_PATH, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }

  static async loadSession(clientName: string, sessionId: string): Promise<SelectorSession | null> {
    const key = this.getSessionKey(clientName, sessionId);
    try {
      let content: string;
      if (USE_S3) {
        const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        const response = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET || 'map-central-data',
          Key: `${S3_PREFIX}/${key}`,
        }));
        content = await response.Body!.transformToString();
      } else {
        const filePath = path.join(LOCAL_STORAGE_PATH, key);
        content = await fs.readFile(filePath, 'utf-8');
      }
      const session = JSON.parse(content);
      return SessionSchema.parse(session);
    } catch (error) {
      return null;
    }
  }

  static async listSessions(clientName: string, limit: number = 5): Promise<SelectorSession[]> {
    const sanitizedClient = clientName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const sessions: SelectorSession[] = [];
    try {
      if (USE_S3) {
        const { S3Client, ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        const listResponse = await s3Client.send(new ListObjectsV2Command({
          Bucket: process.env.S3_BUCKET || 'map-central-data',
          Prefix: `${S3_PREFIX}/${sanitizedClient}/`,
          MaxKeys: limit,
        }));
        if (listResponse.Contents) {
          for (const obj of listResponse.Contents) {
            const getResponse = await s3Client.send(new GetObjectCommand({
              Bucket: process.env.S3_BUCKET || 'map-central-data',
              Key: obj.Key!,
            }));
            const content = await getResponse.Body!.transformToString();
            const session = SessionSchema.parse(JSON.parse(content));
            sessions.push(session);
          }
        }
      } else {
        const clientDir = path.join(LOCAL_STORAGE_PATH, sanitizedClient);
        try {
          const files = await fs.readdir(clientDir);
          const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, limit);
          for (const file of jsonFiles) {
            const filePath = path.join(clientDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const session = SessionSchema.parse(JSON.parse(content));
            sessions.push(session);
          }
        } catch (error) {
          return [];
        }
      }
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return sessions;
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
  }

  static async deleteSession(clientName: string, sessionId: string): Promise<void> {
    const key = this.getSessionKey(clientName, sessionId);
    if (USE_S3) {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET || 'map-central-data',
        Key: `${S3_PREFIX}/${key}`,
      }));
    } else {
      const filePath = path.join(LOCAL_STORAGE_PATH, key);
      await fs.unlink(filePath);
    }
  }

  static async listAllSessions(limit: number = 5): Promise<SelectorSession[]> {
    const sessions: SelectorSession[] = [];
    try {
      if (USE_S3) {
        const { S3Client, ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        const prefix = S3_PREFIX + '/';
        const listResponse = await s3Client.send(new ListObjectsV2Command({
          Bucket: process.env.S3_BUCKET || 'map-central-data',
          Prefix: prefix,
        }));
        if (listResponse.Contents) {
          for (const obj of listResponse.Contents) {
            try {
              const getResponse = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.S3_BUCKET || 'map-central-data',
                Key: obj.Key!,
              }));
              const content = await getResponse.Body!.transformToString();
              const session = SessionSchema.parse(JSON.parse(content));
              sessions.push(session);
            } catch (error) {
              continue;
            }
          }
        }
      } else {
        const sessionsDir = LOCAL_STORAGE_PATH;
        try {
          const clientDirs = await fs.readdir(sessionsDir);
          for (const clientDir of clientDirs) {
            const clientPath = path.join(sessionsDir, clientDir);
            const stat = await fs.stat(clientPath);
            if (stat.isDirectory()) {
              const files = await fs.readdir(clientPath);
              const jsonFiles = files.filter(f => f.endsWith('.json'));
              for (const file of jsonFiles) {
                try {
                  const filePath = path.join(clientPath, file);
                  const content = await fs.readFile(filePath, 'utf-8');
                  const session = SessionSchema.parse(JSON.parse(content));
                  sessions.push(session);
                } catch (error) {
                  continue;
                }
              }
            }
          }
        } catch (error) {
          return [];
        }
      }
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return sessions.slice(0, limit);
    } catch (error) {
      console.error('Error listing all sessions:', error);
      return [];
    }
  }
}
