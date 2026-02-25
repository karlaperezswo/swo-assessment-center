import { v4 as uuidv4 } from 'uuid';
import { SelectorSession, SessionSchema } from '../../types/selector';

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
}
