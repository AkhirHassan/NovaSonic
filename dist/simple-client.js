"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleNovaSonicClient = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
class SimpleNovaSonicClient {
    constructor() {
        this.activeSessions = new Map();
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: "us-east-1",
            credentials: (0, credential_providers_1.fromInstanceMetadata)()
        });
    }
    createStreamSession(sessionId) {
        const session = {
            id: sessionId,
            onEvent: (eventType, handler) => {
                console.log(`Event handler registered: ${eventType}`);
            },
            setupPromptStart: async () => {
                console.log('Prompt start setup');
            },
            setupSystemPrompt: async (config, prompt) => {
                console.log('System prompt setup:', prompt);
            },
            setupStartAudio: async () => {
                console.log('Audio start setup');
            },
            streamAudio: async (audioData) => {
                console.log('Audio streaming:', audioData.length, 'bytes');
            },
            endAudioContent: async () => {
                console.log('End audio content');
            },
            endPrompt: async () => {
                console.log('End prompt');
            },
            close: async () => {
                console.log('Session closed');
                this.activeSessions.delete(sessionId);
            }
        };
        this.activeSessions.set(sessionId, session);
        return session;
    }
    initiateSession(sessionId) {
        console.log('Session initiated:', sessionId);
    }
    getActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }
    getLastActivityTime(sessionId) {
        return Date.now();
    }
    isSessionActive(sessionId) {
        return this.activeSessions.has(sessionId);
    }
    forceCloseSession(sessionId) {
        this.activeSessions.delete(sessionId);
        console.log('Force closed session:', sessionId);
    }
    closeSession(sessionId) {
        this.activeSessions.delete(sessionId);
        console.log('Closed session:', sessionId);
    }
}
exports.SimpleNovaSonicClient = SimpleNovaSonicClient;
