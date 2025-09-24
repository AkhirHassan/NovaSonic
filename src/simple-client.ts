import { fromInstanceMetadata } from "@aws-sdk/credential-providers";
import { NovaSonicBidirectionalStreamClient, StreamSession } from './client';

export class SimpleNovaSonicClient {
  private novaSonicClient: NovaSonicBidirectionalStreamClient;
  private activeSessions: Map<string, StreamSession> = new Map();
  private sessionLastActivity: Map<string, number> = new Map();

  constructor() {
    this.novaSonicClient = new NovaSonicBidirectionalStreamClient({
      clientConfig: {
        region: "us-east-1",
        credentials: fromInstanceMetadata()
      }
    });
  }

  createStreamSession(sessionId: string): StreamSession {
    const session = this.novaSonicClient.createStreamSession(sessionId);
    this.activeSessions.set(sessionId, session);
    this.updateSessionActivity(sessionId);
    return session;
  }

  initiateSession(sessionId: string) {
    this.updateSessionActivity(sessionId);
    console.log('Session initiated:', sessionId);
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  getLastActivityTime(sessionId: string): number {
    return this.sessionLastActivity.get(sessionId) || 0;
  }

  private updateSessionActivity(sessionId: string): void {
    this.sessionLastActivity.set(sessionId, Date.now());
  }

  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  async forceCloseSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        await session.close();
      } catch (error) {
        console.error('Error force closing session:', error);
      }
      this.activeSessions.delete(sessionId);
      this.sessionLastActivity.delete(sessionId);
    }
    console.log('Force closed session:', sessionId);
  }

  async closeSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      await session.close();
      this.activeSessions.delete(sessionId);
      this.sessionLastActivity.delete(sessionId);
    }
    console.log('Closed session:', sessionId);
  }
}