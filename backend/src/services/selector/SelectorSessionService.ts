import { v4 as uuidv4 } from 'uuid';
import { SelectorSession } from '../../types/selector';

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
}
